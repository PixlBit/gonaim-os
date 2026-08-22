import { z } from "zod";
import { SensitivityZone } from "./zones.js";

export const EntityType = z.enum([
  "person", "subscription", "invoice", "want", "possession",
  "obligation", "place", "skill", "opportunity", "project", "idea",
  "account", "decision",
]);
export type EntityType = z.infer<typeof EntityType>;

/** كل شيء Node. العلاقات أهم من العناصر — Blueprint §6. */
export const Entity = z.object({
  id: z.string(),
  type: EntityType,
  title: z.string().min(1),
  summary: z.string().optional(),
  sensitivity: SensitivityZone,
  sourceUri: z.string().optional(),
  sourceHealth: z.enum(["ok", "stale", "unavailable", "revoked"]).default("ok"),
  createdAt: z.string(),
});
export type Entity = z.infer<typeof Entity>;

const money = z.number().nonnegative();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const Subscription = z.object({
  entityId: z.string(),
  provider: z.string(),
  amount: money,
  currency: z.string().length(3).default("SAR"),
  cycle: z.enum(["monthly", "yearly", "quarterly", "one_time"]),
  renewsOn: isoDate.optional(),
  autoRenews: z.boolean().default(true),
  creditIncluded: z.number().positive().optional(),
  creditUsed: z.number().nonnegative().optional(),
  creditUnit: z.string().optional(),
  amountSource: z.enum(["manual", "email", "statement", "page"]),
  lastVerifiedAt: z.string(),
  cancelledAt: z.string().optional(),
});
export type Subscription = z.infer<typeof Subscription>;

export const Invoice = z.object({
  entityId: z.string(),
  direction: z.enum(["incoming", "outgoing"]),
  counterparty: z.string(),
  amount: money,
  currency: z.string().length(3).default("SAR"),
  issuedOn: isoDate,
  dueOn: isoDate.optional(),
  paidOn: isoDate.optional(),
  /** المعتاد لهذا الطرف تحديدًا — لا عتبة عامة. ADR-0010 */
  typicalDays: z.number().int().positive().optional(),
  amountSource: z.enum(["manual", "email", "pdf", "statement"]),
});
export type Invoice = z.infer<typeof Invoice>;

export const PriceObservation = z.object({
  price: money,
  currency: z.string().length(3).default("SAR"),
  store: z.string(),
  sourceUri: z.string(),
  observedAt: z.string(),
  inStock: z.boolean().optional(),
});
export type PriceObservation = z.infer<typeof PriceObservation>;

export const WishItem = z.object({
  entityId: z.string(),
  state: z.enum(["want", "considering", "watching_price", "owned", "rejected", "sold"]),
  targetPrice: money.optional(),
  currency: z.string().length(3).default("SAR"),
  /** لماذا يريده — يمنع تحوّل القائمة إلى bookmarks. Blueprint §18.2 */
  whyWant: z.array(z.string()).default([]),
  firstSeenAt: z.string(),
  revisits30d: z.number().int().nonnegative().default(0),
  distinctStores: z.number().int().positive().default(1),
  lastRevisitAt: z.string().optional(),
  /** "لا تشترِ الآن" اقتراح مشروع — Expansion §10.4 */
  coolingUntil: isoDate.optional(),
  prices: z.array(PriceObservation).default([]),
});
export type WishItem = z.infer<typeof WishItem>;

export const Obligation = z.object({
  entityId: z.string(),
  personEntityId: z.string().optional(),
  kind: z.enum(["reply_owed", "promise_made", "followup", "intro", "payment"]),
  what: z.string(),
  notedFrom: z.enum(["manual", "message", "email", "voice_note"]),
  sourceUri: z.string().optional(),
  dueBy: isoDate.optional(),
  /** المعتاد في هذه العلاقة تحديدًا. من يرد خلال يوم ليس كمن يرد كل أسبوعين. */
  typicalReplyDays: z.number().int().positive().optional(),
  lastContactAt: z.string().optional(),
  status: z.enum(["open", "done", "released", "expired"]).default("open"),
  /** released = قرر ألا يفعلها. ليس فشلًا ولا يُذكَّر به مجددًا. */
  releasedReason: z.string().optional(),
});
export type Obligation = z.infer<typeof Obligation>;

export const Possession = z.object({
  entityId: z.string(),
  category: z.string(),
  acquiredOn: isoDate.optional(),
  purchasePrice: money.optional(),
  currency: z.string().length(3).default("SAR"),
  condition: z.enum(["new", "good", "worn", "broken", "lost"]).optional(),
  warrantyUntil: isoDate.optional(),
  replacesEntityId: z.string().optional(),
});
export type Possession = z.infer<typeof Possession>;

/** كل ما يعرفه النظام في لحظة تقييم واحدة. */
export interface LifeSnapshot {
  today: string;
  entities: Map<string, Entity>;
  subscriptions: Subscription[];
  invoices: Invoice[];
  wants: WishItem[];
  obligations: Obligation[];
  possessions: Possession[];
}
