import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { migrate, commitCandidates, loadSnapshot, audit, exportMind, forget, type ConfirmedCandidate } from "../src/index.js";
import { ALL_RULES, runRules } from "@gonaim/rules";
import type { Sql } from "postgres";

const URL = process.env["DATABASE_URL"];
const d = URL ? describe : describe.skip;
const TODAY = "2026-08-22";
const OWNER = "00000000-0000-0000-0000-000000000001";

let sql: Sql;

beforeAll(async () => {
  if (!URL) return;
  sql = postgres(URL, { max: 4, onnotice: () => {} });
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

d("الدورة كاملة على Postgres", () => {

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

d("Export my mind", () => {
  it("يخرج الصيغ الثلاث", async () => {
    const { files } = await exportMind(sql, OWNER);
    const names = files.map((f) => f.name);
    expect(names).toContain("manifest.json");
    expect(names).toContain("nodes.json");
    expect(names).toContain("life.md");
    expect(names.filter((n) => n.endsWith(".csv")).length).toBeGreaterThan(3);
  });

  it("يعلن ما ليس فيه — تصدير يوحي بالاكتمال أسوأ من ناقص معلَن", async () => {
    const { manifest } = await exportMind(sql, OWNER);
    expect(manifest.notIncluded.length).toBeGreaterThanOrEqual(4);
    const all = manifest.notIncluded.map((n) => n.what).join(" ");
    expect(all).toContain("الملفات");
    expect(all).toContain("المفاتيح");
  });

  it("لا يصدّر أعمدة الأسرار ولا المتجهات", async () => {
    const { files } = await exportMind(sql, OWNER);
    const nodes = files.find((f) => f.name === "nodes.json")!.content;
    expect(nodes).not.toContain("\"embedding\"");
    expect(nodes).not.toContain("sk-ant");
  });

  it("Markdown مقروء بلا أدوات ويحمل إصدار المخطط", async () => {
    const { files } = await exportMind(sql, OWNER);
    const md = files.find((f) => f.name === "life.md")!.content;
    expect(md).toContain("# GONAIM//OS");
    expect(md).toContain("0001_init.sql");
    expect(md).toContain("## ما ليس في هذا التصدير");
    // الفاتورة بلا معتاد تُكتب صراحة، لا تُترك فارغة
    expect(md).toMatch(/المعتاد (غير معروف|\d+ يومًا)/);
  });

  it("CSV يبدأ بـBOM حتى تفتح العربية صحيحة", async () => {
    const { files } = await exportMind(sql, OWNER);
    const csv = files.find((f) => f.name === "subscriptions.csv")!.content;
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("التصدير نفسه فعل مسجَّل", async () => {
    await exportMind(sql, OWNER);
    const [row] = await sql<{ action: string }[]>`
      select action from audit_log where owner_id = ${OWNER}
      and action = 'export_mind' order by at desc limit 1`;
    expect(row?.action).toBe("export_mind");
  });

  it("الأعداد في البيان تطابق ما في الملفات", async () => {
    const { manifest, files } = await exportMind(sql, OWNER);
    const nodes = JSON.parse(files.find((f) => f.name === "nodes.json")!.content);
    expect(nodes.subscriptions).toHaveLength(manifest.counts["subscriptions"]!);
    expect(nodes.entities).toHaveLength(manifest.counts["entities"]!);
  });
});

d("Proof of Forgetting", () => {
  const OWNER2 = "00000000-0000-0000-0000-000000000002";

  beforeAll(async () => {
    await sql`insert into users (id, email, display_name)
              values (${OWNER2}, 'forget@test', 'Forget Test')
              on conflict (id) do nothing`;
  });

  async function seed(sourceUri: string | null = null) {
    const [e] = await sql<{ id: string }[]>`
      insert into entities (owner_id, type, title, sensitivity, source_uri)
      values (${OWNER2}, 'want', 'شيء عابر', 'private', ${sourceUri})
      returning id`;
    await sql`insert into wish_items (entity_id, owner_id, state, currency)
              values (${e!.id}, ${OWNER2}, 'want', 'SAR')`;
    return e!.id;
  }

  it("يحذف الكيان ووجهه معًا", async () => {
    const id = await seed();
    const r = await forget(sql, OWNER2, [id]);
    expect(r.deleted["entities"]).toBe(1);
    const left = await sql`select 1 from wish_items where entity_id = ${id}`;
    expect(left).toHaveLength(0);
  });

  it("لا يقول «نُسي» ما دام سجل التدقيق يذكره", async () => {
    const id = await seed();
    await sql`insert into audit_log (owner_id, actor, action, outcome, target_id)
              values (${OWNER2}, 'owner', 'commit_candidates', 'executed', ${id})`;
    const r = await forget(sql, OWNER2, [id]);
    expect(r.complete).toBe(false);
    const why = r.retained.map((x) => x.why).join(" ");
    expect(why).toContain("سجل التدقيق لا يُحذف");
  });

  it("الأصل الخارجي يُسمّى ويُطلب فعل من المالك", async () => {
    const id = await seed("https://drive.google.com/file/abc");
    const r = await forget(sql, OWNER2, [id]);
    expect(r.complete).toBe(false);
    expect(r.externalRemnants[0]?.where).toContain("drive.google.com");
    expect(r.externalRemnants[0]?.action).toContain("احذفه من مصدره");
  });

  it("الحدث يُجرَّد من الإشارة ولا يُحذف", async () => {
    const id = await seed();
    const [ev] = await sql<{ id: string }[]>`
      insert into events (owner_id, event_type, occurred_at, source, sensitivity,
                          observed_or_inferred, entity_ids, fingerprint)
      values (${OWNER2}, 'manual.capture.created', now(), 'manual', 'private',
              'observed', array[${id}::uuid], ${"fp_" + id})
      returning id`;

    const r = await forget(sql, OWNER2, [id]);
    const [after] = await sql<{ entity_ids: string[] }[]>`
      select entity_ids from events where id = ${ev!.id}`;
    // الحدث باقٍ — أن شيئًا وقع في وقت ما يظل صحيحًا
    expect(after).toBeDefined();
    expect(after!.entity_ids).toHaveLength(0);
    expect(r.retained.some((x) => x.what.includes("أحداث"))).toBe(true);
  });

  it("ذاكرة فقدت مصدرها الوحيد تُحذف — ذاكرة بلا مصدر حالة محرَّمة", async () => {
    const id = await seed();
    const [m] = await sql<{ id: string }[]>`
      insert into memories (owner_id, kind, statement, confidence, confidence_reason,
                            sensitivity, created_by)
      values (${OWNER2}, 'preference', 'يحب الأسود', 0.9, 'تكرر', 'private', 'cortex')
      returning id`;
    await sql`insert into memory_sources (memory_id, entity_id) values (${m!.id}, ${id})`;

    const r = await forget(sql, OWNER2, [id]);
    expect(r.deleted["memories"]).toBe(1);
    expect(await sql`select 1 from memories where id = ${m!.id}`).toHaveLength(0);
  });

  it("ذاكرة لها مصدر آخر تبقى", async () => {
    const a = await seed();
    const b = await seed();
    const [m] = await sql<{ id: string }[]>`
      insert into memories (owner_id, kind, statement, confidence, confidence_reason,
                            sensitivity, created_by)
      values (${OWNER2}, 'preference', 'مصدران', 0.9, 'تكرر', 'private', 'cortex')
      returning id`;
    await sql`insert into memory_sources (memory_id, entity_id) values (${m!.id}, ${a})`;
    await sql`insert into memory_sources (memory_id, entity_id) values (${m!.id}, ${b})`;

    await forget(sql, OWNER2, [a]);
    expect(await sql`select 1 from memories where id = ${m!.id}`).toHaveLength(1);
    await forget(sql, OWNER2, [b]);
  });

  it("الإيصال يُحفظ ويمكن مراجعته لاحقًا", async () => {
    const id = await seed();
    await forget(sql, OWNER2, [id], "ما عدت أريده");
    const [row] = await sql<{ complete: boolean; deleted_counts: unknown }[]>`
      select complete, deleted_counts from purge_receipts
      where owner_id = ${OWNER2} order by requested_at desc limit 1`;
    expect(row).toBeDefined();
    expect(row!.deleted_counts).toMatchObject({ entities: 1 });
  });

  it("النسيان نفسه فعل مسجَّل بمخاطرة مُعلنة", async () => {
    const id = await seed();
    await forget(sql, OWNER2, [id], "تجربة");
    const [row] = await sql<{ risk: string; reason: string }[]>`
      select risk, reason from audit_log where owner_id = ${OWNER2}
      and action = 'forget' order by at desc limit 1`;
    expect(row!.risk).toBe("destructive");
    expect(row!.reason).toBe("تجربة");
  });

  it("ما ليس ملكك لا يُحذف", async () => {
    const id = await seed();
    await expect(forget(sql, OWNER, [id])).rejects.toThrow(/not_found/);
    await forget(sql, OWNER2, [id]);
  });
});
