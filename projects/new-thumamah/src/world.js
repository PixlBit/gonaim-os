/* بناء المشهد: تضاريس الموقع بصورته الجوية، سماء وشمس فيزيائية، ظلال، ومحتوى المناطق.
   التضاريس شكل تمثيلي مبني على وصف الملف المعتمد، وليست نموذج ارتفاعات مساحيًا. */
(function (NT) {
  'use strict';

  const TIMES = {
    day: {
      label: 'نهار', elevation: 56, azimuth: 162, turbidity: 3.2, rayleigh: 1.05, mie: 0.005, mieG: 0.75,
      sun: 0xfff4e4, sunI: 3.1, hemiSky: 0xa8c8ea, hemiGround: 0xb09c74, hemiI: 0.17, ambient: 0.02, envI: 0.26,
      exposure: 0.42, bloom: 0.1, fog: 0xd6d2c4, fogNear: 3200, fogFar: 24000, emissive: 0, bloom: 0.1,
      cloud: 0xffffff, cloudOpacity: 0.72, bloomThreshold: 2.4
    },
    sunset: {
      label: 'غروب', elevation: 7.0, azimuth: 287, turbidity: 6.2, rayleigh: 2.5, mie: 0.010, mieG: 0.86,
      sun: 0xffb379, sunI: 4.3, hemiSky: 0xdaa87c, hemiGround: 0x75593f, hemiI: 0.30, ambient: 0.05, envI: 0.6,
      exposure: 0.48, fog: 0xddb890, fogNear: 2200, fogFar: 17000, emissive: 0.32, bloom: 0.3,
      cloud: 0xffc79a, cloudOpacity: 0.82, bloomThreshold: 1.5
    },
    night: {
      label: 'ليل', elevation: -11, azimuth: 300, turbidity: 1.8, rayleigh: 0.6, mie: 0.003, mieG: 0.8,
      sun: 0x9cb4dc, sunI: 0.62, hemiSky: 0x33455f, hemiGround: 0x2b2419, hemiI: 0.30, ambient: 0.10, envI: 0.6,
      exposure: 0.82, fog: 0x1a2331, fogNear: 1200, fogFar: 11000, emissive: 1, bloom: 0.62,
      cloud: 0x4a5c78, cloudOpacity: 0.45, bloomThreshold: 0.45
    }
  };

  function build(opts) {
    const THREE = window.THREE;
    const scene = opts.scene, quality = opts.quality || 'high', site = NT.data.site;
    const SX = site.width / 1500, SZ = site.depth / 1500;
    const root = new THREE.Group();
    scene.add(root);

    const rnd = NT.textures.makeRandom(20260913);
    const materials = NT.props.makeMaterials(null);
    const builder = new NT.props.Builder(root);
    const terrain = NT.terrain.create(NT.data.terrain);
    const fires = [];
    const occupancy = new Uint8Array(300 * 300);

    const wx = (x) => (x - 750) * SX;
    const wz = (y) => -(y - 750) * SZ;
    const hAt = (x, y) => terrain.heightAt(x, y);
    const at = (x, y, rot, scale) => NT.props.M4(wx(x), hAt(x, y), wz(y), rot || 0, scale === undefined ? 1 : scale);
    const atY = (x, y, lift, rot, scale) => NT.props.M4(wx(x), hAt(x, y) + lift, wz(y), rot || 0, scale === undefined ? 1 : scale);

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

    /* شريط يتبع الأرض: طريق أو ممشى */
    function ribbonGeometry(points, width, lift) {
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
        const lx = p[0] - (nz / SZ) * 0, ly = p[1];
        const hl = hAt(p[0] + (-dz * width / 2) / SX, ly) + lift;
        const hr = hAt(p[0] + (dz * width / 2) / SX, ly) + lift;
        const h = Math.max(hl, hr) + 0.02;
        pos.push(px + nx, h, pz + nz, px - nx, h, pz - nz);
        uv.push(0, dist / Math.max(1, width * 2), 1, dist / Math.max(1, width * 2));
        if (i < points.length - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        void lx;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }

    /* أدوات البناء المتاحة لمولّدات المحتوى */
    const ctx = {
      M: materials, rnd, wx, wz, at, atY, height: hAt, zone: null,
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
          occupy(p.x / SX + 750, 750 - p.z / SZ, 12, 12);
        }
        return ctx;
      },
      grid: (list) => list.map((p) => at(p[0], p[1], 0, 1)),
      /* مصفوفة تتبع ميل الأرض — للسيارات على الكثبان */
      slopeMatrix(x, y, yaw, scale) {
        const e = 3;
        const hE = hAt(x + e, y) - hAt(x - e, y);
        const hN = hAt(x, y + e) - hAt(x, y - e);
        const up = new THREE.Vector3(-hE / (2 * e), 1, hN / (2 * e)).normalize();
        const fwd = new THREE.Vector3(Math.sin(yaw || 0), 0, Math.cos(yaw || 0));
        const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
        const f2 = new THREE.Vector3().crossVectors(right, up).normalize();
        const m = new THREE.Matrix4().makeBasis(right, up, f2);
        m.setPosition(wx(x), hAt(x, y), wz(y));
        const s2 = scale === undefined ? 1 : scale;
        m.scale(new THREE.Vector3(s2, s2, s2));
        return m;
      },
      slope(parts, x, y, yaw, scale) {
        builder.addParts(parts, ctx.slopeMatrix(x, y, yaw, scale));
        occupy(x, y, 8, 8);
        return ctx;
      },
      /* مساحة مسوّاة: تتبع منسوب الأرض بعد التسوية */
      pad(x, y, w, d, material, h, rot) {
        const t = h || 0.1;
        const g = new THREE.BoxGeometry(w * SX, t, d * SZ);
        builder.add(g, material, NT.props.M4(wx(x), hAt(x, y) + t / 2 - 0.04, wz(y), rot || 0, 1));
        occupy(x, y, w, d);
        return ctx;
      },
      disc(x, y, r, material, h) {
        const t = h || 0.1;
        const g = new THREE.CylinderGeometry(r * SX, r * SX, t, 30);
        builder.add(g, material, NT.props.M4(wx(x), hAt(x, y) + t / 2 - 0.04, wz(y), 0, 1));
        occupy(x, y, r * 1.9, r * 1.9);
        return ctx;
      },
      stripes(list, material) {
        const g = new THREE.BoxGeometry(0.14, 0.06, 4.6 * SZ);
        for (const p of list) builder.add(g, material, NT.props.M4(wx(p[0]) - 1.3, hAt(p[0], p[1]) + 0.07, wz(p[1] + 2.3), 0, 1));
        return ctx;
      },
      /* دهانات الطريق: خط وسط متقطع وخطان جانبيان */
      markings(points, width) {
        const dash = [];
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          const len = Math.hypot((b[0] - a[0]) * SX, (b[1] - a[1]) * SZ);
          const steps = Math.max(1, Math.round(len / 9));
          for (let k = 0; k < steps; k++) {
            const t0 = (k + 0.15) / steps, t1 = (k + 0.65) / steps;
            dash.push([[a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0],
                       [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]]);
          }
        }
        for (const seg of dash) {
          const g = ribbonGeometry(seg, 0.18, 0.1);
          if (g) builder.add(g, materials.paint, null);
        }
        for (const side of [-1, 1]) {
          const edge = points.map((p, i) => {
            const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
            const dx = next[0] - prev[0], dy = next[1] - prev[1];
            const len = Math.hypot(dx, dy) || 1;
            return [p[0] - (dy / len) * side * (width / 2 - 0.5), p[1] + (dx / len) * side * (width / 2 - 0.5)];
          });
          const g = ribbonGeometry(edge, 0.16, 0.1);
          if (g) builder.add(g, materials.paint, null);
        }
        return ctx;
      },
      /* أشخاص: توزيع بأحجام وملابس متنوعة */
      people(list, options) {
        const opt = options || {};
        const groups = { thobe: [], abaya: [], staff: [], child: [] };
        for (const spot of list) {
          const kind = spot[2] || (rnd() < 0.42 ? 'thobe' : rnd() < 0.62 ? 'abaya' : rnd() < 0.82 ? 'child' : 'staff');
          const jitter = opt.spread || 0;
          const x = spot[0] + (rnd() - 0.5) * jitter, y = spot[1] + (rnd() - 0.5) * jitter;
          groups[kind] = groups[kind] || [];
          groups[kind].push(at(x, y, rnd() * 6.28, 0.96 + rnd() * 0.1));
        }
        for (const kind of Object.keys(groups)) {
          if (!groups[kind].length) continue;
          const cloth = kind === 'thobe' ? (rnd() < 0.5 ? materials.thobe : materials.thobeWarm)
            : kind === 'child' ? (rnd() < 0.5 ? materials.shirtA : materials.shirtB) : null;
          builder.instances(NT.assets.person(materials, kind, cloth), groups[kind], { pick: ctx.zone ? ctx.zone.id : null });
        }
        return ctx;
      },
      /* مركبات: نوع محدد أو خليط واقعي */
      vehicles(list, kind) {
        const palette = [materials.carBody, materials.plaster, materials.metalLight, materials.plasterWarm, materials.stone];
        const buckets = new Map();
        for (const v of list) {
          const type = v[3] || kind || (rnd() < 0.42 ? 'sedan' : rnd() < 0.78 ? 'suv' : 'pickup');
          const tint = palette[Math.floor(rnd() * palette.length)];
          const key = type + '|' + palette.indexOf(tint);
          if (!buckets.has(key)) buckets.set(key, { type, tint, list: [] });
          buckets.get(key).list.push(at(v[0], v[1], v[2] || 0, 1));
        }
        for (const bucket of buckets.values()) {
          const parts = NT.assets[bucket.type] ? NT.assets[bucket.type](materials, bucket.tint) : NT.assets.sedan(materials, bucket.tint);
          builder.instances(parts, bucket.list, { pick: ctx.zone ? ctx.zone.id : null });
        }
        return ctx;
      },
      lights(list, height, arms) {
        builder.instances(NT.assets.streetLight(materials, height || 9, arms || 1), list.map((p) => at(p[0], p[1], p[2] || 0, 1)));
        for (const p of list) occupy(p[0], p[1], 4, 4);
        return ctx;
      },
      floods(list, height) {
        builder.instances(NT.assets.floodMast(materials, height || 16), list.map((p) => at(p[0], p[1], p[2] || 0, 1)));
        return ctx;
      },
      bollards(points, spacing) {
        const list = [], step = spacing || 12;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const n = Math.max(1, Math.round(len / step));
          for (let k = 0; k < n; k++) {
            const t = k / n;
            list.push(at(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0, 1));
          }
        }
        builder.instances(NT.assets.bollard(materials), list);
        return ctx;
      },
      ribbon(points, width, material, lift) {
        const geo = ribbonGeometry(points, width, lift === undefined ? 0.07 : lift);
        if (geo) builder.add(geo, material, null);
        for (const p of points) occupy(p[0], p[1], width + 3, width + 3);
        return ctx;
      },
      wall(points, height, thickness, material) {
        const h = height || 1.1, t = thickness || 0.4;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          const len = Math.hypot((b[0] - a[0]) * SX, (b[1] - a[1]) * SZ);
          const steps = Math.max(1, Math.round(len / 6));
          for (let k = 0; k < steps; k++) {
            const t0 = k / steps, t1 = (k + 1) / steps;
            const x0 = a[0] + (b[0] - a[0]) * t0, y0 = a[1] + (b[1] - a[1]) * t0;
            const x1 = a[0] + (b[0] - a[0]) * t1, y1 = a[1] + (b[1] - a[1]) * t1;
            const dx = wx(x1) - wx(x0), dz = wz(y1) - wz(y0);
            const seg = Math.hypot(dx, dz) || 1;
            const g = new THREE.BoxGeometry(seg + 0.15, h, t);
            const yaw = Math.atan2(dx, dz) + Math.PI / 2;
            const mid = [(x0 + x1) / 2, (y0 + y1) / 2];
            builder.add(g, material || materials.stone, NT.props.M4(wx(mid[0]), hAt(mid[0], mid[1]) + h / 2 - 0.1, wz(mid[1]), yaw, 1));
            occupy(mid[0], mid[1], 4, 4);
          }
        }
        return ctx;
      },
      steps(x, y, w, count, rise, rot) {
        const n = count || 6, r = rise || 0.18;
        for (let i = 0; i < n; i++) {
          const g = new THREE.BoxGeometry(w * SX, r, 0.42 * SZ);
          builder.add(g, materials.stone, NT.props.M4(wx(x), hAt(x, y) + r * (n - i) - 0.1, wz(y + i * 0.45), rot || 0, 1));
        }
        occupy(x, y, w, n * 0.5);
        return ctx;
      },
      deck(x, y, w, d) {
        const g = new THREE.BoxGeometry(w * SX, 0.4, d * SZ);
        builder.add(g, materials.deck, NT.props.M4(wx(x), hAt(x, y) + 0.2, wz(y), 0, 1));
        occupy(x, y, w, d);
        return ctx;
      },
      rail(x, y, w, d) {
        const post = new THREE.CylinderGeometry(0.08, 0.09, 1.5, 6);
        const railX = new THREE.BoxGeometry(w * SX, 0.12, 0.1), railZ = new THREE.BoxGeometry(0.1, 0.12, d * SZ);
        for (const hy of [0.75, 1.2]) {
          builder.add(railX, materials.timber, atY(x, y - d / 2, hy));
          builder.add(railX, materials.timber, atY(x, y + d / 2, hy));
          builder.add(railZ, materials.timber, atY(x - w / 2, y, hy));
          builder.add(railZ, materials.timber, atY(x + w / 2, y, hy));
        }
        for (let i = 0; i <= w / 3; i++) {
          const px = x - w / 2 + i * 3;
          builder.add(post, materials.timber, atY(px, y - d / 2, 0.75));
          builder.add(post, materials.timber, atY(px, y + d / 2, 0.75));
        }
        for (let i = 0; i <= d / 3; i++) {
          const py = y - d / 2 + i * 3;
          builder.add(post, materials.timber, atY(x - w / 2, py, 0.75));
          builder.add(post, materials.timber, atY(x + w / 2, py, 0.75));
        }
        occupy(x, y, w, d);
        return ctx;
      },
      ring(x, y, r, fenceOnly) {
        if (!fenceOnly) {
          const pad = new THREE.CylinderGeometry(r * SX, r * SX, 0.14, 26);
          builder.add(pad, materials.arenaSand, NT.props.M4(wx(x), hAt(x, y) + 0.07, wz(y), 0, 1));
        }
        const post = new THREE.CylinderGeometry(0.07, 0.08, 1.3, 6);
        const n = Math.max(12, Math.round((2 * Math.PI * r) / 3));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          builder.add(post, materials.timber, atY(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.65));
        }
        occupy(x, y, r * 2, r * 2);
        return ctx;
      },
      paddock(x, y, w, d) { return ctx.rail(x, y, w, d); },
      majlisRing(list) {
        for (const p of list) {
          builder.addParts(NT.props.majlis(materials, 4.4), at(p[0], p[1], rnd() * 3));
          occupy(p[0], p[1], 12, 12);
          fires.push([p[0], p[1]]);
        }
        return ctx;
      },
      fire(x, y) {
        builder.addParts(NT.props.firePit(materials), at(x, y, rnd() * 3));
        fires.push([x, y]);
        occupy(x, y, 6, 6);
        return ctx;
      },
      stringLights(points, height) {
        const bulb = new THREE.SphereGeometry(0.14, 6, 5), list = [];
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i], b = points[i + 1];
          for (let k = 0; k <= 12; k++) {
            const t = k / 12, sag = Math.sin(t * Math.PI) * 0.9;
            const px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t;
            list.push(atY(px, py, height - sag));
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
          if (!free(x, y) || terrain.slopeAt(x, y) > 0.45) continue;
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
      },
      /* صفوف مواقف: 2.5 × 5 م لكل سيارة مع ممر 6 م */
      parking(x, y, cols, rowPairs, rot, carRatio) {
        const stalls = [], cars = [];
        const stallW = 2.6, moduleD = 16;
        const totalW = cols * stallW, totalD = rowPairs * moduleD;
        for (let m = 0; m < rowPairs; m++) {
          for (let side = 0; side < 2; side++) {
            for (let i = 0; i < cols; i++) {
              const px = x - totalW / 2 + i * stallW + stallW / 2;
              const py = y - totalD / 2 + m * moduleD + (side ? 11 : 1) + 2.5;
              stalls.push([px, py]);
              if (rnd() < (carRatio === undefined ? 0.45 : carRatio)) cars.push(at(px, py, side ? Math.PI : 0, 1));
            }
          }
        }
        ctx.pad(x, y, totalW + 6, totalD + 6, materials.track, 0.09, rot);
        ctx.stripes(stalls, materials.track);
        if (cars.length) builder.instances(NT.props.car(materials), cars, { pick: ctx.zone ? ctx.zone.id : null });
        return { stalls: stalls.length, cars: cars.length };
      }
    };

    /* ===== التضاريس وصورة الموقع ===== */
    const segs = quality === 'low' ? 128 : 192;
    const groundGeo = new THREE.PlaneGeometry(site.width, site.depth, segs, segs);
    groundGeo.rotateX(-Math.PI / 2);
    {
      const pos = groundGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i) / SX + 750, ly = 750 - pos.getZ(i) / SZ;
        pos.setY(i, hAt(Math.min(1500, Math.max(0, lx)), Math.min(1500, Math.max(0, ly))));
      }
      groundGeo.computeVertexNormals();
      // تلوين رأسي خفيف: صخر على المنحدرات، رمل على المستوي
      const colors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i) / SX + 750, ly = 750 - pos.getZ(i) / SZ;
        const slope = Math.min(1, terrain.slopeAt(Math.min(1500, Math.max(0, lx)), Math.min(1500, Math.max(0, ly))) * 1.5);
        const rock = Math.pow(slope, 1.3);
        colors[i * 3] = 1 - rock * 0.22;
        colors[i * 3 + 1] = 1 - rock * 0.19;
        colors[i * 3 + 2] = 1 - rock * 0.12;
      }
      groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    const sandDetail = NT.textures.sand(512, 11);
    const sandNormal = new THREE.CanvasTexture(NT.textures.normalFrom(sandDetail, 1.4));
    sandNormal.wrapS = sandNormal.wrapT = THREE.RepeatWrapping;
    sandNormal.repeat.set(180, 180);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe6d8b8, roughness: 1, metalness: 0, vertexColors: true,
      normalMap: sandNormal, normalScale: new THREE.Vector2(0.55, 0.55)
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.castShadow = true;
    ground.userData.ground = true;
    root.add(ground);

    // المحيط: يواصل شكل الأرض ثم يهدأ نحو الأفق
    const contextGeo = new THREE.PlaneGeometry(16000, 16000, 64, 64);
    contextGeo.rotateX(-Math.PI / 2);
    {
      const pos = contextGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i) / SX + 750, ly = 750 - pos.getZ(i) / SZ;
        const inside = lx > -200 && lx < 1700 && ly > -200 && ly < 1700;
        const outside = Math.max(0, Math.max(-lx, lx - 1500, -ly, ly - 1500));
        const fade = Math.exp(-outside / 900);
        pos.setY(i, inside || fade > 0.02 ? terrain.raw(Math.min(1500, Math.max(0, lx)), Math.min(1500, Math.max(0, ly))) * fade - 0.6 : -0.6);
      }
      contextGeo.computeVertexNormals();
    }
    const contextMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a6, roughness: 1 });
    const contextGround = new THREE.Mesh(contextGeo, contextMat);
    contextGround.receiveShadow = false;
    root.add(contextGround);

    // حدود الأرض: خط متقطع يتبع سطح الأرض
    const boundary = new THREE.Group();
    {
      const pts = [];
      const edge = (ax, ay, bx, by) => {
        const segsN = 120;
        for (let s = 0; s < segsN; s += 2) {
          const t0 = s / segsN, t1 = (s + 1) / segsN;
          const x0 = ax + (bx - ax) * t0, y0 = ay + (by - ay) * t0;
          const x1 = ax + (bx - ax) * t1, y1 = ay + (by - ay) * t1;
          pts.push(wx(x0), hAt(x0, y0) + 0.8, wz(y0), wx(x1), hAt(x1, y1) + 0.8, wz(y1));
        }
      };
      edge(0, 0, 1500, 0); edge(1500, 0, 1500, 1500); edge(1500, 1500, 0, 1500); edge(0, 1500, 0, 0);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      boundary.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xf2e06a, transparent: true, opacity: 0.85 })));
      const postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0xd9cf9a, roughness: 0.7, emissive: 0x2a2a12 });
      for (const c of [[0, 0], [1500, 0], [1500, 1500], [0, 1500]]) {
        const m = new THREE.Mesh(postGeo, postMat);
        m.position.set(wx(c[0]), hAt(c[0], c[1]) + 1.5, wz(c[1]));
        m.castShadow = true;
        boundary.add(m);
      }
      root.add(boundary);
    }

    /* ===== الطرق ===== */
    for (const road of NT.data.roads) {
      if (road.type === 'track') {
        ctx.ribbon(road.points, road.width, materials.track, 0.05);
      } else {
        ctx.ribbon(road.points, road.width + 7, materials.track, 0.04);
        ctx.ribbon(road.points, road.width, materials.asphalt, 0.06);
        ctx.markings(road.points, road.width);
      }
    }
    // تشجير وإنارة على مسار الدخول والمحور
    {
      const avenue = [], poles = [];
      for (const road of NT.data.roads.filter((r) => r.id === 'approach' || r.id === 'gate' || r.id === 'spine')) {
        const pts = road.points;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const steps = Math.max(1, Math.round(len / 28));
          for (let k = 0; k < steps; k++) {
            const t = k / steps;
            const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
            if (y < 0 || y > 1500) continue;
            const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
            const off = road.width / 2 + 6;
            avenue.push(at(x + nx * off, y + ny * off, rnd() * 6.28, 0.85 + rnd() * 0.25));
            avenue.push(at(x - nx * off, y - ny * off, rnd() * 6.28, 0.85 + rnd() * 0.25));
            if (k % 2 === 0) poles.push([x + nx * (off + 3.5), y + ny * (off + 3.5)]);
            occupy(x, y, 24, 24);
          }
        }
      }
      builder.instances(NT.props.palm(materials, 6.2), avenue);
      ctx.lights(poles, 9, 1);
    }

    /* ===== محتوى المناطق ===== */
    for (const zone of NT.data.zones) {
      ctx.zone = zone;
      NT.content.build(zone.kind, ctx);
    }

    /* ===== الأرض المفتوحة: نبات وصخور بكثافة متغيرة ===== */
    {
      const noise = NT.textures.valueNoise(991, 32);
      const acacias = [], shrubs = [], rocksList = [];
      const budget = quality === 'low' ? { a: 160, s: 620, r: 320 } : { a: 560, s: 2000, r: 900 };
      let guard = 0;
      while ((acacias.length < budget.a || shrubs.length < budget.s || rocksList.length < budget.r) && guard++ < 60000) {
        const x = rnd() * 1500, y = rnd() * 1500;
        if (!free(x, y)) continue;
        const slope = terrain.slopeAt(x, y);
        const d = NT.textures.fbm(noise, x / 1500 * 7, y / 1500 * 7, 4, 0.55);
        const pick = rnd();
        if (pick < 0.14 && d > 0.52 && slope < 0.32 && acacias.length < budget.a) acacias.push(at(x, y, rnd() * 6.28, 0.7 + rnd() * 0.7));
        else if (pick < 0.74 && slope < 0.5 && shrubs.length < budget.s) shrubs.push(at(x, y, rnd() * 6.28, 0.55 + rnd() * 0.9));
        else if (rocksList.length < budget.r) rocksList.push(at(x, y, rnd() * 6.28, 0.3 + rnd() * 0.9 + slope * 0.8));
      }
      if (acacias.length) builder.instances(NT.props.acacia(materials, 1), acacias);
      if (shrubs.length) builder.instances(NT.props.shrub(materials, 1), shrubs);
      if (rocksList.length) builder.instances(NT.props.rock(materials, 1, 13), rocksList);

      // نتوءات صخرية على سفوح الجبل تعطيه طابع الحافة الصخرية
      const outcrops = [];
      const target = quality === 'low' ? 220 : 620;
      let tries = 0;
      while (outcrops.length < target && tries++ < 40000) {
        const x = 120 + rnd() * 1360, y = 820 + rnd() * 660;
        // إبقاء مجال الرؤية من حافة القمة نظيفًا من النتوءات
        if (x > 470 && x < 1090 && y > 1040 && y < 1210) continue;
        const slope = terrain.slopeAt(x, y);
        if (slope < 0.32 || !free(x, y)) continue;
        outcrops.push(ctx.slopeMatrix(x, y, rnd() * 6.28, 0.45 + rnd() * 1.15 + slope * 0.7));
      }
      if (outcrops.length) builder.instances(NT.props.rock(materials, 1, 29), outcrops);
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
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.blurSamples = quality === 'low' ? 4 : 12;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 6000;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.7;
    scene.add(sun);
    scene.add(sun.target);

    const clouds = NT.assets.createClouds(scene, {
      count: quality === 'low' ? 26 : 52,
      spread: 11000, base: 950, height: 1500, size: 950
    });

    const hemi = new THREE.HemisphereLight(0xbcd4ea, 0xc9b68f, 0.5);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

    const fireLights = fires.slice(0, 8).map((f) => {
      const l = new THREE.PointLight(0xff8a3a, 0, 95, 2);
      l.position.set(wx(f[0]), hAt(f[0], f[1]) + 2.4, wz(f[1]));
      scene.add(l);
      return l;
    });
    const clusterLights = [[800, 62], [800, 170], [1130, 230], [900, 655], [1020, 648], [760, 1180], [860, 1150], [590, 1275]].map((c) => {
      const l = new THREE.PointLight(0xffc07a, 0, 150, 2);
      l.position.set(wx(c[0]), hAt(c[0], c[1]) + 7, wz(c[1]));
      scene.add(l);
      return l;
    });

    let pmrem = null;
    const envCache = {};
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
      clouds.setTint(t.cloud === undefined ? 0xffffff : t.cloud, t.cloudOpacity === undefined ? 0.75 : t.cloudOpacity);
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
      cam.far = radius * 6 + 1600;
      cam.updateProjectionMatrix();
      sun.target.position.set(targetX, 0, targetZ);
      sun.target.updateMatrixWorld();
      sun.position.copy(sunDir).multiplyScalar(radius * 3 + 900).add(sun.target.position);
    }

    function applySurface(surface, target) {
      const texture = new THREE.CanvasTexture(surface.canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
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
      target.material.color.setHex(isSite
        ? (surface.state.drawnFallback ? 0xc7b791 : 0xe9e3d6)
        : (surface.state.drawnFallback ? 0xc2b28c : 0xe4ded0));
      target.material.needsUpdate = true;
      return texture;
    }

    const api = {
      root, ground, contextGround, boundary, materials, sky, sun, hemi, ambient, fireLights, clusterLights, clouds,
      terrain, zones: NT.data.zones, meshes: builder.meshes, times: TIMES,
      get time() { return current; },
      setTime, updateShadow, applySurface, wx, wz, SX, SZ,
      heightAt: hAt,
      worldHeightAt(worldX, worldZ) {
        const lx = worldX / SX + 750, ly = 750 - worldZ / SZ;
        if (lx < -300 || lx > 1800 || ly < -300 || ly > 1800) return 0;
        return hAt(Math.min(1500, Math.max(0, lx)), Math.min(1500, Math.max(0, ly)));
      },
      anchors: NT.data.zones.map((z) => {
        const f = z.focus || [z.x + z.w / 2, z.y + z.d / 2];
        return {
          id: z.id, name: z.name, en: z.en, cat: z.cat,
          position: new THREE.Vector3(wx(f[0]), hAt(f[0], f[1]) + 22, wz(f[1]))
        };
      }),
      localAt(point) { return [point.x / SX + 750, 750 - point.z / SZ]; },
      /* تقاطع شعاع الكاميرا مع سطح الأرض — أسرع بكثير من فحص شبكة التضاريس */
      rayTerrain(origin, dir, maxDist) {
        const max = maxDist || 14000;
        const probe = new THREE.Vector3();
        let t = 0, step = 4;
        for (let i = 0; i < 900 && t < max; i++) {
          t += step;
          probe.copy(origin).addScaledVector(dir, t);
          const gap = probe.y - api.worldHeightAt(probe.x, probe.z);
          if (gap <= 0) {
            let lo = t - step, hi = t;
            for (let k = 0; k < 22; k++) {
              const mid = (lo + hi) / 2;
              probe.copy(origin).addScaledVector(dir, mid);
              if (probe.y - api.worldHeightAt(probe.x, probe.z) > 0) lo = mid; else hi = mid;
            }
            return probe.copy(origin).addScaledVector(dir, (lo + hi) / 2).clone();
          }
          step = Math.min(90, Math.max(2.5, gap * 0.55));
        }
        return null;
      },
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
        clouds.dispose();
        if (pmrem) pmrem.dispose();
      }
    };
    return api;
  }

  NT.world = { build, TIMES };
})(window.NT = window.NT || {});
