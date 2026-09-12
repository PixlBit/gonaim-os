/* فحوص بلا شبكة وبلا مكتبات: سلامة البيانات، الهندسة الجغرافية، التصدير، وروابط الملفات.
   الفحص البصري للمشهد ثلاثي الأبعاد في tools/smoke.mjs (يحتاج Playwright، اختياري). */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const ok = (name) => checks.push(name);

/* 1. كل ملفات المصدر تُحلَّل بلا أخطاء نحوية */
const sources = ['data', 'geo', 'textures', 'props', 'content', 'world', 'basemap', 'mapview', 'controls', 'app'];
for (const name of sources) new vm.Script(read(`src/${name}.js`), { filename: `${name}.js` });
ok('صحة بناء الجملة في ' + sources.length + ' ملفات');

/* 2. index.html يشير إلى كل الملفات، ولا يشير إلى المرجع */
const html = read('index.html');
for (const name of sources) assert.ok(html.includes(`src/${name}.js`), `index.html لا يحمّل ${name}.js`);
assert.ok(html.includes('vendor/three.js'), 'محرك العرض غير محمّل');
assert.ok(html.includes('assets/app.css'), 'ملف التنسيق غير محمّل');
assert.ok(!/reference\//.test(html), 'يجب ألا يشير التطبيق إلى مجلد المرجع');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'معرّفات مكررة في index.html');
ok('روابط الملفات ومعرّفات DOM');

/* 3. تحميل البيانات والهندسة الجغرافية في بيئة معزولة */
const sandbox = { window: {}, Math, JSON, console, Date };
sandbox.window.NT = {};
vm.runInNewContext(read('src/data.js') + '\n' + read('src/geo.js'), sandbox);
const NT = sandbox.window.NT;
const { site, zones, categories } = NT.data;

assert.equal(zones.length, 9, 'عدد المناطق');
for (const z of zones) {
  assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= 1500 && z.y + z.d <= 1500, `${z.id} خارج حدود الأرض`);
  assert.ok(z.program && z.program.length >= 3, `${z.id} بلا برنامج`);
  assert.ok(z.focus && z.view, `${z.id} بلا نقطة تركيز أو زاوية عرض`);
}
for (let i = 0; i < zones.length; i++) {
  for (let j = i + 1; j < zones.length; j++) {
    const a = zones[i], b = zones[j];
    const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y;
    assert.ok(!overlap, `تداخل بين ${a.id} و${b.id}`);
  }
}
ok('المناطق داخل الحدود وبلا تداخل');

const total = site.width * site.depth;
const sum = categories.reduce((acc, c) => acc + NT.geo.categoryArea(c.id), 0);
assert.ok(Math.abs(sum - total) < 1, `مجموع الاستخدامات ${sum} لا يساوي ${total}`);
assert.ok(NT.geo.openArea() > 0, 'الأرض المفتوحة سالبة');
ok('تقسيم المساحات مكتمل (' + total.toLocaleString('en-US') + ' م²)');

/* 4. التصحيح المكاني: الغروب غربًا، والمبيت بعيد عن الفعاليات */
const byId = Object.fromEntries(zones.map((z) => [z.id, z]));
const centre = (z) => [z.x + z.w / 2, z.y + z.d / 2];
assert.ok(centre(byId.S1)[0] < 750, 'الغروب والضيافة يجب أن تكون في النصف الغربي');
assert.ok(centre(byId.D1)[1] > 900 && centre(byId.V1)[1] > 900, 'المبيت الهادئ يجب أن يكون في الشمال');
const gap = Math.hypot(centre(byId.V1)[0] - centre(byId.E1)[0], centre(byId.V1)[1] - centre(byId.E1)[1]);
assert.ok(gap > 600, 'المبيت الخاص قريب جدًا من منطقة الفعاليات: ' + Math.round(gap) + ' م');
ok('منطق التوزيع: الغروب غربًا والمبيت معزول');

