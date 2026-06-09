/* Tessera · Workspace.tsx
 * A freeform docking workspace — drag, snap, tab, split, float, resize, persist.
 * Ported from design/diagrams/workspace.js.
 *
 * Body-parking strategy
 * ─────────────────────
 * Each registered panel owns a long-lived "body element" — a <div> created at
 * registration time and never destroyed. React renders the panel's content into
 * that body via createPortal. The engine reparents the body element itself
 * between (a) a hidden cache <div> outside the workspace tree and (b) the
 * `.ws-bodies` slot of whichever frame currently hosts the panel — and hides
 * inactive tabs with `display: none`. React's reconciler never sees the dock
 * operations, so D3 simulations, scroll positions, selection, and form state
 * survive drag/tab/split/detach without re-mounting.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./workspace.css";

const SNAP = 9;
const HEADER = 34;
const MIN_W = 200;
const MIN_H = 120;
const SPLIT_GUTTER = 8;

const uid = (): string => `f${Math.random().toString(36).slice(2, 8)}`;

export interface PanelDef {
  id: string;
  title: string;
  icon?: string;
  render: (host: HTMLElement) => ReactNode | null;
  onActivate?: (host: HTMLElement) => void;
  onResize?: (host: HTMLElement) => void;
}

export interface FrameLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  tabs: string[];
  active: string;
  collapsed: boolean;
  maximized: boolean;
  _rect?: { x: number; y: number; w: number; h: number };
}

export interface WorkspaceLayout {
  frames: FrameLayout[];
  tray: string[];
}

export interface WorkspaceProps {
  panels: PanelDef[];
  defaultLayout: (surfaceSize: { w: number; h: number }) => WorkspaceLayout;
  lsKey: string;
  onChange?: (layout: WorkspaceLayout) => void;
}

export interface WorkspaceApi {
  openPanel: (id: string) => void;
  closePanel: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  isPlaced: (id: string) => boolean;
  trayPanels: () => { id: string; title: string; icon?: string }[];
  reset: () => void;
  refreshAll: () => void;
}

interface FrameRuntime extends FrameLayout {
  el: HTMLDivElement | null;
}

type Zone = "left" | "right" | "top" | "bottom" | "tab";

interface DockTarget {
  target: FrameRuntime;
  zone: Zone;
}

interface MoveSession {
  move: (e: PointerEvent) => void;
  up: (e: PointerEvent) => void;
}

interface EngineCallbacks {
  onLayoutChange: () => void;
  onTrayChange: () => void;
}

class WorkspaceEngine {
  readonly panels = new Map<string, PanelDef>();
  readonly bodies = new Map<string, HTMLDivElement>();
  readonly mounted = new Set<string>();

  frames: FrameRuntime[] = [];
  tray: string[] = [];
  zTop = 10;

  surface: HTMLDivElement | null = null;
  overlay: HTMLDivElement | null = null;
  cache: HTMLDivElement | null = null;
  private _dockEl: HTMLDivElement | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly lsKey: string,
    private readonly defaultFactory: (size: { w: number; h: number }) => WorkspaceLayout,
    private readonly cb: EngineCallbacks,
  ) {}

  register(panel: PanelDef): void {
    this.panels.set(panel.id, panel);
    this._ensureBody(panel.id);
  }

  attach(surface: HTMLDivElement): void {
    this.surface = surface;
    surface.classList.add("ws-surface");

    const overlay = document.createElement("div");
    overlay.className = "ws-overlay";
    surface.appendChild(overlay);
    this.overlay = overlay;

    const cache = document.createElement("div");
    cache.className = "ws-cache";
    surface.appendChild(cache);
    this.cache = cache;

    // Park every registered body in the cache up-front so portals have a
    // mounted DOM target before the first frame is built.
    for (const id of this.panels.keys()) {
      const body = this._ensureBody(id);
      if (body.parentElement !== cache) cache.appendChild(body);
    }

    this._boot();

    const ro = new ResizeObserver(() => this._reflowInBounds());
    ro.observe(surface);
    this._resizeObserver = ro;
  }

  detach(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this.frames.slice().forEach((f) => this._removeFrameEl(f));
    this.overlay?.remove();
    this.overlay = null;
    this.cache?.remove();
    this.cache = null;
    this.surface?.classList.remove("ws-surface");
    this.surface = null;
  }

  setPanels(panels: PanelDef[]): void {
    // Panels are stable for the workspace lifetime (per contract). This is a
    // belt-and-braces fallback: register any new ones, ignore the rest.
    for (const p of panels) {
      if (!this.panels.has(p.id)) {
        this.register(p);
        if (!this._anywherePlaced(p.id) && !this.tray.includes(p.id)) {
          this.tray.push(p.id);
        }
      } else {
        this.panels.set(p.id, p);
      }
    }
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  private _boot(): void {
    const saved = this._read();
    const layout = saved ?? this.defaultFactory(this._surfaceSize());
    this._apply(layout);
  }

  reset(): void {
    try {
      localStorage.removeItem(this.lsKey);
    } catch {
      /* ignore — private mode, etc. */
    }
    this.frames.slice().forEach((f) => this._removeFrameEl(f));
    this.frames = [];
    this.tray = [];
    this._apply(this.defaultFactory(this._surfaceSize()));
    this._save();
    this.cb.onTrayChange();
  }

  serialize(): WorkspaceLayout {
    return {
      frames: this.frames.map((f) => ({
        id: f.id,
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        z: f.z,
        tabs: f.tabs.slice(),
        active: f.active,
        collapsed: f.collapsed,
        maximized: f.maximized,
        _rect: f._rect,
      })),
      tray: this.tray.slice(),
    };
  }

  private _read(): WorkspaceLayout | null {
    try {
      const raw = localStorage.getItem(this.lsKey);
      return raw ? (JSON.parse(raw) as WorkspaceLayout) : null;
    } catch {
      return null;
    }
  }

  private _save(): void {
    const data = this.serialize();
    try {
      localStorage.setItem(this.lsKey, JSON.stringify(data));
    } catch {
      /* ignore */
    }
    this.cb.onLayoutChange();
  }

  private _surfaceSize(): { w: number; h: number } {
    if (!this.surface) return { w: 0, h: 0 };
    return { w: this.surface.clientWidth, h: this.surface.clientHeight };
  }

  private _apply(layout: WorkspaceLayout): void {
    const known = new Set(this.panels.keys());
    this.tray = (layout.tray || []).filter((id) => known.has(id));

    for (const spec of layout.frames ?? []) {
      const tabs = spec.tabs.filter((id) => known.has(id));
      if (tabs.length === 0) continue;
      const active = tabs.includes(spec.active) ? spec.active : tabs[0];
      const f: FrameRuntime = {
        id: spec.id || uid(),
        x: spec.x,
        y: spec.y,
        w: spec.w,
        h: spec.h,
        z: spec.z ?? 0,
        tabs,
        active,
        collapsed: !!spec.collapsed,
        maximized: !!spec.maximized,
        _rect: spec._rect,
        el: null,
      };
      this.zTop = Math.max(this.zTop, f.z);
      this.frames.push(f);
      this._buildFrameEl(f);
    }

    const placed = new Set<string>([
      ...this.frames.flatMap((f) => f.tabs),
      ...this.tray,
    ]);
    for (const id of this.panels.keys()) {
      if (!placed.has(id)) this.tray.push(id);
    }
    this._clampAll();
  }

  // ── frame DOM ────────────────────────────────────────────────────────────
  private _buildFrameEl(f: FrameRuntime): void {
    if (!this.surface || !this.overlay) return;
    const el = document.createElement("div");
    el.className = "ws-frame";
    el.dataset.frame = f.id;
    el.innerHTML = `
      <div class="ws-head">
        <div class="ws-tabs"></div>
        <div class="ws-ctrls">
          <button class="ws-btn" data-act="collapse" title="Collapse">–</button>
          <button class="ws-btn" data-act="max" title="Maximize">▢</button>
          <button class="ws-btn" data-act="close" title="Close">×</button>
        </div>
      </div>
      <div class="ws-bodies"></div>
      <div class="ws-resize n"></div><div class="ws-resize s"></div>
      <div class="ws-resize e"></div><div class="ws-resize w"></div>
      <div class="ws-resize ne"></div><div class="ws-resize nw"></div>
      <div class="ws-resize se"></div><div class="ws-resize sw"></div>`;
    f.el = el;
    this.surface.insertBefore(el, this.overlay);
    this._syncFrame(f);
    this._wireFrame(f);
    this._renderTabs(f);
    this._mountActive(f);
  }

  private _removeFrameEl(f: FrameRuntime): void {
    for (const id of f.tabs) {
      const b = this.bodies.get(id);
      if (b && this.cache) this.cache.appendChild(b);
    }
    f.el?.remove();
    const i = this.frames.indexOf(f);
    if (i >= 0) this.frames.splice(i, 1);
  }

  private _syncFrame(f: FrameRuntime): void {
    const el = f.el;
    if (!el) return;
    el.style.left = `${f.x}px`;
    el.style.top = `${f.y}px`;
    el.style.width = `${f.w}px`;
    el.style.height = `${f.collapsed ? HEADER : f.h}px`;
    el.style.zIndex = String(f.z);
    el.classList.toggle("collapsed", f.collapsed);
    el.classList.toggle("maximized", f.maximized);
  }

  private _ensureBody(id: string): HTMLDivElement {
    let b = this.bodies.get(id);
    if (!b) {
      b = document.createElement("div");
      b.className = "ws-body";
      b.dataset.panel = id;
      this.bodies.set(id, b);
    }
    return b;
  }

  private _mountActive(f: FrameRuntime): void {
    const host = f.el?.querySelector<HTMLDivElement>(".ws-bodies");
    if (!host) return;
    for (const id of f.tabs) {
      const body = this._ensureBody(id);
      if (body.parentElement !== host) host.appendChild(body);
      body.style.display = id === f.active ? "" : "none";
      this.mounted.add(id);
    }
    this._fireResize(f.active);
    const panel = this.panels.get(f.active);
    const activeBody = this.bodies.get(f.active);
    if (panel?.onActivate && activeBody) panel.onActivate(activeBody);
  }

  private _renderTabs(f: FrameRuntime): void {
    const tabs = f.el?.querySelector<HTMLDivElement>(".ws-tabs");
    if (!tabs) return;
    tabs.innerHTML = "";
    for (const id of f.tabs) {
      const p = this.panels.get(id);
      if (!p) continue;
      const t = document.createElement("button");
      t.className = `ws-tab${id === f.active ? " on" : ""}`;
      t.dataset.panel = id;
      const ico = p.icon ? `<span class="ws-tab-ico">${p.icon}</span>` : "";
      t.innerHTML = `${ico}<span class="ws-tab-lbl"></span>`;
      const lbl = t.querySelector<HTMLSpanElement>(".ws-tab-lbl");
      if (lbl) lbl.textContent = p.title;
      if (f.tabs.length > 1) {
        const x = document.createElement("span");
        x.className = "ws-tab-x";
        x.textContent = "×";
        x.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this._closeTab(f, id);
        });
        t.appendChild(x);
      }
      tabs.appendChild(t);
      t.addEventListener("pointerdown", (ev) => this._tabPointerDown(ev, f, id));
    }
  }

  // ── interactions ─────────────────────────────────────────────────────────
  private _wireFrame(f: FrameRuntime): void {
    const el = f.el;
    if (!el) return;
    el.addEventListener("pointerdown", () => this._focus(f), true);
    const head = el.querySelector<HTMLDivElement>(".ws-head");
    if (head) {
      head.addEventListener("pointerdown", (ev) => {
        const target = ev.target as HTMLElement;
        if (target.closest(".ws-btn") || target.closest(".ws-tab")) return;
        this._startMove(ev, f);
      });
      head.addEventListener("dblclick", (ev) => {
        const target = ev.target as HTMLElement;
        if (!target.closest(".ws-btn") && !target.closest(".ws-tab")) this._toggleMax(f);
      });
    }
    el.querySelectorAll<HTMLButtonElement>(".ws-btn").forEach((b) => {
      b.addEventListener("pointerdown", (ev) => ev.stopPropagation());
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const act = b.dataset.act;
        if (act === "collapse") this._toggleCollapse(f);
        else if (act === "max") this._toggleMax(f);
        else if (act === "close") this._closeFrame(f);
      });
    });
    el.querySelectorAll<HTMLDivElement>(".ws-resize").forEach((h) => {
      const dir = h.classList[1];
      h.addEventListener("pointerdown", (ev) => this._startResize(ev, f, dir));
    });
  }

  private _focus(f: FrameRuntime): void {
    if (f.z === this.zTop) return;
    this.zTop += 1;
    f.z = this.zTop;
    this._syncFrame(f);
    this._save();
  }

  private _tabPointerDown(ev: PointerEvent, f: FrameRuntime, id: string): void {
    ev.stopPropagation();
    this._focus(f);
    if (f.active !== id) {
      f.active = id;
      this._renderTabs(f);
      this._showActiveBody(f);
      this._save();
    }
    const startX = ev.clientX;
    const startY = ev.clientY;
    let detached = false;
    let moveState: MoveSession | null = null;
    const onMove = (e: PointerEvent) => {
      if (!detached && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
        detached = true;
        if (f.tabs.length === 1) {
          moveState = this._beginMove(f, e);
        } else {
          const nf = this._detach(f, id, e);
          moveState = this._beginMove(nf, e);
        }
      }
      moveState?.move(e);
    };
    const onUp = (e: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      moveState?.up(e);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  private _detach(f: FrameRuntime, id: string, ev: PointerEvent): FrameRuntime {
    if (!this.surface) throw new Error("workspace not attached");
    const rect = this.surface.getBoundingClientRect();
    f.tabs = f.tabs.filter((t) => t !== id);
    if (f.active === id) f.active = f.tabs[0];
    this._renderTabs(f);
    this._showActiveBody(f);
    this.zTop += 1;
    const nf: FrameRuntime = {
      id: uid(),
      x: ev.clientX - rect.left - 60,
      y: ev.clientY - rect.top - HEADER / 2,
      w: Math.max(f.w, 320),
      h: Math.max(f.h, 260),
      z: this.zTop,
      tabs: [id],
      active: id,
      collapsed: false,
      maximized: false,
      el: null,
    };
    this.frames.push(nf);
    this._buildFrameEl(nf);
    return nf;
  }

  private _showActiveBody(f: FrameRuntime): void {
    for (const id of f.tabs) {
      const b = this.bodies.get(id);
      if (b) b.style.display = id === f.active ? "" : "none";
    }
    this._fireResize(f.active);
    const p = this.panels.get(f.active);
    const body = this.bodies.get(f.active);
    if (p?.onActivate && body) p.onActivate(body);
  }

  private _startMove(ev: PointerEvent, f: FrameRuntime): void {
    this._focus(f);
    const st = this._beginMove(f, ev);
    const onMove = (e: PointerEvent) => st.move(e);
    const onUp = (e: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      st.up(e);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  private _beginMove(f: FrameRuntime, ev: PointerEvent): MoveSession {
    if (!this.surface) throw new Error("workspace not attached");
    if (f.maximized) this._toggleMax(f);
    const rect = this.surface.getBoundingClientRect();
    const offX = ev.clientX - rect.left - f.x;
    const offY = ev.clientY - rect.top - f.y;
    f.el?.classList.add("dragging");
    let dock: DockTarget | null = null;
    return {
      move: (e) => {
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const snapped = this._snapMove(f, px - offX, py - offY);
        f.x = snapped.x;
        f.y = snapped.y;
        if (f.el) {
          f.el.style.left = `${f.x}px`;
          f.el.style.top = `${f.y}px`;
        }
        dock = this._dockHint(f, px, py);
      },
      up: () => {
        f.el?.classList.remove("dragging");
        this._clearDockHint();
        if (dock) this._applyDock(f, dock);
        this._clamp(f);
        this._syncFrame(f);
        this._save();
      },
    };
  }

  private _snapMove(f: FrameRuntime, x: number, y: number): { x: number; y: number } {
    if (!this.surface) return { x, y };
    const W = this.surface.clientWidth;
    const H = this.surface.clientHeight;
    const targetsX: number[] = [0, W - f.w, (W - f.w) / 2];
    const targetsY: number[] = [0, H - f.h, (H - f.h) / 2];
    for (const o of this.frames) {
      if (o === f) continue;
      targetsX.push(o.x, o.x + o.w - f.w, o.x + o.w, o.x - f.w);
      targetsY.push(o.y, o.y + o.h - f.h, o.y + o.h, o.y - f.h);
    }
    let bx = x;
    let by = y;
    for (const t of targetsX) if (Math.abs(x - t) < SNAP) bx = t;
    for (const t of targetsY) if (Math.abs(y - t) < SNAP) by = t;
    return { x: bx, y: by };
  }

  private _dockHint(f: FrameRuntime, px: number, py: number): DockTarget | null {
    let target: FrameRuntime | null = null;
    for (let i = this.frames.length - 1; i >= 0; i -= 1) {
      const o = this.frames[i];
      if (o === f) continue;
      if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) {
        target = o;
        break;
      }
    }
    if (!target) {
      this._clearDockHint();
      return null;
    }
    const rx = (px - target.x) / target.w;
    const ry = (py - target.y) / target.h;
    let zone: Zone;
    if (py - target.y < HEADER + 6) zone = "tab";
    else if (rx < 0.25) zone = "left";
    else if (rx > 0.75) zone = "right";
    else if (ry < 0.28) zone = "top";
    else if (ry > 0.72) zone = "bottom";
    else zone = "tab";
    this._drawDockHint(target, zone);
    return { target, zone };
  }

  private _drawDockHint(target: FrameRuntime, zone: Zone): void {
    this._clearDockHint();
    if (!this.overlay) return;
    const d = document.createElement("div");
    d.className = "ws-dockhint";
    let { x, y, w, h } = target;
    if (zone === "left") w = target.w / 2;
    else if (zone === "right") {
      x = target.x + target.w / 2;
      w = target.w / 2;
    } else if (zone === "top") h = target.h / 2;
    else if (zone === "bottom") {
      y = target.y + target.h / 2;
      h = target.h / 2;
    }
    d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    d.dataset.zone = zone;
    if (zone === "tab") d.classList.add("tabzone");
    this.overlay.appendChild(d);
    this._dockEl = d;
  }

  private _clearDockHint(): void {
    this._dockEl?.remove();
    this._dockEl = null;
  }

  private _applyDock(f: FrameRuntime, dock: DockTarget): void {
    const { target, zone } = dock;
    if (zone === "tab") {
      target.tabs = target.tabs.concat(f.tabs);
      target.active = f.active;
      this._removeFrameEl(f);
      this._renderTabs(target);
      this._mountActive(target);
      this._focus(target);
      return;
    }
    const G = SPLIT_GUTTER;
    if (zone === "left") {
      f.x = target.x;
      f.y = target.y;
      f.w = target.w / 2 - G / 2;
      f.h = target.h;
      target.x = target.x + target.w / 2 + G / 2;
      target.w = target.w / 2 - G / 2;
    } else if (zone === "right") {
      f.w = target.w / 2 - G / 2;
      f.h = target.h;
      f.y = target.y;
      f.x = target.x + target.w / 2 + G / 2;
      target.w = target.w / 2 - G / 2;
    } else if (zone === "top") {
      f.x = target.x;
      f.y = target.y;
      f.w = target.w;
      f.h = target.h / 2 - G / 2;
      target.y = target.y + target.h / 2 + G / 2;
      target.h = target.h / 2 - G / 2;
    } else {
      // bottom
      f.x = target.x;
      f.w = target.w;
      f.h = target.h / 2 - G / 2;
      f.y = target.y + target.h / 2 + G / 2;
      target.h = target.h / 2 - G / 2;
    }
    this._syncFrame(target);
    this._fireResize(target.active);
    this._syncFrame(f);
    this._fireResize(f.active);
  }

  private _startResize(ev: PointerEvent, f: FrameRuntime, dir: string): void {
    ev.stopPropagation();
    this._focus(f);
    if (f.maximized || !this.surface) return;
    const sx = ev.clientX;
    const sy = ev.clientY;
    const o = { x: f.x, y: f.y, w: f.w, h: f.h };
    const W = this.surface.clientWidth;
    const H = this.surface.clientHeight;
    f.el?.classList.add("resizing");
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      let x = o.x;
      let y = o.y;
      let w = o.w;
      let h = o.h;
      if (dir.includes("e")) w = Math.max(MIN_W, o.w + dx);
      if (dir.includes("s")) h = Math.max(MIN_H, o.h + dy);
      if (dir.includes("w")) {
        w = Math.max(MIN_W, o.w - dx);
        x = o.x + (o.w - w);
      }
      if (dir.includes("n")) {
        h = Math.max(MIN_H, o.h - dy);
        y = o.y + (o.h - h);
      }
      if (dir.includes("e") && Math.abs(x + w - W) < SNAP) w = W - x;
      if (dir.includes("s") && Math.abs(y + h - H) < SNAP) h = H - y;
      if (dir.includes("w") && Math.abs(x) < SNAP) {
        w += x;
        x = 0;
      }
      if (dir.includes("n") && Math.abs(y) < SNAP) {
        h += y;
        y = 0;
      }
      for (const g of this.frames) {
        if (g === f) continue;
        if (dir.includes("e") && Math.abs(x + w - g.x) < SNAP) w = g.x - x;
        if (dir.includes("w") && Math.abs(x - (g.x + g.w)) < SNAP) {
          const nx = g.x + g.w;
          w += x - nx;
          x = nx;
        }
        if (dir.includes("s") && Math.abs(y + h - g.y) < SNAP) h = g.y - y;
        if (dir.includes("n") && Math.abs(y - (g.y + g.h)) < SNAP) {
          const ny = g.y + g.h;
          h += y - ny;
          y = ny;
        }
      }
      f.x = x;
      f.y = y;
      f.w = w;
      f.h = h;
      this._syncFrame(f);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      f.el?.classList.remove("resizing");
      this._fireResize(f.active);
      this._save();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  private _toggleCollapse(f: FrameRuntime): void {
    f.collapsed = !f.collapsed;
    this._syncFrame(f);
    if (!f.collapsed) this._fireResize(f.active);
    this._save();
  }

  private _toggleMax(f: FrameRuntime): void {
    if (!this.surface) return;
    if (f.maximized) {
      if (f._rect) Object.assign(f, f._rect);
      f.maximized = false;
    } else {
      f._rect = { x: f.x, y: f.y, w: f.w, h: f.h };
      f.x = 6;
      f.y = 6;
      f.w = this.surface.clientWidth - 12;
      f.h = this.surface.clientHeight - 12;
      f.maximized = true;
      this.zTop += 1;
      f.z = this.zTop;
    }
    this._syncFrame(f);
    this._fireResize(f.active);
    this._save();
  }

  private _closeTab(f: FrameRuntime, id: string): void {
    f.tabs = f.tabs.filter((t) => t !== id);
    this.tray.push(id);
    const b = this.bodies.get(id);
    if (b && this.cache) this.cache.appendChild(b);
    if (f.tabs.length === 0) {
      this._removeFrameEl(f);
    } else {
      if (f.active === id) f.active = f.tabs[0];
      this._renderTabs(f);
      this._showActiveBody(f);
    }
    this._save();
    this.cb.onTrayChange();
  }

  private _closeFrame(f: FrameRuntime): void {
    for (const id of f.tabs) {
      this.tray.push(id);
      const b = this.bodies.get(id);
      if (b && this.cache) this.cache.appendChild(b);
    }
    this._removeFrameEl(f);
    this._save();
    this.cb.onTrayChange();
  }

  // ── public-ish API (called via React ref) ────────────────────────────────
  openPanel(id: string): void {
    if (!this.surface || !this.panels.has(id)) return;
    const ex = this.frames.find((f) => f.tabs.includes(id));
    if (ex) {
      ex.active = id;
      this._renderTabs(ex);
      this._showActiveBody(ex);
      this._focus(ex);
      this.cb.onTrayChange();
      return;
    }
    this.tray = this.tray.filter((t) => t !== id);
    const n = this.frames.length;
    this.zTop += 1;
    const f: FrameRuntime = {
      id: uid(),
      x: 80 + n * 26,
      y: 70 + n * 26,
      w: 360,
      h: 300,
      z: this.zTop,
      tabs: [id],
      active: id,
      collapsed: false,
      maximized: false,
      el: null,
    };
    this.frames.push(f);
    this._buildFrameEl(f);
    this._clamp(f);
    this._save();
    this.cb.onTrayChange();
  }

  closePanel(id: string): void {
    const f = this.frames.find((fr) => fr.tabs.includes(id));
    if (!f) return;
    this._closeTab(f, id);
  }

  setTitle(id: string, title: string): void {
    const p = this.panels.get(id);
    if (!p) return;
    p.title = title;
    const f = this.frames.find((fr) => fr.tabs.includes(id));
    if (f) this._renderTabs(f);
    this.cb.onTrayChange();
  }

  isPlaced(id: string): boolean {
    return this.frames.some((f) => f.tabs.includes(id));
  }

  trayPanels(): { id: string; title: string; icon?: string }[] {
    const out: { id: string; title: string; icon?: string }[] = [];
    for (const id of this.tray) {
      const p = this.panels.get(id);
      if (!p) continue;
      const entry: { id: string; title: string; icon?: string } = { id, title: p.title };
      if (p.icon !== undefined) entry.icon = p.icon;
      out.push(entry);
    }
    return out;
  }

  refreshAll(): void {
    for (const f of this.frames) this._fireResize(f.active);
  }

  private _anywherePlaced(id: string): boolean {
    return this.frames.some((f) => f.tabs.includes(id)) || this.tray.includes(id);
  }

  private _fireResize(id: string): void {
    const p = this.panels.get(id);
    const b = this.bodies.get(id);
    if (p?.onResize && b) requestAnimationFrame(() => p.onResize?.(b));
  }

  private _clamp(f: FrameRuntime): void {
    if (!this.surface) return;
    const W = this.surface.clientWidth;
    const H = this.surface.clientHeight;
    f.w = Math.min(f.w, W);
    f.h = Math.min(f.h, H);
    f.x = Math.max(0, Math.min(f.x, W - Math.min(f.w, 80)));
    f.y = Math.max(0, Math.min(f.y, H - HEADER));
    this._syncFrame(f);
  }

  private _clampAll(): void {
    for (const f of this.frames) this._clamp(f);
  }

  private _reflowInBounds(): void {
    this._clampAll();
    this.refreshAll();
  }
}

// React surface ─────────────────────────────────────────────────────────────
//
// The engine is created once per Workspace instance. Each registered panel's
// `render(host)` output is portaled into its long-lived body element; the body
// element is reparented by the engine but never destroyed, so React's tree is
// stable across every dock/drag/tab/split.

export const Workspace = forwardRef<WorkspaceApi, WorkspaceProps>(function Workspace(
  props,
  ref,
) {
  const { panels, defaultLayout, lsKey, onChange } = props;
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  // Use a tick to force re-render of portals when tray contents change, so
  // consumers reading via trayPanels() see fresh data. Layout changes already
  // flow through the imperative DOM updates inside the engine.
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const engine = useMemo(() => {
    return new WorkspaceEngine(lsKey, defaultLayout, {
      onLayoutChange: () => {
        onChange?.(engineHandle.current?.serialize() ?? { frames: [], tray: [] });
      },
      onTrayChange: bump,
    });
    // lsKey and defaultLayout are expected to be stable for the workspace's
    // lifetime; treating them as init-time wins keeps the engine identity stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hold a stable handle to the engine for the onLayoutChange closure above.
  const engineHandle = useRef<WorkspaceEngine | null>(null);
  engineHandle.current = engine;

  // Register panels eagerly so their body elements exist before portals render.
  // Panels are stable for the workspace lifetime per the public contract.
  const registeredOnce = useRef(false);
  if (!registeredOnce.current) {
    for (const p of panels) engine.register(p);
    registeredOnce.current = true;
  } else {
    engine.setPanels(panels);
  }

  useLayoutEffect(() => {
    if (!surfaceRef.current) return;
    engine.attach(surfaceRef.current);
    return () => engine.detach();
  }, [engine]);

  useEffect(() => {
    // After attach, repaint once so portals see freshly created body elements.
    bump();
  }, [bump]);

  useImperativeHandle(
    ref,
    (): WorkspaceApi => ({
      openPanel: (id) => engine.openPanel(id),
      closePanel: (id) => engine.closePanel(id),
      setTitle: (id, title) => engine.setTitle(id, title),
      isPlaced: (id) => engine.isPlaced(id),
      trayPanels: () => engine.trayPanels(),
      reset: () => engine.reset(),
      refreshAll: () => engine.refreshAll(),
    }),
    [engine],
  );

  return (
    <div ref={surfaceRef} className="ws-surface">
      {panels.map((p) => {
        const host = engine.bodies.get(p.id);
        if (!host) return null;
        return <PanelPortal key={p.id} panel={p} host={host} />;
      })}
    </div>
  );
});

function PanelPortal({ panel, host }: { panel: PanelDef; host: HTMLElement }) {
  const node = panel.render(host);
  return node ? createPortal(node, host) : null;
}
