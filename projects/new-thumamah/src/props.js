/* مكتبة العناصر ثلاثية الأبعاد بمقاسات واقعية بالمتر.
   قبة قطرها 6 م، خيمة 5×7 م، ميدان 70×35 م، موقف 2.5×5 م لكل سيارة.
   النسخة السابقة كانت تبني قبابًا بقطر 24–30 م وخيامًا 23×30 م وميدانًا 324 م. */
(function (NT) {
  'use strict';

  const T = () => window.THREE;
  const M4 = (x, y, z, ry, sx, sy, sz) => new (T().Matrix4)().compose(
    new (T().Vector3)(x, y, z),
    new (T().Quaternion)().setFromAxisAngle(new (T().Vector3)(0, 1, 0), ry || 0),
    new (T().Vector3)(sx || 1, sy || sx || 1, sz || sx || 1)
  );

  /* مُجمِّع هندسي: يدمج القطع الثابتة حسب الخامة لتقليل نداءات الرسم،
     ويولّد نسخًا مكررة (instances) للعناصر المتشابهة. */
  class Builder {
    constructor(scene) { this.scene = scene; this.groups = new Map(); this.meshes = []; }
    add(geometry, material, matrix) {
      const g = geometry.clone();
      if (matrix) g.applyMatrix4(matrix);
      if (!this.groups.has(material)) this.groups.set(material, []);
      this.groups.get(material).push(g);
      return this;
    }
    addParts(parts, matrix) { for (const p of parts) this.add(p.geometry, p.material, matrix); return this; }
    instances(parts, matrices, userData) {
      const THREE = T();
      for (const part of parts) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, matrices.length);
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = part.shadow !== false;
        mesh.receiveShadow = true;
        mesh.frustumCulled = true;
        if (userData) mesh.userData = Object.assign({}, userData);
        this.scene.add(mesh);
        this.meshes.push(mesh);
      }
      return this;
    }
    flush(userData) {
      const THREE = T(), utils = THREE.BufferGeometryUtils;
      for (const [material, list] of this.groups) {
        if (!list.length) continue;
        const merged = list.length === 1 ? list[0] : utils.mergeGeometries(list, false);
        if (!merged) continue;
        const mesh = new THREE.Mesh(merged, material);
        mesh.castShadow = true; mesh.receiveShadow = true;
        if (userData) mesh.userData = Object.assign({}, userData);
        this.scene.add(mesh);
        this.meshes.push(mesh);
      }
      this.groups.clear();
      return this;
    }
  }

  function makeMaterials(env) {
    const THREE = T(), tex = NT.textures;
    const canvasTex = (canvas, repeat) => {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.colorSpace = THREE.SRGBColorSpace;
      if (repeat) t.repeat.set(repeat, repeat);
      return t;
    };
    const normalTex = (canvas, repeat) => {
      const t = new THREE.CanvasTexture(canvas);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (repeat) t.repeat.set(repeat, repeat);
      return t;
    };
    const sandCanvas = tex.sand(512, 11);
    const fabricCanvas = tex.fabric(256, '#f6f1e6');
    const woodCanvas = tex.wood(512, 31);
    const gravelCanvas = tex.gravel(512, 53, '#bcae90');
    const asphaltCanvas = tex.asphalt(512, 71);

    const std = (o) => new THREE.MeshStandardMaterial(o);
    const mats = {
      sand: std({ map: canvasTex(sandCanvas, 60), normalMap: normalTex(tex.normalFrom(sandCanvas, 1.6), 60), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 1, metalness: 0, color: 0xcdbc96 }),
      arenaSand: std({ map: canvasTex(sandCanvas, 8), roughness: 1, color: 0xd7c49b }),
      track: std({ map: canvasTex(gravelCanvas, 24), roughness: 0.98, color: 0xc4b795 }),
      asphalt: std({ map: canvasTex(asphaltCanvas, 30), roughness: 0.95, color: 0xc4bfb4 }),
      deck: std({ map: canvasTex(woodCanvas, 3), roughness: 0.72, color: 0xc0a57e }),
      timber: std({ color: 0x8a6844, roughness: 0.8 }),
      canvasLight: std({ map: canvasTex(fabricCanvas, 4), color: 0xeae2d2, roughness: 0.9, side: THREE.DoubleSide }),
      canvasWarm: std({ map: canvasTex(fabricCanvas, 3), color: 0xece0c8, roughness: 0.94, side: THREE.DoubleSide }),
      canvasShade: std({ color: 0xdcd2bb, roughness: 0.95, side: THREE.DoubleSide }),
      plaster: std({ color: 0xdfd5c2, roughness: 0.92 }),
      plasterWarm: std({ color: 0xcdbfa4, roughness: 0.93 }),
      stone: std({ color: 0xb3a289, roughness: 0.96 }),
      metal: std({ color: 0x585650, roughness: 0.45, metalness: 0.75 }),
      metalLight: std({ color: 0x9a968c, roughness: 0.5, metalness: 0.6 }),
      glass: std({ color: 0x24333a, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.62, envMapIntensity: 1.6 }),
      foliage: std({ color: 0x6f7f4e, roughness: 0.95 }),
      foliageDry: std({ color: 0x8b8a5b, roughness: 0.97 }),
      trunk: std({ color: 0x7d6b4e, roughness: 0.95 }),
      rock: std({ color: 0x9b9078, roughness: 0.98 }),
      carBody: std({ color: 0xdcdcdc, roughness: 0.35, metalness: 0.6 }),
      carGlass: std({ color: 0x2a3238, roughness: 0.15, metalness: 0.2 }),
      tyre: std({ color: 0x2a2a28, roughness: 0.9 }),
      lamp: std({ color: 0xe8e2d2, roughness: 0.6, emissive: 0xffc978, emissiveIntensity: 0 }),
      windowGlow: std({ color: 0x2b3238, roughness: 0.2, metalness: 0.1, emissive: 0xffb765, emissiveIntensity: 0 }),
      fire: std({ color: 0x2a1c12, roughness: 1, emissive: 0xff7a2a, emissiveIntensity: 0 }),
      water: std({ color: 0x3c6d74, roughness: 0.12, metalness: 0.2 }),
      skin: std({ color: 0xc99a72, roughness: 0.78 }),
      thobe: std({ color: 0xf2efe6, roughness: 0.86 }),
      thobeWarm: std({ color: 0xe3dccb, roughness: 0.88 }),
      abaya: std({ color: 0x2b2b30, roughness: 0.82 }),
      ghutra: std({ color: 0xfbf8f0, roughness: 0.84 }),
      vest: std({ color: 0xc9762c, roughness: 0.7 }),
      hair: std({ color: 0x2a2320, roughness: 0.9 }),
      shirtA: std({ color: 0x9db7c8, roughness: 0.85 }),
      shirtB: std({ color: 0xb6714f, roughness: 0.85 }),
      signFace: std({ color: 0x2f6d4a, roughness: 0.6, emissive: 0x0d2a1a, emissiveIntensity: 0 }),
      paint: std({ color: 0xf1ede0, roughness: 0.9 })
    };
    if (env) for (const k of ['glass', 'metal', 'metalLight', 'carBody', 'water']) mats[k].envMap = env;
    mats.emissiveKeys = ['lamp', 'windowGlow', 'fire'];
    return mats;
  }

  /* ===== عناصر مفردة: كل دالة تعيد قطعًا في إحداثيات محلية، الواجهة نحو -Z ===== */
  function domeStay(M) {
    const THREE = T(), r = 3, parts = [];
    const shell = new THREE.SphereGeometry(r, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
    shell.scale(1, 1.05, 1); shell.translate(0, 0.45, 0);
    parts.push({ geometry: shell, material: M.canvasLight });
    const window_ = new THREE.SphereGeometry(r * 1.005, 22, 12, Math.PI * 0.72, Math.PI * 0.56, Math.PI * 0.16, Math.PI * 0.34);
    window_.scale(1, 1.05, 1); window_.translate(0, 0.45, 0);
    parts.push({ geometry: window_, material: M.windowGlow });
    const deck = new THREE.BoxGeometry(9, 0.35, 9); deck.translate(0, 0.18, 1.2);
    parts.push({ geometry: deck, material: M.deck });
    const step = new THREE.BoxGeometry(2.4, 0.18, 0.8); step.translate(0, 0.06, 5.9);
    parts.push({ geometry: step, material: M.deck });
    const porch = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6);
    parts.push({ geometry: porch.clone().applyMatrix4(M4(-2.6, 1.55, 4.4)), material: M.timber });
    parts.push({ geometry: porch.clone().applyMatrix4(M4(2.6, 1.55, 4.4)), material: M.timber });
    const shade = new THREE.BoxGeometry(5.6, 0.08, 2.2); shade.translate(0, 2.75, 4.4);
    parts.push({ geometry: shade, material: M.canvasShade });
    const table = new THREE.CylinderGeometry(0.42, 0.4, 0.5, 10); table.translate(-1.4, 0.6, 4.2);
    parts.push({ geometry: table, material: M.timber });
    const chair = new THREE.BoxGeometry(0.5, 0.45, 0.5);
    parts.push({ geometry: chair.clone().applyMatrix4(M4(0.3, 0.58, 4.1)), material: M.timber });
    parts.push({ geometry: chair.clone().applyMatrix4(M4(1.3, 0.58, 3.6)), material: M.timber });
    return parts;
  }

  function safariTent(M) {
    const THREE = T(), w = 5, d = 7, wall = 2.1, ridge = 3.6, parts = [];
    const deck = new THREE.BoxGeometry(w + 1.6, 0.3, d + 2.6); deck.translate(0, 0.15, -0.8);
    parts.push({ geometry: deck, material: M.deck });
    const walls = new THREE.BoxGeometry(w, wall, d); walls.translate(0, 0.3 + wall / 2, 0);
    parts.push({ geometry: walls, material: M.canvasWarm });
    // سقف جملوني من مثلثين وشرائح مائلة
    const roof = new THREE.BufferGeometry();
    const y0 = 0.3 + wall, hw = w / 2 + 0.45, hd = d / 2 + 0.45;
    const v = [
      -hw, y0, -hd, hw, y0, -hd, 0, ridge, -hd,
      -hw, y0, hd, hw, y0, hd, 0, ridge, hd
    ];
    const idx = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4];
    roof.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    roof.setIndex(idx); roof.computeVertexNormals();
    parts.push({ geometry: roof, material: M.canvasLight });
    // شرفة أمامية
    const porch = new THREE.BoxGeometry(w + 0.6, 0.07, 2.4); porch.translate(0, 2.5, -(d / 2 + 1.4));
    parts.push({ geometry: porch, material: M.canvasShade });
    const post = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6);
    parts.push({ geometry: post.clone().applyMatrix4(M4(-(w / 2), 1.4, -(d / 2 + 2.4))), material: M.timber });
    parts.push({ geometry: post.clone().applyMatrix4(M4(w / 2, 1.4, -(d / 2 + 2.4))), material: M.timber });
    const doorway = new THREE.PlaneGeometry(1.5, 1.9); doorway.translate(0, 0.3 + 0.95, -(d / 2 + 0.02));
    parts.push({ geometry: doorway, material: M.windowGlow });
    const chair = new THREE.BoxGeometry(0.5, 0.45, 0.5);
    parts.push({ geometry: chair.clone().applyMatrix4(M4(-1.2, 0.55, -(d / 2 + 1.6))), material: M.timber });
    parts.push({ geometry: chair.clone().applyMatrix4(M4(0.2, 0.55, -(d / 2 + 1.9))), material: M.timber });
    return parts;
  }

  function privateVilla(M) {
    const THREE = T(), w = 14, d = 10, h = 4, parts = [];
    const body = new THREE.BoxGeometry(w, h, d); body.translate(0, h / 2, 0);
    parts.push({ geometry: body, material: M.plaster });
    const roof = new THREE.BoxGeometry(w + 1.6, 0.35, d + 1.6); roof.translate(0, h + 0.16, 0);
    parts.push({ geometry: roof, material: M.plasterWarm });
    const glass = new THREE.BoxGeometry(w - 3, 2.2, 0.12); glass.translate(0, 1.9, -(d / 2 + 0.02));
    parts.push({ geometry: glass, material: M.windowGlow });
    const side = new THREE.BoxGeometry(0.12, 1.8, d - 4); side.translate(-(w / 2 + 0.02), 2, 0);
    parts.push({ geometry: side, material: M.windowGlow });
    const terrace = new THREE.BoxGeometry(w, 0.3, 7); terrace.translate(0, 0.15, -(d / 2 + 3.5));
    parts.push({ geometry: terrace, material: M.deck });
    const beam = new THREE.BoxGeometry(w, 0.22, 0.22);
    for (let i = 0; i < 9; i++) parts.push({ geometry: beam.clone().applyMatrix4(M4(0, 3.2, -(d / 2 + 0.9 + i * 0.72))), material: M.timber });
    const col = new THREE.BoxGeometry(0.25, 3.2, 0.25);
    [[-w / 2 + 0.4, -(d / 2 + 6.4)], [w / 2 - 0.4, -(d / 2 + 6.4)]].forEach((p) =>
      parts.push({ geometry: col.clone().applyMatrix4(M4(p[0], 1.6, p[1])), material: M.timber }));
    const wall = new THREE.BoxGeometry(0.35, 1, 12); // جدار فناء يحفظ الخصوصية
    parts.push({ geometry: wall.clone().applyMatrix4(M4(-(w / 2 + 4), 0.5, -2)), material: M.stone });
    parts.push({ geometry: wall.clone().applyMatrix4(M4(w / 2 + 4, 0.5, -2)), material: M.stone });
    return parts;
  }

  // قماش مشدود بقمم مخروطية وحافة ثابتة — قاعة الفعاليات ومظلات الاستقبال
  function tensileCanopy(M, w, d, peak, peaks) {
    const THREE = T(), nx = 30, nz = 24, pos = [], idx = [], uv = [];
    const pk = peaks || [[0, 0]];
    const eave = Math.max(2.8, peak * 0.38);
    const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, v = j / nz, x = (u - 0.5) * w, z = (v - 0.5) * d;
        let cone = 0;
        for (const p of pk) {
          const dx = (x - p[0] * w / 2) / (w * 0.3), dz = (z - p[1] * d / 2) / (d * 0.3);
          cone = Math.max(cone, Math.exp(-(dx * dx + dz * dz) * 1.25));
        }
        const edge = smooth(Math.min(u, 1 - u, v, 1 - v) * 7);
        const sag = (1 - edge) * 0.35;
        pos.push(x, eave - sag + (peak - eave) * cone * edge, z);
        uv.push(u * 3, v * 3);
      }
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const parts = [{ geometry: g, material: M.canvasLight }];
    const mast = new THREE.CylinderGeometry(0.13, 0.17, peak, 8);
    for (const p of pk) parts.push({ geometry: mast.clone().applyMatrix4(M4(p[0] * w / 2, peak / 2, p[1] * d / 2)), material: M.metalLight });
    // أعمدة الحافة وشدّات الأركان
    const post = new THREE.CylinderGeometry(0.1, 0.12, eave, 7);
    const cols = Math.max(2, Math.round(w / 9)), rows = Math.max(2, Math.round(d / 9));
    for (let i = 0; i <= cols; i++) {
      const x = -w / 2 + (i * w) / cols;
      parts.push({ geometry: post.clone().applyMatrix4(M4(x, eave / 2 - 0.2, -d / 2)), material: M.metalLight });
      parts.push({ geometry: post.clone().applyMatrix4(M4(x, eave / 2 - 0.2, d / 2)), material: M.metalLight });
    }
    for (let j = 1; j < rows; j++) {
      const z = -d / 2 + (j * d) / rows;
      parts.push({ geometry: post.clone().applyMatrix4(M4(-w / 2, eave / 2 - 0.2, z)), material: M.metalLight });
      parts.push({ geometry: post.clone().applyMatrix4(M4(w / 2, eave / 2 - 0.2, z)), material: M.metalLight });
    }
    return parts;
  }

  function shadeStructure(M, w, d, h, slats) {
    const THREE = T(), parts = [];
    const beamL = new THREE.BoxGeometry(w, 0.3, 0.3);
    parts.push({ geometry: beamL.clone().applyMatrix4(M4(0, h, -d / 2 + 0.2)), material: M.timber });
    parts.push({ geometry: beamL.clone().applyMatrix4(M4(0, h, d / 2 - 0.2)), material: M.timber });
    const col = new THREE.CylinderGeometry(0.16, 0.18, h, 8);
    const cols = Math.max(2, Math.round(w / 6));
    for (let i = 0; i <= cols; i++) {
      const x = -w / 2 + (i * w) / cols;
      parts.push({ geometry: col.clone().applyMatrix4(M4(x, h / 2, -d / 2 + 0.2)), material: M.timber });
      parts.push({ geometry: col.clone().applyMatrix4(M4(x, h / 2, d / 2 - 0.2)), material: M.timber });
    }
    if (slats !== false) {
      const slat = new THREE.BoxGeometry(w, 0.12, 0.18);
      const n = Math.round(d / 0.55);
      for (let i = 0; i <= n; i++) parts.push({ geometry: slat.clone().applyMatrix4(M4(0, h + 0.2, -d / 2 + (i * d) / n)), material: M.timber });
    } else {
      const sheet = new THREE.BoxGeometry(w, 0.1, d); sheet.translate(0, h + 0.2, 0);
      parts.push({ geometry: sheet, material: M.canvasShade });
    }
    return parts;
  }

  function buildingBlock(M, w, d, h, material) {
    const THREE = T(), parts = [];
    const body = new THREE.BoxGeometry(w, h, d); body.translate(0, h / 2, 0);
    parts.push({ geometry: body, material: material || M.plaster });
    // سقف بارز يعطي خط ظل، وحاجز سطح منخفض
    const roof = new THREE.BoxGeometry(w + 2.4, 0.32, d + 2.4); roof.translate(0, h + 0.16, 0);
    parts.push({ geometry: roof, material: M.plasterWarm });
    const parapet = new THREE.BoxGeometry(w + 2.4, 0.5, 0.26);
    parts.push({ geometry: parapet.clone().applyMatrix4(M4(0, h + 0.55, -(d / 2 + 1.1))), material: M.plasterWarm });
    parts.push({ geometry: parapet.clone().applyMatrix4(M4(0, h + 0.55, d / 2 + 1.1)), material: M.plasterWarm });
    // واجهة زجاجية بفواصل رأسية
    const glass = new THREE.BoxGeometry(w - 2.4, Math.min(2.4, h * 0.6), 0.1);
    glass.translate(0, h * 0.5, -(d / 2 + 0.03));
    parts.push({ geometry: glass, material: M.windowGlow });
    if (w >= 12) {
      const mullion = new THREE.BoxGeometry(0.16, Math.min(2.6, h * 0.66), 0.2);
      const n = Math.max(2, Math.round(w / 3));
      for (let i = 1; i < n; i++) {
        parts.push({ geometry: mullion.clone().applyMatrix4(M4(-w / 2 + (i * w) / n, h * 0.5, -(d / 2 + 0.1))), material: M.timber });
      }
      const col = new THREE.CylinderGeometry(0.17, 0.2, h, 8);
      for (let i = 0; i <= Math.round(w / 6); i++) {
        parts.push({ geometry: col.clone().applyMatrix4(M4(-w / 2 + (i * w) / Math.round(w / 6), h / 2, -(d / 2 + 1.05))), material: M.timber });
      }
    }
    return parts;
  }

  // درابزين خشبي حول شرفة
  function railing(M, w, d) {
    const THREE = T(), parts = [];
    const post = new THREE.CylinderGeometry(0.07, 0.08, 1.05, 6);
    const rail = new THREE.BoxGeometry(w, 0.1, 0.1), railZ = new THREE.BoxGeometry(0.1, 0.1, d);
    for (const z of [-d / 2, d / 2]) parts.push({ geometry: rail.clone().applyMatrix4(M4(0, 1.0, z)), material: M.timber });
    for (const x of [-w / 2, w / 2]) parts.push({ geometry: railZ.clone().applyMatrix4(M4(x, 1.0, 0)), material: M.timber });
    const stepX = Math.max(1, Math.round(w / 2.4)), stepZ = Math.max(1, Math.round(d / 2.4));
    for (let i = 0; i <= stepX; i++) for (const z of [-d / 2, d / 2]) {
      parts.push({ geometry: post.clone().applyMatrix4(M4(-w / 2 + (i * w) / stepX, 0.52, z)), material: M.timber });
    }
    for (let i = 1; i < stepZ; i++) for (const x of [-w / 2, w / 2]) {
      parts.push({ geometry: post.clone().applyMatrix4(M4(x, 0.52, -d / 2 + (i * d) / stepZ)), material: M.timber });
    }
    return parts;
  }

  function majlis(M, r) {
    const THREE = T(), parts = [];
    const pad = new THREE.CylinderGeometry(r, r, 0.3, 24); pad.translate(0, 0.15, 0);
    parts.push({ geometry: pad, material: M.deck });
    const seat = new THREE.BoxGeometry(1.5, 0.42, 0.75);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      parts.push({ geometry: seat.clone().applyMatrix4(M4(Math.cos(a) * (r - 0.9), 0.51, Math.sin(a) * (r - 0.9), -a + Math.PI / 2)), material: M.canvasWarm });
    }
    const ring = new THREE.TorusGeometry(0.95, 0.22, 6, 18); ring.rotateX(Math.PI / 2); ring.translate(0, 0.42, 0);
    parts.push({ geometry: ring, material: M.stone });
    const flame = new THREE.ConeGeometry(0.6, 1.1, 10); flame.translate(0, 0.95, 0);
    parts.push({ geometry: flame, material: M.fire });
    return parts;
  }

  function firePit(M) {
    const THREE = T(), parts = [];
    const ring = new THREE.TorusGeometry(1.1, 0.26, 6, 16); ring.rotateX(Math.PI / 2); ring.translate(0, 0.24, 0);
    parts.push({ geometry: ring, material: M.stone });
    const flame = new THREE.ConeGeometry(0.62, 1.2, 10); flame.translate(0, 0.95, 0);
    parts.push({ geometry: flame, material: M.fire });
    return parts;
  }

  function palm(M, h) {
    const THREE = T(), parts = [], height = h || 6.5;
    const trunk = new THREE.CylinderGeometry(0.17, 0.29, height, 8); trunk.translate(0, height / 2, 0);
    parts.push({ geometry: trunk, material: M.trunk });
    const frond = new THREE.ConeGeometry(0.42, 3.4, 5, 1, true);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, tilt = 0.95 + (i % 2) * 0.22;
      const m = new (T().Matrix4)().makeRotationZ(tilt);
      m.premultiply(new (T().Matrix4)().makeRotationY(a));
      m.premultiply(new (T().Matrix4)().makeTranslation(Math.cos(a) * 1.2, height + 0.1, Math.sin(a) * 1.2));
      parts.push({ geometry: frond.clone().applyMatrix4(m), material: M.foliage });
    }
    const crown = new THREE.SphereGeometry(0.5, 8, 6); crown.translate(0, height, 0);
    parts.push({ geometry: crown, material: M.trunk });
    return parts;
  }

  function acacia(M, scale) {
    const THREE = T(), parts = [], s = scale || 1;
    const trunk = new THREE.CylinderGeometry(0.15 * s, 0.32 * s, 2.4 * s, 7); trunk.translate(0, 1.2 * s, 0);
    parts.push({ geometry: trunk, material: M.trunk });
    const canopy = new THREE.SphereGeometry(1, 9, 6);
    const blobs = [[0, 3.1, 0, 2.3, 0.62], [1.3, 2.8, 0.5, 1.5, 0.55], [-1.1, 2.9, -0.7, 1.4, 0.5], [0.4, 3.2, -1.2, 1.2, 0.5]];
    for (const b of blobs) {
      const g = canopy.clone();
      g.scale(b[3] * s, b[3] * b[4] * s, b[3] * s);
      g.translate(b[0] * s, b[1] * s, b[2] * s);
      parts.push({ geometry: g, material: M.foliage });
    }
    return parts;
  }

  function shrub(M, scale) {
    const THREE = T(), s = scale || 1;
    const g = new THREE.IcosahedronGeometry(0.7 * s, 0);
    g.scale(1, 0.68, 1); g.translate(0, 0.42 * s, 0);
    return [{ geometry: g, material: M.foliageDry }];
  }

  function rock(M, scale, seed) {
    const THREE = T(), s = scale || 1;
    const g = new THREE.IcosahedronGeometry(s, 1);
    const pos = g.attributes.position, rnd = NT.textures.makeRandom(seed || 7);
    for (let i = 0; i < pos.count; i++) {
      const k = 0.72 + rnd() * 0.5;
      pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.66, pos.getZ(i) * k);
    }
    g.scale(1.25, 0.55, 1.15);
    g.computeVertexNormals(); g.translate(0, s * 0.16, 0);
    return [{ geometry: g, material: M.rock }];
  }

  function car(M) {
    const THREE = T(), parts = [];
    const body = new THREE.BoxGeometry(1.85, 0.75, 4.5); body.translate(0, 0.72, 0);
    parts.push({ geometry: body, material: M.carBody });
    const cabin = new THREE.BoxGeometry(1.7, 0.62, 2.4); cabin.translate(0, 1.4, -0.2);
    parts.push({ geometry: cabin, material: M.carGlass });
    const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.25, 10); wheel.rotateZ(Math.PI / 2);
    [[-0.92, -1.45], [0.92, -1.45], [-0.92, 1.5], [0.92, 1.5]].forEach((p) =>
      parts.push({ geometry: wheel.clone().applyMatrix4(M4(p[0], 0.34, p[1])), material: M.tyre }));
    return parts;
  }

  function lightPole(M, h) {
    const THREE = T(), parts = [], height = h || 6;
    const pole = new THREE.CylinderGeometry(0.09, 0.13, height, 8); pole.translate(0, height / 2, 0);
    parts.push({ geometry: pole, material: M.metal });
    const head = new THREE.BoxGeometry(0.5, 0.18, 0.5); head.translate(0, height, 0);
    parts.push({ geometry: head, material: M.lamp });
    return parts;
  }

  function lantern(M) {
    const THREE = T(), parts = [];
    const post = new THREE.CylinderGeometry(0.05, 0.06, 1.1, 6); post.translate(0, 0.55, 0);
    parts.push({ geometry: post, material: M.metal });
    const glow = new THREE.SphereGeometry(0.18, 8, 6); glow.translate(0, 1.2, 0);
    parts.push({ geometry: glow, material: M.lamp });
    return parts;
  }

  /* ===== عناصر الملف المعتمد ===== */

  // محطة وقود: مظلة على أعمدة، مضخات، ومتجر صغير
  function fuelStation(M) {
    const THREE = T(), parts = [];
    const canopy = new THREE.BoxGeometry(26, 0.9, 13); canopy.translate(0, 5.6, 0);
    parts.push({ geometry: canopy, material: M.plaster });
    const fascia = new THREE.BoxGeometry(26.4, 0.7, 0.4);
    parts.push({ geometry: fascia.clone().applyMatrix4(M4(0, 5.05, -6.6)), material: M.lamp });
    parts.push({ geometry: fascia.clone().applyMatrix4(M4(0, 5.05, 6.6)), material: M.lamp });
    const col = new THREE.CylinderGeometry(0.26, 0.3, 5.2, 10);
    for (const p of [[-9, -3.4], [9, -3.4], [-9, 3.4], [9, 3.4]]) {
      parts.push({ geometry: col.clone().applyMatrix4(M4(p[0], 2.6, p[1])), material: M.metalLight });
    }
    const island = new THREE.BoxGeometry(7, 0.25, 2.2);
    const pump = new THREE.BoxGeometry(0.8, 1.9, 1.2);
    for (const z of [-3.2, 3.2]) {
      parts.push({ geometry: island.clone().applyMatrix4(M4(0, 0.12, z)), material: M.stone });
      for (const x of [-2.2, 2.2]) parts.push({ geometry: pump.clone().applyMatrix4(M4(x, 1.2, z)), material: M.metalLight });
    }
    for (const part of buildingBlock(M, 10, 7, 3.6, M.plaster)) {
      part.geometry = part.geometry.clone().applyMatrix4(M4(0, 0, 12));
      parts.push(part);
    }
    return parts;
  }

  // بنشر: سقيفة مفتوحة وإطارات وعدة
  function workshop(M) {
    const THREE = T(), parts = [];
    const roof = new THREE.BoxGeometry(14, 0.35, 10); roof.translate(0, 4.4, 0);
    parts.push({ geometry: roof, material: M.metalLight });
    const back = new THREE.BoxGeometry(14, 4.2, 0.3); back.translate(0, 2.1, 4.8);
    parts.push({ geometry: back, material: M.plasterWarm });
    const side = new THREE.BoxGeometry(0.3, 4.2, 10);
    parts.push({ geometry: side.clone().applyMatrix4(M4(-6.9, 2.1, 0)), material: M.plasterWarm });
    parts.push({ geometry: side.clone().applyMatrix4(M4(6.9, 2.1, 0)), material: M.plasterWarm });
    const col = new THREE.CylinderGeometry(0.13, 0.15, 4.2, 8);
    for (const x of [-6.6, 0, 6.6]) parts.push({ geometry: col.clone().applyMatrix4(M4(x, 2.1, -4.7)), material: M.metal });
    const tyre = new THREE.TorusGeometry(0.42, 0.16, 6, 12); tyre.rotateX(Math.PI / 2);
    for (let i = 0; i < 9; i++) {
      parts.push({ geometry: tyre.clone().applyMatrix4(M4(-5.4 + (i % 3) * 1.1, 0.2 + Math.floor(i / 3) * 0.34, -6.4)), material: M.tyre });
    }
    const bench = new THREE.BoxGeometry(4, 0.9, 0.8); bench.translate(3.4, 0.45, 4);
    parts.push({ geometry: bench, material: M.metal });
    return parts;
  }

  // بقالة: مبنى بواجهة زجاجية ومظلة وصناديق عرض
  function grocery(M) {
    const THREE = T(), parts = buildingBlock(M, 13, 9, 4, M.plaster);
    const awning = new THREE.BoxGeometry(14.5, 0.18, 3.4); awning.translate(0, 3.5, -6);
    parts.push({ geometry: awning, material: M.canvasShade });
    const post = new THREE.CylinderGeometry(0.09, 0.1, 3.4, 8);
    for (const x of [-6.4, 6.4]) parts.push({ geometry: post.clone().applyMatrix4(M4(x, 1.7, -7.4)), material: M.timber });
    const crate = new THREE.BoxGeometry(1.1, 0.5, 0.8);
    for (let i = 0; i < 4; i++) parts.push({ geometry: crate.clone().applyMatrix4(M4(-3 + i * 1.6, 0.25, -6.2)), material: M.timber });
    return parts;
  }

  // البوابة: أكشاك وحواجز وجسر لافتة فوق المسارات
  function gateHouse(M, lanes) {
    const THREE = T(), parts = [], n = lanes || 3, span = n * 4.2;
    const booth = new THREE.BoxGeometry(3, 3.1, 3);
    const glass = new THREE.BoxGeometry(2.6, 1.3, 0.1);
    for (const x of [-span / 2 - 2.4, span / 2 + 2.4]) {
      parts.push({ geometry: booth.clone().applyMatrix4(M4(x, 1.55, 0)), material: M.plaster });
      parts.push({ geometry: glass.clone().applyMatrix4(M4(x, 1.9, -1.55)), material: M.windowGlow });
      const cap = new THREE.BoxGeometry(3.8, 0.25, 3.8);
      parts.push({ geometry: cap.clone().applyMatrix4(M4(x, 3.2, 0)), material: M.plasterWarm });
    }
    // جسر لافتة
    const beam = new THREE.BoxGeometry(span + 10, 1.5, 1.1); beam.translate(0, 6.4, 0);
    parts.push({ geometry: beam, material: M.metal });
    const panel = new THREE.BoxGeometry(span * 0.55, 1.05, 0.22); panel.translate(0, 6.4, -0.6);
    parts.push({ geometry: panel, material: M.lamp });
    const mast = new THREE.CylinderGeometry(0.3, 0.36, 6.4, 10);
    for (const x of [-span / 2 - 4.6, span / 2 + 4.6]) parts.push({ geometry: mast.clone().applyMatrix4(M4(x, 3.2, 0)), material: M.metal });
    // جزر وحواجز
    const island = new THREE.BoxGeometry(3.4, 0.3, 7);
    const arm = new THREE.BoxGeometry(3.9, 0.16, 0.16);
    for (let i = 0; i < n; i++) {
      const x = -span / 2 + 2.1 + i * 4.2;
      parts.push({ geometry: island.clone().applyMatrix4(M4(x - 2.1, 0.15, 0)), material: M.stone });
      parts.push({ geometry: arm.clone().applyMatrix4(M4(x, 1.15, 1.6)), material: M.lamp });
    }
    return parts;
  }

  // عربة طعام: صندوق بنافذة خدمة ومظلة وعجلات
  function foodTruck(M, tint) {
    const THREE = T(), parts = [];
    const body = new THREE.BoxGeometry(6.2, 2.5, 2.4); body.translate(0, 1.75, 0);
    parts.push({ geometry: body, material: tint || M.plaster });
    const cab = new THREE.BoxGeometry(1.9, 1.7, 2.3); cab.translate(-3.6, 1.4, 0);
    parts.push({ geometry: cab, material: M.metalLight });
    const windshield = new THREE.BoxGeometry(0.12, 1, 2.1); windshield.translate(-4.5, 1.8, 0);
    parts.push({ geometry: windshield, material: M.carGlass });
    const hatch = new THREE.BoxGeometry(4.2, 1.2, 0.12); hatch.translate(0.4, 2, -1.26);
    parts.push({ geometry: hatch, material: M.windowGlow });
    const awning = new THREE.BoxGeometry(4.6, 0.1, 1.9);
    const m = new THREE.Matrix4().makeRotationX(-0.28);
    m.premultiply(new THREE.Matrix4().makeTranslation(0.4, 3.05, -2.1));
    parts.push({ geometry: awning.clone().applyMatrix4(m), material: M.canvasShade });
    const wheel = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10); wheel.rotateZ(Math.PI / 2);
    for (const p of [[-3.2, -1.2], [-3.2, 1.2], [2.2, -1.2], [2.2, 1.2]]) {
      parts.push({ geometry: wheel.clone().applyMatrix4(M4(p[0], 0.42, p[1])), material: M.tyre });
    }
    const counter = new THREE.BoxGeometry(4.2, 0.12, 0.5); counter.translate(0.4, 1.42, -1.5);
    parts.push({ geometry: counter, material: M.timber });
    return parts;
  }

  // طاولة وكراسي
  function diningSet(M) {
    const THREE = T(), parts = [];
    const top = new THREE.CylinderGeometry(0.75, 0.72, 0.1, 12); top.translate(0, 0.76, 0);
    parts.push({ geometry: top, material: M.timber });
    const stem = new THREE.CylinderGeometry(0.09, 0.14, 0.76, 8); stem.translate(0, 0.38, 0);
    parts.push({ geometry: stem, material: M.metal });
    const seat = new THREE.BoxGeometry(0.45, 0.08, 0.45), backRest = new THREE.BoxGeometry(0.45, 0.5, 0.07);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 1.15, z = Math.sin(a) * 1.15;
      parts.push({ geometry: seat.clone().applyMatrix4(M4(x, 0.46, z, -a)), material: M.canvasWarm });
      parts.push({ geometry: backRest.clone().applyMatrix4(M4(x + Math.cos(a) * 0.2, 0.72, z + Math.sin(a) * 0.2, -a)), material: M.canvasWarm });
    }
    return parts;
  }

  // ألعاب أطفال: هيكل تسلق وزحليقة وأرجوحة
  function playSet(M) {
    const THREE = T(), parts = [];
    const deck = new THREE.BoxGeometry(3.4, 0.25, 3.4); deck.translate(0, 1.7, 0);
    parts.push({ geometry: deck, material: M.deck });
    const post = new THREE.BoxGeometry(0.18, 2.6, 0.18);
    for (const p of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
      parts.push({ geometry: post.clone().applyMatrix4(M4(p[0], 1.3, p[1])), material: M.timber });
    }
    const roof = new THREE.ConeGeometry(2.8, 1.2, 4); roof.rotateY(Math.PI / 4); roof.translate(0, 3.4, 0);
    parts.push({ geometry: roof, material: M.canvasShade });
    const slide = new THREE.BoxGeometry(0.9, 0.12, 4.2);
    const sm = new THREE.Matrix4().makeRotationX(0.42);
    sm.premultiply(new THREE.Matrix4().makeTranslation(1.1, 1.05, 3.2));
    parts.push({ geometry: slide.clone().applyMatrix4(sm), material: M.metalLight });
    const frame = new THREE.BoxGeometry(3.6, 0.16, 0.16); frame.translate(-3.6, 2.3, 0);
    parts.push({ geometry: frame, material: M.metal });
    const leg = new THREE.CylinderGeometry(0.08, 0.09, 2.3, 8);
    for (const p of [[-5.2, -0.9], [-5.2, 0.9], [-2, -0.9], [-2, 0.9]]) {
      parts.push({ geometry: leg.clone().applyMatrix4(M4(p[0], 1.15, p[1])), material: M.metal });
    }
    const swing = new THREE.BoxGeometry(0.5, 0.07, 0.22);
    for (const x of [-4.4, -2.8]) {
      parts.push({ geometry: swing.clone().applyMatrix4(M4(x, 0.6, 0)), material: M.timber });
      const rope = new THREE.CylinderGeometry(0.025, 0.025, 1.7, 5);
      parts.push({ geometry: rope.clone().applyMatrix4(M4(x, 1.45, -0.08)), material: M.metal });
      parts.push({ geometry: rope.clone().applyMatrix4(M4(x, 1.45, 0.08)), material: M.metal });
    }
    return parts;
  }

  // اسطبل: صف بوكسات بسقف مائل ومنطقة تجهيز
  function stableRow(M, boxes) {
    const THREE = T(), parts = [], n = boxes || 10, w = n * 3.6;
    const roof = new THREE.BoxGeometry(w + 2.4, 0.3, 13);
    const rm = new THREE.Matrix4().makeRotationX(-0.07);
    rm.premultiply(new THREE.Matrix4().makeTranslation(0, 4.3, 0));
    parts.push({ geometry: roof.clone().applyMatrix4(rm), material: M.metalLight });
    const back = new THREE.BoxGeometry(w, 3.4, 0.3); back.translate(0, 1.7, 5.4);
    parts.push({ geometry: back, material: M.plasterWarm });
    const divider = new THREE.BoxGeometry(0.22, 2.9, 7);
    const door = new THREE.BoxGeometry(3.2, 1.35, 0.16);
    for (let i = 0; i <= n; i++) {
      parts.push({ geometry: divider.clone().applyMatrix4(M4(-w / 2 + i * 3.6, 1.45, 2)), material: M.timber });
      if (i < n) parts.push({ geometry: door.clone().applyMatrix4(M4(-w / 2 + 1.8 + i * 3.6, 0.68, -1.4)), material: M.timber });
    }
    const col = new THREE.CylinderGeometry(0.12, 0.14, 3.9, 8);
    for (let i = 0; i <= n; i += 2) parts.push({ geometry: col.clone().applyMatrix4(M4(-w / 2 + i * 3.6, 1.95, -5.4)), material: M.metal });
    return parts;
  }

  // مطعم القمة: واجهة زجاجية للجنوب وشرفة إطلالة ومطبخ خلفي
  function summitRestaurant(M) {
    const THREE = T(), parts = buildingBlock(M, 44, 16, 5.4, M.plaster);
    const deck = new THREE.BoxGeometry(48, 0.45, 12); deck.translate(0, 0.2, -14);
    parts.push({ geometry: deck, material: M.deck });
    parts.push(...railing(M, 48, 12).map((r) => ({ geometry: r.geometry.clone().applyMatrix4(M4(0, 0.42, -14)), material: r.material })));
    const pergola = new THREE.BoxGeometry(46, 0.22, 0.22);
    for (let i = 0; i < 14; i++) parts.push({ geometry: pergola.clone().applyMatrix4(M4(0, 3.9, -8.6 - i * 0.78)), material: M.timber });
    const col = new THREE.CylinderGeometry(0.19, 0.22, 3.9, 8);
    for (const x of [-22, -7, 8, 22]) parts.push({ geometry: col.clone().applyMatrix4(M4(x, 1.95, -19.4)), material: M.timber });
    const kitchen = new THREE.BoxGeometry(16, 4, 9); kitchen.translate(-14, 2, 11);
    parts.push({ geometry: kitchen, material: M.plasterWarm });
    const flue = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
    for (const x of [-18, -14, -10]) parts.push({ geometry: flue.clone().applyMatrix4(M4(x, 5.4, 11)), material: M.metal });
    return parts;
  }

  // ساتر ترابي لمنطقة الرماية
  function berm(M, length, height) {
    const THREE = T(), h = height || 4, l = length || 40;
    const g = new THREE.BufferGeometry();
    const pos = [], idx = [], half = h * 1.7;
    const seg = Math.max(6, Math.round(l / 6));
    for (let i = 0; i <= seg; i++) {
      const x = -l / 2 + (i * l) / seg;
      const jitter = Math.sin(i * 1.7) * 0.25;
      pos.push(x, 0, -half, x, h + jitter, 0, x, 0, half);
    }
    for (let i = 0; i < seg; i++) {
      const a = i * 3;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return [{ geometry: g, material: M.sand }];
  }

  // إطار هدف للرماية
  function target(M) {
    const THREE = T(), parts = [];
    const post = new THREE.BoxGeometry(0.12, 1.8, 0.12);
    for (const x of [-0.6, 0.6]) parts.push({ geometry: post.clone().applyMatrix4(M4(x, 0.9, 0)), material: M.timber });
    const face = new THREE.BoxGeometry(1.3, 1.3, 0.06); face.translate(0, 1.35, 0);
    parts.push({ geometry: face, material: M.canvasLight });
    return parts;
  }

  // سيارة دفع رباعي بقاعدة أعلى ورفرف سقف
  function offRoader(M) {
    const THREE = T(), parts = [];
    const body = new THREE.BoxGeometry(2.05, 1.1, 4.9); body.translate(0, 1.15, 0);
    parts.push({ geometry: body, material: M.carBody });
    const cabin = new THREE.BoxGeometry(1.95, 0.85, 2.9); cabin.translate(0, 2.1, 0.1);
    parts.push({ geometry: cabin, material: M.carGlass });
    const rack = new THREE.BoxGeometry(1.8, 0.12, 2.4); rack.translate(0, 2.62, 0.1);
    parts.push({ geometry: rack, material: M.metal });
    const bar = new THREE.BoxGeometry(2.1, 0.14, 0.14); bar.translate(0, 1.5, -2.5);
    parts.push({ geometry: bar, material: M.metalLight });
    const wheel = new THREE.CylinderGeometry(0.48, 0.48, 0.34, 10); wheel.rotateZ(Math.PI / 2);
    for (const p of [[-1.02, -1.6], [1.02, -1.6], [-1.02, 1.6], [1.02, 1.6]]) {
      parts.push({ geometry: wheel.clone().applyMatrix4(M4(p[0], 0.48, p[1])), material: M.tyre });
    }
    return parts;
  }

  // كشتة: فرشة ومجلس ونار ومظلة خفيفة
  function kashta(M) {
    const THREE = T(), parts = [];
    const rug = new THREE.BoxGeometry(6, 0.08, 5); rug.translate(0, 0.05, 0);
    parts.push({ geometry: rug, material: M.canvasWarm });
    const cushion = new THREE.BoxGeometry(0.9, 0.32, 0.6);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + (i / 7) * 1.2);
      parts.push({ geometry: cushion.clone().applyMatrix4(M4(Math.cos(a) * 2.4, 0.24, Math.sin(a) * 2, -a)), material: M.canvasLight });
    }
    const ring = new THREE.TorusGeometry(0.8, 0.2, 6, 14); ring.rotateX(Math.PI / 2); ring.translate(0, 0.2, -2.6);
    parts.push({ geometry: ring, material: M.stone });
    const flame = new THREE.ConeGeometry(0.45, 0.9, 8); flame.translate(0, 0.75, -2.6);
    parts.push({ geometry: flame, material: M.fire });
    const shade = new THREE.BoxGeometry(6.4, 0.07, 3.4); shade.translate(0, 2.5, 1.6);
    parts.push({ geometry: shade, material: M.canvasShade });
    const pole = new THREE.CylinderGeometry(0.06, 0.07, 2.5, 6);
    for (const p of [[-3, 0.2], [3, 0.2], [-3, 3.1], [3, 3.1]]) {
      parts.push({ geometry: pole.clone().applyMatrix4(M4(p[0], 1.25, p[1])), material: M.timber });
    }
    return parts;
  }

  // سور قطعة مخيم: ألواح قماش على قوائم
  function campScreen(M, w, d) {
    const THREE = T(), parts = [];
    const panel = new THREE.BoxGeometry(w, 2, 0.12), panelZ = new THREE.BoxGeometry(0.12, 2, d);
    parts.push({ geometry: panel.clone().applyMatrix4(M4(0, 1, -d / 2)), material: M.canvasWarm });
    parts.push({ geometry: panelZ.clone().applyMatrix4(M4(-w / 2, 1, 0)), material: M.canvasWarm });
    parts.push({ geometry: panelZ.clone().applyMatrix4(M4(w / 2, 1, 0)), material: M.canvasWarm });
    const post = new THREE.CylinderGeometry(0.08, 0.09, 2.3, 6);
    for (let i = 0; i <= w / 4; i++) parts.push({ geometry: post.clone().applyMatrix4(M4(-w / 2 + i * 4, 1.15, -d / 2)), material: M.timber });
    for (let i = 0; i <= d / 4; i++) {
      parts.push({ geometry: post.clone().applyMatrix4(M4(-w / 2, 1.15, -d / 2 + i * 4)), material: M.timber });
      parts.push({ geometry: post.clone().applyMatrix4(M4(w / 2, 1.15, -d / 2 + i * 4)), material: M.timber });
    }
    return parts;
  }

  NT.props = {
    Builder, makeMaterials, M4,
    domeStay, safariTent, privateVilla, tensileCanopy, shadeStructure, buildingBlock,
    majlis, firePit, palm, acacia, shrub, rock, car, lightPole, lantern, railing,
    fuelStation, workshop, grocery, gateHouse, foodTruck, diningSet, playSet, stableRow,
    summitRestaurant, berm, target, offRoader, kashta, campScreen
  };
})(window.NT = window.NT || {});
