// tmosaic.tsx — the locked "proper vs ai" mosaic, as a landing component.
// A capital "T" is built bottom-up in saccadic blocks of tiles on an indigo
// field with sparse pink/green noise. variant="proper" assembles a complete T;
// variant="ai" sheds cyan tiles increasingly toward the top (erosion 0.59),
// ending on an eroded, less legible T. Builds once, when scrolled into view.
import { useRef, useEffect } from "react";
import { useInView } from "./mosaic";

/* ── palette ──────────────────────────────────────────────────────────── */
const TM_COL = {
  field: "#5b6bff", // indigo background
  fore: "#ff3d7f", // pink structure (locked)
  pink: "#ff3d7f",
  green: "#9ee641",
};

/* ── single capital T glyph (11 x 13) ─────────────────────────────────── */
const TM_GLYPH = [
  "11111111111",
  "11111111111",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
  "00001110000",
];
const TM_GW = TM_GLYPH[0].length; // 11
const TM_GH = TM_GLYPH.length; // 13

/* ── grid geometry ────────────────────────────────────────────────────── */
const TM_TILE = 8;
const TM_GAP = 2;
const TM_PITCH = TM_TILE + TM_GAP;
const TM_RADIUS = 2;
const TM_PAD = 20;
const TM_COLS = TM_GW + 8; // 19
const TM_ROWS = TM_GH + 6; // 19
const TM_SC = Math.floor((TM_COLS - TM_GW) / 2);
const TM_SR = Math.floor((TM_ROWS - TM_GH) / 2);

/* ── model: 0 field, 1 fore, 2 pink, 3 green ──────────────────────────── */
function tmBuildModel(): { m: number[][]; drop: number[][] } {
  const m = Array.from({ length: TM_ROWS }, () => new Array<number>(TM_COLS).fill(0));
  const drop = Array.from({ length: TM_ROWS }, () => new Array<number>(TM_COLS).fill(0));
  for (let r = 0; r < TM_GH; r++) {
    for (let c = 0; c < TM_GW; c++) {
      if (TM_GLYPH[r][c] === "1") m[TM_SR + r][TM_SC + c] = 1;
    }
  }
  let seed = 20260602;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let r = 0; r < TM_ROWS; r++) {
    for (let c = 0; c < TM_COLS; c++) {
      drop[r][c] = rnd();
      if (m[r][c] !== 0) continue;
      const v = rnd();
      if (v > 0.975) m[r][c] = 2; // pink
      else if (v > 0.955) m[r][c] = 3; // green
    }
  }
  return { m, drop };
}
const { m: TM_MODEL, drop: TM_DROP } = tmBuildModel();

/* ── saccadic build schedule (blocks, bottom -> top) ──────────────────── */
const tmEaseOut = (x: number) => 1 - Math.pow(1 - x, 3);
const TM_BAND = 2; // glyph rows per block
const TM_POP = 0.34; // snap-in fraction of each block's slice
let TM_MAXSTEP = 0;
const TM_STRUCT: Array<{ r: number; c: number; step: number; topness: number }> = [];
for (let r = 0; r < TM_ROWS; r++) {
  for (let c = 0; c < TM_COLS; c++) {
    if (TM_MODEL[r][c] !== 1) continue;
    const gr = r - TM_SR;
    const buildIdx = TM_GH - 1 - gr;
    const step = Math.floor(buildIdx / TM_BAND);
    const topness = gr / (TM_GH - 1);
    TM_STRUCT.push({ r, c, step, topness });
    if (step > TM_MAXSTEP) TM_MAXSTEP = step;
  }
}
const TM_NSTEPS = TM_MAXSTEP + 1;

/* ── color helpers ────────────────────────────────────────────────────── */
function tmBase(t: number) {
  if (t === 2) return "#1ed5f0"; // cyan noise (kept distinct from the pink T)
  if (t === 3) return TM_COL.green;
  return TM_COL.field; // field + structure slots sit on indigo
}
function tmRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const TM_CW = TM_COLS * TM_PITCH - TM_GAP + TM_PAD * 2;
const TM_CH = TM_ROWS * TM_PITCH - TM_GAP + TM_PAD * 2;

function tmRenderTo(
  ctx: CanvasRenderingContext2D,
  p: number,
  isRight: boolean,
  erosion: number,
) {
  ctx.clearRect(0, 0, TM_CW, TM_CH);
  for (let r = 0; r < TM_ROWS; r++) {
    for (let c = 0; c < TM_COLS; c++) {
      ctx.fillStyle = tmBase(TM_MODEL[r][c]);
      tmRound(ctx, TM_PAD + c * TM_PITCH, TM_PAD + r * TM_PITCH, TM_TILE, TM_TILE, TM_RADIUS);
      ctx.fill();
    }
  }
  for (const s of TM_STRUCT) {
    if (isRight && TM_DROP[s.r][s.c] < Math.pow(s.topness, 1.35) * erosion) continue;
    const sliceStart = s.step / TM_NSTEPS;
    const local = (p - sliceStart) * TM_NSTEPS;
    if (local <= 0) continue;
    let tp = local / TM_POP;
    if (tp > 1) tp = 1;
    const e = tmEaseOut(tp);
    const size = TM_TILE * e;
    const off = (TM_TILE - size) / 2;
    ctx.globalAlpha = e;
    ctx.fillStyle = TM_COL.fore;
    tmRound(ctx, TM_PAD + s.c * TM_PITCH + off, TM_PAD + s.r * TM_PITCH + off, size, size, TM_RADIUS * e);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ── component ────────────────────────────────────────────────────────── */
export function TMosaic({
  variant = "proper",
  erosion = 0.59,
}: {
  variant?: "proper" | "ai";
  erosion?: number;
}) {
  const isRight = variant === "ai";
  const [wrapRef, seen] = useInView({ threshold: 0.4 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = TM_CW * dpr;
    canvas.height = TM_CH * dpr;
    canvas.style.width = TM_CW + "px";
    canvas.style.height = TM_CH + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!seen) {
      tmRenderTo(ctx, 0, isRight, erosion); // field only, before entry
      return;
    }
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      tmRenderTo(ctx, 1, isRight, erosion);
      return;
    }
    let raf = 0;
    let start = 0;
    const DURATION = 3400;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / DURATION);
      tmRenderTo(ctx, p, isRight, erosion);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [seen, isRight, erosion]);

  return (
    <div className="tmosaic" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        style={{ display: "block" }}
        role="img"
        aria-label={
          isRight
            ? "A mosaic letter T assembling from the base upward, shedding tiles toward the top so it ends eroded and harder to read."
            : "A mosaic letter T assembling cleanly from the base upward into a complete, legible form."
        }
      />
    </div>
  );
}
