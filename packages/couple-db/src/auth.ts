import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { T, type PersonKey, type Text } from "@gonaim/couple";
import type { Account, Session, Vault } from "./vault.js";

const scrypt = promisify(scryptCb) as (
  pw: string | Buffer, salt: string | Buffer, len: number,
  opts: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * الدخول.
 *
 * حسابان اثنان، لا تسجيل ولا استعادة بالبريد ولا "نسيت كلمة السر" — لأن
 * كل باب إضافي هو باب للغرباء. تغيير كلمة السر يحتاج القديمة، وضياعها
 * يُحَل من سطر الأوامر على الخادم (`npm run ehna:setup`). هذا مقصود:
 * المساحة لاثنين، وحارسها هو من يملك الخادم.
 *
 * كلمة السر لا تُخزَّن. يُخزَّن ناتج scrypt — بطيء عمدًا — بملح لكل حساب.
 */

/**
 * معاملات scrypt. 2^15 تكلّف ~100ms و32MB على جهاز عادي: محتملة لمرة
 * واحدة عند الدخول، وقاتلة لمن يجرّب ملايين الاحتمالات.
 *
 * `maxmem` سقف حماية في Node قيمته الافتراضية 32MB بالضبط — أي أن الإعداد
 * أعلاه يفشل بدونه برسالة لا تشرح نفسها. يُرفع لضعف ما تحتاجه المعاملات.
 */
const N = 32768, R = 8, P = 1, KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;
const PARAMS = { N, r: R, p: P, maxmem: MAXMEM };

export const MIN_PASSWORD = 10;
/** بعد خمس محاولات فاشلة: ربع ساعة قفل. التخمين يحتاج وقتًا لا يملكه أحد. */
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const SESSION_DAYS = 45;

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(password, salt, KEYLEN, PARAMS);
  return { hash: buf.toString("hex"), salt };
}

export async function checkPassword(password: string, account: Account): Promise<boolean> {
  const buf = await scrypt(password, account.salt, KEYLEN, PARAMS);
  const known = Buffer.from(account.hash, "hex");
  if (known.length !== buf.length) return false;
  return timingSafeEqual(buf, known);
}

export function passwordProblem(password: string): Text | null {
  if (password.length < MIN_PASSWORD) {
    return T(`كلمة السر لازم تكون ${MIN_PASSWORD} حروف على الأقل.`,
             `A password needs at least ${MIN_PASSWORD} characters.`);
  }
  if (/^\d+$/.test(password)) {
    return T("أرقام بس سهلة التخمين — زوّد حروف.", "Digits alone are easy to guess — add letters.");
  }
  return null;
}

export type LoginResult =
  | { ok: true; session: Session; vault: Vault }
  | { ok: false; reason: "unknown" | "locked" | "wrong"; retryAfterMin?: number };

/**
 * محاولة دخول واحدة.
 *
 * تُعيد المخزَن بعد التعديل (عدّاد الفشل أو الجلسة الجديدة) — الكتابة
 * مسؤولية المنادي، فتبقى هذه الدالة نقية وقابلة للاختبار بلا قاعدة.
 */
export async function login(
  vault: Vault, handle: string, password: string,
  opts: { now: Date; agent?: string },
): Promise<LoginResult> {
  const h = handle.trim().toLowerCase();
  const account = vault.accounts.find((a) => a.handle === h);
  // حساب غير موجود يكلّف نفس زمن الحساب الموجود — وإلا كُشفت المعرّفات بالتوقيت
  if (!account) {
    await scrypt(password, "absent-account-salt", KEYLEN, PARAMS);
    return { ok: false, reason: "unknown" };
  }

  if (account.lockedUntil && account.lockedUntil > opts.now.toISOString()) {
    const min = Math.ceil((Date.parse(account.lockedUntil) - opts.now.getTime()) / 60000);
    return { ok: false, reason: "locked", retryAfterMin: min };
  }

  const good = await checkPassword(password, account);
  if (!good) {
    const failed = account.failed + 1;
    const locked = failed >= MAX_FAILED;
    const updated: Account = {
      ...account,
      failed: locked ? 0 : failed,
      ...(locked
        ? { lockedUntil: new Date(opts.now.getTime() + LOCK_MINUTES * 60000).toISOString() }
        : {}),
    };
    vault.accounts = vault.accounts.map((a) => (a.key === account.key ? updated : a));
    return locked
      ? { ok: false, reason: "locked", retryAfterMin: LOCK_MINUTES }
      : { ok: false, reason: "wrong" };
  }

  const { lockedUntil: _gone, ...clean } = account;
  vault.accounts = vault.accounts.map((a) =>
    a.key === account.key ? { ...clean, failed: 0 } : a);

  const session = newSession(account.key, opts.now, opts.agent);
  // الجلسات المنتهية تُنظَّف عند كل دخول — لا وظيفة دورية لأجل قائمة صغيرة
  vault.sessions = [
    ...vault.sessions.filter((s) => s.expiresAt > opts.now.toISOString()),
    session,
  ];
  return { ok: true, session, vault };
}

export function newSession(key: PersonKey, now: Date, agent?: string): Session {
  return {
    id: randomBytes(24).toString("base64url"),
    key,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString(),
    ...(agent === undefined ? {} : { agent }),
  };
}

/**
 * التوكن = معرّف الجلسة + توقيع.
 *
 * التوقيع يجعل الكوكي غير قابل للتخمين حتى لو عُرف طول المعرّف، ويجعل
 * التحقق ممكنًا قبل لمس المخزَن — طلب بتوكن مزوّر لا يصل إلى القرص أصلًا.
 */
export function signToken(sessionId: string, secret: string): string {
  return `${sessionId}.${mac(sessionId, secret)}`;
}

export function readToken(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = mac(id, secret);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? id : null;
}

function mac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** الجلسة الصالحة فقط، مع تحديث آخر ظهور. */
export function touchSession(vault: Vault, sessionId: string, now: Date): Session | null {
  const s = vault.sessions.find((x) => x.id === sessionId);
  if (!s || s.expiresAt <= now.toISOString()) return null;
  const at = now.toISOString();
  // التحديث كل ساعة على الأكثر — كل طلب كتابة على القرص إسراف
  if (Date.parse(at) - Date.parse(s.lastSeenAt) > 3_600_000) {
    vault.sessions = vault.sessions.map((x) => (x.id === s.id ? { ...x, lastSeenAt: at } : x));
    return { ...s, lastSeenAt: at };
  }
  return s;
}
