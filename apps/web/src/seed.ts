import type { LifeSnapshot, Entity } from "@gonaim/domain";

const TODAY = "2026-08-22";

const e = (id: string, type: Entity["type"], title: string, summary?: string): Entity => ({
  id, type, title,
  ...(summary !== undefined ? { summary } : {}),
  sensitivity: type === "subscription" || type === "invoice" || type === "obligation"
    ? "sensitive" : "private",
  sourceHealth: "ok",
  createdAt: TODAY,
});

/**
 * بيانات المعاينة. مطابقة لبيانات اختبار SQL واختبار المحرك — حتى تكون
 * الشاشة انعكاسًا لما اختُبر فعلًا، لا نسخة تجميلية منفصلة.
 */
export const snapshot: LifeSnapshot = {
  today: TODAY,
  entities: new Map([
    ["sub1", e("sub1", "subscription", "OpenAI Plus")],
    ["sub2", e("sub2", "subscription", "Adobe Creative Cloud")],
    ["inv1", e("inv1", "invoice", "Invoice #6021")],
    ["want1", e("want1", "want", "Sony WH-1000XM5", "headphones")],
    ["obl1", e("obl1", "obligation", "رد على عرض تعاون")],
    ["p1", e("p1", "person", "Studio Client")],
    ["p2", e("p2", "person", "Layla — Riyadh Studio")],
    ["own1", e("own1", "possession", "AirPods Pro", "headphones")],
  ]),
  subscriptions: [
    { entityId: "sub1", provider: "OpenAI", amount: 75, currency: "SAR",
      cycle: "monthly", renewsOn: "2026-08-27", autoRenews: true,
      creditIncluded: 100, creditUsed: 8, creditUnit: "messages",
      amountSource: "manual", lastVerifiedAt: "2026-08-20T10:00:00Z" },
    { entityId: "sub2", provider: "Adobe", amount: 249, currency: "SAR",
      cycle: "monthly", renewsOn: "2026-08-29", autoRenews: true,
      amountSource: "statement", lastVerifiedAt: "2026-08-01T10:00:00Z" },
  ],
  invoices: [
    { entityId: "inv1", direction: "incoming", counterparty: "Studio Client",
      amount: 8500, currency: "SAR", issuedOn: "2026-08-04",
      typicalDays: 14, amountSource: "email" },
  ],
  wants: [
    { entityId: "want1", state: "watching_price", targetPrice: 1350, currency: "SAR",
      whyWant: ["حساسية للضوضاء", "تصميم أسود بسيط"],
      firstSeenAt: "2026-08-12T09:00:00Z",
      revisits30d: 4, distinctStores: 2, lastRevisitAt: "2026-08-22T09:41:00Z",
      prices: [
        { price: 1499, currency: "SAR", store: "amazon.sa", sourceUri: "https://amazon.sa/", observedAt: "2026-08-13T10:00:00Z" },
        { price: 1420, currency: "SAR", store: "jarir.com", sourceUri: "https://jarir.com/", observedAt: "2026-08-18T10:00:00Z" },
        { price: 1319, currency: "SAR", store: "amazon.sa", sourceUri: "https://amazon.sa/", observedAt: "2026-08-22T08:00:00Z" },
      ] },
  ],
  obligations: [
    { entityId: "obl1", personEntityId: "p2", kind: "reply_owed",
      what: "رد على عرض تعاون", notedFrom: "email",
      typicalReplyDays: 3, lastContactAt: "2026-08-13T12:00:00Z", status: "open" },
  ],
  possessions: [
    { entityId: "own1", category: "headphones", acquiredOn: "2024-03-01",
      currency: "SAR", condition: "worn" },
  ],
};
