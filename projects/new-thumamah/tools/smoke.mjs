/* فحص متصفح اختياري: يشغّل المشهد ويلتقط الحالات الثلاث. يحتاج Playwright وChromium.
   شغّله بعد `node tools/serve.cjs`:  node tools/smoke.mjs [http://127.0.0.1:4173] */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.log('Playwright غير مثبت — تخطّي الفحص البصري (npm i -D playwright).'); process.exit(0); }

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = path.resolve(process.cwd(), 'shots');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(8000);

const report = await page.evaluate(() => {
  const a = window.NT && window.NT.app;
  if (!a) return { booted: false };
  return {
    booted: true, quality: a.state.quality, meshes: a.world.meshes.length,
    drawCalls: a.renderer.info.render.calls, triangles: a.renderer.info.render.triangles,
    zones: window.NT.data.zones.length, labels: document.querySelectorAll('.label:not([hidden])').length
  };
});
for (const [button, name] of [['#view3d', '3d'], ['#viewPlan', 'plan'], ['#viewMap', 'map']]) {
  await page.click(button);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(outDir, `smoke-${name}.png`) });
}
console.log(JSON.stringify({ report, errors }, null, 1));
await browser.close();
if (!report.booted || errors.length) process.exit(1);
