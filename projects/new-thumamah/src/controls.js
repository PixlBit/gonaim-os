/* منظومة الكاميرا: تدوير وتحريك وتكبير نحو المؤشر، مع تخميد وقصور ذاتي،
   ودعم كامل للمس ولوحة المفاتيح، وطيران مُنعّم بين المشاهد. */
(function (NT) {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  class CameraRig {
    constructor(dom, options) {
      const THREE = window.THREE;
      const opt = Object.assign({ minDistance: 14, maxDistance: 5200, minPitch: 0.045, maxPitch: 1.52, bounds: 1400 }, options);
      this.opt = opt;
      this.dom = dom;
      this.perspective = new THREE.PerspectiveCamera(46, 1, 0.8, 40000);
      this.ortho = new THREE.OrthographicCamera(-100, 100, 100, -100, -8000, 40000);
      this.mode = 'orbit';
      this.target = new THREE.Vector3(0, 0, 0);
      this.desired = { az: 0.42, pitch: 0.42, dist: 1750, target: this.target.clone() };
      this.current = { az: 0.42, pitch: 0.42, dist: 1750, target: this.target.clone() };
      this.velocity = { az: 0, pitch: 0 };
      this.flight = null;
      this.pointers = new Map();
      this.keys = new Set();
      this.dirty = true;
      this.enabled = true;
      this.lastPinch = null;
      this.onChange = opt.onChange || null;
      this.groundAt = opt.groundAt || (() => null);
      this._bind();
      this.apply(0.0001);
    }

    /* ===== إدخال ===== */
    _bind() {
      const dom = this.dom;
      const pos = (e) => {
        const r = dom.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      dom.style.touchAction = 'none';
      // لا تبتلع نقرات الواجهة: الالتقاط يبدأ من لوحة الرسم فقط
      const fromCanvas = (e) => e.target && e.target.tagName === 'CANVAS';
      this._fromCanvas = fromCanvas;
      dom.addEventListener('pointerdown', (e) => {
        if (!this.enabled || !fromCanvas(e)) return;
        dom.setPointerCapture(e.pointerId);
        const p = pos(e);
        this.pointers.set(e.pointerId, {
          x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false,
          pan: e.button === 1 || e.button === 2 || e.shiftKey || this.mode === 'plan', local: p
        });
        this.flight = null;
        this.velocity.az = this.velocity.pitch = 0;
      });
      dom.addEventListener('pointermove', (e) => {
        const rec = this.pointers.get(e.pointerId);
        if (rec) {
          const dx = e.clientX - rec.x, dy = e.clientY - rec.y;
          rec.x = e.clientX; rec.y = e.clientY;
          if (Math.hypot(e.clientX - rec.startX, e.clientY - rec.startY) > 4) rec.moved = true;
          if (this.pointers.size === 2) { this._pinch(); return; }
          if (rec.pan) this.pan(dx, dy);
          else this.orbit(dx, dy);
        }
        if (this.opt.onHover) this.opt.onHover(this._fromCanvas(e) || this.pointers.size ? pos(e) : null, e);
      });
      const end = (e) => {
        const rec = this.pointers.get(e.pointerId);
        this.pointers.delete(e.pointerId);
        this.lastPinch = null;
        if (rec && !rec.moved && this.opt.onClick) this.opt.onClick(rec.local, e);
      };
      dom.addEventListener('pointerup', end);
      dom.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); this.lastPinch = null; });
      dom.addEventListener('pointerleave', () => { if (this.opt.onHover) this.opt.onHover(null); });
      dom.addEventListener('contextmenu', (e) => e.preventDefault());
      dom.addEventListener('wheel', (e) => {
        if (!this.enabled || !fromCanvas(e)) return;
        e.preventDefault();
        const r = dom.getBoundingClientRect();
        this.zoomAt(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.02 : 0.0014)), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
      dom.addEventListener('dblclick', (e) => {
        if (!fromCanvas(e)) return;
        const r = dom.getBoundingClientRect();
        const hit = this.groundAt(e.clientX - r.left, e.clientY - r.top);
        if (hit) this.flyTo({ target: hit, dist: Math.max(this.opt.minDistance * 4, this.desired.dist * 0.45), ms: 700 });
      });
      window.addEventListener('keydown', (e) => {
        if (!this.enabled) return;
        if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', '+', '=', '-', 'shift'].includes(k)) {
          this.keys.add(k);
          if (k !== 'shift') e.preventDefault();
          this.flight = null;
        }
      });
      window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.keys.clear());
    }

    _pinch() {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (this.lastPinch) {
        const r = this.dom.getBoundingClientRect();
        this.zoomAt(dist / this.lastPinch.dist, midX - r.left, midY - r.top);
        this.pan(midX - this.lastPinch.x, midY - this.lastPinch.y);
        if (this.mode === 'orbit') this.desired.az -= (angle - this.lastPinch.angle) * 0.85;
      }
      this.lastPinch = { dist, x: midX, y: midY, angle };
      this.dirty = true;
    }

    /* ===== حركات ===== */
    orbit(dx, dy) {
      if (this.mode === 'plan') return this.pan(dx, dy);
      const speed = 0.0045;
      this.desired.az -= dx * speed;
      this.desired.pitch = clamp(this.desired.pitch + dy * speed * 0.8, this.opt.minPitch, this.opt.maxPitch);
      this.velocity.az = -dx * speed * 0.55;
      this.velocity.pitch = dy * speed * 0.3;
      this.dirty = true;
    }

    pan(dx, dy) {
      const k = this.desired.dist * 0.0016;
      const az = this.current.az;
      const right = { x: Math.cos(az), z: -Math.sin(az) };
      const forward = { x: Math.sin(az), z: Math.cos(az) };
      this.desired.target.x -= (dx * right.x + dy * forward.x) * k;
      this.desired.target.z -= (dx * right.z + dy * forward.z) * k;
      this._clampTarget();
      this.dirty = true;
    }

    zoomAt(factor, px, py) {
      const before = this.groundAt(px, py);
      this.desired.dist = clamp(this.desired.dist / factor, this.opt.minDistance, this.opt.maxDistance);
      if (before) {
        const pull = clamp(1 - 1 / factor, -0.6, 0.6);
        this.desired.target.x += (before.x - this.desired.target.x) * pull;
        this.desired.target.z += (before.z - this.desired.target.z) * pull;
        this._clampTarget();
      }
      this.dirty = true;
    }

    _clampTarget() {
      const b = this.opt.bounds;
      this.desired.target.x = clamp(this.desired.target.x, -b, b);
      this.desired.target.z = clamp(this.desired.target.z, -b, b);
      this.desired.target.y = 0;
    }

    flyTo(to) {
      const from = { az: this.current.az, pitch: this.current.pitch, dist: this.current.dist, target: this.current.target.clone() };
      const target = to.target ? to.target.clone() : this.desired.target.clone();
      target.y = 0;
      // أقصر مسار زاوي بين الاتجاه الحالي والمطلوب
      const wantAz = to.az === undefined ? from.az : to.az;
      const az = from.az + Math.atan2(Math.sin(wantAz - from.az), Math.cos(wantAz - from.az));
      this.flight = {
        from,
        to: {
          az,
          pitch: clamp(to.pitch === undefined ? from.pitch : to.pitch, this.opt.minPitch, this.opt.maxPitch),
          dist: clamp(to.dist === undefined ? from.dist : to.dist, this.opt.minDistance, this.opt.maxDistance),
          target
        },
        start: performance.now(),
        ms: to.ms || 1200,
        onDone: to.onDone || null
      };
      this.dirty = true;
    }

    frame(box, options) {
      const THREE = window.THREE;
      const centre = new THREE.Vector3((box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2);
      const span = Math.max(box.maxX - box.minX, box.maxZ - box.minZ);
      const dist = options && options.dist ? options.dist : span * 1.5 + 120;
      this.flyTo(Object.assign({ target: centre, dist, ms: 1100 }, options || {}));
    }

    setMode(mode) {
      this.mode = mode;
      if (mode === 'plan') {
        this.desired.az = 0;
        this.desired.pitch = Math.PI / 2 - 0.0001;
      } else if (this.current.pitch > 1.4) {
        this.desired.pitch = 0.44;
      }
      this.dirty = true;
    }

    resize(width, height) {
      this.width = width; this.height = height;
      this.perspective.aspect = width / height;
      this.perspective.updateProjectionMatrix();
      this.dirty = true;
    }

    get camera() { return this.mode === 'plan' ? this.ortho : this.perspective; }

    /* ===== تحديث لكل إطار ===== */
    update(dt) {
      if (!this.width) return false;
      const before = `${this.current.az.toFixed(4)}|${this.current.pitch.toFixed(4)}|${this.current.dist.toFixed(2)}|${this.current.target.x.toFixed(2)}|${this.current.target.z.toFixed(2)}`;

      // لوحة المفاتيح
      if (this.keys.size) {
        const boost = this.keys.has('shift') ? 3 : 1;
        const step = this.desired.dist * 0.9 * dt * boost;
        const az = this.current.az;
        const move = (fx, fz) => {
          this.desired.target.x += fx * step; this.desired.target.z += fz * step; this._clampTarget();
        };
        if (this.keys.has('w') || this.keys.has('arrowup')) move(-Math.sin(az), -Math.cos(az));
        if (this.keys.has('s') || this.keys.has('arrowdown')) move(Math.sin(az), Math.cos(az));
        if (this.keys.has('a') || this.keys.has('arrowleft')) move(-Math.cos(az), Math.sin(az));
        if (this.keys.has('d') || this.keys.has('arrowright')) move(Math.cos(az), -Math.sin(az));
        if (this.keys.has('q')) this.desired.az += dt * 1.1 * boost;
        if (this.keys.has('e')) this.desired.az -= dt * 1.1 * boost;
        if (this.keys.has('r')) this.desired.pitch = clamp(this.desired.pitch + dt * 0.7, this.opt.minPitch, this.opt.maxPitch);
        if (this.keys.has('f')) this.desired.pitch = clamp(this.desired.pitch - dt * 0.7, this.opt.minPitch, this.opt.maxPitch);
        if (this.keys.has('+') || this.keys.has('=')) this.desired.dist = clamp(this.desired.dist * (1 - dt * 1.4), this.opt.minDistance, this.opt.maxDistance);
        if (this.keys.has('-')) this.desired.dist = clamp(this.desired.dist * (1 + dt * 1.4), this.opt.minDistance, this.opt.maxDistance);
        this.dirty = true;
      }

      // قصور ذاتي بعد رفع الإصبع
      if (!this.pointers.size && (Math.abs(this.velocity.az) > 1e-5 || Math.abs(this.velocity.pitch) > 1e-5)) {
        this.desired.az += this.velocity.az;
        this.desired.pitch = clamp(this.desired.pitch + this.velocity.pitch, this.opt.minPitch, this.opt.maxPitch);
        const decay = Math.pow(0.86, dt * 60);
        this.velocity.az *= decay; this.velocity.pitch *= decay;
        this.dirty = true;
      }

      if (this.flight) {
        const p = clamp((performance.now() - this.flight.start) / this.flight.ms, 0, 1);
        const q = easeInOut(p), f = this.flight.from, t = this.flight.to;
        this.desired.az = f.az + (t.az - f.az) * q;
        this.desired.pitch = f.pitch + (t.pitch - f.pitch) * q;
        this.desired.dist = f.dist * Math.pow(t.dist / f.dist, q);
        this.desired.target.lerpVectors(f.target, t.target, q);
        if (p === 1) { const done = this.flight.onDone; this.flight = null; if (done) done(); }
        this.dirty = true;
      }

      this.apply(dt);
      const after = `${this.current.az.toFixed(4)}|${this.current.pitch.toFixed(4)}|${this.current.dist.toFixed(2)}|${this.current.target.x.toFixed(2)}|${this.current.target.z.toFixed(2)}`;
      const changed = before !== after || this.dirty;
      this.dirty = false;
      if (changed && this.onChange) this.onChange(this);
      return changed;
    }

    apply(dt) {
      const rate = 1 - Math.exp(-dt * 11);
      const c = this.current, d = this.desired;
      c.az += (d.az - c.az) * rate;
      c.pitch += (d.pitch - c.pitch) * rate;
      c.dist += (d.dist - c.dist) * rate;
      c.target.lerp(d.target, rate);
      this.target.copy(c.target);

      const cosP = Math.cos(c.pitch), sinP = Math.sin(c.pitch);
      const x = c.target.x + Math.sin(c.az) * cosP * c.dist;
      const z = c.target.z + Math.cos(c.az) * cosP * c.dist;
      const y = Math.max(2.2, c.target.y + sinP * c.dist);
      this.perspective.position.set(x, y, z);
      this.perspective.lookAt(c.target);
      this.perspective.near = Math.max(0.6, c.dist * 0.006);
      this.perspective.far = Math.max(9000, c.dist * 12);
      this.perspective.updateProjectionMatrix();

      if (this.width) {
        const aspect = this.width / this.height;
        const half = c.dist * 0.42;
        this.ortho.left = -half * aspect; this.ortho.right = half * aspect;
        this.ortho.top = half; this.ortho.bottom = -half;
        this.ortho.position.set(c.target.x, 3000, c.target.z + 0.001);
        this.ortho.up.set(0, 0, -1);
        this.ortho.lookAt(c.target.x, 0, c.target.z);
        this.ortho.updateProjectionMatrix();
      }
    }

    snapshot() {
      return { az: this.current.az, pitch: this.current.pitch, dist: this.current.dist, target: this.current.target.toArray(), mode: this.mode };
    }
  }

  NT.CameraRig = CameraRig;
})(window.NT = window.NT || {});
