/* مكتبة النماذج الخارجية: تُحمّل ملفات GLB من assets/models وتُطبّع مقاسها واتجاهها،
   ثم تُقدَّم بنفس شكل العناصر المولّدة برمجيًا فيعمل التكرار والتوزيع بلا تغيير.
   أي نموذج غير متوفر يسقط تلقائيًا إلى البديل المولّد برمجيًا. */
(function (NT) {
  'use strict';

  /* كل خانة: مقاسها الحقيقي بالمتر، ودوران التصحيح، والبديل عند غياب الملف.
     الاتجاه المرجعي: الواجهة نحو -Z (شمالًا)، والقاعدة عند y=0.

     التطبيع: ما له بصمة أرضية مرسومة على المخطط (خيمة، قبة، بوابة، مركبة…)
     يُقاس بـ plan أي أكبر بعد أفقي، فتبقى البصمة مطابقة للمسقط مهما اختلف
     ارتفاع النموذج الوارد. وما هو رأسي بطبعه (نخلة، عمود، شخص) يُقاس بـ height.
     قياس كل شيء بالارتفاع كان يشوّه المباني: نموذج بسقف أعلى ينكمش في مسقطه. */
  const SLOTS = {
    palm:      { file: 'palm.glb',      height: 7.5,  yaw: 0, fallback: (M) => NT.props.palm(M, 6.4) },
    acacia:    { file: 'acacia.glb',    height: 4.6,  yaw: 0, fallback: (M) => NT.props.acacia(M, 1) },
    shrub:     { file: 'shrub.glb',     height: 0.9,  yaw: 0, fallback: (M) => NT.props.shrub(M, 1) },
    rock:      { file: 'rock.glb',      plan: 2.9,    yaw: 0, fallback: (M) => NT.props.rock(M, 1, 7) },
    tent:      { file: 'tent.glb',      plan: 10.1,   yaw: 0, fallback: (M) => NT.props.safariTent(M) },
    dome:      { file: 'dome.glb',      plan: 9.0,    yaw: 0, fallback: (M) => NT.props.domeStay(M) },
    kashta:    { file: 'kashta.glb',    plan: 6.0,    yaw: 0, fallback: (M) => NT.props.kashta(M) },
    majlis:    { file: 'majlis.glb',    plan: 8.8,    yaw: 0, fallback: (M) => NT.props.majlis(M, 4.4) },
    suv:       { file: 'suv.glb',       plan: 5.28,   yaw: 0, fallback: (M) => NT.assets.suv(M) },
    sedan:     { file: 'sedan.glb',     plan: 4.7,    yaw: 0, fallback: (M) => NT.assets.sedan(M) },
    pickup:    { file: 'pickup.glb',    plan: 5.6,    yaw: 0, fallback: (M) => NT.assets.pickup(M) },
    coach:     { file: 'coach.glb',     plan: 12.0,   yaw: 0, fallback: (M) => NT.assets.coach(M) },
    foodTruck: { file: 'food-truck.glb', plan: 7.66,  yaw: 0, fallback: (M) => NT.assets.foodTruck(M) },
    personThobe: { file: 'person-thobe.glb', height: 1.75, yaw: 0, fallback: (M) => NT.assets.person(M, 'thobe') },
    personAbaya: { file: 'person-abaya.glb', height: 1.68, yaw: 0, fallback: (M) => NT.assets.person(M, 'abaya') },
    personChild: { file: 'person-child.glb', height: 1.15, yaw: 0, fallback: (M) => NT.assets.person(M, 'child') },
    camel:     { file: 'camel.glb',     plan: 3.0,    yaw: 0, fallback: null },
    horse:     { file: 'horse.glb',     plan: 2.6,    yaw: 0, fallback: null },
    lightPole: { file: 'light-pole.glb', height: 9,   yaw: 0, fallback: (M) => NT.assets.streetLight(M, 9, 1) },
    fuelStation: { file: 'fuel-station.glb', plan: 26.4, yaw: 0, fallback: (M) => NT.props.fuelStation(M) },
    gate:      { file: 'gate.glb',      plan: 22.6,   yaw: 0, fallback: (M) => NT.props.gateHouse(M, 3) }
  };

  const loaded = new Map();     // slot → parts[]
  const info = { available: [], missing: [], bytes: 0 };

  /* تحويل مشهد GLB إلى قطع (هندسة + خامة) بعد تطبيع المقاس والاتجاه */
  function toParts(gltfScene, slot) {
    const THREE = window.THREE;
    const root = gltfScene.clone(true);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    /* المباني والمركبات تُقاس ببصمتها الأرضية، والعناصر الرأسية بارتفاعها */
    const scale = slot.plan
      ? slot.plan / Math.max(size.x, size.z, 0.0001)
      : slot.height / Math.max(size.y, 0.0001);

    const fix = new THREE.Matrix4()
      .makeTranslation(-centre.x, -box.min.y, -centre.z)
      .premultiply(new THREE.Matrix4().makeScale(scale, scale, scale));
    if (slot.yaw) fix.premultiply(new THREE.Matrix4().makeRotationY(slot.yaw));

    const parts = [];
    root.traverse((node) => {
      if (!node.isMesh || !node.geometry) return;
      const geometry = node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      geometry.applyMatrix4(fix);
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const material = Array.isArray(node.material) ? node.material[0] : node.material;
      if (material) {
        material.side = THREE.FrontSide;
        if (material.map) material.map.anisotropy = 8;
        if (material.transparent && material.opacity === 1) material.transparent = false;
        if (material.alphaMap || (material.map && material.transparent)) material.alphaTest = 0.35;
      }
      parts.push({ geometry, material });
    });
    return parts;
  }

  function loadAll(manifest, onProgress) {
    const THREE = window.THREE;
    if (!THREE.GLTFLoader) return Promise.resolve(info);
    const loader = new THREE.GLTFLoader();
    const entries = Object.entries(SLOTS).filter(([name]) => !manifest || manifest[name]);
    if (!entries.length) { info.missing = Object.keys(SLOTS); return Promise.resolve(info); }

    return Promise.all(entries.map(([name, slot]) => new Promise((resolve) => {
      const source = manifest && manifest[name] ? manifest[name] : 'assets/models/' + slot.file;
      loader.load(source, (gltf) => {
        try {
          const parts = toParts(gltf.scene, slot);
          if (parts.length) { loaded.set(name, parts); info.available.push(name); }
          else info.missing.push(name);
        } catch (e) { info.missing.push(name); }
        if (onProgress) onProgress(info);
        resolve();
      }, undefined, () => { info.missing.push(name); resolve(); });
    }))).then(() => info);
  }

  /* القطع المطلوبة: النموذج الحقيقي إن وُجد، وإلا البديل المولّد */
  function parts(name, materials) {
    if (loaded.has(name)) return loaded.get(name);
    const slot = SLOTS[name];
    if (slot && slot.fallback) return slot.fallback(materials);
    return null;
  }
  const has = (name) => loaded.has(name);

  NT.models = { SLOTS, loadAll, parts, has, info, loaded };
})(window.NT = window.NT || {});
