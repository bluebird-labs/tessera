/**
 * Tessera desktop · global app-store
 *
 * Single source of truth for selection and view state. Components subscribe
 * via the React hooks at the bottom of the file; mutations go through the
 * action functions. Mirrors the behaviour of `crates/desktop/design/diagrams/
 * app.js` so the shipping app matches the design reference.
 */

import { useSyncExternalStore } from "react";

export type ViewId = "domain" | "data" | "flow" | "arch" | "ux";

export interface AppState {
  view: ViewId;
  selected: string | null;
  pinned: ReadonlySet<string>;
  layout: Readonly<Record<ViewId, string | null>>;
  filters: Readonly<Record<ViewId, ReadonlySet<string>>>;
  largeGraph: boolean;
}

const VIEW_IDS: readonly ViewId[] = ["domain", "data", "flow", "arch", "ux"];

const STORAGE_KEYS = {
  view: "tessera.view",
  layout: "tessera.layout",
  filters: "tessera.filters",
} as const;

function isViewId(value: unknown): value is ViewId {
  return typeof value === "string" && (VIEW_IDS as readonly string[]).includes(value);
}

function emptyLayout(): Record<ViewId, string | null> {
  return { domain: null, data: null, flow: null, arch: null, ux: null };
}

function emptyFilters(): Record<ViewId, ReadonlySet<string>> {
  return {
    domain: new Set<string>(),
    data: new Set<string>(),
    flow: new Set<string>(),
    arch: new Set<string>(),
    ux: new Set<string>(),
  };
}

function initialState(): AppState {
  return {
    view: "domain",
    selected: null,
    pinned: new Set<string>(),
    layout: emptyLayout(),
    filters: emptyFilters(),
    largeGraph: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────

function safeGetStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function loadView(): ViewId {
  const raw = safeGetStorage()?.getItem(STORAGE_KEYS.view);
  return isViewId(raw) ? raw : "domain";
}

function loadLayout(): Record<ViewId, string | null> {
  const out = emptyLayout();
  const raw = safeGetStorage()?.getItem(STORAGE_KEYS.layout);
  if (!raw) return out;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return out;
    for (const id of VIEW_IDS) {
      const value = (parsed as Record<string, unknown>)[id];
      if (typeof value === "string") out[id] = value;
      else if (value === null) out[id] = null;
    }
  } catch {
    /* bad JSON — fall through to defaults */
  }
  return out;
}

function loadFilters(): Record<ViewId, ReadonlySet<string>> {
  const out = emptyFilters();
  const raw = safeGetStorage()?.getItem(STORAGE_KEYS.filters);
  if (!raw) return out;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return out;
    for (const id of VIEW_IDS) {
      const value = (parsed as Record<string, unknown>)[id];
      if (Array.isArray(value)) {
        out[id] = new Set(value.filter((v): v is string => typeof v === "string"));
      }
    }
  } catch {
    /* bad JSON — fall through to defaults */
  }
  return out;
}

function loadInitial(): AppState {
  return {
    ...initialState(),
    view: loadView(),
    layout: loadLayout(),
    filters: loadFilters(),
  };
}

function persistView(view: ViewId): void {
  safeGetStorage()?.setItem(STORAGE_KEYS.view, view);
}

function persistLayout(layout: Readonly<Record<ViewId, string | null>>): void {
  safeGetStorage()?.setItem(STORAGE_KEYS.layout, JSON.stringify(layout));
}

function persistFilters(filters: Readonly<Record<ViewId, ReadonlySet<string>>>): void {
  const serialisable: Record<ViewId, string[]> = {
    domain: [...filters.domain],
    data: [...filters.data],
    flow: [...filters.flow],
    arch: [...filters.arch],
    ux: [...filters.ux],
  };
  safeGetStorage()?.setItem(STORAGE_KEYS.filters, JSON.stringify(serialisable));
}

// ─────────────────────────────────────────────────────────────────────────────
// Store core
// ─────────────────────────────────────────────────────────────────────────────

let state: AppState = loadInitial();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const l of listeners) l();
}

function setState(next: AppState): void {
  state = next;
  notify();
}

