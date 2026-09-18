import type {
  Actor, Item, Milestone, PersonKey, Space, Task,
} from "./types.js";
import { addDays, arSpan, day, daysBetween, monthKey, weekKey } from "./dates.js";
import { pct } from "./money.js";

/**
 * التحليلات.
 *
 * كل رقم هنا يُحسب من المصدر عند الطلب — لا شيء مخزَّن. الحساب على مساحة
 * اثنين رخيص جدًا، وثمن التخزين أغلى بكثير: رقم محفوظ يصير كذبة عند أول
 * تعديل لم يمر بنفس الطريق.
 *
 * والقاعدة الثانية: **لا اختراع**. ما لا يوجد له سعر لا يُقدَّر بمتوسط
 * ولا يُملأ بصفر صامت — يُعَدّ ويُعرَض كنقص في المعرفة (`unpriced`). ميزانية
 * تبدو مكتملة وهي ناقصة أسوأ من ميزانية تقول إنها ناقصة.
 */

export type Level = "now" | "soon" | "watch";

export interface Attention {
  code: string;
  level: Level;
  title: string;
  why: string;
  move?: string;
  /** الشاشة التي تحلّ الملاحظة — الواجهة تحوّلها إلى زر. */
  screen?: string;
}

export interface MilestoneView extends Milestone {
  daysAway: number;
  /** "بعد 3 شهور" · "النهارده" · "فات" */
  when: string;
  past: boolean;
}

export interface Countdown {
  next?: MilestoneView;
  wedding?: MilestoneView;
  all: MilestoneView[];
  /** عدد الأيام منذ `settings.together` — "بقالنا قد إيه". */
  togetherDays?: number;
}

export interface RoomMoney {
  roomId: string;
  name: string;
  glyph: string;
  items: number;
  bought: number;
  spent: number;
  committed: number;
  unpriced: number;
  readiness: number;
}

export interface MoneyReport {
  currency: string;
  budget: number;
  /** ما دخل الصندوق فعلًا. */
  inPot: number;
  /** ما خرج فعلًا: عناصر مشتراة + مصاريف. */
  spent: number;
  /** ما تبقّى مخططًا له ولم يُدفع بعد (عناصر غير مشتراة لها سعر متوقع). */
  committed: number;
  /** المتوقع الكلي = المدفوع + المخطط. */
  projected: number;
  /** الميزانية ناقص المدفوع. سالب = تجاوز. */
  left: number;
  /** المتوقع ناقص الميزانية. موجب = العجز المتوقع. */
  gap: number;
  /** عناصر بلا أي سعر — مساحة العمى في الرقم كله. */
  unpriced: number;
  /** فرق ما دُفع عمّا خُطِّط له في العناصر المشتراة. موجب = زيادة. */
  drift: number;
  driftPct: number;
  weeklyBurn: number;
  runwayWeeks: number | null;
  byRoom: RoomMoney[];
  byCategory: Array<{ category: string; amount: number; count: number }>;
  byMonth: Array<{ month: string; amount: number }>;
  /** من دفع كام — المشترك يُحسب على الاثنين. */
  paid: Record<Actor, number>;
  contributed: Record<Actor, number>;
}

export interface NestReport {
  rooms: RoomMoney[];
  total: number;
  bought: number;
  ordered: number;
  chosen: number;
  needed: number;
  /** جاهزية موزونة بالأولوية — عنصر أساسي ليس كعنصر كمالي. */
  readiness: number;
  criticalMissing: Item[];
  hasAddress: boolean;
}

export interface MissionsReport {
  total: number;
  open: number;
  done: number;
  blocked: number;
  overdue: Task[];
  dueSoon: Task[];
  byOwner: Record<Actor, { open: number; done: number }>;
  byPhase: Array<{ phase: string; open: number; done: number }>;
  /** مهام مُنجزة في الأسبوع — متوسط آخر ٦ أسابيع. */
  velocity: number;
  /** متى تخلص المهام المفتوحة بهذه السرعة. `null` = السرعة صفر. */
  finishInWeeks: number | null;
  doneByWeek: Array<{ week: string; count: number }>;
}

