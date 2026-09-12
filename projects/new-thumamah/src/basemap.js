/* بلاطات الخرائط: تُطلب عند العرض فقط، بلا تخزين أو تنزيل بالجملة.
   تُستخدم كخلفية للخريطة ثنائية الأبعاد، وكصورة أرضية داخل المشهد الثلاثي. */
(function (NT) {
  'use strict';
  const geo = NT.geo, site = NT.data.site;

  const sources = {
    satellite: {
      url: (z, x, y) => `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
      maxZoom: 18,
      label: 'قمر صناعي',
      attribution: 'Imagery © Esri, Maxar, Earthstar Geographics & the GIS User Community',
      link: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9'
    },
    street: {
      url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
      maxZoom: 16,
      label: 'خريطة',
      attribution: '© OpenStreetMap contributors',
      link: 'https://www.openstreetmap.org/copyright'
    }
  };

  const cache = new Map();
  const queue = [];
  let active = 0;
  const MAX_ACTIVE = 6;

  function pump() {
    while (active < MAX_ACTIVE && queue.length) {
      const job = queue.shift();
      active++;
      job.image.src = job.src;
    }
  }

  function tile(style, z, x, y, onDone) {
    const n = Math.pow(2, z);
    if (y < 0 || y >= n) return null;
    x = ((x % n) + n) % n;
    const key = `${style}/${z}/${x}/${y}`;
    let t = cache.get(key);
    if (t) {
      if (t.status === 'loading' && onDone) t.waiters.push(onDone);
      return t;
    }
    t = { status: 'loading', image: new Image(), waiters: onDone ? [onDone] : [] };
    cache.set(key, t);
    t.image.crossOrigin = 'anonymous';
    t.image.referrerPolicy = 'strict-origin-when-cross-origin';
    const finish = (status) => {
      t.status = status; active--;
      t.waiters.splice(0).forEach((fn) => fn(t));
      pump();
    };
    t.image.onload = () => finish('ready');
    t.image.onerror = () => finish('error');
    queue.push({ image: t.image, src: sources[style].url(z, x, y) });
    pump();
    return t;
  }

  /* سطح صور: لوحة واحدة تغطي الموقع ومحيطه، مبنية من البلاطات،
     مع تحويل من [lon,lat] إلى إحداثيات الخامة. */
  function createSurface(options) {
    const opt = Object.assign({ style: 'satellite', margin: 1.3, maxSize: 2048, span: null, onUpdate: null }, options);
    const span = opt.span || Math.max(site.width, site.depth) * opt.margin;
    const centre = geo.point(750, 750);
    const src = sources[opt.style];
    let zoom = Math.floor(Math.log2(156543.033928 * Math.cos(centre[1] * geo.DEG) * opt.maxSize / span));
    zoom = Math.max(3, Math.min(src.maxZoom, zoom));

    const worldPx = 256 * Math.pow(2, zoom);
    const mpp = geo.metresPerPixel(zoom, centre[1]);
    const halfPx = span / 2 / mpp;
    const c = geo.mercator(centre[0], centre[1]);
    const box = { x0: c[0] * worldPx - halfPx, y0: c[1] * worldPx - halfPx, size: halfPx * 2 };

    const canvas = NT.textures.canvasOf(Math.min(opt.maxSize, Math.max(512, Math.round(box.size))));
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / box.size;
    const state = { ready: 0, failed: 0, pending: 0, drawnFallback: false };

    function fallback() {
      const aerial = NT.textures.fallbackAerial(canvas.width, 4173);
      ctx.drawImage(aerial, 0, 0, canvas.width, canvas.height);
      state.drawnFallback = true;
      if (opt.onUpdate) opt.onUpdate(state);
    }

    function load() {
      ctx.fillStyle = opt.style === 'satellite' ? '#b8ae92' : '#e6e4d6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const x0 = Math.floor(box.x0 / 256), x1 = Math.floor((box.x0 + box.size) / 256);
      const y0 = Math.floor(box.y0 / 256), y1 = Math.floor((box.y0 + box.size) / 256);
      state.pending = 0;
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const place = (t) => {
            if (t.status === 'ready') {
              state.ready++;
              ctx.drawImage(t.image, (tx * 256 - box.x0) * scale, (ty * 256 - box.y0) * scale, 256 * scale + 0.5, 256 * scale + 0.5);
            } else { state.failed++; }
            state.pending--;
            if (opt.onUpdate) opt.onUpdate(state);
            if (state.pending === 0 && state.ready === 0) fallback();
          };
          const t = tile(opt.style, zoom, tx, ty, place);
          if (!t) continue;
          if (t.status === 'loading') state.pending++;
          else place(t);
        }
      }
      if (state.pending === 0 && state.ready === 0) fallback();
    }

    return {
      canvas, zoom, state, load, metresPerPixel: mpp, span,
      attribution: src.attribution, link: src.link,
      // [lon,lat] → إحداثيات الخامة (u من اليسار، v من الأسفل)
      uv(lon, lat) {
        const p = geo.mercator(lon, lat);
        return [(p[0] * worldPx - box.x0) / box.size, 1 - (p[1] * worldPx - box.y0) / box.size];
      }
    };
  }

  NT.basemap = { sources, tile, createSurface, cache };
})(window.NT = window.NT || {});
