import { z } from "zod/v4";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * كل مرشح يحمل `evidenceText` — المقطع الحرفي من كلام غنيم الذي أنتجه.
 *
 * هذا ليس حقلًا للعرض. هو بوابة "ربط المصدر" في ADR-0004: مرشح لا يستطيع
 * أن يشير إلى نص أنتجه يُرفض قبل أن يصل إلى المراجعة. يمنع أن يضيف
 * النموذج حقيقة معقولة لم تُقَل.
 */
const base = {
  evidenceText: z.string().min(1)
    .describe("المقطع الحرفي من نص المستخدم الذي أنتج هذه المعلومة. منسوخ حرفيًا."),
  confidence: z.number().min(0).max(1)
    .describe("درجة اليقين. أقل من 0.7 يذهب للمراجعة الإلزامية."),
};

export const SubscriptionCandidate = z.object({
  kind: z.literal("subscription"),
  title: z.string(),
  provider: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  cycle: z.enum(["monthly", "yearly", "quarterly", "one_time"]),
  renewsOn: isoDate.nullable(),
  creditIncluded: z.number().nullable(),
  creditUsed: z.number().nullable(),
  creditUnit: z.string().nullable(),
  ...base,
});

export const InvoiceCandidate = z.object({
  kind: z.literal("invoice"),
  title: z.string(),
  direction: z.enum(["incoming", "outgoing"]),
  counterparty: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  issuedOn: isoDate,
  typicalDays: z.number().int().positive().nullable()
    .describe("المدة المعتادة للسداد مع هذا الطرف، لو ذكرها المستخدم. لا تخمّنها."),
  ...base,
});

export const WantCandidate = z.object({
  kind: z.literal("want"),
  title: z.string(),
  category: z.string().nullable(),
  targetPrice: z.number().nullable(),
  currency: z.string().length(3),
  whyWant: z.array(z.string()),
  ...base,
});

export const ObligationCandidate = z.object({
  kind: z.literal("obligation"),
  what: z.string(),
  personName: z.string().nullable(),
  obligationKind: z.enum(["reply_owed", "promise_made", "followup", "intro", "payment"]),
  dueBy: isoDate.nullable(),
  typicalReplyDays: z.number().int().positive().nullable(),
  ...base,
});

export const PossessionCandidate = z.object({
  kind: z.literal("possession"),
  title: z.string(),
  category: z.string(),
  condition: z.enum(["new", "good", "worn", "broken", "lost"]).nullable(),
  ...base,
});

export const Candidate = z.discriminatedUnion("kind", [
  SubscriptionCandidate, InvoiceCandidate, WantCandidate,
  ObligationCandidate, PossessionCandidate,
]);
export type Candidate = z.infer<typeof Candidate>;

export const ExtractionResult = z.object({
  candidates: z.array(Candidate),
  /**
   * ما فهمه النموذج أنه قيل لكنه لم يستطع تصنيفه، أو نقصته معلومة.
   * إعلان الفجوة أفضل من ملئها — §37.3
   */
  unresolved: z.array(z.object({
    text: z.string(),
    whyUnresolved: z.string(),
  })),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;
