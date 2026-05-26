import type { DiagramEdge, DiagramNode, Tier } from "./diagram-types";

export function computeTiers(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  selectedIds: ReadonlySet<string>,
  pinnedIds: ReadonlySet<string>,
): Map<string, Tier> {
  const result = new Map<string, Tier>();

  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of edges) {
    const srcId = typeof edge.source === "string" ? edge.source : edge.source.id;
    const tgtId = typeof edge.target === "string" ? edge.target : edge.target.id;
    adjacency.get(srcId)?.add(tgtId);
    adjacency.get(tgtId)?.add(srcId);
  }

  const focusIds = new Set<string>();

  for (const id of selectedIds) {
    focusIds.add(id);
    const neighbors = adjacency.get(id);
    if (neighbors) {
      for (const n of neighbors) focusIds.add(n);
    }
  }
  for (const id of pinnedIds) {
    focusIds.add(id);
    const neighbors = adjacency.get(id);
    if (neighbors) {
      for (const n of neighbors) focusIds.add(n);
    }
  }

  const midIds = new Set<string>();
  for (const id of focusIds) {
    const neighbors = adjacency.get(id);
    if (neighbors) {
      for (const n of neighbors) {
        if (!focusIds.has(n)) midIds.add(n);
      }
    }
  }

  for (const node of nodes) {
    if (focusIds.has(node.id)) {
      result.set(node.id, "focus");
    } else if (midIds.has(node.id)) {
      result.set(node.id, "mid");
    } else {
      result.set(node.id, "ghost");
    }
  }

  return result;
}
