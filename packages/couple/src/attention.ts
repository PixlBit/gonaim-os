import type { PersonKey, Space } from "./types.js";
import type { Attention, Report } from "./analytics.js";
import type { Forecast, Heartbeat } from "./rhythm.js";
import type { SyncReport } from "./sync.js";
import { arDate, arSpan, day, daysBetween } from "./dates.js";
import { money } from "./money.js";
import { T, bdi, enDate, enSpan, enCount } from "./text.js";

/**
 * محرك الانتباه.
 *
 * نفس فلسفة GONAIM//OS: **الصمت حالة نجاح**. لا شيء يظهر هنا لأنه "موجود" —
 * يظهر لأنه يستحق أن يُقاطعكم الآن، ومعه دائمًا سطر "ليه دلوقتي" وخطوة واحدة
 * واضحة. قائمة تنبيهات تظهر كل يوم بنفس المحتوى تتحول إلى خلفية تُتجاهَل،
 * فكل قاعدة هنا مشروطة بوقت أو بعتبة، لا بمجرد وجود بيانات.
 *
 * الترتيب: `now` (قبل أن يفوت) ثم `soon` (هذا الأسبوع) ثم `watch` (للعلم).
 *
 * وكل جملة هنا مكتوبة باللغتين في سطر واحد. ليس ترفًا ولا ترجمة لاحقة:
 * الملاحظة تُبنى مرة على الخادم ويقرأها اثنان قد يقرأ كل منهما بلغة —
 * فلو وُلِّدت بلغة القارئ لاحتاج كل واحد تقريرًا مستقلًا. والفائدة الثانية
 * أن من يعدّل قاعدة يرى ترجمتها أمامه، فلا تظهر أنصاف ترجمات بعد شهر.
 *
 * والعربية هنا مصرية عامية عن قصد — لأنها لغة البيت لا لغة النشرة —
 * والإنجليزية مقابلها في المعنى لا في الحرف: «ده مش توقع، ده حصل» ليست
 * "this is not a forecast, it happened" بل "that already happened".
 */

const ORDER: Record<Attention["level"], number> = { now: 0, soon: 1, watch: 2 };

/**
 * الطبقات التي لا تُحسب من الأرقام وحدها: الأسابيع الجاية، ونبض العلاقة،
 * والفروق بين الاثنين. اختيارية حتى يظل `attend` قابلًا للاستدعاء بالأرقام
 * وحدها في الاختبار.
 */
export interface Depth {
  forecast?: Forecast;
  heartbeat?: Heartbeat;
  sync?: SyncReport;
}

