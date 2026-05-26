import { TYPE_STYLES } from "./diagram-theme";
import type { NodeType } from "./diagram-types";

interface GhostNode {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
}

export function makeGhostField(width: number, height: number): GhostNode[] {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const phi = (Math.PI * 2) / 1.618;
  const items: GhostNode[] = [];
  const types: NodeType[] = ["contract", "useCase", "aggregate", "module", "module", "aggregate"];

  for (let i = 0; i < 80; i++) {
    const t = i + 6;
    const angle = i * phi + i * 0.013;
    const radius = 200 + t * 7;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * 0.68;
    if (x < 30 || x > width - 30 || y < 30 || y > height - 30) continue;

    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy * 1.4);
    if (d < 200) continue;

    const type = types[i % types.length];
    const depth = Math.min(1, (d - 200) / 260);
    const r = 4.5 - depth * 2.2;
    const color = TYPE_STYLES[type].from;
    const opacity = 0.16 + (1 - depth) * 0.18;

    items.push({ x, y, r, color, opacity });
  }

  return items;
}
