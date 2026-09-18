/**
 * حساب التواريخ.
 *
 * كل شيء هنا يعمل على `YYYY-MM-DD` كنص، لا على `Date`. السبب واحد:
 * `new Date("2026-04-10")` يُفسَّر UTC، و`new Date(2026,3,10)` يُفسَّر محليًا،
 * والفرق بينهما يوم كامل عند منتصف الليل — وهذا العدّاد يُقرأ كل يوم.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // يرفض 2026-02-30: اليوم الناتج لا بد أن يساوي المكتوب
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

function utc(s: string): number {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** عدد الأيام من `a` إلى `b`. موجب يعني أن `b` في المستقبل. */
export function daysBetween(a: DateLike, b: DateLike): number {
  return Math.round((utc(day(b)) - utc(day(a))) / 86_400_000);
}

export type DateLike = string;

/** يقصّ الوقت من `YYYY-MM-DDTHH:mm` ويترك اليوم. */
export function day(s: DateLike): string {
  return s.slice(0, 10);
}

/** اليوم محليًا — لا UTC. من يستيقظ الساعة 1 صباحًا يرى تاريخ أمس بـUTC. */
export function today(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function addDays(d: string, n: number): string {
  return new Date(utc(day(d)) + n * 86_400_000).toISOString().slice(0, 10);
}

/** مفتاح الأسبوع (الإثنين بدايته) — للسرعة الأسبوعية في التحليلات. */
export function weekKey(d: DateLike): string {
  const t = utc(day(d));
  const dow = (new Date(t).getUTCDay() + 6) % 7; // الإثنين = 0
  return new Date(t - dow * 86_400_000).toISOString().slice(0, 10);
}

export function monthKey(d: DateLike): string {
  return day(d).slice(0, 7);
}

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** "10 أبريل 2026" — لا أرقام هندية ولا ترتيب إنجليزي. */
export function arDate(d: DateLike): string {
  const s = day(d);
  if (!isDate(s)) return s;
  const [y, m, dd] = s.split("-").map(Number) as [number, number, number];
  return `${dd} ${MONTHS[m - 1]} ${y}`;
}

/** "الجمعة 10 أبريل" — بلا سنة، للمواعيد القريبة. */
export function arDayDate(d: DateLike): string {
  const s = day(d);
  if (!isDate(s)) return s;
  const [y, m, dd] = s.split("-").map(Number) as [number, number, number];
  const w = WEEKDAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]!;
  return `${w} ${dd} ${MONTHS[m - 1]}`;
}

/** "7:30 م" — الوقت من `YYYY-MM-DDTHH:mm`. */
export function arTime(t: string): string {
  const hhmm = t.slice(11, 16);
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  const period = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * "بعد سنة وشهرين" — المدة الطويلة بالأيام لا تُقرأ.
 * فوق ٦٠ يومًا يتحول العدّاد إلى شهور، وفوق السنة إلى سنوات وشهور.
 */
export function arSpan(days: number): string {
  const n = Math.abs(Math.trunc(days));
  if (n === 0) return "النهارده";
  if (n === 1) return "يوم";
  if (n === 2) return "يومين";
  if (n < 14) return `${n} أيام`;
  if (n < 60) {
    const w = Math.round(n / 7);
    return w === 2 ? "أسبوعين" : `${w} أسابيع`;
  }
  const months = Math.round(n / 30.4);
  if (months < 12) return months === 2 ? "شهرين" : `${months} شهور`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years === 1 ? "سنة" : years === 2 ? "سنتين" : `${years} سنين`;
  if (rest === 0) return y;
  return `${y} و${rest === 1 ? "شهر" : rest === 2 ? "شهرين" : `${rest} شهور`}`;
}
