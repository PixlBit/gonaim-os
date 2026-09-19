/**
 * لغتان في وقت واحد.
 *
 * كل نص **تولّده** المنصة (ملاحظة انتباه، سطر سجل، دليل محور، فرق بين
 * اثنين) يُكتب باللغتين معًا في نفس اللحظة ونفس السطر من الكود.
 *
 * والسبب ليس الترجمة — بل أن هذه مساحة **لاثنين**: واحد قد يقرأ بالعربية
 * والآخر بالإنجليزية، من نفس الحمولة وفي نفس الثانية. لو وُلِّد النص بلغة
 * القارئ على الخادم لاحتاج كل منهما نسخة مختلفة من التقرير، ولصار تبديل
 * اللغة رحلة إلى الشبكة.
 *
 * وميزة ثانية: النصان متجاوران في الكود. من يعدّل قاعدة يرى ترجمتها أمامه،
 * فلا يوجد "مفتاح بلا ترجمة" ولا قاموس يتأخر عن الكود — الأمر الذي يجعل
 * أنصاف الترجمات تظهر في الإنتاج بعد شهر.
 */

export type Lang = "ar" | "en";

/** نص بلغتين. حيثما ظهر هذا النوع، فالمكان يُقرأ بأي من اللغتين. */
export interface Text {
  ar: string;
  en: string;
}

export const LANGS: Lang[] = ["ar", "en"];

/** اختيار لغة من نص ثنائي. */
export function say(text: Text, lang: Lang): string {
  return text[lang];
}

/** بناء نص ثنائي — اختصار يجعل سطور القواعد تُقرأ. */
export function T(ar: string, en: string): Text {
  return { ar, en };
}

/** دمج نصوص ثنائية بفاصل واحد لكل لغة. */
export function join(parts: Array<Text | null | undefined>, sep = " · "): Text {
  const live = parts.filter((p): p is Text => Boolean(p));
  return {
    ar: live.map((p) => p.ar).join(sep),
    en: live.map((p) => p.en).join(sep),
  };
}

/** اتجاه الكتابة — تحتاجه الصفحة والحقول. */
export function dir(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

/* ── الإنجليزية: مدد وتواريخ ───────────────────────── */

const MONTHS_EN = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "10 April 2026" — نفس ترتيب العربية عمدًا، فالرقم أولًا يُقرأ في الحالتين. */
export function enDate(iso: string): string {
  const s = iso.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  if (!MONTHS_EN[m - 1]) return s;
  return `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

export function enDayDate(iso: string): string {
  const s = iso.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  if (!MONTHS_EN[m - 1]) return s;
  const w = WEEKDAYS_EN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
  return `${w} ${d} ${MONTHS_EN[m - 1]}`;
}

export function enTime(t: string): string {
  const hhmm = t.slice(11, 16);
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * "a year and 2 months" — نفس منطق `arSpan`: المدة الطويلة بالأيام لا تُقرأ.
 */
export function enSpan(days: number): string {
  const n = Math.abs(Math.trunc(days));
  if (n === 0) return "today";
  if (n === 1) return "a day";
  if (n < 14) return `${n} days`;
  if (n < 60) {
    const w = Math.round(n / 7);
    return `${w} weeks`;
  }
  const months = Math.round(n / 30.4);
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years === 1 ? "a year" : `${years} years`;
  if (rest === 0) return y;
  return `${y} and ${rest === 1 ? "a month" : `${rest} months`}`;
}

/** جمع إنجليزي بسيط: "1 task" · "3 tasks". */
export function enCount(n: number, one: string, many = `${one}s`): string {
  return `${n} ${Math.abs(n) === 1 ? one : many}`;
}
