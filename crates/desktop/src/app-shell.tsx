import { useLayoutEffect, useRef, useState } from "react";
import { ViewDomain, ViewData, ViewFlow } from "./viz";
import { ATLAS } from "./viz/data";
import {
  setView,
  useSelected,
  useView,
  type ViewId,
} from "./state/app-store";
import { TYPE } from "./viz/viz-core";
import { TitleBar } from "./title-bar";
import "./app-shell.css";

type RailItem =
  | { id: ViewId; icon: string; label: string; disabled?: boolean; group: "top" }
  | { id: string; icon: string; label: string; disabled?: boolean; group: "bottom"; action?: () => void };

const RAIL_ITEMS: RailItem[] = [
  { id: "domain", icon: "◐", label: "Domain", group: "top" },
  { id: "data",   icon: "⊟", label: "Data · ERD", group: "top" },
  { id: "flow",   icon: "≋", label: "Flows", group: "top" },
  { id: "arch",   icon: "▤", label: "Architecture", group: "top", disabled: true },
  { id: "ux",     icon: "⇄", label: "UX", group: "top", disabled: true },
  { id: "settings", icon: "⚙", label: "Settings", group: "bottom", disabled: false },
  { id: "panels",   icon: "◫", label: "Panels", group: "bottom", disabled: false },
];

