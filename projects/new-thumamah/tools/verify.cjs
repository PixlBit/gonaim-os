/* فحوص بلا شبكة وبلا مكتبات: البيانات، التضاريس، الإسناد الجغرافي، التصدير، وسلامة الملفات.
   الفحص البصري للمشهد في tools/smoke.mjs (يحتاج Playwright، اختياري). */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const ok = (name) => checks.push(name);

/* 1. كل ملفات المصدر تُحلَّل بلا أخطاء نحوية */
const sources = ['data', 'geo', 'textures', 'terrain', 'props', 'content', 'world', 'basemap', 'mapview', 'controls', 'app'];
for (const name of sources) new vm.Script(read(`src/${name}.js`), { filename: `${name}.js` });
ok('صحة بناء الجملة في ' + sources.length + ' ملفات');

/* 2. index.html يحمّل كل الملفات ولا يشير إلى المرجع */
const html = read('index.html');
for (const name of sources) assert.ok(html.includes(`src/${name}.js`), `index.html لا يحمّل ${name}.js`);
assert.ok(html.includes('vendor/three.js'), 'محرك العرض غير محمّل');
assert.ok(html.includes('assets/app.css'), 'ملف التنسيق غير محمّل');
assert.ok(!/reference\//.test(html), 'يجب ألا يشير التطبيق إلى مجلد المرجع');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'معرّفات مكررة في index.html');
ok('روابط الملفات ومعرّفات DOM');

/* 3. تحميل البيانات والتضاريس والإسناد في بيئة معزولة */
const sandbox = { window: {}, Math, JSON, console, Date, Float32Array, Uint8Array };
sandbox.window.NT = {};
vm.runInNewContext(read('src/data.js') + '\n' + read('src/geo.js') + '\n' + read('src/textures.js') + '\n' + read('src/terrain.js'), sandbox);
const NT = sandbox.window.NT;
const { site, zones, categories } = NT.data;

assert.equal(zones.length, 6, 'المخطط ست مناطق كما في الملف المعتمد');
const byId = Object.fromEntries(zones.map((z) => [z.id, z]));
for (const id of ['ZON1', 'ZON2', 'ZON3', 'ZON4', 'ZON5', 'ZON6']) assert.ok(byId[id], 'منطقة ناقصة: ' + id);
for (const z of zones) {
  assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= 1500 && z.y + z.d <= 1500, `${z.id} خارج حدود الأرض`);
  assert.ok(z.program && z.program.length >= 3, `${z.id} بلا برنامج`);
  assert.ok(z.focus && z.view, `${z.id} بلا نقطة تركيز أو زاوية عرض`);
}
for (let i = 0; i < zones.length; i++) {
  for (let j = i + 1; j < zones.length; j++) {
    const a = zones[i], b = zones[j];
    assert.ok(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y), `تداخل بين ${a.id} و${b.id}`);
  }
}
ok('المناطق الست داخل الحدود وبلا تداخل');

/* 4. تسلسل الرحلة كما في الملف: خدمات ← بوابة ← مخيمات ← قمة الجبل */
const centre = (z) => [z.x + z.w / 2, z.y + z.d / 2];
assert.ok(centre(byId.ZON1)[1] < centre(byId.ZON2)[1], 'ممر الخدمات يجب أن يسبق البوابة');
assert.ok(centre(byId.ZON5)[1] > centre(byId.ZON3)[1], 'قمة الجبل بعد ساحة المخيمات');
const rangeToCamps = Math.hypot(centre(byId.ZON6)[0] - centre(byId.ZON3)[0], centre(byId.ZON6)[1] - centre(byId.ZON3)[1]);
assert.ok(rangeToCamps > 700, 'منطقة الرماية قريبة جدًا من المخيمات: ' + Math.round(rangeToCamps) + ' م');
ok('تسلسل الرحلة وعزل منطقة الرماية');

