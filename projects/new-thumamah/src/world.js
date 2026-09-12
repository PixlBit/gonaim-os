/* بناء المشهد: أرض بصورة الموقع، سماء وشمس فيزيائية، ظلال، ومحتوى المناطق.
   الأرض مستوية — لا تمثل التضاريس الفعلية ولا رفعًا مساحيًا. */
(function (NT) {
  'use strict';

  const TIMES = {
    day: {
      label: 'نهار', elevation: 56, azimuth: 162, turbidity: 3.2, rayleigh: 1.05, mie: 0.005, mieG: 0.75,
      sun: 0xfff4e4, sunI: 3.1, hemiSky: 0xa8c8ea, hemiGround: 0xb09c74, hemiI: 0.17, ambient: 0.02, envI: 0.26,
      exposure: 0.42, fog: 0xd6d2c4, fogNear: 3200, fogFar: 24000, emissive: 0, bloom: 0.1
    },
    sunset: {
      label: 'غروب', elevation: 7.0, azimuth: 287, turbidity: 6.2, rayleigh: 2.5, mie: 0.010, mieG: 0.86,
      sun: 0xffb379, sunI: 4.3, hemiSky: 0xdaa87c, hemiGround: 0x75593f, hemiI: 0.30, ambient: 0.05, envI: 0.6,
      exposure: 0.48, fog: 0xddb890, fogNear: 2200, fogFar: 17000, emissive: 0.32, bloom: 0.3
    },
    night: {
      label: 'ليل', elevation: -11, azimuth: 300, turbidity: 1.8, rayleigh: 0.6, mie: 0.003, mieG: 0.8,
      sun: 0x9cb4dc, sunI: 0.62, hemiSky: 0x33455f, hemiGround: 0x2b2419, hemiI: 0.30, ambient: 0.10, envI: 0.6,
      exposure: 0.82, fog: 0x1a2331, fogNear: 1200, fogFar: 11000, emissive: 1, bloom: 0.62
    }
  };

  function build(opts) {
    const THREE = window.THREE;
    const scene = opts.scene, quality = opts.quality || 'high', site = NT.data.site;
    const SX = site.width / 1500, SZ = site.depth / 1500;
    const root = new THREE.Group();
    scene.add(root);

    const rnd = NT.textures.makeRandom(20260912);
    const materials = NT.props.makeMaterials(null);
    const builder = new NT.props.Builder(root);
    const fires = [];
    const occupancy = new Uint8Array(300 * 300); // خلايا 5 م لتفادي تراكب النباتات مع المباني

    const wx = (x) => (x - 750) * SX;
    const wz = (y) => -(y - 750) * SZ;
    const at = (x, y, rot, scale) => NT.props.M4(wx(x), 0, wz(y), rot || 0, scale === undefined ? 1 : scale);
    const cell = (x, y) => {
      const cx = Math.floor(x / 5), cy = Math.floor(y / 5);
      return cx < 0 || cy < 0 || cx >= 300 || cy >= 300 ? -1 : cy * 300 + cx;
    };
    const occupy = (x, y, w, d) => {
      for (let yy = y - d / 2; yy <= y + d / 2; yy += 4) for (let xx = x - w / 2; xx <= x + w / 2; xx += 4) {
        const i = cell(xx, yy); if (i >= 0) occupancy[i] = 1;
      }
    };
    const free = (x, y) => { const i = cell(x, y); return i >= 0 && !occupancy[i]; };

    /* ===== أدوات البناء المتاحة لمولّدات المحتوى ===== */
    const ctx = {
      M: materials, rnd, wx, wz, at, zone: null,
      add: (geometry, material, matrix) => builder.add(geometry, material, matrix),
      addMatrix: (geometry, material, matrix) => builder.add(geometry, material, matrix),
      place(parts, x, y, rot, scale) {
        builder.addParts(parts, at(x, y, rot, scale));
        let w = 6, d = 6;
        for (const p of parts) {
          p.geometry.computeBoundingBox();
          const b = p.geometry.boundingBox;
          w = Math.max(w, (b.max.x - b.min.x) * 1.1);
          d = Math.max(d, (b.max.z - b.min.z) * 1.1);
        }
        occupy(x, y, Math.max(w, d), Math.max(w, d));
        return ctx;
      },
      instances(parts, matrices, userData) {
        builder.instances(parts, matrices, userData);
        for (const m of matrices) {
          const p = new THREE.Vector3().setFromMatrixPosition(m);
          occupy(p.x / SX + 750, 750 - p.z / SZ, 14, 14);
        }
        return ctx;
      },
      grid: (list) => list.map((p) => at(p[0], p[1], 0, 1)),
      pad(x, y, w, d, material, h) {
        const g = new THREE.BoxGeometry(w * SX, (h || 0.08), d * SZ);
        builder.add(g, material, NT.props.M4(wx(x), (h || 0.08) / 2, wz(y), 0, 1));
        occupy(x, y, w, d);
        return ctx;
      },
      disc(x, y, r, material, h) {
        const g = new THREE.CylinderGeometry(r * SX, r * SX, h || 0.08, 30);
        builder.add(g, material, NT.props.M4(wx(x), (h || 0.08) / 2, wz(y), 0, 1));
        occupy(x, y, r * 1.9, r * 1.9);
        return ctx;
      },
      stripes(list, material) {
        const g = new THREE.BoxGeometry(0.14, 0.06, 4.6 * SZ);
        for (const p of list) builder.add(g, material, NT.props.M4(wx(p[0]) - 1.3, 0.1, wz(p[1] + 2.3), 0, 1));
        return ctx;
      },
      ribbon(points, width, material, y) {
        const geo = ribbonGeometry(points, width, y === undefined ? 0.06 : y);
        if (geo) builder.add(geo, material, null);
        for (let i = 0; i < points.length; i++) occupy(points[i][0], points[i][1], width + 2, width + 2);
        return ctx;
      },
      deck(x, y, w, d) {
        const g = new THREE.BoxGeometry(w * SX, 0.4, d * SZ);
        builder.add(g, materials.deck, NT.props.M4(wx(x), 0.2, wz(y), 0, 1));
        occupy(x, y, w, d);
        return ctx;
      },
      deckPath(points, width) {
        const geo = ribbonGeometry(points, width, 0.22);
        if (geo) builder.add(geo, materials.deck, null);
        return ctx;
      },
      rail(x, y, w, d) {
        const post = new THREE.CylinderGeometry(0.08, 0.09, 1.5, 6);
        const railGeoX = new THREE.BoxGeometry(w * SX, 0.12, 0.1), railGeoZ = new THREE.BoxGeometry(0.1, 0.12, d * SZ);
        for (const hy of [0.75, 1.2]) {
          builder.add(railGeoX, materials.timber, NT.props.M4(wx(x), hy, wz(y - d / 2), 0, 1));
          builder.add(railGeoX, materials.timber, NT.props.M4(wx(x), hy, wz(y + d / 2), 0, 1));
          builder.add(railGeoZ, materials.timber, NT.props.M4(wx(x - w / 2), hy, wz(y), 0, 1));
          builder.add(railGeoZ, materials.timber, NT.props.M4(wx(x + w / 2), hy, wz(y), 0, 1));
        }
        for (let i = 0; i <= w / 3; i++) {
          const px = x - w / 2 + i * 3;
          builder.add(post, materials.timber, NT.props.M4(wx(px), 0.75, wz(y - d / 2), 0, 1));
          builder.add(post, materials.timber, NT.props.M4(wx(px), 0.75, wz(y + d / 2), 0, 1));
        }
        for (let i = 0; i <= d / 3; i++) {
          const py = y - d / 2 + i * 3;
          builder.add(post, materials.timber, NT.props.M4(wx(x - w / 2), 0.75, wz(py), 0, 1));
          builder.add(post, materials.timber, NT.props.M4(wx(x + w / 2), 0.75, wz(py), 0, 1));
        }
        occupy(x, y, w, d);
        return ctx;
      },
      ring(x, y, r, fenceOnly) {
        if (!fenceOnly) {
          const pad = new THREE.CylinderGeometry(r * SX, r * SX, 0.14, 26);
          builder.add(pad, materials.arenaSand, NT.props.M4(wx(x), 0.07, wz(y), 0, 1));
        }
        const post = new THREE.CylinderGeometry(0.07, 0.08, 1.3, 6);
        const n = Math.max(12, Math.round((2 * Math.PI * r) / 3));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          builder.add(post, materials.timber, NT.props.M4(wx(x + Math.cos(a) * r), 0.65, wz(y + Math.sin(a) * r), 0, 1));
        }
        occupy(x, y, r * 2, r * 2);
        return ctx;
      },
      paddock(x, y, w, d) { return ctx.rail(x, y, w, d); },
      stage(x, y, w, d, rot) {
        const deck = new THREE.BoxGeometry(w * SX, 0.9, d * SZ);
        builder.add(deck, materials.deck, NT.props.M4(wx(x), 0.45, wz(y), 0, 1));
        const back = new THREE.BoxGeometry(w * SX, 4, 0.3);
        builder.add(back, materials.canvasWarm, NT.props.M4(wx(x), 2.9, wz(y) + (rot === Math.PI / 2 ? 0 : -d / 2 * SZ), 0, 1));
        const truss = new THREE.BoxGeometry(w * SX, 0.25, 0.25);
        builder.add(truss, materials.metal, NT.props.M4(wx(x), 5, wz(y), 0, 1));
        for (let i = 0; i < 5; i++) {
          const lamp = new THREE.SphereGeometry(0.22, 8, 6);
          builder.add(lamp, materials.lamp, NT.props.M4(wx(x - w / 2 + (i + 0.5) * (w / 5)), 4.8, wz(y), 0, 1));
        }
        occupy(x, y, w + 4, d + 4);
        return ctx;
      },
      majlisRing(list) {
        for (const p of list) {
          builder.addParts(NT.props.majlis(materials, 4.4), at(p[0], p[1], rnd() * 3));
          occupy(p[0], p[1], 12, 12);
          fires.push([p[0], p[1]]);
        }
        return ctx;
      },
      stringLights(points, height) {
        const bulb = new THREE.SphereGeometry(0.14, 6, 5), list = [];
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          for (let k = 0; k <= 12; k++) {
            const t = k / 12, sag = Math.sin(t * Math.PI) * 0.9;
            list.push(NT.props.M4(wx(a[0] + (b[0] - a[0]) * t), height - sag, wz(a[1] + (b[1] - a[1]) * t), 0, 1));
          }
        }
        builder.instances([{ geometry: bulb, material: materials.lamp, shadow: false }], list);
        return ctx;
      },
      trees(zone, count, density) {
        const acacias = [], shrubs = [];
        let guard = 0;
        while (acacias.length < count && guard++ < count * 40) {
          const x = zone.x + rnd() * zone.w, y = zone.y + rnd() * zone.d;
          if (!free(x, y)) continue;
          acacias.push(at(x, y, rnd() * 6.28, 0.75 + rnd() * 0.5));
          occupy(x, y, 6, 6);
        }
        guard = 0;
        const shrubCount = Math.round(count * 2.4 * (density || 1));
        while (shrubs.length < shrubCount && guard++ < shrubCount * 30) {
          const x = zone.x + rnd() * zone.w, y = zone.y + rnd() * zone.d;
          if (!free(x, y)) continue;
          shrubs.push(at(x, y, rnd() * 6.28, 0.7 + rnd() * 0.8));
        }
        if (acacias.length) builder.instances(NT.props.acacia(materials, 1), acacias, { pick: zone.id });
        if (shrubs.length) builder.instances(NT.props.shrub(materials, 1), shrubs, { pick: zone.id });
        return ctx;
      },
      palms(list) {
        builder.instances(NT.props.palm(materials, 6.4), list.map((p) => at(p[0], p[1], rnd() * 6.28, 0.82 + rnd() * 0.4)));
        for (const p of list) occupy(p[0], p[1], 4, 4);
        return ctx;
      },
      rocks(x, y, radius, count) {
        const list = [];
        for (let i = 0; i < count; i++) {
          const a = rnd() * 6.28, r = Math.sqrt(rnd()) * radius;
          const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
          if (!free(px, py)) continue;
          list.push(at(px, py, rnd() * 6.28, 0.5 + rnd() * 1.5));
        }
        if (list.length) builder.instances(NT.props.rock(materials, 1, 7), list);
        return ctx;
      }
    };

    function ribbonGeometry(points, width, y) {
      if (points.length < 2) return null;
      const pos = [], uv = [], idx = [];
      let dist = 0;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
        let dx = wx(next[0]) - wx(prev[0]), dz = wz(next[1]) - wz(prev[1]);
        const len = Math.hypot(dx, dz) || 1;
        dx /= len; dz /= len;
        const nx = -dz * width / 2, nz = dx * width / 2;
        const px = wx(p[0]), pz = wz(p[1]);
        if (i > 0) dist += Math.hypot(px - wx(prev[0]), pz - wz(prev[1]));
        pos.push(px + nx, y, pz + nz, px - nx, y, pz - nz);
        uv.push(0, dist / Math.max(1, width * 2), 1, dist / Math.max(1, width * 2));
        if (i < points.length - 1) {
          const a = i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }

    /* ===== الأرض وصورة الموقع ===== */
    const groundGeo = new THREE.PlaneGeometry(site.width, site.depth, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);
    // تفاصيل سطح الرمل تُضاف كخريطة نتوءات فوق صورة الموقع، فتبقى الصورة كما هي
    const sandDetail = NT.textures.sand(512, 11);
    const sandNormal = new THREE.CanvasTexture(NT.textures.normalFrom(sandDetail, 1.4));
    sandNormal.wrapS = sandNormal.wrapT = THREE.RepeatWrapping;
    sandNormal.repeat.set(180, 180);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe6d8b8, roughness: 1, metalness: 0,
      normalMap: sandNormal, normalScale: new THREE.Vector2(0.55, 0.55)
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -0.02;
    ground.userData.ground = true;
    root.add(ground);

    const contextGeo = new THREE.PlaneGeometry(16000, 16000, 32, 32);
    contextGeo.rotateX(-Math.PI / 2);
    const contextMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a6, roughness: 1 });
    const contextGround = new THREE.Mesh(contextGeo, contextMat);
    contextGround.position.y = -0.55;
    contextGround.receiveShadow = false;
    root.add(contextGround);

    // أسناد الحدود: خط متقطع مرتفع قليلًا + أوتاد أركان
    const boundary = new THREE.Group();
    {
      const hw = site.width / 2, hd = site.depth / 2;
      const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]];
      const pts = [];
      for (let i = 0; i < 4; i++) {
        const a = corners[i], b = corners[(i + 1) % 4];
        const segs = 60;
        for (let s = 0; s < segs; s += 2) {
          const t0 = s / segs, t1 = (s + 1) / segs;
          pts.push(a[0] + (b[0] - a[0]) * t0, 0.6, a[1] + (b[1] - a[1]) * t0);
          pts.push(a[0] + (b[0] - a[0]) * t1, 0.6, a[1] + (b[1] - a[1]) * t1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      boundary.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xf2e06a, transparent: true, opacity: 0.85 })));
      const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0xd9cf9a, roughness: 0.7, emissive: 0x2a2a12 });
      for (const cpt of corners) {
        const m = new THREE.Mesh(postGeo, postMat);
        m.position.set(cpt[0], 1.5, cpt[1]);
        m.castShadow = true;
        boundary.add(m);
      }
      root.add(boundary);
    }

    /* ===== الطرق: كتف رملي تحت الأسفلت، وتشجير على المحور الرئيسي ===== */
    for (const road of NT.data.roads) {
      ctx.ribbon(road.points, road.width + 7, materials.track, 0.04);
      if (road.type === 'guest') ctx.ribbon(road.points, road.width, materials.asphalt, 0.06);
    }
    {
      const avenue = [];
      const poles = [];
      for (const road of NT.data.roads.filter((r) => r.id === 'entry' || r.id === 'spine')) {
        const pts = road.points;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const steps = Math.max(1, Math.round(len / 26));
          for (let k = 0; k < steps; k++) {
            const t = k / steps;
            const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
            const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
            const off = road.width / 2 + 6;
            avenue.push(at(x + nx * off, y + ny * off, rnd() * 6.28, 0.85 + rnd() * 0.25));
            avenue.push(at(x - nx * off, y - ny * off, rnd() * 6.28, 0.85 + rnd() * 0.25));
            if (k % 3 === 0) poles.push(at(x + nx * (off + 3), y + ny * (off + 3), 0, 1));
            occupy(x, y, 26, 26);
          }
        }
      }
      builder.instances(NT.props.palm(materials, 6.2), avenue);
      builder.instances(NT.props.lightPole(materials, 6), poles);
    }

    /* ===== محتوى المناطق ===== */
    const zoneIndex = [];
    for (const zone of NT.data.zones) {
      ctx.zone = zone;
      occupancyClearMargin(zone);
      NT.content.build(zone.kind, ctx);
      zoneIndex.push(zone);
    }
    function occupancyClearMargin() { /* المناطق تُبنى بالترتيب؛ التراكب يُمنع بشبكة الإشغال */ }

    /* ===== الأرض المفتوحة: نبات وصخور بكثافة متغيرة ===== */
    {
      const noise = NT.textures.valueNoise(991, 32);
      const acacias = [], shrubs = [], rocksList = [];
      const budget = quality === 'low' ? { a: 180, s: 700, r: 260 } : { a: 620, s: 2200, r: 760 };
      let guard = 0;
      while ((acacias.length < budget.a || shrubs.length < budget.s || rocksList.length < budget.r) && guard++ < 60000) {
        const x = rnd() * 1500, y = rnd() * 1500;
        if (!free(x, y)) continue;
        const d = NT.textures.fbm(noise, x / 1500 * 7, y / 1500 * 7, 4, 0.55);
        const pick = rnd();
        if (pick < 0.16 && d > 0.52 && acacias.length < budget.a) acacias.push(at(x, y, rnd() * 6.28, 0.7 + rnd() * 0.7));
        else if (pick < 0.78 && shrubs.length < budget.s) shrubs.push(at(x, y, rnd() * 6.28, 0.55 + rnd() * 0.9));
        else if (rocksList.length < budget.r) rocksList.push(at(x, y, rnd() * 6.28, 0.35 + rnd() * 1.3));
      }
      if (acacias.length) builder.instances(NT.props.acacia(materials, 1), acacias);
      if (shrubs.length) builder.instances(NT.props.shrub(materials, 1), shrubs);
      if (rocksList.length) builder.instances(NT.props.rock(materials, 1, 13), rocksList);
    }

    builder.flush();

    /* ===== سماء وشمس وظلال ===== */
    const sky = new THREE.Sky();
    sky.scale.setScalar(60000);
    scene.add(sky);
    const sunDir = new THREE.Vector3();

    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    const mapSize = quality === 'low' ? 1024 : quality === 'medium' ? 2048 : 4096;
    sun.shadow.blurSamples = quality === 'low' ? 4 : 12;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 6000;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.6;
    scene.add(sun);
    scene.add(sun.target);

    const hemi = new THREE.HemisphereLight(0xbcd4ea, 0xc9b68f, 0.5);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

    // إضاءة ليلية: نيران المجالس وبؤر دافئة عند تجمعات الخدمة
    const fireLights = fires.slice(0, 8).map((f) => {
      const l = new THREE.PointLight(0xff8a3a, 0, 95, 2);
      l.position.set(wx(f[0]), 2.4, wz(f[1]));
      scene.add(l);
      return l;
    });
    const clusterLights = [[760, 170], [300, 800], [215, 900], [1200, 305], [330, 1140], [1230, 1290], [950, 900], [250, 200]].map((c) => {
      const l = new THREE.PointLight(0xffc07a, 0, 150, 2);
      l.position.set(wx(c[0]), 7, wz(c[1]));
      scene.add(l);
      return l;
    });

    let pmrem = null, envCache = {};
    function environmentFor(renderer, key) {
      if (envCache[key]) return envCache[key];
      if (!pmrem) { pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader(); }
      const holder = new THREE.Scene();
      const copy = sky.clone();
      copy.material = sky.material.clone();
      copy.material.uniforms = THREE.UniformsUtils.clone(sky.material.uniforms);
      for (const name of ['sunPosition', 'turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) {
        if (copy.material.uniforms[name] && sky.material.uniforms[name]) {
          const v = sky.material.uniforms[name].value;
          copy.material.uniforms[name].value = v && v.clone ? v.clone() : v;
        }
      }
      holder.add(copy);
      const target = pmrem.fromScene(holder, 0, 0.1, 2000000);
      envCache[key] = target.texture;
      return envCache[key];
    }

    let current = 'day';
    function setTime(key, renderer) {
      const t = TIMES[key] || TIMES.day;
      current = key;
      const phi = THREE.MathUtils.degToRad(90 - t.elevation);
      const theta = Math.PI - THREE.MathUtils.degToRad(t.azimuth);
      sunDir.setFromSphericalCoords(1, phi, theta);
      const u = sky.material.uniforms;
      u.sunPosition.value.copy(sunDir);
      u.turbidity.value = t.turbidity;
      u.rayleigh.value = t.rayleigh;
      u.mieCoefficient.value = t.mie;
      u.mieDirectionalG.value = t.mieG;
      sun.position.copy(sunDir).multiplyScalar(2600);
      sun.color.setHex(t.sun);
      sun.intensity = t.sunI;
      hemi.color.setHex(t.hemiSky);
      hemi.groundColor.setHex(t.hemiGround);
      hemi.intensity = t.hemiI;
      ambient.intensity = t.ambient;
      scene.fog = new THREE.Fog(t.fog, t.fogNear, t.fogFar);
      for (const key2 of materials.emissiveKeys) materials[key2].emissiveIntensity = t.emissive * (key2 === 'fire' ? 1.6 : 1);
      materials.windowGlow.emissiveIntensity = t.emissive * 0.9;
      for (const l of fireLights) l.intensity = t.emissive * 420;
      for (const l of clusterLights) l.intensity = t.emissive * 320;
      if (renderer) {
        renderer.toneMappingExposure = t.exposure;
        try {
          scene.environment = environmentFor(renderer, key);
          scene.environmentIntensity = t.envI === undefined ? 0.5 : t.envI;
        } catch (e) { /* البيئة اختيارية */ }
      }
      return t;
    }

    function updateShadow(targetX, targetZ, distance) {
      const radius = Math.max(60, Math.min(1000, distance * 0.46));
      const cam = sun.shadow.camera;
      cam.left = -radius; cam.right = radius; cam.top = radius; cam.bottom = -radius;
      cam.far = radius * 6 + 1200;
      cam.updateProjectionMatrix();
      sun.target.position.set(targetX, 0, targetZ);
      sun.target.updateMatrixWorld();
      sun.position.copy(sunDir).multiplyScalar(radius * 3 + 800).add(sun.target.position);
    }

    /* ===== صورة الموقع على الأرض ===== */
    function applySurface(surface, target) {
      const THREE2 = window.THREE;
      const texture = new THREE2.CanvasTexture(surface.canvas);
      texture.colorSpace = THREE2.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.wrapS = texture.wrapT = THREE2.ClampToEdgeWrapping;
      const geo = target.geometry, pos = geo.attributes.position, uv = geo.attributes.uv;
      const isSite = target === ground;
      for (let i = 0; i < pos.count; i++) {
        const localX = pos.getX(i) / SX + 750, localY = 750 - pos.getZ(i) / SZ;
        const g = NT.geo.point(localX, localY);
        const c = surface.uv(g[0], g[1]);
        uv.setXY(i, c[0], c[1]);
      }
      uv.needsUpdate = true;
      target.material.map = texture;
      target.material.color.setHex(isSite ? (surface.state.drawnFallback ? 0xc7b791 : 0xe9e3d6) : (surface.state.drawnFallback ? 0xc2b28c : 0xe4ded0));
      target.material.needsUpdate = true;
      return texture;
    }

    const api = {
      root, ground, contextGround, boundary, materials, sky, sun, hemi, ambient, fireLights, clusterLights,
      zones: zoneIndex, meshes: builder.meshes, times: TIMES,
      get time() { return current; },
      setTime, updateShadow, applySurface, wx, wz, SX, SZ,
      // نقاط تثبيت الأسماء فوق كل منطقة
      anchors: NT.data.zones.map((z) => ({
        id: z.id, name: z.name, en: z.en, cat: z.cat,
        position: new THREE.Vector3(wx(z.x + z.w / 2), 16, wz(z.y + z.d / 2))
      })),
      localAt(point) { return [point.x / SX + 750, 750 - point.z / SZ]; },
      zoneAt(x, y) {
        for (const z of NT.data.zones) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.d) return z.id;
        return x >= 0 && x <= 1500 && y >= 0 && y <= 1500 ? 'OPEN' : null;
      },
      dispose() {
        root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        scene.remove(root); scene.remove(sky); scene.remove(sun); scene.remove(sun.target);
        scene.remove(hemi); scene.remove(ambient);
        for (const l of fireLights) scene.remove(l);
        for (const l of clusterLights) scene.remove(l);
        if (pmrem) pmrem.dispose();
      }
    };
    return api;
  }

  NT.world = { build, TIMES };
})(window.NT = window.NT || {});
