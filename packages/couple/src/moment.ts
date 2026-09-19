import type { PersonKey, Space } from "./types.js";
import { arDate, daysBetween } from "./dates.js";
import { T, enDate, enSpan, type Text } from "./text.js";
import { arSpan } from "./dates.js";

/**
 * اللحظة — ما يخصّ اليوم وحده.
 *
 * فيه شيئان صغيران، وأثرهما أكبر من حجمهما في الكود:
 *
 * **التحية**، لأن المنصة تُفتح في الصباح وفي آخر الليل، ومن يفتحها اسمه
 * معروف. جملة تناديه باسمه تحوّل لوحة أرقام إلى مكان له صاحب. وهي صادقة:
 * تُبنى من ساعة جهازه لا من تخمين.
 *
 * **«في مثل النهارده»**، وهو الأهم. الذكريات في المنصات الأخرى أرشيف
 * يُفتَح بالقصد — أي لا يُفتح. وهنا الأرشيف هو الذي يفتح نفسه: يوم ٧
 * فبراير تقول الشاشة إن في مثله قبل سنتين كانت «أول قعدة». لم يكتب أحد
 * تذكيرًا، ولم يضبط أحد تنبيهًا؛ التاريخ وحده كافٍ.
 *
 * وهذا ما يجعل المنصة تكبر بدل أن تنتهي بالفرح: كل سنة تمرّ تزيد ما
 * يظهر في هذا السطر. المنصة التي تعدّ الأيام حتى الفرح تموت يوم الفرح؛
 * والتي تعدّ السنين بعده تعيش.
 */

export interface Greeting {
  text: Text;
  /** «فجر» «صبح» «ضهر» «مسا» «ليل» — تُستعمل في اللون والحركة إن أردنا. */
  part: "dawn" | "morning" | "noon" | "evening" | "night";
}

/**
 * الساعة تأتي من الواجهة لا من الخادم: الخادم قد يكون في منطقة زمنية
 * أخرى، ومن يفتح المنصة الساعة ١١ مساءً لا يليق أن تقول له «صباح الخير».
 */
export function greeting(space: Space, viewer: PersonKey, localHour: number): Greeting {
  const name = space.people[viewer].name;
  const h = Math.max(0, Math.min(23, Math.trunc(localHour)));

  if (h < 5)  return { part: "night",   text: T(`لسه صاحي يا ${name}؟`, `Still up, ${name}?`) };
  if (h < 12) return { part: "morning", text: T(`صباح الخير يا ${name}`, `Good morning, ${name}`) };
  if (h < 16) return { part: "noon",    text: T(`نهارك سعيد يا ${name}`, `Good afternoon, ${name}`) };
  if (h < 22) return { part: "evening", text: T(`مساء الخير يا ${name}`, `Good evening, ${name}`) };
  return { part: "night", text: T(`تصبح على خير يا ${name}`, `Good night, ${name}`) };
}

export interface OnThisDay {
  /** معرّف الذكرى — للفتح بضغطة. */
  id: string;
  title: string;
  date: string;
  /** سنوات كاملة مضت. ١ فأكثر دائمًا. */
  years: number;
  line: Text;
}

/**
 * ذكريات وقعت في مثل هذا اليوم من سنة ماضية.
 *
 * المطابقة على الشهر واليوم، والسنة تُستثنى — وهذا كل «الخوارزمية».
 * والفرق بين أن تُكتب وألا تُكتب هو الفرق بين أرشيف وذاكرة.
 */
export function onThisDay(space: Space, todayStr: string): OnThisDay[] {
  const md = todayStr.slice(5);            // MM-DD
  const year = Number(todayStr.slice(0, 4));

  return space.memories
    .filter((m) => m.date.slice(5) === md && Number(m.date.slice(0, 4)) < year)
    .map((m) => {
      const years = year - Number(m.date.slice(0, 4));
      return {
        id: m.id,
        title: m.title,
        date: m.date,
        years,
        line: T(
          `في مثل النهارده من ${arYears(years)}: ${m.title}`,
          `On this day ${years === 1 ? "a year" : `${years} years`} ago: ${m.title}`,
        ),
      };
    })
    .sort((a, b) => b.years - a.years);     // الأبعد أولًا — الأعمق أثرًا
}

function arYears(n: number): string {
  return n === 1 ? "سنة" : n === 2 ? "سنتين" : n <= 10 ? `${n} سنين` : `${n} سنة`;
}

/**
 * أقرب ذكرى سنوية جاية — لا تُعرَض إلا حين تقترب فعلًا.
 *
 * والعتبة أسبوع: ما هو أبعد ليس خبرًا اليوم، وعرضه يجعل السطر دائمًا
 * مملوءًا فيصير خلفية لا يقرأها أحد.
 */
export function nextAnniversary(
  space: Space, todayStr: string, withinDays = 7,
): { title: string; date: string; daysAway: number; years: number; line: Text } | null {
  const year = Number(todayStr.slice(0, 4));
  let best: { title: string; date: string; daysAway: number; years: number } | null = null;

  for (const m of space.memories) {
    const md = m.date.slice(5);
    if (md === "02-29") continue;              // ٢٩ فبراير لا يجيء كل سنة
    for (const y of [year, year + 1]) {
      const when = `${y}-${md}`;
      const away = daysBetween(todayStr, when);
      if (away <= 0 || away > withinDays) continue;
      const years = y - Number(m.date.slice(0, 4));
      if (years < 1) continue;
      if (!best || away < best.daysAway) best = { title: m.title, date: when, daysAway: away, years };
    }
  }

  if (!best) return null;
  return {
    ...best,
    line: T(
      `كمان ${arSpan(best.daysAway)} تبقى ${arYears(best.years)} على «${best.title}» — ${arDate(best.date)}.`,
      `In ${enSpan(best.daysAway)} it is ${best.years === 1 ? "a year" : `${best.years} years`} since “${best.title}” — ${enDate(best.date)}.`,
    ),
  };
}
