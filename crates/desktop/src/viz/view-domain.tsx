/* Tessera · view-domain — DDD domain graph.
 *
 * Force-directed graph with bounded-context territory hulls. Mirrors the
 * reference in `crates/desktop/design/diagrams/view-domain.js`; if prose
 * and code disagree, the reference code wins.
 *
 * Three layouts (`contexts`, `force`, `radial`) re-bind the same nodes and
 * edges; selection and pin state come from the global app-store, so
 * focus / mid / ghost tiers stay consistent across views.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { drag as d3Drag, type D3DragEvent } from "d3-drag";
import { zoomIdentity } from "d3-zoom";

import {
  HUE,
  TIER_STYLE,
  TYPE,
  adjacencyOf,
  attachZoom,
  computeTiers,
  curve,
  drawNode,
  drawSelectionRing,
  injectDefs,
  select as d3Select,
  type D3Selection,
  type NodeKind,
  type Tier,
} from "./viz-core";
import { ATLAS, type DomainNode } from "./data";
import {
  select as selectAction,
  setLargeGraph,
  togglePin,
  useFilters,
  useLayout,
  usePinned,
  useSelected,
} from "../state/app-store";
import { tokens } from "../tokens";

export interface ViewHandle {
  fit: () => void;
  zoomBy: (factor: number) => void;
}

type DomainLayout = "contexts" | "force" | "radial";

interface SimNode extends DomainNode, SimulationNodeDatum {}
interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string;
  dashed?: boolean;
  drift?: boolean;
}

const R: Record<string, number> = {
  aggregate: 27,
  contract: 22,
  useCase: 22,
  entity: 16,
  value: 17,
  decision: 19,
  actor: 18,
};
const radiusOf = (n: { type: string }): number => R[n.type] ?? 18;

const CTX_POS: Record<string, { fx: number; fy: number }> = {
  booking: { fx: 0.4, fy: 0.4 },
  inventory: { fx: 0.7, fy: 0.3 },
  billing: { fx: 0.72, fy: 0.72 },
  reviews: { fx: 0.4, fy: 0.78 },
};

const EDGE_MUTED = new Set(["contains", "has", "reads"]);
const EDGE_DASHED = new Set(["decides", "syncs"]);

const VW = 1200;
const VH = 740;

// Position cache survives layout switches inside this view.
const POS_CACHE = new Map<string, { x: number; y: number }>();

const rgbaWhite = (a: number): string => "rgb" + "a(255,255,255," + String(a) + ")";

export const ViewDomain = forwardRef<ViewHandle, { width: number; height: number }>(
  function ViewDomain({ width, height }, ref) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const apiRef = useRef<ViewHandle | null>(null);
    const tiersRef = useRef<((sel: string | null, pinned: ReadonlySet<string>) => void) | null>(null);

    const layout = (useLayout("domain") ?? "contexts") as DomainLayout;
    const filters = useFilters("domain");
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
      const el = svgRef.current;
      if (!el || width <= 0 || height <= 0) return;

      const svg = d3Select(el) as D3Selection<SVGSVGElement>;
      svg.selectAll("*").remove();
      injectDefs(svg);

      const D = ATLAS.domain;
      const visibleNodes: SimNode[] = D.nodes
        .filter((n) => !filters.has(n.type))
        .map((n) => {
          const cached = POS_CACHE.get(n.id);
          return { ...n, ...(cached ?? {}) };
        });
      const visible = new Set(visibleNodes.map((n) => n.id));
      const links: SimLink[] = D.edges
        .filter((e) => visible.has(e.from) && visible.has(e.to))
        .map((e) => ({
          id: e.id,
          from: e.from,
          to: e.to,
          kind: e.kind,
          label: e.label,
          dashed: e.dashed,
          drift: e.drift,
          source: e.from,
          target: e.to,
        }));

      // Seed positions for any node that doesn't have a cached layout yet.
      for (const n of visibleNodes) {
        if (n.x == null || n.y == null) {
          const p = n.ctx ? CTX_POS[n.ctx] ?? { fx: 0.12, fy: 0.5 } : { fx: 0.12, fy: 0.5 };
          n.x = p.fx * VW + (Math.random() - 0.5) * 80;
          n.y = p.fy * VH + (Math.random() - 0.5) * 80;
          if (!n.ctx) {
            n.x = 0.1 * VW + (Math.random() - 0.5) * 40;
            n.y = (0.3 + Math.random() * 0.5) * VH;
          }
        }
      }

      const adjacency = adjacencyOf(D.edges);
      setLargeGraph(visibleNodes.length > 250);

      const sim: Simulation<SimNode, SimLink> = forceSimulation<SimNode>(visibleNodes)
        .force(
          "link",
          forceLink<SimNode, SimLink>(links)
            .id((d) => d.id)
            .distance((l) => (l.kind === "contains" || l.kind === "has" ? 64 : 116))
            .strength((l) => (l.kind === "references" ? 0.25 : 0.7)),
        )
        .force("charge", forceManyBody<SimNode>().strength(-560))
        .force("collide", forceCollide<SimNode>().radius((d) => radiusOf(d) + 26))
        .alphaDecay(0.045);

      if (layout === "contexts") {
        sim
          .force(
            "x",
            forceX<SimNode>((d) => {
              const c = d.ctx ? CTX_POS[d.ctx] : undefined;
              return c ? c.fx * VW : 0.1 * VW;
            }).strength((d) => (d.ctx ? 0.34 : 0.18)),
          )
          .force(
            "y",
            forceY<SimNode>((d) => {
              const c = d.ctx ? CTX_POS[d.ctx] : undefined;
              return c ? c.fy * VH : 0.5 * VH;
            }).strength((d) => (d.ctx ? 0.34 : 0.12)),
          );
      } else if (layout === "radial") {
        const ring: Record<string, number> = {
          contract: 110,
          aggregate: 200,
          useCase: 200,
          entity: 290,
          value: 290,
          decision: 90,
          actor: 340,
          module: 290,
        };
        sim
          .force("r", forceRadial<SimNode>((d) => ring[d.type] ?? 250, VW / 2, VH / 2).strength(0.55))
          .force("x", forceX<SimNode>(VW / 2).strength(0.02))
          .force("y", forceY<SimNode>(VH / 2).strength(0.02));
      } else {
        sim
          .force("center", forceCenter(VW / 2, VH / 2))
          .force("x", forceX<SimNode>(VW / 2).strength(0.03))
          .force("y", forceY<SimNode>(VH / 2).strength(0.03));
      }

      // Settle synchronously so the first paint is calm.
      sim.alpha(1);
      for (let i = 0; i < 300; i++) sim.tick();
      sim.stop();
      for (const n of visibleNodes) {
        if (n.x != null && n.y != null) POS_CACHE.set(n.id, { x: n.x, y: n.y });
      }

      const root = svg.append("g").attr("class", "domain-root") as D3Selection<SVGGElement>;
      const hullLayer = root.append("g").attr("class", "hull-layer");
      const edgeLayer = root.append("g").attr("class", "edge-layer");
      const nodeLayer = root.append("g").attr("class", "node-layer");

      // ── edges ──
      const linkSel = edgeLayer
        .selectAll<SVGGElement, SimLink>("g.edge")
        .data(links, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "edge");
      linkSel.append("path").attr("class", "edge-path").attr("fill", "none");
      const labeled = linkSel.filter((d) => !!d.label);
      labeled
        .append("rect")
        .attr("class", "edge-lbl-bg")
        .attr("height", 16)
        .attr("rx", 8)
        .attr("fill", tokens.surface2)
        .attr("stroke", tokens.line)
        .attr("stroke-width", 0.5);
      labeled
        .append("text")
        .attr("class", "edge-lbl")
        .attr("text-anchor", "middle")
        .attr("font-family", tokens.fontMono)
        .attr("font-size", 9.5)
        .attr("fill", tokens.textDim)
        .attr("dy", 3)
        .text((d) => d.label ?? "");

      // ── nodes ──
      const g = nodeLayer
        .selectAll<SVGGElement, SimNode>("g.node")
        .data(visibleNodes, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "node")
        .style("cursor", "pointer");

      g.each(function (n) {
        const node = d3Select(this) as D3Selection<SVGGElement, SimNode>;
        node.append("g").attr("class", "ring-slot");
        const shape = node
          .append("g")
          .attr("class", "shape-slot") as unknown as Parameters<typeof drawNode>[0];
        drawNode(shape, n, radiusOf(n));
        if (n.frozen) {
          node
            .append("circle")
            .attr("class", "frozen-ring")
            .attr("r", radiusOf(n) + 5)
            .attr("fill", "none")
            .attr("stroke", tokens.lime)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2 3")
            .attr("opacity", 0.8);
        }
        if (n.drift) {
          node
            .append("circle")
            .attr("class", "drift")
            .attr("cx", radiusOf(n) * 0.72)
            .attr("cy", -radiusOf(n) * 0.72)
            .attr("r", 4.5)
            .attr("fill", tokens.coral)
            .style("filter", "drop-shadow(0 0 7px " + tokens.coral + ")");
        }
        if (n.root) {
          node
            .append("circle")
            .attr("class", "root-accent")
            .attr("cx", -radiusOf(n) * 0.72)
            .attr("cy", -radiusOf(n) * 0.72)
            .attr("r", 2.5)
            .attr("fill", tokens.violet)
            .attr("opacity", 0.85);
        }
        const lbl = node.append("g").attr("class", "label").style("pointer-events", "none");
        lbl
          .append("text")
          .attr("class", "l1")
          .attr("text-anchor", "middle")
          .attr("y", radiusOf(n) + 16)
          .attr("font-family", tokens.fontSans)
          .attr("font-weight", 600)
          .attr("font-size", 12)
          .attr("fill", tokens.text)
          .text(n.label);
        lbl
          .append("text")
          .attr("class", "l2")
          .attr("text-anchor", "middle")
          .attr("y", radiusOf(n) + 29)
          .attr("font-family", tokens.fontMono)
          .attr("font-size", 8.5)
          .attr("letter-spacing", "0.1em")
          .attr("fill", tokens.textMute)
          .text(":" + n.type);
      });

      g.on("click", (ev: MouseEvent, n) => {
        ev.stopPropagation();
        if (ev.metaKey || ev.ctrlKey) togglePin(n.id);
        else selectAction(n.id);
      });

      svg.on("click", () => selectAction(null));

      g.call(
        d3Drag<SVGGElement, SimNode>()
          .on("start", (_ev: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
            sim.alphaTarget(0.25).restart();
            d.fx = d.x ?? null;
            d.fy = d.y ?? null;
          })
          .on("drag", (ev: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on("end", (_ev: D3DragEvent<SVGGElement, SimNode, SimNode>, d) => {
            sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            if (d.x != null && d.y != null) POS_CACHE.set(d.id, { x: d.x, y: d.y });
          }),
      );

      function tick(): void {
        linkSel.select<SVGPathElement>(".edge-path").attr("d", (l) => {
          const s = l.source as SimNode;
          const t = l.target as SimNode;
          const lift = l.kind === "decides" ? 0.32 : l.kind === "references" ? 0.22 : 0.16;
          return curve(s.x ?? 0, s.y ?? 0, t.x ?? 0, t.y ?? 0, lift);
        });
        labeled
          .select<SVGRectElement>(".edge-lbl-bg")
          .attr("x", (l) => ((l.source as SimNode).x! + (l.target as SimNode).x!) / 2 - 30)
          .attr("y", (l) => ((l.source as SimNode).y! + (l.target as SimNode).y!) / 2 - 16)
          .attr("width", 60);
        labeled
          .select<SVGTextElement>(".edge-lbl")
          .attr("x", (l) => ((l.source as SimNode).x! + (l.target as SimNode).x!) / 2)
          .attr("y", (l) => ((l.source as SimNode).y! + (l.target as SimNode).y!) / 2 - 8);
        g.attr("transform", (d) => "translate(" + (d.x ?? 0) + "," + (d.y ?? 0) + ")");
        drawHulls();
      }

      function drawHulls(): void {
        const data = D.contexts
          .map((c) => ({
            c,
            pts: visibleNodes
              .filter((n) => n.ctx === c.id)
              .map((n) => [n.x ?? 0, n.y ?? 0] as [number, number]),
          }))
          .filter((d) => d.pts.length >= 2);

        const sel = hullLayer
          .selectAll<SVGGElement, { c: typeof D.contexts[number]; pts: [number, number][] }>("g.hull")
          .data(data, (d) => d.c.id);
        sel.exit().remove();
        const enter = sel.enter().append("g").attr("class", "hull");
        enter.append("path");
        enter.append("text").attr("class", "hull-lbl");
        const merged = enter.merge(sel);
        merged
          .select<SVGPathElement>("path")
          .attr("d", (d) => hullPath(d.pts, 40))
          .attr("fill", (d) => HUE[d.c.hue])
          .attr("fill-opacity", 0.07)
          .attr("stroke", (d) => HUE[d.c.hue])
          .attr("stroke-opacity", 0.32)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2 5");
        merged.select<SVGTextElement>("text.hull-lbl").each(function (d) {
          const xs = d.pts.map((p) => p[0]);
          const ys = d.pts.map((p) => p[1]);
          d3Select(this)
            .attr("x", Math.min(...xs) - 4)
            .attr("y", Math.min(...ys) - 30)
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 10)
            .attr("letter-spacing", "0.16em")
            .attr("fill", HUE[d.c.hue])
            .attr("opacity", 0.8)
            .text(d.c.label.toUpperCase());
        });
      }

      tick();
      sim.on("tick", tick);

      function applyTiers(selId: string | null, pinnedSet: ReadonlySet<string>): void {
        const ids = visibleNodes.map((n) => n.id);
        const tierMap = computeTiers(ids, adjacency, selId);
        for (const p of pinnedSet) {
          if (tierMap[p]) tierMap[p] = "focus";
        }
        g.each(function (n) {
          const tier: Tier = tierMap[n.id] ?? "focus";
          const st = TIER_STYLE[tier];
          const node = d3Select(this);
          node.transition().duration(360).style("opacity", st.opacity);
          node
            .select(".shape-slot")
            .style(
              "filter",
              tier === "ghost" ? "url(#blurGhost)" : tier === "mid" ? "url(#blurMid)" : "none",
            );
          node.select(".label").transition().duration(300).style("opacity", st.label);
          const rs = node.select<SVGGElement>(".ring-slot") as D3Selection<SVGGElement>;
          rs.selectAll("*").remove();
          if (n.id === selId) drawSelectionRing(rs, radiusOf(n), TYPE[n.type as NodeKind].glow);
        });
        linkSel
          .transition()
          .duration(360)
          .style("opacity", (l) => {
            const a = tierMap[(l.source as SimNode).id];
            const b = tierMap[(l.target as SimNode).id];
            if (a === "ghost" || b === "ghost") return 0.12;
            if (a === "mid" || b === "mid") return 0.5;
            return 1;
          });
        linkSel
          .select<SVGPathElement>(".edge-path")
          .attr("stroke", (l) =>
            l.drift ? tokens.coral : EDGE_MUTED.has(l.kind) ? rgbaWhite(0.16) : rgbaWhite(0.5),
          )
          .attr("stroke-width", (l) => (l.label ? 1.8 : 1.3))
          .attr("stroke-dasharray", (l) => (l.drift || EDGE_DASHED.has(l.kind) ? "5 5" : null))
          .attr("marker-end", (l) =>
            l.drift ? "url(#arrowCoral)" : EDGE_MUTED.has(l.kind) ? "url(#arrowMuted)" : "url(#arrow)",
          );
      }

      tiersRef.current = applyTiers;
      applyTiers(selected, pinned);

      const z = attachZoom(svg, root, { scaleExtent: [0.4, 2.6] });
      function fit(animate: boolean): void {
        const xs = visibleNodes.map((n) => n.x ?? 0);
        const ys = visibleNodes.map((n) => n.y ?? 0);
        const minX = Math.min(...xs) - 60;
        const maxX = Math.max(...xs) + 60;
        const minY = Math.min(...ys) - 70;
        const maxY = Math.max(...ys) + 70;
        const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.4) * 0.94;
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

      return () => {
        sim.stop();
        tiersRef.current = null;
        apiRef.current = null;
      };
    }, [width, height, layout, filters]);

    useEffect(() => {
      tiersRef.current?.(selected, pinned);
    }, [selected, pinned]);

    return <svg ref={svgRef} width={width} height={height} className="viz-svg" />;
  },
);

// ── geometry helpers (replacements for d3-polygon / d3-shape) ──────────────

function convexHull(pts: [number, number][]): [number, number][] {
  if (pts.length <= 1) return pts.slice();
  const sorted = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function expandHull(hull: [number, number][], pad: number): [number, number][] {
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
  return hull.map((p) => {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (dx / len) * pad, p[1] + (dy / len) * pad];
  });
}

function smoothClosedPath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return "M " + pts[0][0] + "," + pts[0][1];
  const mid = (i: number, j: number): [number, number] => [
    (pts[i][0] + pts[j][0]) / 2,
    (pts[i][1] + pts[j][1]) / 2,
  ];
  const start = mid(n - 1, 0);
  let d = "M " + start[0] + "," + start[1] + " ";
  for (let i = 0; i < n; i++) {
    const m = mid(i, (i + 1) % n);
    d += "Q " + pts[i][0] + "," + pts[i][1] + " " + m[0] + "," + m[1] + " ";
  }
  return d + "Z";
}

function hullPath(points: [number, number][], pad: number): string {
  let pts = points;
  if (pts.length < 3) {
    const a = pts.length === 2 ? pts[0] : pts[0];
    const b: [number, number] =
      pts.length === 2 ? pts[1] : [pts[0][0] + 1, pts[0][1] + 1];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    pts = [
      [mx - pad, my - pad],
      [mx + pad, my - pad],
      [mx + pad, my + pad],
      [mx - pad, my + pad],
    ];
  }
  const hull = convexHull(pts);
  const expanded = expandHull(hull, pad);
  return smoothClosedPath(expanded);
}
