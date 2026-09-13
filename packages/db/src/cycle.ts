import type { Sql } from "postgres";
import type { Signal } from "@gonaim/domain";
import { ALL_RULES, runRules } from "@gonaim/rules";
import { loadSnapshot } from "./snapshot.js";
import { isBlackout } from "./ingest.js";
import { audit } from "./audit.js";

/**
 * الدورة — ما يشغّله النظام على نفسه كل ساعة.
 *
 * أربعة أعمال، بهذا الترتيب:
 *   1. تشغيل القواعد على ما تعرفه القاعدة الآن.
 *   2. تخزين الإشارات الجديدة، وتجاهل ما عُرض من قبل.
 *   3. تطبيق سياسة الاحتفاظ — الخام يُجمَّع ويُحذف بعد مدته.
 *   4. تسجيل الدورة نفسها، لتكون قابلة للمراقبة.
 *
 * والعمل الثاني هو سبب وجودها: قبلها كانت الإشارات تُحسب عند كل طلب
 * ولا تُخزَّن، فـNovelty لا تنخفض ونفس الإشارة تُعرض للأبد.
 */
export interface CycleResult {
  status: "ok" | "skipped_blackout";
  findings: number;
  surfaced: number;
  inboxed: number;
  below: number;
  /** رُصدت لكنها عُرضت سابقًا — لا تُعاد. */
  suppressed: number;
  purgedEvents: number;
  durationMs: number;
  newSignals: { ruleCode: string; headline: string; tier: string }[];
}

export interface CycleOptions {
  today?: string;
  /** مدة الاحتفاظ بالأحداث الخام قبل التجميع — §5 في خريطة الحساسية. */
  rawRetentionDays?: number;
  interruptionBudget?: number;
  quietHours?: boolean;
}

