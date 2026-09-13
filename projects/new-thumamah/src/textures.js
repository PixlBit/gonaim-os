/* خامات مولّدة برمجيًا: لا صور مخزنة ولا تحميل خارجي.
   تُستخدم للرمل والقماش والخشب والحصى، وكبديل للصور الجوية عند تعذر الشبكة. */
(function (NT) {
  'use strict';

  function makeRandom(seed) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  // ضجيج قيمي بتنعيم، ثم fBm فوقه.
  function valueNoise(seed, size) {
    const rnd = makeRandom(seed), grid = new Float32Array(size * size);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      const at = (a, b) => grid[((b % size) + size) % size * size + ((a % size) + size) % size];
      const n00 = at(xi, yi), n10 = at(xi + 1, yi), n01 = at(xi, yi + 1), n11 = at(xi + 1, yi + 1);
      return (n00 * (1 - sx) + n10 * sx) * (1 - sy) + (n01 * (1 - sx) + n11 * sx) * sy;
    };
  }
  function fbm(noise, x, y, octaves, gain) {
    let sum = 0, amp = 1, norm = 0, freq = 1;
    for (let i = 0; i < octaves; i++) { sum += noise(x * freq, y * freq) * amp; norm += amp; amp *= gain; freq *= 2; }
    return sum / norm;
  }

  const canvasOf = (size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  };
  const mixHex = (a, b, t) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round((((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };

  /* صورة جوية بديلة: تُرسم فقط عندما تتعذر بلاطات الأقمار الصناعية.
     تمثيل فني للأرض الصحراوية، ليست صورة للموقع الحقيقي. */
  function fallbackAerial(size = 1024, seed = 4173) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const n1 = valueNoise(seed, 64), n2 = valueNoise(seed + 7, 128), n3 = valueNoise(seed + 19, 32);
    const rnd = makeRandom(seed + 3);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size;
        const dunes = fbm(n1, u * 9, v * 9 + fbm(n3, u * 3, v * 3, 3, 0.5) * 2.2, 5, 0.55);
        const grain = fbm(n2, u * 46, v * 46, 3, 0.6);
        const wadi = Math.abs(fbm(n3, u * 3.4 + 5, v * 3.4, 4, 0.5) - 0.5);
        let r = 196 + dunes * 40 - grain * 16;
        let g = 172 + dunes * 34 - grain * 16;
        let b = 132 + dunes * 26 - grain * 14;
        if (wadi < 0.045) { const k = 1 - wadi / 0.045; r -= 26 * k; g -= 20 * k; b -= 8 * k; } // مجرى ضحل
        if (grain > 0.76 && dunes > 0.42) { r -= 30; g -= 18; b += 2; }                          // شجيرات متفرقة
        const i = (y * size + x) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // مسارات رعي خفيفة تكسر انتظام الضجيج
    ctx.strokeStyle = 'rgba(214,196,160,0.5)';
    for (let i = 0; i < 26; i++) {
      ctx.lineWidth = 1 + rnd() * 2;
      ctx.beginPath();
      let x = rnd() * size, y = rnd() * size;
      ctx.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (rnd() - 0.5) * size * 0.3; y += (rnd() - 0.5) * size * 0.3; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    return c;
  }

  function sand(size = 512, seed = 11) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const n = valueNoise(seed, 64), ripple = valueNoise(seed + 4, 16);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const rip = Math.sin((u * 26 + fbm(ripple, u * 3, v * 3, 3, 0.5) * 6) * Math.PI) * 0.5 + 0.5;
      const grain = fbm(n, u * 60, v * 60, 4, 0.55);
      const k = grain * 0.6 + rip * 0.4;
      const i = (y * size + x) * 4;
      img.data[i] = 206 + k * 30; img.data[i + 1] = 184 + k * 26; img.data[i + 2] = 146 + k * 22; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function fabric(size = 256, tint = '#f2ece0') {
    const c = canvasOf(size), ctx = c.getContext('2d');
    ctx.fillStyle = tint; ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < size; i += 3) {
      ctx.fillStyle = i % 6 ? '#ffffff' : '#9d8f74';
      ctx.fillRect(i, 0, 1.4, size);
      ctx.fillRect(0, i, size, 1.4);
    }
    ctx.globalAlpha = 1;
    return c;
  }

  function wood(size = 512, seed = 31) {
    const c = canvasOf(size), ctx = c.getContext('2d');
    const n = valueNoise(seed, 32), rnd = makeRandom(seed);
    const planks = 8, ph = size / planks;
    for (let p = 0; p < planks; p++) {
      const tone = 0.42 + rnd() * 0.2;
      ctx.fillStyle = mixHex('#8a6a44', '#c8a273', tone);
      ctx.fillRect(0, p * ph, size, ph - 1.5);
      ctx.globalAlpha = 0.18;
      for (let g = 0; g < 26; g++) {
        ctx.strokeStyle = g % 2 ? '#5e452b' : '#d8bb8f';
        ctx.beginPath();
        const y0 = p * ph + rnd() * ph;
        ctx.moveTo(0, y0);
        for (let x = 0; x <= size; x += 32) ctx.lineTo(x, y0 + (fbm(n, x / size * 6, p, 3, 0.5) - 0.5) * 7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(60,44,28,0.45)';
      ctx.fillRect(0, p * ph + ph - 2, size, 2);
    }
    return c;
  }

  function gravel(size = 512, seed = 53, base = '#b9ab8d') {
    const c = canvasOf(size), ctx = c.getContext('2d'), rnd = makeRandom(seed);
    ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 24; i++) {
      const x = rnd() * size, y = rnd() * size, r = 0.6 + rnd() * 2.1;
      const t = rnd();
      ctx.fillStyle = `rgba(${t > 0.5 ? '238,228,206' : '120,105,82'},${0.10 + rnd() * 0.28})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return c;
  }

  /* أسفلت الساحات والمواقف: ركام بمقياسين بلا بنية اتجاهية،
     لأن الساحة لا تحمل مسارات إطارات ولا درزًا طوليًا كالطريق. */
  function asphalt(size = 512, seed = 71) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const coarse = valueNoise(seed, 96), fine = valueNoise(seed + 4, 256), patch = valueNoise(seed + 11, 16);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const agg = fbm(coarse, u * 24, v * 24, 3, 0.5);
      const micro = fbm(fine, u * 145, v * 145, 2, 0.6);
      const blot = fbm(patch, u * 6, v * 6, 3, 0.5);
      const k = Math.max(0.16, Math.min(0.9, 0.44 + agg * 0.30 + micro * 0.19 + (blot - 0.5) * 0.09));
      const i = (y * size + x) * 4;
      img.data[i] = k * 190; img.data[i + 1] = k * 187; img.data[i + 2] = k * 181; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  // خريطة نتوءات مشتقة من تدرج السطوع — تعطي إحساس الملمس دون صور خارجية.
  function normalFrom(source, strength = 2.2) {
    const size = source.width, src = source.getContext('2d').getImageData(0, 0, size, size).data;
    const out = canvasOf(size), ctx = out.getContext('2d'), img = ctx.createImageData(size, size);
    const lum = (x, y) => {
      const i = ((((y % size) + size) % size) * size + (((x % size) + size) % size)) * 4;
      return (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * strength;
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = (-dx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (-dy / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }



  /* تنويع الرمل على مقياس الموقع كله: بقع رمل فاتح، مسطّحات حصى، وأثر مجرى الوادي.
     يُضرب في نسيج الحبيبات الدقيق فيكسر تكرار البلاطة ويعطي الأرض عمقًا لونيًا. */
  function sandMacro(size = 1024, seed = 23) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const patch = valueNoise(seed, 8);        // بقع كبيرة
    const grit = valueNoise(seed + 3, 24);    // مسطّحات حصى
    const drift = valueNoise(seed + 7, 4);    // انسياب عام
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const broad = fbm(drift, u * 1.6, v * 1.6, 3, 0.55);
      const p = fbm(patch, u * 3.2 + broad * 0.4, v * 3.2, 4, 0.5);
      const g = Math.pow(fbm(grit, u * 9, v * 9, 3, 0.5), 2.1);
      // فاتح حيث الرمل الطري، أدكن وأبرد حيث الحصى المنكشف
      const light = 0.86 + p * 0.30;
      const stony = g * 0.34;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, (light - stony * 0.9) * 150);
      img.data[i + 1] = Math.min(255, (light - stony * 0.8) * 146);
      img.data[i + 2] = Math.min(255, (light - stony * 0.55) * 140);
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /* سطح طريق معبّد: الإحداثي الأفقي u يعبر عرض الطريق، وv يجري بطوله.
     فتُرسم مسارات الإطارات وحواف الحصى والدرز الطولي في مواضعها الصحيحة
     بدل ضجيج رمادي موحّد لا يقرأ كأسفلت. */
  function roadSurface(size = 512, seed = 71) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const coarse = valueNoise(seed, 96), fine = valueNoise(seed + 4, 256), blotch = valueNoise(seed + 8, 12);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      // ركام بمقياسين: حصى مرئي وحبيبات دقيقة
      const agg = fbm(coarse, u * 26, v * 26, 3, 0.5);
      const micro = fbm(fine, u * 150, v * 150, 2, 0.6);
      const patchy = fbm(blotch, u * 9, v * 9, 3, 0.5);
      let k = 0.46 + agg * 0.30 + micro * 0.20 + (patchy - 0.5) * 0.07;

      // مسارات الإطارات: أربعة خطوط مصقولة أغمق قليلًا
      for (const lane of [0.20, 0.33, 0.67, 0.80]) {
        k -= 0.085 * Math.exp(-Math.pow((u - lane) / 0.045, 2));
      }
      // حواف الطريق: غبار وحصى متراكم يفتحها
      const edge = Math.min(u, 1 - u);
      k += 0.16 * Math.exp(-Math.pow(edge / 0.045, 2));
      // درز طولي في المنتصف
      k -= 0.10 * Math.exp(-Math.pow((u - 0.5) / 0.006, 2));

      k = Math.max(0.14, Math.min(0.92, k));
      const i = (y * size + x) * 4;
      img.data[i] = k * 196; img.data[i + 1] = k * 192; img.data[i + 2] = k * 186; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /* ===== مولّدات خامات أغنى: ألبيدو + خشونة + نتوءات من نفس المصدر ===== */

  // تعتيق: أوساخ متدرجة من الأسفل وبقع استعمال
  function weather(canvas, amount, seed) {
    const ctx = canvas.getContext('2d'), size = canvas.width, rnd = makeRandom(seed || 5);
    const grad = ctx.createLinearGradient(0, size, 0, size * 0.45);
    grad.addColorStop(0, `rgba(96,82,58,${0.34 * amount})`);
    grad.addColorStop(1, 'rgba(96,82,58,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 90 * amount; i++) {
      const x = rnd() * size, y = rnd() * size, r = size * (0.01 + rnd() * 0.06);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(120,104,78,${0.05 + rnd() * 0.09 * amount})`);
      g.addColorStop(1, 'rgba(120,104,78,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return canvas;
  }

  // رمل بتموّج ريح اتجاهي وحبيبات دقيقة
  function sandDune(size = 512, seed = 17) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const n = valueNoise(seed, 64), warp = valueNoise(seed + 5, 16), grain = valueNoise(seed + 9, 256);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      /* التموّج الحقيقي ينحني ويتغيّر تباعده؛ الجيب الصافي يعطي شكل المخمل المحزّز.
         نلوي الإحداثي بضجيج قوي ونُخضع التردّد نفسه لضجيج آخر. */
      const bend = fbm(warp, u * 2.2, v * 2.2, 4, 0.55);
      const pitch = 26 + fbm(warp, u * 1.1 + 3.7, v * 1.1, 3, 0.5) * 16;
      const ripple = Math.pow(Math.sin((u * pitch + bend * 15 + v * 5) * Math.PI) * 0.5 + 0.5, 1.45);
      const coarse = fbm(n, u * 7, v * 7, 4, 0.55);
      const fine = fbm(grain, u * 120, v * 120, 2, 0.6);
      const k = ripple * 0.34 + coarse * 0.46 + fine * 0.20;
      const i = (y * size + x) * 4;
      img.data[i] = 196 + k * 44;
      img.data[i + 1] = 173 + k * 42;
      img.data[i + 2] = 133 + k * 40;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  // قماش خيام: نسيج وخيوط ودروز وظل داخلي
  function tentCanvas(size = 512, tint = '#f2ece0', seed = 23) {
    const c = canvasOf(size), ctx = c.getContext('2d');
    ctx.fillStyle = tint; ctx.fillRect(0, 0, size, size);
    const rnd = makeRandom(seed);
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < size; i += 2) {
      ctx.fillStyle = i % 4 ? '#ffffff' : '#8f8булет'.replace('булет', '070');
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }
    ctx.globalAlpha = 1;
    // دروز خياطة
    ctx.strokeStyle = 'rgba(120,104,80,0.35)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo((i * size) / 4, 0); ctx.lineTo((i * size) / 4, size); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo((i * size) / 4 + 2, 0); ctx.lineTo((i * size) / 4 + 2, size); ctx.stroke();
    }
    // بقع استعمال خفيفة
    for (let i = 0; i < 26; i++) {
      const x = rnd() * size, y = rnd() * size, r = size * (0.02 + rnd() * 0.05);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(150,132,102,0.14)');
      g.addColorStop(1, 'rgba(150,132,102,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return c;
  }

  // جدار مبني: طبقة إسمنتية بتموّج وخطوط فواصل وأثر رطوبة أسفل
  function plasterWall(size = 512, base = '#ded4c2', seed = 31) {
    const c = canvasOf(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size);
    const n = valueNoise(seed, 48), blotch = valueNoise(seed + 3, 12);
    const rgb = parseInt(base.slice(1), 16);
    const br = (rgb >> 16) & 255, bg = (rgb >> 8) & 255, bb = rgb & 255;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const k = fbm(n, u * 22, v * 22, 4, 0.55) * 0.5 + fbm(blotch, u * 3, v * 3, 3, 0.5) * 0.5;
      const shade = 0.88 + k * 0.24;
      const i = (y * size + x) * 4;
      img.data[i] = br * shade; img.data[i + 1] = bg * shade; img.data[i + 2] = bb * shade; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return weather(c, 0.55, seed + 11);
  }

  // حجر: مداميك غير منتظمة بفواصل غائرة
  function stoneWall(size = 512, seed = 41) {
    const c = canvasOf(size), ctx = c.getContext('2d'), rnd = makeRandom(seed);
    ctx.fillStyle = '#9d907a'; ctx.fillRect(0, 0, size, size);
    const rows = 7, rh = size / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 60;
      while (x < size) {
        const w = size * (0.1 + rnd() * 0.14);
        const tone = 0.82 + rnd() * 0.3;
        ctx.fillStyle = `rgb(${Math.round(168 * tone)},${Math.round(154 * tone)},${Math.round(129 * tone)})`;
        ctx.fillRect(x + 2, r * rh + 2, w - 4, rh - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x + 2, r * rh + 2, w - 4, 2);
        x += w;
      }
    }
    ctx.fillStyle = 'rgba(60,52,40,0.25)';
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * rh - 1.5, size, 3);
    return weather(c, 0.4, seed + 7);
  }

  // أسفلت: ركام وبقع إصلاح
  function asphaltTop(size = 512, seed = 71) {
    const c = gravel(size, seed, '#8f8c84'), ctx = c.getContext('2d'), rnd = makeRandom(seed + 2);
    for (let i = 0; i < 9; i++) {
      const x = rnd() * size, y = rnd() * size, w = size * (0.1 + rnd() * 0.3), h = size * (0.05 + rnd() * 0.2);
      ctx.fillStyle = `rgba(${100 + rnd() * 30},${98 + rnd() * 28},${92 + rnd() * 26},0.3)`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.fillStyle = 'rgba(60,58,54,0.14)'; ctx.fillRect(0, 0, size, size);
    return c;
  }

  // خشب: ألواح بعروق وعُقد وفواصل
  function deckWood(size = 512, seed = 53) {
    const c = canvasOf(size), ctx = c.getContext('2d'), rnd = makeRandom(seed), n = valueNoise(seed, 32);
    const planks = 7, ph = size / planks;
    for (let p = 0; p < planks; p++) {
      const tone = 0.78 + rnd() * 0.3;
      ctx.fillStyle = `rgb(${Math.round(150 * tone)},${Math.round(114 * tone)},${Math.round(74 * tone)})`;
      ctx.fillRect(0, p * ph, size, ph - 2);
      ctx.globalAlpha = 0.22;
      for (let g = 0; g < 30; g++) {
        ctx.strokeStyle = g % 2 ? '#5c4126' : '#d9b98a';
        ctx.beginPath();
        const y0 = p * ph + rnd() * ph;
        ctx.moveTo(0, y0);
        for (let x = 0; x <= size; x += 24) ctx.lineTo(x, y0 + (fbm(n, x / size * 7, p, 3, 0.5) - 0.5) * 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (rnd() < 0.6) {
        const kx = rnd() * size, ky = p * ph + ph * 0.5;
        const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, ph * 0.3);
        g.addColorStop(0, 'rgba(70,48,26,0.6)');
        g.addColorStop(1, 'rgba(70,48,26,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, ph * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(40,28,16,0.5)';
      ctx.fillRect(0, p * ph + ph - 2.5, size, 2.5);
    }
    return weather(c, 0.35, seed + 5);
  }

  // بطاقة أوراق بشفافية — للنخيل والطلح
  function leafCard(size = 256, color = '#6f8a4c', seed = 61) {
    const c = canvasOf(size), ctx = c.getContext('2d'), rnd = makeRandom(seed);
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < 42; i++) {
      const x = size * (0.1 + rnd() * 0.8), y = size * (0.1 + rnd() * 0.8);
      const r = size * (0.04 + rnd() * 0.09);
      const tone = 0.75 + rnd() * 0.5;
      const rgb = parseInt(color.slice(1), 16);
      ctx.fillStyle = `rgba(${Math.round(((rgb >> 16) & 255) * tone)},${Math.round(((rgb >> 8) & 255) * tone)},${Math.round((rgb & 255) * tone)},0.95)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  }

  // خشونة مشتقة من السطوع: الفاتح أنعم والداكن أخشن
  function roughnessFrom(source, low = 0.45, high = 0.98) {
    const size = source.width;
    const src = source.getContext('2d').getImageData(0, 0, size, size).data;
    const out = canvasOf(size), ctx = out.getContext('2d'), img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const lum = (src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114) / 255;
      const r = Math.round((high - (high - low) * lum) * 255);
      img.data[i * 4] = r; img.data[i * 4 + 1] = r; img.data[i * 4 + 2] = r; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }

  NT.textures = { makeRandom, valueNoise, fbm, fallbackAerial, sand, sandMacro, roadSurface, fabric, wood, gravel, asphalt, normalFrom, canvasOf,
    weather, sandDune, tentCanvas, plasterWall, stoneWall, asphaltTop, deckWood, leafCard, roughnessFrom };
})(window.NT = window.NT || {});