export function attend(space: Space, r: Report, viewer: PersonKey, depth: Depth = {}): Attention[] {
  const out: Attention[] = [];
  const cur = space.settings.currency;
  const toWedding = r.countdown.wedding && !r.countdown.wedding.past
    ? r.countdown.wedding.daysAway : null;
  const push = (a: Attention) => { out.push(a); };
  /** نفس المبلغ بنفس الصيغة في اللغتين: الأرقام لاتينية أصلًا. */
  const m = (n: number) => money(n, cur);

  /* ── الأساس: بلا تاريخ لا يوجد تخطيط ──────────────── */
  if (!r.countdown.wedding) {
    push({
      code: "no_wedding_date", level: "now", screen: "plan",
      title: T("لسه مفيش تاريخ للفرح", "No wedding date yet"),
      why: T("كل حساب هنا — الميزانية والسرعة والجاهزية — بيتقاس على تاريخ. من غيره الأرقام أوصاف مش تخطيط.",
             "Every number here — budget, pace, readiness — is measured against a date. Without one they describe, they do not plan."),
      move: T("حدّدوا التاريخ حتى لو مبدئي", "Set a date, even a provisional one"),
    });
  }
  if (space.settings.budget <= 0) {
    push({
      code: "no_budget", level: "now", screen: "money",
      title: T("الميزانية مش متحددة", "No budget set"),
      why: T("من غير رقم متفق عليه، كل مصروف يبان صغير لوحده والمجموع يفاجئكم في الآخر.",
             "Without one agreed number, each expense looks small on its own and the total surprises you at the end."),
      move: T("اكتبوا رقم واحد تتفقوا عليه", "Write one number you both agree on"),
    });
  }

  /* ── الميزان ─────────────────────────────────────── */
  if (space.settings.budget > 0) {
    if (r.money.spent > space.settings.budget) {
      const over = m(r.money.spent - space.settings.budget);
      push({
        code: "over_budget", level: "now", screen: "money",
        title: T(`تخطّينا الميزانية بـ${over}`, `Over budget by ${over}`),
        why: T("المدفوع فعلًا بقى أكبر من الرقم المتفق عليه — ده مش توقع، ده حصل.",
               "What is already paid exceeds the number you agreed on. That is not a forecast — it happened."),
        move: T("راجعوا الرقم أو الباقي من الكشف", "Revisit the number, or what is left on the list"),
      });
    } else if (r.money.gap > 0) {
      push({
        code: "projected_over", level: "soon", screen: "money",
        title: T(`المتوقع أعلى من الميزانية بـ${m(r.money.gap)}`, `Projected over budget by ${m(r.money.gap)}`),
        why: T(`المدفوع ${m(r.money.spent)} والمخطط الباقي ${m(r.money.committed)} — المجموع يتخطى ${m(space.settings.budget)}.`,
               `${m(r.money.spent)} paid and ${m(r.money.committed)} still planned — together they pass ${m(space.settings.budget)}.`),
        move: T("قلّلوا أولوية عناصر، أو زوّدوا الميزانية بوعي",
                "Drop some items down the list, or raise the budget deliberately"),
      });
    } else if (r.money.projected > space.settings.budget * 0.9 && r.money.projected > 0) {
      push({
        code: "budget_tight", level: "watch", screen: "money",
        title: T("فاضل أقل من ١٠٪ من الميزانية", "Less than 10% of the budget left"),
        why: T(`المتوقع ${m(r.money.projected)} من أصل ${m(space.settings.budget)}.`,
               `${m(r.money.projected)} projected out of ${m(space.settings.budget)}.`),
      });
    }
  }

  if (r.money.unpriced > 0 && r.nest.total > 0) {
    const share = Math.round((r.money.unpriced / r.nest.total) * 100);
    if (share >= 25) {
      push({
        code: "unpriced", level: share >= 60 ? "soon" : "watch", screen: "nest",
        title: T(`${r.money.unpriced} عنصر لسه من غير سعر`, `${enCount(r.money.unpriced, "item")} still have no price`),
        why: T(`يعني ${share}٪ من الكشف خارج الحساب. الرقم اللي شايفينه أقل من الحقيقة، مش مساوي لها.`,
               `That is ${share}% of the list outside the maths. The number you see is lower than the truth, not equal to it.`),
        move: T("حطّوا سعر تقديري حتى لو تقريبي", "Put an estimate in, even a rough one"),
      });
    }
  }

  if (r.money.driftPct >= 15 && r.money.drift > 0) {
    push({
      code: "price_drift", level: "watch", screen: "money",
      title: T(`الأسعار بتطلع أعلى من المتوقع بـ${r.money.driftPct}٪`,
               `Prices are landing ${r.money.driftPct}% above estimate`),
      why: T(`اللي اتشرى كلّف ${m(r.money.drift)} زيادة عن تقديره. باقي الكشف غالبًا هيعمل نفس الحاجة.`,
             `What you have bought cost ${m(r.money.drift)} more than estimated. The rest of the list will likely do the same.`),
      move: T("زوّدوا تقديرات الباقي بنفس النسبة", "Raise the remaining estimates by the same share"),
    });
  }

  if (r.money.runwayWeeks !== null && toWedding !== null && r.money.weeklyBurn > 0) {
    const weeksLeft = toWedding / 7;
    if (r.money.runwayWeeks < weeksLeft) {
      push({
        code: "runway_short", level: "now", screen: "money",
        title: T("معدّل الصرف أسرع من الوقت الباقي", "You are spending faster than the time left"),
        why: T(`بمعدل ${m(Math.round(r.money.weeklyBurn))} في الأسبوع، الباقي يكفي ${Math.round(r.money.runwayWeeks)} أسبوع، والفرح بعد ${Math.round(weeksLeft)}.`,
               `At ${m(Math.round(r.money.weeklyBurn))} a week, what is left lasts ${Math.round(r.money.runwayWeeks)} weeks — and the wedding is ${Math.round(weeksLeft)} away.`),
        move: T("قلّلوا المعدل أو زوّدوا الصندوق", "Slow the rate, or add to the pot"),
      });
    }
  }

  const potGap = r.money.spent - r.money.inPot;
  if (r.money.inPot > 0 && potGap > 0) {
    push({
      code: "pot_short", level: "watch", screen: "money",
      title: T("المصروف أكبر من اللي دخل الصندوق", "Spending exceeds what went into the pot"),
      why: T(`اتصرف ${m(r.money.spent)} ودخل ${m(r.money.inPot)} — الفرق ${m(potGap)} اتدفع من برّا الحساب.`,
             `${m(r.money.spent)} spent against ${m(r.money.inPot)} deposited — ${m(potGap)} came from outside the books.`),
      move: T("سجّلوا الإيداعات الناقصة عشان الرقم يفضل صادق",
              "Log the missing deposits so the number stays honest"),
    });
  }

  /* ── العش ────────────────────────────────────────── */
  if (toWedding !== null && toWedding <= 60 && r.nest.criticalMissing.length > 0) {
    const n = r.nest.criticalMissing.length;
    const names = r.nest.criticalMissing.slice(0, 3).map((i) => bdi(i.name)).join(" · ");
    push({
      code: "critical_missing", level: "now", screen: "nest",
      title: T(`${n} حاجة أساسية لسه ناقصة`, `${enCount(n, "essential")} still missing`),
      why: T(`فاضل ${arSpan(toWedding)} على الفرح، ودول متعلّمين "أساسي" مش كمالي.`,
             `${enSpan(toWedding)} to the wedding, and these are marked essential, not nice-to-have.`),
      move: T(names, names),
    });
  }

  if (!r.nest.hasAddress && r.nest.total > 0) {
    push({
      code: "no_address", level: "watch", screen: "nest",
      title: T("مكان الشقة مش مسجّل", "The flat has no address"),
      why: T("العنوان مش تفصيلة إدارية — هو اللي بيخلي المواعيد والتسليمات في مكان واحد معروف.",
             "An address is not paperwork — it is what puts appointments and deliveries in one known place."),
      move: T("اكتبوا العنوان ولينك الخريطة", "Write the address and a map link"),
    });
  }

  /* ── المهام ──────────────────────────────────────── */
  if (r.missions.overdue.length > 0) {
    const n = r.missions.overdue.length;
    const titles = r.missions.overdue.slice(0, 3).map((t) => bdi(t.title)).join(" · ");
    push({
      code: "overdue", level: "now", screen: "plan",
      title: T(`${n} مهمة فات معادها`, `${enCount(n, "task")} past due`),
      why: T(titles, titles),
      move: T("اعملوها أو غيّروا معادها — المعاد اللي بيعدي وميتغيرش بيفقد معناه",
              "Do them or move them — a deadline that passes and never changes stops meaning anything"),
    });
  }

  if (toWedding !== null && r.missions.finishInWeeks !== null && r.missions.open > 0) {
    const weeksLeft = toWedding / 7;
    if (r.missions.finishInWeeks > weeksLeft) {
      push({
        code: "behind_pace", level: "soon", screen: "plan",
        title: T("السرعة الحالية مش هتوصل للتاريخ", "This pace does not reach the date"),
        why: T(`بتخلّصوا ${r.missions.velocity.toFixed(1)} مهمة في الأسبوع، وفاضل ${r.missions.open} مهمة — يعني ${Math.round(r.missions.finishInWeeks)} أسبوع، والفرح بعد ${Math.round(weeksLeft)}.`,
               `You close ${r.missions.velocity.toFixed(1)} tasks a week with ${r.missions.open} open — that is ${Math.round(r.missions.finishInWeeks)} weeks, against ${Math.round(weeksLeft)} until the wedding.`),
        move: T("شيلوا المؤجَّل أو وزّعوا المهام", "Drop what can wait, or split the load"),
      });
    }
  }

  if (r.missions.velocity === 0 && r.missions.open > 3 && r.missions.done > 0) {
    push({
      code: "stalled", level: "watch", screen: "plan",
      title: T("مفيش مهمة اتقفلت من ٦ أسابيع", "Nothing has closed in six weeks"),
      why: T(`${r.missions.open} مهمة مفتوحة وسرعة الإنجاز وقفت.`,
             `${enCount(r.missions.open, "task")} open and the pace has stopped.`),
      move: T("اقفلوا أصغر مهمة النهارده", "Close the smallest one today"),
    });
  }

  const skew = r.missions.byOwner.him.open + r.missions.byOwner.her.open;
  if (skew >= 6) {
    const hisShare = r.missions.byOwner.him.open / skew;
    if (hisShare >= 0.8 || hisShare <= 0.2) {
      const heavy = bdi(hisShare >= 0.8 ? space.people.him.name : space.people.her.name);
      push({
        code: "load_skew", level: "watch", screen: "plan",
        title: T(`الحِمل كله تقريبًا على ${heavy}`, `Nearly all of it sits on ${heavy}`),
        why: T(`${r.missions.byOwner.him.open} مهمة على ${bdi(space.people.him.name)} و${r.missions.byOwner.her.open} على ${bdi(space.people.her.name)}.`,
               `${r.missions.byOwner.him.open} on ${bdi(space.people.him.name)}, ${r.missions.byOwner.her.open} on ${bdi(space.people.her.name)}.`),
        move: T("وزّعوا تاني — التجهيز مش امتحان فردي", "Split it again — this is not a solo exam"),
      });
    }
  }

  /* ── المواعيد والمحطات ───────────────────────────── */
  for (const a of r.life.upcoming.slice(0, 3)) {
    if (a.daysAway <= 2) {
      push({
        code: `appointment:${a.id}`, level: a.daysAway === 0 ? "now" : "soon", screen: "dates",
        title: a.daysAway === 0 ? T(`النهارده: ${bdi(a.title)}`, `Today: ${bdi(a.title)}`)
          : a.daysAway === 1 ? T(`بكرة: ${bdi(a.title)}`, `Tomorrow: ${bdi(a.title)}`)
            : T(`بعد يومين: ${bdi(a.title)}`, `In two days: ${bdi(a.title)}`),
        why: a.place ? T(`المكان: ${bdi(a.place)}`, `At ${bdi(a.place)}`)
          : T("ميعاد مسجّل في المساحة.", "An appointment on the calendar."),
      });
    }
  }

  const soonMs = r.countdown.all.find((m2) => !m2.done && m2.daysAway >= 0 && m2.daysAway <= 14);
  if (soonMs) {
    push({
      code: `milestone:${soonMs.id}`, level: soonMs.daysAway <= 3 ? "now" : "soon", screen: "plan",
      title: T(`${bdi(soonMs.title)} ${soonMs.when.ar}`, `${bdi(soonMs.title)} ${soonMs.when.en}`),
      why: T(`يوم ${arDate(soonMs.date)}.`, `On ${enDate(soonMs.date)}.`),
    });
  }

  /* ── بينا ────────────────────────────────────────── */
  if (r.life.unreadForMe > 0) {
    push({
      code: "unread_notes", level: "soon", screen: "us",
      title: r.life.unreadForMe === 1
        ? T("في رسالة مقروتش", "One unread note")
        : T(`${r.life.unreadForMe} رسايل مقروتش`, `${r.life.unreadForMe} unread notes`),
      why: T("مستنياك في «بينا».", "Waiting for you in “Between us”."),
    });
  }

  if (r.life.capsuleReady > 0) {
    push({
      code: "capsule_ready", level: "now", screen: "us",
      title: r.life.capsuleReady === 1
        ? T("في رسالة جه ميعاد فتحها", "A sealed letter is due to open")
        : T(`${r.life.capsuleReady} رسايل جه ميعاد فتحها`, `${r.life.capsuleReady} sealed letters are due to open`),
      why: T("اتكتبت زمان عشان تتقري النهارده بالذات.",
             "Written a while ago to be read on this day in particular."),
      move: T("افتحوها مع بعض", "Open it together"),
    });
  }

  const staleDecision = space.decisions.find(
    (d) => !d.resolvedAt && daysBetween(day(d.createdAt), r.today) >= 7,
  );
  if (staleDecision) {
    const mine = staleDecision.votes[viewer];
    const age = daysBetween(day(staleDecision.createdAt), r.today);
    push({
      code: `decision:${staleDecision.id}`, level: "watch", screen: "us",
      title: T(`قرار مفتوح من ${arSpan(age)}`, `A decision open for ${enSpan(age)}`),
      why: T(bdi(staleDecision.question), bdi(staleDecision.question)),
      move: mine
        ? T("مستني رأي الطرف التاني", "Waiting on the other of you")
        : T("صوّت عشان يتقفل", "Cast your vote and close it"),
    });
  }

  if (r.life.lastMemoryDaysAgo !== null && r.life.lastMemoryDaysAgo >= 30) {
    push({
      code: "memory_gap", level: "watch", screen: "memories",
      title: T(`${arSpan(r.life.lastMemoryDaysAgo)} من غير ذكرى متسجّلة`,
               `${enSpan(r.life.lastMemoryDaysAgo)} without a memory logged`),
      why: T("التجهيز بياخد المساحة كلها، والفترة دي هي اللي هتتفتكر بعدين مش الفواتير.",
             "The preparations take all the room, and this is the stretch you will remember later — not the invoices."),
      move: T("سجّلوا أي حاجة حصلت الأسبوع ده", "Write down anything from this week"),
    });
  }

  if (space.settings.together) {
    const days = daysBetween(space.settings.together, r.today);
    // الشهرية والسنوية: نافذة يوم واحد، فلا تتحول التهنئة إلى خلفية دائمة
    if (days > 0 && days % 365 === 0) {
      push({
        code: "anniversary", level: "now", screen: "memories",
        title: T(`النهارده بقالكم ${arSpan(days)}`, `Today makes it ${enSpan(days)}`),
        why: T(`من ${arDate(space.settings.together)}.`, `Since ${enDate(space.settings.together)}.`),
        move: T("سجّلوا ذكرى لليوم ده", "Log a memory for today"),
      });
    }
  }

  /* ── الأسابيع الجاية ─────────────────────────────── */
  const peak = depth.forecast?.peak;
  if (peak) {
    const cap = Math.round(depth.forecast?.capacity ?? 0);
    push({
      code: `peak:${peak.week}`, level: "soon", screen: "signal",
      title: T(`أسبوع ${peak.label.ar} هيبقى ضاغط`, `The week of ${peak.label.en} will be heavy`),
      why: T(`${bdi(peak.note.ar)} — فوق سعتكم المقاسة (${cap} حاجة في الأسبوع).`,
             `${bdi(peak.note.en)} — above your measured capacity (${cap} a week).`),
      move: T("قدّموا اللي يتقدّم دلوقتي، والباقي أجّلوه لأسبوع أهدى.",
              "Pull forward what can move now, and push the rest to a quieter week."),
    });
  }
  const calm = depth.forecast?.calm;
  if (calm && calm.score <= 25 && peak) {
    push({
      code: `calm:${calm.week}`, level: "watch", screen: "signal",
      title: T(`أسبوع ${calm.label.ar} فاضي`, `The week of ${calm.label.en} is clear`),
      why: T("أهدى أسبوع في الشهرين الجايين، وملوش محطة.",
             "The calmest week in the next two months, with no milestone in it."),
      move: T("احجزوا فيه ليلة ليكم إنتوا — قبل ما حاجة تاخده.",
              "Book a night for yourselves in it, before something else takes it."),
    });
  }

  /* ── نبض العلاقة ─────────────────────────────────── */
  const hb = depth.heartbeat;
  if (hb && hb.verdict === "cold" && (hb.careShare ?? 0) >= 0) {
    push({
      code: "heart_cold", level: "soon", screen: "persona",
      title: T("التجهيز واخد المساحة كلها", "The preparations have taken all the room"),
      why: T(hb.line.ar + (hb.sinceCare !== null ? ` وآخر حاجة شخصية اتسجّلت من ${arSpan(hb.sinceCare)}.` : ""),
             hb.line.en + (hb.sinceCare !== null ? ` The last personal thing logged was ${enSpan(hb.sinceCare)} ago.` : "")),
      move: T("حاجة واحدة صغيرة الأسبوع ده: ذكرى، أو رسالة، أو حاجة من قايمة «نعملها».",
              "One small thing this week: a memory, a note, or something off your list."),
    });
  }

  /* ── الأنماط ─────────────────────────────────────── */
  const sync = depth.sync;
  if (sync && sync.declared.him + sync.declared.her === 0 && space.log.length > 12) {
    push({
      code: "persona_blank", level: "watch", screen: "persona",
      title: T("لسه محدش كتب أنماطه", "Neither of you has filled in your patterns"),
      why: T("سبع اختيارات لكل واحد — منها بيتقري الاختلاف اللي بيسبب أغلب الاحتكاك.",
             "Seven choices each — enough to read the differences behind most of the friction."),
      move: T("خمس دقايق لكل واحد، مرة واحدة.", "Five minutes each, once."),
    });
  }
  const friction = sync?.insights.find((i) => i.kind === "friction");
  if (friction && sync && sync.declared.him > 0 && sync.declared.her > 0) {
    push({
      code: `sync:${friction.code}`, level: "watch", screen: "persona",
      title: friction.title,
      why: friction.why,
      ...(friction.move === undefined ? {} : { move: friction.move }),
    });
  }

  return out.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}
