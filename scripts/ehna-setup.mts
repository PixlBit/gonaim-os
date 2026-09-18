#!/usr/bin/env node
/**
 * تجهيز مساحة إحنا — يُشغَّل مرة واحدة.
 *
 * ينشئ حسابين اثنين لا أكثر، ويولّد سر توقيع الجلسات في `.env`، ويكتب
 * المخزَن الأول. لا يوجد تسجيل من الواجهة أصلًا، فهذا السطر هو الباب
 * الوحيد لإنشاء حساب — ومن يملك الخادم هو من يفتحه.
 *
 *   npm run ehna:setup                    إنشاء المساحة
 *   npm run ehna:setup -- --bare          بلا كشف التجهيز الافتراضي
 *   npm run ehna:setup -- --password her  تغيير كلمة سر حساب
 *   npm run ehna:setup -- --status        ماذا يوجد الآن
 *
 * بلا طرفية تفاعلية (نشر مؤتمت) يقرأ القيم من البيئة:
 * `EHNA_HIM_NAME` · `EHNA_HIM_HANDLE` · `EHNA_HIM_PASSWORD` ونظائرها لـHER.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { loadEnv } from "./env.mts";
import { seedSpace, SEED_COUNTS } from "../packages/couple/src/seed.js";
import { hashPassword, passwordProblem } from "../packages/couple-db/src/auth.js";
import { openStore } from "../packages/couple-db/src/open.js";
import type { Account, Vault } from "../packages/couple-db/src/vault.js";
import type { PersonKey } from "../packages/couple/src/types.js";

loadEnv();

const argv = process.argv.slice(2);
const has = (flag: string) => argv.includes(flag);
const valueOf = (flag: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

const ok = (m: string) => console.log(`  ✓ ${m}`);
const info = (m: string) => console.log(`    ${m}`);
// النوع مكتوب على المتغير لا على الدالة: بدونه لا يعتبر TS النداء منهيًا
// للمسار، فيطالب بفحص null بعد سطر يوقف البرنامج أصلًا.
const die: (m: string) => never = (m) => { console.error(`\n  ✗ ${m}\n`); process.exit(1); };

const interactive = process.stdin.isTTY === true && !has("--env");
let muted = false;
const out = new Writable({
  write(chunk: Buffer, _enc, cb) { if (!muted) process.stdout.write(chunk); cb(); },
});
const rl = interactive
  ? createInterface({ input: process.stdin, output: out, terminal: true })
  : null;

async function ask(question: string, fallbackEnv: string, fallback?: string): Promise<string> {
  const fromEnv = process.env[fallbackEnv];
  if (!rl) {
    if (fromEnv) return fromEnv;
    if (fallback !== undefined) return fallback;
    return die(`${fallbackEnv} مطلوب (لا توجد طرفية تفاعلية).`);
  }
  const shown = fallback ? ` [${fallback}]` : "";
  const answer = (await rl.question(`  ${question}${shown}: `)).trim();
  return answer || fromEnv || fallback || ask(question, fallbackEnv, fallback);
}

async function askSecret(question: string, fallbackEnv: string): Promise<string> {
  const fromEnv = process.env[fallbackEnv];
  if (!rl) {
    if (fromEnv) return fromEnv;
    return die(`${fallbackEnv} مطلوب (لا توجد طرفية تفاعلية).`);
  }
  process.stdout.write(`  ${question}: `);
  muted = true;
  const answer = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  return answer;
}

/** كلمة السر تُكتب مرتين وتُفحص — الخطأ المطبعي هنا يقفل الباب على صاحبه. */
async function newPassword(label: string, env: string): Promise<string> {
  for (;;) {
    const first = await askSecret(`كلمة سر ${label}`, env);
    const problem = passwordProblem(first);
    if (problem) { console.log(`    ${problem}`); if (!rl) process.exit(1); continue; }
    if (!rl) return first;
    const again = await askSecret("تأكيدها", env);
    if (first !== again) { console.log("    مش زي بعض. تاني."); continue; }
    return first;
  }
}

function ensureSecret(): string {
  const existing = process.env["EHNA_SECRET"];
  if (existing && existing.length >= 32) return existing;

  const secret = randomBytes(32).toString("base64url");
  const line = `EHNA_SECRET=${secret}\n`;
  if (!existsSync(".env")) writeFileSync(".env", `# EHNA//OS\n${line}`, { mode: 0o600 });
  else {
    const body = readFileSync(".env", "utf8");
    if (/^EHNA_SECRET=.*$/m.test(body)) {
      writeFileSync(".env", body.replace(/^EHNA_SECRET=.*$/m, line.trim()));
    } else {
      appendFileSync(".env", `${body.endsWith("\n") ? "" : "\n"}${line}`);
    }
  }
  process.env["EHNA_SECRET"] = secret;
  ok("سر الجلسات اتولّد واتكتب في .env");
  return secret;
}

