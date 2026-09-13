/* نسخة معاينة مستضافة: محتوى الصفحة فقط (بلا doctype/html/head/body)،
   مع تعطيل مصادر الخرائط الخارجية والتنزيل لأن بيئة الاستضافة تمنعهما. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const guard = (code) => code.replace(/<\/script/gi, '<\\/script');
const sources = ['data', 'geo', 'textures', 'terrain', 'props', 'content', 'world', 'basemap', 'mapview', 'controls', 'app'];

const html = read('index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'))
  .replace(/<script src="[^"]+"><\/script>\s*/g, '');

const parts = [];
parts.push('<title>نيو ثمامة</title>');
parts.push('<style>\n:root{color-scheme:dark}\nhtml,body{direction:rtl;height:100%;margin:0;overflow:hidden}\n'
  + read('assets/app.css') + '\n</style>');
parts.push(body.trim());
parts.push('<script>window.NT_PREVIEW={tiles:false,downloads:false};<\/script>');
parts.push(`<script>${guard(read('vendor/three.js'))}<\/script>`);
for (const name of sources) parts.push(`<script>${guard(read(`src/${name}.js`))}<\/script>`);

const out = parts.join('\n');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/artifact.html'), out);
console.log(`dist/artifact.html — ${(Buffer.byteLength(out) / 1024 / 1024).toFixed(2)} م.ب`);
