import type { Sql } from "postgres";
import type { LifeSnapshot, Entity } from "@gonaim/domain";

/**
 * تحميل لقطة الحياة التي تعمل عليها القواعد.
 *
 * استعلامات قليلة ومحددة، لا ORM يجلب كل شيء. القواعد تحتاج المفتوح فقط:
 * اشتراك ملغى أو التزام مغلق لا يشارك في أي حكم، فجلبه تكلفة بلا مقابل.
 */
export async function loadSnapshot(
  sql: Sql, ownerId: string, today: string,
): Promise<LifeSnapshot> {
  const [entityRows, subs, invs, wants, prices, obligations, possessions] = await Promise.all([
    sql<EntityRow[]>`
      select id, type, title, summary, sensitivity, source_uri, source_health, created_at
      from entities where owner_id = ${ownerId} and state = 'active'`,
    sql<SubRow[]>`
      select * from subscriptions where owner_id = ${ownerId} and cancelled_at is null`,
    // المدفوعة لا تُقيَّم — القواعد كلها عن غير المسدَّد
    sql<InvRow[]>`
      select * from invoices where owner_id = ${ownerId} and paid_on is null`,
    sql<WantRow[]>`
      select * from wish_items where owner_id = ${ownerId} and decided_at is null`,
    sql<PriceRow[]>`
      select entity_id, price, currency, store, source_uri, observed_at, in_stock
      from price_observations where owner_id = ${ownerId}
      order by observed_at asc`,
    sql<OblRow[]>`
      select * from obligations where owner_id = ${ownerId} and status = 'open'`,
    sql<PossRow[]>`
      select * from possessions where owner_id = ${ownerId}`,
  ]);

  const entities = new Map<string, Entity>(
    entityRows.map((r) => [r.id, {
      id: r.id, type: r.type as Entity["type"], title: r.title,
      ...(r.summary !== null ? { summary: r.summary } : {}),
      sensitivity: r.sensitivity as Entity["sensitivity"],
      ...(r.source_uri !== null ? { sourceUri: r.source_uri } : {}),
      sourceHealth: r.source_health as Entity["sourceHealth"],
      createdAt: iso(r.created_at),
    }]),
  );

  const pricesByEntity = new Map<string, PriceRow[]>();
  for (const p of prices) {
    const list = pricesByEntity.get(p.entity_id) ?? [];
    list.push(p);
    pricesByEntity.set(p.entity_id, list);
  }

  return {
    today,
    entities,
    subscriptions: subs.map((s) => ({
      entityId: s.entity_id, provider: s.provider, amount: num(s.amount),
      currency: s.currency, cycle: s.cycle as never,
      ...(s.renews_on !== null ? { renewsOn: day(s.renews_on) } : {}),
      autoRenews: s.auto_renews,
      ...(s.credit_included !== null ? { creditIncluded: num(s.credit_included) } : {}),
      ...(s.credit_used !== null ? { creditUsed: num(s.credit_used) } : {}),
      ...(s.credit_unit !== null ? { creditUnit: s.credit_unit } : {}),
      amountSource: s.amount_source as never,
      lastVerifiedAt: iso(s.last_verified_at),
    })),
    invoices: invs.map((i) => ({
      entityId: i.entity_id, direction: i.direction as never,
      counterparty: i.counterparty, amount: num(i.amount), currency: i.currency,
      issuedOn: day(i.issued_on),
      ...(i.due_on !== null ? { dueOn: day(i.due_on) } : {}),
      // غياب typical_days مقصود: القاعدة لا تُطلق بلا معتاد معروف
      ...(i.typical_days !== null ? { typicalDays: i.typical_days } : {}),
      amountSource: i.amount_source as never,
    })),
    wants: wants.map((w) => ({
      entityId: w.entity_id, state: w.state as never,
      ...(w.target_price !== null ? { targetPrice: num(w.target_price) } : {}),
      currency: w.currency, whyWant: w.why_want,
      firstSeenAt: iso(w.first_seen_at),
      revisits30d: w.revisits_30d, distinctStores: w.distinct_stores,
      ...(w.last_revisit_at !== null ? { lastRevisitAt: iso(w.last_revisit_at) } : {}),
      ...(w.cooling_until !== null ? { coolingUntil: day(w.cooling_until) } : {}),
      prices: (pricesByEntity.get(w.entity_id) ?? []).map((p) => ({
        price: num(p.price), currency: p.currency, store: p.store,
        sourceUri: p.source_uri, observedAt: iso(p.observed_at),
        ...(p.in_stock !== null ? { inStock: p.in_stock } : {}),
      })),
    })),
    obligations: obligations.map((o) => ({
      entityId: o.entity_id,
      ...(o.person_entity_id !== null ? { personEntityId: o.person_entity_id } : {}),
      kind: o.kind as never, what: o.what, notedFrom: o.noted_from as never,
      ...(o.source_uri !== null ? { sourceUri: o.source_uri } : {}),
      ...(o.due_by !== null ? { dueBy: day(o.due_by) } : {}),
      ...(o.typical_reply_days !== null ? { typicalReplyDays: o.typical_reply_days } : {}),
      ...(o.last_contact_at !== null ? { lastContactAt: iso(o.last_contact_at) } : {}),
      status: o.status as never,
    })),
    possessions: possessions.map((p) => ({
      entityId: p.entity_id, category: p.category,
      ...(p.acquired_on !== null ? { acquiredOn: day(p.acquired_on) } : {}),
      ...(p.purchase_price !== null ? { purchasePrice: num(p.purchase_price) } : {}),
      currency: p.currency,
      ...(p.condition !== null ? { condition: p.condition as never } : {}),
      ...(p.warranty_until !== null ? { warrantyUntil: day(p.warranty_until) } : {}),
      ...(p.replaces_entity_id !== null ? { replacesEntityId: p.replaces_entity_id } : {}),
    })),
  };
}

/** numeric يصل كنص للحفاظ على الدقة — التحويل صريح، لا ضمني. */
const num = (v: string | number): number => typeof v === "number" ? v : Number(v);
const iso = (d: Date | string): string => typeof d === "string" ? d : d.toISOString();
const day = (d: Date | string): string => iso(d).slice(0, 10);

interface EntityRow { id: string; type: string; title: string; summary: string | null;
  sensitivity: string; source_uri: string | null; source_health: string; created_at: Date }
interface SubRow { entity_id: string; provider: string; amount: string; currency: string;
  cycle: string; renews_on: Date | null; auto_renews: boolean; credit_included: string | null;
  credit_used: string | null; credit_unit: string | null; amount_source: string; last_verified_at: Date }
interface InvRow { entity_id: string; direction: string; counterparty: string; amount: string;
  currency: string; issued_on: Date; due_on: Date | null; typical_days: number | null; amount_source: string }
interface WantRow { entity_id: string; state: string; target_price: string | null; currency: string;
  why_want: string[]; first_seen_at: Date; revisits_30d: number; distinct_stores: number;
  last_revisit_at: Date | null; cooling_until: Date | null }
interface PriceRow { entity_id: string; price: string; currency: string; store: string;
  source_uri: string; observed_at: Date; in_stock: boolean | null }
interface OblRow { entity_id: string; person_entity_id: string | null; kind: string; what: string;
  noted_from: string; source_uri: string | null; due_by: Date | null;
  typical_reply_days: number | null; last_contact_at: Date | null; status: string }
interface PossRow { entity_id: string; category: string; acquired_on: Date | null;
  purchase_price: string | null; currency: string; condition: string | null;
  warranty_until: Date | null; replaces_entity_id: string | null }
