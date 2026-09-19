#!/usr/bin/env node
/**
 * فحص مخرَج البناء بحثًا عن أسرار.
 *
 * معيار قبول M0: "لا مفتاح في أي bundle — اختبار CI يفشل البناء".
 * ADR-0006 يمنع وصول المفاتيح إلى العميل؛ هذا ما يجعل المنع قابلًا للإثبات
 * بدل أن يظل نية.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["apps/web/dist"];
const TEXT = /\.(js|mjs|cjs|css|html|json|map)$/;

const PATTERNS = [
  [/\bsk-ant-[A-Za-z0-9_-]{16,}/, "Anthropic API key"],
  [/\bsk-[A-Za-z0-9]{32,}/, "generic provider key"],
  [/\bghp_[A-Za-z0-9]{20,}/, "GitHub token"],
  [/\bAIza[A-Za-z0-9_-]{30,}/, "Google API key"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JWT"],
  [/\bSUPABASE_SERVICE_ROLE\w*\s*[:=]\s*["'][^"']+/, "Supabase service role"],
  [/\bANTHROPIC_API_KEY\s*[:=]\s*["'][^"']+/, "inlined ANTHROPIC_API_KEY"],
];

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (TEXT.test(e)) yield p;
  }
}

let scanned = 0;
const findings = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    scanned++;
    const body = readFileSync(file, "utf8");
    for (const [re, label] of PATTERNS) {
      const m = body.match(re);
      if (m) findings.push({ file, label, sample: m[0].slice(0, 12) + "…" });
    }
  }
}

if (scanned === 0) {
  console.error("scan-bundle: لا ملفات مبنية. شغّل البناء أولًا.");
  process.exit(2);
}

if (findings.length > 0) {
  console.error(`\n✗ أسرار في مخرَج البناء (${findings.length}):\n`);
  for (const f of findings) console.error(`  ${f.file}\n    ${f.label}: ${f.sample}`);
  console.error("\nالمفاتيح تبقى في الخادم — راجع ADR-0006.\n");
  process.exit(1);
}

console.log(`✓ scan-bundle: ${scanned} ملفًا، بلا أسرار`);
