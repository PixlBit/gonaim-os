/* لقطات مرجعية من المشهد لتقييم الطرق والرمل والسحاب والبيئة.
   الاستعمال: node tools/serve.cjs &  ثم  NODE_PATH=... node tools/shots.mjs [day|sunset|night] */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.env.NT_BASE || 'http://127.0.0.1:4173';
const time = process.argv[2] || 'day';
const outDir = path.resolve(process.cwd(), 'shots/scene');
fs.mkdirSync(outDir, { recursive: true });

/* زوايا مختارة: كل واحدة تختبر شيئًا بعينه */
const VIEWS = [
  { id: 'road',   target: [50, 0, 660],   az: 0.05, pitch: 0.09, dist: 110 },  // الطريق المعبّد من ارتفاع النظر
  { id: 'gate',   target: [380, 0, 520],  az: 0.35, pitch: 0.18, dist: 240 },  // البوابة والمواقف
  { id: 'dunes',  target: [520, 0, -370], az: 0.80, pitch: 0.11, dist: 380 },  // كثبان العزم ونسيج الرمل
  { id: 'sky',    target: [0, 0, 0],      az: 0.60, pitch: 0.05, dist: 1200 }, // الأفق والسحاب
  { id: 'camp',   target: [-370, 0, 160], az: -0.85, pitch: 0.20, dist: 260 }, // المخيمات
  { id: 'ground', target: [-250, 0, -250], az: 0.9, pitch: 0.22, dist: 45 },   // أرض مكشوفة عن قرب
  { id: 'hero',   target: [0, 0, 100],    az: 0.55, pitch: 0.34, dist: 1800 }  // اللقطة العامة
];

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => errors.push(e.message));

/* الطلبات الخارجية محجوبة على هذه البيئة، وانتظارها يعلّق الالتقاط:
   لقطة الصفحة تنتظر document.fonts.ready، وخط لا يصل لا يحسم أبدًا. */
await page.route('**://**', (route) => {
  const host = new URL(route.request().url()).hostname;
  if (host === '127.0.0.1' || host === 'localhost') return route.continue();
  return route.abort();
});

await page.goto(base, { waitUntil: 'load' });
await page.waitForFunction(() => window.NT && window.NT.app && window.NT.app.world, null, { timeout: 300000 });
await page.waitForTimeout(9000);   // تحميل النماذج يستغرق وقتًا
// إخفاء واجهة الاستخدام حتى تبقى اللقطة للمشهد وحده
await page.addStyleTag({ content: '.overlay,.labels,.loader,.attribution,.corners,.panel,.compass{display:none!important}' });
await page.evaluate(() => window.dispatchEvent(new Event('resize')));
await page.waitForTimeout(800);
await page.evaluate((t) => window.NT.app.setTime(t), time);
await page.waitForTimeout(1500);

for (const v of VIEWS) {
  await page.evaluate((view) => {
    const THREE = window.THREE, rig = window.NT.app.rig;
    rig.flyTo({ target: new THREE.Vector3(...view.target), az: view.az, pitch: view.pitch, dist: view.dist, ms: 1 });
  }, v);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(outDir, `${time}-${v.id}.png`), animations: 'disabled', timeout: 90000, caret: 'hide' });
}

const info = await page.evaluate(() => ({
  meshes: window.NT.app.world.meshes.length,
  calls: window.NT.app.renderer.info.render.calls,
  tris: window.NT.app.renderer.info.render.triangles,
  models: window.NT.models.info.available
}));
console.log(JSON.stringify(info), errors.length ? '\nأخطاء: ' + errors.slice(0, 3).join(' | ') : '');
await browser.close();
