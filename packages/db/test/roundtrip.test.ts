import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { migrate, commitCandidates, loadSnapshot, audit, type ConfirmedCandidate } from "../src/index.js";
import { ALL_RULES, runRules } from "@gonaim/rules";
import type { Sql } from "postgres";

const URL = process.env["DATABASE_URL"];
const d = URL ? describe : describe.skip;
const TODAY = "2026-08-22";
const OWNER = "00000000-0000-0000-0000-000000000001";

d("الدورة كاملة على Postgres", () => {
  let sql: Sql;

  beforeAll(async () => {
    sql = postgres(URL!, { max: 2, onnotice: () => {} });
    await sql`drop schema if exists public cascade`;
    await sql`create schema public`;
    await sql`create schema if not exists auth`;
    await sql.unsafe(`create or replace function auth.uid() returns uuid
      language sql stable as $$ select '${OWNER}'::uuid $$`);
    await migrate(sql, "supabase/migrations");
    await sql`insert into users (id, email, display_name)
              values (${OWNER}, 'ahmgonaim@gmail.com', 'Ahmed Gonaim')`;
  });

  afterAll(async () => { await sql?.end(); });

  it("الهجرات تُطبَّق مرة واحدة", async () => {
    const again = await migrate(sql, "supabase/migrations");
    expect(again.applied).toEqual([]);
    expect(again.skipped.length).toBeGreaterThanOrEqual(2);
  });

  it("هجرة عُدِّلت بعد تطبيقها توقف التشغيل", async () => {
    await sql`update schema_migrations set checksum = 'tampered' where name like '0001%'`;
    await expect(migrate(sql, "supabase/migrations")).rejects.toThrow(/migration_modified/);
    // نعيد الحالة حتى لا يتأثر ما بعده
    const [row] = await sql<{ name: string }[]>`select name from schema_migrations where name like '0001%'`;
    await sql`delete from schema_migrations where name = ${row!.name}`;
    await sql`insert into schema_migrations (name, checksum)
              select ${row!.name}, encode(sha256(convert_to(${await read("0001")}, 'utf8')), 'hex')`;
  });

  it("الحفظ يكتب الحدث والكيان والوجه معًا", async () => {
    const out = await commitCandidates(sql, OWNER, [
      { kind: "subscription", title: "OpenAI Plus", provider: "OpenAI", amount: 75,
        currency: "SAR", cycle: "monthly", renewsOn: "2026-08-27",
        creditIncluded: 100, creditUsed: 8, creditUnit: "messages",
        evidenceText: "مشترك في OpenAI ب75 ريال", confidence: 0.92 },
      { kind: "invoice", title: "Invoice #6021", direction: "incoming",
        counterparty: "Studio Client", amount: 8500, currency: "SAR",
        issuedOn: "2026-08-04", typicalDays: 14,
        evidenceText: "فاتورة 8500 ريال عند Studio Client", confidence: 0.9 },
    ], { capturedAt: "2026-08-22T09:00:00Z", redactedCount: 0 });

    expect(out.saved).toHaveLength(2);

    // كل كيان مرتبط بالحدث الذي أنتجه — لا حقيقة يتيمة
    const [ev] = await sql<{ entity_ids: string[] }[]>`
      select entity_ids from events where id = ${out.eventId}`;
    expect(ev!.entity_ids).toHaveLength(2);
  });

  it("القراءة تعيد ما كُتب، والقواعد تعمل عليه", async () => {
    const snap = await loadSnapshot(sql, OWNER, TODAY);
    expect(snap.subscriptions).toHaveLength(1);
    expect(snap.subscriptions[0]?.amount).toBe(75);       // numeric لا يعود نصًا
    expect(snap.invoices[0]?.typicalDays).toBe(14);

    const result = runRules(ALL_RULES, { snapshot: snap, alreadySurfaced: new Set() },
                            { interruptionBudget: 10 });
    const codes = [...result.surfaced, ...result.inbox].map((s) => s.ruleCode);
    expect(codes).toContain("invoice.overdue_vs_typical");
    expect(codes).toContain("sub.credit_underused");
  });

  it("فاتورة بلا معتاد معروف لا تُطلق قاعدة", async () => {
    await sql`update invoices set typical_days = null where owner_id = ${OWNER}`;
    const snap = await loadSnapshot(sql, OWNER, TODAY);
    expect(snap.invoices[0]?.typicalDays).toBeUndefined();
    const r = runRules(ALL_RULES, { snapshot: snap, alreadySurfaced: new Set() },
                       { interruptionBudget: 10 });
    expect([...r.surfaced, ...r.inbox].map((s) => s.ruleCode))
      .not.toContain("invoice.overdue_vs_typical");
    await sql`update invoices set typical_days = 14 where owner_id = ${OWNER}`;
  });

  it("الحفظ يترك أثرًا في سجل التدقيق", async () => {
    const rows = await sql<{ action: string; outcome: string }[]>`
      select action, outcome from audit_log where owner_id = ${OWNER}`;
    expect(rows.some((r) => r.action === "commit_candidates" && r.outcome === "executed")).toBe(true);
  });

  it("الفعل المرفوض يُسجَّل أيضًا — الرفض يثبت أن الحد اشتغل", async () => {
    await audit(sql, OWNER, {
      actor: "cortex", action: "send_email", outcome: "denied",
      risk: "external_action", reason: "L0 — الإرسال غير مفعّل",
    });
    const [row] = await sql<{ reason: string }[]>`
      select reason from audit_log where owner_id = ${OWNER} and outcome = 'denied'`;
    expect(row?.reason).toContain("L0");
  });

  it("التقاط مكرر لا ينشئ حدثًا ثانيًا", async () => {
    const candidates: ConfirmedCandidate[] = [{
      kind: "want", title: "Sony WH-1000XM5", category: "headphones",
      targetPrice: 1350, currency: "SAR", whyWant: ["حساسية للضوضاء"],
      evidenceText: "نفسي في سماعة سوني", confidence: 0.8,
    }];
    const ctx = { capturedAt: "2026-08-22T10:00:00Z", redactedCount: 0 };
    const a = await commitCandidates(sql, OWNER, candidates, ctx);
    const b = await commitCandidates(sql, OWNER, candidates, ctx);
    expect(b.eventId).toBe(a.eventId);
  });
});

async function read(prefix: string): Promise<string> {
  const { readdirSync, readFileSync } = await import("node:fs");
  const f = readdirSync("supabase/migrations").find((n) => n.startsWith(prefix))!;
  return readFileSync(`supabase/migrations/${f}`, "utf8");
}
