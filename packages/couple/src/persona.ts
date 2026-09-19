import type { PersonKey, Space, Traits } from "./types.js";
import { day, daysBetween } from "./dates.js";
import { T, enCount, type Text } from "./text.js";

/**
 * أنماط الشخصية.
 *
 * مبدأ واحد يحكم هذا الملف: **لا درجة بلا دليل**. كل محور هنا يُحسب من
 * سطور حقيقية كتبها صاحبها — مهمة أغلقها، سعر دفعه، رسالة قرأها — ولو لم
 * تكفِ السطور، يعود المحور بـ`null` ويقول لماذا، ولا يخترع رقمًا.
 *
 * هذا ليس اختبار شخصية. اختبار الشخصية يسألك عن نفسك ثم يخبرك بما قلته
 * في صيغة أجمل. وهذا يقرأ ما فعلته أنت فعلًا خلال شهور، ويضعه بجوار ما
 * أعلنته — والفجوة بينهما هي أنفع ما في الشاشة: "قال إنه بيخطط، والأرقام
 * بتقول إنه بيقفل في آخر يوم".
 *
 * ومحاذير مقصودة:
 *  - لا محور يقيس "أحسن/أوحش". الاندفاع في الشراء ليس عيبًا، والحذر ليس
 *    فضيلة — كلاهما وصف لسلوك، والحكم لصاحبه.
 *  - المقارنة بين الاثنين نسبية دائمًا (حصة من المجموع)، فلا معنى لرقم
 *    مطلق في مساحة عمرها شهر.
 */

export type AxisId =
  | "initiative"      // مين بيبدأ
  | "followThrough"   // مين بيقفل
  | "spending"        // العلاقة بالسعر المعلن
  | "responsiveness"  // إيقاع الرد
  | "care"            // نصيب العلاقة من نشاطه
  | "planning";       // بُعد النظر في المواعيد

export interface Axis {
  id: AxisId;
  name: Text;
  /** 0..100 — أو `null` حين لا تكفي البيانات. الصفر ليس بديلًا عن المجهول. */
  score: number | null;
  /** حجم العيّنة التي بُني عليها الرقم. */
  n: number;
  /** جملة تقول من أين جاء الرقم — بلا هذه الجملة الرقم ادّعاء. */
  evidence: Text;
}

export interface Persona {
  key: PersonKey;
  name: string;
  accent: string;
  axes: Axis[];
  /** 24 خانة — كم فعلًا سجّله في كل ساعة، من السجل. */
  hours: number[];
  /** الساعة التي يظهر فيها أكثر من غيرها، أو `null`. */
  peakHour: number | null;
  /** أبرز ما يميّزه عن الطرف الآخر، بلغة الوصف لا الحكم. */
  signature: Text | null;
  traits: Traits;
  /** عدد الأفعال المسجَّلة له — أساس الثقة في كل ما سبق. */
  actions: number;
}

/** أقل عيّنة يُقبل عندها رقم. أقل من ذلك وصف حظ لا نمط. */
const MIN = 4;

const NAMES: Record<AxisId, Text> = {
  initiative:     T("المبادرة", "Initiative"),
  followThrough:  T("الإقفال",  "Follow-through"),
  spending:       T("الإنفاق",  "Spending"),
  responsiveness: T("الرد",     "Responsiveness"),
  care:           T("الرعاية",  "Care"),
  planning:       T("التخطيط",  "Planning"),
};