export async function runCycle(
  sql: Sql, ownerId: string, opts: CycleOptions = {},
): Promise<CycleResult> {
  const t0 = Date.now();
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  const [run] = await sql<{ id: string }[]>`
    insert into cycle_runs (owner_id) values (${ownerId}) returning id`;
  const runId = run!.id;

  try {
    // Blackout يوقف الدورة كما يوقف الاستيعاب — لا استنتاج بلا إذن
    if (await isBlackout(sql, ownerId)) {
      await sql`update cycle_runs set status = 'skipped_blackout',
                finished_at = now(), duration_ms = ${Date.now() - t0}
                where id = ${runId}`;
      await audit(sql, ownerId, {
        actor: "system", action: "cycle", outcome: "denied",
        reason: "blackout نشط — لا استنتاج",
      });
      return { status: "skipped_blackout", findings: 0, surfaced: 0, inboxed: 0,
               below: 0, suppressed: 0, purgedEvents: 0,
               durationMs: Date.now() - t0, newSignals: [] };
    }

    const snapshot = await loadSnapshot(sql, ownerId, today);

    // ما عُرض سابقًا — هذا ما يجعل Novelty تعمل أصلًا
    const seenRows = await sql<{ dedupe_key: string }[]>`
      select dedupe_key from signals where owner_id = ${ownerId}`;
    const alreadySurfaced = new Set(seenRows.map((r) => r.dedupe_key));

    const budgetSpent = await spentToday(sql, ownerId, today);
    const result = runRules(ALL_RULES, { snapshot, alreadySurfaced }, {
      interruptionBudget: opts.interruptionBudget ?? 3,
      interruptionsSpent: budgetSpent,
      quietHours: opts.quietHours ?? false,
    });

    const all = [...result.surfaced, ...result.inbox, ...result.belowThreshold];
    const fresh = all.filter((s) => !alreadySurfaced.has(s.id));
    const suppressed = all.length - fresh.length;

    for (const s of fresh) await persist(sql, ownerId, s);

    const purgedEvents = await applyRetention(sql, ownerId, opts.rawRetentionDays ?? 30);

    const durationMs = Date.now() - t0;
    await sql`
      update cycle_runs set status = 'ok', finished_at = now(),
        findings = ${all.length}, surfaced = ${result.surfaced.length},
        inboxed = ${result.inbox.length}, below = ${result.belowThreshold.length},
        suppressed = ${suppressed}, purged_events = ${purgedEvents},
        duration_ms = ${durationMs}
      where id = ${runId}`;

    // قرار الصمت حدث حقيقي، لا غياب فعل — Expansion §6
    if (result.stayedSilent) {
      await audit(sql, ownerId, {
        actor: "system", action: "cycle.stayed_silent", outcome: "executed",
        reason: "لا شيء اجتاز البوابة",
      });
    }

    return {
      status: "ok",
      findings: all.length,
      surfaced: result.surfaced.length,
      inboxed: result.inbox.length,
      below: result.belowThreshold.length,
      suppressed, purgedEvents, durationMs,
      newSignals: fresh.map((s) => ({
        ruleCode: s.ruleCode, headline: s.headline, tier: s.tier,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sql`update cycle_runs set status = 'failed', finished_at = now(),
              error = ${message}, duration_ms = ${Date.now() - t0} where id = ${runId}`;
    throw err;
  }
}

async function persist(sql: Sql, ownerId: string, s: Signal): Promise<void> {
  await sql`
    insert into signals (owner_id, dedupe_key, rule_code, signal_type, headline, why_now,
      suggested_move, tier, goal_match, urgency, novelty, evidence_strength,
      timing_fit, interruption_cost, relevance, produced_by, sensitivity, surfaced_at)
    values (${ownerId}, ${s.id}, ${s.ruleCode}, ${s.domain}, ${s.headline}, ${s.whyNow},
      ${s.suggestedMove ?? null}, ${s.tier}, ${s.scores.goalMatch}, ${s.scores.urgency},
      ${s.scores.novelty}, ${s.scores.evidenceStrength}, ${s.scores.timingFit},
      ${s.scores.interruptionCost}, ${s.relevance}, ${s.producedBy}, ${s.sensitivity},
      ${s.tier === "below_threshold" ? null : new Date().toISOString()})
    on conflict (owner_id, dedupe_key) do nothing`;
}

/** كم مقاطعة صُرفت اليوم — الميزانية تُحسب من الإشارات المعروضة، لا من عدّاد منفصل. */
async function spentToday(sql: Sql, ownerId: string, today: string): Promise<number> {
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count from signals
    where owner_id = ${ownerId}
      and tier in ('nudge', 'interrupt')
      and surfaced_at >= ${today}::date
      and surfaced_at < (${today}::date + interval '1 day')`;
  return Number(rows[0]?.count ?? 0);
}

/**
 * سياسة الاحتفاظ — §5 في خريطة الحساسية.
 *
 * النشاط الخام يُحذف بعد مدته. الأحداث المرتبطة بكيان تبقى: هي سند تلك
 * الحقيقة، وحذفها يخلق حقيقة بلا مصدر. الخام غير المرتبط لا يسند شيئًا.
 */
async function applyRetention(sql: Sql, ownerId: string, days: number): Promise<number> {
  const rows = await sql<{ id: string }[]>`
    delete from events
    where owner_id = ${ownerId}
      and occurred_at < now() - (${days} || ' days')::interval
      and cardinality(entity_ids) = 0
      and event_type not like 'system.%'
    returning id`;
  return rows.length;
}

/** آخر الدورات — للمراقبة: دورة متوقفة يجب أن تُرى. */
export async function recentCycles(sql: Sql, ownerId: string, limit = 10) {
  return sql<{
    started_at: Date; status: string; findings: number; surfaced: number;
    suppressed: number; duration_ms: number | null; error: string | null;
  }[]>`
    select started_at, status, findings, surfaced, suppressed, duration_ms, error
    from cycle_runs where owner_id = ${ownerId}
    order by started_at desc limit ${limit}`;
}
