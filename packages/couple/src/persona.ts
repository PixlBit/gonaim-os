import type { PersonKey, Space, Traits } from "./types.js";
import { day, daysBetween } from "./dates.js";

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
  name: string;
  /** 0..100 — أو `null` حين لا تكفي البيانات. الصفر ليس بديلًا عن المجهول. */
  score: number | null;
  /** حجم العيّنة التي بُني عليها الرقم. */
  n: number;
  /** جملة تقول من أين جاء الرقم — بلا هذه الجملة الرقم ادّعاء. */
  evidence: string;
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
  signature: string | null;
  traits: Traits;
  /** عدد الأفعال المسجَّلة له — أساس الثقة في كل ما سبق. */
  actions: number;
}

/** أقل عيّنة يُقبل عندها رقم. أقل من ذلك وصف حظ لا نمط. */
const MIN = 4;

const NAMES: Record<AxisId, string> = {
  initiative: "المبادرة",
  followThrough: "الإقفال",
  spending: "الإنفاق",
  responsiveness: "الرد",
  care: "الرعاية",
  planning: "التخطيط",
};

function axis(id: AxisId, score: number | null, n: number, evidence: string): Axis {
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

  const axes: Axis[] = [
    axis("initiative", share(mineCreated, theirsCreated), mineCreated + theirsCreated,
      mineCreated + theirsCreated === 0
        ? "لسه محدش زوّد حاجة."
        : `فتح ${mineCreated} سطر من ${mineCreated + theirsCreated}.`),

    axis("followThrough",
      mineClosed + theirsClosed < MIN ? null : share(mineClosed, theirsClosed),
      mineClosed + theirsClosed,
      mineClosed + theirsClosed < MIN
        ? `${mineClosed + theirsClosed} مهمة مقفولة بس — لسه بدري على نمط.`
        : `قفل ${mineClosed} مهمة من ${mineClosed + theirsClosed}` +
          (medianLag === null ? "." : `، ومتوسط ${Math.round(medianLag)} يوم من الفتح للإقفال.`)),

    axis("spending", paid.length < 3 ? null : spendScore, paid.length,
      paid.length < 3
        ? `${paid.length} حاجة بسعر متوقع ومدفوع — محتاج تلاتة عالأقل.`
        : avgDrift === null ? ""
        : avgDrift > 0.02
          ? `بيدفع أعلى من تقديره بـ${Math.round(avgDrift * 100)}٪ في المتوسط.`
          : avgDrift < -0.02
            ? `بينزل عن تقديره بـ${Math.round(Math.abs(avgDrift) * 100)}٪ في المتوسط.`
            : "بيدفع تقريبًا زي ما قدّر."),

    axis("responsiveness", waits.length < 3 ? null : replyScore, waits.length,
      waits.length < 3
        ? "لسه مفيش رسايل مقروءة كفاية."
        : medianWait === null ? ""
        : medianWait < 2 ? "بيقرا في أقل من ساعتين."
        : `متوسط ${Math.round(medianWait)} ساعة لحد ما يقرا.`),

    axis("care", careActs + logisticActs < MIN ? null : careScore, careActs + logisticActs,
      careActs + logisticActs < MIN
        ? "نشاط قليل لسه."
        : `${careActs} من ${careActs + logisticActs} من نشاطه كان ذكرى أو رسالة أو حاجة نعملها.`),

    axis("planning", horizons.length < 3 ? null : planScore, horizons.length,
      horizons.length < 3
        ? "مفيش مواعيد كفاية بتاريخ."
        : medianHorizon === null ? ""
        : `بيحدد المواعيد قبلها بـ${Math.round(medianHorizon)} يوم في المتوسط.`),
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
function signatureOf(axes: Axis[]): string | null {
  const scored = axes.filter((a): a is Axis & { score: number } => a.score !== null);
  if (scored.length === 0) return null;
  const top = scored.reduce((best, a) =>
    Math.abs(a.score - 50) > Math.abs(best.score - 50) ? a : best);
  if (Math.abs(top.score - 50) < 12) return "متوازن في كل المحاور تقريبًا.";

  const high = top.score > 50;
  const lines: Record<AxisId, [string, string]> = {
    initiative: ["بيفتح أغلب اللي بيتكتب هنا.", "بيبني على اللي الطرف التاني بيفتحه."],
    followThrough: ["أغلب اللي بيتقفل بيتقفل على إيده.", "بيفتح أكتر مما بيقفل."],
    spending: ["بيدفع فوق تقديره غالبًا.", "بيدفع تحت تقديره غالبًا."],
    responsiveness: ["بيرد بسرعة.", "بياخد وقته قبل ما يرد."],
    care: ["أغلب نشاطه في الجانب الشخصي مش التجهيز.", "أغلب نشاطه تجهيز ولوجستيات."],
    planning: ["بيحجز المواعيد بدري.", "بيقرر قرب الميعاد."],
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
    label: "بحس بالحب لما",
    options: {
      words: "يتقال لي كلام حلو",
      time: "ناخد وقت لوحدنا",
      gifts: "يجيب لي حاجة",
      acts: "يعمل لي حاجة",
      touch: "نقرب من بعض",
    },
  },
  decisionStyle: {
    label: "بقرر",
    options: { fast: "بسرعة", research: "بعد ما أبحث", consult: "بعد ما أستشير", avoid: "بأجّل القرار" },
  },
  stressStyle: {
    label: "لما أتضايق محتاج",
    options: { talk: "أتكلم", space: "مساحة", fix: "حل عملي", distract: "أغيّر جو" },
  },
  energyTime: {
    label: "أحسن وقت عندي",
    options: { morning: "الصبح", day: "بالنهار", night: "بالليل" },
  },
  conflict: {
    label: "في الخلاف",
    options: { direct: "بقولها في وشه", soft: "بقولها بهدوء", delay: "بسكت وأقولها بعدين" },
  },
  planning: {
    label: "مع الخطط",
    options: { planner: "بخطط", flow: "بمشي مع الموج" },
  },
  money: {
    label: "مع الفلوس",
    options: { saver: "بقتصد", balanced: "متوازن", spender: "بصرف" },
  },
} as const;

export type ChoiceTrait = keyof typeof TRAIT_LABELS;

export function traitText(trait: ChoiceTrait, value: string | undefined): string | null {
  if (!value) return null;
  const options = TRAIT_LABELS[trait].options as Record<string, string>;
  return options[value] ?? null;
}
