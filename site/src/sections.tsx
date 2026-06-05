// sections.tsx — all landing-page sections (Nav, Hero, Manifesto, IsIsNot, Loop).
import { useState, useEffect, useRef } from "react";
import { Reveal, Mark, Mosaic, Glyph } from "./mosaic";

/* ───────────────────────── NAV ───────────────────────── */
const NAV_LINKS = [
  { href: "#shift", label: "The shift" },
  { href: "#beliefs", label: "Beliefs" },
  { href: "#isnot", label: "What it is" },
  { href: "#system", label: "System" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")}>
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="Tessera home">
          <Mark size={30} />
          <span className="word">Tessera</span>
        </a>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={"nav-link" + (active === l.href.slice(1) ? " active" : "")}
            >
              {l.label}
            </a>
          ))}
        </div>
        <a href="#access" className="btn btn-primary nav-cta">
          Request access
        </a>
        <a href="#access" className="btn btn-primary nav-toggle">
          Access <Glyph.arrow style={{ width: 16, height: 10 }} />
        </a>
      </div>
    </nav>
  );
}

/* ───────────────────────── HERO ───────────────────────── */
// The headline word and the tile mosaic share one phase so they stay matched.
const CYCLE_MS = 3100; // hold + morph; the calm pace for both
const CYCLE_WORDS = ["architecture", "contracts", "domain", "data", "flows"];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) setReduced(true);
  }, []);
  return reduced;
}

function CyclingWord({ phase, still }: { phase: number; still: boolean }) {
  const [shown, setShown] = useState(0);
  const [anim, setAnim] = useState("in");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (still) {
      setShown(0);
      setAnim("in");
      return;
    }
    if (phase === shown) return;
    setAnim("out"); // current word drifts out + blurs
    timers.current.push(
      setTimeout(() => {
        setShown(phase); // swap to the new word
        setAnim("enter"); // parked off to the left
        timers.current.push(setTimeout(() => setAnim("in"), 40)); // fly in from the left
      }, 200),
    );
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [phase, still]);
  const word = CYCLE_WORDS[(still ? 0 : shown) % CYCLE_WORDS.length];
  return (
    <span className="cycle-slot">
      <span className={"cycle-word anim-" + (still ? "in" : anim)}>
        <span className="gradient-text">{word}</span>
        <span className="cw-dot">.</span>
      </span>
    </span>
  );
}

