/* تضاريس الموقع: سهل وكثبان وجبل بقمة مستوية.
   شكل تمثيلي مبني على وصف الملف المعتمد (المنطقة الأخيرة أعلى الجبل، وجبال تطعيس)،
   وليس نموذج ارتفاعات مساحيًا. يُستبدل كاملًا عند توفر رفع حقيقي. */
(function (NT) {
  'use strict';

  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function create(spec) {
    const tex = NT.textures;
    const base = tex.valueNoise(spec.seed || 7731, 64);
    const fine = tex.valueNoise((spec.seed || 7731) + 17, 128);
    const duneNoise = tex.valueNoise((spec.seed || 7731) + 41, 32);

    // ارتفاع خام قبل التسوية
    function raw(x, y) {
      const u = x / 1500, v = y / 1500;
      let h = (tex.fbm(base, u * 4.2, v * 4.2, 4, 0.5) - 0.5) * 7.5;      // تموّج السهل
      h += (tex.fbm(fine, u * 17, v * 17, 3, 0.5) - 0.5) * 2.2;            // خشونة قريبة
      h += Math.sin((x * 0.82 + y * 0.57) / 34) * 0.55;                    // تموّج رملي قصير

      // الجبل: قمة مستوية وسفوح متدرجة — تُؤخذ أعلى مساهمة لا مجموعها
      let relief = 0, reliefRough = 0;
      for (const hill of spec.hills) {
        const dx = (x - hill.x) / hill.rx;
        // واجهة جنوبية أحدّ: الهضبة تنكسر بسرعة نحو المخيم، وتنحدر برفق شمالًا
        const southScale = y < hill.y ? (hill.southFace || 1) : 1;
        const dy = (y - hill.y) / (hill.ry * southScale);
        const d = Math.hypot(dx, dy);
        const top = clamp(smooth(1 - (d - 1) / (hill.falloff || 0.85)), 0, 1);
        const contribution = hill.height * top;
        if (contribution > relief) {
          relief = contribution;
          reliefRough = hill.rough ? Math.sin(x * 0.05 + y * 0.03) * hill.rough * top : 0;
        }
      }
      h += relief + reliefRough;

      // حقول الكثبان: أعراف خطية باتجاه ثابت
      for (const field of spec.dunes) {
        const inside = smooth(1 - (Math.hypot((x - field.x) / field.rx, (y - field.y) / field.ry) - 0.55) / 0.7);
        if (inside <= 0) continue;
        const a = field.angle || 0.7;
        const s = (x * Math.cos(a) + y * Math.sin(a)) / field.wavelength;
        const wander = tex.fbm(duneNoise, u * 5, v * 5, 3, 0.55) * 1.6;
        const ridge = Math.pow(Math.abs(Math.sin(Math.PI * (s + wander))), field.sharp || 1.6);
        h += field.height * ridge * clamp(inside, 0, 1);
      }

      // مجرى ضحل يصرّف من سفح الجبل
      if (spec.wadi) {
        for (const w of spec.wadi) {
          const t = clamp(((x - w.from[0]) * (w.to[0] - w.from[0]) + (y - w.from[1]) * (w.to[1] - w.from[1]))
            / (Math.pow(w.to[0] - w.from[0], 2) + Math.pow(w.to[1] - w.from[1], 2)), 0, 1);
          const px = w.from[0] + (w.to[0] - w.from[0]) * t, py = w.from[1] + (w.to[1] - w.from[1]) * t;
          const d = Math.hypot(x - px, y - py);
          h -= w.depth * smooth(1 - d / w.width);
        }
      }
      return h;
    }

    /* مساحات مسوّاة: كل منصة تسحب الأرض إلى منسوب واحد مع حافة متدرجة،
       تمامًا كما يُسوّى موقع قبل التنفيذ. */
    const pads = (spec.pads || []).map((pad) => {
      const level = pad.level === undefined ? null : pad.level;
      return Object.assign({}, pad, { level });
    });
    for (const pad of pads) if (pad.level === null) pad.level = raw(pad.x, pad.y);

    function heightAt(x, y) {
      let h = raw(x, y);
      for (const pad of pads) {
        const hw = pad.w / 2, hd = pad.d / 2, edge = pad.edge || 26;
        const dx = Math.abs(x - pad.x) - hw, dy = Math.abs(y - pad.y) - hd;
        const outside = Math.max(dx, dy);
        const k = smooth(1 - outside / edge);
        if (k > 0) h += (pad.level - h) * k;
      }
      return h;
    }

    function normalAt(x, y, step) {
      const s = step || 3;
      const hx = heightAt(x + s, y) - heightAt(x - s, y);
      const hy = heightAt(x, y + s) - heightAt(x, y - s);
      return [-hx / (2 * s), 1, hy / (2 * s)];
    }
    const slopeAt = (x, y) => {
      const n = normalAt(x, y, 6);
      return Math.hypot(n[0], n[2]);
    };

    return { heightAt, normalAt, slopeAt, raw, pads, spec };
  }

  NT.terrain = { create, smooth };
})(window.NT = window.NT || {});
