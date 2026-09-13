/* يلتقط لقطات مرجعية للعناصر الحالية من منصة التصوير.
   الاستعمال: node tools/shoot-props.mjs tent dome suv ...  (بعد تشغيل tools/serve.cjs) */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.env.NT_BASE || 'http://127.0.0.1:4173';
const outDir = path.resolve(process.cwd(), 'shots/props');
fs.mkdirSync(outDir, { recursive: true });
const props = process.argv.slice(2);
if (!props.length) { console.error('حدّد أسماء العناصر'); process.exit(1); }

// أربع زوايا مرتبة: أمام، يسار، خلف، يمين — وهو ترتيب مدخلات النماذج متعددة الرؤى
const ALL = { hero: [35, 18], front: [0, 16], left: [90, 16], back: [180, 16], right: [270, 16] };
const VIEWS = (process.env.NT_VIEWS || 'hero,front,left,back,right').split(',')
  .filter((k) => ALL[k]).map((k) => [k, ALL[k][0], ALL[k][1]]);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('  خطأ:', e.message));

for (const prop of props) {
  for (const [tag, az, el] of VIEWS) {
    const url = `${base}/tools/turntable.html?prop=${prop}&az=${az}&el=${el}&w=1024&h=1024`;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.NTSHOT && window.NTSHOT.ok, null, { timeout: 20000 });
    const shot = await page.evaluate(() => window.NTSHOT);
    const file = path.join(outDir, `${prop}-${tag}.png`);
    await page.locator('canvas').screenshot({ path: file });
    if (tag === VIEWS[0][0]) console.log(`${prop}: ${shot.parts} قطعة، مقاس ${shot.size.join(' × ')} م`);
  }
}
await browser.close();
console.log('اللقطات في', outDir);
