import { select } from "d3-selection";
import type { DiagramTheme, NodeType } from "./diagram-types";

export function appendDefs(svg: SVGSVGElement, theme: DiagramTheme): void {
  const sel = select(svg);
  sel.select("defs").remove();
  const defs = sel.append("defs");

  for (const [type, style] of Object.entries(theme.typeStyles)) {
    const grad = defs.append("radialGradient")
      .attr("id", `node-grad-${type}`)
      .attr("cx", "35%")
      .attr("cy", "30%")
      .attr("r", "80%");
    grad.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", style.from);
    grad.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", style.to);
  }

  const blurGhost = defs.append("filter")
    .attr("id", "blur-ghost")
    .attr("x", "-20%").attr("y", "-20%")
    .attr("width", "140%").attr("height", "140%");
  blurGhost.append("feGaussianBlur").attr("stdDeviation", "1.4");

  const blurMid = defs.append("filter")
    .attr("id", "blur-mid")
    .attr("x", "-20%").attr("y", "-20%")
    .attr("width", "140%").attr("height", "140%");
  blurMid.append("feGaussianBlur").attr("stdDeviation", "0.4");

  const glow = defs.append("filter")
    .attr("id", "glow-halo")
    .attr("x", "-100%").attr("y", "-100%")
    .attr("width", "300%").attr("height", "300%");
  glow.append("feGaussianBlur").attr("stdDeviation", "14");

  const spotlight = defs.append("radialGradient")
    .attr("id", "spotlight")
    .attr("cx", "50%").attr("cy", "50%").attr("r", "42%");
  spotlight.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", theme.indigo)
    .attr("stop-opacity", "0.12");
  spotlight.append("stop")
    .attr("offset", "60%")
    .attr("stop-color", theme.indigo)
    .attr("stop-opacity", "0");

  const vignette = defs.append("radialGradient")
    .attr("id", "vignette")
    .attr("cx", "50%").attr("cy", "50%").attr("r", "62%");
  vignette.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", theme.canvas)
    .attr("stop-opacity", "0");
  vignette.append("stop")
    .attr("offset", "55%")
    .attr("stop-color", theme.canvas)
    .attr("stop-opacity", "0");
  vignette.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", theme.canvas)
    .attr("stop-opacity", "0.85");

  const arrow = defs.append("marker")
    .attr("id", "edge-arrow")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", "9").attr("refY", "5")
    .attr("markerWidth", "6").attr("markerHeight", "6")
    .attr("orient", "auto-start-reverse");
  arrow.append("path")
    .attr("d", "M 0,0 L 10,5 L 0,10 z")
    .attr("fill", "rgba(255,255,255,0.55)");

  const arrowMuted = defs.append("marker")
    .attr("id", "edge-arrow-muted")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", "9").attr("refY", "5")
    .attr("markerWidth", "5").attr("markerHeight", "5")
    .attr("orient", "auto-start-reverse");
  arrowMuted.append("path")
    .attr("d", "M 0,0 L 10,5 L 0,10 z")
    .attr("fill", "rgba(255,255,255,0.16)");
}
