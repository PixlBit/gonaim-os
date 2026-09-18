import type { Space } from "./types.js";
import type { Persona } from "./persona.js";
import { readPersona, traitText } from "./persona.js";
import { day, daysBetween } from "./dates.js";

/**
 * الانسجام.
 *
 * ليست درجة توافق. "توافقكم ٨٧٪" رقم لا يمكن إثباته ولا تكذيبه، وكل ما
 * يفعله أنه يريح أو يقلق بلا سبب. ما هنا مختلف: **فروق محددة، ولكل فرق
 * دليل وخطوة**.
 *
 * وثلاثة أنواع فقط:
 *  - `complement` — اختلاف بيشتغل لصالحكم.
 *  - `friction`   — اختلاف بيولّد احتكاك متكرر، وله حل عملي.
 *  - `echo`       — تشابه، وله ثمنه أحيانًا (اتنين بيؤجلوا = حاجة مش هتتعمل).
 *
 * ولا شيء هنا يظهر بلا أساس: إما إعلان كتبه صاحبه، أو رقم من سلوك مسجَّل.
 */

export interface SyncInsight {
  code: string;
  kind: "complement" | "friction" | "echo";
  title: string;
  /** من أين جاءت الملاحظة — إعلان أو رقم. */
  why: string;
  move?: string;
}

export interface SyncReport {
  him: Persona;
  her: Persona;
  insights: SyncInsight[];
  /** تطابق أوقات النشاط 0..100 — من السجل. */
  overlap: number | null;
  /** توازن الحِمل 0..100 حيث 100 = متساويان تمامًا. */
  balance: number | null;
  /** كم أعلن كل واحد من الخيارات السبعة. */
  declared: { him: number; her: number };
}

const CHOICES = ["loveLanguage", "decisionStyle", "stressStyle", "energyTime", "conflict", "planning", "money"] as const;

