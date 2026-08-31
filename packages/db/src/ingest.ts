import type { Sql } from "postgres";
import type { EventDraft } from "@gonaim/ingest";
import { audit } from "./audit.js";

/**
 * كتابة أحداث الهاتف.
 *
 * `transientText` لا يُكتب أبدًا — هو نص للاستخلاص في الجلسة فقط. لو أردته
 * محفوظًا، فمكانه `payload.body` عبر `bodyRetention: "redacted"`، وهو قرار
 * صريح يُتخذ في التحويل لا هنا.
 */
export interface IngestResult {
  accepted: number;
  duplicates: number;
  rejectedByBlackout: number;
  eventIds: string[];
}

export async function ingestEvents(
  sql: Sql, ownerId: string, drafts: EventDraft[], blackout: boolean,
): Promise<IngestResult> {
  if (blackout) {
    // الرفض يُسجَّل: Blackout يوقف الاستيعاب فورًا، والسجل يثبت أنه فعل
    await audit(sql, ownerId, {
      actor: "device", action: "ingest", outcome: "denied",
      reason: "blackout نشط — لا استيعاب",
      detail: { rejected: drafts.length },
    });
    return { accepted: 0, duplicates: 0, rejectedByBlackout: drafts.length, eventIds: [] };
  }

  return sql.begin(async (tx) => {
    const t = tx as unknown as Sql;
    const ids: string[] = [];
    let duplicates = 0;

    for (const d of drafts) {
      const rows = await t<{ id: string }[]>`
        insert into events (owner_id, event_type, occurred_at, source, sensitivity,
                            observed_or_inferred, payload, fingerprint)
        values (${ownerId}, ${d.eventType}, ${d.occurredAt}, ${d.source}, ${d.sensitivity},
                ${d.observedOrInferred}, ${t.json(d.payload as never)}, ${d.fingerprint})
        on conflict (owner_id, fingerprint)
          do update set occurrence_count = events.occurrence_count + 1
        returning id, (xmax <> 0) as existed`;

      const row = rows[0] as ({ id: string; existed: boolean } | undefined);
      if (!row) continue;
      if (row.existed) duplicates++;
      else ids.push(row.id);
    }

    await audit(t, ownerId, {
      actor: "device", action: "ingest", outcome: "executed",
      detail: { accepted: ids.length, duplicates },
    });

    return { accepted: ids.length, duplicates, rejectedByBlackout: 0, eventIds: ids };
  }) as Promise<IngestResult>;
}

/** حالة Blackout الحالية — تُقرأ قبل كل استيعاب. */
export async function isBlackout(sql: Sql, ownerId: string): Promise<boolean> {
  const rows = await sql<{ activated: boolean }[]>`
    select (event_type = 'system.blackout.activated') as activated
    from events
    where owner_id = ${ownerId}
      and event_type in ('system.blackout.activated', 'system.blackout.cleared')
    order by occurred_at desc limit 1`;
  return rows[0]?.activated ?? false;
}
