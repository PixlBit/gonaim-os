#!/usr/bin/env node
import postgres from "postgres";
import { migrate } from "../packages/db/src/migrate.js";

const url = process.env["DATABASE_URL"]
  ?? `postgres://${process.env["PGUSER"] ?? "postgres"}:${process.env["PGPASSWORD"] ?? ""}` +
     `@${process.env["PGHOST"] ?? "localhost"}:5432/${process.env["PGDATABASE"] ?? "gonaim"}`;

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  // Supabase تقدّم auth.uid(). خارجها نوفّرها حتى تُختبر سياسات RLS
  // بنفس الشكل — سياسة تُختبر في بيئة بلا RLS ليست مُختبرة.
  await sql`create schema if not exists auth`;
  await sql.unsafe(`create or replace function auth.uid() returns uuid
    language sql stable as $$ select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::json->>'sub',
      '00000000-0000-0000-0000-000000000001')::uuid $$`);

  const report = await migrate(sql, "supabase/migrations");
  for (const n of report.applied) console.log(`  applied  ${n}`);
  for (const n of report.skipped) console.log(`  skipped  ${n}`);
  console.log(`✓ ${report.applied.length} مطبَّقة · ${report.skipped.length} موجودة`);
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
