import { drag } from "d3-drag";
import { select } from "d3-selection";
import { zoom, type ZoomBehavior } from "d3-zoom";
import type { D3Simulation, DiagramNode } from "./diagram-types";

export function createNodeDrag(simulation: D3Simulation) {
  return drag<SVGGElement, DiagramNode>()
    .clickDistance(4)
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

export function createZoom(
  svg: SVGSVGElement,
  zoomLayer: SVGGElement,
): ZoomBehavior<SVGSVGElement, unknown> {
  const z = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      select(zoomLayer).attr("transform", event.transform);
    });

  select(svg).call(z);
  return z;
}
