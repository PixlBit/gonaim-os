import type { PersonKey, Space, Wish } from "./types.js";
import type { Forecast, Heartbeat } from "./rhythm.js";
import { addDays, arDayDate, arSpan, day, daysBetween, weekKey } from "./dates.js";
import { T, bdi, enDayDate, enSpan, type Text } from "./text.js";

/**
 * ليلتنا.
 *
 * كل تطبيق ثنائي يعرف أن يقول «اخرجوا مع بعض». وهذه جملة بلا قيمة، لأنها
 * تُقال في الأسبوع المزدحم والفاضي بنفس النبرة، فتُقرأ مرة وتُتجاهل بعدها.
 *
 * ما يفعله هذا الملف مختلف: لا يقترح **أن** تخرجا، بل يقترح **ليلة بعينها**
 * ومعها الدليل على أنها الليلة الصحيحة — ويأخذ الأمنية من قائمتكم لا من
 * خياله. فالجملة تصير:
 *
 *   «الخميس ٢٣ أكتوبر. أهدى أسبوع في الشهرين الجايين (١٨٪ ضغط مقابل ٧٤٪
 *    في أزحم أسبوع)، ومفيش عندكم حاجة فيه. ونور كاتبة من ٤ شهور إنها نفسها
 *    تتعشّوا على النيل.»
 *
 * ثلاثة قرارات تصنع الفرق:
 *
 * **أولًا، الليلة تُنتقى من توقّع مقاس لا من تقويم فاضٍ.** الأسبوع الهادئ
 * يجيء من `forecast.calm` — أي مقسومًا على سعتكم الحقيقية. أسبوع بثلاث
 * مهام هادئ لمن ينجز عشرًا، ومزدحم لمن ينجز اثنتين.
 *
 * **ثانيًا، الخميس.** ليس يومًا عشوائيًا من الأسبوع الهادئ: في مصر ليلة
 * الجمعة هي ليلة الخروج، فمن يقترح ثلاثاء يقترح شيئًا لن يحدث. وإن كان
 * الخميس مشغولًا جُرِّبت الجمعة ثم السبت ثم بقية الأيام — والمشغول هنا
 * تعريفه دقيق: فيه ميعاد، أو فيه مهمة مستحقة، أو مضى.
 *
 * **ثالثًا، الأمنية تُؤخَذ من الطرف الآخر.** حين تفتح أنت المنصة تقترح
 * عليك أمنيةً **هي** كتبتها وطال انتظارها. وهذا هو بيت القصيد كله: أن
 * يسمع كلٌّ منكما ما قاله الآخر يوم قاله، لا يوم يتذكّره. المنصة هنا ليست
 * تنظّم وقتكم، بل تحمل عن كلٍّ منكما ذاكرةَ رغبةِ الآخر.
 *
 * وكل هذا صامت حتى يصحّ: لا أسبوع هادئ مقاس → لا اقتراح. لأن اقتراحًا بلا
 * دليل هو بالضبط الجملة التي بدأنا بأنها بلا قيمة.
 */

export type NightBasis = "calm-week";

export interface NightPlan {
  /** التاريخ المقترح — YYYY-MM-DD. */
  date: string;
  /** يوم الأسبوع باللغتين: «الخميس ٢٣ أكتوبر». */
  when: Text;
  /** ساعة مقترحة (محلية) — تُملأ في الميعاد ويمكن تغييرها. */
  at: string;
  /** الأمنية المختارة، إن وُجدت. الليلة تصحّ بلا أمنية، والأمنية تزيّنها. */
  wish: { id: string; title: string; by: PersonKey; waitingDays: number } | null;
  /** العنوان الجاهز للميعاد — اضغطة واحدة تصنعه. */
  title: Text;
  /** الدليل: لماذا هذه الليلة بالذات. سطر لكل سبب. */
  why: Text[];
  basis: NightBasis;
}

/** أمنيات تُنفَّذ في ليلة. «سفر» و«عادة» و«شراء» ليست ليلة. */
const NIGHT_KINDS = new Set(["date", "experience"]);

/**
 * ترتيب الأفضلية داخل الأسبوع، بالإزاحة عن إثنينه (`weekKey` يعيد الإثنين).
 *
 * الخميس أولًا لأن ليلته هي ليلة الجمعة، ثم الجمعة والسبت — عطلة الأسبوع
 * في مصر. والإثنين والثلاثاء آخر القائمة: ليلة يتبعها يوم شغل ليست ليلة.
 */
const DAY_ORDER = [3, 4, 5, 6, 2, 1, 0];   // خ ج س ح ر ث ن

