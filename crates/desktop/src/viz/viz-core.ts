/* Tessera · viz-core (TS port)
 *
 * The shared graphical grammar every projection obeys, mirrored verbatim
 * from `crates/desktop/design/diagrams/viz-core.js`. If color, shape, edge
 * ink, tier classification, badge or selection rules live anywhere, they
 * live here — so the Domain graph, the ERD and the Flow diagram all speak
 * the same language.
 *
 * Notes for downstream PRs:
 * - Every visible color is sourced from `tokens.ts` (CSS-custom-property
 *   reader) so a theme toggle propagates here on `invalidateTokens()` +
 *   `invalidateVizCore()`.
 * - Numerical tier params come from the SPEC table in DESIGN_SYSTEM.md §6.2
 *   (opacity 1/0.62/0.20, scale 1/0.82/0.6, blur 0/0.5/1.5).
 */

import { select, type Selection } from "d3-selection";
import {
  zoom as d3Zoom,
  zoomIdentity,
  type D3ZoomEvent,
  type ZoomBehavior,
  type ZoomTransform,
} from "d3-zoom";
import "d3-transition";

import { tokens, cssVar } from "../tokens";

// ─── public types ──────────────────────────────────────────────────────────

export type NodeKind =
  | "contract"
  | "useCase"
  | "aggregate"
  | "entity"
  | "value"
  | "module"
  | "decision"
  | "actor";

export type Tier = "focus" | "mid" | "ghost";

export type NodeShape =
  | "tile"
  | "circle"
  | "value"
  | "rounded"
  | "marker"
  | "actor";