/* 5. مسافات WGS 84 على أضلاع الأرض */
function ecef([lon, lat]) {
  const d = Math.PI / 180, e2 = 0.0066943799901413165, a = 6378137;
  lat *= d; lon *= d;
  const n = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return [n * Math.cos(lat) * Math.cos(lon), n * Math.cos(lat) * Math.sin(lon), n * (1 - e2) * Math.sin(lat)];
}
const distance = (a, b) => { const p = ecef(a), q = ecef(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
const geo = NT.geo.geoJSON();
const ring = geo.features[0].geometry.coordinates[0];
assert.ok(Math.abs(distance(ring[0], ring[1]) - site.width) < 0.02, 'طول الضلع الشرقي');
assert.ok(Math.abs(distance(ring[0], ring[3]) - site.depth) < 0.02, 'طول الضلع الشمالي');
assert.ok(Math.abs(ring[0][0] - site.lon) < 1e-9 && Math.abs(ring[0][1] - site.lat) < 1e-9, 'الركن الجنوبي الغربي عند النقطة المعطاة');
ok('إسناد WGS 84 وأطوال الأضلاع بدقة سنتيمتر');

/* 6. سلامة GeoJSON */
const kinds = geo.features.map((f) => f.properties.kind || f.properties.land_use);
assert.ok(kinds.includes('concept_boundary') && kinds.includes('trail') && kinds.includes('circulation'), 'معالم ناقصة في GeoJSON');
assert.equal(geo.features.filter((f) => f.geometry.type === 'Polygon').length, 11, 'عدد المضلعات');
for (const f of geo.features) {
  const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates
    : f.geometry.type === 'LineString' ? [f.geometry.coordinates] : [[f.geometry.coordinates]];
  for (const r of rings) {
    assert.ok(r.flat().every(Number.isFinite), 'إحداثيات غير صالحة');
    if (f.geometry.type === 'Polygon') assert.ok(r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1], 'مضلع غير مغلق');
  }
}
assert.equal(geo.metadata.surveyed, false, 'يجب أن يظل التصدير معلَّمًا بأنه غير مساحي');
ok('GeoJSON: ' + geo.features.length + ' معلمًا، مضلعات مغلقة، وتنويه غير مساحي');

/* 7. تغيير الأبعاد يعيد الحساب بلا كسر */
Object.assign(site, { width: 2000, depth: 1000 });
assert.equal(Math.round(NT.geo.categoryArea('stay') + NT.geo.categoryArea('open')
  + NT.geo.categoryArea('adventure') + NT.geo.categoryArea('family')
  + NT.geo.categoryArea('events') + NT.geo.categoryArea('dining') + NT.geo.categoryArea('services')), 2000000, 'إعادة الحساب بعد تغيير الأبعاد');
Object.assign(site, { width: 1500, depth: 1500 });
ok('إعادة الحساب عند تغيير الأبعاد');

/* 8. لا وعود تشغيلية ولا أسرار في الكود */
const appText = sources.map((name) => read(`src/${name}.js`)).join('\n') + html;
for (const bad of [
  /\d[\d,.]*\s*(?:ريال|SAR|ر\.س)/,           // أسعار
  /(?:يفتتح|الافتتاح)\s*(?:في|بتاريخ)\s*\d/,   // موعد افتتاح
  /\d+\s*(?:غرفة|سرير|ضيف|زائر)\s*يوميًا/,      // سعة تشغيلية
  /api[_-]?key|secret|password|Bearer\s/i        // أسرار
]) {
  assert.ok(!bad.test(appText), 'نص ممنوع في الكود: ' + bad);
}
assert.ok(/افتراض|تصور مبدئي/.test(html), 'يجب أن يظل تنويه الافتراض ظاهرًا');
ok('لا أسعار ولا مواعيد ولا أسرار، والتنويه ظاهر');

console.log(JSON.stringify({
  passed: true,
  checks,
  model: { zones: zones.length, area_m2: total, features: geo.features.length }
}, null, 1));