export function syncReport(space: Space): SyncReport {
  const him = readPersona(space, "him");
  const her = readPersona(space, "her");
  const insights: SyncInsight[] = [];
  const H = him.traits, R = her.traits;
  const hisName = him.name, herName = her.name;

  const push = (i: SyncInsight) => { insights.push(i); };

  /* ── لغة الحب ─────────────────────────────────────── */
  if (H.loveLanguage && R.loveLanguage) {
    if (H.loveLanguage === R.loveLanguage) {
      push({
        code: "love.same", kind: "echo",
        title: "نفس لغة الحب",
        why: `الاتنين قالوا: ${traitText("loveLanguage", H.loveLanguage)}.`,
        move: "ميزة نادرة — استعملوها بدل ما تعتبروها بديهية.",
      });
    } else {
      push({
        code: "love.diff", kind: "friction",
        title: "بتعبّروا بلغتين",
        why: `${herName}: ${traitText("loveLanguage", R.loveLanguage)} · ${hisName}: ${traitText("loveLanguage", H.loveLanguage)}. ` +
          "ده مش تناقض — بس كل واحد بيدّي باللغة اللي بيحب ياخد بيها، فالرسالة بتوصل ناقصة.",
        move: `جرّب كل واحد يدّي بلغة التاني أسبوع واحد بس، وشوفوا الفرق.`,
      });
    }
  }

  /* ── القرار ───────────────────────────────────────── */
  if (H.decisionStyle && R.decisionStyle && H.decisionStyle !== R.decisionStyle) {
    const slow = new Set(["research", "consult", "avoid"]);
    const fastOne = H.decisionStyle === "fast" ? hisName : R.decisionStyle === "fast" ? herName : null;
    const slowOne = slow.has(H.decisionStyle) ? hisName : slow.has(R.decisionStyle) ? herName : null;
    if (fastOne && slowOne) {
      const openDays = space.decisions
        .filter((d) => !d.resolvedAt)
        .map((d) => daysBetween(day(d.createdAt), day(new Date().toISOString())));
      const longest = openDays.length > 0 ? Math.max(...openDays) : null;
      push({
        code: "decide.pace", kind: "friction",
        title: "إيقاع القرار مختلف",
        why: `${fastOne} بيقرر بسرعة و${slowOne} محتاج وقت` +
          (longest !== null && longest > 5 ? `. وفعلًا في قرار مفتوح من ${longest} يوم.` : "."),
        move: "حطّوا للقرار تاريخ إقفال ساعة ما يتفتح — المهلة بتريح الاتنين.",
      });
    }
  }

  /* ── الضغط ────────────────────────────────────────── */
  if (H.stressStyle && R.stressStyle && H.stressStyle !== R.stressStyle) {
    push({
      code: "stress.diff", kind: "friction",
      title: "الضغط بيتعالج بطريقتين",
      why: `${hisName} محتاج ${traitText("stressStyle", H.stressStyle)} و${herName} محتاجة ${traitText("stressStyle", R.stressStyle)}. ` +
        "أكتر خلاف بيحصل مش على الموضوع نفسه، ده على التوقيت.",
      move: H.stressStyle === "space" || R.stressStyle === "space"
        ? "اللي محتاج مساحة ياخدها ساعة، بس يقول «هرجع أتكلم» — الصمت المفتوح بيتقري رفض."
        : "اسألوا الأول: «عايز نتكلم دلوقتي ولا بعدين؟» قبل ما تبدأوا.",
    });
  }

  /* ── الفلوس ───────────────────────────────────────── */
  if (H.money && R.money && H.money !== R.money) {
    const spender = H.money === "spender" ? him : R.money === "spender" ? her : null;
    const saver = H.money === "saver" ? him : R.money === "saver" ? her : null;
    const drift = spender?.axes.find((a) => a.id === "spending");
    push({
      code: "money.diff", kind: spender && saver ? "friction" : "complement",
      title: spender && saver ? "واحد بيمسك وواحد بيفتح" : "علاقتكم بالفلوس مختلفة",
      why: `${hisName}: ${traitText("money", H.money)} · ${herName}: ${traitText("money", R.money)}` +
        (drift?.score != null && drift.score > 60
          ? `. والأرقام موافقة: ${spender?.name} بيدفع فوق تقديره.`
          : "."),
      move: "حدّوا سقفًا للقرار الفردي: أي حاجة فوقه تتقرر سوا. الرقم أهم من النقاش.",
    });
  }

  /* ── الخلاف ───────────────────────────────────────── */
  if (H.conflict && R.conflict) {
    if (H.conflict === "delay" && R.conflict === "delay") {
      push({
        code: "conflict.both.delay", kind: "echo",
        title: "الاتنين بتأجّلوا الكلام الصعب",
        why: "الاتنين قالوا إنهم بيسكتوا ويقولوها بعدين.",
        move: "اتفقوا على ميعاد أسبوعي ثابت للكلام المؤجَّل — نص ساعة تكفي.",
      });
    } else if (H.conflict !== R.conflict) {
      const direct = H.conflict === "direct" ? hisName : R.conflict === "direct" ? herName : null;
      if (direct) {
        push({
          code: "conflict.diff", kind: "friction",
          title: "المواجهة مش بنفس السرعة",
          why: `${direct} بيقولها في وقتها، والتاني بياخد وقت.`,
          move: "اللي بيتكلم بسرعة يستنى رد بكرة، واللي بياخد وقت يقول «سمعتك، هرد بكرة».",
        });
      }
    }
  }

  /* ── التخطيط ──────────────────────────────────────── */
  if (H.planning && R.planning && H.planning !== R.planning) {
    const planner = H.planning === "planner" ? him : her;
    const flow = H.planning === "planner" ? her : him;
    push({
      code: "planning.diff", kind: "complement",
      title: "واحد بيخطط وواحد بيمشي مع الموج",
      why: `${planner.name} بيخطط و${flow.name} بيمشي مع الموج. التركيبة دي بتشتغل كويس لو الأدوار متقسمة.`,
      move: `سيبوا المواعيد والورق لـ${planner.name}، واللي محتاج مرونة وقرار سريع لـ${flow.name}.`,
    });
  }

  /* ── أوقات النشاط ─────────────────────────────────── */
  const overlap = hourOverlap(him.hours, her.hours);
  if (overlap !== null && overlap < 35 && him.actions >= 8 && her.actions >= 8) {
    push({
      code: "hours.apart", kind: "friction",
      title: "بتشتغلوا في المساحة دي في أوقات مختلفة",
      why: `تطابق أوقات النشاط ${overlap}٪` +
        (him.peakHour !== null && her.peakHour !== null
          ? ` — ${hisName} أنشط الساعة ${fmtHour(him.peakHour)} و${herName} الساعة ${fmtHour(her.peakHour)}.`
          : "."),
      move: "خلّوا ربع ساعة مشتركة في الليل تمرّوا فيها على اللي اتغيّر، بدل ما كل واحد يقرا لوحده.",
    });
  }
  if (H.energyTime && R.energyTime && H.energyTime !== R.energyTime) {
    push({
      code: "energy.diff", kind: "friction",
      title: "طاقتكم في وقتين",
      why: `${hisName} أحسن وقته ${traitText("energyTime", H.energyTime)} و${herName} ${traitText("energyTime", R.energyTime)}.`,
      move: "الكلام المهم ميتقالش في وقت طاقة واحد بس — اختاروا وقت وسط وخلّوه ثابت.",
    });
  }

  /* ── الحِمل ───────────────────────────────────────── */
  const init = him.axes.find((a) => a.id === "initiative");
  if (init?.score != null && init.n >= 8) {
    if (init.score >= 70 || init.score <= 30) {
      const heavy = init.score >= 70 ? him : her;
      push({
        code: "load.initiative", kind: "friction",
        title: `${heavy.name} بيفتح أغلب اللي هنا`,
        why: init.evidence,
        move: "اللي بيفتح أقل ياخد باب كامل يبقى مسؤول عنه — مش مهام متفرقة.",
      });
    }
  }
  const careHim = him.axes.find((a) => a.id === "care")?.score;
  const careHer = her.axes.find((a) => a.id === "care")?.score;
  if (careHim != null && careHer != null && Math.abs(careHim - careHer) >= 35) {
    const warm = careHim > careHer ? him : her;
    const busy = careHim > careHer ? her : him;
    push({
      code: "care.gap", kind: "friction",
      title: `${warm.name} بيمسك الجانب الشخصي لوحده`,
      why: `${warm.name}: ${Math.round(careHim > careHer ? careHim : careHer)}٪ من نشاطه شخصي، و${busy.name}: ${Math.round(careHim > careHer ? careHer : careHim)}٪.`,
      move: `${busy.name} يسجّل ذكرى واحدة الأسبوع ده — مش مهمة، ذكرى.`,
    });
  }

  const balance = init?.score == null ? null : 100 - Math.abs(init.score - 50) * 2;

  return {
    him, her,
    insights: insights.sort((a, b) => weight(a.kind) - weight(b.kind)),
    overlap,
    balance: balance === null ? null : Math.round(balance),
    declared: {
      him: CHOICES.filter((c) => H[c] !== undefined).length,
      her: CHOICES.filter((c) => R[c] !== undefined).length,
    },
  };
}

function weight(kind: SyncInsight["kind"]): number {
  return kind === "friction" ? 0 : kind === "complement" ? 1 : 2;
}

/** تقاطع التوزيعين الساعيين — 100 يعني نفس الإيقاع تمامًا. */
function hourOverlap(a: number[], b: number[]): number | null {
  const sa = a.reduce((x, y) => x + y, 0);
  const sb = b.reduce((x, y) => x + y, 0);
  if (sa < 6 || sb < 6) return null;
  let shared = 0;
  for (let h = 0; h < 24; h++) {
    shared += Math.min((a[h] ?? 0) / sa, (b[h] ?? 0) / sb);
  }
  return Math.round(shared * 100);
}

export function fmtHour(h: number): string {
  const period = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}
