import type { PersonKey, Space } from "./types.js";
import type { Attention, Report } from "./analytics.js";
import type { Forecast, Heartbeat } from "./rhythm.js";
import type { SyncReport } from "./sync.js";
import { arDate, arSpan, day, daysBetween } from "./dates.js";
import { money } from "./money.js";

/**
 * محرك الانتباه.
 *
 * نفس فلسفة GONAIM//OS: **الصمت حالة نجاح**. لا شيء يظهر هنا لأنه "موجود" —
 * يظهر لأنه يستحق أن يُقاطعكم الآن، ومعه دائمًا سطر "ليه دلوقتي" وخطوة واحدة
 * واضحة. قائمة تنبيهات تظهر كل يوم بنفس المحتوى تتحول إلى خلفية تُتجاهَل،
 * فكل قاعدة هنا مشروطة بوقت أو بعتبة، لا بمجرد وجود بيانات.
 *
 * الترتيب: `now` (قبل أن يفوت) ثم `soon` (هذا الأسبوع) ثم `watch` (للعلم).
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

  /* ── الأساس: بلا تاريخ لا يوجد تخطيط ──────────────── */
  if (!r.countdown.wedding) {
    push({
      code: "no_wedding_date", level: "now", screen: "plan",
      title: "لسه مفيش تاريخ للفرح",
      why: "كل حساب هنا — الميزانية والسرعة والجاهزية — بيتقاس على تاريخ. من غيره الأرقام أوصاف مش تخطيط.",
      move: "حدّدوا التاريخ حتى لو مبدئي",
    });
  }
  if (space.settings.budget <= 0) {
    push({
      code: "no_budget", level: "now", screen: "money",
      title: "الميزانية مش متحددة",
      why: "من غير رقم متفق عليه، كل مصروف يبان صغير لوحده والمجموع يفاجئكم في الآخر.",
      move: "اكتبوا رقم واحد تتفقوا عليه",
    });
  }

  /* ── الفلوس ──────────────────────────────────────── */
  if (space.settings.budget > 0) {
    if (r.money.spent > space.settings.budget) {
      push({
        code: "over_budget", level: "now", screen: "money",
        title: `تخطّينا الميزانية بـ${money(r.money.spent - space.settings.budget, cur)}`,
        why: "المدفوع فعلًا بقى أكبر من الرقم المتفق عليه — ده مش توقع، ده حصل.",
        move: "راجعوا الرقم أو الباقي من الكشف",
      });
    } else if (r.money.gap > 0) {
      push({
        code: "projected_over", level: "soon", screen: "money",
        title: `المتوقع أعلى من الميزانية بـ${money(r.money.gap, cur)}`,
        why: `المدفوع ${money(r.money.spent, cur)} والمخطط الباقي ${money(r.money.committed, cur)} — المجموع يتخطى ${money(space.settings.budget, cur)}.`,
        move: "قلّلوا أولوية عناصر، أو زوّدوا الميزانية بوعي",
      });
    } else if (r.money.projected > space.settings.budget * 0.9 && r.money.projected > 0) {
      push({
        code: "budget_tight", level: "watch", screen: "money",
        title: "فاضل أقل من ١٠٪ من الميزانية",
        why: `المتوقع ${money(r.money.projected, cur)} من أصل ${money(space.settings.budget, cur)}.`,
      });
    }
  }

  if (r.money.unpriced > 0 && r.nest.total > 0) {
    const share = Math.round((r.money.unpriced / r.nest.total) * 100);
    if (share >= 25) {
      push({
        code: "unpriced", level: share >= 60 ? "soon" : "watch", screen: "nest",
        title: `${r.money.unpriced} عنصر لسه من غير سعر`,
        why: `يعني ${share}٪ من الكشف خارج الحساب. الرقم اللي شايفينه أقل من الحقيقة، مش مساوي لها.`,
        move: "حطّوا سعر تقديري حتى لو تقريبي",
      });
    }
  }

  if (r.money.driftPct >= 15 && r.money.drift > 0) {
    push({
      code: "price_drift", level: "watch", screen: "money",
      title: `الأسعار بتطلع أعلى من المتوقع بـ${r.money.driftPct}٪`,
      why: `اللي اتشرى كلّف ${money(r.money.drift, cur)} زيادة عن تقديره. باقي الكشف غالبًا هيعمل نفس الحاجة.`,
      move: "زوّدوا تقديرات الباقي بنفس النسبة",
    });
  }

  if (r.money.runwayWeeks !== null && toWedding !== null && r.money.weeklyBurn > 0) {
    const weeksLeft = toWedding / 7;
    if (r.money.runwayWeeks < weeksLeft) {
      push({
        code: "runway_short", level: "now", screen: "money",
        title: "معدّل الصرف أسرع من الوقت الباقي",
        why: `بمعدل ${money(Math.round(r.money.weeklyBurn), cur)} في الأسبوع، الباقي يكفي ${Math.round(r.money.runwayWeeks)} أسبوع، والفرح بعد ${Math.round(weeksLeft)}.`,
        move: "قلّلوا المعدل أو زوّدوا الصندوق",
      });
    }
  }

  const potGap = r.money.spent - r.money.inPot;
  if (r.money.inPot > 0 && potGap > 0) {
    push({
      code: "pot_short", level: "watch", screen: "money",
      title: "المصروف أكبر من اللي دخل الصندوق",
      why: `اتصرف ${money(r.money.spent, cur)} ودخل ${money(r.money.inPot, cur)} — الفرق ${money(potGap, cur)} اتدفع من برّا الحساب.`,
      move: "سجّلوا الإيداعات الناقصة عشان الرقم يفضل صادق",
    });
  }

  /* ── الشقة ───────────────────────────────────────── */
  if (toWedding !== null && toWedding <= 60 && r.nest.criticalMissing.length > 0) {
    push({
      code: "critical_missing", level: "now", screen: "nest",
      title: `${r.nest.criticalMissing.length} حاجة أساسية لسه ناقصة`,
      why: `فاضل ${arSpan(toWedding)} على الفرح، ودول متعلّمين "أساسي" مش كمالي.`,
      move: r.nest.criticalMissing.slice(0, 3).map((i) => i.name).join(" · "),
    });
  }

  if (!r.nest.hasAddress && r.nest.total > 0) {
    push({
      code: "no_address", level: "watch", screen: "nest",
      title: "مكان الشقة مش مسجّل",
      why: "العنوان مش تفصيلة إدارية — هو اللي بيخلي المواعيد والتسليمات في مكان واحد معروف.",
      move: "اكتبوا العنوان ولينك الخريطة",
    });
  }

  /* ── المهام ──────────────────────────────────────── */
  if (r.missions.overdue.length > 0) {
    push({
      code: "overdue", level: "now", screen: "plan",
      title: `${r.missions.overdue.length} مهمة فات معادها`,
      why: r.missions.overdue.slice(0, 3).map((t) => t.title).join(" · "),
      move: "اعملوها أو غيّروا معادها — المعاد اللي بيعدي وميتغيرش بيفقد معناه",
    });
  }

  if (toWedding !== null && r.missions.finishInWeeks !== null && r.missions.open > 0) {
    const weeksLeft = toWedding / 7;
    if (r.missions.finishInWeeks > weeksLeft) {
      push({
        code: "behind_pace", level: "soon", screen: "plan",
        title: "السرعة الحالية مش هتوصل للتاريخ",
        why: `بتخلّصوا ${r.missions.velocity.toFixed(1)} مهمة في الأسبوع، وفاضل ${r.missions.open} مهمة — يعني ${Math.round(r.missions.finishInWeeks)} أسبوع، والفرح بعد ${Math.round(weeksLeft)}.`,
        move: "شيلوا المؤجَّل أو وزّعوا المهام",
      });
    }
  }

  if (r.missions.velocity === 0 && r.missions.open > 3 && r.missions.done > 0) {
    push({
      code: "stalled", level: "watch", screen: "plan",
      title: "مفيش مهمة اتقفلت من ٦ أسابيع",
      why: `${r.missions.open} مهمة مفتوحة وسرعة الإنجاز وقفت.`,
      move: "اقفلوا أصغر مهمة النهارده",
    });
  }

  const skew = r.missions.byOwner.him.open + r.missions.byOwner.her.open;
  if (skew >= 6) {
    const hisShare = r.missions.byOwner.him.open / skew;
    if (hisShare >= 0.8 || hisShare <= 0.2) {
      const heavy = hisShare >= 0.8 ? space.people.him.name : space.people.her.name;
      push({
        code: "load_skew", level: "watch", screen: "plan",
        title: `الحِمل كله تقريبًا على ${heavy}`,
        why: `${r.missions.byOwner.him.open} مهمة على ${space.people.him.name} و${r.missions.byOwner.her.open} على ${space.people.her.name}.`,
        move: "وزّعوا تاني — التجهيز مش امتحان فردي",
      });
    }
  }

  /* ── المواعيد والمحطات ───────────────────────────── */
  for (const a of r.life.upcoming.slice(0, 3)) {
    if (a.daysAway <= 2) {
      push({
        code: `appointment:${a.id}`, level: a.daysAway === 0 ? "now" : "soon", screen: "dates",
        title: a.daysAway === 0 ? `النهارده: ${a.title}` : a.daysAway === 1 ? `بكرة: ${a.title}` : `بعد يومين: ${a.title}`,
        why: a.place ? `المكان: ${a.place}` : "ميعاد مسجّل في المساحة.",
      });
    }
  }

  const soonMs = r.countdown.all.find((m) => !m.done && m.daysAway >= 0 && m.daysAway <= 14);
  if (soonMs) {
    push({
      code: `milestone:${soonMs.id}`, level: soonMs.daysAway <= 3 ? "now" : "soon", screen: "plan",
      title: `${soonMs.title} ${soonMs.when}`,
      why: `يوم ${arDate(soonMs.date)}.`,
    });
  }

  /* ── بينا ────────────────────────────────────────── */
  if (r.life.unreadForMe > 0) {
    push({
      code: "unread_notes", level: "soon", screen: "us",
      title: r.life.unreadForMe === 1 ? "في رسالة مقروتش" : `${r.life.unreadForMe} رسايل مقروتش`,
      why: "مستنياك في «بينا».",
    });
  }

  if (r.life.capsuleReady > 0) {
    push({
      code: "capsule_ready", level: "now", screen: "us",
      title: r.life.capsuleReady === 1 ? "في رسالة جه ميعاد فتحها" : `${r.life.capsuleReady} رسايل جه ميعاد فتحها`,
      why: "اتكتبت زمان عشان تتقري النهارده بالذات.",
      move: "افتحوها مع بعض",
    });
  }

  const staleDecision = space.decisions.find(
    (d) => !d.resolvedAt && daysBetween(day(d.createdAt), r.today) >= 7,
  );
  if (staleDecision) {
    const mine = staleDecision.votes[viewer];
    push({
      code: `decision:${staleDecision.id}`, level: "watch", screen: "us",
      title: `قرار مفتوح من ${arSpan(daysBetween(day(staleDecision.createdAt), r.today))}`,
      why: staleDecision.question,
      move: mine ? "مستني رأي الطرف التاني" : "صوّت عشان يتقفل",
    });
  }

  if (r.life.lastMemoryDaysAgo !== null && r.life.lastMemoryDaysAgo >= 30) {
    push({
      code: "memory_gap", level: "watch", screen: "memories",
      title: `${arSpan(r.life.lastMemoryDaysAgo)} من غير ذكرى متسجّلة`,
      why: "التجهيز بياخد المساحة كلها، والفترة دي هي اللي هتتفتكر بعدين مش الفواتير.",
      move: "سجّلوا أي حاجة حصلت الأسبوع ده",
    });
  }

  if (space.settings.together) {
    const days = daysBetween(space.settings.together, r.today);
    // الشهرية والسنوية: نافذة يوم واحد، فلا تتحول التهنئة إلى خلفية دائمة
    if (days > 0 && days % 365 === 0) {
      push({
        code: "anniversary", level: "now", screen: "memories",
        title: `النهارده بقالكم ${arSpan(days)}`,
        why: `من ${arDate(space.settings.together)}.`,
        move: "سجّلوا ذكرى لليوم ده",
      });
    }
  }

  /* ── الأسابيع الجاية ─────────────────────────────── */
  const peak = depth.forecast?.peak;
  if (peak) {
    push({
      code: `peak:${peak.week}`, level: "soon", screen: "signal",
      title: `أسبوع ${peak.label} هيبقى ضاغط`,
      why: `${peak.note} — فوق سعتكم المقاسة (${Math.round(depth.forecast?.capacity ?? 0)} حاجة في الأسبوع).`,
      move: "قدّموا اللي يتقدّم دلوقتي، والباقي أجّلوه لأسبوع أهدى.",
    });
  }
  const calm = depth.forecast?.calm;
  if (calm && calm.score <= 25 && peak) {
    push({
      code: `calm:${calm.week}`, level: "watch", screen: "signal",
      title: `أسبوع ${calm.label} فاضي`,
      why: "أهدى أسبوع في الشهرين الجايين، وملوش محطة.",
      move: "احجزوا فيه ليلة ليكم إنتوا — قبل ما حاجة تاخده.",
    });
  }

  /* ── نبض العلاقة ─────────────────────────────────── */
  const hb = depth.heartbeat;
  if (hb && hb.verdict === "cold" && (hb.careShare ?? 0) >= 0) {
    push({
      code: "heart_cold", level: "soon", screen: "persona",
      title: "التجهيز واخد المساحة كلها",
      why: hb.line + (hb.sinceCare !== null ? ` وآخر حاجة شخصية اتسجّلت من ${arSpan(hb.sinceCare)}.` : ""),
      move: "حاجة واحدة صغيرة الأسبوع ده: ذكرى، أو رسالة، أو حاجة من قايمة «نعملها».",
    });
  }

  /* ── الأنماط ─────────────────────────────────────── */
  const sync = depth.sync;
  if (sync && sync.declared.him + sync.declared.her === 0 && space.log.length > 12) {
    push({
      code: "persona_blank", level: "watch", screen: "persona",
      title: "لسه محدش كتب أنماطه",
      why: "سبع اختيارات لكل واحد — منها بيتقري الاختلاف اللي بيسبب أغلب الاحتكاك.",
      move: "خمس دقايق لكل واحد، مرة واحدة.",
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
