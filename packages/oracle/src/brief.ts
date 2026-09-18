import type { FullReport, Memory, PersonKey, Space } from "@gonaim/couple";
import { arDate, arSpan, fmt, traitText, type ChoiceTrait } from "@gonaim/couple";

/**
 * البريف — ما يخرج من المساحة إلى نموذج خارجي.
 *
 * هذا الملف هو **الحد**. كل ما يمر إلى الشبكة يُبنى هنا، حتميًا، من هذه
 * الدوال وحدها؛ ولا يوجد مسار آخر. وثلاث قواعد تحكمه:
 *
 *  1. **يُعرض قبل أن يُرسَل.** النص الذي يُبنى هنا هو بعينه ما تراه على
 *     الشاشة قبل الضغط على "ابعت". لا نسخة مختصرة للعرض وأخرى كاملة
 *     للإرسال — وهذا وحده ما يجعل الجملة "إنت شايف اللي بيتبعت" صادقة.
 *  2. **لا يخرج ما لا يلزم.** نصوص الكبسولات، والرسائل بينكما، وبصمات
 *     كلمات السر، ومعرّفات الدخول، وروابط الخريطة — لا تدخل أي بريف.
 *     ليست إعدادًا يُغيَّر: لا يوجد كود يضعها هنا.
 *  3. **العميل لا يكتب البريف.** الخادم يعيد بناءه من نفس المساحة قبل
 *     كل نداء. المتصفح يطلب "نوعًا"، لا نصًا — فلا يستطيع أحد أن يحقن
 *     تعليمات في الطلب.
 */

export type OracleKind = "letter" | "advice" | "gift" | "week" | "story";

export interface Brief {
  kind: OracleKind;
  /** التعليمات الثابتة للنموذج — تُعرض أيضًا، فلا شيء مخفي. */
  system: string;
  /** الوقائع المرسلة. هذا ما يراه المستخدم حرفيًا. */
  text: string;
  /** عنوان عربي للنوع. */
  title: string;
  /** ما لم يُرسَل — يُعرض بجوار البريف. */
  withheld: string[];
}

const NEVER = [
  "نصوص الرسايل اللي بينكم",
  "نصوص الكبسولات المقفولة",
  "كلمات السر ومعرّفات الدخول",
  "عنوان الشقة ولينك الخريطة",
];

const VOICE = `اكتب بالعامية المصرية، بضمير المخاطَب للاتنين.
ممنوع: المبالغة، الكلام الإنشائي، الوعظ، والإيموچي.
ممنوع اختراع أي واقعة مش مكتوبة تحت. لو ناقصك تفصيلة، سيبها.
اكتب زي صاحب بيتكلم، مش زي تطبيق.`;

const SYSTEMS: Record<OracleKind, string> = {
  letter: `إنت بتكتب رسالة قصيرة لاتنين بيجهزوا لجوازهم، عن الشهر اللي فات في حياتهم.
الوقايع اللي تحت هي كل اللي حصل. اكتب من 120 لـ180 كلمة.
خلي آخر سطر حاجة يفتكروها بعد سنين، من الوقايع نفسها مش من عندك.
${VOICE}`,

  advice: `إنت بتقرا فروق معلنة بين اتنين (كل واحد كتبها بنفسه) وأرقام من سلوكهم الحقيقي.
اكتب 3 خطوات عملية بس، كل خطوة سطرين بحد أقصى، وكل واحدة مربوطة بفرق أو رقم موجود تحت.
ممنوع تقييم مين صح ومين غلط. الفرق مش عيب.
${VOICE}`,

  gift: `اقترح 5 أفكار هدايا أو خروجات لشريك واحد بعينه، مبنية على اللي كتبه عن نفسه وعلى قايمة الحاجات اللي نفسه يعملها.
كل فكرة سطر واحد، ومعاها ليه هي مناسبة ليه هو بالذات.
خد بالك من الميزانية المذكورة لو موجودة.
${VOICE}`,

  week: `رتّب أسبوعهم الجاي من المهام والمواعيد اللي تحت.
اطلع بخطة يوم بيوم مختصرة، وحدّد أهم حاجتين لازم يخلصوا، وسيب مساحة فاضية مقصودة.
ممنوع تزوّد مهام مش مكتوبة.
${VOICE}`,

  story: `حوّل الذكرى اللي تحت لحكاية قصيرة (80-140 كلمة) تتقري في ألبوم بعد سنين.
استعمل التفاصيل المكتوبة بس. لو الحكاية سطر واحد، اكتب حواليه من غير ما تخترع وقايع.
${VOICE}`,
};

const TITLES: Record<OracleKind, string> = {
  letter: "رسالة الشهر",
  advice: "نصيحة من أنماطنا",
  gift: "أفكار ليها/ليه",
  week: "ترتيب الأسبوع",
  story: "احكي الذكرى",
};

export interface BriefInput {
  space: Space;
  report: FullReport;
  viewer: PersonKey;
  kind: OracleKind;
  /** لـ`story` — معرّف الذكرى. */
  targetId?: string;
}

