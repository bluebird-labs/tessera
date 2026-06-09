import type { DiagramTheme, NodeType, Tier, TierParams, TypeStyle } from "./diagram-types";
import { tokens } from "./tokens";

const NODE_STROKE = "rgba(255,255,255,0.42)";

function buildTypeStyles(): Record<NodeType, TypeStyle> {
  return {
    contract:  { from: tokens.indigo,    to: tokens.violet,   glow: tokens.indigo,  shape: "tile" },
    useCase:   { from: tokens.cyan,      to: tokens.indigo,   glow: tokens.cyan,    shape: "tile" },
    aggregate: { from: tokens.magenta,   to: tokens.coral,    glow: tokens.magenta, shape: "tile" },
    module:    { from: tokens.surface3,  to: tokens.surface2, glow: tokens.lineHi,  shape: "rounded" },
    decision:  { from: tokens.violet,    to: tokens.magenta,  glow: tokens.violet,  shape: "marker" },
    actor:     { from: tokens.surface3,  to: tokens.surface3, glow: tokens.lineHi,  shape: "circle" },
  };
}

function buildTierParams(): Record<Tier, TierParams> {
  return {
    focus: {
      opacity: 1.0,
      blur: 0,
      edgeStroke: tokens.edge,
      edgeWidth: 1.8,
      labelVisible: true,
    },
    mid: {
      opacity: 0.78,
      blur: 0.4,
      edgeStroke: tokens.edgeMid,
      edgeWidth: 1.1,
      labelVisible: true,
    },
    ghost: {
      opacity: 0.25,
      blur: 1.4,
      edgeStroke: tokens.edgeGhost,
      edgeWidth: 0.6,
      labelVisible: false,
    },
  };
}

let typeStylesMemo: Record<NodeType, TypeStyle> | null = null;
let tierParamsMemo: Record<Tier, TierParams> | null = null;

function typeStyles(): Record<NodeType, TypeStyle> {
  if (!typeStylesMemo) typeStylesMemo = buildTypeStyles();
  return typeStylesMemo;
}

function tierParams(): Record<Tier, TierParams> {
  if (!tierParamsMemo) tierParamsMemo = buildTierParams();
  return tierParamsMemo;
}

/** Drop memoised values so the next read pulls fresh tokens. Pair with
 *  `invalidateTokens()` after a theme toggle. */
export function invalidateTheme(): void {
  typeStylesMemo = null;
  tierParamsMemo = null;
}

/** Lazy accessor for the per-type render style. Same identity across reads
 *  until `invalidateTheme()` is called. */
export function getTypeStyles(): Record<NodeType, TypeStyle> {
  return typeStyles();
}

/** Backwards-compatible alias for callers that imported the eager record. */
export const TYPE_STYLES = new Proxy({} as Record<NodeType, TypeStyle>, {
  get(_t, key: string) {
    return typeStyles()[key as NodeType];
  },
  ownKeys() {
    return Reflect.ownKeys(typeStyles());
  },
  getOwnPropertyDescriptor(_t, key) {
    return Reflect.getOwnPropertyDescriptor(typeStyles(), key);
  },
  has(_t, key) {
    return key in typeStyles();
  },
});

export const TIER_PARAMS = new Proxy({} as Record<Tier, TierParams>, {
  get(_t, key: string) {
    return tierParams()[key as Tier];
  },
  ownKeys() {
    return Reflect.ownKeys(tierParams());
  },
  getOwnPropertyDescriptor(_t, key) {
    return Reflect.getOwnPropertyDescriptor(tierParams(), key);
  },
  has(_t, key) {
    return key in tierParams();
  },
});

export const PRISM_THEME: DiagramTheme = Object.freeze({
  get typeStyles() { return typeStyles(); },
  get tiers() { return tierParams(); },
  get canvas()   { return tokens.canvas; },
  get text()     { return tokens.text; },
  get textDim()  { return tokens.textDim; },
  get textMute() { return tokens.textMute; },
  get lime()     { return tokens.lime; },
  get coral()    { return tokens.coral; },
  get indigo()   { return tokens.indigo; },
  get surface2() { return tokens.surface2; },
  get surface3() { return tokens.surface3; },
  get line()     { return tokens.line; },
  get lineHi()   { return tokens.lineHi; },
  get nodeStroke() { return NODE_STROKE; },
  get fontSans() { return tokens.fontSans || '"Inter Tight", "Geist", system-ui, sans-serif'; },
  get fontMono() { return tokens.fontMono || '"JetBrains Mono", "Geist Mono", "SF Mono", Menlo, monospace'; },
}) as DiagramTheme;
