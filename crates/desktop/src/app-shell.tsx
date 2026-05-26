import { useState } from "react";
import { DiagramCanvas } from "./diagram-canvas";
import { DEMO_DATA } from "./diagram-demo-data";
import "./app-shell.css";

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
      <defs>
        <linearGradient id="pl1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5b6bff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="pl2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4d8c" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id="pl3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="12" height="12" rx="2" fill="url(#pl1)" />
      <rect x="18" y="2" width="12" height="12" rx="2" fill="url(#pl2)" />
      <rect x="2" y="18" width="12" height="12" rx="2" fill="url(#pl3)" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="rgba(255,255,255,0.92)" />
    </svg>
  );
}

export function AppShell() {
  const [activeView, setActiveView] = useState<View>("mosaic");

  return (
    <div className="shell">
      {/* Title bar */}
      <header className="titlebar">
        <div className="titlebar-left">
          <div className="traffic-lights">
            <span className="dot dot-close" />
            <span className="dot dot-minimize" />
            <span className="dot dot-maximize" />
          </div>
          <div className="titlebar-brand">
            <PrismLogo size={20} />
            <span className="titlebar-wordmark">Tessera</span>
          </div>
        </div>
        <div className="titlebar-center">
          <button className="breadcrumb-segment breadcrumb-project">checkout-platform</button>
          <span className="breadcrumb-sep">›</span>
          <div className="breadcrumb-segment breadcrumb-active">
            <span className="breadcrumb-dot" />
            Mosaic · Checkout
          </div>
        </div>
        <div className="titlebar-right">
          <button className="search-button">
            <span className="search-kbd">⌘K</span>
            <span>Search</span>
          </button>
          <div className="avatar">SE</div>
        </div>
      </header>

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
