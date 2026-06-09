/* Tessera · view-data — Entity-Relationship view.
 *
 * Same domain as the DDD graph, expressed as physical tables. Glass cards
 * with typed field rows; PK/FK/unique/index markers from the `--erd-*`
 * tokens. Relationships are crow's-foot, anchored on the child fk column.
 *
 * Mirrors `crates/desktop/design/diagrams/view-data.js`. Two layouts:
 * `spatial` (hand-tuned coords) and `grid` (tidy columns).
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { drag as d3Drag, type D3DragEvent } from "d3-drag";
import { zoomIdentity } from "d3-zoom";

import {
  HUE,
  LARGE_GRAPH_THRESHOLD,
  attachZoom,
  computeTiers,
  injectDefs,
  select as d3Select,
  type D3Selection,
  type HueName,
} from "./viz-core";
import { ATLAS, type ErdAccent, type ErdCardinality, type ErdTable } from "./data";
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

type DataLayout = "spatial" | "grid";

interface ErdCardModel extends ErdTable {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CW = 196;
const HEAD = 34;
const ROW = 22;
const PAD = 8;
const cardHeight = (t: ErdTable): number => HEAD + t.fields.length * ROW + PAD;

const SPATIAL: Record<string, { fx: number; fy: number }> = {
  guests: { fx: 0.1, fy: 0.1 },
  hosts: { fx: 0.1, fy: 0.62 },
  reservations: { fx: 0.42, fy: 0.1 },
  listings: { fx: 0.44, fy: 0.6 },
  payments: { fx: 0.76, fy: 0.07 },
  reviews: { fx: 0.76, fy: 0.4 },
  availability: { fx: 0.76, fy: 0.74 },
  listing_photos: { fx: 0.45, fy: 1.0 },
};

const VW = 1240;
const VH = 820;

function accentColor(a: ErdAccent): string {
  return HUE[a as HueName] ?? tokens.indigo;
}

function gridPositions(width: number): Record<string, { x: number; yTop: number }> {
  const order = [
    "guests",
    "reservations",
    "payments",
    "reviews",
    "hosts",
    "listings",
    "availability",
    "listing_photos",
  ];
  const cols = 4;
  const gapX = (width - cols * CW) / (cols + 1);
  const pos: Record<string, { x: number; yTop: number }> = {};
  order.forEach((id, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    pos[id] = { x: gapX + c * (CW + gapX), yTop: r === 0 ? 24 : 320 };
  });
  return pos;
}

function injectErdMarkers(svg: D3Selection<SVGSVGElement>): void {
  const defs = svg.select<SVGDefsElement>("defs");
  if (defs.empty()) return;
  // Add crow's-foot markers under stable ids; viz-core's injectDefs cleared
  // the defs in this call, but we run after it so this is safe.
  if (!defs.select("#crow-many").empty()) return;
  const many = defs
    .append("marker")
    .attr("id", "crow-many")
    .attr("viewBox", "0 0 12 14")
    .attr("refX", 11)
    .attr("refY", 7)
    .attr("markerWidth", 10)
    .attr("markerHeight", 12)
    .attr("orient", "auto");
  many
    .append("path")
    .attr("d", "M 11 0 L 0 7 L 11 14 M 0 7 L 11 7")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1.2);
}

function footPath(
  x: number,
  y: number,
  dir: 1 | -1,
  card: ErdCardinality,
  color: string,
  feet: D3Selection<SVGGElement>,
): void {
  const k = 11 * dir;
  if (card === "many") {
    feet
      .append("path")
      .attr("d", `M ${x + k} ${y - 7} L ${x} ${y} L ${x + k} ${y + 7}`)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.3);
    feet
      .append("line")
      .attr("x1", x + k)
      .attr("y1", y)
      .attr("x2", x + k * 1.3)
      .attr("y2", y)
      .attr("stroke", color)
      .attr("stroke-width", 1.3);
  } else if (card === "one") {
    feet
      .append("line")
      .attr("x1", x + k * 0.7)
      .attr("y1", y - 6)
      .attr("x2", x + k * 0.7)
      .attr("y2", y + 6)
      .attr("stroke", color)
      .attr("stroke-width", 1.3);
  } else {
    feet
      .append("circle")
      .attr("cx", x + k * 1.1)
      .attr("cy", y)
      .attr("r", 3.4)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.2);
    feet
      .append("line")
      .attr("x1", x + k * 0.55)
      .attr("y1", y - 6)
      .attr("x2", x + k * 0.55)
      .attr("y2", y + 6)
      .attr("stroke", color)
      .attr("stroke-width", 1.3);
  }
}

export const ViewData = forwardRef<ViewHandle, { width: number; height: number }>(
  function ViewData({ width, height }, ref) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const apiRef = useRef<ViewHandle | null>(null);
    const tiersRef = useRef<((sel: string | null, pinned: ReadonlySet<string>) => void) | null>(null);

    const layout = (useLayout("data") ?? "spatial") as DataLayout;
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
      injectErdMarkers(svg);

      const D = ATLAS.data;
      const tables: ErdCardModel[] = D.tables.map((t) => {
        const h = cardHeight(t);
        let x: number;
        let y: number;
        if (layout === "grid") {
          const g = gridPositions(VW)[t.id];
          x = g.x;
          y = g.yTop;
        } else {
          const p = SPATIAL[t.id];
          x = p.fx * (VW - CW);
          y = p.fy * (VH - h) * 0.92 + 10;
        }
        return { ...t, x, y, w: CW, h };
      });
      const pos = new Map(tables.map((t) => [t.id, t]));

      const adjacency: Record<string, string[]> = {};
      for (const r of D.rels) {
        (adjacency[r.from] ??= []).push(r.to);
        (adjacency[r.to] ??= []).push(r.from);
      }
      setLargeGraph(tables.length > LARGE_GRAPH_THRESHOLD);

      const cardSprings = new Map<string, SpringHandle>();

      const root = svg.append("g").attr("class", "erd-root") as D3Selection<SVGGElement>;
      const edgeLayer = root.append("g").attr("class", "rel-layer");
      const cardLayer = root.append("g").attr("class", "card-layer");

      const edgeSel = edgeLayer
        .selectAll<SVGGElement, (typeof D.rels)[number]>("g.rel-edge")
        .data(D.rels, (d) => `${d.from}->${d.to}`)
        .enter()
        .append("g")
        .attr("class", "rel-edge");
      edgeSel.append("path").attr("fill", "none");
      edgeSel.append("g").attr("class", "feet");

      function fieldY(t: ErdCardModel, fname: string): number {
        const i = t.fields.findIndex((f) => f.name === fname);
        return t.y + HEAD + (i + 0.5) * ROW;
      }

      function routeEdges(): void {
        edgeSel.each(function (r) {
          const P = pos.get(r.from);
          const Ch = pos.get(r.to);
          if (!P || !Ch) return;
          const color = accentColor(P.accent);
          const pRight = P.x + P.w;
          const chRight = Ch.x + Ch.w;
          let x1: number;
          let x2: number;
          let d1: 1 | -1;
          let d2: 1 | -1;
          const pkField = P.fields.find((f) => f.pk);
          if (!pkField) return;
          const py = fieldY(P, pkField.name);
          const cy = fieldY(Ch, r.fk);
          if (Ch.x >= pRight - 20) {
            x1 = pRight;
            d1 = -1;
            x2 = Ch.x;
            d2 = 1;
          } else if (chRight <= P.x + 20) {
            x1 = P.x;
            d1 = 1;
            x2 = chRight;
            d2 = -1;
          } else if (Ch.x + Ch.w / 2 >= P.x + P.w / 2) {
            x1 = pRight;
            d1 = -1;
            x2 = Ch.x;
            d2 = 1;
          } else {
            x1 = P.x;
            d1 = 1;
            x2 = chRight;
            d2 = -1;
          }
          const g = d3Select(this);
          const midX = (x1 + x2) / 2;
          g.select<SVGPathElement>("path")
            .attr("d", `M ${x1} ${py} C ${midX} ${py} ${midX} ${cy} ${x2} ${cy}`)
            .attr("stroke", color)
            .attr("stroke-width", 1.4)
            .attr("stroke-opacity", 0.6);
          const feet = g.select<SVGGElement>(".feet") as D3Selection<SVGGElement>;
          feet.selectAll("*").remove();
          footPath(x1, py, d1, r.fromCard, color, feet);
          footPath(x2, cy, d2, r.toCard, color, feet);
        });
      }

      const card = cardLayer
        .selectAll<SVGGElement, ErdCardModel>("g.card")
        .data(tables, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "card")
        .style("cursor", "pointer")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      card.each(function (t) {
        const g = d3Select(this);
        const accent = accentColor(t.accent);
        g.append("rect")
          .attr("class", "card-bg")
          .attr("width", t.w)
          .attr("height", t.h)
          .attr("rx", 10)
          .attr("fill", "#10121f")
          .attr("stroke", tokens.line)
          .attr("stroke-width", 1)
          .style("filter", "drop-shadow(0 10px 24px rgba(0,0,0,0.45))");
        g.append("rect")
          .attr("width", t.w)
          .attr("height", HEAD)
          .attr("rx", 10)
          .attr("fill", accent)
          .attr("fill-opacity", 0.16);
        g.append("rect")
          .attr("y", HEAD - 10)
          .attr("width", t.w)
          .attr("height", 10)
          .attr("fill", accent)
          .attr("fill-opacity", 0.16);
        g.append("rect")
          .attr("class", "accent-bar")
          .attr("width", 3)
          .attr("height", HEAD)
          .attr("rx", 1.5)
          .attr("fill", accent);
        g.append("circle")
          .attr("cx", 16)
          .attr("cy", HEAD / 2)
          .attr("r", 3.5)
          .attr("fill", accent)
          .style("filter", "drop-shadow(0 0 5px " + accent + ")");
        g.append("text")
          .attr("x", 28)
          .attr("y", HEAD / 2 + 4)
          .attr("font-family", tokens.fontMono)
          .attr("font-size", 12)
          .attr("font-weight", 600)
          .attr("fill", tokens.text)
          .text(t.label);
        if (t.drift) {
          g.append("text")
            .attr("x", t.w - 10)
            .attr("y", HEAD / 2 + 3.5)
            .attr("text-anchor", "end")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 8)
            .attr("letter-spacing", "0.1em")
            .attr("fill", tokens.coral)
            .text("DRIFT");
        }

        t.fields.forEach((f, i) => {
          const ry = HEAD + i * ROW;
          const row = g.append("g").attr("transform", `translate(0,${ry})`);
          if (i % 2 === 1) {
            row
              .append("rect")
              .attr("width", t.w)
              .attr("height", ROW)
              .attr("fill", "rgba(255,255,255,0.015)");
          }
          if (f.pk) {
            row
              .append("text")
              .attr("x", 11)
              .attr("y", ROW / 2 + 4)
              .attr("text-anchor", "middle")
              .attr("font-size", 10)
              .attr("fill", tokens.amber)
              .text("◆");
          } else if (f.fk) {
            row
              .append("text")
              .attr("x", 11)
              .attr("y", ROW / 2 + 4)
              .attr("text-anchor", "middle")
              .attr("font-size", 10)
              .attr("fill", tokens.cyan)
              .text("◇");
          }
          row
            .append("text")
            .attr("x", 22)
            .attr("y", ROW / 2 + 4)
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 10.5)
            .attr("fill", f.pk ? tokens.text : tokens.textDim)
            .attr("font-weight", f.pk ? 600 : 400)
            .text(f.name);
          row
            .append("text")
            .attr("x", t.w - 10)
            .attr("y", ROW / 2 + 4)
            .attr("text-anchor", "end")
            .attr("font-family", tokens.fontMono)
            .attr("font-size", 9.5)
            .attr("fill", f.unique ? tokens.violet : tokens.textMute)
            .text(f.ftype);
          if (f.idx) {
            row
              .append("rect")
              .attr("x", 22)
              .attr("y", ROW / 2 + 7)
              .attr("width", f.name.length * 6)
              .attr("height", 1)
              .attr("fill", tokens.indigo)
              .attr("opacity", 0.5);
          }
        });
      });

      card
        .append("rect")
        .attr("class", "sel-ring")
        .attr("width", (d) => d.w)
        .attr("height", (d) => d.h)
        .attr("rx", 10)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("pointer-events", "none");

      card.on("click", (ev: MouseEvent, t) => {
        ev.stopPropagation();
        if (ev.metaKey || ev.ctrlKey) togglePin(t.id);
        else selectAction(t.id);
      });
      svg.on("click", () => selectAction(null));

      card.call(
        d3Drag<SVGGElement, ErdCardModel>()
          .on("start", function () {
            d3Select(this).raise();
          })
          .on("drag", function (ev: D3DragEvent<SVGGElement, ErdCardModel, ErdCardModel>, d) {
            d.x += ev.dx;
            d.y += ev.dy;
            d3Select(this).attr("transform", `translate(${d.x},${d.y})`);
            routeEdges();
          }),
      );

      routeEdges();

      function applyTiers(selId: string | null, pinnedSet: ReadonlySet<string>): void {
        const ids = tables.map((t) => t.id);
        const tierMap = computeTiers(ids, adjacency, selId);
        for (const p of pinnedSet) {
          if (tierMap[p]) tierMap[p] = "focus";
        }
        card.each(function (t) {
          const s = tierMap[t.id];
          const target = s === "ghost" ? 0.28 : s === "mid" ? 0.7 : 1;
          const el = this;
          const from = Number.parseFloat(el.style.opacity || "") || 1;
          let spring = cardSprings.get(t.id);
          if (!spring) {
            spring = makeSpring();
            cardSprings.set(t.id, spring);
          }
          spring.to(from, target, (v) => {
            el.style.opacity = String(v);
          });
        });
        card
          .select<SVGRectElement>(".sel-ring")
          .attr("stroke", (t) => (t.id === selId ? tokens.lime : "none"))
          .attr("stroke-width", 1.6)
          .attr("stroke-dasharray", "4 3");
        card
          .select<SVGRectElement>(".card-bg")
          .attr("stroke", (t) => (t.id === selId ? accentColor(t.accent) : tokens.line))
          .attr("stroke-width", (t) => (t.id === selId ? 1.5 : 1))
          .style("filter", (t) =>
            t.id === selId
              ? "drop-shadow(0 12px 30px " + accentColor(t.accent) + "55)"
              : "drop-shadow(0 10px 24px rgba(0,0,0,0.45))",
          );
        edgeSel.transition().duration(320).style("opacity", (r) => {
          const a = tierMap[r.from];
          const b = tierMap[r.to];
          if (!selId) return 1;
          if (a === "ghost" && b === "ghost") return 0.12;
          if (r.from === selId || r.to === selId) return 1;
          return 0.3;
        });
      }

      tiersRef.current = applyTiers;
      applyTiers(selected, pinned);

      const z = attachZoom(svg, root, { scaleExtent: [0.4, 2.4] });
      function fit(animate: boolean): void {
        const minX = Math.min(...tables.map((t) => t.x)) - 30;
        const maxX = Math.max(...tables.map((t) => t.x + t.w)) + 30;
        const minY = Math.min(...tables.map((t) => t.y)) - 30;
        const maxY = Math.max(...tables.map((t) => t.y + t.h)) + 30;
        const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.3) * 0.96;
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
        for (const s of cardSprings.values()) s.stop();
        cardSprings.clear();
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

const DATA_TABLE_INDEX = new Map(ATLAS.data.tables.map((t) => [t.id, t]));

export function viewDataMeta(): ProjectionMeta {
  const D = ATLAS.data;
  return {
    id: "data",
    label: "Data",
    eyebrow: "Schema",
    title: "Atlas Stays",
    stageTitle: "Data · ERD",
    stageMeta: `${D.tables.length} tables · ${D.rels.length} relations · <span style="color:var(--coral)">1 drift</span>`,
    layouts: [
      { id: "spatial", label: "spatial" },
      { id: "grid", label: "grid" },
    ],
    defaultLayout: "spatial",
    filters: [],
    legendTitle: "Field markers",
    legend: [
      { glyph: '<span style="color:var(--amber)">◆</span>', label: "Primary key" },
      { glyph: '<span style="color:var(--cyan)">◇</span>', label: "Foreign key" },
      { glyph: '<span style="color:var(--indigo)">▁</span>', label: "Indexed column" },
      { glyph: "─<", label: "1 → many" },
      { glyph: "─o", label: "zero-or-one" },
    ],
  };
}

export function viewDataOutliner(): OutlinerGroup[] {
  const D = ATLAS.data;
  return [
    {
      section: "Tables",
      rows: D.tables.map((t) => ({
        id: t.id,
        label: t.label,
        color: accentColor(t.accent),
        sub: `${t.fields.length} cols · ${t.fields.filter((f) => f.fk).length} fk`,
        badge: t.drift ? { label: "drift", color: tokens.coral } : undefined,
      })),
    },
  ];
}

export function viewDataDescribe(id: string): InspectorModel | null {
  const D = ATLAS.data;
  const t = DATA_TABLE_INDEX.get(id);
  if (!t) return null;
  const accent = accentColor(t.accent);
  const badges = [];
  if (t.drift) badges.push({ label: "DRIFT", color: tokens.coral, bg: "rgba(251,113,133,0.14)" });

  const fieldProps = t.fields.map((f) => {
    const role = f.pk ? "PK" : f.fk ? "FK" : f.unique ? "UNIQUE" : f.idx ? "idx" : "";
    return {
      k: f.name + (f.idx && !f.pk && !f.fk && !f.unique ? "" : ""),
      v: role ? `${f.ftype} · ${role}` : f.ftype,
      mono: true,
      color: f.pk
        ? tokens.amber
        : f.fk
          ? tokens.cyan
          : f.unique
            ? tokens.violet
            : tokens.cyanHi,
    };
  });

  const fkCount = t.fields.filter((f) => f.fk).length;
  const idxCount = t.fields.filter((f) => f.idx).length;
  const pk = t.fields.find((f) => f.pk)?.name ?? "—";

  const rels: InspectorModel["sections"][number]["rels"] = [];
  D.rels.forEach((r) => {
    if (r.from === id) {
      const o = DATA_TABLE_INDEX.get(r.to);
      if (o) rels.push({ label: o.label, color: accentColor(o.accent), kind: "1 ─< many", target: r.to });
    } else if (r.to === id) {
      const o = DATA_TABLE_INDEX.get(r.from);
      if (o) rels.push({ label: o.label, color: accentColor(o.accent), kind: "many >─ 1", target: r.from });
    }
  });

  return {
    type: "module",
    typeLabel: "table",
    title: t.label,
    accent,
    id: `table@${t.id} · ${t.fields.length} cols`,
    badges,
    sections: [
      { title: `Columns · ${t.fields.length}`, props: fieldProps },
      {
        title: "Indexes & keys",
        props: [
          { k: "primary key", v: pk, mono: true, color: tokens.amber },
          { k: "foreign keys", v: String(fkCount), mono: true, color: tokens.cyan },
          { k: "indexes", v: String(idxCount), mono: true },
        ],
      },
      { title: `Relations · ${rels.length}`, rels },
    ],
    actions: [
      { label: "Edit schema", kind: "primary" },
      { label: "Migration", kind: "ghost" },
    ],
  };
}
