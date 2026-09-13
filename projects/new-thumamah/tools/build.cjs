/* يبني نسخة نشر واحدة مكتفية بذاتها في dist/index.html.
   لا يُنسخ مجلد reference إطلاقًا؛ الخطة التسويقية لا تُنشر. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const guard = (code) => code.replace(/<\/script/gi, '<\\/script');

const sources = ['data', 'geo', 'textures', 'terrain', 'props', 'content', 'world', 'basemap', 'mapview', 'controls', 'app'];
let html = read('index.html');

html = html.replace('<link rel="stylesheet" href="assets/app.css">', `<style>\n${read('assets/app.css')}\n</style>`);
html = html.replace('<script src="vendor/three.js"></script>', `<script>${guard(read('vendor/three.js'))}</script>`);
for (const name of sources) {
  html = html.replace(`<script src="src/${name}.js"></script>`, `<script>${guard(read(`src/${name}.js`))}</script>`);
}
html = html.replace('</head>', `<!-- نيو ثمامة — تصور مبدئي. بُني في ${new Date().toISOString().slice(0, 10)}. لا يمثل رفعًا مساحيًا ولا سعات ولا أسعارًا. -->\n</head>`);

if (/src="(src|vendor)\//.test(html) || /href="assets\//.test(html)) {
  console.error('بقيت مراجع خارجية بعد الدمج'); process.exit(1);
}

const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
console.log(`dist/index.html — ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} م.ب، ملف واحد مكتفٍ بذاته`);