const store = openStore();

async function currentVault(): Promise<Vault | null> {
  try { return await store.read(); } catch { return null; }
}

try {
  const existing = await currentVault();

  if (has("--status")) {
    if (!existing) { console.log("\n  المساحة لسه مش متعملة.\n"); process.exit(0); }
    console.log(`\n  ${store.describe()}`);
    info(`نسخة المخزَن: ${existing.rev} · نسخة المساحة: ${existing.space.version}`);
    for (const a of existing.accounts) {
      info(`${a.key === "him" ? "هو" : "هي"}: ${existing.space.people[a.key].name} (${a.handle})`);
    }
    info(`جلسات مفتوحة: ${existing.sessions.length}`);
    info(`عناصر: ${existing.space.items.length} · مهام: ${existing.space.tasks.length} · ذكريات: ${existing.space.memories.length}`);
    console.log("");
    process.exit(0);
  }

  const which = valueOf("--password");
  if (which) {
    if (!existing) die("مفيش مساحة. شغّل الإعداد الأول.");
    const key = (which === "him" || which === "her" ? which : null) as PersonKey | null;
    const account = existing?.accounts.find((a) => a.key === key || a.handle === which);
    if (!account || !existing) die(`مفيش حساب اسمه "${which}". استعمل him أو her أو المعرّف.`);
    const password = await newPassword(account.handle, "EHNA_NEW_PASSWORD");
    const fresh = await hashPassword(password);
    existing.accounts = existing.accounts.map((a) =>
      a.key === account.key ? { ...a, ...fresh, failed: 0, updatedAt: new Date().toISOString() } : a);
    // تغيير كلمة السر يطرد جلسات صاحبها — وإلا فالتغيير لا يحمي من شيء
    const before = existing.sessions.length;
    existing.sessions = existing.sessions.filter((s) => s.key !== account.key);
    await store.replace(existing);
    ok(`كلمة سر ${account.handle} اتغيّرت`);
    if (before !== existing.sessions.length) info(`واتقفلت ${before - existing.sessions.length} جلسة`);
    console.log("");
    process.exit(0);
  }

  if (existing) {
    console.log("\n  المساحة موجودة بالفعل — مش هيتكتب فوقها.");
    info("لتغيير كلمة سر:  npm run ehna:setup -- --password her");
    info("للحالة:          npm run ehna:setup -- --status");
    console.log("");
    process.exit(0);
  }

  console.log("\n  مساحة إحنا — حسابين بس.\n");

  const himName = await ask("اسمه", "EHNA_HIM_NAME", "غنيم");
  const himHandle = normalize(await ask("معرّف دخوله", "EHNA_HIM_HANDLE", "gonaim"));
  const himPass = await newPassword(himName, "EHNA_HIM_PASSWORD");

  const herName = await ask("اسمها", "EHNA_HER_NAME");
  const herHandle = normalize(await ask("معرّف دخولها", "EHNA_HER_HANDLE"));
  const herPass = await newPassword(herName, "EHNA_HER_PASSWORD");

  if (himHandle === herHandle) die("المعرّفان لازم يكونا مختلفين.");

  const title = await ask("اسم المساحة", "EHNA_TITLE", "إحنا");
  const currency = await ask("العملة", "EHNA_CURRENCY", "ج");

  ensureSecret();

  const now = new Date();
  const at = now.toISOString();
  const account = async (key: PersonKey, handle: string, password: string): Promise<Account> => ({
    key, handle, ...(await hashPassword(password)),
    failed: 0, createdAt: at, updatedAt: at,
  });

  const vault: Vault = {
    rev: 0,
    space: seedSpace({
      him: { name: himName, handle: himHandle },
      her: { name: herName, handle: herHandle },
      title, currency, now, bare: has("--bare"),
    }),
    accounts: [
      await account("him", himHandle, himPass),
      await account("her", herHandle, herPass),
    ],
    sessions: [],
  };

  await store.create(vault);
  ok(`المساحة اتعملت — ${store.describe()}`);
  if (!has("--bare")) {
    info(`كشف التجهيز: ${SEED_COUNTS.rooms} غرف · ${SEED_COUNTS.items} عنصر · ${SEED_COUNTS.tasks} مهمة`);
    info("بلا أسعار مخترعة — الأسعار تتكتب من السوق.");
  }

  console.log("\n  الخطوة اللي بعدها:\n");
  info("npm run ehna         الخادم");
  info("npm run ehna:web     الواجهة → http://localhost:5174");
  console.log("");
} finally {
  rl?.close();
  await store.close();
}

function normalize(handle: string): string {
  const clean = handle.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  if (clean.length < 2) die(`المعرّف "${handle}" مش صالح — حروف لاتينية وأرقام.`);
  return clean;
}