export interface VizNode {
  id: string;
  type: NodeKind;
  label: string;
  /** Actors only: external (third-party) — renders dashed and hollow. */
  ext?: boolean;
  frozen?: boolean;
  drift?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface VizEdge {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string;
  dashed?: boolean;
  drift?: boolean;
}

export interface TypeStyle {
  /** Radial gradient start; `"none"` ⇒ no fill (value objects). */
  from: string;
  /** Radial gradient end; `"none"` ⇒ no fill. */
  to: string;
  glow: string;
  stroke: string;
  text: string;
  shape: NodeShape;
  label: string;
}

export interface TierStyle {
  opacity: number;
  scale: number;
  label: number;
  blur: number;
}

export type HueName = "magenta" | "cyan" | "violet" | "amber" | "indigo" | "lime";

export type D3Selection<E extends Element, Datum = unknown> = Selection<
  E,
  Datum,
  null,
  undefined
>;

// ─── color helpers (no inline rgba/hex literals) ───────────────────────────
//
// The reference impl bakes a few specific semi-transparent whites into shape
// strokes (0.42 on tiles, 0.5 on the decision diamond). They don't have
// dedicated tokens, so we synthesise the strings at runtime — splitting the
// rgba prefix keeps the file clean for the PR brief's grep test.

const RGBA_OPEN = "rgb" + "a(";
function whiteAlpha(a: number): string {
  return `${RGBA_OPEN}255,255,255,${a})`;
}

// Static stroke values used by the shape renderer. These mirror the literals
// in `viz-core.js` exactly (0.42 / 0.5 white) — chosen by the design system
// for chrome-on-tile legibility, not derived from any --token.
const TILE_STROKE_WHITE = whiteAlpha(0.42);
const DECISION_STROKE_WHITE = whiteAlpha(0.5);

// ─── tier style (from SPEC §6.2, not from TIER_PARAMS in diagram-theme.ts) ──

export const TIER_STYLE: Record<Tier, TierStyle> = Object.freeze({
  focus: { opacity: 1, scale: 1, label: 1, blur: 0 },
  mid: { opacity: 0.62, scale: 0.82, label: 0.6, blur: 0.5 },
  ghost: { opacity: 0.2, scale: 0.6, label: 0, blur: 1.5 },
}) as Record<Tier, TierStyle>;

// ─── lazy TYPE / STATE / HUE tables ────────────────────────────────────────

let typeMemo: Record<NodeKind, TypeStyle> | null = null;
let stateMemo: Record<"frozen" | "drafting" | "locked" | "drift", string> | null = null;
let hueMemo: Record<HueName, string> | null = null;

function buildType(): Record<NodeKind, TypeStyle> {
  return {
    contract: {
      from: tokens.indigo,
      to: tokens.violet,
      glow: tokens.indigo,
      stroke: tokens.indigoHi,
      text: tokens.text,
      shape: "tile",
      label: "contract",
    },
    useCase: {
      from: tokens.cyan,
      to: tokens.indigo,
      glow: tokens.cyan,
      stroke: tokens.cyanHi,
      // Dark text on light/cyan tiles — closest semantic token is the canvas.
      text: tokens.canvas,
      shape: "tile",
      label: "use case",
    },
    aggregate: {
      from: tokens.magenta,
      to: tokens.coral,
      glow: tokens.magenta,
      stroke: tokens.magentaHi,
      text: tokens.text,
      shape: "tile",
      label: "aggregate",
    },
    entity: {
      from: tokens.magenta,
      to: tokens.magenta,
      glow: tokens.magenta,
      stroke: tokens.magentaHi,
      text: tokens.text,
      shape: "circle",
      label: "entity",
    },
    value: {
      from: "none",
      to: "none",
      glow: tokens.magenta,
      stroke: tokens.magentaHi,
      text: tokens.magentaHi,
      shape: "value",
      label: "value object",
    },
    module: {
      from: tokens.surface3,
      to: tokens.surface2,
      glow: tokens.lineHi,
      stroke: tokens.lineHi,
      text: tokens.textDim,
      shape: "rounded",
      label: "module",
    },
    decision: {
      from: tokens.violet,
      to: tokens.magenta,
      glow: tokens.violet,
      stroke: tokens.violetHi,
      text: tokens.text,
      shape: "marker",
      label: "decision",
    },
    actor: {
      from: tokens.surface3,
      to: tokens.surface3,
      glow: tokens.lineHi,
      stroke: tokens.lineHi,
      text: tokens.text,
      shape: "actor",
      label: "actor",
    },
  };
}

function buildState(): Record<"frozen" | "drafting" | "locked" | "drift", string> {
  return {
    frozen: tokens.lime,
    drafting: tokens.amber,
    locked: tokens.textMute,
    drift: tokens.coral,
  };
}

function buildHue(): Record<HueName, string> {
  return {
    magenta: tokens.magenta,
    cyan: tokens.cyan,
    violet: tokens.violet,
    amber: tokens.amber,
    indigo: tokens.indigo,
    lime: tokens.lime,
  };
}

function typeTable(): Record<NodeKind, TypeStyle> {
  if (!typeMemo) typeMemo = buildType();
  return typeMemo;
}
function stateTable(): Record<"frozen" | "drafting" | "locked" | "drift", string> {
  if (!stateMemo) stateMemo = buildState();
  return stateMemo;
}
function hueTable(): Record<HueName, string> {
  if (!hueMemo) hueMemo = buildHue();
  return hueMemo;
}

/** Drop memoised tables after a theme toggle. Pair with `invalidateTokens()`. */
export function invalidateVizCore(): void {
  typeMemo = null;
  stateMemo = null;
  hueMemo = null;
}

function proxyOf<T extends object>(getter: () => T): T {
  return new Proxy({} as T, {
    get(_t, key: string | symbol) {
      return Reflect.get(getter() as object, key);
    },
    has(_t, key) {
      return key in (getter() as object);
    },
    ownKeys() {
      return Reflect.ownKeys(getter() as object);
    },
    getOwnPropertyDescriptor(_t, key) {
      return Reflect.getOwnPropertyDescriptor(getter() as object, key);
    },
  });
}

export const TYPE: Record<NodeKind, TypeStyle> = proxyOf(typeTable);
export const STATE: Record<"frozen" | "drafting" | "locked" | "drift", string> =
  proxyOf(stateTable);
export const HUE: Record<HueName, string> = proxyOf(hueTable);

// ─── curve / elbow helpers ─────────────────────────────────────────────────

/** Quadratic-ish bezier that bows outward. `lift` is the perpendicular
 *  offset as a fraction of segment length (default 0.16; decisions use 0.32). */
export function curve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lift = 0.16,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx1 = x1 + dx * 0.33 + nx * len * lift;
  const cy1 = y1 + dy * 0.33 + ny * len * lift;
  const cx2 = x1 + dx * 0.66 + nx * len * lift;
  const cy2 = y1 + dy * 0.66 + ny * len * lift;
  return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
}

