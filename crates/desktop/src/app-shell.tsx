import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasPanel,
  InspectorPanel,
  LayersPanel,
  OutlinerPanel,
  SpecPanel,
} from "./panels";
import "./panels/panels.css";
import { setView, useView, type ViewId } from "./state/app-store";
import { TitleBar } from "./title-bar";
import { Workspace, type PanelDef, type WorkspaceApi, type WorkspaceLayout } from "./workspace/Workspace";
import type { ViewHandle } from "./viz";
import "./app-shell.css";

const VIEW_LABELS: Record<ViewId, string> = {
  domain: "Domain",
  data: "Data",
  flow: "Flows",
  arch: "Architecture",
  ux: "UX",
};

interface RailItem {
  id: ViewId;
  icon: string;
  key: string;
  on: boolean;
}

const RAIL: RailItem[] = [
  { id: "domain", icon: "◐", key: "DOM", on: true },
  { id: "data", icon: "⊟", key: "ERD", on: true },
  { id: "flow", icon: "≋", key: "FLOW", on: true },
  { id: "arch", icon: "▤", key: "ARCH", on: false },
  { id: "ux", icon: "⇄", key: "UX", on: false },
];

interface PanelMetaEntry {
  id: string;
  title: string;
  icon: string;
}

const PANEL_META: PanelMetaEntry[] = [
  { id: "canvas", title: "Canvas", icon: "◧" },
  { id: "outliner", title: "Outliner", icon: "☰" },
  { id: "inspector", title: "Inspector", icon: "◳" },
  { id: "layers", title: "Layers", icon: "▦" },
  { id: "spec", title: "Spec", icon: "⌗" },
];

function defaultLayout(size: { w: number; h: number }): WorkspaceLayout {
  const W = Math.max(640, size.w || 1100);
  const H = Math.max(380, size.h || 640);
  const g = 12;
  const L = 232;
  const R = 300;
  return {
    frames: [
      {
        id: "f-ol",
        x: g,
        y: g,
        w: L,
        h: H - 2 * g,
        z: 11,
        tabs: ["outliner"],
        active: "outliner",
        collapsed: false,
        maximized: false,
      },
      {
        id: "f-cv",
        x: L + 2 * g,
        y: g,
        w: Math.max(280, W - L - R - 4 * g),
        h: H - 2 * g,
        z: 12,
        tabs: ["canvas"],
        active: "canvas",
        collapsed: false,
        maximized: false,
      },
      {
        id: "f-insp",
        x: W - R - g,
        y: g,
        w: R,
        h: H - 2 * g,
        z: 11,
        tabs: ["inspector"],
        active: "inspector",
        collapsed: false,
        maximized: false,
      },
    ],
    tray: ["layers", "spec"],
  };
}

