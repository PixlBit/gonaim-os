import type { Sql, JSONValue } from "postgres";

/**
 * سجل التدقيق.
 *
 * ADR: "Audit log يكتب من اليوم الأول". الجدول وحده لا يكفي — سجل فارغ
 * يعني أن كل ادعاء عن الشفافية غير قابل للتحقق.
 *
 * يُكتب دائمًا، حتى للأفعال المرفوضة: **الرفض معلومة أهم من القبول**، لأنه
 * يثبت أن الحد اشتغل.
 */
export type AuditOutcome = "allowed" | "denied" | "executed" | "failed";

export interface AuditEntry {
  actor: string;
  action: string;
  outcome: AuditOutcome;
  targetType?: string;
  targetId?: string;
  risk?: string;
  reason?: string;
  detail?: Record<string, JSONValue>;
}

export async function audit(sql: Sql, ownerId: string, e: AuditEntry): Promise<void> {
  await sql`
    insert into audit_log (owner_id, actor, action, outcome, target_type, target_id, risk, reason, detail)
    values (${ownerId}, ${e.actor}, ${e.action}, ${e.outcome},
            ${e.targetType ?? null}, ${e.targetId ?? null}, ${e.risk ?? null},
            ${e.reason ?? null}, ${sql.json(e.detail ?? {})})`;
}

/**
 * يغلّف فعلًا بحيث لا يمكن أن ينفَّذ دون أن يُسجَّل.
 * الفشل يُسجَّل ثم يُعاد رميه — لا يُبتلع.
 */
export async function audited<T>(
  sql: Sql, ownerId: string, e: Omit<AuditEntry, "outcome">,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const out = await fn();
    await audit(sql, ownerId, { ...e, outcome: "executed" });
    return out;
  } catch (err) {
    await audit(sql, ownerId, {
      ...e, outcome: "failed",
      reason: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