export interface LifeReport {
  memories: number;
  lastMemoryDaysAgo: number | null;
  memoriesByMonth: Array<{ month: string; count: number }>;
  wishes: { someday: number; planned: number; done: number };
  notes: number;
  unreadForMe: number;
  capsulesSealed: number;
  capsuleReady: number;
  nextCapsule?: { id: string; openAt: string; daysAway: number };
  openDecisions: number;
  /** مواعيد الأيام السبعة القادمة. */
  upcoming: Array<{ id: string; title: string; at: string; daysAway: number; place?: string }>;
}

export interface Report {
  today: string;
  viewer: PersonKey;
  countdown: Countdown;
  money: MoneyReport;
  nest: NestReport;
  missions: MissionsReport;
  life: LifeReport;
  attention: Attention[];
}

/** وزن الأولوية في حساب الجاهزية: الأساسي ثلاثة أضعاف الكمالي. */
const WEIGHT: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
/** كم يقترب العنصر من "تمّ" في كل حالة. الطلب ليس شراءً، لكنه ليس لا شيء. */
const PROGRESS: Record<Item["status"], number> = {
  needed: 0, chosen: 0.35, ordered: 0.75, bought: 1,
};

function unitPrice(i: Item): number | null {
  const p = i.actualPrice ?? i.targetPrice;
  return p === undefined ? null : p;
}

function lineTotal(i: Item): number {
  const p = unitPrice(i);
  return p === null ? 0 : p * (i.qty || 1);
}

