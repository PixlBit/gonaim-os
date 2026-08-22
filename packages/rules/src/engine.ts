import type { Signal, SignalTier } from "@gonaim/domain";
import { computeRelevance, tierFor, strictest } from "@gonaim/domain";
import type { Rule, RuleContext, RuleFinding } from "./types.js";

export interface EngineOptions {
  /** ميزانية المقاطعة اليومية — Blueprint §12.2. الافتراضي ٣. */
  interruptionBudget: number;
  /** كم صُرف منها اليوم. */
  interruptionsSpent: number;
  /** Quiet Hours سياقية: تحرير بملء الشاشة، مكالمة، قيادة… Expansion §22.2 */
  quietHours: boolean;
}

export interface EngineResult {
  surfaced: Signal[];
  inbox: Signal[];
  belowThreshold: Signal[];
  /** قرار الصمت حدث حقيقي، لا غياب فعل — Expansion §6 */
  stayedSilent: boolean;
  budgetRemaining: number;
}

const DEFAULTS: EngineOptions = {
  interruptionBudget: 3,
  interruptionsSpent: 0,
  quietHours: false,
};

export function runRules(
  rules: readonly Rule[],
  ctx: RuleContext,
  options: Partial<EngineOptions> = {},
): EngineResult {
  const opts = { ...DEFAULTS, ...options };
  const scored: Signal[] = [];

  for (const rule of rules) {
    for (const f of rule.run(ctx)) {
      scored.push(toSignal(rule, f, ctx));
    }
  }

  const subsumed = applySubsumption(rules, ctx, scored);
  scored.sort((a, b) => b.relevance - a.relevance);

  const surfaced: Signal[] = [];
  const inbox: Signal[] = [];
  const belowThreshold: Signal[] = [];
  let budget = Math.max(0, opts.interruptionBudget - opts.interruptionsSpent);

  for (const s of scored) {
    // ما شرحته إشارة أعلى لا يُقاطع مرة ثانية — يبقى متاحًا في الوارد.
    if (subsumed.has(s.id) && s.tier !== "below_threshold") {
      inbox.push({ ...s, tier: "inbox" });
      continue;
    }
    if (s.tier === "below_threshold") {
      belowThreshold.push(s);
      continue;
    }
    if (s.tier === "inbox" || s.tier === "whisper") {
      inbox.push(s);
      continue;
    }
    // المقاطعة تكلّف من الميزانية. عند النفاد تنزل درجة — لا تختفي.
    const costsBudget = s.tier === "interrupt" || s.tier === "nudge";
    if (costsBudget && (budget <= 0 || opts.quietHours)) {
      inbox.push({ ...s, tier: "inbox" });
      continue;
    }
    if (costsBudget) budget -= 1;
    surfaced.push(s);
  }

  return {
    surfaced,
    inbox,
    belowThreshold,
    stayedSilent: surfaced.length === 0,
    budgetRemaining: budget,
  };
}

/**
 * التركيب يعلو على أجزائه.
 *
 * إشارة تشرح ثلاث إشارات أخرى أثمن من أي واحدة منها — لأنها الوحيدة التي
 * لا يستطيع أي مجال منفرد إنتاجها. فتُرفع فوق أعلى جزء تشرحه، وتُخفَّض
 * الأجزاء إلى الوارد حتى لا تُقرأ نفس الحقيقة أربع مرات.
 *
 * يعيد مفاتيح ما جرى استيعابه.
 */
function applySubsumption(
  rules: readonly Rule[],
  ctx: RuleContext,
  scored: Signal[],
): Set<string> {
  const byId = new Map(scored.map((s) => [s.id, s]));
  const subsumed = new Set<string>();

  for (const rule of rules) {
    for (const f of rule.run(ctx)) {
      if (!f.subsumes?.length) continue;
      const parent = byId.get(f.key);
      if (!parent) continue;

      let strongestPart = 0;
      for (const key of f.subsumes) {
        const child = byId.get(key);
        if (!child) continue;
        subsumed.add(key);
        strongestPart = Math.max(strongestPart, child.relevance);
      }
      if (strongestPart > 0) {
        parent.relevance = Math.max(parent.relevance, Math.min(1, strongestPart + 0.02));
        parent.tier = tierFor(parent.relevance);
      }
    }
  }
  return subsumed;
}

function toSignal(rule: Rule, f: RuleFinding, ctx: RuleContext): Signal {
  const seen = ctx.alreadySurfaced.has(f.key);
  const scores = {
    goalMatch: clamp(f.goalMatch),
    urgency: clamp(f.urgency),
    // Novelty: ما عُرض من قبل يفقد جِدّته. يمنع تكرار نفس الإشارة كل تشغيل.
    novelty: seen ? 0.1 : 1,
    // القواعد الحتمية تُبنى على ملاحظة مباشرة — قوة الدليل عالية بطبيعتها.
    evidenceStrength: evidenceStrength(f),
    timingFit: ctx.snapshot.today ? 0.8 : 0.5,
    interruptionCost: interruptionCost(f),
  };
  const relevance = computeRelevance(scores);
  // خطر حرج يتجاوز العتبة — لكن بدليل مرصود فقط، لا استنتاج. §12.2
  const critical = f.riskCritical === true && f.evidence.some((e) => e.mode === "observed");
  const tier: SignalTier = critical ? "interrupt" : tierFor(relevance);

  return {
    id: f.key,
    ruleCode: rule.code,
    domain: rule.domain,
    headline: f.headline,
    whyNow: f.whyNow,
    ...(f.suggestedMove !== undefined ? { suggestedMove: f.suggestedMove } : {}),
    tier,
    sensitivity: strictest(f.sensitivity, ...f.evidence.map(() => f.sensitivity)),
    evidence: f.evidence,
    scores,
    relevance,
    producedBy: "rule",
    createdAt: ctx.snapshot.today,
  };
}

function evidenceStrength(f: RuleFinding): number {
  if (f.evidence.length === 0) return 0;
  const observed = f.evidence.filter((e) => e.mode === "observed").length;
  return clamp(0.5 + 0.5 * (observed / f.evidence.length));
}

/**
 * تكلفة المقاطعة ترتفع مع حساسية البيانات: إشارة مالية تفتح موضوعًا ثقيلًا،
 * فيجب أن تستحق ظهورها أكثر من ملاحظة عن سعر سماعة.
 */
function interruptionCost(f: RuleFinding): number {
  switch (f.sensitivity) {
    case "sensitive": return 0.08;
    case "vaulted": return 0.20;
    default: return 0.05;
  }
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
