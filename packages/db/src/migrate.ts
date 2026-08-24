import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { Sql } from "postgres";

/**
 * مشغّل الهجرات.
 *
 * ثلاث ضمانات:
 *  1. الترتيب — بالاسم، فترقيم الملفات هو الترتيب.
 *  2. مرة واحدة — ما طُبِّق لا يُعاد.
 *  3. لا تعديل بأثر رجعي — تغيير ملف مطبَّق يوقف التشغيل بدل أن يمر بصمت،
 *     لأن قاعدتك ستختلف عن قاعدة أي شخص آخر بلا أن يلاحظ أحد.
 */

export interface Migration { name: string; sql: string; checksum: string }

export function loadMigrations(dir: string): Migration[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => {
      const sql = readFileSync(join(dir, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

export interface MigrateReport {
  applied: string[];
  skipped: string[];
}

export async function migrate(sql: Sql, dir: string): Promise<MigrateReport> {
  await sql`
    create table if not exists schema_migrations (
      name        text primary key,
      checksum    text not null,
      applied_at  timestamptz not null default now()
    )`;

  const done = await sql<{ name: string; checksum: string }[]>`
    select name, checksum from schema_migrations`;
  const byName = new Map(done.map((r) => [r.name, r.checksum]));

  const report: MigrateReport = { applied: [], skipped: [] };

  for (const m of loadMigrations(dir)) {
    const previous = byName.get(m.name);
    if (previous !== undefined) {
      if (previous !== m.checksum) {
        throw new Error(
          `migration_modified: ${m.name} تغيّر بعد تطبيقه.\n` +
          `الهجرة المطبَّقة لا تُعدَّل — أضف هجرة جديدة تصحّح ما سبق.`,
        );
      }
      report.skipped.push(m.name);
      continue;
    }
    // كل هجرة في معاملة واحدة: تنجح كاملة أو لا تُطبَّق
    await sql.begin(async (tx) => {
      await tx.unsafe(m.sql);
      await tx`insert into schema_migrations (name, checksum) values (${m.name}, ${m.checksum})`;
    });
    report.applied.push(m.name);
  }

  return report;
}
