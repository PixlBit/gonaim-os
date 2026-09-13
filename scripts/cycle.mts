#!/usr/bin/env node
/** تشغيل دورة واحدة — لـcron خارجي أو للتشغيل اليدوي. */
import postgres from "postgres";
import { runCycle, recentCycles } from "../packages/db/src/index.js";

const url = process.env["DATABASE_URL"];
if (!url) { console.error("✗ DATABASE_URL غير مضبوط"); process.exit(1); }

const owner = process.env["OWNER_ID"] ?? "00000000-0000-0000-0000-000000000001";
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const r = await runCycle(sql, owner);
  if (r.status === "skipped_blackout") {
    console.log("⏸  blackout نشط — لا استنتاج");
  } else {
    console.log(`✓ ${r.findings} ملاحظة · ${r.newSignals.length} جديدة · ${r.suppressed} مكبوتة`);
    for (const s of r.newSignals) console.log(`   [${s.tier}] ${s.headline}`);
    if (r.purgedEvents > 0) console.log(`   حُذف ${r.purgedEvents} حدثًا خامًا بانتهاء مدته`);
  }

  if (process.argv.includes("--history")) {
    console.log("\nآخر الدورات:");
    for (const c of await recentCycles(sql, owner, 10)) {
      console.log(`   ${c.started_at.toISOString().slice(0, 16)}  ${c.status.padEnd(16)}` +
                  `${String(c.findings).padStart(3)} ملاحظة  ${c.duration_ms ?? "?"}ms` +
                  (c.error ? `  ✗ ${c.error}` : ""));
    }
  }
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
