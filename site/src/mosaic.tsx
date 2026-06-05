// mosaic.tsx — animated Tessera mark, reveal-on-scroll utilities, small SVG glyphs.
import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

/* ── Reveal on scroll (tile-assembly motion) ──────────────────────────── */
export function useInView(
  options?: IntersectionObserverInit,
): [RefObject<any>, boolean] {
  const ref = useRef<any>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px", ...(options || {}) },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

// Wrapper that fades/slides its children in when scrolled into view.
export function Reveal({
  as = "div",
  stagger = false,
  className = "",
  children,
  ...rest
}: {
  as?: any;
  stagger?: boolean;
  className?: string;
  children?: ReactNode;
  [k: string]: any;
}) {
  const [ref, seen] = useInView();
  const Tag: any = as;
  const cls =
    (stagger ? "reveal-stagger" : "reveal") +
    (seen ? " in" : "") +
    (className ? " " + className : "");
  return (
    <Tag ref={ref} className={cls} {...rest}>
      {children}
    </Tag>
  );
}

/* ── Static brand mark — grid or cascade variant. size in px. ─────────── */
export function Mark({
  size = 32,
  cascade = false,
}: {
  size?: number;
  cascade?: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#5b6bff" />
      <rect x="34" y="2" width="28" height="28" rx="6" fill="#ff4d8c" />
      <rect x="2" y="34" width="28" height="28" rx="6" fill="#22d3ee" />
      {cascade ? (
        <g transform="rotate(8 48 48)">
          <rect x="34" y="34" width="28" height="28" rx="6" fill="#a3e635" />
        </g>
      ) : (
        <rect x="34" y="34" width="28" height="28" rx="6" fill="#a3e635" />
      )}
    </svg>
  );
}

// Big animated hero mosaic: the four brand squares (one codebase) slowly
// reposition between arrangements that match the cycling headline word.
// Order matches CYCLE_WORDS in sections.tsx:
//   0 architecture  1 contracts  2 domain  3 data  4 flows
const TILE_SIZE = 40; // % of the stage, constant across every arrangement
const MOSAIC_VIEWS = [
  // architecture: structured, foundational 2x2 grid (also the resting logo)
  [{ l: 8, t: 8, r: 0 }, { l: 52, t: 8, r: 0 }, { l: 8, t: 52, r: 0 }, { l: 52, t: 52, r: 0 }],
  // contracts: a tight vertical stack of squares offset into steps
  [{ l: 26, t: 5, r: 0 }, { l: 32, t: 21, r: 0 }, { l: 38, t: 37, r: 0 }, { l: 44, t: 53, r: 0 }],
  // domain: a clustered huddle of grouped entities
  [{ l: 16, t: 12, r: -8 }, { l: 50, t: 16, r: 7 }, { l: 12, t: 50, r: 6 }, { l: 48, t: 52, r: -7 }],
  // data: a left-to-right zigzag (records in a series)
  [{ l: 1, t: 13, r: 0 }, { l: 21, t: 47, r: 0 }, { l: 41, t: 13, r: 0 }, { l: 60, t: 47, r: 0 }],
  // flows: a diagonal cascade, stepping down-right like a sequence
  [{ l: 3, t: 5, r: 0 }, { l: 23, t: 27, r: 0 }, { l: 43, t: 49, r: 0 }, { l: 60, t: 64, r: 0 }],
];
const TILE_FILLS = ["#5b6bff", "#ff4d8c", "#22d3ee", "#a3e635"];

export function Mosaic({
  phase = 0,
  still = false,
}: {
  phase?: number;
  still?: boolean;
}) {
  const tiles = MOSAIC_VIEWS[(still ? 0 : phase) % MOSAIC_VIEWS.length];
  return (
    <div
      className={"mosaic-anim" + (still ? " is-still" : "")}
      aria-label="Tessera mosaic mark"
      role="img"
    >
      {tiles.map((tl, i) => (
        <div
          key={i}
          className="mtile"
          style={{
            left: tl.l + "%",
            top: tl.t + "%",
            width: TILE_SIZE + "%",
            height: TILE_SIZE + "%",
            transform: "rotate(" + tl.r + "deg)",
            background: TILE_FILLS[i],
          }}
        />
      ))}
    </div>
  );
}

/* ── Tiny glyphs (geometric, per the brand's no-stock-icon rule) ──────── */
export const Glyph: Record<string, (p: any) => any> = {
  check: (p) => (
    <svg viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cross: (p) => (
    <svg viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 16 16" fill="none" {...p}>
      <path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 20 12" fill="none" {...p}>
      <path d="M0 6h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13 1.5L18.5 6 13 10.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};