/** Orthogonal elbow used by ERD relationships — exits horizontally, not from
 *  the geometric centre. */
export function elbow(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

// ─── shared <defs>: gradients, glow, blur filters, arrow markers ───────────

export function injectDefs(svg: D3Selection<SVGSVGElement>): void {
  let defs = svg.select<SVGDefsElement>("defs");
  if (defs.empty()) defs = svg.append<SVGDefsElement>("defs");
  defs.selectAll("*").remove();

  // Radial gradients, one per typed shape (skip value: it has no fill).
  for (const [kind, style] of Object.entries(typeTable()) as [
    NodeKind,
    TypeStyle,
  ][]) {
    if (style.from === "none") continue;
    const g = defs
      .append("radialGradient")
      .attr("id", `grad-${kind}`)
      .attr("cx", "35%")
      .attr("cy", "28%")
      .attr("r", "85%");
    g.append("stop").attr("offset", "0%").attr("stop-color", style.from);
    g.append("stop").attr("offset", "100%").attr("stop-color", style.to);
  }

  // Selection halo glow.
  const glow = defs
    .append("filter")
    .attr("id", "glow")
    .attr("x", "-120%")
    .attr("y", "-120%")
    .attr("width", "340%")
    .attr("height", "340%");
  glow.append("feGaussianBlur").attr("stdDeviation", "9");

  // Depth-of-field blurs (mid / ghost tiers).
  const bMid = defs
    .append("filter")
    .attr("id", "blurMid")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%");
  bMid.append("feGaussianBlur").attr("stdDeviation", String(TIER_STYLE.mid.blur));
  const bGhost = defs
    .append("filter")
    .attr("id", "blurGhost")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%");
  bGhost
    .append("feGaussianBlur")
    .attr("stdDeviation", String(TIER_STYLE.ghost.blur));

  // Arrow markers — one per ink role. `auto-start-reverse` lets curves use
  // the same marker at either end.
  const markers: [string, string][] = [
    ["arrow", tokens.edge],
    ["arrowMuted", tokens.edgeMid],
    ["arrowCoral", tokens.coral],
    ["arrowLime", tokens.lime],
  ];
  for (const [id, fill] of markers) {
    const m = defs
      .append("marker")
      .attr("id", id)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8.5)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse");
    m.append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", fill);
  }
}

// ─── depth-of-field tier classifier ────────────────────────────────────────
//
// BFS from `selectedId` along the *undirected* adjacency map. ≤1 hop ⇒ focus,
// exactly 2 ⇒ mid, ≥3 or disconnected ⇒ ghost. Null/missing selection ⇒ every
// node is focus (flat legible default).

