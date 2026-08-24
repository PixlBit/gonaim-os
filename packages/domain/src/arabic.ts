/**
 * تمييز العدد في العربية.
 *
 * العربية تغيّر صيغة المعدود حسب العدد، لا حسب "مفرد/جمع" فقط. نص ثابت مثل
 * `${n} أيام` يخرج "1 أيام" و"20 أيام" — وكلاهما خطأ يجعل الواجهة تبدو
 * مترجمة آليًا. وهذه واجهة عربية أولًا، لا واجهة إنجليزية مُعرَّبة.
 *
 *   1        → يوم
 *   2        → يومان
 *   3–10     → أيام        (جمع قِلّة)
 *   11–99    → يومًا        (مفرد منصوب)
 *   100+     → يوم         (مفرد مجرور)
 *
 * القاعدة تنطبق على آخر خانتين: 103 تعامل كـ3، و112 تعامل كـ12.
 */
export interface ArabicNoun {
  /** مفرد مرفوع — للعدد 1 */
  one: string;
  /** مثنى — للعدد 2 */
  two: string;
  /** جمع — للأعداد 3–10 */
  few: string;
  /** مفرد منصوب — للأعداد 11–99 */
  many: string;
}

export const DAY: ArabicNoun   = { one: "يوم",   two: "يومان",   few: "أيام",   many: "يومًا" };
export const MONTH: ArabicNoun = { one: "شهر",   two: "شهران",   few: "أشهر",   many: "شهرًا" };
export const TIME: ArabicNoun  = { one: "مرة",   two: "مرتان",   few: "مرات",   many: "مرة" };
export const ITEM: ArabicNoun  = { one: "عنصر",  two: "عنصران",  few: "عناصر",  many: "عنصرًا" };
export const SIGNAL: ArabicNoun= { one: "إشارة", two: "إشارتان", few: "إشارات", many: "إشارة" };
export const STORE: ArabicNoun = { one: "متجر",  two: "متجران",  few: "متاجر",  many: "متجرًا" };
export const RECORD: ArabicNoun= { one: "سجل",   two: "سجلان",   few: "سجلات",  many: "سجلًا" };
export const FILE: ArabicNoun  = { one: "ملف",   two: "ملفان",   few: "ملفات",  many: "ملفًا" };

/**
 * يعيد العدد مع معدوده بالصيغة الصحيحة.
 * `count(1, DAY)` → "يوم" · `count(3, DAY)` → "3 أيام" · `count(20, DAY)` → "20 يومًا"
 *
 * العددان 1 و2 يُكتبان بلا رقم: "يوم" لا "1 يوم" — لأن الصيغة نفسها تدل عليه.
 */
export function count(n: number, noun: ArabicNoun): string {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 0) return `لا ${noun.few}`;
  if (abs === 1) return noun.one;
  if (abs === 2) return noun.two;
  const lastTwo = abs % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${abs} ${noun.few}`;
  if (lastTwo === 0 || lastTwo === 1 || lastTwo === 2) return `${abs} ${noun.one}`;
  return `${abs} ${noun.many}`;
}

/** مثل `count` لكن مع حرف جر: "بعد 3 أيام" · "بعد يومين". */
export function inDays(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 0) return "اليوم";
  if (abs === 1) return "غدًا";
  if (abs === 2) return "بعد يومين";
  return `بعد ${count(abs, DAY)}`;
}

/** "مر يوم" · "مر يومان" · "مرت 3 أيام" · "مر 20 يومًا" — الفعل يتبع المعدود. */
export function elapsed(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const lastTwo = abs % 100;
  const plural = lastTwo >= 3 && lastTwo <= 10;
  return `${plural ? "مرت" : "مر"} ${count(abs, DAY)}`;
}
