import { useCallback, useEffect, useRef, useState } from "react";
import { forceCenter, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { select } from "d3-selection";
import type { Selection } from "d3-selection";
import { appendDefs } from "./diagram-defs";
import { PRISM_THEME } from "./diagram-theme";
import { computeTiers } from "./diagram-tiers";
import { createNodeDrag, createZoom } from "./diagram-interactions";
import { prismRenderer } from "./diagram-renderer";
import { makeGhostField } from "./diagram-ghost";
import type {
  D3Simulation,
  DiagramCanvasProps,
  DiagramEdge,
  DiagramNode,
  DiagramSelection,
} from "./diagram-types";

interface SvgRefs {
  zoomLayer: SVGGElement;
  midEdgeLayer: SVGGElement;
  midNodeLayer: SVGGElement;
  focusEdgeLayer: SVGGElement;
  focusNodeLayer: SVGGElement;
}

export function DiagramCanvas({
  data,
  renderer = prismRenderer,
  selection: externalSelection,
  onSelectionChange,
  className,
}: DiagramCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<D3Simulation | null>(null);
  const layersRef = useRef<SvgRefs | null>(null);
  const selRef = useRef<DiagramSelection>({
    selectedIds: new Set(data.nodes.filter((n) => n.selected).map((n) => n.id)),
    pinnedIds: new Set(),
  });
  const [internalSelection, setInternalSelection] = useState<DiagramSelection>(selRef.current);

  const sel = externalSelection ?? internalSelection;
  selRef.current = sel;

  const updateVisuals = useCallback(() => {
    const layers = layersRef.current;
    const simulation = simulationRef.current;
    if (!layers || !simulation) return;

    const tierMap = computeTiers(data.nodes, data.edges, selRef.current.selectedIds, selRef.current.pinnedIds);

    const focusNodes = data.nodes.filter((n) => tierMap.get(n.id) === "focus");
    const midNodes = data.nodes.filter((n) => tierMap.get(n.id) === "mid");

    const focusEdges = data.edges.filter((e) => {
      const srcId = typeof e.source === "string" ? e.source : e.source.id;
      const tgtId = typeof e.target === "string" ? e.target : e.target.id;
      return tierMap.get(srcId) === "focus" && tierMap.get(tgtId) === "focus";
    });
    const midEdges = data.edges.filter((e) => {
      const srcId = typeof e.source === "string" ? e.source : e.source.id;
      const tgtId = typeof e.target === "string" ? e.target : e.target.id;
      const src = tierMap.get(srcId) ?? "ghost";
      const tgt = tierMap.get(tgtId) ?? "ghost";
      return (src === "mid" || tgt === "mid") && src !== "ghost" && tgt !== "ghost";
    });

    const midEdgeLayer = select(layers.midEdgeLayer);
    const midNodeLayer = select(layers.midNodeLayer);
    const focusEdgeLayer = select(layers.focusEdgeLayer);
    const focusNodeLayer = select(layers.focusNodeLayer);

    const midEdgeSel = midEdgeLayer.selectAll<SVGGElement, DiagramEdge>("g")
      .data(midEdges, (d) => d.id)
      .join("g")
      .attr("opacity", PRISM_THEME.tiers.mid.opacity);

    const midNodeSel = midNodeLayer.selectAll<SVGGElement, DiagramNode>("g")
      .data(midNodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    const focusEdgeSel = focusEdgeLayer.selectAll<SVGGElement, DiagramEdge>("g")
      .data(focusEdges, (d) => d.id)
      .join("g");

    const focusNodeSel = focusNodeLayer.selectAll<SVGGElement, DiagramNode>("g")
      .data(focusNodes, (d) => d.id)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    renderer.renderNodes(focusNodeSel, PRISM_THEME, tierMap);
    renderer.renderNodes(midNodeSel, PRISM_THEME, tierMap);
    renderer.renderEdges(focusEdgeSel, PRISM_THEME, tierMap);
    renderer.renderEdges(midEdgeSel, PRISM_THEME, tierMap);

    const dragBehavior = createNodeDrag(simulation);
    focusNodeSel.call(dragBehavior);
    midNodeSel.call(dragBehavior);

    simulation.on("tick", () => {
      renderer.onTick(focusNodeSel, focusEdgeSel);
      renderer.onTick(midNodeSel, midEdgeSel);
    });

    simulation.alpha(0.3).restart();

    const handleNodeClick = (event: MouseEvent, d: DiagramNode) => {
      event.stopPropagation();
      const current = selRef.current;
      const newSelected = new Set<string>();

      if (event.metaKey || event.ctrlKey) {
        const newPinned = new Set(current.pinnedIds);
        if (newPinned.has(d.id)) newPinned.delete(d.id);
        else newPinned.add(d.id);
        const newSel = { selectedIds: current.selectedIds, pinnedIds: newPinned };
        for (const node of data.nodes) node.selected = newSel.selectedIds.has(node.id);
        setInternalSelection(newSel);
        onSelectionChange?.(newSel);
        return;
      }

      if (event.shiftKey) {
        for (const id of current.selectedIds) newSelected.add(id);
        if (newSelected.has(d.id)) newSelected.delete(d.id);
        else newSelected.add(d.id);
      } else {
        newSelected.add(d.id);
      }

      for (const node of data.nodes) node.selected = newSelected.has(node.id);
      const newSel = { selectedIds: newSelected, pinnedIds: current.pinnedIds };
      setInternalSelection(newSel);
      onSelectionChange?.(newSel);
    };

    focusNodeSel.on("click", handleNodeClick as any);
    midNodeSel.on("click", handleNodeClick as any);
  }, [data, renderer, onSelectionChange]);

  // Initialization: set up SVG structure, simulation, zoom — runs once per data change
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = svg.clientWidth || 1100;
    const height = svg.clientHeight || 680;
    const svgSel = select(svg);

    svgSel.selectAll("*").remove();
    appendDefs(svg, PRISM_THEME);

    svgSel.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#spotlight)");

    const ghostLayer = svgSel.append("g").attr("class", "ghost-layer");
    renderGhostField(ghostLayer, width, height);

    const zoomLayer = svgSel.append("g").attr("class", "zoom-layer");
    const midEdgeLayer = zoomLayer.append("g").attr("class", "mid-edge-layer");
    const midNodeLayer = zoomLayer.append("g").attr("class", "mid-node-layer")
      .attr("filter", "url(#blur-mid)")
      .attr("opacity", PRISM_THEME.tiers.mid.opacity);
    const focusEdgeLayer = zoomLayer.append("g").attr("class", "focus-edge-layer");
    const focusNodeLayer = zoomLayer.append("g").attr("class", "focus-node-layer");

    svgSel.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#vignette)")
      .attr("pointer-events", "none");

    layersRef.current = {
      zoomLayer: zoomLayer.node()!,
      midEdgeLayer: midEdgeLayer.node()!,
      midNodeLayer: midNodeLayer.node()!,
      focusEdgeLayer: focusEdgeLayer.node()!,
      focusNodeLayer: focusNodeLayer.node()!,
    };

    const simulation = forceSimulation<DiagramNode>(data.nodes)
      .force("link", forceLink<DiagramNode, DiagramEdge>(data.edges)
        .id((d) => d.id)
        .distance(renderer.defaultLayout.linkDistance ?? 120))
      .force("charge", forceManyBody().strength(renderer.defaultLayout.chargeStrength ?? -400))
      .force("center", forceCenter(width / 2, height / 2).strength(renderer.defaultLayout.centerStrength ?? 0.05));

    simulationRef.current = simulation;

    createZoom(svg, zoomLayer.node()!);

    svgSel.on("click", (event: MouseEvent) => {
      if (event.target === svg || (event.target as Element)?.closest?.(".ghost-layer")) {
        for (const node of data.nodes) node.selected = false;
        const newSel: DiagramSelection = { selectedIds: new Set(), pinnedIds: selRef.current.pinnedIds };
        setInternalSelection(newSel);
        onSelectionChange?.(newSel);
      }
    });

    updateVisuals();

    return () => {
      simulation.stop();
      simulationRef.current = null;
      layersRef.current = null;
    };
  }, [data, renderer]);

  // Selection change: update visuals without rebuilding the simulation
  useEffect(() => {
    if (!layersRef.current || !simulationRef.current) return;
    updateVisuals();
  }, [sel.selectedIds, sel.pinnedIds, updateVisuals]);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: PRISM_THEME.canvas,
      }}
    />
  );
}

function renderGhostField(
  layer: Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
): void {
  const ghosts = makeGhostField(width, height);

  layer.attr("filter", "url(#blur-ghost)");

  layer.selectAll("circle")
    .data(ghosts)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r)
    .attr("fill", (d) => d.color)
    .attr("opacity", (d) => d.opacity);
}
