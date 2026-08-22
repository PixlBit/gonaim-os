import { normalizeText } from "./normalize.js";

/** موضع النص الذي أنتج المعلومة. أساس بوابة "ربط المصدر" في ADR-0004. */
export interface Span { start: number; end: number; text: string }

export interface MoneyHint extends Span { amount: number; currency: string }
export interface DateHint  extends Span { iso: string; kind: "explicit" | "relative" | "day_only" }

export interface Prepass {
  normalized: string;
  money: MoneyHint[];
  dates: DateHint[];
}

const CURRENCY_WORDS: Record<string, string> = {
  "ريال": "SAR", "ريإل": "SAR", "﷼": "SAR", "sar": "SAR", "sr": "SAR",
  "جنيه": "EGP", "egp": "EGP",
  "دولار": "USD", "usd": "USD", "$": "USD",
  "يورو": "EUR", "eur": "EUR", "€": "EUR",
  "درهم": "AED", "aed": "AED",
};

const AR_MONTHS: Record<string, number> = {
  "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4, "مايو": 5,
  "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8, "سبتمبر": 9,
  "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
};

const EN_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/**
 * استخلاص حتمي لما يمكن استخلاصه بلا نموذج: المبالغ والتواريخ.
 *
 * الغرض ليس الاستغناء عن النموذج، بل إعطاؤه مرساة. النموذج يفهم النية
 * والعلاقات؛ الأرقام والتواريخ لا يصح أن تعتمد على احتمال.
 */
export function prepass(raw: string, today: string): Prepass {
  const normalized = normalizeText(raw);
  return {
    normalized,
    money: findMoney(normalized),
    dates: findDates(normalized, today),
  };
}

function findMoney(text: string): MoneyHint[] {
  const out: MoneyHint[] = [];
  // رقم متبوع أو مسبوق بعملة. الفاصلة الألفية مسموحة، والكسر بنقطة.
  const re = /(?:([$€])\s*)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d{1,2})?)\s*([A-Za-z]{2,3}|ريال|جنيه|دولار|يورو|درهم|﷼)?/g;
  for (const m of text.matchAll(re)) {
    const [full, symbol, digits, word] = m;
    const token = (symbol ?? word ?? "").toLowerCase();
    const currency = CURRENCY_WORDS[token];
    if (!currency) continue;              // رقم بلا عملة ليس مبلغًا
    const amount = Number((digits ?? "").replace(/,/g, ""));
    if (!Number.isFinite(amount)) continue;
    const start = m.index ?? 0;
    out.push({ start, end: start + full.length, text: full.trim(), amount, currency });
  }
  return out;
}

function findDates(text: string, today: string): DateHint[] {
  const out: DateHint[] = [];
  const [ty, tm] = today.split("-").map(Number) as [number, number, number];

  // 2026-08-27 أو 27/8/2026
  for (const m of text.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
    push(m, iso(+m[1]!, +m[2]!, +m[3]!), "explicit");
  }
  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    push(m, iso(+m[3]!, +m[2]!, +m[1]!), "explicit");
  }

  // "27 أغسطس" أو "27 aug"
  const monthNames = [...Object.keys(AR_MONTHS), ...Object.keys(EN_MONTHS)].join("|");
  const dm = new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\w*`, "gi");
  for (const m of text.matchAll(dm)) {
    const key = (m[2] ?? "").toLowerCase();
    const month = AR_MONTHS[m[2] ?? ""] ?? EN_MONTHS[key.slice(0, 3)];
    if (!month) continue;
    // بلا سنة: السنة الحالية، إلا لو الشهر مضى بفارق كبير — فالأرجح العام القادم
    const year = month < tm - 6 ? ty + 1 : ty;
    push(m, iso(year, month, +m[1]!), "explicit");
  }

  // "أول أغسطس" / "بداية أغسطس"
  const first = new RegExp(`(?:أول|بداية|من\\s+أول)\\s+(${Object.keys(AR_MONTHS).join("|")})`, "g");
  for (const m of text.matchAll(first)) {
    const month = AR_MONTHS[m[1] ?? ""];
    if (!month) continue;
    push(m, iso(month < tm - 6 ? ty + 1 : ty, month, 1), "explicit");
  }

  // "بيتجدد 27" — يوم بلا شهر. يُحل لأقرب حدوث قادم، ويُعلَّم day_only
  // حتى تعرف الواجهة أنه تخمين يحتاج تأكيدًا، لا حقيقة.
  for (const m of text.matchAll(/(?:يتجدد|بيتجدد|التجديد|renews?)\s+(?:يوم\s+|on\s+)?(\d{1,2})\b(?!\s*[-/])/gi)) {
    const day = +(m[1] ?? 0);
    if (day < 1 || day > 31) continue;
    const todayDay = Number(today.slice(8, 10));
    const month = day >= todayDay ? tm : tm + 1;
    const y = month > 12 ? ty + 1 : ty;
    push(m, iso(y, ((month - 1) % 12) + 1, day), "day_only");
  }

  function push(m: RegExpMatchArray, value: string, kind: DateHint["kind"]) {
    const start = m.index ?? 0;
    out.push({ start, end: start + m[0].length, text: m[0], iso: value, kind });
  }

  return out.sort((a, b) => a.start - b.start);
}
