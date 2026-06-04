import { useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DiagramCanvas } from "./diagram-canvas";
import { DEMO_DATA } from "./diagram-demo-data";
import "./app-shell.css";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

function windowAction(action: "close" | "minimize" | "toggleMaximize") {
  if (!isTauri) return;
  const w = getCurrentWindow();
  switch (action) {
    case "close": void w.close(); return;
    case "minimize": void w.minimize(); return;
    case "toggleMaximize": void w.toggleMaximize(); return;
  }
}

function WindowControls() {
  // On macOS, order is close, minimize, maximize (left-to-right). On Windows/Linux,
  // the conventional order is minimize, maximize, close (left-to-right) — the close
  // button is rightmost and gets a distinct hover treatment via CSS.
  if (isMac) {
    return (
      <div className="traffic-lights traffic-lights-mac">
        <button type="button" className="dot dot-close" aria-label="Close window" onClick={() => windowAction("close")} />
        <button type="button" className="dot dot-minimize" aria-label="Minimize window" onClick={() => windowAction("minimize")} />
        <button type="button" className="dot dot-maximize" aria-label="Toggle maximize window" onClick={() => windowAction("toggleMaximize")} />
      </div>
    );
  }
  return (
    <div className="window-controls window-controls-winlinux">
      <button type="button" className="win-control win-minimize" aria-label="Minimize window" onClick={() => windowAction("minimize")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 5h10" stroke="currentColor" strokeWidth="1" /></svg>
      </button>
      <button type="button" className="win-control win-maximize" aria-label="Toggle maximize window" onClick={() => windowAction("toggleMaximize")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" /></svg>
      </button>
      <button type="button" className="win-control win-close" aria-label="Close window" onClick={() => windowAction("close")}>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" /></svg>
      </button>
    </div>
  );
}

type View = "mosaic" | "cascade" | "contracts" | "domain" | "agents" | "history" | "settings";

const RAIL_ITEMS: { id: View; icon: string; label: string }[] = [
  { id: "mosaic",    icon: "▦", label: "Mosaic" },
  { id: "cascade",   icon: "≡", label: "Cascade" },
  { id: "contracts", icon: "◇", label: "Contracts" },
  { id: "domain",    icon: "◐", label: "Domain" },
  { id: "agents",    icon: "◬", label: "Agents" },
  { id: "history",   icon: "◷", label: "History" },
  { id: "settings",  icon: "✦", label: "Settings" },
];

function PrismLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#5b6bff" />
      <rect x="18" y="2" width="12" height="12" rx="2" fill="#ff4d8c" />
      <rect x="2" y="18" width="12" height="12" rx="2" fill="#22d3ee" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="#a3e635" />
    </svg>
  );
}

export function AppShell() {
  const [activeView, setActiveView] = useState<View>("mosaic");

  return (
    <div className="shell">
      {/* Title bar */}
      <header className="titlebar" data-tauri-drag-region>
        <div className="titlebar-left">
          {isMac && <WindowControls />}
          <Link to="/" className="titlebar-brand titlebar-brand-link" aria-label="Back to projects">
            <PrismLogo size={20} />
            <span className="titlebar-wordmark">Tessera</span>
          </Link>
        </div>
        <div className="titlebar-right">
          <div className="avatar">SE</div>
          {!isMac && <WindowControls />}
        </div>
      </header>

      {/* Sub-toolbar: breadcrumbs + search */}
      <div className="subbar">
        <div className="subbar-left">
          <button className="breadcrumb-segment breadcrumb-project">checkout-platform</button>
          <span className="breadcrumb-sep">›</span>
          <div className="breadcrumb-segment breadcrumb-active">
            <span className="breadcrumb-dot" />
            Mosaic · Checkout
          </div>
        </div>
        <div className="subbar-right">
          <button className="search-button">
            <span className="search-kbd">⌘K</span>
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="body">
        {/* Rail */}
        <nav className="rail">
          {RAIL_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`rail-item ${activeView === item.id ? "rail-item-active" : ""}`}
              onClick={() => setActiveView(item.id)}
              title={item.label}
            >
              {activeView === item.id && <span className="rail-indicator" />}
              <span className="rail-icon">{item.icon}</span>
            </button>
          ))}
        </nav>

        {/* Outliner */}
        <aside className="outliner">
          <div className="outliner-header">
            <div className="outliner-label">Cascade</div>
            <div className="outliner-title">Checkout v3</div>
          </div>
          <div className="outliner-rows">
            <CascadeRow dot="var(--indigo)" label="Contracts" count="4/4" state="frozen" />
            <CascadeRow dot="var(--cyan)" label="Use cases" count="7/7" state="frozen" active />
            <CascadeRow dot="var(--magenta)" label="Placement" count="3/8" state="drafting" />
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
              <h2 className="stage-title">Mosaic · Checkout</h2>
              <span className="stage-meta">14 nodes · 15 edges · <span className="drift-text">1 drift</span></span>
            </div>
            <div className="segmented-control">
              <button className="seg seg-active">force</button>
              <button className="seg">layered</button>
              <button className="seg">radial</button>
            </div>
          </div>
          <div className="stage-filters">
            <PillFilter color="var(--magenta)" label="Aggregate" count={4} />
            <PillFilter color="var(--cyan)" label="UseCase" count={2} />
            <PillFilter color="var(--indigo)" label="Contract" count={3} />
            <PillFilter color="var(--surface-3)" label="Module" count={3} />
            <PillFilter color="var(--violet)" label="Decision" count={1} />
            <PillFilter color="var(--text)" label="Actor" count={1} />
          </div>
          <div className="stage-canvas">
            <DiagramCanvas data={DEMO_DATA} />
          </div>
        </main>

        {/* Inspector */}
        <aside className="inspector">
          <div className="inspector-header">
            <div className="inspector-type-row">
              <span className="inspector-type-dot" />
              <span className="inspector-type-label">Contract</span>
              <span className="inspector-state-badge">FROZEN</span>
            </div>
            <h2 className="inspector-title">Checkout v3</h2>
            <div className="inspector-id">node:contract@checkout-v3</div>
          </div>
          <div className="inspector-tabs">
            <button className="tab tab-active">Schema</button>
            <button className="tab">Cascade</button>
            <button className="tab">History</button>
            <button className="tab">Notes</button>
          </div>
          <div className="inspector-body">
            <div className="inspector-placeholder">Select a node to inspect its schema</div>
          </div>
          <div className="inspector-footer">
            <button className="btn-primary">Re-derive downstream</button>
            <button className="btn-secondary">Edit schema</button>
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <footer className="statusbar">
        <div className="statusbar-left">
          <span className="status-health"><span className="status-dot status-dot-healthy" /> graph healthy</span>
          <span>cascade · 7 frozen · <span className="drift-text">1 drift</span></span>
        </div>
        <span className="statusbar-center">mosaic@checkout · rev 042 · synced 12s ago</span>
        <span className="statusbar-right"><span className="status-dot status-dot-agent" /> haiku-4-5 · idle</span>
      </footer>
    </div>
  );
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