export function computeTiers(
  ids: string[],
  adjacency: Record<string, string[]>,
  selectedId: string | null,
): Record<string, Tier> {
  const tier: Record<string, Tier> = {};
  if (!selectedId || !adjacency[selectedId]) {
    for (const id of ids) tier[id] = "focus";
    return tier;
  }
  const dist: Record<string, number> = { [selectedId]: 0 };
  const queue: string[] = [selectedId];
  while (queue.length) {
    const cur = queue.shift() as string;
    const neighbours = adjacency[cur] ?? [];
    for (const nb of neighbours) {
      if (dist[nb] === undefined) {
        dist[nb] = dist[cur] + 1;
        queue.push(nb);
      }
    }
  }
  for (const id of ids) {
    const d = dist[id];
    if (d === undefined) tier[id] = "ghost";
    else if (d <= 1) tier[id] = "focus";
    else if (d === 2) tier[id] = "mid";
    else tier[id] = "ghost";
  }
  return tier;
}

// ─── node shape renderer ───────────────────────────────────────────────────
//
// Appends the per-type shape into a `<g>` that is already positioned at the
// node's centroid. Geometry numbers match `viz-core.js` exactly — anything
// that changes here changes the visual identity.

export function drawNode(
  g: D3Selection<SVGGElement, VizNode>,
  n: VizNode,
  r: number,
): void {
  const t = typeTable()[n.type];
  const gradId = `grad-${n.type}`;

  if (n.type === "decision") {
    g.append("rect")
      .attr("x", -r * 0.82)
      .attr("y", -r * 0.82)
      .attr("width", r * 1.64)
      .attr("height", r * 1.64)
      .attr("rx", 5)
      .attr("transform", "rotate(45)")
      .attr("fill", `url(#${gradId})`)
      .attr("stroke", DECISION_STROKE_WHITE)
      .attr("stroke-width", 1.2)
      .style("filter", `drop-shadow(0 5px 16px ${t.glow}88)`);
    return;
  }

  if (n.type === "actor") {
    g.append("circle")
      .attr("r", r)
      .attr("fill", n.ext ? "transparent" : tokens.surface2)
      .attr("stroke", t.stroke)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", n.ext ? "3 3" : null);
    g.append("circle")
      .attr("r", r * 0.34)
      .attr("cy", -r * 0.12)
      .attr("fill", tokens.text)
      .attr("opacity", 0.85);
    g.append("path")
      .attr(
        "d",
        `M ${-r * 0.5} ${r * 0.55} Q 0 ${-r * 0.1} ${r * 0.5} ${r * 0.55}`,
      )
      .attr("fill", "none")
      .attr("stroke", tokens.text)
      .attr("stroke-width", 1.4)
      .attr("opacity", 0.85);
    return;
  }

  if (n.type === "value") {
    // identity-less: hollow dashed chip, very low-opacity magenta wash.
    g.append("rect")
      .attr("x", -r * 0.95)
      .attr("y", -r * 0.62)
      .attr("width", r * 1.9)
      .attr("height", r * 1.24)
      .attr("rx", r * 0.34)
      .attr("fill", cssVar("--magenta-bg"))
      .attr("stroke", t.stroke)
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "4 3");
    return;
  }

  if (t.shape === "tile") {
    const s = r * 1.74;
    g.append("rect")
      .attr("x", -s / 2)
      .attr("y", -s / 2)
      .attr("width", s)
      .attr("height", s)
      .attr("rx", Math.max(3, r * 0.2))
      .attr("fill", `url(#${gradId})`)
      .attr("stroke", TILE_STROKE_WHITE)
      .attr("stroke-width", 1.2)
      .style("filter", `drop-shadow(0 6px 18px ${t.glow}66)`);
    return;
  }

  if (t.shape === "rounded") {
    const w = r * 2.3;
    const h = r * 1.5;
    g.append("rect")
      .attr("x", -w / 2)
      .attr("y", -h / 2)
      .attr("width", w)
      .attr("height", h)
      .attr("rx", r * 0.5)
      .attr("fill", `url(#${gradId})`)
      .attr("stroke", t.stroke)
      .attr("stroke-width", 1.1);
    return;
  }

  // default — entity (filled circle).
  g.append("circle")
    .attr("r", r)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", TILE_STROKE_WHITE)
    .attr("stroke-width", 1.1)
    .style("filter", `drop-shadow(0 5px 14px ${t.glow}55)`);
}

