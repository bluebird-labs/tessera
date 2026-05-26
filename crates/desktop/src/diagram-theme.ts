import type { DiagramTheme, NodeType, Tier, TierParams, TypeStyle } from "./diagram-types";

export const TYPE_STYLES: Record<NodeType, TypeStyle> = {
  contract:  { from: "#5b6bff", to: "#a855f7", glow: "#5b6bff", shape: "tile" },
  useCase:   { from: "#22d3ee", to: "#5b6bff", glow: "#22d3ee", shape: "tile" },
  aggregate: { from: "#ff4d8c", to: "#fb7185", glow: "#ff4d8c", shape: "tile" },
  module:    { from: "#222640", to: "#1a1d2e", glow: "rgba(255,255,255,0.12)", shape: "rounded" },
  decision:  { from: "#a855f7", to: "#ff4d8c", glow: "#a855f7", shape: "marker" },
  actor:     { from: "#222640", to: "#222640", glow: "rgba(255,255,255,0.12)", shape: "circle" },
};

export const TIER_PARAMS: Record<Tier, TierParams> = {
  focus: {
    opacity: 1.0,
    blur: 0,
    edgeStroke: "rgba(255,255,255,0.55)",
    edgeWidth: 1.8,
    labelVisible: true,
  },
  mid: {
    opacity: 0.78,
    blur: 0.4,
    edgeStroke: "rgba(255,255,255,0.16)",
    edgeWidth: 1.1,
    labelVisible: true,
  },
  ghost: {
    opacity: 0.25,
    blur: 1.4,
    edgeStroke: "rgba(255,255,255,0.05)",
    edgeWidth: 0.6,
    labelVisible: false,
  },
};

export const PRISM_THEME: DiagramTheme = {
  typeStyles: TYPE_STYLES,
  tiers: TIER_PARAMS,
  canvas: "#07080f",
  text: "#f5f6fb",
  textDim: "rgba(245,246,251,0.66)",
  textMute: "rgba(245,246,251,0.38)",
  lime: "#a3e635",
  coral: "#fb7185",
  indigo: "#5b6bff",
  surface2: "#1a1d2e",
  line: "rgba(255,255,255,0.06)",
  fontSans: '"Inter Tight", "Geist", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", "Geist Mono", "SF Mono", Menlo, monospace',
};
