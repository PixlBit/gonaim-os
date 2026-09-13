/* أصول المشهد: أشخاص، مركبات بصياغة انسيابية، سحاب، وتجهيزات طرق وإنارة.
   كلها مولّدة برمجيًا بمقاسات حقيقية — لا ملفات نماذج خارجية ولا تحميل من الشبكة. */
(function (NT) {
  'use strict';
  const T = () => window.THREE;
  const M4 = (x, y, z, ry, s) => NT.props.M4(x, y, z, ry, s);

  /* مقطع جانبي يُبثق بحواف مشطوفة — يعطي هيكل مركبة انسيابيًا بدل صندوق */
  function extrude(profile, width, bevel) {
    const THREE = T();
    const shape = new THREE.Shape();
    profile.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: width, bevelEnabled: true, bevelThickness: bevel || 0.09,
      bevelSize: bevel || 0.09, bevelSegments: 2, steps: 1, curveSegments: 4
    });
    g.rotateY(Math.PI / 2);
    g.translate(0, 0, -width / 2);
    return g;
  }

  function wheels(M, positions, radius) {
    const THREE = T(), parts = [], r = radius || 0.34;
    const tyre = new THREE.CylinderGeometry(r, r, r * 0.75, 12);
    tyre.rotateZ(Math.PI / 2);
    const rim = new THREE.CylinderGeometry(r * 0.55, r * 0.55, r * 0.78, 10);
    rim.rotateZ(Math.PI / 2);
    for (const p of positions) {
      parts.push({ geometry: tyre.clone().applyMatrix4(M4(p[0], r, p[1])), material: M.tyre });
      parts.push({ geometry: rim.clone().applyMatrix4(M4(p[0], r, p[1])), material: M.metalLight });
    }
    return parts;
  }

  /* ===== مركبات ===== */
  function sedan(M, bodyMat) {
    const THREE = T();
    const profile = [
      [-2.25, 0.34], [-2.3, 0.62], [-1.75, 0.7], [-1.15, 1.06], [0.15, 1.16],
      [0.95, 1.02], [1.95, 0.66], [2.3, 0.56], [2.3, 0.34]
    ];
    const parts = [{ geometry: extrude(profile, 1.78, 0.1), material: bodyMat || M.carBody }];
    const glass = extrude([[-1.05, 0.76], [-0.6, 1.06], [0.55, 1.04], [1.25, 0.74]], 1.66, 0.04);
    parts.push({ geometry: glass, material: M.carGlass });
    const lamp = new THREE.BoxGeometry(0.12, 0.18, 0.5);
    parts.push({ geometry: lamp.clone().applyMatrix4(M4(-2.28, 0.62, -0.58)), material: M.lamp });
    parts.push({ geometry: lamp.clone().applyMatrix4(M4(-2.28, 0.62, 0.58)), material: M.lamp });
    parts.push(...wheels(M, [[-1.45, -0.85], [-1.45, 0.85], [1.45, -0.85], [1.45, 0.85]], 0.33));
    return parts;
  }

  function suv(M, bodyMat) {
    const THREE = T();
    const profile = [
      [-2.5, 0.42], [-2.55, 0.8], [-1.9, 0.92], [-1.35, 1.5], [1.1, 1.55],
      [1.95, 1.38], [2.45, 0.95], [2.5, 0.6], [2.5, 0.42]
    ];
    const parts = [{ geometry: extrude(profile, 1.95, 0.11), material: bodyMat || M.carBody }];
    const glass = extrude([[-1.2, 1.0], [-0.95, 1.46], [1.0, 1.46], [1.55, 1.0]], 1.84, 0.04);
    parts.push({ geometry: glass, material: M.carGlass });
    const rack = new THREE.BoxGeometry(2.2, 0.1, 1.5);
    parts.push({ geometry: rack.clone().applyMatrix4(M4(0.1, 1.62, 0)), material: M.metal });
    const bar = new THREE.BoxGeometry(0.16, 0.4, 2.0);
    parts.push({ geometry: bar.clone().applyMatrix4(M4(-2.56, 0.72, 0)), material: M.metalLight });
    parts.push(...wheels(M, [[-1.6, -0.95], [-1.6, 0.95], [1.6, -0.95], [1.6, 0.95]], 0.42));
    return parts;
  }

  function pickup(M, bodyMat) {
    const THREE = T();
    const profile = [
      [-2.7, 0.45], [-2.75, 0.85], [-2.0, 0.95], [-1.5, 1.55], [0.2, 1.58],
      [0.45, 0.98], [2.6, 0.98], [2.65, 0.5], [2.65, 0.45]
    ];
    const parts = [{ geometry: extrude(profile, 1.92, 0.1), material: bodyMat || M.carBody }];
    const glass = extrude([[-1.35, 1.02], [-1.1, 1.5], [0.05, 1.5], [0.2, 1.02]], 1.8, 0.04);
    parts.push({ geometry: glass, material: M.carGlass });
    const bedSide = new THREE.BoxGeometry(2.2, 0.5, 0.1);
    parts.push({ geometry: bedSide.clone().applyMatrix4(M4(1.5, 1.2, -0.92)), material: bodyMat || M.carBody });
    parts.push({ geometry: bedSide.clone().applyMatrix4(M4(1.5, 1.2, 0.92)), material: bodyMat || M.carBody });
    parts.push(...wheels(M, [[-1.75, -0.95], [-1.75, 0.95], [1.7, -0.95], [1.7, 0.95]], 0.44));
    return parts;
  }

  function coach(M) {
    const THREE = T();
    const profile = [
      [-5.8, 0.55], [-5.9, 1.4], [-5.7, 3.3], [5.7, 3.3], [5.9, 1.4], [5.8, 0.55]
    ];
    const parts = [{ geometry: extrude(profile, 2.5, 0.14), material: M.plaster }];
    const strip = new THREE.BoxGeometry(10.6, 1.05, 2.56);
    parts.push({ geometry: strip.clone().applyMatrix4(M4(0, 2.5, 0)), material: M.carGlass });
    const front = new THREE.BoxGeometry(0.12, 1.5, 2.3);
    parts.push({ geometry: front.clone().applyMatrix4(M4(-5.88, 2.2, 0)), material: M.carGlass });
    parts.push(...wheels(M, [[-3.9, -1.2], [-3.9, 1.2], [3.6, -1.2], [3.6, 1.2]], 0.52));
    return parts;
  }

  /* ===== أشخاص ===== */
  // ارتفاع بالغ 1.72 م. أشكال مبسطة لكن بنِسَب صحيحة تُقرأ من بعيد وقريب.
  function person(M, kind, cloth) {
    const THREE = T(), parts = [];
    const skin = M.skin, tall = kind === 'child' ? 0.62 : 1;
    const body = new THREE.CylinderGeometry(0.2 * tall, 0.34 * tall, 1.25 * tall, 10, 1, true);
    body.translate(0, 0.63 * tall, 0);
    parts.push({ geometry: body, material: cloth || M.thobe });
    const shoulders = new THREE.SphereGeometry(0.21 * tall, 10, 6);
    shoulders.scale(1, 0.75, 0.8); shoulders.translate(0, 1.26 * tall, 0);
    parts.push({ geometry: shoulders, material: cloth || M.thobe });
    const neck = new THREE.CylinderGeometry(0.055 * tall, 0.06 * tall, 0.1 * tall, 6);
    neck.translate(0, 1.4 * tall, 0);
    parts.push({ geometry: neck, material: skin });
    const head = new THREE.SphereGeometry(0.108 * tall, 12, 8);
    head.scale(0.92, 1.12, 1); head.translate(0, 1.53 * tall, 0);
    parts.push({ geometry: head, material: skin });
    const arm = new THREE.CylinderGeometry(0.052 * tall, 0.045 * tall, 0.66 * tall, 6);
    for (const side of [-1, 1]) {
      const m = new THREE.Matrix4().makeRotationZ(side * 0.14);
      m.premultiply(new THREE.Matrix4().makeTranslation(side * 0.24 * tall, 0.95 * tall, 0));
      parts.push({ geometry: arm.clone().applyMatrix4(m), material: cloth || M.thobe });
    }
    if (kind === 'thobe') {
      const ghutra = new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62);
      ghutra.scale(1, 1.1, 1.05); ghutra.translate(0, 1.54, 0.006);
      parts.push({ geometry: ghutra, material: M.ghutra });
      const drape = new THREE.ConeGeometry(0.2, 0.4, 10, 1, true);
      drape.translate(0, 1.4, 0.02);
      parts.push({ geometry: drape, material: M.ghutra });
      const agal = new THREE.TorusGeometry(0.125, 0.018, 5, 12);
      agal.rotateX(Math.PI / 2); agal.translate(0, 1.62, 0);
      parts.push({ geometry: agal, material: M.metal });
    } else if (kind === 'abaya') {
      const hijab = new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.75);
      hijab.scale(1, 1.18, 1.05); hijab.translate(0, 1.5, 0);
      parts.push({ geometry: hijab, material: cloth || M.abaya });
      const shawl = new THREE.ConeGeometry(0.26, 0.62, 10, 1, true);
      shawl.translate(0, 1.18, 0);
      parts.push({ geometry: shawl, material: cloth || M.abaya });
    } else if (kind === 'staff') {
      const vest = new THREE.CylinderGeometry(0.23, 0.27, 0.5, 10, 1, true);
      vest.translate(0, 1.05, 0);
      parts.push({ geometry: vest, material: M.vest });
      const cap = new THREE.SphereGeometry(0.115, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
      cap.translate(0, 1.55, 0);
      parts.push({ geometry: cap, material: M.vest });
    } else if (kind === 'child') {
      const hair = new THREE.SphereGeometry(0.1 * tall, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.65);
      hair.translate(0, 1.55 * tall, 0);
      parts.push({ geometry: hair, material: M.hair });
    }
    const legs = new THREE.CylinderGeometry(0.09 * tall, 0.07 * tall, 0.2 * tall, 6);
    parts.push({ geometry: legs.clone().applyMatrix4(M4(0, 0.09 * tall, 0)), material: M.hair });
    return parts;
  }

  /* ===== تجهيزات الطرق والإنارة ===== */
  function streetLight(M, height, arms) {
    const THREE = T(), parts = [], h = height || 9;
    const base = new THREE.CylinderGeometry(0.26, 0.34, 0.7, 10);
    base.translate(0, 0.35, 0);
    parts.push({ geometry: base, material: M.stone });
    const pole = new THREE.CylinderGeometry(0.11, 0.17, h, 10);
    pole.translate(0, h / 2, 0);
    parts.push({ geometry: pole, material: M.metalLight });
    const sides = arms === 2 ? [-1, 1] : [1];
    for (const side of sides) {
      const arm = new THREE.CylinderGeometry(0.08, 0.09, 2.1, 8);
      const m = new THREE.Matrix4().makeRotationZ(Math.PI / 2 - side * 0.35 * side);
      m.premultiply(new THREE.Matrix4().makeRotationZ(side > 0 ? -1.35 : 1.35));
      m.premultiply(new THREE.Matrix4().makeTranslation(side * 0.9, h - 0.35, 0));
      parts.push({ geometry: arm.clone().applyMatrix4(m), material: M.metalLight });
      const head = new THREE.BoxGeometry(0.85, 0.16, 0.42);
      parts.push({ geometry: head.clone().applyMatrix4(M4(side * 1.85, h - 0.72, 0)), material: M.metal });
      const lens = new THREE.BoxGeometry(0.72, 0.07, 0.34);
      parts.push({ geometry: lens.clone().applyMatrix4(M4(side * 1.85, h - 0.82, 0)), material: M.lamp });
    }
    return parts;
  }

  function floodMast(M, height) {
    const THREE = T(), parts = [], h = height || 16;
    const pole = new THREE.CylinderGeometry(0.18, 0.42, h, 12);
    pole.translate(0, h / 2, 0);
    parts.push({ geometry: pole, material: M.metalLight });
    const ring = new THREE.BoxGeometry(3.2, 0.2, 0.5);
    parts.push({ geometry: ring.clone().applyMatrix4(M4(0, h, 0)), material: M.metal });
    for (let i = 0; i < 4; i++) {
      const lamp = new THREE.BoxGeometry(0.6, 0.42, 0.28);
      const m = new THREE.Matrix4().makeRotationX(0.42);
      m.premultiply(new THREE.Matrix4().makeTranslation(-1.2 + i * 0.8, h + 0.32, 0));
      parts.push({ geometry: lamp.clone().applyMatrix4(m), material: M.lamp });
    }
    return parts;
  }

  function bollard(M) {
    const THREE = T(), parts = [];
    const post = new THREE.CylinderGeometry(0.09, 0.11, 0.9, 8);
    post.translate(0, 0.45, 0);
    parts.push({ geometry: post, material: M.metal });
    const cap = new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
    cap.translate(0, 0.9, 0);
    parts.push({ geometry: cap, material: M.lamp });
    return parts;
  }

  function roadSign(M, wide) {
    const THREE = T(), parts = [];
    const post = new THREE.CylinderGeometry(0.07, 0.08, 3, 8);
    for (const x of wide ? [-1.1, 1.1] : [0]) parts.push({ geometry: post.clone().applyMatrix4(M4(x, 1.5, 0)), material: M.metal });
    const panel = new THREE.BoxGeometry(wide ? 3.2 : 1.1, wide ? 1.5 : 1.1, 0.08);
    panel.translate(0, wide ? 2.9 : 2.6, 0);
    parts.push({ geometry: panel, material: M.signFace });
    return parts;
  }

  /* ===== سحاب: لوحات تواجه الكاميرا مع نسيج مولّد ===== */
  /* سحابة ركامية بقاعدة مسطّحة وقمّة منتفخة، مع تظليل رأسي مخبوز:
     القمّة تلقى الشمس فتبيضّ، والقاعدة في ظلّ نفسها فتزرقّ.
     النسخة السابقة كانت دوائر متطابقة بتدرّج واحد، فبدت كلها لطخة مكررة. */
  function cloudTexture(size, seed) {
    const THREE = T(), c = NT.textures.canvasOf(size || 256), ctx = c.getContext('2d');
    const rnd = NT.textures.makeRandom(seed || 9021);
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);

    const baseY = H * (0.62 + rnd() * 0.08);        // خط القاعدة المسطّح
    const lobes = 7 + Math.floor(rnd() * 7);
    const puffs = [];
    for (let i = 0; i < lobes; i++) {
      const t = i / (lobes - 1);
      // الكتلة أعرض في الوسط وأخفض عند الطرفين
      const arc = Math.sin(t * Math.PI);
      const x = W * (0.13 + t * 0.74) + (rnd() - 0.5) * W * 0.06;
      const r = W * (0.07 + arc * 0.12 + rnd() * 0.05);
      const y = baseY - arc * H * (0.16 + rnd() * 0.14) - r * 0.35;
      puffs.push({ x, y, r });
    }
    // فصوص داخلية تملأ الجسم فلا يبدو سلسلة كرات
    for (let i = 0; i < lobes * 2; i++) {
      const a = puffs[Math.floor(rnd() * lobes)];
      puffs.push({ x: a.x + (rnd() - 0.5) * a.r, y: a.y + rnd() * a.r * 0.7, r: a.r * (0.45 + rnd() * 0.4) });
    }

    for (const p of puffs) {
      const g = ctx.createRadialGradient(p.x, p.y - p.r * 0.25, p.r * 0.1, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }

    // قصّ ما تحت القاعدة بتدرّج قصير حتى تبقى القاعدة مسطّحة لا كروية
    const cut = ctx.createLinearGradient(0, baseY - H * 0.05, 0, baseY + H * 0.10);
    cut.addColorStop(0, 'rgba(0,0,0,1)');
    cut.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, W, baseY - H * 0.05);
    ctx.fillStyle = cut;
    ctx.fillRect(0, baseY - H * 0.05, W, H * 0.15);
    ctx.globalCompositeOperation = 'source-over';

    // تظليل رأسي: قمّة بيضاء وقاعدة رمادية مزرقّة
    ctx.globalCompositeOperation = 'source-atop';
    const shade = ctx.createLinearGradient(0, H * 0.18, 0, baseY);
    shade.addColorStop(0, 'rgba(255,255,255,0)');
    shade.addColorStop(0.55, 'rgba(188,196,212,0.20)');
    shade.addColorStop(1, 'rgba(150,163,186,0.46)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* طبقة سحاب: عدة أشكال مختلفة موزّعة في عناقيد على ارتفاعين،
     فتقرأ كسماء فيها عمق بدل صفّ من اللطخات المتطابقة. */
  function createClouds(scene, options) {
    const THREE = T();
    const opt = Object.assign({ count: 54, spread: 11000, base: 850, height: 1500, size: 900 }, options);
    const shapes = [];
    for (let i = 0; i < 6; i++) shapes.push(cloudTexture(256, 9021 + i * 137));
    const group = new THREE.Group();
    const rnd = NT.textures.makeRandom(4411);
    const sprites = [];

    const clusters = Math.max(6, Math.round(opt.count / 4));
    for (let c = 0; c < clusters; c++) {
      const cx = (rnd() - 0.5) * opt.spread;
      const cz = (rnd() - 0.5) * opt.spread;
      const deck = rnd() < 0.35 ? 0.62 : 1;           // طبقتان: سحاب عالٍ وآخر أخفض
      const cy = opt.base * deck + rnd() * opt.height * deck;
      const members = 2 + Math.floor(rnd() * 4);
      for (let m = 0; m < members; m++) {
        const base = 0.62 + rnd() * 0.3;
        const material = new THREE.SpriteMaterial({
          map: shapes[Math.floor(rnd() * shapes.length)],
          transparent: true, opacity: base, depthWrite: false, fog: false, color: 0xffffff
        });
        const sprite = new THREE.Sprite(material);
        const w = opt.size * (0.5 + rnd() * 1.0) * (deck < 1 ? 1.25 : 1);
        sprite.scale.set(w, w * (0.42 + rnd() * 0.18), 1);
        sprite.position.set(
          cx + (rnd() - 0.5) * opt.size * 1.6,
          cy + (rnd() - 0.5) * opt.size * 0.16,
          cz + (rnd() - 0.5) * opt.size * 1.6
        );
        sprite.renderOrder = -5;
        sprite.userData.drift = (1.2 + rnd() * 2.6) * (deck < 1 ? 0.6 : 1);
        sprite.userData.base = base;
        group.add(sprite);
        sprites.push(sprite);
      }
    }
    scene.add(group);
    return {
      group, sprites,
      setTint(color, opacity) {
        for (const s of sprites) {
          s.material.color.setHex(color);
          s.material.opacity = Math.min(0.95, opacity * s.userData.base * 1.35);
        }
      },
      update(dt) {
        for (const s of sprites) {
          s.position.x += s.userData.drift * dt;
          if (s.position.x > opt.spread / 2) s.position.x -= opt.spread;
        }
      },
      dispose() { scene.remove(group); for (const t of shapes) t.dispose(); }
    };
  }

  NT.assets = { extrude, sedan, suv, pickup, coach, person, streetLight, floodMast, bollard, roadSign, createClouds, cloudTexture };
})(window.NT = window.NT || {});
