/* يكتب ملفات البيانات المرافقة من نفس مصدر التطبيق حتى لا تتفرّق الأرقام. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const sandbox = { window: {}, Math, JSON, console, Date };
sandbox.window.NT = {};
vm.runInNewContext(read('src/data.js') + '\n' + read('src/geo.js'), sandbox);
const NT = sandbox.window.NT;

const payload = {
  site: NT.data.site,
  disclaimer: 'تصور مبدئي. الأبعاد والإحداثيات افتراضات غير مؤكدة، والتوزيع والأعداد مقترحات تصميمية. لا سعات تشغيلية ولا أسعار ولا موعد افتتاح.',
  categories: NT.data.categories.map((c) => ({ id: c.id, name: c.name, color: c.color, area_m2: Math.round(NT.geo.categoryArea(c.id)) })),
  zones: NT.data.zones.map((z) => ({
    id: z.id, name: z.name, name_en: z.en, land_use: z.cat,
    x: z.x, y: z.y, w: z.w, d: z.d, area_m2: Math.round(NT.geo.zoneArea(z)),
    massing: z.height, programme: z.program, description: z.desc
  })),
  open_land: { id: 'OPEN', name: NT.data.openLand.name, area_m2: Math.round(NT.geo.openArea()) },
  circulation: NT.data.roads.map((r) => ({ id: r.id, access: r.type, width_m: r.width, points_local_m: r.points })),
  trail: { id: NT.data.trail.id, name: NT.data.trail.name, points_local_m: NT.data.trail.points, viewpoints: NT.data.trail.viewpoints }
};

fs.writeFileSync(path.join(root, 'project-data.json'), JSON.stringify(payload, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'site-boundary.geojson'), JSON.stringify(NT.geo.geoJSON(), null, 2) + '\n');
console.log('project-data.json و site-boundary.geojson مُحدَّثان من نفس مصدر التطبيق');
