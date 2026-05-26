import type { Simulation } from "d3-force";
import type { Selection } from "d3-selection";

export type NodeType =
  | "contract"
  | "useCase"
  | "aggregate"
  | "module"
  | "decision"
  | "actor";

export type NodeShape = "tile" | "rounded" | "marker" | "circle";

export type Tier = "focus" | "mid" | "ghost";

export interface DiagramNode {
  readonly id: string;
  readonly type: NodeType;
  readonly label: string;
  readonly r: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  selected?: boolean;
  readonly frozen?: boolean;
  readonly drift?: boolean;
}

export interface DiagramEdge {
  readonly id: string;
  source: string | DiagramNode;
  target: string | DiagramNode;
  readonly kind: string;
  readonly label?: string;
  readonly dashed?: boolean;
  readonly drift?: boolean;
}

export interface DiagramData {
  readonly nodes: DiagramNode[];
  readonly edges: DiagramEdge[];
}

export interface DiagramSelection {
  readonly selectedIds: ReadonlySet<string>;
  readonly pinnedIds: ReadonlySet<string>;
}

export type LayoutAlgorithm = "force" | "layered" | "radial";

export interface LayoutConfig {
  readonly algorithm: LayoutAlgorithm;
  readonly chargeStrength?: number;
  readonly linkDistance?: number;
  readonly centerStrength?: number;
}

export interface TypeStyle {
  readonly from: string;
  readonly to: string;
  readonly glow: string;
  readonly shape: NodeShape;
}

export interface TierParams {
  readonly opacity: number;
  readonly blur: number;
  readonly edgeStroke: string;
  readonly edgeWidth: number;
  readonly labelVisible: boolean;
}

export interface DiagramTheme {
  readonly typeStyles: Record<NodeType, TypeStyle>;
  readonly tiers: Record<Tier, TierParams>;
  readonly canvas: string;
  readonly text: string;
  readonly textDim: string;
  readonly textMute: string;
  readonly lime: string;
  readonly coral: string;
  readonly indigo: string;
  readonly surface2: string;
  readonly line: string;
  readonly fontSans: string;
  readonly fontMono: string;
}

export interface DiagramRenderer {
  renderNodes(
    selection: Selection<SVGGElement, DiagramNode, SVGGElement, unknown>,
    theme: DiagramTheme,
    tierMap: Map<string, Tier>,
  ): void;
  renderEdges(
    selection: Selection<SVGGElement, DiagramEdge, SVGGElement, unknown>,
    theme: DiagramTheme,
    tierMap: Map<string, Tier>,
  ): void;
  onTick(
    nodeSelection: Selection<SVGGElement, DiagramNode, SVGGElement, unknown>,
    edgeSelection: Selection<SVGGElement, DiagramEdge, SVGGElement, unknown>,
  ): void;
  readonly defaultLayout: LayoutConfig;
}

export interface DiagramCanvasProps {
  data: DiagramData;
  renderer?: DiagramRenderer;
  layout?: LayoutConfig;
  selection?: DiagramSelection;
  onSelectionChange?: (selection: DiagramSelection) => void;
  className?: string;
}

export type D3Simulation = Simulation<DiagramNode, DiagramEdge>;
