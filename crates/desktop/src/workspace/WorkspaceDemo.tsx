/* Tessera · WorkspaceDemo.tsx
 * Standalone demo route for the docking workspace engine. Three coloured
 * panels with textareas — used to validate that scroll position, cursor
 * position and textarea content survive every dock / tab / split / detach
 * operation (because the body element is parked, never destroyed).
 *
 * PR6 replaces this with the real shell — do not link to it from the home
 * view.
 */

import { useCallback, useRef, useState } from "react";
import { Workspace } from "./Workspace";
import type { PanelDef, WorkspaceApi, WorkspaceLayout } from "./Workspace";

const PANELS: { id: string; title: string; icon: string; accent: string }[] = [
  { id: "alpha", title: "Alpha", icon: "◐", accent: "var(--indigo)" },
  { id: "beta", title: "Beta", icon: "◧", accent: "var(--magenta)" },
  { id: "gamma", title: "Gamma", icon: "≋", accent: "var(--cyan)" },
];

function DemoPanelBody({ id, accent }: { id: string; accent: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 14,
        background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 12%, transparent), transparent)`,
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
        Panel <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>{id}</code>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          color: "var(--text-dim)",
          lineHeight: 1.55,
        }}
      >
        Drag the header. Drag a tab out. Drop onto an edge to split, onto the
        header to merge. Type below — the cursor and scroll position should
        survive any dock op.
      </p>
      <textarea
        defaultValue={`# ${id}\n\nType here, then dock this panel somewhere else. State persists because the body element is parked, not unmounted.`}
        style={{
          flex: 1,
          minHeight: 80,
          padding: 10,
          background: "rgba(255,255,255,0.04)",
          color: "var(--text)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          lineHeight: 1.55,
          resize: "none",
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          color: "var(--text-mute)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        ws-demo · {id}
      </div>
    </div>
  );
}

export function WorkspaceDemo() {
  const apiRef = useRef<WorkspaceApi>(null);
  const [trayTick, setTrayTick] = useState(0);

  const panels: PanelDef[] = PANELS.map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    render: () => <DemoPanelBody id={p.id} accent={p.accent} />,
  }));

  const defaultLayout = useCallback(
    (size: { w: number; h: number }): WorkspaceLayout => {
      const gutter = 12;
      const w = Math.max(280, Math.floor((size.w - gutter * 4) / 3));
      const h = Math.max(240, size.h - gutter * 2);
      const y = gutter;
      return {
        frames: PANELS.map((p, i) => ({
          id: `seed-${p.id}`,
          x: gutter + i * (w + gutter),
          y,
          w,
          h,
          z: 10 + i,
          tabs: [p.id],
          active: p.id,
          collapsed: false,
          maximized: false,
        })),
        tray: [],
      };
    },
    [],
  );

  const tray = apiRef.current?.trayPanels() ?? [];
  // We re-render whenever the engine signals layout changes; the tick is a
  // hook to force the demo bar to refresh when onChange fires.
  void trayTick;

  return (
    <div className="ws-demo">
      <div className="ws-demo-bar">
        <span className="ws-demo-title">Workspace demo</span>
        <button
          type="button"
          onClick={() => {
            const placed = panels.find((p) => !apiRef.current?.isPlaced(p.id));
            if (placed) apiRef.current?.openPanel(placed.id);
          }}
        >
          + Add
        </button>
        <button type="button" onClick={() => apiRef.current?.reset()}>
          ⟲ Reset
        </button>
        <div className="ws-demo-spacer" />
        <div className="ws-demo-tray">
          {tray.length === 0 ? (
            <span style={{ color: "var(--text-mute)", fontSize: 11 }}>tray empty</span>
          ) : (
            tray.map((t) => (
              <button
                key={t.id}
                type="button"
                className="tray-chip"
                onClick={() => apiRef.current?.openPanel(t.id)}
              >
                {t.icon ? <span style={{ marginRight: 5 }}>{t.icon}</span> : null}
                {t.title}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="ws-demo-body">
        <Workspace
          ref={apiRef}
          panels={panels}
          defaultLayout={defaultLayout}
          lsKey="tessera.workspace.v1"
          onChange={() => setTrayTick((t) => t + 1)}
        />
      </div>
    </div>
  );
}
