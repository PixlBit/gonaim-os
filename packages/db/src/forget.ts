import type { Sql } from "postgres";
import { audit } from "./audit.js";

/**
 * النسيان — Proof of Forgetting.
 *
 * Source: Expansion §23.4، data-sensitivity-map §7
 *
 * القاعدة الحاكمة: **ممنوع عرض كلمة "نُسي" إذا بقي أثر مشتق.**
 *
 * وهذا يصطدم بحقيقة لا مفر منها: سجل التدقيق لا يُحذف. لو حُذف، لضاع
 * الدليل الوحيد على أن الحذف حدث أصلًا — فيصبح "النسيان" ادعاءً بلا إثبات.
 * لذلك يبقى، ويقوله الإيصال صراحة بدل أن يخفيه.
 *
 * والأصل الخارجي كذلك: النظام لا يملك ملفك في Drive، فلا يستطيع حذفه.
 * الإيصال يسمّي ما بقي وأين، ويطلب فعلًا منك — لا يدّعي ما لم يفعل.
 */

export interface PurgeReceipt {
  requestedAt: string;
  /** ما حُذف فعلًا من القاعدة. */
  deleted: Record<string, number>;
  /** ما بقي، ولماذا — قصدًا لا سهوًا. */
  retained: { what: string; count: number; why: string }[];
  /** ما لا يستطيع النظام حذفه، ويحتاج فعلًا من المالك. */
  externalRemnants: { what: string; where: string; action: string }[];
  /** false إذا بقي أي أثر — فلا تُعرض كلمة "نُسي". */
  complete: boolean;
}

export async function forget(
  sql: Sql, ownerId: string, entityIds: string[], reason?: string,
): Promise<PurgeReceipt> {
  if (entityIds.length === 0) throw new Error("nothing_to_forget");

  return sql.begin(async (tx) => {
    const t = tx as unknown as Sql;
    const requestedAt = new Date().toISOString();

    // نلتقط ما نحتاج معرفته قبل الحذف — بعده لن يكون موجودًا ليُروى
    const targets = await t<{ id: string; type: string; title: string; source_uri: string | null }[]>`
      select id, type, title, source_uri from entities
      where owner_id = ${ownerId} and id = any(${entityIds}::uuid[])`;

    if (targets.length === 0) throw new Error("not_found");
    const ids = targets.map((e) => e.id);

    // الذاكرات التي كان هؤلاء مصدرها الوحيد — تصبح بلا سند فتُحذف معهم.
    // ذاكرة بلا مصدر تخالف ADR-0004 أصلًا، فإبقاؤها يخلق حالة محرّمة.
    const orphaned = await t<{ id: string }[]>`
      select m.id from memories m
      where m.owner_id = ${ownerId}
        and exists (select 1 from memory_sources s where s.memory_id = m.id and s.entity_id = any(${ids}::uuid[]))
        and not exists (select 1 from memory_sources s where s.memory_id = m.id and (s.entity_id is null or not (s.entity_id = any(${ids}::uuid[]))))`;

    const relationRows = await t<{ count: string }[]>`
      select count(*)::text as count from entity_relations
      where owner_id = ${ownerId} and (from_entity_id = any(${ids}::uuid[]) or to_entity_id = any(${ids}::uuid[]))`;
    const relationCount = Number(relationRows[0]?.count ?? 0);

    // الأحداث تُجرَّد من الإشارة ولا تُحذف: أن شيئًا وقع في وقت ما يظل صحيحًا
    const strippedEvents = await t<{ id: string }[]>`
      update events set entity_ids = array(
        select unnest(entity_ids) except select unnest(${ids}::uuid[]))
      where owner_id = ${ownerId} and entity_ids && ${ids}::uuid[]
      returning id`;

    const auditRows = await t<{ count: string }[]>`
      select count(*)::text as count from audit_log
      where owner_id = ${ownerId} and target_id = any(${ids}::uuid[])`;
    const auditCount = Number(auditRows[0]?.count ?? 0);

    if (orphaned.length > 0) {
      await t`delete from memories where id = any(${orphaned.map((m) => m.id)}::uuid[])`;
    }
    // الأوجه والعلاقات تسقط بالـcascade على entities
    const deletedEntities = await t<{ id: string }[]>`
      delete from entities where owner_id = ${ownerId} and id = any(${ids}::uuid[])
      returning id`;

    const external = targets.filter((e) => e.source_uri !== null);

    const retained: PurgeReceipt["retained"] = [];
    if (auditCount > 0) {
      retained.push({
        what: "سجلات تدقيق تذكر هذه العناصر",
        count: auditCount,
        why: "سجل التدقيق لا يُحذف. لو حُذف لضاع الدليل على أن الحذف حدث، فيصير النسيان ادعاءً بلا إثبات.",
      });
    }
    if (strippedEvents.length > 0) {
      retained.push({
        what: "أحداث جُرِّدت من الإشارة",
        count: strippedEvents.length,
        why: "الحدث يسجّل أن شيئًا وقع في وقت ما، وهذا يظل صحيحًا بعد حذف موضوعه. أُزيلت الإشارة ولم يُحذف الحدث.",
      });
    }

    const externalRemnants = external.map((e) => ({
      what: e.title,
      where: e.source_uri!,
      action: "النظام لا يملك الأصل ولا يستطيع حذفه. احذفه من مصدره لإتمام النسيان.",
    }));

    const deleted = {
      entities: deletedEntities.length,
      memories: orphaned.length,
      relations: relationCount,
    };

    const complete = retained.length === 0 && externalRemnants.length === 0;

    const receipt: PurgeReceipt = {
      requestedAt, deleted, retained, externalRemnants, complete,
    };

    await t`
      insert into purge_receipts (owner_id, requested_at, deleted_counts, retained_items, external_remnants, complete)
      values (${ownerId}, ${requestedAt}, ${t.json(deleted)},
              ${t.json(retained)}, ${t.json(externalRemnants)}, ${complete})`;

    await audit(t, ownerId, {
      actor: "owner", action: "forget", outcome: "executed",
      risk: "destructive",
      ...(reason !== undefined ? { reason } : {}),
      detail: { ...deleted, complete, titles: targets.map((e) => e.title) },
    });

    return receipt;
  }) as Promise<PurgeReceipt>;
}

/** ما تعرفه القاعدة — للعرض قبل اختيار ما يُنسى. */
export async function listKnown(sql: Sql, ownerId: string) {
  return sql<{ id: string; type: string; title: string; sensitivity: string;
              source_uri: string | null; created_at: Date }[]>`
    select id, type, title, sensitivity, source_uri, created_at
    from entities where owner_id = ${ownerId} and state = 'active'
    order by type, created_at desc`;
}
