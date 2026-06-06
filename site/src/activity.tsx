// activity.tsx — "More is less" slice visual. A GitHub-style contribution graph
// re-skinned to the Prism theme whose lit cells spell TESSERA. On reveal the
// word assembles clean; a violet scan line then sweeps a hotter, busier field
// across it until the word dissolves into the noise (activity up, design down) —
// the contribution count climbing with it — then it snaps back to clean and loops.
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from "react";
import "./activity.css";

// style objects carry CSS custom properties (--d, --cx, …) alongside standard
// props; this intersection lets them typecheck without unsafe casts.
type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/* ── 5×7 pixel font (rows top→bottom) ─────────────────────────────────── */
const GLYPHS: Record<string, string[]> = {
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  S: ["11111", "10000", "10000", "11111", "00001", "00001", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
};
const WORD = "TESSERA";
const COLS = 53;
const ROWS = 7;
const GW = 5; // glyph width
const SPAN = WORD.length * (GW + 1) - 1; // 41
const START = Math.floor((COLS - SPAN) / 2); // 6

/* ── letter-cell positions ────────────────────────────────────────────── */
const LETTERS: { r: number; c: number }[] = (() => {
  const out: { r: number; c: number }[] = [];
  let col = START;
  for (const ch of WORD) {
    const gl = GLYPHS[ch];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < GW; c++) if (gl[r][c] === "1") out.push({ r, c: col + c });
    col += GW + 1;
  }
  return out;
})();
const LETSET = new Set(LETTERS.map((o) => o.r * COLS + o.c));

/* ── month labels from real Sunday-aligned dates (authentic GitHub spacing) */
const MONTHS: { col: number; name: string }[] = (() => {
  const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date(2026, 5, 5);
  const endSun = new Date(today);
  endSun.setDate(today.getDate() - today.getDay());
  const first = new Date(endSun);
  first.setDate(endSun.getDate() - (COLS - 1) * 7);
  const out: { col: number; name: string }[] = [];
  let prev = -1;
  let lastCol = -3;
  for (let c = 0; c < COLS; c++) {
    const d = new Date(first);
    d.setDate(first.getDate() + c * 7);
    const m = d.getMonth();
    if (m !== prev && c - lastCol >= 3 && c <= COLS - 3) {
      out.push({ col: c, name: MN[m] });
      lastCol = c;
    }
    prev = m;
  }
  return out;
})();

/* ── deterministic model: TESSERA burned into a noise field ───────────── */
type Cell = { lv: number };
type Model = { cells: Cell[][]; count: number };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function buildModel(variant: "clean" | "up", noise: number): Model {
  const rnd = rng(0x5be12a);
  const cells: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ lv: 0 })),
  );
  const np = noise / 100;
  const isLetter = (r: number, c: number) => LETSET.has(r * COLS + c);

  // background field
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isLetter(r, c)) continue;
      if (variant === "up") {
        // hot, dense field — the agent's busywork. Bright greens everywhere so
        // the surface reads as MORE productive (GitHub: brighter = more).
        if (rnd() < 0.9) {
          const v = rnd();
          cells[r][c].lv = v < 0.34 ? 2 : v < 0.74 ? 3 : 4;
        } else {
          cells[r][c].lv = 1;
        }
      } else if (rnd() < np) {
        cells[r][c].lv = rnd() < 0.78 ? 1 : 2;
      }
    }
  }

  // letters
  if (variant === "up") {
    // letters sit at the field's brightness, so the word is camouflaged by the
    // surrounding hot noise: lost in the activity rather than erased.
    for (const o of LETTERS) cells[o.r][o.c].lv = rnd() < 0.7 ? 3 : 4;
  } else {
    for (const o of LETTERS) cells[o.r][o.c].lv = rnd() < 0.72 ? 4 : 3;
  }

  let w = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) w += cells[r][c].lv;
  const count = variant === "up" ? Math.round(960 + w * 2.7) : Math.round(200 + w * 2.05);
  return { cells, count };
}

const LIME = { rgb: "163,230,53", bright: "#b6f04e" };
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

