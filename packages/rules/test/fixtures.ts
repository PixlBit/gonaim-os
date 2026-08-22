import type { LifeSnapshot, Entity } from "@gonaim/domain";

const TODAY = "2026-08-22";

function ent(id: string, type: Entity["type"], title: string, summary?: string): Entity {
  return {
    id, type, title,
    ...(summary !== undefined ? { summary } : {}),
    sensitivity: type === "subscription" || type === "invoice" ? "sensitive" : "private",
    sourceHealth: "ok",
    createdAt: TODAY,
  };
}

/** نفس البيانات المستخدمة في اختبار SQL — حتى يتطابق المحركان. */
export function gonaimSnapshot(over: Partial<LifeSnapshot> = {}): LifeSnapshot {
  const entities = new Map<string, Entity>([
    ["sub1", ent("sub1", "subscription", "OpenAI Plus")],
    ["inv1", ent("inv1", "invoice", "Invoice #6021")],
    ["want1", ent("want1", "want", "Sony WH-1000XM5", "headphones")],
    ["obl1", ent("obl1", "obligation", "رد على عرض تعاون")],
    ["p1", ent("p1", "person", "Studio Client")],
    ["own1", ent("own1", "possession", "AirPods Pro", "headphones")],
  ]);

  return {
    today: TODAY,
    entities,
    subscriptions: [{
      entityId: "sub1", provider: "OpenAI", amount: 75, currency: "SAR",
      cycle: "monthly", renewsOn: "2026-08-27", autoRenews: true,
      creditIncluded: 100, creditUsed: 8, creditUnit: "messages",
      amountSource: "manual", lastVerifiedAt: "2026-08-20T10:00:00Z",
    }],
    invoices: [{
      entityId: "inv1", direction: "incoming", counterparty: "Studio Client",
      amount: 8500, currency: "SAR", issuedOn: "2026-08-04",
      typicalDays: 14, amountSource: "email",
    }],
    wants: [{
      entityId: "want1", state: "watching_price", targetPrice: 1200, currency: "SAR",
      whyWant: ["حساسية للضوضاء", "تصميم أسود بسيط"],
      firstSeenAt: "2026-08-12T09:00:00Z",
      revisits30d: 4, distinctStores: 2, lastRevisitAt: "2026-08-22T09:41:00Z",
      prices: [
        { price: 1499, currency: "SAR", store: "amazon.sa", sourceUri: "https://amazon.sa/x", observedAt: "2026-08-13T10:00:00Z" },
        { price: 1420, currency: "SAR", store: "jarir.com", sourceUri: "https://jarir.com/x", observedAt: "2026-08-18T10:00:00Z" },
        { price: 1319, currency: "SAR", store: "amazon.sa", sourceUri: "https://amazon.sa/x", observedAt: "2026-08-22T08:00:00Z" },
      ],
    }],
    obligations: [{
      entityId: "obl1", personEntityId: "p1", kind: "reply_owed",
      what: "رد على عرض تعاون", notedFrom: "email",
      typicalReplyDays: 3, lastContactAt: "2026-08-13T12:00:00Z", status: "open",
    }],
    possessions: [{
      entityId: "own1", category: "headphones", acquiredOn: "2024-03-01",
      currency: "SAR", condition: "worn",
    }],
    ...over,
  };
}

export const NOTHING_SEEN: ReadonlySet<string> = new Set();