export function getState(): AppState {
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

export function select(id: string | null): void {
  const nextSelected = id === null ? null : state.selected === id ? null : id;
  if (nextSelected === state.selected) return;
  setState({ ...state, selected: nextSelected });
}

export function setView(id: ViewId): void {
  if (state.view === id && state.selected === null) {
    return;
  }
  persistView(id);
  setState({ ...state, view: id, selected: null });
}

export function setLayout(view: ViewId, layout: string | null): void {
  if (state.layout[view] === layout) return;
  const nextLayout = { ...state.layout, [view]: layout };
  persistLayout(nextLayout);
  setState({ ...state, layout: nextLayout });
}

export function toggleFilter(view: ViewId, type: string): void {
  const current = state.filters[view];
  const next = new Set(current);
  if (next.has(type)) next.delete(type);
  else next.add(type);
  const nextFilters = { ...state.filters, [view]: next };
  persistFilters(nextFilters);
  setState({ ...state, filters: nextFilters });
}

export function togglePin(id: string): void {
  const next = new Set(state.pinned);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  setState({ ...state, pinned: next });
}

export function clearPins(): void {
  if (state.pinned.size === 0) return;
  setState({ ...state, pinned: new Set<string>() });
}

export function setLargeGraph(on: boolean): void {
  if (state.largeGraph === on) return;
  setState({ ...state, largeGraph: on });
}

export function reset(): void {
  const fresh = initialState();
  // persistent slices reset on disk too, so reload from a clean state matches.
  persistView(fresh.view);
  persistLayout(fresh.layout);
  persistFilters(fresh.filters);
  setState(fresh);
}

// ─────────────────────────────────────────────────────────────────────────────
// React hooks (slice subscriptions)
// ─────────────────────────────────────────────────────────────────────────────

export function useSelected(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => state.selected,
    () => state.selected,
  );
}

export function useView(): ViewId {
  return useSyncExternalStore(
    subscribe,
    () => state.view,
    () => state.view,
  );
}

export function useLayout(view: ViewId): string | null {
  return useSyncExternalStore(
    subscribe,
    () => state.layout[view],
    () => state.layout[view],
  );
}

export function useFilters(view: ViewId): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribe,
    () => state.filters[view],
    () => state.filters[view],
  );
}

export function usePinned(): ReadonlySet<string> {
  return useSyncExternalStore(
    subscribe,
    () => state.pinned,
    () => state.pinned,
  );
}

export function useLargeGraph(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => state.largeGraph,
    () => state.largeGraph,
  );
}

// Test-only escape hatch: lets a runner re-seed the module between cases
// without resorting to module reloading. Mirrors `reset()` but skips
// persistence so tests stay hermetic.
export const __test = {
  resetForTests(): void {
    state = initialState();
    notify();
  },
  subscribe,
};

/* ───────────────────────────────────────────────────────────────────────────
 * Smoke test (no runner is wired in this workspace yet — see package.json).
 * Run manually with `pnpm -C crates/desktop exec tsx -e "$(cat <<'EOF'
 *   import * as s from './src/state/app-store.ts';
 *   s.__test.resetForTests();
 *   s.select('a'); console.assert(s.getState().selected === 'a');
 *   s.select('a'); console.assert(s.getState().selected === null);   // toggle off
 *   s.select('b'); s.setView('data');
 *   console.assert(s.getState().view === 'data' && s.getState().selected === null);
 *   s.toggleFilter('domain', 'aggregate');
 *   console.assert(s.getState().filters.domain.has('aggregate'));
 *   s.toggleFilter('domain', 'aggregate');
 *   console.assert(!s.getState().filters.domain.has('aggregate'));
 *   s.togglePin('x'); console.assert(s.getState().pinned.has('x'));
 *   s.togglePin('x'); console.assert(!s.getState().pinned.has('x'));
 *   s.reset();
 *   const st = s.getState();
 *   console.assert(st.view === 'domain' && st.selected === null
 *     && st.pinned.size === 0 && !st.largeGraph
 *     && st.layout.domain === null && st.filters.domain.size === 0);
 *   console.log('app-store smoke OK');
 * EOF
 * )"`.
 * ─────────────────────────────────────────────────────────────────────────── */
