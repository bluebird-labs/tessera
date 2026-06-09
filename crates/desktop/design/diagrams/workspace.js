/* Tessera · workspace.js — a freeform docking workspace.
 * ─────────────────────────────────────────────────────────────────────────
 * The screen is a canvas. Every region (the diagram, the outliner, the
 * inspector, …) is a Panel that lives inside a Frame — a floating, draggable,
 * resizable tile. Frames can:
 *   · move freely (with magnetic snap to the surface edges and to each other)
 *   · resize from any edge/corner (also snapping)
 *   · be tabbed together (drop one frame onto another's header → tab group)
 *   · be split (drop onto a frame's left/right/top/bottom zone → side-by-side)
 *   · collapse to their header, maximize to fill, or close to a tray
 * Layout persists to localStorage and can be reset to the default.
 *
 * Content is supplied by the app via register({ id, title, mount, onResize }).
 * The engine never destroys a panel's body element once mounted — it parks it
 * (display:none, or in a hidden tray when closed) so D3 / selection state and
 * scroll positions survive every layout operation.
 */
(function () {
  "use strict";

  const SNAP = 9;            // px snap threshold
  const HEADER = 34;         // frame header height
  const MIN_W = 200, MIN_H = 120;
  const uid = () => "f" + Math.random().toString(36).slice(2, 8);

  class Workspace {
    constructor(surface, opts = {}) {
      this.surface = surface;             // the host element (position:relative)
      this.lsKey = opts.lsKey || "tessera.workspace.v2";
      this.panels = {};                   // id -> { id, title, icon, mount, onResize, onActivate }
      this.bodies = {};                   // id -> HTMLElement (cached, never destroyed)
      this.mounted = {};                  // id -> bool
      this.frames = [];                   // [{ id, x, y, w, h, z, tabs:[panelId], active, collapsed, maximized, _rect }]
      this.tray = [];                     // panelIds not currently placed
      this.zTop = 10;
      this.defaultFactory = opts.default || (() => ({ frames: [], tray: [] }));
      this.onChange = opts.onChange || (() => {});
      this._guides = [];
      this._buildChrome();
      window.addEventListener("resize", () => this._reflowInBounds());
    }

    register(panel) { this.panels[panel.id] = panel; return this; }
    setDefault(fn) { this.defaultFactory = fn; return this; }

    _buildChrome() {
      this.surface.classList.add("ws-surface");
      this.overlay = document.createElement("div");
      this.overlay.className = "ws-overlay";
      this.surface.appendChild(this.overlay);
      this.cache = document.createElement("div");
      this.cache.className = "ws-cache";
      this.cache.style.display = "none";
      this.surface.appendChild(this.cache);
    }

    // ── lifecycle ──────────────────────────────────────────────────────────
    boot() {
      const saved = this._read();
      const layout = saved || this.defaultFactory();
      this._apply(layout);
    }
    reset() {
      localStorage.removeItem(this.lsKey);
      // tear down frames (keep bodies parked in cache)
      this.frames.slice().forEach((f) => this._removeFrameEl(f));
      this.frames = []; this.tray = [];
      this._apply(this.defaultFactory());
      this._save();
    }
    _read() {
      try { const raw = localStorage.getItem(this.lsKey); return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    }
    _save() {
      const data = {
        frames: this.frames.map((f) => ({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h, z: f.z, tabs: f.tabs.slice(), active: f.active, collapsed: f.collapsed, maximized: f.maximized, _rect: f._rect })),
        tray: this.tray.slice(),
      };
      try { localStorage.setItem(this.lsKey, JSON.stringify(data)); } catch (e) {}
      this.onChange();
    }
    _apply(layout) {
      const known = new Set(Object.keys(this.panels));
      this.tray = (layout.tray || []).filter((id) => known.has(id));
      (layout.frames || []).forEach((spec) => {
        const tabs = spec.tabs.filter((id) => known.has(id));
        if (!tabs.length) return;
        const f = Object.assign({}, spec, { tabs, active: tabs.includes(spec.active) ? spec.active : tabs[0], el: null });
        this.zTop = Math.max(this.zTop, f.z || 0);
        this.frames.push(f);
        this._buildFrameEl(f);
      });
      // ensure any panel not placed/tray'd lands in the tray
      const placed = new Set(this.frames.flatMap((f) => f.tabs).concat(this.tray));
      Object.keys(this.panels).forEach((id) => { if (!placed.has(id)) this.tray.push(id); });
      this._clampAll();
    }

    // ── frame DOM ────────────────────────────────────────────────────────────
    _buildFrameEl(f) {
      const el = document.createElement("div");
      el.className = "ws-frame";
      el.dataset.frame = f.id;
      el.innerHTML =
        `<div class="ws-head">
           <div class="ws-tabs"></div>
           <div class="ws-ctrls">
             <button class="ws-btn" data-act="collapse" title="Collapse">–</button>
             <button class="ws-btn" data-act="max" title="Maximize">▢</button>
             <button class="ws-btn" data-act="close" title="Close">×</button>
           </div>
         </div>
         <div class="ws-bodies"></div>
         <div class="ws-resize n"></div><div class="ws-resize s"></div><div class="ws-resize e"></div><div class="ws-resize w"></div>
         <div class="ws-resize ne"></div><div class="ws-resize nw"></div><div class="ws-resize se"></div><div class="ws-resize sw"></div>`;
      f.el = el;
      this.surface.insertBefore(el, this.overlay);
      this._syncFrame(f);
      this._wireFrame(f);
      this._renderTabs(f);
      this._mountActive(f);
    }
    _removeFrameEl(f) {
      // park bodies back to cache
      f.tabs.forEach((id) => { if (this.bodies[id]) this.cache.appendChild(this.bodies[id]); });
      if (f.el) f.el.remove();
      const i = this.frames.indexOf(f); if (i >= 0) this.frames.splice(i, 1);
    }
    _syncFrame(f) {
      const el = f.el;
      el.style.left = f.x + "px"; el.style.top = f.y + "px";
      el.style.width = f.w + "px";
      el.style.height = (f.collapsed ? HEADER : f.h) + "px";
      el.style.zIndex = f.z;
      el.classList.toggle("collapsed", !!f.collapsed);
      el.classList.toggle("maximized", !!f.maximized);
    }
    _ensureBody(id) {
      if (!this.bodies[id]) {
        const b = document.createElement("div");
        b.className = "ws-body"; b.dataset.panel = id;
        this.bodies[id] = b;
      }
      return this.bodies[id];
    }
    _mountActive(f) {
      const host = f.el.querySelector(".ws-bodies");
      f.tabs.forEach((id) => {
        const body = this._ensureBody(id);
        if (body.parentElement !== host) host.appendChild(body);
        body.style.display = id === f.active ? "" : "none";
        if (!this.mounted[id]) { this.mounted[id] = true; this.panels[id].mount && this.panels[id].mount(body); }
      });
      this._fireResize(f.active);
      this.panels[f.active] && this.panels[f.active].onActivate && this.panels[f.active].onActivate(this.bodies[f.active]);
    }
    _renderTabs(f) {
      const tabs = f.el.querySelector(".ws-tabs");
      tabs.innerHTML = "";
      f.tabs.forEach((id) => {
        const p = this.panels[id];
        const t = document.createElement("button");
        t.className = "ws-tab" + (id === f.active ? " on" : "");
        t.dataset.panel = id;
        t.innerHTML = `${p.icon ? `<span class="ws-tab-ico">${p.icon}</span>` : ""}<span class="ws-tab-lbl">${p.title}</span>`;
        if (f.tabs.length > 1) {
          const x = document.createElement("span"); x.className = "ws-tab-x"; x.textContent = "×";
          x.onclick = (ev) => { ev.stopPropagation(); this._closeTab(f, id); };
          t.appendChild(x);
        }
        tabs.appendChild(t);
        t.addEventListener("pointerdown", (ev) => this._tabPointerDown(ev, f, id));
      });
    }

    // ── interactions ─────────────────────────────────────────────────────────
    _wireFrame(f) {
      const el = f.el;
      el.addEventListener("pointerdown", () => this._focus(f), true);
      const head = el.querySelector(".ws-head");
      head.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest(".ws-btn") || ev.target.closest(".ws-tab")) return;
        this._startMove(ev, f);
      });
      head.addEventListener("dblclick", (ev) => { if (!ev.target.closest(".ws-btn") && !ev.target.closest(".ws-tab")) this._toggleMax(f); });
      el.querySelectorAll(".ws-btn").forEach((b) => {
        b.addEventListener("pointerdown", (ev) => ev.stopPropagation());
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const act = b.dataset.act;
          if (act === "collapse") this._toggleCollapse(f);
          else if (act === "max") this._toggleMax(f);
          else if (act === "close") this._closeFrame(f);
        });
      });
      el.querySelectorAll(".ws-resize").forEach((h) => {
        h.addEventListener("pointerdown", (ev) => this._startResize(ev, f, h.classList[1]));
      });
    }

    _focus(f) {
      if (f.z === this.zTop) return;
      f.z = ++this.zTop; this._syncFrame(f); this._save();
    }

    _tabPointerDown(ev, f, id) {
      ev.stopPropagation();
      this._focus(f);
      // switch active immediately
      if (f.active !== id) { f.active = id; this._renderTabs(f); this._showActiveBody(f); this._save(); }
      const startX = ev.clientX, startY = ev.clientY;
      let detached = false, moveState = null;
      const onMove = (e) => {
        if (!detached && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
          detached = true;
          if (f.tabs.length === 1) {
            // dragging the whole frame
            moveState = this._beginMove(f, e);
          } else {
            // detach this tab into a new frame at pointer
            const nf = this._detach(f, id, e);
            moveState = this._beginMove(nf, e);
          }
        }
        if (moveState) moveState.move(e);
      };
      const onUp = (e) => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        if (moveState) moveState.up(e);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }

    _detach(f, id, ev) {
      const rect = this.surface.getBoundingClientRect();
      f.tabs = f.tabs.filter((t) => t !== id);
      if (f.active === id) f.active = f.tabs[0];
      this._renderTabs(f); this._showActiveBody(f);
      const nf = {
        id: uid(), x: ev.clientX - rect.left - 60, y: ev.clientY - rect.top - HEADER / 2,
        w: Math.max(f.w, 320), h: Math.max(f.h, 260), z: ++this.zTop,
        tabs: [id], active: id, collapsed: false, maximized: false,
      };
      this.frames.push(nf); this._buildFrameEl(nf);
      return nf;
    }

    _showActiveBody(f) {
      f.tabs.forEach((id) => { const b = this.bodies[id]; if (b) b.style.display = id === f.active ? "" : "none"; });
      this._fireResize(f.active);
      this.panels[f.active] && this.panels[f.active].onActivate && this.panels[f.active].onActivate(this.bodies[f.active]);
    }

    _startMove(ev, f) {
      this._focus(f);
      const st = this._beginMove(f, ev);
      const onMove = (e) => st.move(e);
      const onUp = (e) => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); st.up(e); };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }

    _beginMove(f, ev) {
      if (f.maximized) this._toggleMax(f); // un-maximize to drag
      const rect = this.surface.getBoundingClientRect();
      const offX = ev.clientX - rect.left - f.x;
      const offY = ev.clientY - rect.top - f.y;
      f.el.classList.add("dragging");
      let dock = null;
      return {
        move: (e) => {
          const px = e.clientX - rect.left, py = e.clientY - rect.top;
          let x = px - offX, y = py - offY;
          const snapped = this._snapMove(f, x, y);
          x = snapped.x; y = snapped.y;
          f.x = x; f.y = y; f.el.style.left = x + "px"; f.el.style.top = y + "px";
          dock = this._dockHint(f, px, py);
        },
        up: () => {
          f.el.classList.remove("dragging");
          this._clearGuides(); this._clearDockHint();
          if (dock) this._applyDock(f, dock);
          this._clamp(f); this._syncFrame(f); this._save();
        },
      };
    }

    _snapMove(f, x, y) {
      const W = this.surface.clientWidth, H = this.surface.clientHeight;
      const guides = [];
      const targetsX = [0, W - f.w, (W - f.w) / 2];
      const targetsY = [0, H - f.h, (H - f.h) / 2];
      this.frames.forEach((o) => { if (o === f) return; targetsX.push(o.x, o.x + o.w - f.w, o.x + o.w, o.x - f.w); targetsY.push(o.y, o.y + o.h - f.h, o.y + o.h, o.y - f.h); });
      let bx = x, by = y, gx = null, gy = null;
      targetsX.forEach((t) => { if (Math.abs(x - t) < SNAP) { bx = t; gx = t <= 0 ? 0 : (Math.abs(t + f.w - W) < 1 ? W : null); } });
      targetsY.forEach((t) => { if (Math.abs(y - t) < SNAP) { by = t; } });
      // draw guide lines at frame edges that snapped
      this._clearGuides();
      if (bx !== x || true) {}
      return { x: bx, y: by };
    }

    _dockHint(f, px, py) {
      // find frame under pointer (excluding f)
      let target = null;
      for (let i = this.frames.length - 1; i >= 0; i--) {
        const o = this.frames[i]; if (o === f) continue;
        if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) { target = o; break; }
      }
      if (!target) { this._clearDockHint(); return null; }
      const rx = (px - target.x) / target.w, ry = (py - target.y) / target.h;
      let zone;
      if (py - target.y < HEADER + 6) zone = "tab";
      else if (rx < 0.25) zone = "left"; else if (rx > 0.75) zone = "right";
      else if (ry < 0.28) zone = "top"; else if (ry > 0.72) zone = "bottom";
      else zone = "tab";
      this._drawDockHint(target, zone);
      return { target, zone };
    }

    _drawDockHint(target, zone) {
      this._clearDockHint();
      const d = document.createElement("div");
      d.className = "ws-dockhint";
      let x = target.x, y = target.y, w = target.w, h = target.h;
      if (zone === "left") w = target.w / 2;
      else if (zone === "right") { x = target.x + target.w / 2; w = target.w / 2; }
      else if (zone === "top") h = target.h / 2;
      else if (zone === "bottom") { y = target.y + target.h / 2; h = target.h / 2; }
      d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      d.dataset.zone = zone;
      if (zone === "tab") d.classList.add("tabzone");
      this.overlay.appendChild(d); this._dockEl = d;
    }
    _clearDockHint() { if (this._dockEl) { this._dockEl.remove(); this._dockEl = null; } }

    _applyDock(f, dock) {
      const { target, zone } = dock;
      if (zone === "tab") {
        // merge f's tabs into target
        target.tabs = target.tabs.concat(f.tabs);
        target.active = f.active;
        this._removeFrameEl(f);
        this._renderTabs(target); this._mountActive(target); this._focus(target);
        return;
      }
      // split: place f on the chosen half, shrink target to the other half
      const G = 8;
      if (zone === "left") { f.x = target.x; f.y = target.y; f.w = target.w / 2 - G / 2; f.h = target.h; target.x = target.x + target.w / 2 + G / 2; target.w = target.w / 2 - G / 2; }
      else if (zone === "right") { f.w = target.w / 2 - G / 2; f.h = target.h; f.y = target.y; f.x = target.x + target.w / 2 + G / 2; target.w = target.w / 2 - G / 2; }
      else if (zone === "top") { f.x = target.x; f.y = target.y; f.w = target.w; f.h = target.h / 2 - G / 2; target.y = target.y + target.h / 2 + G / 2; target.h = target.h / 2 - G / 2; }
      else if (zone === "bottom") { f.x = target.x; f.w = target.w; f.h = target.h / 2 - G / 2; f.y = target.y + target.h / 2 + G / 2; target.h = target.h / 2 - G / 2; }
      this._syncFrame(target); this._fireResize(target.active);
      this._syncFrame(f); this._fireResize(f.active);
    }

    _startResize(ev, f, dir) {
      ev.stopPropagation(); this._focus(f);
      if (f.maximized) return;
      const rect = this.surface.getBoundingClientRect();
      const sx = ev.clientX, sy = ev.clientY;
      const o = { x: f.x, y: f.y, w: f.w, h: f.h };
      const W = this.surface.clientWidth, H = this.surface.clientHeight;
      f.el.classList.add("resizing");
      const onMove = (e) => {
        let dx = e.clientX - sx, dy = e.clientY - sy;
        let { x, y, w, h } = o;
        if (dir.includes("e")) w = Math.max(MIN_W, o.w + dx);
        if (dir.includes("s")) h = Math.max(MIN_H, o.h + dy);
        if (dir.includes("w")) { w = Math.max(MIN_W, o.w - dx); x = o.x + (o.w - w); }
        if (dir.includes("n")) { h = Math.max(MIN_H, o.h - dy); y = o.y + (o.h - h); }
        // snap edges
        if (dir.includes("e") && Math.abs(x + w - W) < SNAP) w = W - x;
        if (dir.includes("s") && Math.abs(y + h - H) < SNAP) h = H - y;
        if (dir.includes("w") && Math.abs(x) < SNAP) { w += x; x = 0; }
        if (dir.includes("n") && Math.abs(y) < SNAP) { h += y; y = 0; }
        this.frames.forEach((g) => { if (g === f) return;
          if (dir.includes("e") && Math.abs(x + w - g.x) < SNAP) w = g.x - x;
          if (dir.includes("w") && Math.abs(x - (g.x + g.w)) < SNAP) { const nx = g.x + g.w; w += x - nx; x = nx; }
          if (dir.includes("s") && Math.abs(y + h - g.y) < SNAP) h = g.y - y;
          if (dir.includes("n") && Math.abs(y - (g.y + g.h)) < SNAP) { const ny = g.y + g.h; h += y - ny; y = ny; }
        });
        f.x = x; f.y = y; f.w = w; f.h = h; this._syncFrame(f);
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp);
        f.el.classList.remove("resizing"); this._fireResize(f.active); this._save();
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }

    _toggleCollapse(f) { f.collapsed = !f.collapsed; this._syncFrame(f); if (!f.collapsed) this._fireResize(f.active); this._save(); }
    _toggleMax(f) {
      if (f.maximized) { Object.assign(f, f._rect); f.maximized = false; }
      else { f._rect = { x: f.x, y: f.y, w: f.w, h: f.h }; f.x = 6; f.y = 6; f.w = this.surface.clientWidth - 12; f.h = this.surface.clientHeight - 12; f.maximized = true; f.z = ++this.zTop; }
      this._syncFrame(f); this._fireResize(f.active); this._save();
    }
    _closeTab(f, id) {
      f.tabs = f.tabs.filter((t) => t !== id);
      this.tray.push(id);
      const b = this.bodies[id]; if (b) this.cache.appendChild(b);
      if (!f.tabs.length) { this._removeFrameEl(f); }
      else { if (f.active === id) f.active = f.tabs[0]; this._renderTabs(f); this._showActiveBody(f); }
      this._save();
    }
    _closeFrame(f) {
      f.tabs.forEach((id) => { this.tray.push(id); const b = this.bodies[id]; if (b) this.cache.appendChild(b); });
      this._removeFrameEl(f); this._save();
    }

    // open a tray panel into a new floating frame (centered-ish, cascading)
    openPanel(id) {
      // if already placed, just focus it
      const ex = this.frames.find((f) => f.tabs.includes(id));
      if (ex) { ex.active = id; this._renderTabs(ex); this._showActiveBody(ex); this._focus(ex); return; }
      this.tray = this.tray.filter((t) => t !== id);
      const n = this.frames.length;
      const f = { id: uid(), x: 80 + n * 26, y: 70 + n * 26, w: 360, h: 300, z: ++this.zTop, tabs: [id], active: id, collapsed: false, maximized: false };
      this.frames.push(f); this._buildFrameEl(f); this._clamp(f); this._save();
    }

    trayPanels() { return this.tray.map((id) => ({ id, title: this.panels[id].title, icon: this.panels[id].icon })); }

    setTitle(id, title) {
      if (!this.panels[id]) return;
      this.panels[id].title = title;
      const f = this.frames.find((fr) => fr.tabs.includes(id));
      if (f) this._renderTabs(f);
    }
    isPlaced(id) { return this.frames.some((f) => f.tabs.includes(id)); }

    _fireResize(id) {
      const p = this.panels[id]; const b = this.bodies[id];
      if (p && p.onResize && b) requestAnimationFrame(() => p.onResize(b));
    }
    refreshAll() { this.frames.forEach((f) => this._fireResize(f.active)); }

    _clamp(f) {
      const W = this.surface.clientWidth, H = this.surface.clientHeight;
      f.w = Math.min(f.w, W); f.h = Math.min(f.h, H);
      f.x = Math.max(0, Math.min(f.x, W - Math.min(f.w, 80)));
      f.y = Math.max(0, Math.min(f.y, H - HEADER));
      this._syncFrame(f);
    }
    _clampAll() { this.frames.forEach((f) => this._clamp(f)); }
    _reflowInBounds() { this._clampAll(); this.refreshAll(); }
    _clearGuides() { this._guides.forEach((g) => g.remove()); this._guides = []; }
  }

  window.Workspace = Workspace;
})();
