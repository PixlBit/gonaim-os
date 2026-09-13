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

/* سقف الخطأ المسموح في التبسيط. الافتراضي متحفّظ يحفظ الصورة الظاهرية،
   لكن ما يُنثر بالمئات ويُرى من بعيد يحتمل خطأً أكبر بكثير: شجيرة واحدة
   بخمسة آلاف مثلث مكررة ثلاثمئة مرة هي وحدها مليون ونصف مثلث. */
const ERROR = {
  shrub: 0.6, shrub2: 0.6, rock: 0.4, rock2: 0.4,
  acacia: 0.35, acacia2: 0.35, palm: 0.3, palm2: 0.3,
  lantern: 0.35, bollard: 0.3, firePit: 0.3, target: 0.3,
  lightPole: 0.25, roadSign: 0.25, diningSet: 0.25
};
const DEFAULT_ERROR = 0.02;
/* بنى رفيعة يهدمها التبسيط المتساهل: عمود الإنارة صار غليظًا بقاعدة ضخمة
   حين مرّ عليه. تُبسَّط بالطريقة المحافظة فقط ولو بقيت فوق ميزانيتها. */
const NO_SLOPPY = new Set(['lightPole', 'floodMast', 'railing', 'roadSign', 'bollard', 'target']);

const BUDGET = {
  palm: 2600, palm2: 2600, acacia: 2600, acacia2: 2600,
  shrub: 900, shrub2: 900, rock: 1200, rock2: 1200,
  personThobe: 2600, personAbaya: 2600, personChild: 2200, personStaff: 2600,
  camel: 3200, horse: 3200,
  sedan: 4500, suv: 4500, pickup: 4500, coach: 5000, offRoader: 4500,
  tent: 5000, dome: 5000, kashta: 5000, majlis: 4000, campScreen: 2600,
  foodTruck: 5000, diningSet: 1200, firePit: 800, lantern: 500,
  bollard: 600, roadSign: 1200, target: 1200,
  lightPole: 2200, floodMast: 3000, railing: 1800,
  tensileCanopy: 3000, shadeStructure: 2200,
  gate: 9000, fuelStation: 9000, workshop: 7000, grocery: 7000,
  adminBlock: 7000, privateVilla: 9000, stableRow: 10000,
  playSet: 6000, summitRestaurant: 16000
};



/* ترتيب الوسائط: (فهارس، مواضع، خطوة، قفل الرؤوس، هدف الفهارس، سقف الخطأ)
   — الوسيط الرابع قفلٌ لا هدف، وتمرير الهدف مكانه يُسقط المكتبة.
   تبسيط متساهل: أوراق الشجر والشجيرات جزر هندسية منفصلة، والمبسّط
   المحافظ على البنية لا يستطيع طيّها فيقف بعيدًا عن الميزانية مهما رفعنا
   سقف الخطأ. simplifySloppy يتجاهل البنية ويبلغ الهدف — وهو مقبول هنا
   لأن هذه العناصر تُنثر بالمئات وتُرى من بعيد. */
async function sloppyTo(doc, target) {
  const { MeshoptSimplifier } = require('meshoptimizer');
  await MeshoptSimplifier.ready;
  const prims = [];
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) prims.push(prim);
  const totals = prims.map((p) => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()));
  const sum = totals.reduce((a, b) => a + b, 0);
  if (!sum) return;

  prims.forEach((prim, i) => {
    const pos = prim.getAttribute('POSITION');
    const idxAcc = prim.getIndices();
    if (!pos) return;
    const indices = idxAcc ? new Uint32Array(idxAcc.getArray()) : Uint32Array.from({ length: pos.getCount() }, (_, k) => k);
    // الهدف بعدد الفهارس لا المثلثات، ويجب أن يكون من مضاعفات الثلاثة
    let share = Math.round(target * 3 * (totals[i] / sum));
    share = Math.max(9, share - (share % 3));
    if (indices.length % 3 !== 0 || indices.length <= share) return;
    const out = MeshoptSimplifier.simplifySloppy(
      indices, new Float32Array(pos.getArray()), 3, null, share, 1.0
    );
    const kept = out[0];
    if (!kept || kept.length >= indices.length) return;
    if (idxAcc) idxAcc.setArray(new Uint32Array(kept));
    else prim.setIndices(doc.createAccessor().setArray(new Uint32Array(kept)).setBuffer(doc.getRoot().listBuffers()[0]));
  });
}

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
      steps.push(fn.simplify({ simplifier: MeshoptSimplifier, ratio: budget / s0.tris, error: ERROR[slot] || DEFAULT_ERROR, lockBorder: false }));
    }
    steps.push(fn.textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [maxTexture, maxTexture], quality: 82 }));
    await doc.transform(...steps);
    if (budget > 0 && !NO_SLOPPY.has(slot) && stat().tris > budget * 1.25) await sloppyTo(doc, budget);
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
