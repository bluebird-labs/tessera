import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  setLayout,
  toggleFilter,
  useFilters,
  useLargeGraph,
  useLayout,
  useView,
} from "../state/app-store";
import { ViewData, ViewDomain, ViewFlow, type ViewHandle } from "../viz";
import { projectionMeta } from "./meta";

export interface CanvasPanelProps {
  apiRef: RefObject<ViewHandle | null>;
}

function useMeasured<T extends HTMLElement>(): [
  RefObject<T | null>,
  { width: number; height: number },
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
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

export function CanvasPanel({ apiRef }: CanvasPanelProps) {
  const view = useView();
  const layout = useLayout(view);
  const filters = useFilters(view);
  const large = useLargeGraph();
  const meta = projectionMeta(view);

  const [stageRef, stageSize] = useMeasured<HTMLDivElement>();
  const activeLayout = layout ?? meta?.defaultLayout ?? null;

  return (
    <div className="cv">
      <div className="cv-tool">
        <span className="cv-title">{meta?.stageTitle ?? "—"}</span>
        <span
          className="cv-meta"
          dangerouslySetInnerHTML={{ __html: meta?.stageMeta ?? "" }}
        />
        {meta && meta.layouts.length > 0 ? (
          <div className="seg">
            {meta.layouts.map((l) => (
              <button
                key={l.id}
                type="button"
                className={activeLayout === l.id ? "on" : ""}
                onClick={() => setLayout(view, l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {meta && meta.filters.length > 0 ? (
        <div className="cv-filters">
          {meta.filters.map((f) => {
            const off = filters.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                className={`pill-filter${off ? " off" : ""}`}
                onClick={() => toggleFilter(view, f.id)}
              >
                <span className="pill-dot" style={{ background: f.color }} />
                <span>{f.label}</span>
                <span className="pill-count">{f.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="cv-stage" ref={stageRef} data-3d={large ? "true" : undefined}>
        {/* TODO(PR7): camera tilt in 3D mode */}
        {view === "domain" && (
          <ViewDomain ref={apiRef} width={stageSize.width} height={stageSize.height} />
        )}
        {view === "data" && (
          <ViewData ref={apiRef} width={stageSize.width} height={stageSize.height} />
        )}
        {view === "flow" && (
          <ViewFlow ref={apiRef} width={stageSize.width} height={stageSize.height} />
        )}
        {(view === "arch" || view === "ux") && (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              height: "100%",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-mute)",
            }}
          >
            {view === "arch" ? "Architecture" : "UX"} view — coming later
          </div>
        )}
        <div className="zoom-ctl">
          <button type="button" onClick={() => apiRef.current?.zoomBy(1.3)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => apiRef.current?.zoomBy(1 / 1.3)} aria-label="Zoom out">
            −
          </button>
          <button type="button" onClick={() => apiRef.current?.fit()} title="Fit" aria-label="Fit to canvas">
            ⊡
          </button>
        </div>
      </div>
    </div>
  );
}