/* 5. التضاريس: قمة مرتفعة ومستوية، وسهل للمخيمات، وكثبان للتطعيس */
const terrain = NT.terrain.create(NT.data.terrain);
const summit = terrain.heightAt(780, 1235);
const plain = terrain.heightAt(400, 560);
assert.ok(summit > 60, 'القمة يجب أن ترتفع عن السهل بوضوح: ' + summit.toFixed(1));
assert.ok(summit - plain > 60, 'فرق المنسوب بين القمة والسهل صغير: ' + (summit - plain).toFixed(1));
let maxDelta = 0;
for (let x = 560; x <= 1000; x += 40) for (let y = 1120; y <= 1340; y += 40) {
  maxDelta = Math.max(maxDelta, Math.abs(terrain.heightAt(x, y) - summit));
}
assert.ok(maxDelta < 4, 'سطح القمة غير مستوٍ بما يكفي للبناء: ' + maxDelta.toFixed(1));
let campSlope = 0;
for (let x = 160; x <= 560; x += 40) for (let y = 300; y <= 840; y += 40) campSlope = Math.max(campSlope, terrain.slopeAt(x, y));
assert.ok(campSlope < 0.35, 'ميل ساحة المخيمات حاد على التخييم: ' + campSlope.toFixed(2));
let duneRelief = 0;
for (let x = 1120; x <= 1400; x += 20) for (let y = 620; y <= 860; y += 20) duneRelief = Math.max(duneRelief, terrain.heightAt(x, y));
assert.ok(duneRelief > 6, 'الكثبان الشرقية منخفضة على التطعيس: ' + duneRelief.toFixed(1));
ok(`تضاريس: قمة ${summit.toFixed(0)} م فوق سهل ${plain.toFixed(0)} م، وكثبان حتى ${duneRelief.toFixed(0)} م`);

/* 6. المساحات وتقسيم الاستخدامات */
const total = site.width * site.depth;
const sum = categories.reduce((acc, c) => acc + NT.geo.categoryArea(c.id), 0);
assert.ok(Math.abs(sum - total) < 1, `مجموع الاستخدامات ${sum} لا يساوي ${total}`);
assert.ok(NT.geo.openArea() > 0, 'الأرض المفتوحة سالبة');
ok('تقسيم المساحات مكتمل (' + total.toLocaleString('en-US') + ' م²)');

/* 7. مسافات WGS 84 على أضلاع الأرض */
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

/* 8. سلامة GeoJSON */
const kinds = geo.features.map((f) => f.properties.kind || f.properties.land_use);
assert.ok(kinds.includes('concept_boundary') && kinds.includes('trail') && kinds.includes('circulation'), 'معالم ناقصة في GeoJSON');
assert.equal(geo.features.filter((f) => f.geometry.type === 'Polygon').length, 8, 'عدد المضلعات: حد + 6 مناطق + الأرض المفتوحة');
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

/* 9. الأرقام المنقولة من الملف المعتمد تُنسب لمصدرها، ولا أرقام مخترعة */
const appText = sources.map((name) => read(`src/${name}.js`)).join('\n') + html;
const money = [...appText.matchAll(/\d[\d,.]*\s*(?:ريال|SAR|ر\.س)/g)];
assert.ok(money.length > 0, 'رسوم الدخول الواردة في الملف يجب أن تظهر');
for (const m of money) {
  const around = appText.slice(Math.max(0, m.index - 200), m.index + 200);
  assert.ok(/نص الملف|الملف المعتمد/.test(around), 'رقم مالي بلا نسبة إلى الملف المعتمد: ' + m[0]);
}
for (const bad of [/(?:يفتتح|الافتتاح)\s*(?:في|بتاريخ)\s*\d/, /api[_-]?key|secret|password|Bearer\s/i]) {
  assert.ok(!bad.test(appText), 'نص ممنوع في الكود: ' + bad);
}
assert.ok(/افتراض|تصور مبدئي/.test(html), 'يجب أن يظل تنويه الافتراض ظاهرًا');
const facts = NT.data.facts.map((f) => f.value).join(' ');
assert.ok(/1000/.test(facts) && /100/.test(facts) && /10 ريال/.test(facts), 'حقائق الملف المعتمد ناقصة');
ok('أرقام الملف منسوبة لمصدرها، ولا مواعيد ولا أسرار');

console.log(JSON.stringify({
  passed: true,
  checks,
  model: { zones: zones.length, area_m2: total, features: geo.features.length, summit_m: +summit.toFixed(1) }
}, null, 1));