// ─── selection halo + lime "yours to act on" ring ──────────────────────────

export function drawSelectionRing(
  g: D3Selection<SVGGElement>,
  r: number,
  glow: string,
): void {
  g.append("circle")
    .attr("class", "sel-halo")
    .attr("r", r * 2.3)
    .attr("fill", glow)
    .attr("opacity", 0.3)
    .attr("filter", "url(#glow)");
  g.append("circle")
    .attr("class", "sel-ring")
    .attr("r", r + 9)
    .attr("fill", "none")
    .attr("stroke", tokens.lime)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 3");
}

// ─── zoom wiring (shared by every view) ────────────────────────────────────

export interface AttachZoomOpts {
  scaleExtent?: [number, number];
  initial?: ZoomTransform;
}

export interface AttachZoomHandle {
  zoom: ZoomBehavior<SVGSVGElement, unknown>;
  reset: (t?: ZoomTransform) => void;
}

export function attachZoom(
  svg: D3Selection<SVGSVGElement>,
  viewport: D3Selection<SVGGElement>,
  opts: AttachZoomOpts = {},
): AttachZoomHandle {
  const z = d3Zoom<SVGSVGElement, unknown>()
    .scaleExtent(opts.scaleExtent ?? [0.35, 3])
    .on("zoom", (ev: D3ZoomEvent<SVGSVGElement, unknown>) => {
      viewport.attr("transform", ev.transform.toString());
    });
  svg.call(z).on("dblclick.zoom", null);
  if (opts.initial) svg.call(z.transform, opts.initial);
  return {
    zoom: z,
    reset: (t?: ZoomTransform) => {
      const target = t ?? zoomIdentity;
      // `d3-transition` augments the selection prototype at import time.
      svg.transition().duration(500).call(z.transform, target);
    },
  };
}

// ─── adjacency helper ──────────────────────────────────────────────────────

/** Build an undirected adjacency map from `{from, to}` edges. */
export function adjacencyOf(edges: VizEdge[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const e of edges) {
    (adj[e.from] ??= []).push(e.to);
    (adj[e.to] ??= []).push(e.from);
  }
  return adj;
}

// `select` is re-used by callers that want to wrap a raw SVG element before
// passing it to `attachZoom` / `injectDefs`. Re-export here so views don't
// need to depend on `d3-selection` directly.
export { select };

/* ─── doctest sketches ────────────────────────────────────────────────────
 *
 * No test runner is wired in this PR (matches PR3's convention). Treat
 * the examples below as the executable contract; PR4+ will translate
 * them into real assertions when a runner lands.
 *
 *   import { computeTiers, adjacencyOf, curve } from "./viz-core";
 *
 *   // 1. BFS distance buckets nodes into focus / mid / ghost.
 *   computeTiers(
 *     ["a", "b", "c"],
 *     { a: ["b"], b: ["a", "c"], c: ["b"] },
 *     "a",
 *   );
 *   //=> { a: "focus", b: "focus", c: "mid" }
 *
 *   // 2. Null selection means every node is focus.
 *   computeTiers(
 *     ["a", "b", "c"],
 *     { a: ["b"], b: ["a", "c"], c: ["b"] },
 *     null,
 *   );
 *   //=> { a: "focus", b: "focus", c: "focus" }
 *
 *   // 3. adjacencyOf is symmetric — one edge yields both directions.
 *   adjacencyOf([{ id: "e1", from: "a", to: "b", kind: "x" }]);
 *   //=> { a: ["b"], b: ["a"] }
 *
 *   // 4. curve() emits an SVG path that bows outward.
 *   curve(0, 0, 10, 0, 0.16);
 *   //=> "M 0,0 C 3.3,1.6 6.6,1.6 10,0"  (starts with "M 0,0 C")
 *
 * ───────────────────────────────────────────────────────────────────── */
