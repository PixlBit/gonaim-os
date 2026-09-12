/* تشغيل الاستوديو: العارض، الحالة، الواجهة، التصدير.
   ثلاث حالات عرض: خريطة الموقع، النموذج ثلاثي الأبعاد، المسقط العلوي. */
(function (NT) {
  'use strict';
  const THREE = window.THREE;
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const geo = NT.geo, data = NT.data, site = data.site;

  const params = new URLSearchParams(location.search);
  const state = {
    view: '3d', time: 'day', selected: 'S1', hover: null,
    zoning: false, overlay: 0.55, mapOpacity: 0.55,
    layers: { labels: true, boundary: true, context: true },
    tour: null, quality: params.get('q') || null
  };

  /* ===== العارض ===== */
  const canvas3d = $('scene3d');
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } catch (e) {
    renderer = null; // جهاز بلا WebGL: نكتفي بعرض الخريطة
  }
  state.webgl = !!renderer;

  if (!renderer) state.quality = 'low';
  else if (!state.quality) {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    state.quality = /swiftshader|software|llvmpipe/i.test(name) ? 'low' : (window.devicePixelRatio > 2.5 || /Android|iPhone/i.test(navigator.userAgent) ? 'medium' : 'high');
  }
  const pixelCap = state.quality === 'low' ? 1 : state.quality === 'medium' ? 1.6 : 2;

  const scene = new THREE.Scene();
  let world = null, composer = null, bloom = null, dirty = true, mapDirty = true;
  let siteSurface = null, contextSurface = null, siteTexture = null, contextTexture = null;

  /* ===== أدوات المشهد ===== */
  const raycaster = new THREE.Raycaster();
  raycaster.params.Line.threshold = 4;
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  let width = 1, height = 1;

  function pointOnGround(px, py) {
    if (!width) return null;
    ndc.set((px / width) * 2 - 1, -(py / height) * 2 + 1);
    raycaster.setFromCamera(ndc, rig.camera);
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, hit) ? hit : null;
  }
  function pickZone(px, py, deep) {
    if (!world) return null;
    ndc.set((px / width) * 2 - 1, -(py / height) * 2 + 1);
    raycaster.setFromCamera(ndc, rig.camera);
    if (deep) {
      const hits = raycaster.intersectObjects(world.meshes, false);
      if (hits.length) {
        const local = world.localAt(hits[0].point);
        return world.zoneAt(local[0], local[1]);
      }
    }
    const p = pointOnGround(px, py);
    if (!p) return null;
    const local = world.localAt(p);
    return world.zoneAt(local[0], local[1]);
  }

  /* ===== منظومة الكاميرا ===== */
  const rig = new NT.CameraRig($('sceneWrap'), {
    groundAt: (px, py) => pointOnGround(px, py),
    onClick: (p) => {
      if (state.view === 'map') return;
      const id = pickZone(p.x, p.y, true);
      if (id) select(id);
      hideHint();
    },
    onHover: (p) => {
      if (!p || state.view === 'map') { setHover(null); return; }
      const now = performance.now();
      if (now - (setHover.last || 0) < 60) return;
      setHover.last = now;
      setHover(pickZone(p.x, p.y, false));
    },
    onChange: () => { dirty = true; }
  });

  /* ===== بناء العالم ===== */
  const selection = new THREE.Group();
  scene.add(selection);
  let zoningGroup = null;

  function buildWorld() {
    if (!renderer) return;
    if (world) { world.dispose(); }
    while (selection.children.length) selection.remove(selection.children[0]);
    world = NT.world.build({ scene, quality: state.quality });
    world.setTime(state.time, renderer);
    buildZoning();
    buildSelection();
    loadImagery();
    rig.opt.bounds = Math.max(site.width, site.depth) * 0.95;
    rig.opt.maxDistance = Math.max(site.width, site.depth) * 3.4;
    dirty = true;
  }

  function buildZoning() {
    if (!world) return;
    if (zoningGroup) scene.remove(zoningGroup);
    zoningGroup = new THREE.Group();
    zoningGroup.visible = state.zoning;
    for (const z of data.zones) {
      const cat = data.categories.find((c) => c.id === z.cat);
      const geoPlane = new THREE.PlaneGeometry(z.w * world.SX, z.d * world.SZ);
      geoPlane.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geoPlane, new THREE.MeshBasicMaterial({
        color: new THREE.Color(cat.color), transparent: true, opacity: state.overlay * 0.55, depthWrite: false
      }));
      mesh.position.set(world.wx(z.x + z.w / 2), 0.32, world.wz(z.y + z.d / 2));
      mesh.renderOrder = 2;
      zoningGroup.add(mesh);
    }
    scene.add(zoningGroup);
  }

  function buildSelection() {
    const z = data.zones.find((s) => s.id === state.selected);
    while (selection.children.length) selection.remove(selection.children[0]);
    if (!z || !world) return;
    const w = z.w * world.SX, d = z.d * world.SZ;
    const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2]];
    const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p[0], 0.5, p[1])));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf4d98a, transparent: true, opacity: 0.95 }));
    line.position.set(world.wx(z.x + z.w / 2), 0, world.wz(z.y + z.d / 2));
    selection.add(line);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xf6e6a8, transparent: true, opacity: 0.09, depthWrite: false })
    );
    glow.position.set(world.wx(z.x + z.w / 2), 0.22, world.wz(z.y + z.d / 2));
    selection.add(glow);
    dirty = true;
  }

  /* ===== صورة الأرض ===== */
  function loadImagery() {
    if (!world) return;
    const style = mapview.state.style;
    siteSurface = NT.basemap.createSurface({
      style, margin: 1.28, maxSize: state.quality === 'low' ? 1024 : 2048,
      onUpdate: (s) => {
        if (siteTexture) siteTexture.needsUpdate = true;
        dirty = true;
        reportImagery(s);
      }
    });
    siteTexture = world.applySurface(siteSurface, world.ground);
    siteSurface.load();

    contextSurface = NT.basemap.createSurface({
      style, span: 11000, maxSize: state.quality === 'low' ? 512 : 1024,
      onUpdate: () => { if (contextTexture) contextTexture.needsUpdate = true; dirty = true; }
    });
    contextTexture = world.applySurface(contextSurface, world.contextGround);
    contextSurface.load();
    setAttribution();
  }

  function reportImagery(s) {
    if (state.view === 'map') return;
    if (s.ready > 0) { $('status').hidden = true; return; }
    if (s.drawnFallback) {
      $('status').hidden = false;
      $('status').textContent = 'تعذر تحميل صورة الأقمار الصناعية؛ يظهر سطح صحراوي بديل. تحقق من الاتصال أو بدّل مصدر الخريطة.';
      $('surfaceNote').textContent = 'أرض مستوية · سطح بديل';
    }
  }
  function setAttribution() {
    const src = NT.basemap.sources[mapview.state.style];
    $('attribution').innerHTML = `<a href="${src.link}" target="_blank" rel="noopener noreferrer">${src.attribution}</a>`;
  }

  /* ===== عرض الخريطة ثنائي الأبعاد ===== */
  const mapCanvas = $('mapCanvas');
  const mapview = NT.mapview.create(mapCanvas, { onTile: () => { mapDirty = true; } });
  (function bindMap() {
    const pointers = new Map();
    let last = null;
    mapCanvas.addEventListener('pointerdown', (e) => {
      mapCanvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false });
      last = null;
    });
    mapCanvas.addEventListener('pointermove', (e) => {
      const rec = pointers.get(e.pointerId);
      const r = mapCanvas.getBoundingClientRect();
      if (!rec) {
        if (state.view === 'map') {
          const id = mapview.hit(e.clientX - r.left, e.clientY - r.top);
          setHover(id);
        }
        return;
      }
      const dx = e.clientX - rec.x, dy = e.clientY - rec.y;
      rec.x = e.clientX; rec.y = e.clientY;
      if (Math.hypot(e.clientX - rec.sx, e.clientY - rec.sy) > 4) rec.moved = true;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
        if (last) {
          mapview.zoomBy(Math.log2(dist / last.dist), mid.x, mid.y);
          mapview.pan(mid.x - last.x, mid.y - last.y);
        }
        last = { dist, x: mid.x, y: mid.y };
      } else {
        mapview.pan(dx, dy);
      }
      mapDirty = true;
      hideHint();
    });
    const up = (e) => {
      const rec = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      last = null;
      if (rec && !rec.moved && state.view === 'map') {
        const r = mapCanvas.getBoundingClientRect();
        const id = mapview.hit(e.clientX - r.left, e.clientY - r.top);
        if (id) select(id);
      }
    };
    mapCanvas.addEventListener('pointerup', up);
    mapCanvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
    mapCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = mapCanvas.getBoundingClientRect();
      mapview.zoomBy(-e.deltaY * 0.0022, e.clientX - r.left, e.clientY - r.top);
      mapDirty = true;
      hideHint();
    }, { passive: false });
  })();

  /* ===== الأسماء فوق المناطق ===== */
  const labelLayer = $('labels');
  const labelNodes = new Map();
  function syncLabels() {
    if (!world) return;
    const show = state.layers.labels && state.view !== 'map';
    const seen = new Set();
    if (show) {
      const projected = [];
      for (const a of world.anchors) {
        const v = a.position.clone().project(rig.camera);
        if (v.z > 1) continue;
        const x = (v.x * 0.5 + 0.5) * width, y = (-v.y * 0.5 + 0.5) * height;
        if (x < 40 || x > width - 40 || y < 70 || y > height - 90) continue;
        projected.push({ a, x, y, depth: v.z });
      }
      projected.sort((p, q) => p.depth - q.depth);
      const taken = [];
      for (const p of projected) {
        const near = taken.some((t) => Math.abs(t.x - p.x) < 108 && Math.abs(t.y - p.y) < 34);
        if (near && p.a.id !== state.selected) continue;
        taken.push(p);
        seen.add(p.a.id);
        let node = labelNodes.get(p.a.id);
        if (!node) {
          node = document.createElement('button');
          node.className = 'label';
          node.innerHTML = `<small>${p.a.en}</small>${p.a.name}`;
          node.addEventListener('click', () => select(p.a.id, true));
          labelLayer.append(node);
          labelNodes.set(p.a.id, node);
        }
        node.style.transform = `translate(-50%,-50%) translate(${x2(p.x)}px,${p.y}px)`;
        node.classList.toggle('selected', p.a.id === state.selected);
        node.classList.toggle('far', p.depth > 0.92);
        node.hidden = false;
      }
    }
    for (const [id, node] of labelNodes) if (!seen.has(id)) node.hidden = true;
  }
  const x2 = (x) => x; // الإحداثي الأفقي كما هو؛ الطبقة بلا اتجاه RTL

  /* ===== الحلقة ===== */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.view === 'map') {
      if (mapDirty) {
        const s = mapview.draw(state.selected, state.hover, state.layers);
        mapDirty = false;
        updateScale();
        if (!s.ready && !s.pending) {
          $('status').hidden = false;
          $('status').textContent = s.failed ? 'تعذر تحميل الخريطة. بدّل المصدر أو تحقق من الاتصال.' : 'جارٍ تحميل صورة الموقع…';
        } else if (s.ready) $('status').hidden = true;
      }
    } else if (world) {
      const moved = rig.update(dt);
      if (moved) { syncLabels(); updateCompass(); updateScale(); }
      if (moved || dirty) {
        world.updateShadow(rig.target.x, rig.target.z, rig.current.dist);
        render();
        dirty = false;
      }
    }
    if (state.tour) tourTick(now);
    requestAnimationFrame(frame);
  }

  function render() {
    if (!renderer || !world) return;
    if (composer && state.view !== 'plan') composer.render();
    else renderer.render(scene, rig.camera);
  }

  function updateCompass() {
    const deg = -rig.current.az * 180 / Math.PI;
    $('compassArrow').style.transform = `rotate(${deg}deg)`;
  }
  function updateScale() {
    let mpp;
    if (state.view === 'map') mpp = mapview.metresPerPixel();
    else if (state.view === 'plan') mpp = (rig.current.dist * 0.84) / height;
    else mpp = (2 * rig.current.dist * Math.tan(rig.camera.fov * Math.PI / 360)) / height;
    const options = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    const target = 96;
    const d = options.reduce((b, o) => Math.abs(o / mpp - target) < Math.abs(b / mpp - target) ? o : b, options[0]);
    $('scaleLabel').textContent = d >= 1000 ? `${d / 1000} كم` : `${d} م`;
    $('scaleBar').style.width = Math.max(30, Math.min(180, d / mpp)) + 'px';
  }

  /* ===== الاختيار والواجهة ===== */
  function select(id, fromLabel) {
    const zone = id === 'OPEN' ? data.openLand : data.zones.find((z) => z.id === id);
    if (!zone) return;
    state.selected = id;
    $('zoneId').textContent = `${zone.id} / ${zone.en}`;
    $('zoneName').textContent = zone.name;
    $('zoneDesc').textContent = zone.desc;
    $('zoneArea').textContent = fmt(id === 'OPEN' ? geo.openArea() : geo.zoneArea(zone)) + ' م²';
    $('zoneHeight').textContent = zone.height;
    $('zoneProgram').innerHTML = '';
    for (const item of zone.program || []) {
      const li = document.createElement('li');
      li.textContent = item;
      $('zoneProgram').append(li);
    }
    $('zoneSelect').value = id;
    document.querySelectorAll('.use').forEach((b) => {
      const on = b.dataset.cat === zone.cat;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    buildSelection();
    syncLabels();
    mapDirty = true;
    if (fromLabel) flyToZone();
    if (window.innerWidth < 980) closeSidebar();
  }
  function setHover(id) {
    if (id === state.hover) return;
    state.hover = id;
    mapDirty = true;
    $('sceneWrap').style.cursor = id && id !== 'OPEN' ? 'pointer' : '';
  }

  function flyToZone(planMode) {
    const z = data.zones.find((s) => s.id === state.selected);
    if (!z || !world) { if (!world) toast('العرض ثلاثي الأبعاد غير متاح على هذا الجهاز'); return; }
    if (state.view === 'map') setView('3d');
    const f = z.focus || [z.x + z.w / 2, z.y + z.d / 2];
    const target = new THREE.Vector3(world.wx(f[0]), 0, world.wz(f[1]));
    const v = z.view || { az: 0.3, pitch: 0.4, dist: 520 };
    if (planMode) {
      setView('plan', true);
      rig.flyTo({ target, dist: Math.max(z.w * world.SX, z.d * world.SZ) * 1.5, ms: 900 });
    } else {
      if (state.view === 'plan') setView('3d');
      rig.flyTo({ target, az: v.az, pitch: v.pitch, dist: v.dist, ms: 1200 });
    }
    hideHint();
  }

  function setView(view, keepFraming) {
    if (!state.webgl) view = 'map';
    const previous = state.view;
    state.view = view;
    $('sceneWrap').classList.toggle('map-mode', view === 'map');
    for (const [id, v] of [['viewMap', 'map'], ['view3d', '3d'], ['viewPlan', 'plan']]) $(id).setAttribute('aria-pressed', String(view === v));
    rig.enabled = view !== 'map';
    rig.setMode(view === 'plan' ? 'plan' : 'orbit');
    $('sceneHeading').textContent = view === 'map' ? 'المخطط على الخريطة' : view === 'plan' ? 'المسقط العلوي' : 'الموقع ثلاثي الأبعاد';
    $('sliderLabel').textContent = view === 'map' ? 'وضوح المخطط' : 'تلوين الاستخدامات';
    const value = Math.round((view === 'map' ? state.mapOpacity : state.overlay) * 100);
    $('opacity').value = value;
    $('opacityOut').value = value + '%';
    $('hint').textContent = view === 'map'
      ? 'اسحب الخريطة · عجلة الفأرة للتكبير · اضغط على منطقة لاستكشافها'
      : view === 'plan' ? 'مسقط علوي بالشمال لأعلى · اسحب للتحريك' : 'اسحب للتدوير · Shift مع السحب للتحريك · نقرة مزدوجة للطيران';
    $('surfaceNote').textContent = view === 'map' ? 'مخطط مثبت جغرافيًا' : 'أرض مستوية · صورة الموقع الحقيقية';
    for (const id of ['timeDay', 'timeSunset', 'timeNight']) $(id).disabled = view === 'map';
    $('tourBtn').disabled = view === 'map';
    if (view === 'plan' && world) {
      if (!state.zoning) { state.zoning = true; state.autoZoning = true; if (zoningGroup) zoningGroup.visible = true; setLayerButton('zoning', true); }
      if (!keepFraming) rig.flyTo({ target: new THREE.Vector3(0, 0, 0), dist: Math.max(site.width, site.depth) * 1.24, ms: previous === 'plan' ? 0 : 700 });
    } else if (state.autoZoning) {
      state.autoZoning = false; state.zoning = false;
      if (zoningGroup) zoningGroup.visible = false;
      setLayerButton('zoning', false);
    }
    mapDirty = true; dirty = true;
    syncLabels(); updateScale(); updateCompass();
    if (view === 'map') { labelLayer.querySelectorAll('.label').forEach((n) => { n.hidden = true; }); }
  }

  function setTime(key) {
    if (!world) return;
    state.time = key;
    for (const [id, k] of [['timeDay', 'day'], ['timeSunset', 'sunset'], ['timeNight', 'night']]) $(id).setAttribute('aria-pressed', String(key === k));
    const t = world.setTime(key, renderer);
    if (bloom) bloom.strength = t.bloom;
    dirty = true;
  }

  /* ===== الجولة السينمائية ===== */
  function startTour() {
    if (state.view === 'map') setView('3d');
    state.tour = { index: -1, until: 0 };
    $('tourBar').classList.add('on');
    $('tourLabel').textContent = 'إيقاف';
    $('tourDots').innerHTML = data.tour.map(() => '<i></i>').join('');
    nextTourStep(performance.now());
  }
  function stopTour() {
    state.tour = null;
    $('tourBar').classList.remove('on');
    $('tourLabel').textContent = 'جولة';
  }
  function nextTourStep(now) {
    const t = state.tour;
    t.index += 1;
    if (t.index >= data.tour.length) { stopTour(); return; }
    const step = data.tour[t.index];
    const zone = step.zone && data.zones.find((z) => z.id === step.zone);
    const f = zone && (zone.focus || [zone.x + zone.w / 2, zone.y + zone.d / 2]);
    const target = zone ? new THREE.Vector3(world.wx(f[0]), 0, world.wz(f[1])) : new THREE.Vector3(0, 0, 0);
    if (step.time !== state.time) setTime(step.time);
    if (zone) select(step.zone);
    rig.flyTo({ target, az: step.az, pitch: step.pitch, dist: step.dist, ms: 2200 });
    $('tourTitle').textContent = step.title;
    $('tourCaption').textContent = step.caption;
    [...$('tourDots').children].forEach((d, i) => d.classList.toggle('on', i === t.index));
    t.until = now + (step.hold + 2.2) * 1000;
  }
  function tourTick(now) {
    if (state.tour && now >= state.tour.until) nextTourStep(now);
  }

  /* ===== لوحة المعلومات ===== */
  function updateUI() {
    $('totalArea').textContent = fmt(site.width * site.depth);
    $('dims').textContent = `${(site.width / 1000).toFixed(2)} × ${(site.depth / 1000).toFixed(2)} km`;
    $('assumptionNote').textContent = `${fmt(site.width)} م شرقًا × ${fmt(site.depth)} م شمالًا${site.assumed ? ' · افتراض مبدئي' : ''}`;
    const link = `https://www.google.com/maps/search/?api=1&query=${site.lat.toFixed(8)},${site.lon.toFixed(8)}`;
    $('coordLink').textContent = `${dms(site.lat, 'N', 'S')} · ${dms(site.lon, 'E', 'W')}`;
    $('coordLink').href = link;
    $('aboutMapLink').href = link;
    $('aboutAssumption').textContent = `${site.assumed ? 'الأبعاد المفترضة' : 'الأبعاد الحالية'}: ${fmt(site.width)} × ${fmt(site.depth)} متر. النقطة المرجعية: ${site.anchor === 'sw' ? 'الركن الجنوبي الغربي' : 'مركز الأرض'}.`;

    const total = site.width * site.depth;
    $('usageStack').innerHTML = '';
    $('usageList').innerHTML = '';
    for (const c of data.categories) {
      const area = geo.categoryArea(c.id), pct = area / total * 100;
      const seg = document.createElement('span');
      seg.style.width = pct + '%';
      seg.style.background = c.color;
      $('usageStack').append(seg);
      const btn = document.createElement('button');
      btn.className = 'use';
      btn.dataset.cat = c.id;
      btn.innerHTML = `<span class="swatch" style="background:${c.color}"></span><span>${c.name}</span><span class="pct latin">${pct.toFixed(1)}%</span>`;
      btn.addEventListener('click', () => {
        const list = data.zones.filter((z) => z.cat === c.id);
        if (!list.length) return select('OPEN');
        const i = list.findIndex((z) => z.id === state.selected);
        select(list[(i + 1) % list.length].id);
      });
      $('usageList').append(btn);
    }
    $('zoneSelect').innerHTML = '';
    for (const z of [...data.zones, data.openLand]) {
      const op = document.createElement('option');
      op.value = z.id;
      op.textContent = `${z.id} · ${z.name}`;
      $('zoneSelect').append(op);
    }
    $('corners').innerHTML = '';
    for (const [name, x, y] of [['SW', 0, 0], ['SE', 1500, 0], ['NE', 1500, 1500], ['NW', 0, 1500]]) {
      const p = geo.point(x, y);
      const row = document.createElement('div');
      row.className = 'corner';
      row.innerHTML = `<span class="latin">${name}</span><span class="latin">${p[1].toFixed(6)}, ${p[0].toFixed(6)}</span>`;
      $('corners').append(row);
    }
    select(state.selected);
  }
  function dms(n, pos, neg) {
    const a = Math.abs(n), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60;
    return `${d}°${String(m).padStart(2, '0')}′${s.toFixed(2).padStart(5, '0')}″${n >= 0 ? pos : neg}`;
  }

  /* ===== التصدير ===== */
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    $('exportMenu').hidden = true;
    $('exportBtn').setAttribute('aria-expanded', 'false');
  }
  function exportPng() {
    if (state.view !== 'map' && world) { world.updateShadow(rig.target.x, rig.target.z, rig.current.dist); render(); }
    else mapview.draw(state.selected, state.hover, state.layers);
    const source = state.view === 'map' ? mapCanvas : canvas3d;
    const out = document.createElement('canvas');
    const scale = source.width / width;
    out.width = source.width;
    out.height = source.height + Math.round(78 * scale);
    const c = out.getContext('2d');
    c.fillStyle = '#11150f';
    c.fillRect(0, 0, out.width, out.height);
    c.drawImage(source, 0, 0);
    c.scale(scale, scale);
    const base = source.height / scale;
    // أسماء المناطق كما تظهر على الشاشة
    if (state.view !== 'map') {
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const [id, node] of labelNodes) {
        if (node.hidden) continue;
        const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(node.style.transform);
        if (!m) continue;
        const x = parseFloat(m[1]), y = parseFloat(m[2]);
        const zone = data.zones.find((z) => z.id === id);
        c.font = '600 13px "Segoe UI", Tahoma, Arial';
        const w = c.measureText(zone.name).width + 20;
        c.fillStyle = id === state.selected ? 'rgba(230,189,120,.94)' : 'rgba(14,19,14,.8)';
        c.beginPath(); c.roundRect(x - w / 2, y - 13, w, 26, 8); c.fill();
        c.fillStyle = id === state.selected ? '#20180a' : '#eef2e5';
        c.fillText(zone.name, x, y);
      }
    }
    c.textAlign = 'right';
    c.fillStyle = '#f0f3e6';
    c.font = '600 17px "Segoe UI", Tahoma, Arial';
    c.fillText('نيو ثمامة · تصور مبدئي', width - 22, base + 30);
    c.font = '12px "Segoe UI", Tahoma, Arial';
    c.fillStyle = '#a4ad99';
    c.fillText(`${fmt(site.width)} × ${fmt(site.depth)} م · أبعاد افتراضية${world ? ' · ' + world.times[state.time].label : ''}`, width - 22, base + 54);
    c.textAlign = 'left';
    c.font = '11px Arial';
    c.fillText(`${site.lat.toFixed(6)} N, ${site.lon.toFixed(6)} E`, 22, base + 30);
    c.fillText(NT.basemap.sources[mapview.state.style].attribution, 22, base + 54);
    out.toBlob((blob) => { download(blob, 'new-thumamah-concept.png'); toast('تم حفظ صورة المشهد'); });
  }

  function toast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { $('toast').hidden = true; }, 3200);
  }
  const hideHint = () => $('hint').classList.add('hidden');
  const closeSidebar = () => {
    $('sidebar').classList.remove('open');
    $('panelToggle').setAttribute('aria-expanded', 'false');
  };

  /* ===== ربط الواجهة ===== */
  $('viewMap').onclick = () => setView('map');
  $('view3d').onclick = () => setView('3d');
  $('viewPlan').onclick = () => setView('plan');
  $('timeDay').onclick = () => setTime('day');
  $('timeSunset').onclick = () => setTime('sunset');
  $('timeNight').onclick = () => setTime('night');
  $('tourBtn').onclick = () => (state.tour ? stopTour() : startTour());
  $('tourStop').onclick = stopTour;
  $('zoneSelect').onchange = (e) => select(e.target.value);
  $('zoneFly').onclick = () => flyToZone(false);
  $('zonePlan').onclick = () => flyToZone(true);
  $('focusZone').onclick = () => flyToZone(false);
  $('zoomIn').onclick = () => {
    if (state.view === 'map') { mapview.zoomBy(0.6); mapDirty = true; }
    else rig.zoomAt(1.3, width / 2, height / 2);
  };
  $('zoomOut').onclick = () => {
    if (state.view === 'map') { mapview.zoomBy(-0.6); mapDirty = true; }
    else rig.zoomAt(1 / 1.3, width / 2, height / 2);
  };
  $('resetView').onclick = () => {
    stopTour();
    if (state.view === 'map') { mapview.reset(); mapDirty = true; return; }
    rig.flyTo({ target: new THREE.Vector3(-60, 0, 40), az: 0.62, pitch: 0.30, dist: Math.max(site.width, site.depth) * 0.62, ms: 900 });
  };
  $('opacity').oninput = (e) => {
    const v = Number(e.target.value) / 100;
    $('opacityOut').value = e.target.value + '%';
    if (state.view === 'map') { state.mapOpacity = v; mapview.state.opacity = v; mapDirty = true; }
    else if (zoningGroup) {
      state.overlay = v;
      if (!state.zoning) { state.zoning = true; zoningGroup.visible = true; setLayerButton('zoning', true); }
      zoningGroup.children.forEach((m) => { m.material.opacity = v * 0.55; });
      dirty = true;
    }
  };
  $('layersBtn').onclick = () => {
    const open = $('layersMenu').hidden;
    $('layersMenu').hidden = !open;
    $('layersBtn').setAttribute('aria-expanded', String(open));
  };
  function setLayerButton(key, on) {
    const b = document.querySelector(`[data-layer="${key}"]`);
    if (b) b.setAttribute('aria-pressed', String(on));
  }
  document.querySelectorAll('[data-layer]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.layer;
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      if (key === 'zoning') { state.zoning = on; if (zoningGroup) zoningGroup.visible = on; }
      else if (key === 'boundary') { state.layers.boundary = on; if (world) world.boundary.visible = on; }
      else if (key === 'context') { state.layers.context = on; if (world) world.contextGround.visible = on; }
      else if (key === 'labels') { state.layers.labels = on; syncLabels(); }
      mapDirty = true; dirty = true;
    };
  });
  $('exportBtn').onclick = () => {
    const open = $('exportMenu').hidden;
    $('exportMenu').hidden = !open;
    $('exportBtn').setAttribute('aria-expanded', String(open));
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.export-wrap')) { $('exportMenu').hidden = true; $('exportBtn').setAttribute('aria-expanded', 'false'); }
    if (!e.target.closest('#layersMenu') && !e.target.closest('#layersBtn')) $('layersMenu').hidden = true;
  });
  $('exportGeo').onclick = () => {
    download(new Blob([JSON.stringify(geo.geoJSON(), null, 2)], { type: 'application/geo+json' }), 'new-thumamah-concept.geojson');
    toast('تم تجهيز ملف الحدود والمناطق');
  };
  $('exportData').onclick = () => {
    const payload = {
      site: Object.assign({}, site),
      generated: new Date().toISOString(),
      disclaimer: 'تصور مبدئي: لا سعات ولا أسعار ولا موعد افتتاح. الأبعاد افتراضات غير مؤكدة وليست رفعًا مساحيًا.',
      categories: data.categories.map((c) => ({ id: c.id, name: c.name, area_m2: Math.round(geo.categoryArea(c.id)) })),
      zones: data.zones.map((z) => ({ id: z.id, name: z.name, name_en: z.en, land_use: z.cat, area_m2: Math.round(geo.zoneArea(z)), programme: z.program }))
    };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'new-thumamah-zones.json');
    toast('تم تجهيز بيانات المناطق');
  };
  $('exportPng').onclick = exportPng;
  $('aboutBtn').onclick = () => $('aboutDialog').showModal();
  $('helpBtn').onclick = () => $('helpDialog').showModal();
  document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => $(b.dataset.close).close(); });
  $('panelToggle').onclick = () => {
    const open = $('sidebar').classList.toggle('open');
    $('panelToggle').setAttribute('aria-expanded', String(open));
  };
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('sceneWrap').requestFullscreen) await $('sceneWrap').requestFullscreen();
      else toast('ملء الشاشة غير متاح هنا');
    } catch (e) { toast('ملء الشاشة غير متاح هنا'); }
  };
  $('editSite').onclick = () => {
    $('latInput').value = site.lat;
    $('lonInput').value = site.lon;
    $('widthInput').value = site.width;
    $('depthInput').value = site.depth;
    $('anchorInput').value = site.anchor;
    $('formError').hidden = true;
    $('siteDialog').showModal();
  };
  $('siteForm').onsubmit = (e) => {
    e.preventDefault();
    const lat = Number($('latInput').value), lon = Number($('lonInput').value);
    const w = Number($('widthInput').value), d = Number($('depthInput').value);
    if (![lat, lon, w, d].every(Number.isFinite) || Math.abs(lat) > 80 || Math.abs(lon) > 180 || w < 200 || d < 200 || w > 10000 || d > 10000) {
      $('formError').textContent = 'راجع الإحداثيات، وأدخل أبعادًا بين 200 و10,000 متر.';
      $('formError').hidden = false;
      return;
    }
    Object.assign(site, { lat, lon, width: w, depth: d, anchor: $('anchorInput').value, assumed: false });
    $('siteDialog').close();
    $('loader').hidden = false;
    setTimeout(() => {
      mapview.reset();
      buildWorld();
      updateUI();
      $('loader').hidden = true;
      toast('أُعيد بناء النموذج بالأبعاد الجديدة');
    }, 30);
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $('exportMenu').hidden = true; $('layersMenu').hidden = true; closeSidebar(); if (state.tour) stopTour(); }
    if (e.key === '1') setView('map');
    if (e.key === '2') setView('3d');
    if (e.key === '3') setView('plan');
  });

  /* ===== القياس والحجم ===== */
  function resize() {
    const r = $('sceneWrap').getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, pixelCap);
    if (renderer) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      if (composer) composer.setSize(width, height);
    }
    rig.resize(width, height);
    mapview.resize(width, height, dpr);
    mapDirty = true; dirty = true;
    syncLabels(); updateScale();
  }
  new ResizeObserver(resize).observe($('sceneWrap'));

  /* ===== الإقلاع ===== */
  function boot() {
    buildWorld();
    if (!state.webgl) {
      for (const id of ['view3d', 'viewPlan', 'tourBtn', 'timeDay', 'timeSunset', 'timeNight', 'focusZone', 'zoneFly', 'zonePlan']) $(id).disabled = true;
      $('status').hidden = false;
      $('status').textContent = 'العرض ثلاثي الأبعاد يحتاج متصفحًا يدعم WebGL. ما زالت الخريطة الجغرافية وبيانات المناطق والتصدير تعمل.';
      resize();
      updateUI();
      setView('map');
      $('loader').hidden = true;
      requestAnimationFrame(frame);
      return;
    }
    if (state.quality !== 'low') {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, rig.perspective));
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 0.14, 0.72, 0.86);
      composer.addPass(bloom);
      composer.addPass(new THREE.OutputPass());
      const pass = composer.passes[0];
      Object.defineProperty(pass, 'camera', { get: () => rig.camera, set: () => {} });
    }
    resize();
    updateUI();
    setView('3d');
    setTime('day');
    rig.flyTo({ target: new THREE.Vector3(-60, 0, 40), az: 0.62, pitch: 0.30, dist: Math.max(site.width, site.depth) * 0.62, ms: 10 });
    $('loader').hidden = true;
    requestAnimationFrame(frame);
    setTimeout(hideHint, 9000);
  }

  NT.app = { state, select, setView, setTime, startTour, stopTour, rebuild: buildWorld, get world() { return world; }, rig, renderer, get mapview() { return mapview; } };
  boot();
})(window.NT = window.NT || {});
