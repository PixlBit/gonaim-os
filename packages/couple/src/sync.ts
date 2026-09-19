import type { Space } from "./types.js";
import type { Persona } from "./persona.js";
import { readPersona, traitText } from "./persona.js";
import { day, daysBetween } from "./dates.js";
import { T, bdi, enCount, type Text } from "./text.js";

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
  title: Text;
  /** من أين جاءت الملاحظة — إعلان أو رقم. */
  why: Text;
  move?: Text;
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
  // كل اسم يدخل جملة يُعزَل: الاسم قد يكون بأي اتجاه، والجملة بالآخر
  const hisName = bdi(him.name), herName = bdi(her.name);

  const push = (i: SyncInsight) => { insights.push(i); };

  /* ── لغة الحب ─────────────────────────────────────── */
  if (H.loveLanguage && R.loveLanguage) {
    if (H.loveLanguage === R.loveLanguage) {
      push({
        code: "love.same", kind: "echo",
        title: T("نفس لغة الحب", "The same love language"),
        why: T(`الاتنين قالوا: ${traitText("loveLanguage", H.loveLanguage)?.ar}.`,
               `You both said: ${traitText("loveLanguage", H.loveLanguage)?.en}.`),
        move: T("ميزة نادرة — استعملوها بدل ما تعتبروها بديهية.",
                "That is rare — use it instead of assuming it."),
      });
    } else {
      push({
        code: "love.diff", kind: "friction",
        title: T("بتعبّروا بلغتين", "You speak two different languages"),
        why: T(`${herName}: ${traitText("loveLanguage", R.loveLanguage)?.ar} · ${hisName}: ${traitText("loveLanguage", H.loveLanguage)?.ar}. ` +
                 "ده مش تناقض — بس كل واحد بيدّي باللغة اللي بيحب ياخد بيها، فالرسالة بتوصل ناقصة.",
               `${herName}: ${traitText("loveLanguage", R.loveLanguage)?.en} · ${hisName}: ${traitText("loveLanguage", H.loveLanguage)?.en}. ` +
                 "Not a contradiction — but each of you gives in the language you like to receive, so the message lands short."),
        move: T("جرّب كل واحد يدّي بلغة التاني أسبوع واحد بس، وشوفوا الفرق.",
                "Try giving in the other's language for one week, and see the difference."),
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
        title: T("إيقاع القرار مختلف", "You decide at different speeds"),
        why: T(`${fastOne} بيقرر بسرعة و${slowOne} محتاج وقت` +
                 (longest !== null && longest > 5 ? `. وفعلًا في قرار مفتوح من ${longest} يوم.` : "."),
               `${fastOne} decides fast and ${slowOne} needs time` +
                 (longest !== null && longest > 5 ? `. And there is a decision open for ${enCount(longest, "day")}.` : ".")),
        move: T("حطّوا للقرار تاريخ إقفال ساعة ما يتفتح — المهلة بتريح الاتنين.",
                "Give each decision a closing date the moment it opens — a deadline calms both sides."),
      });
    }
  }

  /* ── الضغط ────────────────────────────────────────── */
  if (H.stressStyle && R.stressStyle && H.stressStyle !== R.stressStyle) {
    push({
      code: "stress.diff", kind: "friction",
      title: T("الضغط بيتعالج بطريقتين", "You handle pressure in two different ways"),
      why: T(`${hisName} محتاج ${traitText("stressStyle", H.stressStyle)?.ar} و${herName} محتاجة ${traitText("stressStyle", R.stressStyle)?.ar}. ` +
               "أكتر خلاف بيحصل مش على الموضوع نفسه، ده على التوقيت.",
             `${hisName} needs ${traitText("stressStyle", H.stressStyle)?.en} and ${herName} needs ${traitText("stressStyle", R.stressStyle)?.en}. ` +
               "Most arguments are not about the subject — they are about the timing."),
      move: H.stressStyle === "space" || R.stressStyle === "space"
        ? T("اللي محتاج مساحة ياخدها ساعة، بس يقول «هرجع أتكلم» — الصمت المفتوح بيتقري رفض.",
            "Whoever needs space takes an hour — but says “I'll come back to this”. Open-ended silence reads as rejection.")
        : T("اسألوا الأول: «عايز نتكلم دلوقتي ولا بعدين؟» قبل ما تبدأوا.",
            "Ask first: “now, or later?” before you start."),
    });
  }

  /* ── الفلوس ───────────────────────────────────────── */
  if (H.money && R.money && H.money !== R.money) {
    const spender = H.money === "spender" ? him : R.money === "spender" ? her : null;
    const saver = H.money === "saver" ? him : R.money === "saver" ? her : null;
    const drift = spender?.axes.find((a) => a.id === "spending");
    push({
      code: "money.diff", kind: spender && saver ? "friction" : "complement",
      title: spender && saver
        ? T("واحد بيمسك وواحد بيفتح", "One of you holds, the other opens")
        : T("علاقتكم بالفلوس مختلفة", "You relate to money differently"),
      why: T(`${hisName}: ${traitText("money", H.money)?.ar} · ${herName}: ${traitText("money", R.money)?.ar}` +
               (drift?.score != null && drift.score > 60
                 ? `. والأرقام موافقة: ${bdi(spender?.name ?? "")} بيدفع فوق تقديره.` : "."),
             `${hisName}: ${traitText("money", H.money)?.en} · ${herName}: ${traitText("money", R.money)?.en}` +
               (drift?.score != null && drift.score > 60
                 ? `. And the numbers agree: ${bdi(spender?.name ?? "")} pays above their estimate.` : ".")),
      move: T("حدّوا سقفًا للقرار الفردي: أي حاجة فوقه تتقرر سوا. الرقم أهم من النقاش.",
              "Set a ceiling for solo decisions: anything above it you decide together. The number matters more than the debate."),
    });
  }

  /* ── الخلاف ───────────────────────────────────────── */
  if (H.conflict && R.conflict) {
    if (H.conflict === "delay" && R.conflict === "delay") {
      push({
        code: "conflict.both.delay", kind: "echo",
        title: T("الاتنين بتأجّلوا الكلام الصعب", "You both postpone the hard conversation"),
        why: T("الاتنين قالوا إنهم بيسكتوا ويقولوها بعدين.",
               "You both said you go quiet and say it later."),
        move: T("اتفقوا على ميعاد أسبوعي ثابت للكلام المؤجَّل — نص ساعة تكفي.",
                "Agree on one fixed slot a week for what got postponed — half an hour is enough."),
      });
    } else if (H.conflict !== R.conflict) {
      const direct = H.conflict === "direct" ? hisName : R.conflict === "direct" ? herName : null;
      if (direct) {
        push({
          code: "conflict.diff", kind: "friction",
          title: T("المواجهة مش بنفس السرعة", "You confront at different speeds"),
          why: T(`${direct} بيقولها في وقتها، والتاني بياخد وقت.`,
                 `${direct} says it there and then; the other needs time.`),
          move: T("اللي بيتكلم بسرعة يستنى رد بكرة، واللي بياخد وقت يقول «سمعتك، هرد بكرة».",
                  "The fast one waits until tomorrow for an answer; the slow one says “I heard you, I'll answer tomorrow”."),
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
      title: T("واحد بيخطط وواحد بيمشي مع الموج", "One plans, one goes with the flow"),
      why: T(`${bdi(planner.name)} بيخطط و${bdi(flow.name)} بيمشي مع الموج. التركيبة دي بتشتغل كويس لو الأدوار متقسمة.`,
             `${bdi(planner.name)} plans and ${bdi(flow.name)} goes with the flow. That combination works well once the roles are split.`),
      move: T(`سيبوا المواعيد والورق لـ${bdi(planner.name)}، واللي محتاج مرونة وقرار سريع لـ${bdi(flow.name)}.`,
              `Leave the dates and the paperwork to ${bdi(planner.name)}, and whatever needs flexibility and a quick call to ${bdi(flow.name)}.`),
    });
  }

  /* ── أوقات النشاط ─────────────────────────────────── */
  const overlap = hourOverlap(him.hours, her.hours);
  if (overlap !== null && overlap < 35 && him.actions >= 8 && her.actions >= 8) {
    push({
      code: "hours.apart", kind: "friction",
      title: T("بتشتغلوا في المساحة دي في أوقات مختلفة", "You use this space at different hours"),
      why: T(`تطابق أوقات النشاط ${overlap}٪` +
               (him.peakHour !== null && her.peakHour !== null
                 ? ` — ${hisName} أنشط الساعة ${fmtHour(him.peakHour)} و${herName} الساعة ${fmtHour(her.peakHour)}.` : "."),
             `Your active hours overlap ${overlap}%` +
               (him.peakHour !== null && her.peakHour !== null
                 ? ` — ${hisName} peaks at ${fmtHourEn(him.peakHour)} and ${herName} at ${fmtHourEn(her.peakHour)}.` : ".")),
      move: T("خلّوا ربع ساعة مشتركة في الليل تمرّوا فيها على اللي اتغيّر، بدل ما كل واحد يقرا لوحده.",
              "Keep a shared quarter of an hour at night to go over what changed, instead of each reading alone."),
    });
  }
  if (H.energyTime && R.energyTime && H.energyTime !== R.energyTime) {
    push({
      code: "energy.diff", kind: "friction",
      title: T("طاقتكم في وقتين", "Your energy peaks at different times"),
      why: T(`${hisName} أحسن وقته ${traitText("energyTime", H.energyTime)?.ar} و${herName} ${traitText("energyTime", R.energyTime)?.ar}.`,
             `${hisName} is at their best in ${traitText("energyTime", H.energyTime)?.en} and ${herName} in ${traitText("energyTime", R.energyTime)?.en}.`),
      move: T("الكلام المهم ميتقالش في وقت طاقة واحد بس — اختاروا وقت وسط وخلّوه ثابت.",
              "The important conversations should not sit in one person's good hours — pick a middle time and keep it."),
    });
  }

  /* ── الحِمل ───────────────────────────────────────── */
  const init = him.axes.find((a) => a.id === "initiative");
  if (init?.score != null && init.n >= 8) {
    if (init.score >= 70 || init.score <= 30) {
      const heavy = init.score >= 70 ? him : her;
      push({
        code: "load.initiative", kind: "friction",
        title: T(`${bdi(heavy.name)} بيفتح أغلب اللي هنا`, `${bdi(heavy.name)} opens most of what is here`),
        why: init.evidence,
        move: T("اللي بيفتح أقل ياخد باب كامل يبقى مسؤول عنه — مش مهام متفرقة.",
                "Whoever opens less takes one whole area and owns it — not scattered tasks."),
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
      title: T(`${bdi(warm.name)} بيمسك الجانب الشخصي لوحده`,
               `${bdi(warm.name)} carries the personal side alone`),
      why: T(`${bdi(warm.name)}: ${Math.round(careHim > careHer ? careHim : careHer)}٪ من نشاطه شخصي، و${bdi(busy.name)}: ${Math.round(careHim > careHer ? careHer : careHim)}٪.`,
             `${bdi(warm.name)}: ${Math.round(careHim > careHer ? careHim : careHer)}% of their activity is personal; ${bdi(busy.name)}: ${Math.round(careHim > careHer ? careHer : careHim)}%.`),
      move: T(`${bdi(busy.name)} يسجّل ذكرى واحدة الأسبوع ده — مش مهمة، ذكرى.`,
              `${bdi(busy.name)} logs one memory this week — not a task, a memory.`),
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

export function fmtHourEn(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}
