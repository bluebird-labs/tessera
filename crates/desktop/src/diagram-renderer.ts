import { select } from "d3-selection";
import type { Selection } from "d3-selection";
import { curvePath } from "./diagram-edges";
import type {
  DiagramEdge,
  DiagramNode,
  DiagramRenderer,
  DiagramTheme,
  Tier,
} from "./diagram-types";

function renderNodeShape(
  g: Selection<SVGGElement, DiagramNode, SVGGElement, unknown>,
  theme: DiagramTheme,
  tierMap: Map<string, Tier>,
): void {
  g.each(function (d) {
    const sel = select(this as SVGGElement);
    const style = theme.typeStyles[d.type];
    const tier = tierMap.get(d.id) ?? "ghost";
    const tierP = theme.tiers[tier];

    sel.selectAll("*").remove();

    if (d.selected && tier === "focus") {
      sel.append("circle")
        .attr("r", d.r * 2.4)
        .attr("fill", style.glow)
        .attr("opacity", 0.32)
        .attr("filter", "url(#glow-halo)");

      sel.append("circle")
        .attr("r", d.r + 9)
        .attr("fill", "none")
        .attr("stroke", theme.lime)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4 3");
    }

    if (d.frozen && tier === "focus") {
      sel.append("circle")
        .attr("r", d.r + 4)
        .attr("fill", "none")
        .attr("stroke", theme.lime)
        .attr("stroke-width", 1)
        .attr("opacity", 0.85);
    }

    switch (style.shape) {
      case "tile": {
        const s = d.r * 1.7;
        sel.append("rect")
          .attr("x", -s / 2)
          .attr("y", -s / 2)
          .attr("width", s)
          .attr("height", s)
          .attr("rx", Math.max(2, d.r * 0.16))
          .attr("fill", `url(#node-grad-${d.type})`)
          .attr("stroke", theme.nodeStroke)
          .attr("stroke-width", 1.2)
        if (tier === "focus") {
          sel.select("rect").style("filter", `drop-shadow(0 6px 20px ${style.glow}b3)`);
        }
        break;
      }
      case "rounded": {
        const w = d.r * 2.4;
        const h = d.r * 1.6;
        sel.append("rect")
          .attr("x", -w / 2)
          .attr("y", -h / 2)
          .attr("width", w)
          .attr("height", h)
          .attr("rx", d.r * 0.7)
          .attr("fill", `url(#node-grad-${d.type})`)
          .attr("stroke", theme.lineHi)
          .attr("stroke-width", 1.2);
        break;
      }
      case "marker": {
        const ms = d.r * 1.5;
        const markerG = sel.append("g")
          .attr("transform", "rotate(45)");
        if (tier === "focus") {
          markerG.style("filter", `drop-shadow(0 6px 20px ${style.glow}b3)`);
        }
        markerG.append("rect")
          .attr("x", -ms / 2)
          .attr("y", -ms / 2)
          .attr("width", ms)
          .attr("height", ms)
          .attr("rx", 3)
          .attr("fill", `url(#node-grad-${d.type})`)
          .attr("stroke", theme.nodeStroke)
          .attr("stroke-width", 1.2);
        sel.append("circle")
          .attr("r", d.r * 0.32)
          .attr("fill", style.from);
        break;
      }
      case "circle":
      default: {
        sel.append("circle")
          .attr("r", d.r)
          .attr("fill", theme.surface3)
          .attr("stroke", theme.lineHi)
          .attr("stroke-width", 1.5);
        break;
      }
    }

    if (d.drift && (tier === "focus" || tier === "mid")) {
      sel.append("circle")
        .attr("cx", d.r * 0.72)
        .attr("cy", -d.r * 0.72)
        .attr("r", 5)
        .attr("fill", theme.coral)
        .style("filter", `drop-shadow(0 0 8px ${theme.coral})`);
    }

    if (tierP.labelVisible) {
      const fontWeight = d.selected ? "700" : tier === "focus" ? "600" : "500";
      const fontSize = d.selected ? 13 : tier === "focus" ? 12 : 10.5;

      sel.append("text")
        .attr("y", d.r + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", fontSize)
        .attr("font-family", theme.fontSans)
        .attr("font-weight", fontWeight)
        .attr("fill", tier === "focus" ? theme.text : theme.textDim)
        .attr("pointer-events", "none")
        .text(d.label);

      if (tier === "focus") {
        sel.append("text")
          .attr("y", d.r + 35)
          .attr("text-anchor", "middle")
          .attr("font-size", 9.5)
          .attr("font-family", theme.fontMono)
          .attr("fill", theme.textMute)
          .attr("pointer-events", "none")
          .attr("letter-spacing", "0.08em")
          .text(`:${d.type}`);
      }
    }
  });
}

export const prismRenderer: DiagramRenderer = {
  defaultLayout: {
    algorithm: "force",
    chargeStrength: -400,
    linkDistance: 120,
    centerStrength: 0.05,
  },

  renderNodes(selection, theme, tierMap) {
    renderNodeShape(selection, theme, tierMap);
  },

  renderEdges(selection, theme, tierMap) {
    selection.each(function (d) {
      const sel = select(this as SVGGElement);
      sel.selectAll("*").remove();

      const src = d.source as DiagramNode;
      const tgt = d.target as DiagramNode;
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) return;

      const srcTier = tierMap.get(src.id) ?? "ghost";
      const tgtTier = tierMap.get(tgt.id) ?? "ghost";
      const edgeTier: Tier = srcTier === "focus" && tgtTier === "focus" ? "focus"
        : srcTier === "ghost" || tgtTier === "ghost" ? "ghost" : "mid";
      const tierP = theme.tiers[edgeTier];

      const lift = edgeTier === "focus" ? 0.16 : 0.18;
      const path = curvePath(src.x, src.y, tgt.x, tgt.y, lift);

      const stroke = d.drift ? theme.coral : tierP.edgeStroke;
      const sw = d.label ? tierP.edgeWidth : tierP.edgeWidth * 0.8;

      sel.append("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-width", sw)
        .attr("stroke-dasharray", d.dashed || d.drift ? "5 5" : null)
        .attr("opacity", d.drift ? 0.7 : 0.9)
        .attr("marker-end", edgeTier === "focus" ? "url(#edge-arrow)" : "url(#edge-arrow-muted)");

      if (d.label && edgeTier === "focus") {
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2 - 8;

        sel.append("rect")
          .attr("x", mx - 30)
          .attr("y", my - 9)
          .attr("width", 60)
          .attr("height", 18)
          .attr("rx", 9)
          .attr("fill", theme.surface2)
          .attr("stroke", theme.line)
          .attr("stroke-width", 0.5);

        sel.append("text")
          .attr("x", mx)
          .attr("y", my + 3)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("font-family", theme.fontMono)
          .attr("fill", theme.textDim)
          .attr("letter-spacing", "0.04em")
          .text(d.label);
      }
    });
  },

  onTick(nodeSelection, edgeSelection) {
    nodeSelection.attr("transform", (d) =>
      d.x != null && d.y != null ? `translate(${d.x},${d.y})` : null,
    );

    edgeSelection.each(function (d) {
      const src = d.source as DiagramNode;
      const tgt = d.target as DiagramNode;
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) return;

      const el = this as SVGGElement;
      const path = el.querySelector("path");
      if (path) {
        path.setAttribute("d", curvePath(src.x, src.y, tgt.x, tgt.y, 0.16));
      }

      const rect = el.querySelector("rect");
      const text = el.querySelectorAll("text")[0];
      if (rect && text) {
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2 - 8;
        rect.setAttribute("x", String(mx - 30));
        rect.setAttribute("y", String(my - 9));
        text.setAttribute("x", String(mx));
        text.setAttribute("y", String(my + 3));
      }
    });
  },
};
