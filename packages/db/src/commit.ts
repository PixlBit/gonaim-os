import { createHash } from "node:crypto";
import type { Sql } from "postgres";
import { audit } from "./audit.js";

/**
 * حفظ المرشحين المؤكَّدين.
 *
 * المبدأ الحاكم (ADR-0004 و§5.2): لا تدخل حقيقة القاعدة بلا حدث يفسّر
 * وجودها. لذلك كل حفظ يكتب **حدثًا أولًا** ثم الكيان مرتبطًا به. الترتيب
 * ليس تفصيلًا: لو انعكس، يمكن أن توجد حقيقة يتيمة لحظة فشل.
 */

export type ConfirmedCandidate =
  | { kind: "subscription"; title: string; provider: string; amount: number;
      currency: string; cycle: string; renewsOn: string | null;
      creditIncluded: number | null; creditUsed: number | null; creditUnit: string | null;
      evidenceText: string; confidence: number }
  | { kind: "invoice"; title: string; direction: "incoming" | "outgoing";
      counterparty: string; amount: number; currency: string; issuedOn: string;
      typicalDays: number | null; evidenceText: string; confidence: number }
  | { kind: "want"; title: string; category: string | null; targetPrice: number | null;
      currency: string; whyWant: string[]; evidenceText: string; confidence: number }
  | { kind: "obligation"; what: string; personName: string | null;
      obligationKind: string; dueBy: string | null; typicalReplyDays: number | null;
      evidenceText: string; confidence: number }
  | { kind: "possession"; title: string; category: string;
      condition: string | null; evidenceText: string; confidence: number };

export interface CommitResult {
  saved: { kind: string; entityId: string; title: string }[];
  eventId: string;
}

const SENSITIVITY: Record<string, string> = {
  subscription: "sensitive", invoice: "sensitive", obligation: "sensitive",
  want: "private", possession: "private",
};

export async function commitCandidates(
  sql: Sql,
  ownerId: string,
  candidates: ConfirmedCandidate[],
  context: { capturedAt: string; redactedCount: number },
): Promise<CommitResult> {
  if (candidates.length === 0) throw new Error("nothing_to_commit");

  return sql.begin(async (tx) => {
    const t = tx as unknown as Sql;

    // حدث واحد للالتقاط كله — الحقائق التي جاءت من جملة واحدة مرتبطة فعلًا
    const fingerprint = "sha256:" + createHash("sha256")
      .update(`manual.capture.created|${ownerId}|${context.capturedAt}|` +
              candidates.map((c) => c.evidenceText).join("|"))
      .digest("hex");

    const [event] = await t<{ id: string }[]>`
      insert into events (owner_id, event_type, occurred_at, source, sensitivity,
                          observed_or_inferred, payload, fingerprint)
      values (${ownerId}, 'manual.capture.created', ${context.capturedAt}, 'manual',
              'private', 'observed',
              ${t.json({ candidateCount: candidates.length, redactedCount: context.redactedCount })},
              ${fingerprint})
      on conflict (owner_id, fingerprint) do update set occurrence_count = events.occurrence_count + 1
      returning id`;

    if (!event) throw new Error("event_insert_failed");

    const saved: CommitResult["saved"] = [];

    for (const c of candidates) {
      const title = "title" in c ? c.title : c.what;
      const [entity] = await t<{ id: string }[]>`
        insert into entities (owner_id, type, title, summary, sensitivity, metadata)
        values (${ownerId}, ${c.kind}, ${title},
                ${"category" in c ? c.category ?? null : null},
                ${SENSITIVITY[c.kind] ?? "private"},
                ${t.json({ confidence: c.confidence, evidenceText: c.evidenceText })})
        returning id`;
      if (!entity) throw new Error(`entity_insert_failed:${c.kind}`);

      await insertFacet(t, ownerId, entity.id, c);

      // الحقيقة والحدث الذي أنتجها مرتبطان صراحة
      await t`
        update events set entity_ids = array_append(entity_ids, ${entity.id}::uuid)
        where id = ${event.id}`;

      saved.push({ kind: c.kind, entityId: entity.id, title });
    }

    await audit(t, ownerId, {
      actor: "owner", action: "commit_candidates", outcome: "executed",
      targetType: "event", targetId: event.id,
      detail: { saved: saved.length, redacted: context.redactedCount },
    });

    return { saved, eventId: event.id };
  }) as Promise<CommitResult>;
}

async function insertFacet(
  t: Sql, ownerId: string, entityId: string, c: ConfirmedCandidate,
): Promise<void> {
  switch (c.kind) {
    case "subscription":
      await t`insert into subscriptions (entity_id, owner_id, provider, amount, currency,
                cycle, renews_on, credit_included, credit_used, credit_unit, amount_source)
              values (${entityId}, ${ownerId}, ${c.provider}, ${c.amount}, ${c.currency},
                ${c.cycle}, ${c.renewsOn}, ${c.creditIncluded}, ${c.creditUsed},
                ${c.creditUnit}, 'manual')`;
      return;
    case "invoice":
      await t`insert into invoices (entity_id, owner_id, direction, counterparty, amount,
                currency, issued_on, typical_days, amount_source)
              values (${entityId}, ${ownerId}, ${c.direction}, ${c.counterparty}, ${c.amount},
                ${c.currency}, ${c.issuedOn}, ${c.typicalDays}, 'manual')`;
      return;
    case "want":
      await t`insert into wish_items (entity_id, owner_id, state, target_price, currency, why_want)
              values (${entityId}, ${ownerId}, 'want', ${c.targetPrice}, ${c.currency},
                ${c.whyWant})`;
      return;
    case "obligation":
      await t`insert into obligations (entity_id, owner_id, kind, what, noted_from,
                due_by, typical_reply_days)
              values (${entityId}, ${ownerId}, ${c.obligationKind}, ${c.what}, 'manual',
                ${c.dueBy}, ${c.typicalReplyDays})`;
      return;
    case "possession":
      await t`insert into possessions (entity_id, owner_id, category, condition)
              values (${entityId}, ${ownerId}, ${c.category}, ${c.condition})`;
      return;
  }
}
