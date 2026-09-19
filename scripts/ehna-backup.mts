#!/usr/bin/env node
/**
 * نسخة احتياطية من مساحة إحنا.
 *
 *   npm run ehna:backup              نسخة جديدة، ويُبقي آخر ١٤
 *   npm run ehna:backup -- --list    ما هو موجود
 *   npm run ehna:backup -- --keep 30
 *
 * النسخة مجلد فيه `vault.json` والصور كلها — وتعمل عبر عقد المخزَن، فتنسخ
 * من ملف أو من Postgres بنفس الأمر.
 *
 * الوجهة `EHNA_BACKUPS` أو `.ehna/backups`. ضعها على قرص آخر أو مزامنة
 * إن أمكن: نسخة بجوار الأصل تموت معه.
 */
import { loadEnv } from "./env.mts";
import { backup, listBackups, prune } from "../packages/couple-db/src/backup.js";
import { openStore } from "../packages/couple-db/src/open.js";

loadEnv();

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const value = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const into = process.env["EHNA_BACKUPS"] ?? `${process.env["EHNA_DIR"] ?? ".ehna"}/backups`;
const keep = Number(value("--keep") ?? process.env["EHNA_BACKUPS_KEEP"] ?? 14);
const store = openStore();

try {
  if (flag("--list")) {
    const all = await listBackups(into);
    console.log(`\n  ${into}`);
    if (all.length === 0) console.log("    مفيش نسخ لسه.\n");
    else { for (const name of all) console.log(`    ${name}`); console.log(""); }
    process.exit(0);
  }

  const report = await backup(store, into);
  console.log(`\n  ✓ ${report.path}`);
  console.log(`    نسخة ${report.rev} · ${report.photos} صورة`);

  const dropped = await prune(into, keep);
  if (dropped.length > 0) console.log(`    واتشالت ${dropped.length} نسخة قديمة (الحد ${keep})`);
  console.log(`\n  للاسترجاع:  npm run ehna:restore -- ${report.path}\n`);
} catch (err) {
  console.error(`\n  ✗ ${err instanceof Error ? err.message : err}\n`);
  process.exitCode = 1;
} finally {
  await store.close();
}