export function Hero({ cascadeMotion }: { cascadeMotion: boolean }) {
  const reduced = useReducedMotion();
  const still = reduced || !cascadeMotion;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (still) {
      setPhase(0);
      return;
    }
    const id = setInterval(() => setPhase((p) => (p + 1) % CYCLE_WORDS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [still]);

  return (
    <header className="hero" id="top">
      <div className="shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Design the system, not the diff</span>
            <h1 className="hero-h1">
              Design your
              <br />
              <CyclingWord phase={phase} still={still} />
              <br />
              Let the code follow.
            </h1>
            <p className="hero-lead">
              Tessera projects your codebase into the views you actually think in: domain
              models, architecture, contracts, and flows. Change one, and it validates
              across them all. You design; agents implement.
            </p>
            <div className="hero-actions">
              <a href="#access" className="btn btn-primary btn-lg">
                Request early access
              </a>
              <a href="#system" className="btn btn-ghost btn-lg">
                See how it works
              </a>
            </div>
          </div>
          <div className="hero-stage-wrap">
            <div className="hero-stage">
              <Mosaic phase={phase} still={still} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────── MANIFESTO ───────────────────────── */
const BELIEFS = [
  {
    n: "01",
    stmt: "Engineering is design. The decisions that matter are about models and boundaries, not lines.",
    gl: "The valuable act was never typing the code. It was choosing the shape: which domains exist, where the seams fall, what each part is allowed to know about the others.",
  },
  {
    n: "02",
    stmt: "You should own the architecture. An agent shouldn't get to decide the shape of your system.",
    gl: "Agents are extraordinary at execution and dangerous at architecture. The boundary between deciding and executing is exactly where authority over a codebase should sit, with the people accountable for it.",
  },
  {
    n: "03",
    stmt: "Review at the diff is review too late.",
    gl: "By the time architecture appears as a code change, the decision has already been made: silently, invisibly, and without your input. The right altitude is where change is still cheap.",
  },
  {
    n: "04",
    stmt: "You should never have to leave the design surface to stay in control.",
    gl: "Code, agents, and diffs all exist in service of the design, not the other way around. The level you decide at should also be the level you work, validate, and confirm at.",
  },
];

export function Manifesto() {
  return (
    <section className="section" id="beliefs">
      <div className="shell">
        <Reveal className="section-head">
          <span className="eyebrow">Beliefs</span>
          <h2>What we believe.</h2>
          <p>
            Tessera is built for engineering leaders who own design decisions, and on a
            clear point of view about who should make them.
          </p>
        </Reveal>
        <div className="belief-list">
          {BELIEFS.map((b) => (
            <Reveal key={b.n} className="belief">
              <div className="num">{b.n}</div>
              <div className="stmt">
                {b.stmt}
                <span className="gl">{b.gl}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── IS / IS NOT ───────────────────────── */
const IS = [
  "A design surface that projects your codebase into the views you think in: domain, architecture, contracts, and flows.",
  "Always-current views derived from your source, not diagrams you draw once and abandon.",
  "A way to reshape one view and validate the change across every other before a line is written.",
  "A precise spec plus a targeted diff that any coding agent can execute, traceable back to your design.",
  "Review at the design altitude, where architectural mistakes are still cheap to fix.",
];
const ISNOT = [
  "Not a chat client, or a skin over an agent loop.",
  "Not a replacement for your IDE, version control, or issue tracker.",
  "Not a code-search or code-intelligence tool.",
  "Not a tool for writing code. It's a tool for designing the system the code belongs to.",
];

export function IsIsNot() {
  return (
    <section className="section" id="isnot">
      <div className="shell">
        <Reveal className="section-head">
          <span className="eyebrow">What it is</span>
          <h2>What Tessera is, and what it isn't.</h2>
          <p>
            The name comes from <em>tessera</em>: the single tile in a mosaic. Each model,
            boundary, contract, and flow is a tile; the picture they compose is the design
            you stay in control of.
          </p>
        </Reveal>
        <div className="isnot-grid">
          <Reveal as="div" stagger className="isnot-card is">
            <div className="hd">
              <Mark size={16} /> Tessera is
            </div>
            <ul>
              {IS.map((t, i) => (
                <li key={i}>
                  <Glyph.check className="mk" /> <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal as="div" stagger className="isnot-card isnot">
            <div className="hd">Tessera is not</div>
            <ul>
              {ISNOT.map((t, i) => (
                <li key={i}>
                  <Glyph.cross className="mk" /> <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── THE LOOP (how it works) ───────────────────────── */
const VIEWS = [
  { nm: "Domain", c: "#5b6bff" },
  { nm: "Architecture", c: "#ff4d8c" },
  { nm: "Contracts", c: "#22d3ee" },
  { nm: "Flows", c: "#a3e635" },
];
const LOOP = [
  {
    n: "01",
    h: "See your system every way you think about it",
    p: "One codebase, many views. Tessera indexes your code into a canonical graph and projects it as domain models, architecture maps, contracts, and sequence flows: the levels you actually make decisions at. Not diagrams you draw and abandon: views derived from the source, always current.",
    views: true,
  },
  {
    n: "02",
    h: "Change one view, validate them all",
    p: "Edit visually or by prompt. When you reshape a domain model or reroute a flow, Tessera checks the change against every other view, so an architectural decision is consistent everywhere before a single line is written.",
  },
  {
    n: "03",
    h: "Your intent becomes a precise spec",
    p: "A committed design isn't a vague ticket. Tessera turns it into a spec plus a targeted diff of exactly the code regions that should change: structured intent any coding agent can execute, traceable back to the graph it came from.",
  },
  {
    n: "04",
    h: "See the design change, before and after",
    p: "After the agent applies changes, Tessera re-projects your views so you get a visual before-and-after of what actually moved. You confirm the architecture shifted the way you intended: not by reading a diff, but by seeing it.",
  },
];

export function Loop() {
  return (
    <section className="section" id="system">
      <div className="shell">
        <Reveal className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>Design, validate, delegate, confirm.</h2>
          <p>
            Four moves that close into a loop. You stay on the design surface the whole way
            around: the code, the agents, and the diffs all stay in service of the design.
          </p>
        </Reveal>
        <div className="loop-grid">
          {LOOP.map((s) => (
            <Reveal as="div" className="loop-card" key={s.n}>
              <div className="step">
                <span className="n">{s.n}</span>
                <span className="ln"></span>
              </div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
              {s.views && (
                <div className="loop-views">
                  {VIEWS.map((v) => (
                    <span className="view-chip" key={v.nm}>
                      <span className="sw" style={{ background: v.c }}></span>
                      {v.nm}
                    </span>
                  ))}
                </div>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal className="loop-foot">
          <span>↻</span> every change re-enters the loop, so the design never goes stale
        </Reveal>
      </div>
    </section>
  );
}
