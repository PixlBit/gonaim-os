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

  function asphalt(size = 512, seed = 71) {
    const c = gravel(size, seed, '#8e8b82');
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(70,68,62,0.16)'; ctx.fillRect(0, 0, size, size);
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

  NT.textures = { makeRandom, valueNoise, fbm, fallbackAerial, sand, fabric, wood, gravel, asphalt, normalFrom, canvasOf };
})(window.NT = window.NT || {});