/* ── reveal once, when scrolled into view ─────────────────────────────── */
function useInViewOnce(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setSeen(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

function cellNodes(cells: Cell[][], speed: number): ReactElement[] {
  const out: ReactElement[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lv = cells[r][c].lv;
      const delay = Math.round(c * speed + r * (speed * 0.18));
      const style: CSSVars = {
        "--d": delay + "ms",
        "--cx": (c / (COLS - 1)).toFixed(4),
        "--cy": (r / (ROWS - 1)).toFixed(4),
      };
      out.push(
        <div key={r * COLS + c} className={"cell" + (lv ? " lv" + lv : "")} style={style} />,
      );
    }
  }
  return out;
}

/* ── stages: which model each layer shows + which transition is armed ───
   decay-hold is the wipe's final frame held still (same layers, --split pinned
   past the right edge, bar gone) so there is no luminance change at the handoff. */
type Phase = "intro" | "cleanHold" | "wipe" | "decayHold";
const PHASES: Record<Phase, { base: "clean" | "decay"; overlay: "clean" | "decay"; cls: string }> = {
  intro: { base: "clean", overlay: "clean", cls: " is-intro" },
  cleanHold: { base: "clean", overlay: "clean", cls: "" },
  wipe: { base: "clean", overlay: "decay", cls: " is-wipe" },
  decayHold: { base: "clean", overlay: "decay", cls: " is-decayed" },
};

export function ActivityGrid({
  noise = 24,
  speed = 18,
  swipeSecs = 2.6,
  chrome = true,
}: {
  noise?: number;
  speed?: number;
  swipeSecs?: number;
  chrome?: boolean;
}) {
  const [wrapRef, seen] = useInViewOnce();
  const [phase, setPhase] = useState<Phase>("cleanHold");
  const [countDisp, setCountDisp] = useState(0);

  const decay = useMemo(() => buildModel("up", noise), [noise]);
  const clean = useMemo(() => buildModel("clean", noise), [noise]);

  // clean ≈ 3k, decayed ≈ 12k — GitHub semantics: busier/brighter = more, so as
  // the word dissolves the number climbs. Derived from the grids' own weight.
  const cleanCount = useMemo(() => Math.round(clean.count * 2.5), [clean]);
  const decayCount = useMemo(() => Math.round(decay.count * 3.2), [decay]);

  const countRef = useRef(0);
  const countRaf = useRef(0);

  // ── timeline state machine ──────────────────────────────────────────────
  // intro (reveal, count→3k) → hold 2s → wipe (count→12k) → decay-hold 3s →
  // snap back to clean → hold 2s → wipe … The count tweens with the motion.
  useEffect(() => {
    if (!seen) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("cleanHold");
      countRef.current = cleanCount;
      setCountDisp(cleanCount);
      return;
    }

    const tween = (to: number, dur: number) => {
      cancelAnimationFrame(countRaf.current);
      const from = countRef.current;
      if (dur <= 0 || from === to) {
        countRef.current = to;
        setCountDisp(to);
        return;
      }
      const t0 = performance.now();
      const ease = (x: number) => 1 - Math.pow(1 - x, 3);
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const v = Math.round(from + (to - from) * ease(k));
        countRef.current = v;
        setCountDisp(v);
        if (k < 1) countRaf.current = requestAnimationFrame(step);
      };
      countRaf.current = requestAnimationFrame(step);
    };

    const introDur = COLS * speed + 750;
    const wipeDur = Math.max(1200, swipeSecs * 1000);
    const DUR: Record<Phase, number> = {
      intro: introDur,
      cleanHold: 2000,
      wipe: wipeDur,
      decayHold: 3000,
    };
    const NEXT: Record<Phase, Phase> = {
      intro: "cleanHold",
      cleanHold: "wipe",
      wipe: "decayHold",
      decayHold: "cleanHold",
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const enter = (p: Phase) => {
      if (!alive) return;
      setPhase(p);
      if (p === "intro") tween(cleanCount, introDur);
      else if (p === "wipe") tween(decayCount, wipeDur);
      // decayHold → cleanHold is an instant switch back to clean (tiles + count
      // snap together) — no morph motion.
      else if (p === "cleanHold") {
        countRef.current = cleanCount;
        setCountDisp(cleanCount);
      } else if (p === "decayHold") {
        countRef.current = decayCount;
        setCountDisp(decayCount);
      }
      timer = setTimeout(() => enter(NEXT[p]), DUR[p]);
    };

    countRef.current = 0;
    setCountDisp(0);
    enter("intro");
    return () => {
      alive = false;
      clearTimeout(timer);
      cancelAnimationFrame(countRaf.current);
    };
  }, [seen, swipeSecs, speed, cleanCount, decayCount]);

  const rootStyle: CSSVars = {
    "--c-bright": LIME.bright,
    "--act-rgb": LIME.rgb,
    "--wipe": Math.max(1.2, swipeSecs) + "s",
  };

  const pc = PHASES[phase];

  return (
    <div className={"actcard split" + pc.cls} ref={wrapRef} style={rootStyle}>
      {chrome && (
        <div className="act-hd">
          <div className="count">
            <b>{countDisp.toLocaleString()}</b> contributions in the last year
          </div>
        </div>
      )}

      <div className="cal">
        {chrome && (
          <div className="cal-months">
            {MONTHS.map((m) => (
              <span key={m.col} style={{ gridColumn: m.col + 1 + " / span 6", gridRow: 1 }}>
                {m.name}
              </span>
            ))}
          </div>
        )}
        <div className="cal-body">
          {chrome && (
            <div className="cal-days">
              {DAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          )}
          <div
            className="cgrid-split"
            role="img"
            aria-label="A GitHub-style contribution graph whose highlighted cells spell the word Tessera, then flood with activity until the word is lost."
          >
            <div className="cgrid split-layer base">
              {cellNodes((pc.base === "clean" ? clean : decay).cells, speed)}
            </div>
            <div className="cgrid split-layer incoming">
              {cellNodes((pc.overlay === "clean" ? clean : decay).cells, speed)}
            </div>
            <div className="split-bar" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      {chrome && (
        <div className="act-ft">
          <a className="learn" href="#" onClick={(e) => e.preventDefault()}>
            Learn how we count contributions
          </a>
          <div className="act-legend">
            Less
            <div className="scale">
              <span className="lc lv0" />
              <span className="lc lv1" />
              <span className="lc lv2" />
              <span className="lc lv3" />
              <span className="lc lv4" />
            </div>
            More
          </div>
        </div>
      )}
    </div>
  );
}
