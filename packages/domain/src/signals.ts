import { z } from "zod";
import { SensitivityZone } from "./zones.js";

/** خمس طبقات — Expansion §10.2. Whisper هي أخف تدخل ممكن. */
export const SignalTier = z.enum([
  "below_threshold", "inbox", "whisper", "nudge", "window", "interrupt", "block",
]);
export type SignalTier = z.infer<typeof SignalTier>;

/** دليل قابل للفتح. بلا مصدر لا يوجد ادعاء — Blueprint §5.2 */
export interface Evidence {
  label: string;
  sourceUri?: string;
  observedAt?: string;
  /** ملاحظة مباشرة أم استنتاج. خلطهما هو "الذاكرة الكاذبة" §24.3 */
  mode: "observed" | "inferred";
}

export interface Signal {
  id: string;
  ruleCode: string;
  domain: string;
  /** ماذا حدث */
  headline: string;
  /** لماذا الآن — شرط قبول في §37.1، لا حقل اختياري */
  whyNow: string;
  /** حركة واحدة، لا قائمة */
  suggestedMove?: string;
  tier: SignalTier;
  sensitivity: SensitivityZone;
  evidence: Evidence[];
  scores: RelevanceScores;
  relevance: number;
  /** القواعد الحتمية لا تحمل احتمالًا — تحققت أو لا. ADR-0010 */
  producedBy: "rule" | "cortex";
  createdAt: string;
}

export interface RelevanceScores {
  goalMatch: number;
  urgency: number;
  novelty: number;
  evidenceStrength: number;
  timingFit: number;
  interruptionCost: number;
}

/** Blueprint §12.2 — الأوزان معلنة حتى تكون المعايرة ممكنة. */
export const RELEVANCE_WEIGHTS = {
  goalMatch: 0.30,
  urgency: 0.25,
  novelty: 0.20,
  evidenceStrength: 0.15,
  timingFit: 0.10,
} as const;

export function computeRelevance(s: RelevanceScores): number {
  const base =
    RELEVANCE_WEIGHTS.goalMatch * s.goalMatch +
    RELEVANCE_WEIGHTS.urgency * s.urgency +
    RELEVANCE_WEIGHTS.novelty * s.novelty +
    RELEVANCE_WEIGHTS.evidenceStrength * s.evidenceStrength +
    RELEVANCE_WEIGHTS.timingFit * s.timingFit;
  return Math.max(0, Math.min(1, base - s.interruptionCost));
}

/** Blueprint §12.2 — العتبات. */
export function tierFor(relevance: number, riskCritical = false): SignalTier {
  if (riskCritical) return "interrupt";
  if (relevance >= 0.85) return "interrupt";
  if (relevance >= 0.70) return "nudge";
  if (relevance >= 0.45) return "inbox";
  return "below_threshold";
}