export function analyze(space: Space, todayStr: string, viewer: PersonKey): Report {
  const cur = space.settings.currency;

  /* ── العدّاد ─────────────────────────────────────── */
  const all: MilestoneView[] = space.milestones.map((m) => {
    const daysAway = daysBetween(todayStr, m.date);
    return {
      ...m, daysAway, past: daysAway < 0,
      when: daysAway === 0 ? "النهارده" : daysAway > 0 ? `بعد ${arSpan(daysAway)}` : `من ${arSpan(daysAway)}`,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const next = all.find((m) => !m.done && m.daysAway >= 0);
  const wedding = all.find((m) => m.kind === "wedding");
  const countdown: Countdown = {
    ...(next ? { next } : {}),
    ...(wedding ? { wedding } : {}),
    all,
    ...(space.settings.together
      ? { togetherDays: daysBetween(space.settings.together, todayStr) }
      : {}),
  };

  /* ── الفلوس ──────────────────────────────────────── */
  const boughtItems = space.items.filter((i) => i.status === "bought");
  const itemSpent = boughtItems.reduce((n, i) => n + lineTotal(i), 0);
  const expenseSpent = space.expenses.reduce((n, e) => n + e.amount, 0);
  const spent = itemSpent + expenseSpent;
  const committed = space.items
    .filter((i) => i.status !== "bought")
    .reduce((n, i) => n + lineTotal(i), 0);
  const unpriced = space.items.filter((i) => unitPrice(i) === null).length;
  const inPot = space.contributions.reduce((n, c) => n + c.amount, 0);

  // الانحراف يُقارن المدفوع بالمخطط — ولا يُحسب إلا لعنصر يحمل الرقمين
  const compared = boughtItems.flatMap((i) =>
    i.actualPrice !== undefined && i.targetPrice !== undefined
      ? [{ actual: i.actualPrice, target: i.targetPrice, qty: i.qty || 1 }]
      : []);
  const drift = compared.reduce((n, c) => n + (c.actual - c.target) * c.qty, 0);
  const plannedOfThose = compared.reduce((n, c) => n + c.target * c.qty, 0);

  // الإنفاق مؤرَّخ: العنصر بتاريخ شرائه، والمصروف بتاريخه
  const spendEvents: Array<{ at: string; amount: number }> = [
    ...boughtItems.flatMap((i) => (i.boughtAt ? [{ at: day(i.boughtAt), amount: lineTotal(i) }] : [])),
    ...space.expenses.map((e) => ({ at: e.at, amount: e.amount })),
  ];

  const since = addDays(todayStr, -56); // ٨ أسابيع
  const recent = spendEvents.filter((e) => e.at >= since && e.at <= todayStr);
  const weeklyBurn = recent.reduce((n, e) => n + e.amount, 0) / 8;
  const left = space.settings.budget - spent;
  const runwayWeeks = weeklyBurn > 0 ? Math.max(0, left / weeklyBurn) : null;

  const byMonthMap = new Map<string, number>();
  for (const e of spendEvents) byMonthMap.set(monthKey(e.at), (byMonthMap.get(monthKey(e.at)) ?? 0) + e.amount);
  const byMonth = [...byMonthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12).map(([month, amount]) => ({ month, amount }));

  const byCatMap = new Map<string, { amount: number; count: number }>();
  for (const e of space.expenses) {
    const c = byCatMap.get(e.category) ?? { amount: 0, count: 0 };
    byCatMap.set(e.category, { amount: c.amount + e.amount, count: c.count + 1 });
  }
  const byCategory = [...byCatMap.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount);

  const paid: Record<Actor, number> = { him: 0, her: 0, both: 0 };
  for (const i of boughtItems) if (i.paidBy) paid[i.paidBy] += lineTotal(i);
  for (const e of space.expenses) paid[e.paidBy] += e.amount;
  const contributed: Record<Actor, number> = { him: 0, her: 0, both: 0 };
  for (const c of space.contributions) contributed[c.who] += c.amount;

  /* ── الشقة ───────────────────────────────────────── */
  const byRoom: RoomMoney[] = space.rooms.map((r) => {
    const items = space.items.filter((i) => i.roomId === r.id);
    const bought = items.filter((i) => i.status === "bought");
    return {
      roomId: r.id, name: r.name, glyph: r.glyph,
      items: items.length,
      bought: bought.length,
      spent: bought.reduce((n, i) => n + lineTotal(i), 0),
      committed: items.filter((i) => i.status !== "bought").reduce((n, i) => n + lineTotal(i), 0),
      unpriced: items.filter((i) => unitPrice(i) === null).length,
      readiness: readiness(items),
    };
  }).sort((a, b) => a.readiness - b.readiness);

  const money: MoneyReport = {
    currency: cur,
    budget: space.settings.budget,
    inPot, spent, committed,
    projected: spent + committed,
    left,
    gap: (spent + committed) - space.settings.budget,
    unpriced,
    drift,
    driftPct: plannedOfThose > 0 ? Math.round((drift / plannedOfThose) * 100) : 0,
    weeklyBurn,
    runwayWeeks,
    byRoom, byCategory, byMonth, paid, contributed,
  };

  const nest: NestReport = {
    rooms: byRoom,
    total: space.items.length,
    bought: space.items.filter((i) => i.status === "bought").length,
    ordered: space.items.filter((i) => i.status === "ordered").length,
    chosen: space.items.filter((i) => i.status === "chosen").length,
    needed: space.items.filter((i) => i.status === "needed").length,
    readiness: readiness(space.items),
    criticalMissing: space.items.filter((i) => i.priority === 1 && i.status !== "bought"),
    hasAddress: Boolean(space.settings.address.label ?? space.settings.address.area),
  };

  /* ── المهام ──────────────────────────────────────── */
  const open = space.tasks.filter((t) => t.status !== "done");
  const doneTasks = space.tasks.filter((t) => t.status === "done");
  const weekMap = new Map<string, number>();
  for (const t of doneTasks) if (t.doneAt) {
    const k = weekKey(t.doneAt);
    weekMap.set(k, (weekMap.get(k) ?? 0) + 1);
  }
  const doneByWeek = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12).map(([week, count]) => ({ week, count }));

  const sixWeeksAgo = addDays(todayStr, -42);
  const doneRecently = doneTasks.filter((t) => t.doneAt && day(t.doneAt) >= sixWeeksAgo).length;
  const velocity = doneRecently / 6;

  const byOwner: Record<Actor, { open: number; done: number }> = {
    him: { open: 0, done: 0 }, her: { open: 0, done: 0 }, both: { open: 0, done: 0 },
  };
  for (const t of space.tasks) {
    const slot = byOwner[t.owner];
    if (t.status === "done") slot.done += 1; else slot.open += 1;
  }

  const phases = ["engagement", "prep", "wedding", "after"] as const;
  const missions: MissionsReport = {
    total: space.tasks.length,
    open: open.length,
    done: doneTasks.length,
    blocked: space.tasks.filter((t) => t.status === "blocked").length,
    overdue: open.filter((t) => t.due !== undefined && t.due < todayStr),
    dueSoon: open.filter((t) => t.due !== undefined && t.due >= todayStr && t.due <= addDays(todayStr, 7)),
    byOwner,
    byPhase: phases.map((p) => ({
      phase: p,
      open: space.tasks.filter((t) => t.phase === p && t.status !== "done").length,
      done: space.tasks.filter((t) => t.phase === p && t.status === "done").length,
    })),
    velocity,
    finishInWeeks: velocity > 0 ? open.length / velocity : null,
    doneByWeek,
  };

  /* ── الحياة ──────────────────────────────────────── */
  const memByMonth = new Map<string, number>();
  for (const m of space.memories) memByMonth.set(monthKey(m.date), (memByMonth.get(monthKey(m.date)) ?? 0) + 1);
  const lastMemory = space.memories.reduce<string | null>(
    (acc, m) => (acc === null || m.date > acc ? m.date : acc), null,
  );
  const sealed = space.capsules.filter((c) => !c.openedAt);
  const ready = sealed.filter((c) => c.openAt <= todayStr);
  const nextSealed = sealed.filter((c) => c.openAt > todayStr)
    .sort((a, b) => a.openAt.localeCompare(b.openAt))[0];

  const life: LifeReport = {
    memories: space.memories.length,
    lastMemoryDaysAgo: lastMemory ? daysBetween(lastMemory, todayStr) : null,
    memoriesByMonth: [...memByMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12).map(([month, count]) => ({ month, count })),
    wishes: {
      someday: space.wishes.filter((w) => w.status === "someday").length,
      planned: space.wishes.filter((w) => w.status === "planned").length,
      done: space.wishes.filter((w) => w.status === "done").length,
    },
    notes: space.notes.length,
    unreadForMe: space.notes.filter((n) => n.from !== viewer && !n.readAt).length,
    capsulesSealed: sealed.length,
    capsuleReady: ready.length,
    ...(nextSealed
      ? { nextCapsule: { id: nextSealed.id, openAt: nextSealed.openAt, daysAway: daysBetween(todayStr, nextSealed.openAt) } }
      : {}),
    openDecisions: space.decisions.filter((d) => !d.resolvedAt).length,
    upcoming: space.appointments
      .filter((a) => a.status === "planned" && day(a.at) >= todayStr && day(a.at) <= addDays(todayStr, 7))
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((a) => ({
        id: a.id, title: a.title, at: a.at, daysAway: daysBetween(todayStr, day(a.at)),
        ...(a.place === undefined ? {} : { place: a.place }),
      })),
  };

  return {
    today: todayStr, viewer, countdown, money, nest, missions, life,
    attention: [],  // يملؤها `attend()` — الحساب منفصل عن الحكم
  };
}

/** جاهزية موزونة: كل عنصر بوزن أولويته وتقدّم حالته. */
export function readiness(items: readonly Item[]): number {
  let got = 0, max = 0;
  for (const i of items) {
    const w = WEIGHT[i.priority] ?? 1;
    max += w;
    got += w * PROGRESS[i.status];
  }
  return pct(got, max);
}
