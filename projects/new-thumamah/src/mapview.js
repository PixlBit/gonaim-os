/* عرض الخريطة: المخطط مثبت جغرافيًا فوق صور الأقمار الصناعية أو خريطة الشوارع.
   البلاطات تُطلب للعرض الحالي فقط، والإسناد ظاهر دائمًا. */
(function (NT) {
  'use strict';
  const geo = NT.geo;

  function create(canvas, options) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const opt = options || {};
    const state = { zoom: 15, centre: null, style: 'satellite', opacity: 0.55, key: '' };
    let W = 1, H = 1, DPR = 1;

    const worldUnit = () => 256 * Math.pow(2, state.zoom);
    const centreOfSite = () => geo.mercator(...geo.point(750, 750));

    function reset() {
      state.centre = centreOfSite();
      const site = NT.data.site;
      const mpp = Math.max(site.width / Math.max(160, W * 0.62), site.depth / Math.max(160, (H - 190) * 0.72));
      state.zoom = Math.max(3, Math.min(18, Math.log2(156543.033928 * Math.cos(site.lat * geo.DEG) / mpp)));
    }

    function projectGeo(lon, lat) {
      const p = geo.mercator(lon, lat), u = worldUnit();
      return [W * 0.5 + (p[0] - state.centre[0]) * u, H * 0.52 + (p[1] - state.centre[1]) * u];
    }
    const cacheLocal = new Map();
    function project(x, y) {
      const key = x + ',' + y;
      let g = cacheLocal.get(key);
      if (!g) { g = geo.point(x, y); cacheLocal.set(key, g); }
      return projectGeo(g[0], g[1]);
    }
    function polygon(points, fill, stroke, width, alpha) {
      ctx.beginPath();
      points.forEach((p, i) => { const q = project(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function line(points, stroke, width, dash) {
      ctx.beginPath();
      points.forEach((p, i) => { const q = project(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke(); ctx.setLineDash([]);
    }
    function chip(text, x, y, style) {
      const s = style || {};
      ctx.font = `${s.bold ? '600 ' : ''}${s.size || 12}px "Segoe UI", Tahoma, Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(text).width + 18;
      ctx.fillStyle = s.bg || 'rgba(252,253,243,0.92)';
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13, w, 26, 7); ctx.fill();
      if (s.border) { ctx.strokeStyle = s.border; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.fillStyle = s.color || '#3a4a36';
      ctx.fillText(text, x, y);
    }
    const rect = (z) => [[z.x, z.y], [z.x + z.w, z.y], [z.x + z.w, z.y + z.d], [z.x, z.y + z.d]];

    function draw(selected, hover, layers) {
      if (!state.centre) reset();
      const site = NT.data.site;
      const key = [site.lat, site.lon, site.width, site.depth, site.anchor].join(',');
      if (key !== state.key) { state.key = key; cacheLocal.clear(); reset(); }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = state.style === 'satellite' ? '#b3ab90' : '#e6e4d6';
      ctx.fillRect(0, 0, W, H);

      let ready = 0, failed = 0, pending = 0, blocked = false;
      const z = Math.floor(state.zoom), mag = Math.pow(2, state.zoom - z), unit = 256 * Math.pow(2, z);
      const left = state.centre[0] * unit - W * 0.5 / mag, top = state.centre[1] * unit - H * 0.52 / mag;
      if (NT.env && NT.env.tiles === false) blocked = true;
      else for (let ty = Math.floor(top / 256); ty <= Math.floor((top + H / mag) / 256); ty++) {
        for (let tx = Math.floor(left / 256); tx <= Math.floor((left + W / mag) / 256); tx++) {
          const t = NT.basemap.tile(state.style, z, tx, ty, () => opt.onTile && opt.onTile());
          if (!t) continue;
          if (t.status === 'ready') {
            ready++;
            ctx.drawImage(t.image, (tx * 256 - left) * mag, (ty * 256 - top) * mag, 256 * mag + 0.5, 256 * mag + 0.5);
          } else if (t.status === 'error') failed++;
          else pending++;
        }
      }

      const alpha = state.opacity;
      polygon(rect({ x: 0, y: 0, w: 1500, d: 1500 }), '#efe6cf', null, 1, alpha * 0.26);
      for (const zone of NT.data.zones) {
        const cat = NT.data.categories.find((c) => c.id === zone.cat);
        polygon(rect(zone), cat.color, 'rgba(250,248,228,0.85)', 1.2, alpha * 0.82);
      }
      if (!layers || layers.roads !== false) {
        for (const road of NT.data.roads) line(road.points, road.type === 'guest' ? 'rgba(60,58,52,0.75)' : 'rgba(120,110,88,0.6)', Math.max(1.4, road.width * scaleOfMetre()), road.type === 'guest' ? [] : [6, 5]);
        line(NT.data.trail.points, 'rgba(238,246,180,0.9)', Math.max(1.2, 2.4 * scaleOfMetre()), [7, 6]);
      }
      const sel = NT.data.zones.find((s) => s.id === selected);
      if (sel) polygon(rect(sel), null, '#eaff9a', 2.6);
      const hov = hover && hover !== selected && NT.data.zones.find((s) => s.id === hover);
      if (hov) polygon(rect(hov), null, '#fffbd5', 2);

      ctx.setLineDash([8, 5]);
      polygon(rect({ x: 0, y: 0, w: 1500, d: 1500 }), null, state.style === 'satellite' ? '#f2ec7a' : '#3c6030', 2.2);
      ctx.setLineDash([]);

      if (!layers || layers.labels !== false) {
        for (const zone of NT.data.zones) {
          const p = project(zone.x + zone.w / 2, zone.y + zone.d / 2);
          const px = zone.w * site.width / 1500 / geo.metresPerPixel(state.zoom, site.lat);
          if (p[0] > 50 && p[0] < W - 40 && p[1] > 130 && p[1] < H - 80) {
            chip(px < 110 ? zone.id : zone.name, p[0], p[1], zone.id === selected
              ? { bg: 'rgba(25,52,36,0.94)', color: '#f2fbe4', bold: true }
              : { border: 'rgba(180,190,160,0.7)' });
          }
        }
      }

      // النقطة المرجعية المعطاة
      const pin = projectGeo(site.lon, site.lat);
      ctx.fillStyle = '#163a2c'; ctx.strokeStyle = '#f0ffc7'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pin[0], pin[1]);
      ctx.bezierCurveTo(pin[0] - 24, pin[1] - 28, pin[0] - 13, pin[1] - 40, pin[0], pin[1] - 40);
      ctx.bezierCurveTo(pin[0] + 13, pin[1] - 40, pin[0] + 24, pin[1] - 28, pin[0], pin[1]);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e4f4b1';
      ctx.beginPath(); ctx.arc(pin[0], pin[1] - 27, 4.6, 0, Math.PI * 2); ctx.fill();

      return { ready, failed, pending, blocked };
    }

    const scaleOfMetre = () => 1 / geo.metresPerPixel(state.zoom, NT.data.site.lat);

    function hit(px, py) {
      for (const zone of NT.data.zones) {
        const poly = rect(zone).map((p) => project(p[0], p[1]));
        if (inside(px, py, poly)) return zone.id;
      }
      const bounds = [[0, 0], [1500, 0], [1500, 1500], [0, 1500]].map((p) => project(p[0], p[1]));
      return inside(px, py, bounds) ? 'OPEN' : null;
    }
    function inside(x, y, p) {
      let is = false;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const a = p[i], b = p[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) is = !is;
      }
      return is;
    }

    return {
      state, draw, hit, reset,
      resize(w, h, dpr) { W = w; H = h; DPR = dpr; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); },
      pan(dx, dy) {
        const u = worldUnit();
        state.centre[0] -= dx / u;
        state.centre[1] = Math.max(0.01, Math.min(0.99, state.centre[1] - dy / u));
      },
      zoomBy(delta, px, py) {
        const before = state.zoom;
        state.zoom = Math.max(3, Math.min(19, state.zoom + delta));
        if (px !== undefined) {
          const k = Math.pow(2, state.zoom - before), u0 = 256 * Math.pow(2, before);
          state.centre[0] += ((px - W * 0.5) / u0) * (1 - 1 / k);
          state.centre[1] += ((py - H * 0.52) / u0) * (1 - 1 / k);
        }
      },
      metresPerPixel: () => geo.metresPerPixel(state.zoom, NT.data.site.lat),
      attribution: () => NT.basemap.sources[state.style]
    };
  }

  NT.mapview = { create };
})(window.NT = window.NT || {});
