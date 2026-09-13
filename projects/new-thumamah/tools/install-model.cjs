/* يركّب ملف GLB في خانة نموذج: يفحصه، يضغط الخامات والهندسة، ثم ينسخه إلى assets/models.
   الاستعمال: node tools/install-model.cjs <ملف.glb> <اسم الخانة> [--max-texture 1024] [--keep]
   مثال:     node tools/install-model.cjs ~/downloads/hf.glb tent */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'models');

/* الخانات تُقرأ من src/models.js نفسه لا من نسخة مكرّرة هنا:
   جدول مكرر كان يتقادم صامتًا كلما أضيفت خانة، فيفشل التركيب بلا سبب ظاهر. */
function loadSlots() {
  global.window = global.window || {};
  require(path.join(ROOT, 'src', 'models.js'));
  const slots = global.window.NT && global.window.NT.models && global.window.NT.models.SLOTS;
  if (!slots) throw new Error('تعذّرت قراءة الخانات من src/models.js');
  const files = {};
  for (const [name, slot] of Object.entries(slots)) files[name] = slot.file;
  return files;
}
const FILES = loadSlots();

/* ميزانية المثلثات لكل خانة. الحاسم ليس حجم المبنى بل كم مرة يتكرر:
   نخلة بأحد عشر ألف مثلث مكررة مئة مرة تكلّف أكثر من مطعم القمة مرة واحدة.
   وما رقّ من البنى — الدرابزين والصواري والأعمدة — لا يُبسَّط لأنه ينهار. */
const BUDGET = {
  palm: 2600, palm2: 2600, acacia: 2600, acacia2: 2600,
  shrub: 900, shrub2: 900, rock: 1200, rock2: 1200,
  personThobe: 2600, personAbaya: 2600, personChild: 2200, personStaff: 2600,
  camel: 3200, horse: 3200,
  sedan: 4500, suv: 4500, pickup: 4500, coach: 5000, offRoader: 4500,
  tent: 5000, dome: 5000, kashta: 5000, majlis: 4000, campScreen: 4500,
  foodTruck: 5000, diningSet: 3000, firePit: 2000, lantern: 1500,
  bollard: 800, roadSign: 1800, target: 1800,
  lightPole: 2000, floodMast: 0, railing: 0,
  tensileCanopy: 6000, shadeStructure: 5000,
  gate: 9000, fuelStation: 9000, workshop: 7000, grocery: 7000,
  adminBlock: 7000, privateVilla: 9000, stableRow: 10000,
  playSet: 6000, summitRestaurant: 16000
};


async function main() {
  const args = process.argv.slice(2);
  const src = args[0];
  const slot = args[1];
  const maxTexture = +((args[args.indexOf('--max-texture') + 1]) || 1024) || 1024;
  const keep = args.includes('--keep');

  if (!src || !slot || !FILES[slot]) {
    console.error('الاستعمال: node tools/install-model.cjs <ملف.glb> <خانة>');
    console.error('الخانات:', Object.keys(FILES).join(' '));
    process.exit(1);
  }
  if (!fs.existsSync(src)) { console.error('الملف غير موجود:', src); process.exit(1); }

  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const fn = require('@gltf-transform/functions');
  const sharp = require('sharp');

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(src);
  const before = fs.statSync(src).size;

  const stat = () => {
    const root = doc.getRoot();
    let tris = 0;
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const idx = prim.getIndices();
        const pos = prim.getAttribute('POSITION');
        tris += Math.floor(((idx ? idx.getCount() : (pos ? pos.getCount() : 0)) / 3));
      }
    }
    return { meshes: root.listMeshes().length, tris, textures: root.listTextures().length };
  };
  const s0 = stat();

  const budgetArg = args.indexOf('--tris');
  const budget = budgetArg > -1 ? +args[budgetArg + 1] : BUDGET[slot];

  if (!keep) {
    const steps = [
      fn.dedup(),
      fn.prune({ keepAttributes: false }),
      fn.flatten(),
      fn.join(),
      fn.weld()
    ];
    /* التبسيط بنسبة محسوبة من ميزانية الخانة لا بنسبة ثابتة:
       النسبة الثابتة تترك النموذج الثقيل ثقيلًا وتهدم الخفيف. */
    if (budget > 0 && s0.tris > budget) {
      const { MeshoptSimplifier } = require('meshoptimizer');
      await MeshoptSimplifier.ready;
      steps.push(fn.simplify({ simplifier: MeshoptSimplifier, ratio: budget / s0.tris, error: 0.02, lockBorder: false }));
    }
    steps.push(fn.textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [maxTexture, maxTexture], quality: 82 }));
    await doc.transform(...steps);
  }

  const dest = path.join(OUT, FILES[slot]);
  fs.mkdirSync(OUT, { recursive: true });
  await io.write(dest, doc);
  const after = fs.statSync(dest).size;
  const s1 = stat();

  const kb = (n) => (n / 1024).toFixed(0) + ' ك.ب';
  console.log(`${slot} → assets/models/${FILES[slot]}`);
  console.log(`  الحجم:    ${kb(before)} → ${kb(after)}  (${(100 - after / before * 100).toFixed(0)}% أقل)`);
  console.log(`  المثلثات: ${s0.tris.toLocaleString('en')} → ${s1.tris.toLocaleString('en')}${budget ? ` (ميزانية ${budget.toLocaleString('en')})` : ' (بلا تبسيط)'}`);
  console.log(`  الخامات:  ${s0.textures} → ${s1.textures} (حد ${maxTexture}px، webp)`);
  if (after > 2 * 1024 * 1024) console.log('  تنبيه: أكبر من 2 م.ب — جرّب --max-texture 512');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