export function AppShell() {
  const view = useView();
  const wsRef = useRef<WorkspaceApi>(null);
  const canvasApiRef = useRef<ViewHandle | null>(null);

  // Engine layout-mutation tick — used by both the rail's "placed" hint
  // and the add-panel menu so they stay in sync with drag/tab/split/close
  // events without polling the workspace API on every render.
  const [layoutTick, setLayoutTick] = useState(0);
  const bumpLayout = useCallback(() => setLayoutTick((t) => t + 1), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // The PanelDef list is stable for the workspace's lifetime — render
  // closures capture refs (canvasApiRef, wsRef) so updates land naturally.
  const panels: PanelDef[] = useMemo(
    () => [
      {
        id: "canvas",
        title: PANEL_META[0].title,
        icon: PANEL_META[0].icon,
        render: () => <CanvasPanel apiRef={canvasApiRef} />,
        onActivate: () => canvasApiRef.current?.fit(),
        onResize: () => canvasApiRef.current?.fit(),
      },
      {
        id: "outliner",
        title: PANEL_META[1].title,
        icon: PANEL_META[1].icon,
        render: () => <OutlinerPanel />,
      },
      {
        id: "inspector",
        title: PANEL_META[2].title,
        icon: PANEL_META[2].icon,
        render: () => <InspectorPanel />,
      },
      {
        id: "layers",
        title: PANEL_META[3].title,
        icon: PANEL_META[3].icon,
        render: () => <LayersPanel />,
      },
      {
        id: "spec",
        title: PANEL_META[4].title,
        icon: PANEL_META[4].icon,
        render: () => <SpecPanel />,
      },
    ],
    [],
  );

  // Canvas tab label follows the active view name.
  useEffect(() => {
    wsRef.current?.setTitle("canvas", VIEW_LABELS[view]);
  }, [view]);

  // Outside-click closes the add-panel menu. The buttons that toggle it
  // stop propagation themselves, so this only fires for real outside hits.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (ev: MouseEvent): void => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".ws-menu") || target.closest('[aria-haspopup="menu"]') || target.closest('[title="Panels"]')) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const onAddPanel = useCallback(
    (id: string) => {
      wsRef.current?.openPanel(id);
      closeMenu();
    },
    [closeMenu],
  );

  const onResetLayout = useCallback(() => {
    wsRef.current?.reset();
    closeMenu();
  }, [closeMenu]);

  const isPlaced = useCallback(
    (id: string) => wsRef.current?.isPlaced(id) ?? false,
    // layoutTick keeps this fresh after each onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutTick],
  );

  const menuNode = (
    <AddPanelMenu
      panels={PANEL_META}
      isPlaced={isPlaced}
      onPick={onAddPanel}
      onReset={onResetLayout}
      onClose={closeMenu}
    />
  );

  return (
    <div className="shell">
      <TitleBar
        projectLabel="atlas-stays"
        addPanel={{ open: menuOpen, onToggle: toggleMenu, menu: menuNode }}
        onResetLayout={onResetLayout}
      />

      <div className="shell-body">
        <nav className="rail">
          {RAIL.map((r) => {
            const active = r.id === view;
            return (
              <button
                key={r.id}
                type="button"
                className={`rail-item${active ? " active" : ""}`}
                style={{
                  opacity: r.on ? 1 : 0.4,
                  cursor: r.on ? "pointer" : "not-allowed",
                }}
                title={r.on ? VIEW_LABELS[r.id] : `${r.id} · soon`}
                onClick={() => {
                  if (r.on) setView(r.id);
                }}
                disabled={!r.on}
              >
                <span className="ico">{r.icon}</span>
                <span className="rk">{r.key}</span>
              </button>
            );
          })}
          <div className="rail-grow" />
          <div className="rail-sep" />
          <button
            type="button"
            className="rail-item"
            title="Settings"
            onClick={() => {
              /* PR7: settings drawer */
            }}
          >
            <span className="ico">⚙</span>
          </button>
          <button
            type="button"
            className="rail-item"
            title="Panels"
            onClick={toggleMenu}
          >
            <span className="ico">◫</span>
          </button>
        </nav>

        <Workspace
          ref={wsRef}
          panels={panels}
          defaultLayout={defaultLayout}
          lsKey="tessera.workspace.v2"
          onChange={bumpLayout}
        />
      </div>

      <footer className="statusbar">
        <div className="grp">
          <span className="it">
            <span className="status-dot status-dot-healthy" /> graph healthy
          </span>
          <span>
            cascade · 7 frozen ·{" "}
            <span className="drift-text">1 drift</span>
          </span>
        </div>
        <span>
          {view}@atlas-stays · rev 042 · synced 12s ago
        </span>
        <span className="it">
          <span className="status-dot status-dot-agent" /> haiku-4-5 · idle
        </span>
      </footer>
    </div>
  );
}

interface AddPanelMenuProps {
  panels: PanelMetaEntry[];
  isPlaced: (id: string) => boolean;
  onPick: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}

function AddPanelMenu({ panels, isPlaced, onPick, onReset, onClose }: AddPanelMenuProps) {
  // Re-subscribe on layoutTick by reading isPlaced inside the render — the
  // parent owns the tick. Stop click propagation so the global outside-click
  // handler doesn't immediately close us.
  // useSyncExternalStore here would be overkill for a render-pass refresh.

  return (
    <div
      className="ws-menu"
      role="menu"
      onClick={(ev) => ev.stopPropagation()}
    >
      {panels.map((p) => {
        const placed = isPlaced(p.id);
        return (
          <button
            type="button"
            key={p.id}
            className={`mi${placed ? " placed" : ""}`}
            disabled={placed}
            onClick={() => {
              if (placed) return;
              onPick(p.id);
            }}
          >
            <span className="gl">{p.icon}</span>
            <span>{p.title}</span>
            {placed ? <span className="mi-tag">placed</span> : null}
          </button>
        );
      })}
      <div className="sep" />
      <button
        type="button"
        className="mi"
        onClick={() => {
          onReset();
          onClose();
        }}
      >
        <span className="gl">⟲</span>
        <span>Reset layout</span>
      </button>
    </div>
  );
}

