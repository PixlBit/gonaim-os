/**
 * التنقيح — Redaction.
 *
 * Source: docs/security/data-sensitivity-map.md §3
 *
 * القاعدة الحاكمة: **لا يُبطَّل بإعداد مستخدم.** ما يُنقَّح لا يصل إلى النموذج
 * أصلًا، فلا يوجد مفتاح "أرسله كما هو". هذا ليس تفضيلًا؛ هو حد المنتج.
 *
 * يُطبَّق مرتين (ADR-0006): في العميل قبل الإرسال، وفي الخادم قبل نداء
 * النموذج. الطبقة الأولى وحدها لا تكفي — عميل مخترق أو نسخة قديمة تتجاوزها.
 */

export type RedactionKind =
  | "secret" | "card" | "iban" | "national_id"
  | "phone" | "email" | "jwt";

export interface Redaction {
  kind: RedactionKind;
  /** موضع البديل في النص الناتج، لا في الأصل. */
  start: number;
  end: number;
  placeholder: string;
}

export interface RedactResult {
  text: string;
  redactions: Redaction[];
}

interface Rule {
  kind: RedactionKind;
  re: RegExp;
  /** فحص إضافي — للأنماط التي تتشابه مع أرقام عادية. */
  verify?: (match: string) => boolean;
  /** بعض الأنواع تُبقي طرفًا للسياق دون كشف القيمة. */
  render?: (match: string) => string;
}

const RULES: Rule[] = [
  // مفاتيح المزوّدين — أول ما يجب أن يختفي
  { kind: "secret", re: /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g },

  // JWT: ثلاثة مقاطع base64url. يُفحص أن الرأس يفك فعلًا إلى JSON.
  { kind: "jwt", re: /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/g,
    verify: isJwt },

  { kind: "iban", re: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, verify: isIban },

  // بطاقات: 13–19 رقمًا بفواصل اختيارية، ويجب أن تجتاز Luhn.
  // بلا Luhn سيُنقَّح كل رقم طويل — ومنها مبالغ ومعرّفات مشروعة.
  { kind: "card", re: /\b(?:\d[ -]?){13,19}\b/g, verify: isLuhn,
    render: (m) => `[REDACTED_CARD_${m.replace(/\D/g, "").slice(-4)}]` },

  // هوية/إقامة سعودية: 10 أرقام تبدأ بـ1 أو 2
  { kind: "national_id", re: /\b[12]\d{9}\b/g },

  { kind: "phone", re: /(?:\+|00)\d{6,15}\b|\b0\d{8,12}\b/g,
    // يُبقى آخر رقمين ليعرف المالك أي رقم يقصد النظام
    render: (m) => `[REDACTED_PHONE_…${m.slice(-2)}]` },

  { kind: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    render: (m) => `[PERSON_${stableHash(m.toLowerCase())}]` },
];

export function redact(input: string): RedactResult {
  const found: { start: number; end: number; kind: RedactionKind; placeholder: string }[] = [];

  for (const rule of RULES) {
    for (const m of input.matchAll(rule.re)) {
      const text = m[0];
      if (rule.verify && !rule.verify(text)) continue;
      const start = m.index ?? 0;
      // نمط أطول يفوز على نمط داخله — كي لا يُنقَّح جزء من IBAN كرقم بطاقة
      if (found.some((f) => start < f.end && start + text.length > f.start)) continue;
      found.push({
        start, end: start + text.length, kind: rule.kind,
        placeholder: rule.render ? rule.render(text) : `[REDACTED_${rule.kind.toUpperCase()}]`,
      });
    }
  }

  found.sort((a, b) => a.start - b.start);

  let out = "";
  let cursor = 0;
  const redactions: Redaction[] = [];
  for (const f of found) {
    if (f.start < cursor) continue;
    out += input.slice(cursor, f.start);
    redactions.push({ kind: f.kind, start: out.length, end: out.length + f.placeholder.length, placeholder: f.placeholder });
    out += f.placeholder;
    cursor = f.end;
  }
  out += input.slice(cursor);

  return { text: out, redactions };
}

/** هل بقي في النص ما كان يجب تنقيحه؟ يُستخدم كتأكيد في الطبقة الثانية. */
export function assertClean(text: string): void {
  const { redactions } = redact(text);
  if (redactions.length > 0) {
    const kinds = [...new Set(redactions.map((r) => r.kind))].join(", ");
    throw new Error(`redaction_failed: نص غير منقّح وصل إلى حد خارجي (${kinds})`);
  }
}

// ── فحوص ──────────────────────────────────────────────

function isLuhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function isIban(raw: string): boolean {
  const s = raw.toUpperCase();
  if (s.length < 15 || s.length > 34) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const value = code >= 65 ? String(code - 55) : ch;
    for (const d of value) remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}

function isJwt(raw: string): boolean {
  const header = raw.split(".")[0];
  if (!header) return false;
  try {
    const json = JSON.parse(Buffer.from(header, "base64url").toString("utf8")) as unknown;
    return typeof json === "object" && json !== null && "alg" in json;
  } catch { return false; }
}

/** ثابت عبر الجلسات: نفس الشخص يحمل نفس الرمز، فتبقى العلاقات مفهومة. */
function stableHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).slice(0, 6);
}
