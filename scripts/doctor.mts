#!/usr/bin/env node
/**
 * الفحص — ما الذي ينقص، وماذا يعمل بدونه.
 *
 * الغرض ليس قائمة ✓/✗. كل نقص يُقال معه **ما الذي يتوقف بسببه**، لأن
 * "ANTHROPIC_API_KEY غير مضبوط" لا تعني شيئًا حتى تعرف أن المدخل هو
 * ما يتعطّل، وأن كل شيء آخر يعمل.
 */
import postgres from "postgres";
import { loadEnv, OWNER } from "./env.mts";

loadEnv();

type Level = "ok" | "warn" | "fail";
const marks: Record<Level, string> = { ok: "✓", warn: "○", fail: "✗" };
const lines: { level: Level; what: string; note?: string }[] = [];
const add = (level: Level, what: string, note?: string) =>
  lines.push({ level, what, ...(note !== undefined ? { note } : {}) });

// ── البيئة ──────────────────────────────────────────
const major = Number(process.versions.node.split(".")[0]);
major >= 22
  ? add("ok", `Node ${process.versions.node}`)
  : add("fail", `Node ${process.versions.node}`, "المطلوب 22 فأعلى — loadEnvFile وstrip-types");

const url = process.env["DATABASE_URL"];
if (!url) add("fail", "DATABASE_URL", "بدونه لا حفظ ولا قراءة ولا دورة. شغّل npm run setup");

// ── القاعدة ─────────────────────────────────────────
let counts: Record<string, number> | null = null;
let cycles: { status: string; started_at: Date }[] = [];

if (url) {
  const sql = postgres(url, { max: 1, onnotice: () => {}, connect_timeout: 5 });
  try {
    await sql`select 1`;
    add("ok", "القاعدة متصلة");

    const applied = await sql<{ name: string }[]>`
      select name from schema_migrations order by name`.catch(() => []);
    const onDisk = (await import("node:fs")).readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql")).length;

    if (applied.length === 0) add("fail", "الهجرات", "لم تُطبَّق. شغّل npm run setup");
    else if (applied.length < onDisk)
      add("fail", `الهجرات ${applied.length}/${onDisk}`, "ناقصة. شغّل npm run migrate");
    else add("ok", `الهجرات ${applied.length}/${onDisk}`);

    const owner = await sql`select 1 from users where id = ${OWNER}`.catch(() => []);
    owner.length > 0
      ? add("ok", "المالك مسجَّل")
      : add("fail", "المالك", "غير مسجَّل. شغّل npm run setup");

    if (applied.length >= onDisk && owner.length > 0) {
      const [row] = await sql<Record<string, string>[]>`
        select
          (select count(*) from entities   where owner_id = ${OWNER} and state = 'active')::text as entities,
          (select count(*) from events     where owner_id = ${OWNER})::text as events,
          (select count(*) from signals    where owner_id = ${OWNER})::text as signals,
          (select count(*) from audit_log  where owner_id = ${OWNER})::text as audit`;
      counts = Object.fromEntries(Object.entries(row ?? {}).map(([k, v]) => [k, Number(v)]));

      cycles = await sql<{ status: string; started_at: Date }[]>`
        select status, started_at from cycle_runs
        where owner_id = ${OWNER} order by started_at desc limit 5`.catch(() => []);
    }
  } catch {
    add("fail", "القاعدة", "لا تستجيب. شغّل docker compose up -d");
  } finally {
    await sql.end();
  }
}

// ── المفاتيح ────────────────────────────────────────
process.env["ANTHROPIC_API_KEY"]
  ? add("ok", "ANTHROPIC_API_KEY")
  : add("warn", "ANTHROPIC_API_KEY",
        "المدخل المحادثي وطبقة إحنا الاختيارية معطّلان. كل شيء آخر يعمل — " +
        "القواعد والدورة ومساحة إحنا لا تحتاج نموذجًا");

const token = process.env["INGEST_TOKEN"];
token
  ? add("ok", "INGEST_TOKEN")
  : add("warn", "INGEST_TOKEN", "بوابة الهاتف مقفلة. شغّل npm run setup ليولّده");

const cycleMinutes = Number(process.env["CYCLE_MINUTES"] ?? 60);
cycleMinutes > 0
  ? add("ok", `الدورة كل ${cycleMinutes} دقيقة`)
  : add("warn", "الدورة", "المؤقّت موقوف (CYCLE_MINUTES=0). شغّلها بـnpm run cycle");

// ── العرض ───────────────────────────────────────────
console.log();
for (const l of lines) {
  console.log(`  ${marks[l.level]} ${l.what}`);
  if (l.note) console.log(`     ${l.note}`);
}

if (counts) {
  console.log("\n  ما تعرفه القاعدة:");
  console.log(`     ${counts["entities"]} كيانًا · ${counts["events"]} حدثًا · ` +
              `${counts["signals"]} إشارة · ${counts["audit"]} سجل تدقيق`);
  if (counts["entities"] === 0) {
    console.log("     فارغة — افتح الواجهة واستخدم capture");
  }
}

if (cycles.length > 0) {
  const last = cycles[0]!;
  const mins = Math.round((Date.now() - last.started_at.getTime()) / 60000);
  console.log(`\n  آخر دورة: ${last.status} — من ${mins} دقيقة`);
  const failed = cycles.filter((c) => c.status === "failed").length;
  if (failed > 0) console.log(`     ✗ ${failed} من آخر ${cycles.length} دورات فشلت`);
}

const failures = lines.filter((l) => l.level === "fail").length;
console.log(failures === 0 ? "\n  جاهز.\n" : `\n  ${failures} حاجة توقف التشغيل.\n`);
process.exitCode = failures > 0 ? 1 : 0;
