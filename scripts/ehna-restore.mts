#!/usr/bin/env node
/**
 * استرجاع مساحة إحنا من نسخة.
 *
 *   npm run ehna:restore -- .ehna/backups/ehna-2026-09-18T23-40-00
 *   npm run ehna:restore -- <نسخة> --force     فوق مساحة فيها بيانات
 *
 * الاسترجاع **يكتب فوق** المساحة الحالية. بلا `--force` يرفض لو كان فيها
 * أي شيء، لأن خطأ هنا لا رجعة فيه.
 *
 * ويسترجع إلى المخزَن المضبوط الآن — فنسخة من ملف تدخل Postgres بنفس
 * الأمر، وهو الطريق من الجهاز إلى الخادم.
 */
import { loadEnv } from "./env.mts";
import { restore } from "../packages/couple-db/src/backup.js";
import { openStore } from "../packages/couple-db/src/open.js";

loadEnv();

const argv = process.argv.slice(2);
const from = argv.find((a) => !a.startsWith("--"));
const force = argv.includes("--force");

if (!from) {
  console.error("\n  ✗ المسار مطلوب:  npm run ehna:restore -- <مجلد النسخة>\n");
  process.exit(1);
}

const store = openStore();

try {
  const current = await store.read().catch(() => null);
  if (current && !force) {
    const s = current.space;
    const busy = s.items.length + s.tasks.length + s.memories.length + s.expenses.length;
    if (busy > 0) {
      console.error(`\n  ✗ المساحة الحالية فيها بيانات (${busy} سطر) والاسترجاع هيكتب فوقها.`);
      console.error("    خد نسخة الأول:  npm run ehna:backup");
      console.error("    وبعدين:         npm run ehna:restore -- <النسخة> --force\n");
      process.exit(1);
    }
  }

  const report = await restore(store, from);
  console.log(`\n  ✓ اترجعت — نسخة المخزَن ${report.rev} · ${report.photos} صورة`);
  if (report.photosKept > 0) console.log(`    و${report.photosKept} صورة كانت موجودة بنفس المعرّف فاتسابت`);
  console.log("    الجلسات ما اترجعتش — كل واحد يدخل من جديد.\n");
} catch (err) {
  console.error(`\n  ✗ ${err instanceof Error ? err.message : err}\n`);
  process.exitCode = 1;
} finally {
  await store.close();
}