export function buildBrief(input: BriefInput): Brief {
  const { space, report, viewer, kind } = input;
  const other: PersonKey = viewer === "him" ? "her" : "him";
  const cur = space.settings.currency;
  const lines: string[] = [];

  const head = () => {
    lines.push(`الاتنين: ${space.people.him.name} و${space.people.her.name}.`);
    if (report.countdown.wedding) {
      lines.push(`الفرح: ${arDate(report.countdown.wedding.date)} (${report.countdown.wedding.when}).`);
    }
    if (space.settings.together) {
      lines.push(`مع بعض من: ${arDate(space.settings.together)}.`);
    }
  };

  switch (kind) {
    case "letter": {
      head();
      lines.push("");
      lines.push("اللي حصل آخر شهر:");
      for (const entry of space.log.slice(0, 22)) {
        lines.push(`- ${arDate(entry.at)}: ${entry.summary}`);
      }
      const recent = space.memories.slice(0, 4);
      if (recent.length > 0) {
        lines.push("");
        lines.push("ذكريات متسجّلة:");
        for (const m of recent) lines.push(`- ${arDate(m.date)}: ${m.title}${m.place ? ` — ${m.place}` : ""}`);
      }
      lines.push("");
      lines.push(`أرقام: اتصرف ${fmt(report.money.spent)} ${cur} · جاهزية العش ${report.nest.readiness}٪ · ` +
        `${report.missions.done} مهمة خلصت و${report.missions.open} لسه.`);
      break;
    }

    case "advice": {
      head();
      lines.push("");
      lines.push(declaredBlock(space, "him"));
      lines.push(declaredBlock(space, "her"));
      lines.push("");
      lines.push("فروق ملاحَظة من السلوك:");
      for (const i of report.sync.insights.slice(0, 5)) {
        lines.push(`- [${i.kind === "friction" ? "احتكاك" : i.kind === "complement" ? "تكامل" : "تشابه"}] ${i.title}: ${i.why}`);
      }
      if (report.sync.balance !== null) lines.push(`- توازن الحِمل: ${report.sync.balance}/100.`);
      if (report.heartbeat.careShare !== null) {
        lines.push(`- ${report.heartbeat.careShare}٪ من نشاطهم آخر شهرين كان شخصي، الباقي تجهيز.`);
      }
      break;
    }

    case "gift": {
      const them = space.people[other];
      lines.push(`الشريك: ${them.name}.`);
      lines.push(declaredBlock(space, other));
      const wishes = space.wishes.filter((w) => w.by === other && w.status !== "done");
      if (wishes.length > 0) {
        lines.push("");
        lines.push("حاجات نفسه/نفسها يعملها:");
        for (const w of wishes.slice(0, 8)) lines.push(`- ${w.title}`);
      }
      if (space.settings.budget > 0) {
        lines.push("");
        lines.push(`ملاحظة ميزانية: فاضل من ميزانية الجواز ${fmt(Math.max(0, report.money.left))} ${cur}.`);
      }
      break;
    }

    case "week": {
      head();
      const week = report.forecast.weeks[0];
      lines.push("");
      lines.push(`ضغط الأسبوع الجاي: ${week?.score ?? 0}/100 (${week?.note ?? "—"}).`);
      const due = [...report.missions.overdue, ...report.missions.dueSoon];
      if (due.length > 0) {
        lines.push("");
        lines.push("مهام عليها ميعاد:");
        for (const t of due.slice(0, 10)) {
          lines.push(`- ${t.title} — ${t.due ? arDate(t.due) : "بلا ميعاد"} — على ${owner(space, t.owner)}` +
            (t.priority === 1 ? " — أساسية" : ""));
        }
      }
      if (report.life.upcoming.length > 0) {
        lines.push("");
        lines.push("مواعيد:");
        for (const a of report.life.upcoming) lines.push(`- ${a.title} — بعد ${arSpan(a.daysAway)}`);
      }
      if (report.nest.criticalMissing.length > 0) {
        lines.push("");
        lines.push(`حاجات أساسية ناقصة: ${report.nest.criticalMissing.slice(0, 8).map((i) => i.name).join("، ")}.`);
      }
      break;
    }

    case "story": {
      const memory = pickMemory(space, input.targetId);
      if (!memory) {
        lines.push("مفيش ذكرى مختارة.");
        break;
      }
      lines.push(`اليوم: ${arDate(memory.date)}.`);
      if (memory.place) lines.push(`المكان: ${memory.place}.`);
      lines.push(`العنوان: ${memory.title}.`);
      lines.push(`اللي مكتوب: ${memory.story ?? "—"}`);
      lines.push(`كاتبها: ${space.people[memory.by].name}.`);
      break;
    }
  }

  return {
    kind,
    system: SYSTEMS[kind],
    text: lines.join("\n").trim(),
    title: TITLES[kind],
    withheld: NEVER,
  };
}

function declaredBlock(space: Space, key: PersonKey): string {
  const p = space.people[key];
  const t = p.traits ?? {};
  const choices: ChoiceTrait[] = ["loveLanguage", "decisionStyle", "stressStyle", "energyTime", "conflict", "planning", "money"];
  const said = choices
    .flatMap((c) => {
      const text = traitText(c, t[c]);
      return text ? [`${c}: ${text}`] : [];
    });
  const free = [
    t.joy ? `بيفرحه: ${t.joy}` : null,
    t.friction ? `بيضايقه: ${t.friction}` : null,
    t.recharge ? `بيشحن طاقته بـ: ${t.recharge}` : null,
  ].filter(Boolean) as string[];

  if (said.length === 0 && free.length === 0) return `${p.name}: لسه ما كتبش حاجة عن نفسه.`;
  return `${p.name} قال عن نفسه — ${[...said, ...free].join(" · ")}.`;
}

function owner(space: Space, actor: "him" | "her" | "both"): string {
  return actor === "both" ? "الاتنين" : space.people[actor].name;
}

function pickMemory(space: Space, id?: string): Memory | undefined {
  return id ? space.memories.find((m) => m.id === id) : space.memories[0];
}
