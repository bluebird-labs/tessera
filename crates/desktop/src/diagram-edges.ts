export function curvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lift = 0.18,
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
