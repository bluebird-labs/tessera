/* Tessera · view-flow — Request → response flow.
 *
 * "Book a stay" travels down through layered swimlanes (Actor → Edge →
 * Application → Domain → Infrastructure). The happy path is a glowing,
 * animated spine; error branches peel off dashed in coral; the 2xx
 * terminal gets a lime success ring.
 *
 * Mirrors `crates/desktop/design/diagrams/view-flow.js`. Two layouts:
 * `horizontal` (default) and `vertical`. Animation respects the
 * `prefers-reduced-motion` media query.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { zoomIdentity } from "d3-zoom";

import {
  LARGE_GRAPH_THRESHOLD,
  TYPE,
  attachZoom,
  computeTiers,
  curve,
  injectDefs,
  select as d3Select,
  type D3Selection,
  type NodeKind,
} from "./viz-core";
import { ATLAS, type FlowEdge, type FlowStep } from "./data";
import { makeSpring, type SpringHandle } from "./motion";
import type {
  InspectorModel,
  OutlinerGroup,
  ProjectionMeta,
} from "./projection";
import {
  select as selectAction,
  setLargeGraph,
  togglePin,
  useLayout,
  usePinned,
  useSelected,
} from "../state/app-store";
import { tokens } from "../tokens";

import type { ViewHandle } from "./view-domain";

type FlowLayout = "horizontal" | "vertical";

interface PlacedStep extends FlowStep {
  x: number;
  y: number;
}

const SW = 138;
const SH = 46;

// sequence column for each step (x slot). Terminals share branch columns.
const COL: Record<string, number> = {
  "s-traveler": 0,
  "s-api": 1,
  "s-book": 2,
  "s-avail": 3,
  "s-price": 4,
  "s-resv": 5,
  "s-pay": 6,
  "s-repo": 7,
  "s-201": 8,
  "s-409": 3,
  "s-402": 6,
};

// Inject the flow-anim keyframe once per document load.
function ensureFlowAnimStyle(): void {
  const id = "viz-flow-anim-keyframes";
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes viz-flowdash { to { stroke-dashoffset: -14; } }
    .viz-flow-anim { animation: viz-flowdash 0.6s linear infinite; }
    @media (prefers-reduced-motion: reduce) {
      .viz-flow-anim { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export const ViewFlow = forwardRef<ViewHandle, { width: number; height: number }>(
  function ViewFlow({ width, height }, ref) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const apiRef = useRef<ViewHandle | null>(null);
    const tiersRef = useRef<((sel: string | null, pinned: ReadonlySet<string>) => void) | null>(null);

    const layout = (useLayout("flow") ?? "horizontal") as FlowLayout;
    const selected = useSelected();
    const pinned = usePinned();

    useImperativeHandle(
      ref,
      () => ({
        fit: () => apiRef.current?.fit(),
        zoomBy: (f) => apiRef.current?.zoomBy(f),
      }),
      [],
    );

    useEffect(() => {
      ensureFlowAnimStyle();
      const el = svgRef.current;
      if (!el || width <= 0 || height <= 0) return;

      const svg = d3Select(el) as D3Selection<SVGSVGElement>;
      svg.selectAll("*").remove();
      injectDefs(svg);

      const D = ATLAS.flow;
      const laneIndex = new Map(D.lanes.map((l, i) => [l.id, i]));
      const stepById = new Map(D.steps.map((s) => [s.id, s]));
      const vertical = layout === "vertical";

      const LBL = 120;
      const nLanes = D.lanes.length;
      const nCols = 9;
      const colW = 158;
      const laneH = 122;
      const VW = vertical ? nLanes * laneH + LBL : LBL + nCols * colW + 30;
      const VH = vertical ? 40 + nCols * 86 : 40 + nLanes * laneH;
      const innerW = VW - LBL - 40;
      const innerH = VH - 40;
      const laneSpan = (vertical ? innerW : innerH) / nLanes;
      const colSpan = (vertical ? innerH : innerW) / nCols;

      function place(s: FlowStep): { x: number; y: number } {
        const lane = laneIndex.get(s.lane) ?? 0;
        const col = COL[s.id] ?? 0;
        const cross = laneSpan * (lane + 0.5);
        const along = colSpan * (col + 0.5);
        let crossAdj = cross;
        if (s.terminal === "err") crossAdj = cross + (vertical ? 0 : laneSpan * 0.55);
        if (vertical) return { x: LBL + 40 + crossAdj, y: 20 + along };
        return { x: LBL + 20 + along, y: 20 + crossAdj };
      }

      const steps: PlacedStep[] = D.steps.map((s) => ({ ...s, ...place(s) }));
      const placedById = new Map(steps.map((s) => [s.id, s]));

      const adjacency: Record<string, string[]> = {};
      for (const e of D.edges) {
        (adjacency[e.from] ??= []).push(e.to);
        (adjacency[e.to] ??= []).push(e.from);
      }
      setLargeGraph(steps.length > LARGE_GRAPH_THRESHOLD);

      const stepSprings = new Map<string, SpringHandle>();

      const root = svg.append("g").attr("class", "flow-root") as D3Selection<SVGGElement>;
      const laneLayer = root.append("g").attr("class", "lane-layer");
      const edgeLayer = root.append("g").attr("class", "edge-layer");
      const stepLayer = root.append("g").attr("class", "step-layer");

      // ── lane bands + labels ──
      D.lanes.forEach((l, i) => {
        const g = laneLayer.append("g");
        if (vertical) {
          const x = LBL + 40 + laneSpan * i;
          g.append("rect")
            .attr("x", x)
            .attr("y", 12)
            .attr("width", laneSpan)
            .attr("height", innerH + 8)
            .attr("fill", i % 2 ? "rgba(255,255,255,0.018)" : "transparent");
          g.append("text")
            .attr("x", x + laneSpan / 2)
            .attr("y", 28)
            .attr("text-anchor", "middle")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 9.5)
            .attr("letter-spacing", "0.16em")
            .attr("fill", tokens.textMute)
            .text(l.label.toUpperCase());
        } else {
          const y = 20 + laneSpan * i;
          g.append("rect")
            .attr("x", LBL)
            .attr("y", y)
            .attr("width", innerW + 40)
            .attr("height", laneSpan)
            .attr("fill", i % 2 ? "rgba(255,255,255,0.018)" : "transparent");
          g.append("line")
            .attr("x1", LBL)
            .attr("y1", y)
            .attr("x2", VW - 20)
            .attr("y2", y)
            .attr("stroke", tokens.line)
            .attr("stroke-width", 1);
          g.append("text")
            .attr("x", 16)
            .attr("y", y + laneSpan / 2 + 4)
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 9.5)
            .attr("letter-spacing", "0.14em")
            .attr("fill", tokens.textMute)
            .text(l.label.toUpperCase());
        }
      });

      // ── edges ──
      function edgePath(e: FlowEdge): string {
        const a = placedById.get(e.from);
        const b = placedById.get(e.to);
        if (!a || !b) return "";
        return curve(a.x, a.y, b.x, b.y, 0.12);
      }

      const edgeSel = edgeLayer
        .selectAll<SVGGElement, FlowEdge>("g.fe")
        .data(D.edges, (d) => `${d.from}->${d.to}`)
        .enter()
        .append("g")
        .attr("class", "fe");

      edgeSel
        .append("path")
        .attr("class", "base")
        .attr("fill", "none")
        .attr("d", edgePath)
        .attr("stroke", (e) =>
          e.path === "err" || e.drift ? tokens.coral : "rgba(255,255,255,0.5)",
        )
        .attr("stroke-width", (e) => (e.path === "happy" ? 2 : 1.3))
        .attr("stroke-dasharray", (e) => (e.path === "err" || e.drift ? "5 5" : null))
        .attr("opacity", (e) => (e.path === "err" ? 0.7 : 0.92))
        .attr("marker-end", (e) =>
          e.path === "err" || e.drift ? "url(#arrowCoral)" : "url(#arrow)",
        );

      // animated overlay on the happy spine — `--flow-happy` token.
      edgeSel
        .filter((e) => e.path === "happy" && !e.drift)
        .append("path")
        .attr("class", "flow-anim viz-flow-anim")
        .attr("fill", "none")
        .attr("d", edgePath)
        .attr("stroke", tokens.cyanHi)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", "1 13")
        .attr("opacity", 0.9)
        .style("filter", "drop-shadow(0 0 4px " + tokens.cyan + ")");

      // edge labels
      edgeSel
        .filter((e) => !!e.label)
        .each(function (e) {
          const a = placedById.get(e.from);
          const b = placedById.get(e.to);
          if (!a || !b) return;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const g = d3Select(this);
          const w = (e.label?.length ?? 0) * 6 + 14;
          g.append("rect")
            .attr("x", mx - w / 2)
            .attr("y", my - 9)
            .attr("width", w)
            .attr("height", 17)
            .attr("rx", 8.5)
            .attr("fill", tokens.surface2)
            .attr("stroke", e.path === "err" ? tokens.coral + "66" : tokens.line)
            .attr("stroke-width", 0.6);
          g.append("text")
            .attr("x", mx)
            .attr("y", my + 3)
            .attr("text-anchor", "middle")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 9)
            .attr("fill", e.path === "err" ? tokens.coral : tokens.textDim)
            .text(e.label ?? "");
        });

      // ── step nodes ──
      const step = stepLayer
        .selectAll<SVGGElement, PlacedStep>("g.step")
        .data(steps, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "step")
        .style("cursor", "pointer")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      step.each(function (s) {
        const g = d3Select(this);
        const kind = s.type as NodeKind;
        const t = TYPE[kind];
        const err = s.terminal === "err";
        const ok = s.terminal === "ok";

        g.append("rect")
          .attr("class", "sel-ring")
          .attr("x", -SW / 2 - 5)
          .attr("y", -SH / 2 - 5)
          .attr("width", SW + 10)
          .attr("height", SH + 10)
          .attr("rx", 13)
          .attr("fill", "none")
          .attr("stroke", "none");

        const box = g
          .append("rect")
          .attr("class", "box")
          .attr("x", -SW / 2)
          .attr("y", -SH / 2)
          .attr("width", SW)
          .attr("height", SH)
          .attr("rx", 10);

        if (s.type === "actor") {
          box.attr("fill", "#13152a").attr("stroke", tokens.lineHi).attr("stroke-width", 1.4);
        } else if (err) {
          box
            .attr("fill", "rgba(251,113,133,0.10)")
            .attr("stroke", tokens.coral)
            .attr("stroke-width", 1.3);
        } else if (s.type === "module") {
          box
            .attr("fill", "#1a1d2e")
            .attr("stroke", tokens.lineHi)
            .attr("stroke-width", 1)
            .style("filter", "drop-shadow(0 6px 16px rgba(0,0,0,0.4))");
        } else {
          box
            .attr("fill", `url(#grad-${kind})`)
            .attr("stroke", "rgba(255,255,255,0.4)")
            .attr("stroke-width", 1.1)
            .style("filter", "drop-shadow(0 6px 18px " + t.glow + "55)");
        }

        if (ok) {
          g.append("rect")
            .attr("x", -SW / 2 - 4)
            .attr("y", -SH / 2 - 4)
            .attr("width", SW + 8)
            .attr("height", SH + 8)
            .attr("rx", 13)
            .attr("fill", "none")
            .attr("stroke", tokens.lime)
            .attr("stroke-width", 1.2)
            .attr("stroke-dasharray", "4 3")
            .attr("opacity", 0.85);
        }

        if (s.seq) {
          g.append("circle")
            .attr("cx", -SW / 2 + 2)
            .attr("cy", -SH / 2 + 2)
            .attr("r", 10)
            .attr("fill", tokens.canvas)
            .attr("stroke", err ? tokens.coral : t.glow)
            .attr("stroke-width", 1.3);
          g.append("text")
            .attr("x", -SW / 2 + 2)
            .attr("y", -SH / 2 + 5.5)
            .attr("text-anchor", "middle")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 9)
            .attr("font-weight", 600)
            .attr("fill", err ? tokens.coral : t.glow)
            .text(s.seq);
        }

        const fg =
          s.type === "module" || s.type === "actor"
            ? tokens.text
            : err
            ? tokens.coral
            : t.text;
        g.append("text")
          .attr("x", 0)
          .attr("y", s.sub ? -2 : 4)
          .attr("text-anchor", "middle")
          .attr("font-family", tokens.fontSans)
          .attr("font-size", 12.5)
          .attr("font-weight", 600)
          .attr("fill", fg)
          .text(s.label);
        if (s.sub) {
          g.append("text")
            .attr("x", 0)
            .attr("y", 12)
            .attr("text-anchor", "middle")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 8.5)
            .attr(
              "fill",
              s.type === "module" || s.type === "actor"
                ? tokens.textMute
                : "rgba(255,255,255,0.7)",
            )
            .text(s.sub);
        }
        if (s.drift) {
          g.append("circle")
            .attr("cx", SW / 2 - 6)
            .attr("cy", -SH / 2 + 6)
            .attr("r", 4)
            .attr("fill", tokens.coral)
            .style("filter", "drop-shadow(0 0 6px " + tokens.coral + ")");
        }
      });

      step.on("click", (ev: MouseEvent, s) => {
        ev.stopPropagation();
        if (ev.metaKey || ev.ctrlKey) togglePin(s.id);
        else selectAction(s.id);
      });
      svg.on("click", () => selectAction(null));

      function applyTiers(selId: string | null, pinnedSet: ReadonlySet<string>): void {
        const ids = steps.map((s) => s.id);
        const tierMap = computeTiers(ids, adjacency, selId);
        for (const p of pinnedSet) {
          if (tierMap[p]) tierMap[p] = "focus";
        }
        step.each(function (s) {
          const t = tierMap[s.id];
          const target =
            !selId && pinnedSet.size === 0
              ? 1
              : t === "ghost"
                ? 0.32
                : t === "mid"
                  ? 0.78
                  : 1;
          const el = this;
          const from = Number.parseFloat(el.style.opacity || "") || 1;
          let spring = stepSprings.get(s.id);
          if (!spring) {
            spring = makeSpring();
            stepSprings.set(s.id, spring);
          }
          spring.to(from, target, (v) => {
            el.style.opacity = String(v);
          });
        });
        step
          .select<SVGRectElement>(".sel-ring")
          .attr("stroke", (s) => (s.id === selId ? tokens.lime : "none"))
          .attr("stroke-width", 1.6)
          .attr("stroke-dasharray", "4 3");
        edgeSel.select<SVGPathElement>(".base").transition().duration(300).attr("opacity", function () {
          const e = d3Select(this.parentNode as SVGGElement).datum() as FlowEdge;
          if (!selId) return e.path === "err" ? 0.7 : 0.92;
          return e.from === selId || e.to === selId ? 1 : 0.18;
        });
      }

      tiersRef.current = applyTiers;
      applyTiers(selected, pinned);

      const z = attachZoom(svg, root, { scaleExtent: [0.4, 2.2] });
      function fit(animate: boolean): void {
        const xs = steps.map((s) => s.x);
        const ys = steps.map((s) => s.y);
        const minX = Math.min(...xs) - SW / 2 - 30;
        const maxX = Math.max(...xs) + SW / 2 + 30;
        const minY = Math.min(...ys) - SH - 24;
        const maxY = Math.max(...ys) + SH + 24;
        const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.25) * 0.97;
        const tx = width / 2 - (k * (minX + maxX)) / 2;
        const ty = height / 2 - (k * (minY + maxY)) / 2;
        const target = zoomIdentity.translate(tx, ty).scale(k);
        if (animate) svg.transition().duration(450).call(z.zoom.transform, target);
        else svg.call(z.zoom.transform, target);
      }
      fit(false);

      apiRef.current = {
        fit: () => fit(true),
        zoomBy: (f) => {
          svg.transition().duration(200).call(z.zoom.scaleBy, f);
        },
      };

      // referenced for future expansion (hot reload paths drop stepById)
      void stepById;

      return () => {
        for (const s of stepSprings.values()) s.stop();
        stepSprings.clear();
        tiersRef.current = null;
        apiRef.current = null;
      };
    }, [width, height, layout]);

    useEffect(() => {
      tiersRef.current?.(selected, pinned);
    }, [selected, pinned]);

    return <svg ref={svgRef} width={width} height={height} className="viz-svg" />;
  },
);

// ── projection meta ──────────────────────────────────────────────────────

const FLOW_STEP_INDEX = new Map(ATLAS.flow.steps.map((s) => [s.id, s]));
const FLOW_LANE_INDEX = new Map(ATLAS.flow.lanes.map((l, i) => [l.id, i]));

export function viewFlowMeta(): ProjectionMeta {
  return {
    id: "flow",
    label: "Flows",
    eyebrow: "Request → response",
    title: "Book a stay",
    stageTitle: "Flow · Book a stay",
    stageMeta: `8 steps · happy path + 2 error branches · <span style="color:var(--coral)">1 drift</span>`,
    layouts: [
      { id: "horizontal", label: "horizontal" },
      { id: "vertical", label: "vertical" },
    ],
    defaultLayout: "horizontal",
    filters: [],
    legendTitle: "Path",
    legend: [
      { glyph: '<span style="color:var(--cyan-hi)">━</span>', label: "Happy path (animated)" },
      { glyph: '<span style="color:var(--coral)">┄</span>', label: "Error branch" },
      { glyph: '<span style="color:var(--lime)">◌</span>', label: "2xx response" },
      { glyph: '<span style="color:var(--coral)">●</span>', label: "Contract drift" },
    ],
  };
}

export function viewFlowOutliner(): OutlinerGroup[] {
  const D = ATLAS.flow;
  const seq = D.steps.filter((s) => s.seq).slice().sort((a, b) => a.seq.localeCompare(b.seq));
  return [
    {
      section: "Call sequence",
      rows: seq.map((s) => ({
        id: s.id,
        label: `${s.seq} · ${s.label}`,
        color: TYPE[s.type as NodeKind].glow,
        sub: s.sub ?? "",
        badge: s.drift ? { label: "drift", color: tokens.coral } : undefined,
      })),
    },
    {
      section: "Outcomes",
      rows: D.steps
        .filter((s) => s.terminal)
        .map((s) => ({
          id: s.id,
          label: s.label,
          color: s.terminal === "ok" ? tokens.lime : tokens.coral,
          badge: {
            label: s.terminal === "ok" ? "2xx" : "err",
            color: s.terminal === "ok" ? tokens.lime : tokens.coral,
          },
        })),
    },
  ];
}

export function viewFlowDescribe(id: string): InspectorModel | null {
  const D = ATLAS.flow;
  const s = FLOW_STEP_INDEX.get(id);
  if (!s) return null;
  const t = TYPE[s.type as NodeKind];
  const laneIdx = FLOW_LANE_INDEX.get(s.lane) ?? 0;
  const lane = D.lanes[laneIdx];
  const badges = [];
  if (s.terminal === "ok") badges.push({ label: "RESPONSE 2XX", color: tokens.lime, bg: "rgba(163,230,53,0.14)" });
  if (s.terminal === "err") badges.push({ label: "ERROR PATH", color: tokens.coral, bg: "rgba(251,113,133,0.14)" });
  if (s.drift) badges.push({ label: "DRIFT", color: tokens.coral, bg: "rgba(251,113,133,0.14)" });

  const ins: InspectorModel["sections"][number]["rels"] = [];
  const outs: InspectorModel["sections"][number]["rels"] = [];
  D.edges.forEach((e) => {
    if (e.to === id) {
      const o = FLOW_STEP_INDEX.get(e.from);
      if (o)
        ins.push({
          label: o.label,
          color: TYPE[o.type as NodeKind].glow,
          kind: (e.label ?? "→") + (e.path === "err" ? " · err" : ""),
          target: e.from,
        });
    } else if (e.from === id) {
      const o = FLOW_STEP_INDEX.get(e.to);
      if (o)
        outs.push({
          label: o.label,
          color: TYPE[o.type as NodeKind].glow,
          kind: (e.label ?? "→") + (e.path === "err" ? " · err" : ""),
          target: e.to,
        });
    }
  });

  const sections: InspectorModel["sections"] = [
    {
      title: "Step",
      props: [
        { k: "lane", v: lane.label },
        { k: "kind", v: t.label },
        { k: "detail", v: s.sub ?? "—", mono: true, color: tokens.cyanHi },
        { k: "sequence", v: s.seq ? `#${s.seq}` : "entry/exit", mono: true },
      ],
    },
  ];
  if (ins.length) sections.push({ title: "Called by", rels: ins });
  if (outs.length) sections.push({ title: "Calls", rels: outs });

  return {
    type: s.type,
    typeLabel: t.label,
    title: s.label,
    accent: s.terminal === "err" ? tokens.coral : t.glow,
    id: `step ${s.seq || "—"} · ${s.id}`,
    badges,
    sections,
    actions: [
      { label: "Trace", kind: "primary" },
      { label: "Logs", kind: "ghost" },
    ],
  };
}