function useMeasured<T extends HTMLElement>(): [React.RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

export function AppShell() {
  const view = useView();
  const selected = useSelected();
  const [stageRef, stageSize] = useMeasured<HTMLDivElement>();

  return (
    <div className="shell">
      <TitleBar />

      {/* Sub-toolbar: breadcrumbs + search */}
      <div className="subbar">
        <div className="subbar-left">
          <button className="breadcrumb-segment breadcrumb-project">atlas-stays</button>
          <span className="breadcrumb-sep">›</span>
          <div className="breadcrumb-segment breadcrumb-active">
            <span className="breadcrumb-dot" />
            {view === "domain" ? "Domain" : view === "data" ? "Data · ERD" : view === "flow" ? "Flow · Book a stay" : view}
          </div>
        </div>
        <div className="subbar-right">
          <button className="search-button">
            <span className="search-kbd">⌘K</span>
            <span>Search</span>
          </button>
          <div className="avatar">SE</div>
        </div>
      </div>

      {/* Body */}
      <div className="body">
        {/* Rail */}
        <nav className="rail">
          {RAIL_ITEMS.filter((i) => i.group === "top").map((item) => {
            const isView = (id: string): id is ViewId =>
              id === "domain" || id === "data" || id === "flow" || id === "arch" || id === "ux";
            const active = isView(item.id) && view === item.id;
            const disabled = item.disabled === true;
            return (
              <button
                key={item.id}
                className={`rail-item ${active ? "rail-item-active" : ""} ${disabled ? "rail-item-disabled" : ""}`}
                onClick={() => {
                  if (disabled) return;
                  if (isView(item.id)) setView(item.id);
                }}
                disabled={disabled}
                title={item.label}
              >
                {active && <span className="rail-indicator" />}
                <span className="rail-icon">{item.icon}</span>
              </button>
            );
          })}
          <div className="rail-grow" />
          {RAIL_ITEMS.filter((i) => i.group === "bottom").map((item) => (
            <button
              key={item.id}
              className="rail-item"
              title={item.label}
              onClick={() => { /* PR6 wires Settings + Panels */ }}
            >
              <span className="rail-icon">{item.icon}</span>
            </button>
          ))}
        </nav>

        {/* Outliner — static cascade chrome; PR6 will rebind to view-specific outliner data. */}
        <aside className="outliner">
          <div className="outliner-header">
            <div className="outliner-label">Cascade</div>
            <div className="outliner-title">Atlas Stays</div>
          </div>
          <div className="outliner-rows">
            <CascadeRow dot="var(--indigo)" label="Contracts" count="3/3" state="frozen" />
            <CascadeRow dot="var(--cyan)" label="Use cases" count="5/5" state="frozen" active />
            <CascadeRow dot="var(--magenta)" label="Placement" count="4/4" state="drafting" />
            <CascadeRow dot="var(--text-mute)" label="Implementation" count="—" state="locked" />
          </div>
          <div className="outliner-footer">
            <span className="sync-dot" />
            <span>cloud graph · synced</span>
          </div>
        </aside>

        {/* Stage */}
        <main className="stage">
          <div className="stage-header">
            <div className="stage-header-left">
              <h2 className="stage-title">
                {view === "domain" ? "Domain" : view === "data" ? "Data · ERD" : view === "flow" ? "Flow · Book a stay" : "—"}
              </h2>
              <span className="stage-meta">
                {view === "domain"
                  ? `${ATLAS.domain.nodes.length} elements · ${ATLAS.domain.contexts.length} contexts · `
                  : view === "data"
                  ? `${ATLAS.data.tables.length} tables · ${ATLAS.data.rels.length} relations · `
                  : `${ATLAS.flow.steps.filter((s) => s.seq).length} steps · `}
                <span className="drift-text">1 drift</span>
              </span>
            </div>
            <div className="segmented-control">
              <button className="seg seg-active">force</button>
              <button className="seg">layered</button>
              <button className="seg">radial</button>
            </div>
          </div>
          <div className="stage-filters">
            <PillFilter color="var(--magenta)" label="Aggregate" count={4} />
            <PillFilter color="var(--cyan)" label="UseCase" count={5} />
            <PillFilter color="var(--indigo)" label="Contract" count={3} />
            <PillFilter color="var(--violet)" label="Decision" count={1} />
            <PillFilter color="var(--text)" label="Actor" count={3} />
          </div>
          <div className="stage-canvas" ref={stageRef}>
            {view === "domain" && <ViewDomain width={stageSize.width} height={stageSize.height} />}
            {view === "data" && <ViewData width={stageSize.width} height={stageSize.height} />}
            {view === "flow" && <ViewFlow width={stageSize.width} height={stageSize.height} />}
            {(view === "arch" || view === "ux") && (
              <div className="stage-empty">
                <span className="stage-empty-label">{view === "arch" ? "Architecture" : "UX"} view — coming later</span>
              </div>
            )}
          </div>
        </main>

        {/* Inspector — bound to global selection. PR6 will rebuild fully. */}
        <Inspector view={view} selected={selected} />
      </div>

      {/* Status bar */}
      <footer className="statusbar">
        <div className="statusbar-left">
          <span className="status-health"><span className="status-dot status-dot-healthy" /> graph healthy</span>
          <span>cascade · 7 frozen · <span className="drift-text">1 drift</span></span>
        </div>
        <span className="statusbar-center">mosaic@atlas-stays · rev 042 · synced 12s ago</span>
        <span className="statusbar-right"><span className="status-dot status-dot-agent" /> haiku-4-5 · idle</span>
      </footer>
    </div>
  );
}

function Inspector({ view, selected }: { view: ViewId; selected: string | null }) {
  const meta = lookupSelected(view, selected);
  return (
    <aside className="inspector">
      <div className="inspector-header">
        <div className="inspector-type-row">
          <span
            className="inspector-type-dot"
            style={meta ? { background: meta.color, boxShadow: `0 0 12px ${meta.color}` } : undefined}
          />
          <span className="inspector-type-label">{meta?.typeLabel ?? "—"}</span>
          {meta?.badge && (
            <span className="inspector-state-badge">{meta.badge}</span>
          )}
        </div>
        <h2 className="inspector-title">{meta?.title ?? "Nothing selected"}</h2>
        <div className="inspector-id">{meta?.id ?? "click a node to inspect"}</div>
      </div>
      <div className="inspector-tabs">
        <button className="tab tab-active">Schema</button>
        <button className="tab">Cascade</button>
        <button className="tab">History</button>
        <button className="tab">Notes</button>
      </div>
      <div className="inspector-body">
        {meta ? (
          <div className="inspector-prop">
            <span className="inspector-prop-key">:type</span>
            <span className="inspector-prop-val">{meta.typeLabel}</span>
          </div>
        ) : (
          <div className="inspector-placeholder">Select a node to inspect its schema</div>
        )}
      </div>
      <div className="inspector-footer">
        <button className="btn-primary">Re-derive downstream</button>
        <button className="btn-secondary">Edit schema</button>
      </div>
    </aside>
  );
}

interface SelectedMeta {
  title: string;
  typeLabel: string;
  color: string;
  badge?: string;
  id: string;
}

function lookupSelected(view: ViewId, id: string | null): SelectedMeta | null {
  if (!id) return null;
  if (view === "domain") {
    const n = ATLAS.domain.nodes.find((x) => x.id === id);
    if (!n) return null;
    const t = TYPE[n.type];
    return {
      title: n.label,
      typeLabel: t.label,
      color: t.glow,
      badge: n.frozen ? "FROZEN" : n.drift ? "DRIFT" : undefined,
      id: `node:${n.type}@${n.id}`,
    };
  }
  if (view === "data") {
    const t = ATLAS.data.tables.find((x) => x.id === id);
    if (!t) return null;
    return {
      title: t.label,
      typeLabel: "table",
      color: `var(--${t.accent})`,
      badge: t.drift ? "DRIFT" : undefined,
      id: `table@${t.id}`,
    };
  }
  if (view === "flow") {
    const s = ATLAS.flow.steps.find((x) => x.id === id);
    if (!s) return null;
    const t = TYPE[s.type];
    return {
      title: s.label,
      typeLabel: t.label,
      color: s.terminal === "err" ? "var(--coral)" : t.glow,
      badge: s.terminal === "ok" ? "2XX" : s.terminal === "err" ? "ERROR" : s.drift ? "DRIFT" : undefined,
      id: `step@${s.id}`,
    };
  }
  return null;
}

function CascadeRow({ dot, label, count, state, active }: {
  dot: string; label: string; count: string; state: string; active?: boolean;
}) {
  return (
    <div className={`cascade-row ${active ? "cascade-row-active" : ""}`}>
      <span className="cascade-dot" style={{ background: dot }} />
      <div className="cascade-info">
        <span className="cascade-label">{label}</span>
        <span className="cascade-count">{count}</span>
      </div>
      <span className={`cascade-state cascade-state-${state}`}>{state}</span>
    </div>
  );
}

function PillFilter({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <button className="pill-filter">
      <span className="pill-dot" style={{ background: color }} />
      <span>{label}</span>
      <span className="pill-count">{count}</span>
    </button>
  );
}