export function nightPlan(
  space: Space,
  todayStr: string,
  viewer: PersonKey,
  depth: { forecast: Forecast; heartbeat: Heartbeat },
): NightPlan | null {
  const calm = depth.forecast.calm;
  if (!calm) return null;

  // أسبوع هادئ نسبةً إلى غيره لا مطلقًا: لو الأسابيع كلها مزدحمة فلا ليلة،
  // واقتراحها يكون كذبًا مهذّبًا.
  if (calm.score > 55) return null;

  const date = pickNight(space, calm.week, todayStr);
  if (!date) return null;

  const wish = pickWish(space, todayStr, viewer);

  const peak = depth.forecast.peak;
  const why: Text[] = [];

  why.push(peak
    ? T(`أهدى أسبوع في الشهرين الجايين — ضغطه ${calm.score}٪ مقابل ${peak.score}٪ في أزحمهم.`,
        `The calmest week in the next two months — ${calm.score}% load against ${peak.score}% at the peak.`)
    : T(`أهدى أسبوع في الشهرين الجايين — ضغطه ${calm.score}٪ من سعتكم.`,
        `The calmest week in the next two months — ${calm.score}% of your capacity.`));

  why.push(T(`${arDayDate(date)} صافي: لا ميعاد ولا مهمة مستحقة.`,
             `${enDayDate(date)} is clear: no appointment, nothing due.`));

  const since = depth.heartbeat.sinceCare;
  if (since !== null && since >= 14) {
    why.push(T(`وبقالكم ${arSpan(since)} من غير حاجة تخصّكم إنتوا.`,
               `And it has been ${enSpan(since)} since anything was just about the two of you.`));
  }

  if (wish) {
    // الاسم يُعزَل: قد يكون بالعربية داخل جملة إنجليزية أو العكس
    const who = bdi(space.people[wish.by].name);
    why.push(T(`${who} كاتباها من ${arSpan(wish.waitingDays)} ولسه ما اتعملتش.`,
               `${who} wrote it ${enSpan(wish.waitingDays)} ago and it is still waiting.`));
  }

  return {
    date,
    when: T(arDayDate(date), enDayDate(date)),
    at: `${date}T20:00`,
    wish,
    // العنوان يذهب إلى حقل الميعاد كما هو (بيانات)، فلا يُعزَل هنا —
    // العزل للجمل التي تحيط باسم، لا للاسم وحده في حقله.
    title: wish
      ? T(wish.title, wish.title)
      : T("ليلتنا", "Our night"),
    why,
    basis: "calm-week",
  };
}

/**
 * أول ليلة صالحة في الأسبوع الهادئ.
 *
 * «صالحة» = لم تمضِ، ولا ميعاد فيها، ولا مهمة مستحقة — لأن ليلة فوق يوم
 * تسليم ليست ليلة، هي مهمة إضافية.
 */
function pickNight(space: Space, week: string, todayStr: string): string | null {
  const busy = new Set<string>([
    ...space.appointments.filter((a) => a.status === "planned").map((a) => day(a.at)),
    ...space.tasks.flatMap((t) => (t.status !== "done" && t.due !== undefined ? [t.due] : [])),
    ...space.milestones.filter((m) => !m.done).map((m) => m.date),
  ]);

  for (const offset of DAY_ORDER) {
    const date = addDays(week, offset);
    if (date <= todayStr) continue;          // اليوم نفسه متأخر على اقتراح ليلة
    if (busy.has(date)) continue;
    if (weekKey(date) !== week) continue;    // حرصًا: لا نخرج من الأسبوع المقصود
    return date;
  }
  return null;
}

/**
 * الأمنية: من الطرف الآخر أولًا، والأطول انتظارًا أولًا.
 *
 * ولو لم يكتب الطرف الآخر شيئًا صالحًا، تُؤخذ من أمنيات القارئ نفسه —
 * فالغرض أن تحدث الليلة، لا أن تُهدر لأن أحدهما لم يكتب.
 */
function pickWish(space: Space, todayStr: string, viewer: PersonKey): NightPlan["wish"] {
  const other: PersonKey = viewer === "him" ? "her" : "him";

  const open = space.wishes.filter((w) => w.status === "someday" && NIGHT_KINDS.has(w.kind));
  if (open.length === 0) return null;

  const oldestOf = (list: Wish[]): Wish | null =>
    list.reduce<Wish | null>((best, w) => (best === null || w.createdAt < best.createdAt ? w : best), null);

  const chosen = oldestOf(open.filter((w) => w.by === other)) ?? oldestOf(open);
  if (!chosen) return null;

  return {
    id: chosen.id,
    title: chosen.title,
    by: chosen.by,
    waitingDays: Math.max(0, daysBetween(day(chosen.createdAt), todayStr)),
  };
}
