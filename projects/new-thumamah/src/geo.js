/* الإسناد الجغرافي: إزاحات محلية بالمتر إلى WGS 84، وحساب بلاطات الخرائط.
   النتيجة شبكة محلية تقريبية حول نقطة مرجعية — ليست رفعًا مساحيًا. */
(function (NT) {
  'use strict';
  const DEG = Math.PI / 180;
  const site = NT.data.site;

  // حل Vincenty المباشر على قطع WGS 84 الناقص.
  function destination(lat, lon, east, north) {
    const dist = Math.hypot(east, north);
    if (dist === 0) return [lon, lat];
    const a = 6378137, f = 1 / 298.257223563, b = (1 - f) * a;
    const alpha1 = Math.atan2(east, north), sinA1 = Math.sin(alpha1), cosA1 = Math.cos(alpha1);
    const tanU1 = (1 - f) * Math.tan(lat * DEG), cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1), sinU1 = tanU1 * cosU1;
    const sigma1 = Math.atan2(tanU1, cosA1), sinAlpha = cosU1 * sinA1, cosSqAlpha = 1 - sinAlpha * sinAlpha;
    const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    let sigma = dist / (b * A);
    for (let i = 0; i < 100; i++) {
      const c2 = Math.cos(2 * sigma1 + sigma), ss = Math.sin(sigma), cs = Math.cos(sigma);
      const delta = B * ss * (c2 + B / 4 * (cs * (-1 + 2 * c2 * c2) - B / 6 * c2 * (-3 + 4 * ss * ss) * (-3 + 4 * c2 * c2)));
      const next = dist / (b * A) + delta;
      if (Math.abs(next - sigma) < 1e-12) { sigma = next; break; }
      sigma = next;
    }
    const ss = Math.sin(sigma), cs = Math.cos(sigma), c2 = Math.cos(2 * sigma1 + sigma);
    const tmp = sinU1 * ss - cosU1 * cs * cosA1;
    const lat2 = Math.atan2(sinU1 * cs + cosU1 * ss * cosA1, (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    const lambda = Math.atan2(ss * sinA1, cosU1 * cs - sinU1 * ss * cosA1);
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    const L = lambda - (1 - C) * f * sinAlpha * (sigma + C * ss * (c2 + C * cs * (-1 + 2 * c2 * c2)));
    return [((lon + L / DEG + 540) % 360) - 180, lat2 / DEG];
  }

  // متر محلي (x شرقًا، y شمالًا) إلى [lon, lat]
  function point(x, y) {
    const off = site.anchor === 'center' ? 0.5 : 0;
    return destination(site.lat, site.lon, (x / 1500 - off) * site.width, (y / 1500 - off) * site.depth);
  }
  const ring = (x, y, w, d) => {
    const c = [point(x, y), point(x + w, y), point(x + w, y + d), point(x, y + d)];
    c.push([...c[0]]);
    return c;
  };

  function mercator(lon, lat) {
    const s = Math.sin(Math.max(-85, Math.min(85, lat)) * DEG);
    return [(lon + 180) / 360, 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)];
  }
  const metresPerPixel = (zoom, lat) => 156543.033928 * Math.cos(lat * DEG) / Math.pow(2, zoom);

  const zoneArea = (z) => z.w * z.d * site.width * site.depth / 2250000;
  const openArea = () => site.width * site.depth - NT.data.zones.reduce((a, z) => a + zoneArea(z), 0);
  const categoryArea = (cat) => cat === 'open'
    ? openArea()
    : NT.data.zones.filter((z) => z.cat === cat).reduce((a, z) => a + zoneArea(z), 0);

  function geoJSON() {
    const d = NT.data;
    const features = [{
      type: 'Feature',
      properties: {
        name: 'نيو ثمامة — حدود تصورية', kind: 'concept_boundary',
        width_m: site.width, depth_m: site.depth, area_m2: site.width * site.depth,
        anchor: site.anchor, dimensions_assumed: site.assumed, surveyed: false
      },
      geometry: { type: 'Polygon', coordinates: [ring(0, 0, 1500, 1500)] }
    }];
    for (const z of d.zones) {
      features.push({
        type: 'Feature',
        properties: {
          id: z.id, name: z.name, name_en: z.en, land_use: z.cat,
          area_m2: Math.round(zoneArea(z)), height_concept: z.height,
          conceptual: true, surveyed: false
        },
        geometry: { type: 'Polygon', coordinates: [ring(z.x, z.y, z.w, z.d)] }
      });
    }
    features.push({
      type: 'Feature',
      properties: { id: 'OPEN', name: d.openLand.name, land_use: 'open', area_m2: Math.round(openArea()), conceptual: true },
      geometry: { type: 'Polygon', coordinates: [ring(0, 0, 1500, 1500), ...d.zones.map((z) => ring(z.x, z.y, z.w, z.d).reverse())] }
    });
    for (const r of d.roads) {
      features.push({
        type: 'Feature',
        properties: { id: r.id, kind: 'circulation', access: r.type, width_m: r.width, conceptual: true },
        geometry: { type: 'LineString', coordinates: r.points.map((p) => point(p[0], p[1])) }
      });
    }
    features.push({
      type: 'Feature',
      properties: { id: d.trail.id, name: d.trail.name, kind: 'trail', conceptual: true, surveyed: false },
      geometry: { type: 'LineString', coordinates: d.trail.points.map((p) => point(p[0], p[1])) }
    });
    for (const v of d.trail.viewpoints) {
      features.push({
        type: 'Feature',
        properties: { name: v.name, kind: 'viewpoint', conceptual: true },
        geometry: { type: 'Point', coordinates: point(v.at[0], v.at[1]) }
      });
    }
    features.push({
      type: 'Feature',
      properties: { name: 'النقطة المرجعية المعطاة', kind: 'supplied_reference_point', surveyed: false },
      geometry: { type: 'Point', coordinates: [site.lon, site.lat] }
    });
    return {
      type: 'FeatureCollection',
      name: 'new-thumamah-concept',
      metadata: {
        crs: 'WGS 84 longitude, latitude',
        method: 'Vincenty direct radial local offsets',
        surveyed: false,
        dimensions_assumed: site.assumed,
        note: 'هندسة تصورية. الحد الخارجي يتداخل عمدًا مع مضلعات الاستخدام؛ لا تجمع مساحاتها معًا.'
      },
      features
    };
  }

  NT.geo = { DEG, destination, point, ring, mercator, metresPerPixel, zoneArea, openArea, categoryArea, geoJSON };
})(window.NT = window.NT || {});
