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
  /* الميزانية تُشتقّ من عدد النسخ في المشهد لا من حجم العنصر.
     ما يوضع مرة أو مرتين لا يُبسَّط أصلًا (صفر) — تبسيطه خسارة خالصة
     في الجودة مقابل بضعة آلاف مثلث لا تُذكر. والضغط يشتدّ كلما كثرت
     النسخ: الشجيرة موضوعة مئات المرات فثمن كل مثلث فيها مئات الأضعاف.

     ورُفعت الميزانيات بعد تقليل أعداد النثر: ثلاثمئة شجيرة بتفاصيل وافية
     تقرأ أفضل من ثمانمئة مهترئة، والتكلفة واحدة. */

  // مئات النسخ
  shrub: 4200, shrub2: 4200,
  acacia: 8000, acacia2: 8000,
  rock: 6000, rock2: 6000,

  // عشرات النسخ
  personThobe: 9000, personAbaya: 9000, personChild: 8000, personStaff: 9000,
  palm: 0, palm2: 0, lightPole: 5200,
  suv: 0, sedan: 0, pickup: 0,

  // نسخ معدودة: بلا تبسيط
  tent: 0, dome: 0, kashta: 0, majlis: 0, campScreen: 0,
  camel: 0, horse: 0, coach: 0, offRoader: 0, foodTruck: 0,
  diningSet: 0, firePit: 0, lantern: 0, railing: 0, bollard: 0,
  roadSign: 0, floodMast: 0, target: 0,
  tensileCanopy: 0, shadeStructure: 0,
  gate: 0, fuelStation: 0, workshop: 0, grocery: 0,
  adminBlock: 0, privateVilla: 0, stableRow: 0,
  playSet: 0, summitRestaurant: 0
};

/* دقة الخامة: أعلى لما يُرى عن قرب في المسار التعريفي، وأدنى لما يُنثر بالمئات */
const TEXTURE = {
  summitRestaurant: 2048, privateVilla: 2048, gate: 2048, fuelStation: 2048,
  stableRow: 2048, tent: 2048, dome: 2048, kashta: 2048, majlis: 2048,
  foodTruck: 2048, adminBlock: 2048, grocery: 2048, workshop: 2048, playSet: 2048,
  suv: 2048, sedan: 2048,
  shrub: 512, shrub2: 512, rock: 512, rock2: 512, bollard: 512
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
  const maxTexture = args.indexOf('--max-texture') > -1
    ? +args[args.indexOf('--max-texture') + 1]
    : (TEXTURE[slot] || 1024);
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