function axis(id: AxisId, score: number | null, n: number, evidence: Text): Axis {
  return { id, name: NAMES[id], score: score === null ? null : clamp(score), n, evidence };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** حصة نسبية تُحوَّل إلى 0..100 حيث 50 = تعادل. */
function share(mine: number, theirs: number): number | null {
  const total = mine + theirs;
  return total === 0 ? null : (mine / total) * 100;
}

export function readPersona(space: Space, key: PersonKey): Persona {
  const other: PersonKey = key === "him" ? "her" : "him";
  const person = space.people[key];

  /* ── المبادرة: مين بيفتح السطر أول ────────────────── */
  const created = (who: PersonKey) =>
    space.tasks.filter((t) => t.createdBy === who).length +
    space.items.filter((i) => i.addedBy === who).length +
    space.memories.filter((m) => m.by === who).length +
    space.wishes.filter((w) => w.by === who).length +
    space.appointments.filter((a) => a.createdBy === who).length +
    space.decisions.filter((d) => d.createdBy === who).length;
  const mineCreated = created(key), theirsCreated = created(other);

  /* ── الإقفال: مين بيحوّل المفتوح لمقفول ───────────── */
  const closed = (who: PersonKey) =>
    space.tasks.filter((t) => t.doneBy === who).length;
  const mineClosed = closed(key), theirsClosed = closed(other);

  // ومعه سرعة الإقفال: كام يوم من فتح المهمة لإغلاقها
  const lags = space.tasks.flatMap((t) =>
    t.doneBy === key && t.doneAt ? [daysBetween(day(t.createdAt), day(t.doneAt))] : []);
  const medianLag = median(lags);

  /* ── الإنفاق: المدفوع مقابل المتوقع فيما دفعه هو ──── */
  const paid = space.items.flatMap((i) =>
    i.paidBy === key && i.status === "bought" &&
    i.actualPrice !== undefined && i.targetPrice !== undefined && i.targetPrice > 0
      ? [(i.actualPrice - i.targetPrice) / i.targetPrice]
      : []);
  const avgDrift = paid.length > 0 ? paid.reduce((a, b) => a + b, 0) / paid.length : null;
  // 50 = دفع بالضبط ما توقّعه. فوقها تجاوز، تحتها نزل عن تقديره.
  const spendScore = avgDrift === null ? null : 50 + avgDrift * 100;

  /* ── الرد: كام ساعة بين رسالة منه وقراءتها ────────── */
  const waits = space.notes.flatMap((n) =>
    n.from === other && n.readAt
      ? [(Date.parse(n.readAt) - Date.parse(n.at)) / 3_600_000]
      : []);
  const medianWait = median(waits);
  // ساعة أو أقل = 100، و48 ساعة = 0
  const replyScore = medianWait === null ? null : 100 - (Math.min(medianWait, 48) / 48) * 100;

  /* ── الرعاية: نصيب العلاقة من نشاطه هو ────────────── */
  const careActs =
    space.memories.filter((m) => m.by === key).length +
    space.notes.filter((n) => n.from === key).length +
    space.capsules.filter((c) => c.from === key).length +
    space.wishes.filter((w) => w.by === key).length;
  const logisticActs =
    space.items.filter((i) => i.addedBy === key).length +
    space.tasks.filter((t) => t.createdBy === key).length +
    space.expenses.filter((e) => e.createdBy === key).length;
  const careScore = careActs + logisticActs === 0
    ? null : (careActs / (careActs + logisticActs)) * 100;

  /* ── التخطيط: كام يوم بين الكتابة والموعد ─────────── */
  const horizons = [
    ...space.appointments.flatMap((a) =>
      a.createdBy === key ? [daysBetween(day(a.createdAt), day(a.at))] : []),
    ...space.tasks.flatMap((t) =>
      t.createdBy === key && t.due ? [daysBetween(day(t.createdAt), t.due)] : []),
  ].filter((d) => d >= 0);
  const medianHorizon = median(horizons);
  // أسبوعان أو أكثر = 100، ونفس اليوم = 0
  const planScore = medianHorizon === null ? null : Math.min(medianHorizon, 14) / 14 * 100;

  const openedAll = mineCreated + theirsCreated;
  const closedAll = mineClosed + theirsClosed;
  const careAll = careActs + logisticActs;

  const axes: Axis[] = [
    axis("initiative", share(mineCreated, theirsCreated), openedAll,
      openedAll === 0
        ? T("لسه محدش زوّد حاجة.", "Nobody has added anything yet.")
        : T(`فتح ${mineCreated} سطر من ${openedAll}.`,
            `Opened ${mineCreated} of ${openedAll} lines.`)),

    axis("followThrough",
      closedAll < MIN ? null : share(mineClosed, theirsClosed),
      closedAll,
      closedAll < MIN
        ? T(`${closedAll} مهمة مقفولة بس — لسه بدري على نمط.`,
            `Only ${enCount(closedAll, "task")} closed — too early for a pattern.`)
        : T(`قفل ${mineClosed} مهمة من ${closedAll}` +
              (medianLag === null ? "." : `، ومتوسط ${Math.round(medianLag)} يوم من الفتح للإقفال.`),
            `Closed ${mineClosed} of ${closedAll}` +
              (medianLag === null ? "." : `, a median of ${enCount(Math.round(medianLag), "day")} from open to close.`))),

    axis("spending", paid.length < 3 ? null : spendScore, paid.length,
      paid.length < 3
        ? T(`${paid.length} حاجة بسعر متوقع ومدفوع — محتاج تلاتة عالأقل.`,
            `${enCount(paid.length, "item")} with both an estimate and a price — three is the minimum.`)
        : avgDrift === null ? T("", "")
        : avgDrift > 0.02
          ? T(`بيدفع أعلى من تقديره بـ${Math.round(avgDrift * 100)}٪ في المتوسط.`,
              `Pays ${Math.round(avgDrift * 100)}% above their own estimate on average.`)
          : avgDrift < -0.02
            ? T(`بينزل عن تقديره بـ${Math.round(Math.abs(avgDrift) * 100)}٪ في المتوسط.`,
                `Comes in ${Math.round(Math.abs(avgDrift) * 100)}% under their own estimate on average.`)
            : T("بيدفع تقريبًا زي ما قدّر.", "Pays about what they estimated.")),

    axis("responsiveness", waits.length < 3 ? null : replyScore, waits.length,
      waits.length < 3
        ? T("لسه مفيش رسايل مقروءة كفاية.", "Not enough notes have been read yet.")
        : medianWait === null ? T("", "")
        : medianWait < 2
          ? T("بيقرا في أقل من ساعتين.", "Reads within two hours.")
          : T(`متوسط ${Math.round(medianWait)} ساعة لحد ما يقرا.`,
              `A median of ${enCount(Math.round(medianWait), "hour")} before reading.`)),

    axis("care", careAll < MIN ? null : careScore, careAll,
      careAll < MIN
        ? T("نشاط قليل لسه.", "Not much activity yet.")
        : T(`${careActs} من ${careAll} من نشاطه كان ذكرى أو رسالة أو حاجة نعملها.`,
            `${careActs} of ${careAll} of their activity was a memory, a note or a wish.`)),

    axis("planning", horizons.length < 3 ? null : planScore, horizons.length,
      horizons.length < 3
        ? T("مفيش مواعيد كفاية بتاريخ.", "Not enough dated plans yet.")
        : medianHorizon === null ? T("", "")
        : T(`بيحدد المواعيد قبلها بـ${Math.round(medianHorizon)} يوم في المتوسط.`,
            `Sets dates a median of ${enCount(Math.round(medianHorizon), "day")} ahead.`)),
  ];

  const hours = new Array<number>(24).fill(0);
  for (const entry of space.log) {
    if (entry.by !== key) continue;
    const h = new Date(entry.at).getHours();
    const slot = hours[h];
    if (slot !== undefined) hours[h] = slot + 1;
  }
  const total = hours.reduce((a, b) => a + b, 0);
  const peakHour = total >= MIN
    ? hours.indexOf(Math.max(...hours))
    : null;

  return {
    key,
    name: person.name,
    accent: person.accent,
    axes,
    hours,
    peakHour,
    signature: signatureOf(axes),
    traits: person.traits ?? {},
    actions: total,
  };
}

/** أبرز محور خرج عن التعادل بوضوح — وصفًا لا حكمًا. */
function signatureOf(axes: Axis[]): Text | null {
  const scored = axes.filter((a): a is Axis & { score: number } => a.score !== null);
  if (scored.length === 0) return null;
  const top = scored.reduce((best, a) =>
    Math.abs(a.score - 50) > Math.abs(best.score - 50) ? a : best);
  if (Math.abs(top.score - 50) < 12) {
    return T("متوازن في كل المحاور تقريبًا.", "Close to balanced on every axis.");
  }

  const high = top.score > 50;
  // الإنجليزية بضمير they/them: المنصة لا تعرف ضمير أحد، ولا تخمّنه من اسم.
  const lines: Record<AxisId, [Text, Text]> = {
    initiative: [
      T("بيفتح أغلب اللي بيتكتب هنا.", "Opens most of what gets written here."),
      T("بيبني على اللي الطرف التاني بيفتحه.", "Builds on what the other one opens."),
    ],
    followThrough: [
      T("أغلب اللي بيتقفل بيتقفل على إيده.", "Most of what closes, closes with them."),
      T("بيفتح أكتر مما بيقفل.", "Opens more than they close."),
    ],
    spending: [
      T("بيدفع فوق تقديره غالبًا.", "Usually pays above their own estimate."),
      T("بيدفع تحت تقديره غالبًا.", "Usually pays below their own estimate."),
    ],
    responsiveness: [
      T("بيرد بسرعة.", "Replies quickly."),
      T("بياخد وقته قبل ما يرد.", "Takes their time before replying."),
    ],
    care: [
      T("أغلب نشاطه في الجانب الشخصي مش التجهيز.", "Most of their activity is personal, not logistics."),
      T("أغلب نشاطه تجهيز ولوجستيات.", "Most of their activity is preparation and logistics."),
    ],
    planning: [
      T("بيحجز المواعيد بدري.", "Books well ahead."),
      T("بيقرر قرب الميعاد.", "Decides close to the day."),
    ],
  };
  const pair = lines[top.id];
  return high ? pair[0] : pair[1];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const a = sorted[mid - 1], b = sorted[mid];
  return a === undefined || b === undefined ? null : (a + b) / 2;
}

/* ── مفردات العرض ─────────────────────────────────── */

export const TRAIT_LABELS = {
  loveLanguage: {
    label: T("بحس بالحب لما", "I feel loved when"),
    options: {
      words:  T("يتقال لي كلام حلو", "I'm told something kind"),
      time:   T("ناخد وقت لوحدنا", "we get time alone"),
      gifts:  T("يجيب لي حاجة", "they bring me something"),
      acts:   T("يعمل لي حاجة", "they do something for me"),
      touch:  T("نقرب من بعض", "we're close"),
    },
  },
  decisionStyle: {
    label: T("بقرر", "I decide"),
    options: {
      fast:     T("بسرعة", "quickly"),
      research: T("بعد ما أبحث", "after I research"),
      consult:  T("بعد ما أستشير", "after I ask someone"),
      avoid:    T("بأجّل القرار", "by putting it off"),
    },
  },
  stressStyle: {
    label: T("لما أتضايق محتاج", "When I'm upset I need"),
    options: {
      talk:     T("أتكلم", "to talk"),
      space:    T("مساحة", "space"),
      fix:      T("حل عملي", "a practical fix"),
      distract: T("أغيّر جو", "a change of scene"),
    },
  },
  energyTime: {
    label: T("أحسن وقت عندي", "My best hours are"),
    options: {
      morning: T("الصبح", "the morning"),
      day:     T("بالنهار", "the day"),
      night:   T("بالليل", "the night"),
    },
  },
  conflict: {
    label: T("في الخلاف", "In an argument"),
    options: {
      direct: T("بقولها في وشه", "I say it to their face"),
      soft:   T("بقولها بهدوء", "I say it gently"),
      delay:  T("بسكت وأقولها بعدين", "I go quiet and say it later"),
    },
  },
  planning: {
    label: T("مع الخطط", "With plans"),
    options: {
      planner: T("بخطط", "I plan"),
      flow:    T("بمشي مع الموج", "I go with the flow"),
    },
  },
  money: {
    label: T("مع الفلوس", "With money"),
    options: {
      saver:    T("بقتصد", "I save"),
      balanced: T("متوازن", "I'm balanced"),
      spender:  T("بصرف", "I spend"),
    },
  },
} as const;

export type ChoiceTrait = keyof typeof TRAIT_LABELS;

export function traitText(trait: ChoiceTrait, value: string | undefined): Text | null {
  if (!value) return null;
  const options = TRAIT_LABELS[trait].options as Record<string, Text>;
  return options[value] ?? null;
}
