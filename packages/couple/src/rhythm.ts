import type { Space } from "./types.js";
import { addDays, arDayDate, day, daysBetween, weekKey } from "./dates.js";
import { T, enCount, enDayDate, type Text } from "./text.js";

/**
 * الإيقاع — الأسابيع الجاية، ونبض العلاقة.
 *
 * هذا الملف يفعل الشيء الذي لا تفعله قوائم المهام: **يتنبّأ بالضغط قبل
 * وقوعه**. القائمة تخبرك بما تأخر؛ وهذا يخبرك أن الأسبوع بعد القادم فيه
 * أربعة مواعيد وثلاث مهام ومحطة — أي أنه سيمرّ سيئًا — وأن الأسبوع الذي
 * يليه فاضٍ، فاحجزوا فيه ليلة لأنفسكم من الآن.
 *
 * والتنبؤ حتمي بالكامل: مواعيد مكتوبة، ومواعيد نهائية مكتوبة، ومحطات
 * مكتوبة، مقسومة على سعة مقاسة من سرعتكم الحقيقية. لا نموذج ولا تخمين —
 * ولهذا يمكن الوثوق به، ويمكن تكذيبه.
 *
 * والنصف الثاني: **نبض العلاقة**. التجهيز يبتلع كل شيء، فيصير كل نشاطكم
 * فواتير ومقاسات وأسعار. النبض يقيس نسبة ما كان شخصيًا من نشاطكم، ويقول
 * حين تقترب من الصفر. هذا أهم رقم في المنصة كلها، وأقلها إلحاحًا في
 * الظاهر.
 */

export interface WeekLoad {
  /** إثنين الأسبوع — YYYY-MM-DD. */
  week: string;
  label: Text;
  /** 0..100 نسبةً إلى سعتكم المقاسة. */
  score: number;
  appointments: number;
  tasksDue: number;
  criticalDue: number;
  milestones: string[];
  /** ما يغلب على الأسبوع، بجملة — باللغتين. */
  note: Text;
}

export interface Forecast {
  weeks: WeekLoad[];
  peak: WeekLoad | null;
  /** أهدأ أسبوع قادم بلا محطة — مرشّح لليلة تخصكم. */
  calm: WeekLoad | null;
  /** المتأخر المحمول على كل الأسابيع. */
  backlog: number;
  /** سعة الأسبوع المقاسة (مهام مكافئة). */
  capacity: number;
}

const HORIZON = 8;

/**
 * السعة: ضعف سرعتكم الأسبوعية، وبحد أدنى ٣ — لأن سرعة صفر في أول أسبوعين
 * لا تعني أنكم عاجزون عن كل شيء.
 */
function capacityOf(velocity: number): number {
  return Math.max(3, velocity * 2);
}

export function forecast(space: Space, todayStr: string, velocity: number): Forecast {
  const capacity = capacityOf(velocity);
  const backlog = space.tasks.filter(
    (t) => t.status !== "done" && t.due !== undefined && t.due < todayStr).length;

  const weeks: WeekLoad[] = [];
  for (let i = 0; i < HORIZON; i++) {
    const start = weekKey(addDays(todayStr, i * 7));
    const end = addDays(start, 6);

    const appointments = space.appointments.filter(
      (a) => a.status === "planned" && day(a.at) >= start && day(a.at) <= end).length;
    const due = space.tasks.filter(
      (t) => t.status !== "done" && t.due !== undefined && t.due >= start && t.due <= end);
    const criticalDue = due.filter((t) => t.priority === 1).length;
    const milestones = space.milestones
      .filter((m) => !m.done && m.date >= start && m.date <= end)
      .map((m) => m.title);

    // المحطة تزن أربعة أضعاف المهمة: يوم المحطة لا يُنجَز فيه شيء آخر
    const load = appointments * 1.2 + due.length + criticalDue + milestones.length * 4
      + (i === 0 ? backlog : 0);
    const score = Math.round(Math.min(100, (load / capacity) * 100));

    weeks.push({
      week: start,
      // بلا اسم اليوم: كلها إثنين، فذكره في ثمانية صفوف حشو
      label: T(arDayDate(start).replace(/^\S+\s/, ""), enDayDate(start).replace(/^\S+\s/, "")),
      score,
      appointments,
      tasksDue: due.length,
      criticalDue,
      milestones,
      note: noteFor({ appointments, due: due.length, milestones, backlog: i === 0 ? backlog : 0 }),
    });
  }

  const ahead = weeks.slice(1);
  const peak = ahead.reduce<WeekLoad | null>(
    (best, w) => (best === null || w.score > best.score ? w : best), null);
  const calm = ahead
    .filter((w) => w.milestones.length === 0)
    .reduce<WeekLoad | null>((best, w) => (best === null || w.score < best.score ? w : best), null);

  return { weeks, peak: peak && peak.score >= 60 ? peak : null, calm, backlog, capacity };
}

