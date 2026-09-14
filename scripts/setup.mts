#!/usr/bin/env node
/**
 * التجهيز — يُشغَّل مرة واحدة.
 *
 * ينشئ `.env` لو غاب، يولّد توكن الهاتف، يطبّق الهجرات، ويسجّل المالك.
 * قابل لإعادة التشغيل: لا يكتب فوق قيمة موجودة.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { loadEnv, OWNER } from "./env.mts";
import { migrate } from "../packages/db/src/migrate.js";

const ok = (m: string) => console.log(`  ✓ ${m}`);
const info = (m: string) => console.log(`    ${m}`);

// ── 1. ملف البيئة ───────────────────────────────────
if (!existsSync(".env")) {
  let body = readFileSync(".env.example", "utf8");
  body = body.replace(/^INGEST_TOKEN=$/m, `INGEST_TOKEN=${randomBytes(32).toString("hex")}`);
  writeFileSync(".env", body);
  ok("أُنشئ .env من المثال، وتوكن الهاتف مولَّد");
} else {
  let body = readFileSync(".env", "utf8");
  if (/^INGEST_TOKEN=\s*$/m.test(body)) {
    body = body.replace(/^INGEST_TOKEN=\s*$/m, `INGEST_TOKEN=${randomBytes(32).toString("hex")}`);
    writeFileSync(".env", body);
    ok("توكن الهاتف كان فارغًا — وُلِّد");
  } else {
    ok(".env موجود — لم يُمس");
  }
}

loadEnv();

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("\n  ✗ DATABASE_URL غير مضبوط في .env");
  process.exit(1);
}

// ── 2. الاتصال ──────────────────────────────────────
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`select 1`;
  ok("القاعدة متصلة");
} catch {
  console.error("\n  ✗ القاعدة لا تستجيب.");
  info("شغّلها أولًا:  docker compose up -d");
  info(`العنوان المضبوط: ${url.replace(/:[^:@]*@/, ":***@")}`);
  await sql.end();
  process.exit(1);
}

try {
  // ── 3. auth.uid — Supabase تقدّمها، ومحليًا نوفّرها
  //     حتى تعمل نفس سياسات RLS في التطوير والإنتاج
  await sql`create schema if not exists auth`;
  await sql.unsafe(`create or replace function auth.uid() returns uuid
    language sql stable as $$ select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::json->>'sub',
      '${OWNER}')::uuid $$`);

  // ── 4. الهجرات ────────────────────────────────────
  const report = await migrate(sql, "supabase/migrations");
  ok(report.applied.length > 0
    ? `طُبِّقت ${report.applied.length} هجرة`
    : `المخطط محدَّث (${report.skipped.length} هجرة)`);

  // ── 5. المالك ─────────────────────────────────────
  const email = process.env["OWNER_EMAIL"] ?? "owner@gonaim.local";
  const [user] = await sql<{ created: boolean }[]>`
    insert into users (id, email, display_name)
    values (${OWNER}, ${email}, 'Ahmed Gonaim')
    on conflict (id) do nothing
    returning true as created`;
  ok(user ? "سُجِّل المالك" : "المالك مسجَّل");

  console.log("\n  جاهز. الخطوة التالية:\n");
  console.log("    npm run doctor      فحص ما ينقص");
  console.log("    npm run dev:api     الخادم والدورة");
  console.log("    npm run dev         الواجهة\n");
} catch (err) {
  console.error(`\n  ✗ ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
