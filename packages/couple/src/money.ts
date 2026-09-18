/**
 * عرض المبالغ.
 *
 * الفلوس هنا جنيه مصري بالأساس، والمبالغ كبيرة ومتكررة. رقم مثل `128500`
 * لا يُقرأ بسرعة، و`١٢٨٬٥٠٠` بأرقام هندية لا يتطابق مع ما يكتبه أي متجر.
 * فالأرقام لاتينية بفواصل، والمختصر للعناوين وحدها.
 */

/** "128,500" */
export function fmt(n: number): string {
  const v = Math.round(n);
  return v.toLocaleString("en-US");
}

/** "128,500 ج" — مع العملة. */
export function money(n: number, currency = "ج"): string {
  return `${fmt(n)} ${currency}`;
}

/** "128.5 ألف" · "1.2 مليون" — للأرقام الكبيرة في البطاقات الضيقة. */
export function short(n: number): string {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${trim(n / 1_000_000)} مليون`;
  if (v >= 10_000) return `${trim(n / 1000)} ألف`;
  return fmt(n);
}

function trim(x: number): string {
  const r = Math.round(x * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** نسبة مئوية محصورة بين 0 و100، بلا كسور. القسمة على صفر تعطي 0 لا NaN. */
export function pct(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