function noteFor(w: { appointments: number; due: number; milestones: string[]; backlog: number }): Text {
  // المحطة تبتلع الأسبوع، فاسمها وحده أصدق من عدّ ما حولها
  if (w.milestones.length > 0) {
    const joined = w.milestones.join(" · ");
    return T(joined, joined);
  }
  const ar: string[] = [];
  const en: string[] = [];
  if (w.appointments > 0) { ar.push(`${w.appointments} ميعاد`); en.push(enCount(w.appointments, "appointment")); }
  if (w.due > 0) { ar.push(`${w.due} مهمة`); en.push(enCount(w.due, "task")); }
  if (w.backlog > 0) { ar.push(`${w.backlog} متأخرة`); en.push(`${w.backlog} overdue`); }
  return ar.length > 0 ? T(ar.join(" · "), en.join(" · ")) : T("فاضي", "clear");
}

/* ── نبض العلاقة ──────────────────────────────────── */

export interface Heartbeat {
  weeks: Array<{ week: string; care: number; logistics: number }>;
  /** نسبة الشخصي من نشاط آخر ٨ أسابيع. */
  careShare: number | null;
  /** أيام منذ آخر فعل شخصي (ذكرى · رسالة · حاجة عملتوها). */
  sinceCare: number | null;
  /** أطول فترة بين ذكريتين متتاليتين — بالأيام. */
  longestGap: number | null;
  verdict: "warm" | "busy" | "cold" | "unknown";
  line: Text;
}

export function heartbeat(space: Space, todayStr: string): Heartbeat {
  const since = addDays(todayStr, -55);

  const care: string[] = [
    ...space.memories.map((m) => m.date),
    ...space.notes.map((n) => day(n.at)),
    ...space.capsules.map((c) => day(c.createdAt)),
    ...space.wishes.flatMap((w) => (w.doneAt ? [day(w.doneAt)] : [])),
  ];
  const logistics: string[] = [
    ...space.items.flatMap((i) => (i.boughtAt ? [day(i.boughtAt)] : [])),
    ...space.expenses.map((e) => e.at),
    ...space.tasks.flatMap((t) => (t.doneAt ? [day(t.doneAt)] : [])),
    ...space.contributions.map((c) => c.at),
  ];

  const buckets = new Map<string, { care: number; logistics: number }>();
  for (let i = 7; i >= 0; i--) buckets.set(weekKey(addDays(todayStr, -i * 7)), { care: 0, logistics: 0 });
  const add = (dates: string[], field: "care" | "logistics") => {
    for (const d of dates) {
      if (d < since || d > todayStr) continue;
      const slot = buckets.get(weekKey(d));
      if (slot) slot[field] += 1;
    }
  };
  add(care, "care");
  add(logistics, "logistics");

  const weeks = [...buckets.entries()].map(([week, v]) => ({ week, ...v }));
  const careTotal = weeks.reduce((n, w) => n + w.care, 0);
  const logTotal = weeks.reduce((n, w) => n + w.logistics, 0);
  const careShare = careTotal + logTotal === 0
    ? null : Math.round((careTotal / (careTotal + logTotal)) * 100);

  const lastCare = care.length > 0 ? care.reduce((a, b) => (b > a ? b : a)) : null;
  const sinceCare = lastCare ? daysBetween(lastCare, todayStr) : null;

  const memoryDates = [...new Set(space.memories.map((m) => m.date))].sort();
  let longestGap: number | null = null;
  for (let i = 1; i < memoryDates.length; i++) {
    const a = memoryDates[i - 1], b = memoryDates[i];
    if (a === undefined || b === undefined) continue;
    const gap = daysBetween(a, b);
    if (longestGap === null || gap > longestGap) longestGap = gap;
  }

  const verdict: Heartbeat["verdict"] =
    careShare === null ? "unknown"
      : careShare >= 35 ? "warm"
        : careShare >= 15 ? "busy" : "cold";

  const line: Text =
    verdict === "unknown"
      ? T("لسه مفيش نشاط كفاية عشان يتقاس.", "Not enough activity yet to measure.")
      : verdict === "warm"
        ? T(`${careShare}٪ من نشاطكم الشهرين دول كان ليكم إنتوا، مش للتجهيز.`,
            `${careShare}% of the last two months was for the two of you, not the preparations.`)
        : verdict === "busy"
          ? T(`${careShare}٪ بس من نشاطكم كان شخصي — الباقي كله تجهيز.`,
              `Only ${careShare}% of your activity was personal — the rest was all preparation.`)
          : T(`${careShare}٪ بس من نشاطكم كان شخصي. التجهيز واخد المساحة كلها.`,
              `Only ${careShare}% of your activity was personal. The preparations have taken all the room.`);

  return { weeks, careShare, sinceCare, longestGap, verdict, line };
}
