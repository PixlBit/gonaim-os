/* يركّب ملف GLB في خانة نموذج: يفحصه، يضغط الخامات والهندسة، ثم ينسخه إلى assets/models.
   الاستعمال: node tools/install-model.cjs <ملف.glb> <اسم الخانة> [--max-texture 1024] [--keep]
   مثال:     node tools/install-model.cjs ~/downloads/hf.glb tent */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'models');

/* الخانات وملفاتها — مطابقة لـ src/models.js */
const FILES = {
  palm: 'palm.glb', acacia: 'acacia.glb', shrub: 'shrub.glb', rock: 'rock.glb',
  tent: 'tent.glb', dome: 'dome.glb', kashta: 'kashta.glb', majlis: 'majlis.glb',
  suv: 'suv.glb', sedan: 'sedan.glb', pickup: 'pickup.glb', coach: 'coach.glb',
  foodTruck: 'food-truck.glb', personThobe: 'person-thobe.glb',
  personAbaya: 'person-abaya.glb', personChild: 'person-child.glb',
  camel: 'camel.glb', horse: 'horse.glb', lightPole: 'light-pole.glb',
  fuelStation: 'fuel-station.glb', gate: 'gate.glb'
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

  if (!keep) {
    await doc.transform(
      fn.dedup(),
      fn.prune({ keepAttributes: false }),
      fn.flatten(),
      fn.join(),
      fn.weld(),
      fn.textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [maxTexture, maxTexture], quality: 82 })
    );
  }

  const dest = path.join(OUT, FILES[slot]);
  fs.mkdirSync(OUT, { recursive: true });
  await io.write(dest, doc);
  const after = fs.statSync(dest).size;
  const s1 = stat();

  const kb = (n) => (n / 1024).toFixed(0) + ' ك.ب';
  console.log(`${slot} → assets/models/${FILES[slot]}`);
  console.log(`  الحجم:    ${kb(before)} → ${kb(after)}  (${(100 - after / before * 100).toFixed(0)}% أقل)`);
  console.log(`  المثلثات: ${s0.tris.toLocaleString('en')} → ${s1.tris.toLocaleString('en')}`);
  console.log(`  الخامات:  ${s0.textures} → ${s1.textures} (حد ${maxTexture}px، webp)`);
  if (after > 2 * 1024 * 1024) console.log('  تنبيه: أكبر من 2 م.ب — جرّب --max-texture 512');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
