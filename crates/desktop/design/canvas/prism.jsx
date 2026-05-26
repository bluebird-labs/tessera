// identity/prism.jsx — Direction A: Prism
// Modern web app, vibrant. Deep midnight base, multi-hue accent system,
// glass surfaces, soft gradient washes, glow on selection. Linear meets
// Vercel meets Stripe. Dark-first; light counterpart is pristine white
// with the same vibrant accents.

(function () {
  const T = {
    // dark base
    bg:        "#07080f",
    bgWarp:    "#0a0c18",
    surface0:  "#0e0f1a",
    surface1:  "#13152340",  // glass overlay 25%
    surface2:  "#1a1d2e",
    surfaceHi: "#222640",
    line:      "rgba(255,255,255,0.06)",
    lineHi:    "rgba(255,255,255,0.12)",
    glassBorder: "rgba(255,255,255,0.08)",
    // dark text
    text:    "#f5f6fb",
    textDim: "rgba(245,246,251,0.66)",
    textMute:"rgba(245,246,251,0.38)",
    // light base
    paper:    "#fbfbfd",
    paperWarp:"#f5f6fb",
    paperLo:  "#eef0f7",
    paperDim: "#e2e5f0",
    paperLine:"rgba(7,8,15,0.08)",
    paperLineHi:"rgba(7,8,15,0.14)",
    // light text
    textL:    "#0a0b14",
    textDimL: "rgba(10,11,20,0.66)",
    textMuteL:"rgba(10,11,20,0.42)",
    // vibrant accents — these mean the same in both modes
    indigo:   "#5b6bff",
    indigoHi: "#7d8aff",
    magenta:  "#ff4d8c",
    magentaHi:"#ff7ba9",
    cyan:     "#22d3ee",
    cyanHi:   "#5be7f5",
    lime:     "#a3e635",
    limeHi:   "#c0ee72",
    violet:   "#a855f7",
    violetHi: "#c084fc",
    amber:    "#fb923c",
    coral:    "#fb7185",
    // alpha helpers
    indigoBg: "rgba(91,107,255,0.14)",
    indigoBg2:"rgba(91,107,255,0.22)",
    magentaBg:"rgba(255,77,140,0.14)",
    cyanBg:   "rgba(34,211,238,0.14)",
    limeBg:   "rgba(163,230,53,0.14)",
    violetBg: "rgba(168,85,247,0.16)",
    amberBg:  "rgba(251,146,60,0.16)",
    coralBg:  "rgba(251,113,133,0.14)",
  };

  const F = {
    sans: '"Inter Tight", "Geist", system-ui, sans-serif',
    body: '"Inter", "Geist", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Geist Mono", "SF Mono", Menlo, monospace',
  };

  const graphDark = {
    bg: T.bg,
    edge: "rgba(255,255,255,0.22)",
    edgeMuted: "rgba(255,255,255,0.10)",
    edgeLabelBg: T.surface2,
    edgeLabelFg: T.textDim,
    grout: "rgba(255,255,255,0.04)",
    groutOpacity: 1,
    selection: T.indigoHi,
    frozen: T.lime,
    drift: T.coral,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.indigo,   stroke: T.indigoHi,  text: "#fff",     shape: "tile" },
      useCase:   { fill: T.cyan,     stroke: T.cyanHi,    text: "#02141a",  shape: "tile" },
      aggregate: { fill: T.magenta,  stroke: T.magentaHi, text: "#fff",     shape: "tile" },
      module:    { fill: T.surface2, stroke: T.lineHi,    text: T.textDim,  shape: "rounded" },
      decision:  { fill: T.violet,   stroke: T.violetHi,  text: "#fff",     shape: "marker" },
      actor:     { fill: T.surfaceHi,stroke: T.lineHi,    text: T.text,     shape: "circle" },
    },
  };

  const graphLight = {
    bg: T.paper,
    edge: "rgba(7,8,15,0.22)",
    edgeMuted: "rgba(7,8,15,0.10)",
    edgeLabelBg: T.paperLo,
    edgeLabelFg: T.textDimL,
    grout: "rgba(7,8,15,0.04)",
    groutOpacity: 1,
    selection: T.indigo,
    frozen: T.lime,
    drift: T.coral,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.indigo,   stroke: T.indigoHi,  text: "#fff",     shape: "tile" },
      useCase:   { fill: T.cyan,     stroke: T.cyanHi,    text: "#02141a",  shape: "tile" },
      aggregate: { fill: T.magenta,  stroke: T.magentaHi, text: "#fff",     shape: "tile" },
      module:    { fill: T.paperLo,  stroke: T.paperLineHi,text: T.textDimL,shape: "rounded" },
      decision:  { fill: T.violet,   stroke: T.violetHi,  text: "#fff",     shape: "marker" },
      actor:     { fill: T.paper,    stroke: T.paperLineHi,text: T.textL,   shape: "circle" },
    },
  };

  // Gradient mesh background used in dark mode shells & states.
  function MeshBg({ opacity = 1 }) {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }}>
        <defs>
          <radialGradient id="pm-a" cx="20%" cy="0%" r="60%">
            <stop offset="0%" stopColor={T.indigo} stopOpacity="0.32" />
            <stop offset="100%" stopColor={T.indigo} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pm-b" cx="100%" cy="40%" r="55%">
            <stop offset="0%" stopColor={T.magenta} stopOpacity="0.22" />
            <stop offset="100%" stopColor={T.magenta} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pm-c" cx="55%" cy="100%" r="55%">
            <stop offset="0%" stopColor={T.cyan} stopOpacity="0.18" />
            <stop offset="100%" stopColor={T.cyan} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#pm-a)" />
        <rect width="100%" height="100%" fill="url(#pm-b)" />
        <rect width="100%" height="100%" fill="url(#pm-c)" />
      </svg>
    );
  }

  function MeshBgLight({ opacity = 1 }) {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }}>
        <defs>
          <radialGradient id="pml-a" cx="15%" cy="0%" r="55%">
            <stop offset="0%" stopColor={T.indigo} stopOpacity="0.10" />
            <stop offset="100%" stopColor={T.indigo} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pml-b" cx="100%" cy="40%" r="60%">
            <stop offset="0%" stopColor={T.magenta} stopOpacity="0.08" />
            <stop offset="100%" stopColor={T.magenta} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#pml-a)" />
        <rect width="100%" height="100%" fill="url(#pml-b)" />
      </svg>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOUNDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  function Foundations() {
    return (
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, padding: 40, position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        <MeshBg opacity={0.9} />
        <div style={{ position: "relative" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "4px 10px", background: T.indigoBg, border: `1px solid ${T.indigo}50`, borderRadius: 999, fontFamily: F.mono, fontSize: 11, color: T.indigoHi, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: T.indigo, boxShadow: `0 0 10px ${T.indigo}` }} />
                Direction A · Prism
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 64, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.035em", maxWidth: 980, background: `linear-gradient(120deg, #ffffff 0%, ${T.indigoHi} 50%, ${T.magentaHi} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Code & domain, in one moving picture.
              </div>
              <div style={{ fontFamily: F.body, fontSize: 17, color: T.textDim, marginTop: 14, maxWidth: 760, lineHeight: 1.55 }}>
                Vibrant by default. Surfaces are glass, selection glows, transitions snap with spring physics. Color carries meaning and the graph is the protagonist.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", fontFamily: F.mono, fontSize: 11, color: T.textMute, letterSpacing: "0.08em" }}>
              <PrismLogo size={36} />
              <div>TESSERA · v0.1</div>
              <div>2026.05</div>
            </div>
          </div>

          {/* Spectrum band */}
          <div style={{ marginBottom: 28, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${T.indigo} 0%, ${T.violet} 25%, ${T.magenta} 50%, ${T.coral} 65%, ${T.amber} 78%, ${T.lime} 90%, ${T.cyan} 100%)`, opacity: 0.9, boxShadow: `0 0 40px ${T.indigo}55` }} />

          {/* Surfaces */}
          <Sec title="Surface · the glass">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              <Swatch color={T.bg}        label="canvas"    value="#07080f" dark />
              <Swatch color={T.surface0}  label="surface-0" value="#0e0f1a" dark />
              <Swatch color={T.surface2}  label="surface-1" value="#1a1d2e" dark />
              <Swatch color={T.surfaceHi} label="surface-2" value="#222640" dark />
              <Swatch color="rgba(255,255,255,0.06)" label="line"  value="white/06" dark />
              <Swatch color="rgba(255,255,255,0.12)" label="line+" value="white/12" dark />
            </div>
          </Sec>

          <Sec title="Surface · paper (light)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              <Swatch color={T.paper}    label="paper"     value="#fbfbfd" />
              <Swatch color={T.paperLo}  label="paper-1"   value="#eef0f7" />
              <Swatch color={T.paperDim} label="paper-2"   value="#e2e5f0" />
              <Swatch color="rgba(7,8,15,0.06)" label="line" value="ink/06" />
              <Swatch color="rgba(7,8,15,0.14)" label="line+" value="ink/14" />
              <Swatch color={T.textDimL} label="text-dim"  value="ink/66" />
            </div>
          </Sec>

          {/* Spectrum */}
          <Sec title="Spectrum · color = semantic signal">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
              <SpectrumSwatch color={T.indigo}  glow label="indigo"  value="#5b6bff" use="primary · contract" />
              <SpectrumSwatch color={T.cyan}    glow label="cyan"    value="#22d3ee" use="use case · agent" />
              <SpectrumSwatch color={T.magenta} glow label="magenta" value="#ff4d8c" use="aggregate" />
              <SpectrumSwatch color={T.violet}  glow label="violet"  value="#a855f7" use="decision · ADR" />
              <SpectrumSwatch color={T.lime}    glow label="lime"    value="#a3e635" use="frozen · success" />
              <SpectrumSwatch color={T.amber}   glow label="amber"   value="#fb923c" use="drafting · warn" />
              <SpectrumSwatch color={T.coral}   glow label="coral"   value="#fb7185" use="drift · danger" />
            </div>
          </Sec>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, marginTop: 8 }}>
            <div>
              <Sec title="Typography">
                <TypeRow weight={700} size={48} spec="Tessera." sub="Display · 700 · -3.5% · for view titles" />
                <TypeRow weight={600} size={28} spec="Cascade · Use cases · Contracts" sub="Heading · 600 · -2%" />
                <TypeRow weight={500} size={14} font={F.body} spec="A contract is the frozen promise between layers. Implementations descend from it." sub="Body · 500 · 1.55 lh · Inter" />
                <TypeRow weight={600} size={12} spec="Freeze contracts  ·  Re-derive  ·  Open mosaic" sub="UI · 600 · for buttons & labels" />
                <TypeRow weight={700} size={11} upper spec="CASCADE · CHECKOUT · DERIVES" sub="Caption · 700 · 14% tracking · UPPER" />
                <TypeRow weight={400} size={13} font={F.mono} spec="node:contract@checkout-v3#a1b" sub="Mono · 400 · IDs, code, diff" />
              </Sec>
            </div>
            <div>
              <Sec title="Node legend">
                <NodeLegend />
              </Sec>
              <Sec title="Radii & motion" top>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
                  {[4,8,12,16,999].map((r,i) => (
                    <div key={i} style={{ display: "grid", gap: 4, justifyItems: "center" }}>
                      <div style={{ width: 56, height: 36, background: T.indigo, borderRadius: r, boxShadow: `0 8px 24px ${T.indigo}40` }} />
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{["4","8","12","16","full"][i]}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textDim, marginTop: 14, lineHeight: 1.8 }}>
                  <div>spring · stiff &nbsp;<span style={{ color: T.textMute }}>k=400 · d=30</span></div>
                  <div>spring · soft  &nbsp;<span style={{ color: T.textMute }}>k=180 · d=22</span></div>
                  <div>ease · standard&nbsp;<span style={{ color: T.textMute }}>cubic(0.2,0.7,0.2,1) · 200ms</span></div>
                  <div>tiles assemble &nbsp;<span style={{ color: T.textMute }}>stagger 18ms · spring soft</span></div>
                </div>
              </Sec>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Sec({ title, top, children }) {
    return (
      <div style={{ marginTop: top ? 22 : 0, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: T.indigoHi }}>{title}</div>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>
        {children}
      </div>
    );
  }

  function Swatch({ color, label, value, dark }) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ width: "100%", height: 56, background: color, borderRadius: 8, border: dark ? `1px solid ${T.line}` : `1px solid ${T.paperLine}` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: dark ? T.textMute : T.textMuteL }}>{value}</div>
        </div>
      </div>
    );
  }

  function SpectrumSwatch({ color, glow, label, value, use }) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ width: "100%", height: 64, background: color, borderRadius: 8, boxShadow: glow ? `0 8px 32px ${color}80, 0 0 0 1px ${color}40` : "none" }} />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: F.sans, fontSize: 11.5, fontWeight: 600 }}>{label}</div>
            <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute }}>{value}</div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute, marginTop: 3, letterSpacing: "0.04em" }}>{use}</div>
        </div>
      </div>
    );
  }

  function TypeRow({ weight, size, font, spec, sub, upper }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "baseline", gap: 24, paddingBlock: 14, borderTop: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em" }}>{sub}</div>
        </div>
        <div style={{ fontFamily: font || F.sans, fontWeight: weight, fontSize: size, lineHeight: 1.05, letterSpacing: weight >= 700 ? "-0.025em" : weight >= 600 ? "-0.018em" : "0", textTransform: upper ? "uppercase" : "none", color: T.text }}>{spec}</div>
      </div>
    );
  }

  function NodeLegend() {
    const items = [
      { type: "contract",  label: "Contract"  },
      { type: "useCase",   label: "Use case"  },
      { type: "aggregate", label: "Aggregate" },
      { type: "module",    label: "Module"    },
      { type: "decision",  label: "Decision"  },
      { type: "actor",     label: "Actor"     },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {items.map(it => {
          const s = typeStyle[it.type];
          return (
            <div key={it.type} style={{ background: T.surface1, border: `1px solid ${T.line}`, padding: 14, borderRadius: 10, backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <defs>
                  <radialGradient id={`nl-${it.type}`} cx="35%" cy="30%" r="80%">
                    <stop offset="0%" stopColor={s.from} />
                    <stop offset="100%" stopColor={s.to} />
                  </radialGradient>
                </defs>
                {it.type === "decision" ? (
                  <g transform="rotate(45 28 28)">
                    <rect x="12" y="12" width="32" height="32" rx="5" fill={`url(#nl-${it.type})`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" filter={`drop-shadow(0 4px 14px ${s.glow}99)`} />
                  </g>
                ) : it.type === "actor" ? (
                  <circle cx="28" cy="28" r="16" fill={T.surfaceHi} stroke={T.lineHi} strokeWidth="1.5" />
                ) : (
                  <circle cx="28" cy="28" r="16" fill={`url(#nl-${it.type})`} stroke="rgba(255,255,255,0.42)" strokeWidth="1.2" filter={`drop-shadow(0 4px 14px ${s.glow}88)`} />
                )}
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600 }}>{it.label}</div>
                <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute, letterSpacing: "0.06em" }}>:{it.type}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function PrismLogo({ size = 28 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs>
          <linearGradient id="pl1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={T.indigo} />
            <stop offset="100%" stopColor={T.violet} />
          </linearGradient>
          <linearGradient id="pl2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.magenta} />
            <stop offset="100%" stopColor={T.coral} />
          </linearGradient>
          <linearGradient id="pl3" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={T.cyan} />
            <stop offset="100%" stopColor={T.lime} />
          </linearGradient>
        </defs>
        <rect x="2"  y="2"  width="12" height="12" rx="2" fill="url(#pl1)" />
        <rect x="18" y="2"  width="12" height="12" rx="2" fill="url(#pl2)" />
        <rect x="2"  y="18" width="12" height="12" rx="2" fill="url(#pl3)" />
        <rect x="18" y="18" width="12" height="12" rx="2" fill="rgba(255,255,255,0.92)" />
      </svg>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MOSAIC DIAGRAM · depth-of-field, vivid focus + fading periphery
  // ═══════════════════════════════════════════════════════════════════════
  // Three tiers of presence:
  //   focus      — what matters right now: full vivid color, halo, labels
  //   mid        — one ring out: dimmer, slight blur, labels still visible
  //   ghost      — the rest of the country: tiny, blurred, low alpha, no labels
  // A vignette pulls the eye to the focal region; the ghost field implies
  // the graph extends off-canvas in every direction. Production will run
  // this on real force-directed layout + 3D camera; coordinates here are
  // hand-tuned for clarity.

  // Type → fill gradient + glow
  const typeStyle = {
    contract:  { from: T.indigo,    to: T.violet,    glow: T.indigo  },
    useCase:   { from: T.cyan,      to: T.indigo,    glow: T.cyan    },
    aggregate: { from: T.magenta,   to: T.coral,     glow: T.magenta },
    module:    { from: T.surfaceHi, to: T.surface2,  glow: T.lineHi  },
    decision:  { from: T.violet,    to: T.magenta,   glow: T.violet  },
    actor:     { from: T.text90,    to: T.text90,    glow: T.lineHi  },
  };

  // Generate a deterministic ghost field — peripheral nodes that imply
  // the graph extends beyond the focal area.
  function makeGhostField(width, height) {
    const cx = width * 0.55, cy = height * 0.5;
    const phi = (Math.PI * 2) / 1.618;
    const items = [];
    for (let i = 0; i < 90; i++) {
      const t = i + 6;
      const angle = i * phi + i * 0.013;
      const radius = 220 + t * 7.5;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.68;
      if (x < 40 || x > width - 40 || y < 40 || y > height - 40) continue;
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy * 1.4);
      if (d < 240) continue; // keep focus region clear
      const types = ["contract", "useCase", "aggregate", "module", "module", "aggregate"];
      const type = types[i % types.length];
      const depth = Math.min(1, (d - 240) / 260); // 0 = near focus, 1 = far
      const r = 4.5 - depth * 2.2;
      items.push({ id: `g${i}`, type, x, y, r, depth });
    }
    return items;
  }

  function PrismMosaic({ width = 1100, height = 680, dark = true }) {
    const cx = width * 0.55, cy = height * 0.5;

    // Focus tier — what the user is looking at
    const focus = [
      { id: "shopper",  type: "actor",     label: "Shopper",      x: cx - 320, y: cy + 0,   r: 22 },
      { id: "place",    type: "useCase",   label: "Place Order",  x: cx - 175, y: cy - 60,  r: 28 },
      { id: "contract", type: "contract",  label: "Checkout v3",  x: cx + 0,   y: cy - 110, r: 36, selected: true },
      { id: "order",    type: "aggregate", label: "Order",        x: cx + 165, y: cy - 30,  r: 32 },
      { id: "payment",  type: "aggregate", label: "Payment",      x: cx + 215, y: cy + 130, r: 26, drift: true },
      { id: "adr",      type: "decision",  label: "ADR-031",      x: cx + 110, y: cy - 230, r: 22 },
    ];

    // Mid tier — one hop out, still informative
    const mid = [
      { id: "customer",  type: "aggregate", label: "Customer",        x: cx - 330, y: cy - 150, r: 18 },
      { id: "cart",      type: "aggregate", label: "Cart",            x: cx - 195, y: cy + 115, r: 18 },
      { id: "fraud",     type: "useCase",   label: "Fraud check",     x: cx + 360, y: cy + 50,  r: 18 },
      { id: "stripe",    type: "module",    label: "Stripe gateway",  x: cx + 360, y: cy + 200, r: 16 },
      { id: "orderSvc",  type: "module",    label: "OrderService",    x: cx + 70,  y: cy + 130, r: 16 },
      { id: "orderRepo", type: "module",    label: "OrderRepo",       x: cx - 60,  y: cy + 200, r: 15 },
      { id: "refund",    type: "contract",  label: "Refund v1",       x: cx + 290, y: cy - 180, r: 18 },
      { id: "pricing",   type: "contract",  label: "Pricing v2",      x: cx - 130, y: cy - 200, r: 16 },
    ];

    const allFocus = new Map(focus.map(n => [n.id, n]));
    const allMid   = new Map(mid.map(n => [n.id, n]));
    const byId = (id) => allFocus.get(id) || allMid.get(id);

    const focusEdges = [
      { from: "shopper",  to: "place",    label: null },
      { from: "place",    to: "contract", label: "derives" },
      { from: "contract", to: "order",    label: "shapes" },
      { from: "adr",      to: "contract", dashed: true },
      { from: "order",    to: "payment",  label: "requires" },
      { from: "place",    to: "cart",     faded: true },
      { from: "place",    to: "customer", faded: true },
    ];
    const midEdges = [
      { from: "cart",      to: "order" },
      { from: "order",     to: "orderSvc" },
      { from: "orderSvc",  to: "orderRepo" },
      { from: "payment",   to: "stripe",  drift: true },
      { from: "payment",   to: "fraud" },
      { from: "refund",    to: "order" },
      { from: "customer",  to: "place" },
      { from: "pricing",   to: "contract" },
    ];

    const ghosts = React.useMemo(() => makeGhostField(width, height), [width, height]);

    const txt   = dark ? T.text     : T.textL;
    const dim   = dark ? T.textDim  : T.textDimL;
    const mute  = dark ? T.textMute : T.textMuteL;
    const edgeC = dark ? "rgba(255,255,255,0.55)" : "rgba(7,8,15,0.45)";
    const edgeMidC = dark ? "rgba(255,255,255,0.16)" : "rgba(7,8,15,0.14)";
    const labelBg = dark ? T.surface2 : T.paperLo;
    const labelBorder = dark ? T.line : T.paperLine;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ display: "block", background: dark ? T.bg : T.paper }}>
        <defs>
          {Object.entries(typeStyle).map(([k, v]) => (
            <radialGradient key={k} id={`pmn-${k}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={v.from} />
              <stop offset="100%" stopColor={v.to} />
            </radialGradient>
          ))}
          <filter id="pmn-blur-ghost" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="pmn-blur-mid" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
          <filter id="pmn-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <radialGradient id="pmn-spotlight" cx="55%" cy="50%" r="42%">
            <stop offset="0%" stopColor={T.indigo} stopOpacity={dark ? "0.12" : "0.05"} />
            <stop offset="60%" stopColor={T.indigo} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pmn-vignette" cx="55%" cy="50%" r="62%">
            <stop offset="0%"  stopColor={dark ? T.bg : T.paper} stopOpacity="0" />
            <stop offset="55%" stopColor={dark ? T.bg : T.paper} stopOpacity="0" />
            <stop offset="100%" stopColor={dark ? T.bg : T.paper} stopOpacity={dark ? "0.85" : "0.7"} />
          </radialGradient>
        </defs>

        {/* faint spotlight to brighten focus region */}
        <rect width={width} height={height} fill="url(#pmn-spotlight)" />

        {/* GHOST FIELD — the rest of the country, blurred and dim */}
        <g filter="url(#pmn-blur-ghost)">
          {/* Ghost edges (a few wisps) */}
          <g stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(7,8,15,0.06)"} strokeWidth="0.6" fill="none">
            {ghosts.map((n, i) => {
              if (i % 4 !== 0) return null;
              const next = ghosts[(i + 3) % ghosts.length];
              if (!next) return null;
              return <path key={`gh-e-${i}`} d={curvePath(n.x, n.y, next.x, next.y, 0.08)} opacity={1 - n.depth * 0.5} />;
            })}
          </g>
          {ghosts.map(n => {
            const c = typeStyle[n.type].from;
            const op = 0.16 + (1 - n.depth) * 0.18;
            return <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={c} opacity={op} />;
          })}
        </g>

        {/* MID EDGES */}
        <g fill="none" stroke={edgeMidC} strokeWidth="1.1">
          {midEdges.map((e, i) => {
            const a = byId(e.from), b = byId(e.to);
            if (!a || !b) return null;
            const d = curvePath(a.x, a.y, b.x, b.y, 0.18);
            return <path key={`me-${i}`} d={d} strokeDasharray={e.drift ? "5 5" : undefined} stroke={e.drift ? T.coral : undefined} opacity={e.drift ? 0.7 : 0.85} />;
          })}
        </g>

        {/* MID NODES — slight blur, lower opacity */}
        <g opacity="0.78">
          <g filter="url(#pmn-blur-mid)">
            {mid.map(n => {
              const s = typeStyle[n.type];
              if (n.type === "decision") {
                return (
                  <g key={n.id} transform={`rotate(45 ${n.x} ${n.y})`}>
                    <rect x={n.x - n.r * 0.85} y={n.y - n.r * 0.85} width={n.r * 1.7} height={n.r * 1.7} rx="4" fill={`url(#pmn-${n.type})`} stroke={`${s.from}80`} strokeWidth="1" />
                  </g>
                );
              }
              return <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={`url(#pmn-${n.type})`} stroke={`${s.from}66`} strokeWidth="1" />;
            })}
          </g>
          {mid.map(n => (
            <text key={`ml-${n.id}`} x={n.x} y={n.y + n.r + 14} textAnchor="middle" fontSize="10.5" fontFamily={F.sans} fontWeight="500" fill={dim} style={{ pointerEvents: "none" }}>{n.label}</text>
          ))}
        </g>

        {/* FOCUS EDGES — vivid */}
        <g fill="none">
          {focusEdges.map((e, i) => {
            const a = byId(e.from), b = byId(e.to);
            if (!a || !b) return null;
            const d = curvePath(a.x, a.y, b.x, b.y, 0.16);
            const labelMx = (a.x + b.x) / 2;
            const labelMy = (a.y + b.y) / 2 - 8;
            const sw = e.label ? 1.8 : 1.4;
            return (
              <g key={`fe-${i}`}>
                <path d={d} stroke={edgeC} strokeWidth={sw} strokeDasharray={e.dashed ? "5 5" : undefined} opacity={e.faded ? 0.32 : 0.9} />
                {e.label && (
                  <g>
                    <rect x={labelMx - 32} y={labelMy - 9} width="64" height="18" rx="9" fill={labelBg} stroke={labelBorder} strokeWidth="0.5" />
                    <text x={labelMx} y={labelMy + 3} textAnchor="middle" fontSize="10" fontFamily={F.mono} fill={dim} style={{ letterSpacing: "0.04em" }}>{e.label}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* FOCUS NODES — vivid, glowing, labeled */}
        <g>
          {focus.map(n => {
            const s = typeStyle[n.type];
            return (
              <g key={n.id}>
                {/* outer halo glow for selected */}
                {n.selected && (
                  <circle cx={n.x} cy={n.y} r={n.r * 2.4} fill={s.glow} opacity="0.32" filter="url(#pmn-glow)" />
                )}
                {/* selection ring */}
                {n.selected && (
                  <circle cx={n.x} cy={n.y} r={n.r + 9} fill="none" stroke={T.lime} strokeWidth="1.5" strokeDasharray="4 3" />
                )}
                {/* main shape */}
                {n.type === "decision" ? (
                  <g transform={`rotate(45 ${n.x} ${n.y})`} style={{ filter: `drop-shadow(0 6px 22px ${s.glow}80)` }}>
                    <rect x={n.x - n.r * 0.85} y={n.y - n.r * 0.85} width={n.r * 1.7} height={n.r * 1.7} rx="6" fill={`url(#pmn-${n.type})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                  </g>
                ) : n.type === "actor" ? (
                  <circle cx={n.x} cy={n.y} r={n.r} fill={dark ? T.surfaceHi : T.paper} stroke={dark ? T.lineHi : T.paperLineHi} strokeWidth="1.5" />
                ) : (
                  <circle cx={n.x} cy={n.y} r={n.r} fill={`url(#pmn-${n.type})`} stroke="rgba(255,255,255,0.42)" strokeWidth="1.2" style={{ filter: `drop-shadow(0 6px 20px ${s.glow}70)` }} />
                )}
                {/* drift indicator */}
                {n.drift && (
                  <circle cx={n.x + n.r * 0.72} cy={n.y - n.r * 0.72} r="5" fill={T.coral} style={{ filter: `drop-shadow(0 0 8px ${T.coral})` }} />
                )}
              </g>
            );
          })}
          {/* labels stacked above all nodes */}
          {focus.map(n => (
            <g key={`fl-${n.id}`} style={{ pointerEvents: "none" }}>
              <text x={n.x} y={n.y + n.r + 20} textAnchor="middle" fontSize={n.selected ? "13" : "12"} fontFamily={F.sans} fontWeight={n.selected ? 700 : 600} fill={txt} style={{ letterSpacing: "-0.005em" }}>{n.label}</text>
              <text x={n.x} y={n.y + n.r + 35} textAnchor="middle" fontSize="9.5" fontFamily={F.mono} fill={mute} style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>:{n.type}</text>
            </g>
          ))}
        </g>

        {/* vignette overlay — pulls eye to focal region */}
        <rect width={width} height={height} fill="url(#pmn-vignette)" style={{ pointerEvents: "none" }} />
      </svg>
    );
  }

  // Smaller version for diff side-by-side panels — same node treatment,
  // no ghost field (panels are too small to justify it).
  function PrismMiniMosaic({ before, dark = true, width = 380, height = 280 }) {
    const cx = width / 2, cy = height / 2;
    const nodes = [
      { id: "place",    type: "useCase",   label: "PlaceOrder",  x: cx - 110, y: cy - 50, r: 18 },
      { id: "contract", type: "contract",  label: "Checkout v3", x: cx + 0,   y: cy - 5,  r: 22, selected: !before },
      { id: "order",    type: "aggregate", label: "Order",       x: cx + 100, y: cy - 70, r: 20 },
      { id: "payment",  type: "aggregate", label: "Payment",     x: cx + 70,  y: cy + 70, r: 18, drift: !before },
      { id: "orderSvc", type: "module",    label: "OrderSvc",    x: cx - 40,  y: cy + 80, r: 14 },
    ];
    const idMap = new Map(nodes.map(n => [n.id, n]));
    const baseEdges = [
      ["place", "contract"], ["contract", "order"], ["contract", "payment"], ["payment", "orderSvc"],
    ];
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          {Object.entries(typeStyle).map(([k, v]) => (
            <radialGradient key={k} id={`pmm-${k}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={v.from} />
              <stop offset="100%" stopColor={v.to} />
            </radialGradient>
          ))}
        </defs>
        <g fill="none" stroke={dark ? "rgba(255,255,255,0.22)" : "rgba(7,8,15,0.22)"} strokeWidth="1.2">
          {baseEdges.map(([a, b], i) => {
            const A = idMap.get(a), B = idMap.get(b);
            return <path key={i} d={curvePath(A.x, A.y, B.x, B.y, 0.15)} />;
          })}
          {!before && <path d={curvePath(idMap.get("contract").x, idMap.get("contract").y, cx + 140, cy - 130, 0.2)} stroke={T.lime} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 6px ${T.lime})` }} />}
          {before  && <path d={curvePath(idMap.get("payment").x, idMap.get("payment").y, cx + 140, cy + 130, 0.2)} stroke={T.coral} strokeWidth="1.3" strokeDasharray="3 3" />}
        </g>
        {nodes.map(n => {
          const s = typeStyle[n.type];
          return (
            <g key={n.id}>
              {n.selected && <circle cx={n.x} cy={n.y} r={n.r + 8} fill="none" stroke={T.lime} strokeWidth="1.3" strokeDasharray="3 3" />}
              <circle cx={n.x} cy={n.y} r={n.r} fill={`url(#pmm-${n.type})`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" style={{ filter: `drop-shadow(0 4px 12px ${s.glow}66)` }} />
              {n.drift && <circle cx={n.x + n.r * 0.72} cy={n.y - n.r * 0.72} r="4" fill={T.coral} style={{ filter: `drop-shadow(0 0 5px ${T.coral})` }} />}
            </g>
          );
        })}
        {!before && (
          <g transform={`rotate(45 ${cx + 140} ${cy - 130})`}>
            <rect x={cx + 140 - 14} y={cy - 130 - 14} width="28" height="28" rx="4" fill={`url(#pmm-decision)`} stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" style={{ filter: `drop-shadow(0 6px 18px ${T.violet}90)` }} />
          </g>
        )}
        {nodes.map(n => (
          <text key={`l-${n.id}`} x={n.x} y={n.y + n.r + 13} textAnchor="middle" fontSize="10" fontFamily={F.sans} fontWeight={n.selected ? 700 : 500} fill={dark ? T.text : T.textL}>{n.label}</text>
        ))}
        {!before && <text x={cx + 140} y={cy - 130 + 35} textAnchor="middle" fontSize="10" fontFamily={F.sans} fontWeight="600" fill={dark ? T.text : T.textL}>ADR-031</text>}
        {before && (
          <g opacity="0.5">
            <circle cx={cx + 140} cy={cy + 130} r="14" fill="none" stroke={T.coral} strokeWidth="1.2" strokeDasharray="3 3" />
            <text x={cx + 140} y={cy + 130 + 26} textAnchor="middle" fontSize="10" fontFamily={F.sans} fontWeight="500" fill={dark ? T.text : T.textL} textDecoration="line-through">sync_charge</text>
          </g>
        )}
      </svg>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // APP SHELL
  // ═══════════════════════════════════════════════════════════════════════

  function Shell({ dark }) {
    const p = dark
      ? { bg: T.bg, rail: "rgba(255,255,255,0.02)", railText: T.textMute, railActive: T.text,
          chrome: "rgba(255,255,255,0.03)", divider: T.line, paneBg: "rgba(255,255,255,0.025)", paneText: T.text, paneMuted: T.textMute,
          stage: T.bg, chip: "rgba(255,255,255,0.04)", chipHi: "rgba(255,255,255,0.08)", chipFg: T.text }
      : { bg: T.paper, rail: T.paperLo, railText: T.textMuteL, railActive: T.textL,
          chrome: T.paper, divider: T.paperLine, paneBg: T.paper, paneText: T.textL, paneMuted: T.textMuteL,
          stage: T.paper, chip: T.paperLo, chipHi: T.paperDim, chipFg: T.textL };

    const railItems = ["mosaic", "cascade", "contracts", "domain", "agents", "history", "settings"];
    const railIcons = ["▦", "≡", "◇", "◐", "◬", "◷", "✦"];

    return (
      <div style={{ height: "100%", width: "100%", background: p.bg, fontFamily: F.sans, color: p.paneText, display: "grid", gridTemplateRows: "44px 1fr 28px", overflow: "hidden", position: "relative" }}>
        {dark && <MeshBg opacity={0.7} />}
        {!dark && <MeshBgLight opacity={0.9} />}

        {/* Titlebar */}
        <div style={{ background: p.chrome, borderBottom: `1px solid ${p.divider}`, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", paddingInline: 12, gap: 14, position: "relative", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <WindowChrome />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PrismLogo size={20} />
              <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Tessera</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 10px", background: p.chip, border: `1px solid ${p.divider}`, borderRadius: 8, fontFamily: F.mono, fontSize: 11, color: p.paneMuted, cursor: "pointer" }}>checkout-platform</button>
            <span style={{ color: p.paneMuted, fontSize: 11 }}>›</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px", background: `linear-gradient(135deg, ${T.indigoBg2}, ${T.magentaBg})`, border: `1px solid ${T.indigo}55`, borderRadius: 8, fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: dark ? T.indigoHi : T.indigo, boxShadow: `0 4px 16px ${T.indigo}25` }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: T.indigo, boxShadow: `0 0 8px ${T.indigo}` }} />
              Mosaic · Checkout
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ fontFamily: F.sans, fontSize: 11, padding: "5px 10px", background: p.chip, border: `1px solid ${p.divider}`, color: p.paneText, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: p.paneMuted, fontFamily: F.mono, fontSize: 10 }}>⌘K</span>
              <span>Search</span>
            </button>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: `linear-gradient(135deg, ${T.magenta}, ${T.violet})`, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 10, display: "grid", placeItems: "center", boxShadow: `0 4px 12px ${T.magenta}60` }}>EM</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "56px 232px 1fr 296px", overflow: "hidden", position: "relative" }}>
          <div style={{ background: p.rail, borderRight: `1px solid ${p.divider}`, paddingTop: 8, backdropFilter: "blur(10px)" }}>
            {railItems.map((it, i) => (
              <div key={it} style={{ display: "grid", placeItems: "center", height: 48, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${T.indigo}, ${T.magenta})`, borderRadius: 1, boxShadow: `0 0 8px ${T.indigo}` }} />}
                <div style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 8, color: i === 0 ? p.railActive : p.railText, background: i === 0 ? T.indigoBg : "transparent", fontSize: 15 }}>{railIcons[i]}</div>
              </div>
            ))}
          </div>

          {/* Outliner */}
          <div style={{ background: p.paneBg, borderRight: `1px solid ${p.divider}`, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Cascade</div>
              <div style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>Checkout v3</div>
            </div>
            <div style={{ padding: "8px 6px", display: "grid", gap: 2 }}>
              <CascadeRow p={p} dot={T.indigo} label="Contracts" count="4/4"  state="frozen" />
              <CascadeRow p={p} dot={T.cyan}   label="Use cases" count="7/7"  state="frozen" active />
              <CascadeRow p={p} dot={T.magenta} label="Placement" count="3/8" state="drafting" />
              <CascadeRow p={p} dot={T.textMute} label="Implementation" count="—" state="locked" />
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Views</div>
              <ViewRow p={p} icon="▦" label="Mosaic · all" active />
              <ViewRow p={p} icon="◇" label="Bounded contexts" />
              <ViewRow p={p} icon="≈" label="User flow · checkout" />
              <ViewRow p={p} icon="△" label="Class · Order" />
              <ViewRow p={p} icon="⌬" label="Agent · derivations" hint="2" />
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${p.divider}`, display: "flex", alignItems: "center", gap: 8, fontFamily: F.mono, fontSize: 10, color: p.paneMuted }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: T.lime, boxShadow: `0 0 6px ${T.lime}` }} />
              <span>cloud graph · synced</span>
            </div>
          </div>

          {/* Stage */}
          <div style={{ background: p.stage, position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, letterSpacing: "-0.022em" }}>Mosaic · Checkout</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted }}>12 nodes · 12 edges · <span style={{ color: T.coral }}>1 drift</span></div>
              </div>
              <div style={{ display: "flex", gap: 4, background: p.chip, padding: 3, borderRadius: 10, border: `1px solid ${p.divider}` }}>
                <Seg active>force</Seg><Seg>layered</Seg><Seg>radial</Seg>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, padding: "10px 18px", borderBottom: `1px solid ${p.divider}`, alignItems: "center", flexWrap: "wrap" }}>
              <PillFilter p={p} color={T.magenta} label="Aggregate" count={4} />
              <PillFilter p={p} color={T.cyan}    label="UseCase"   count={2} />
              <PillFilter p={p} color={T.indigo}  label="Contract"  count={1} />
              <PillFilter p={p} color={T.textMute} label="Module"   count={3} muted />
              <PillFilter p={p} color={T.violet}  label="Decision"  count={1} />
              <PillFilter p={p} color={dark ? T.text : T.textL}  label="Actor" count={1} muted />
              <div style={{ flex: 1 }} />
              <button style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 10px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, borderRadius: 8, cursor: "pointer" }}>⌥ filter</button>
              <button style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "5px 11px", background: T.indigoBg2, border: `1px solid ${T.indigo}55`, color: dark ? T.indigoHi : T.indigo, borderRadius: 8, cursor: "pointer" }}>compare v2 ▾</button>
            </div>
            <div style={{ position: "relative" }}>
              <PrismMosaic dark={dark} width={1100} height={680} />
              {/* hover callout near the active aggregate */}
              <div style={{ position: "absolute", right: 30, top: 380, padding: 14, background: dark ? T.surface2 : T.paper, border: `1px solid ${T.magenta}55`, borderRadius: 12, fontFamily: F.sans, fontSize: 12, color: p.paneText, boxShadow: `0 16px 48px -8px ${T.magenta}40, 0 0 0 1px ${T.line}`, minWidth: 220, backdropFilter: "blur(20px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, background: T.magenta, borderRadius: 4, boxShadow: `0 0 8px ${T.magenta}` }} />
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>aggregate</div>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 16, fontWeight: 700, marginTop: 4, letterSpacing: "-0.015em" }}>Order</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 3 }}>node:aggregate@order#7c4</div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: p.paneText, marginTop: 8, lineHeight: 1.5 }}>6 invariants · derived from Checkout v3</div>
              </div>
            </div>
          </div>

          {/* Inspector */}
          <div style={{ background: p.paneBg, borderLeft: `1px solid ${p.divider}`, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <InspectorRight p={p} dark={dark} />
          </div>
        </div>

        <div style={{ background: p.chrome, borderTop: `1px solid ${p.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 14, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.04em", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: T.lime, boxShadow: `0 0 6px ${T.lime}` }} /> graph healthy</span>
            <span>cascade · 7 frozen · <span style={{ color: T.coral }}>1 drift</span></span>
          </div>
          <span>mosaic@checkout · rev 042 · synced 12s ago</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} /> haiku-4-5 · idle</span>
        </div>
      </div>
    );
  }

  function CascadeRow({ p, dot, label, count, state, active }) {
    const sMap = { frozen: T.lime, drafting: T.amber, locked: T.textMute };
    const sBg = { frozen: T.limeBg, drafting: T.amberBg, locked: "transparent" };
    return (
      <div style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 8, background: active ? T.indigoBg : "transparent", border: active ? `1px solid ${T.indigo}40` : "1px solid transparent" }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: dot, boxShadow: active ? `0 0 8px ${dot}` : "none" }} />
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 1 }}>{count}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: sMap[state], letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: sBg[state], border: state === "locked" ? `1px dashed ${p.divider}` : "none" }}>{state}</div>
      </div>
    );
  }

  function ViewRow({ p, icon, label, active, hint }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 8, alignItems: "center", padding: "5px 8px", borderRadius: 6, background: active ? T.indigoBg : "transparent" }}>
        <span style={{ color: p.paneMuted, fontSize: 12, textAlign: "center" }}>{icon}</span>
        <span style={{ fontFamily: F.sans, fontSize: 12, color: active ? p.paneText : p.paneMuted, fontWeight: active ? 500 : 400 }}>{label}</span>
        {hint && <span style={{ fontFamily: F.mono, fontSize: 9, color: T.cyan, padding: "1px 5px", background: T.cyanBg, borderRadius: 999 }}>{hint}</span>}
      </div>
    );
  }

  function Seg({ active, children }) {
    return <div style={{ padding: "4px 10px", borderRadius: 7, fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: active ? "#fff" : "currentColor", background: active ? `linear-gradient(135deg, ${T.indigo}, ${T.violet})` : "transparent", boxShadow: active ? `0 4px 12px ${T.indigo}50` : "none", cursor: "pointer" }}>{children}</div>;
  }

  function PillFilter({ p, color, label, count, muted }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 6px", borderRadius: 999, background: p.chip, border: `1px solid ${p.divider}`, fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: p.chipFg, cursor: "pointer" }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: color, boxShadow: muted ? "none" : `0 0 6px ${color}80` }} />
        <span>{label}</span>
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: p.paneMuted }}>{count}</span>
      </div>
    );
  }

  function InspectorRight({ p, dark }) {
    return (
      <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto auto 1fr auto", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${p.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, background: T.indigo, borderRadius: 4, boxShadow: `0 0 12px ${T.indigo}` }} />
            <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Contract</div>
            <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.mono, fontSize: 9.5, padding: "3px 8px", background: T.limeBg, color: T.lime, borderRadius: 999, letterSpacing: "0.1em", border: `1px solid ${T.lime}40` }}><span style={{ width: 5, height: 5, borderRadius: 3, background: T.lime, boxShadow: `0 0 6px ${T.lime}` }} />FROZEN</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em", marginTop: 6 }}>Checkout v3</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted, marginTop: 4 }}>node:contract@checkout-v3</div>
        </div>
        <div style={{ display: "flex", padding: "0 12px", borderBottom: `1px solid ${p.divider}` }}>
          {["Schema", "Cascade", "History", "Notes"].map((t, i) => (
            <div key={t} style={{ padding: "10px 10px", fontFamily: F.sans, fontSize: 11.5, fontWeight: 500, color: i === 0 ? p.paneText : p.paneMuted, borderBottom: i === 0 ? `2px solid ${T.indigo}` : "2px solid transparent", boxShadow: i === 0 ? `0 1px 0 ${T.indigo}, 0 0 12px ${T.indigo}55` : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", overflow: "auto", fontFamily: F.mono, fontSize: 11.5, lineHeight: 1.65 }}>
          <div style={{ color: p.paneMuted }}>{"{"}</div>
          <div style={{ paddingLeft: 14 }}><Tk c={T.amber}>"name"</Tk>: <Tk c={T.lime}>"PlaceOrder"</Tk>,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={T.amber}>"in"</Tk>: <Tk c={T.cyan}>OrderRequest</Tk>,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={T.amber}>"out"</Tk>: <Tk c={T.cyan}>result&lt;OrderConfirm, Declined&gt;</Tk>,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={T.amber}>"idempotent"</Tk>: <Tk c={T.violet}>true</Tk>,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={T.amber}>"invariants"</Tk>: [</div>
          <div style={{ paddingLeft: 28, color: T.lime }}>"customer.exists",</div>
          <div style={{ paddingLeft: 28, color: T.lime }}>"cart.total &gt; 0",</div>
          <div style={{ paddingLeft: 28, color: T.lime }}>"payment.authorized",</div>
          <div style={{ paddingLeft: 28, color: T.lime }}>"…(3 more)"</div>
          <div style={{ paddingLeft: 14, color: p.paneMuted }}>]</div>
          <div style={{ color: p.paneMuted }}>{"}"}</div>
          <div style={{ marginTop: 16, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Derives</div>
          <div style={{ marginTop: 8 }}>
            <DerivePill color={T.cyan} text="PlaceOrder · UseCase" />
            <DerivePill color={T.magenta} text="Order · Aggregate" />
            <DerivePill color={T.coral} text="Payment · drift" warn />
          </div>
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${p.divider}`, display: "grid", gap: 6 }}>
          <button style={{ padding: "10px 14px", border: "none", background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`, color: "#fff", fontFamily: F.sans, fontSize: 12.5, fontWeight: 600, borderRadius: 10, cursor: "pointer", boxShadow: `0 8px 24px -4px ${T.indigo}80, 0 0 0 1px ${T.indigo}40` }}>Re-derive downstream</button>
          <button style={{ padding: "10px 14px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, fontFamily: F.sans, fontSize: 12, fontWeight: 500, borderRadius: 10, cursor: "pointer" }}>Edit schema</button>
        </div>
      </div>
    );
  }

  function Tk({ c, children }) {
    return <span style={{ color: c }}>{children}</span>;
  }

  function DerivePill({ color, text, warn }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 4, background: warn ? T.coralBg : "rgba(255,255,255,0.03)", borderRadius: 8, fontFamily: F.sans, fontSize: 12, border: `1px solid ${warn ? T.coral + "50" : "transparent"}` }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: color, boxShadow: warn ? "none" : `0 0 6px ${color}80` }} />
        <span style={{ color: warn ? T.coral : "inherit" }}>{text}</span>
      </div>
    );
  }

  function ShellDark()  { return <Shell dark />; }
  function ShellLight() { return <Shell />;     }

  // ═══════════════════════════════════════════════════════════════════════
  // INSPECTOR + DIFF
  // ═══════════════════════════════════════════════════════════════════════

  function InspectorDiff() {
    const p = { paneMuted: T.textMute, paneText: T.text, divider: T.line, chip: T.surface1 };
    return (
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden", position: "relative" }}>
        <MeshBg opacity={0.6} />
        <div style={{ padding: "24px 32px 16px", borderBottom: `1px solid ${T.line}`, position: "relative" }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.indigoHi, letterSpacing: "0.18em", marginBottom: 6 }}>INSPECTOR & GRAPH DIFF · PRISM</div>
          <div style={{ fontFamily: F.sans, fontSize: 38, fontWeight: 700, letterSpacing: "-0.028em", background: `linear-gradient(120deg, #ffffff, ${T.indigoHi})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Review at the altitude where it's still cheap.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden", position: "relative" }}>
          {/* Inspector */}
          <div style={{ borderRight: `1px solid ${T.line}`, background: "rgba(255,255,255,0.025)", padding: "20px 22px", overflow: "auto", backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 16, height: 16, background: T.indigo, borderRadius: 4, boxShadow: `0 0 18px ${T.indigo}` }} />
              <div style={{ fontFamily: F.sans, fontSize: 24, fontWeight: 700, letterSpacing: "-0.022em" }}>Checkout v3</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, padding: "3px 8px", background: T.limeBg, color: T.lime, borderRadius: 999, letterSpacing: "0.1em", border: `1px solid ${T.lime}40` }}>FROZEN</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 6 }}>node:contract@checkout-v3 · rev 042 · 14s ago</div>

            <Subsec title="Schema">
              <PropRow k="name" v={<span style={{ color: T.lime, fontFamily: F.mono }}>"PlaceOrder"</span>} />
              <PropRow k="in"   v={<span style={{ color: T.cyan, fontFamily: F.mono }}>OrderRequest</span>} />
              <PropRow k="out"  v={<span style={{ color: T.cyan, fontFamily: F.mono }}>result&lt;…&gt;</span>} />
              <PropRow k="invariants" v={<span style={{ fontFamily: F.mono }}>6</span>} />
              <PropRow k="idempotent" v={<span style={{ color: T.violet, fontFamily: F.mono }}>true</span>} />
            </Subsec>

            <Subsec title="Derives downstream">
              <DerivePill color={T.cyan} text="PlaceOrder · UseCase" />
              <DerivePill color={T.magenta} text="Order · Aggregate" />
              <DerivePill color={T.coral} text="Payment · drift detected" warn />
              <DerivePill color={T.textMute} text="OrderRepo.save · Module · locked" />
            </Subsec>

            <Subsec title="Annotations · 3">
              <AnnoCard hue={T.indigo} who="Emma" text="Idempotency-key should be required, not optional. Refunds depend on it." when="2m ago" />
              <AnnoCard hue={T.violet} who="Rao"  text="ADR-031 supersedes the synchronous model — link this contract back." when="38m ago" />
              <AnnoCard hue={T.cyan}   who="Claude" agent text="Detected 1 downstream stale node: Payment. Re-run placement?" when="1h ago" />
            </Subsec>
          </div>

          {/* Diff */}
          <div style={{ padding: "20px 28px", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>checkout-v2 → v3</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 4 }}>+3 nodes · −1 node · ~4 edges · 2 contracts changed</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <DiffPill color={T.lime}    bg={T.limeBg}  label="+3 added" />
                <DiffPill color={T.coral}   bg={T.coralBg} label="−1 removed" />
                <DiffPill color={T.amber}   bg={T.amberBg} label="~4 changed" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, background: T.surface1, padding: 3, borderRadius: 10, border: `1px solid ${T.line}`, width: "fit-content" }}>
              <Seg active>side-by-side</Seg><Seg>overlay</Seg><Seg>only changes</Seg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, overflow: "hidden" }}>
              <DiffMini label="Before · v2" rev="rev 041 · frozen" before />
              <DiffMini label="After · v3"  rev="rev 042 · current" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <ChangeRow kind="add"    text="Fraud Check · UseCase" meta="cascades into Payment" />
              <ChangeRow kind="add"    text="ADR-031 · Decision" meta="async payments" />
              <ChangeRow kind="add"    text="StripeGateway · Module" meta="replaces in-house gateway" />
              <ChangeRow kind="remove" text="Payment.sync_charge" meta="superseded by ADR-031" />
              <ChangeRow kind="change" text="Order.invariants" meta="6 → 7 (idempotency)" />
              <ChangeRow kind="change" text="Customer ⟶ Order edge" meta="now via Cart" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Subsec({ title, children }) {
    return (
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.indigoHi, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <span>{title}</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>
        {children}
      </div>
    );
  }

  function PropRow({ k, v }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</div>
        <div style={{ fontFamily: F.sans, fontSize: 12 }}>{v}</div>
      </div>
    );
  }

  function AnnoCard({ hue, who, text, when, agent }) {
    return (
      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.line}`, padding: "10px 12px", borderRadius: 10, marginBottom: 8, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: hue, boxShadow: `0 0 12px ${hue}` }} />
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 6 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: hue, letterSpacing: "0.1em" }}>{agent ? "⌬ " : ""}{who}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{when}</div>
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, marginTop: 5, lineHeight: 1.5, paddingLeft: 6 }}>{text}</div>
      </div>
    );
  }

  function DiffPill({ color, bg, label }) {
    return <div style={{ padding: "3px 10px", borderRadius: 999, background: bg, color, fontFamily: F.mono, fontSize: 10.5, fontWeight: 600, border: `1px solid ${color}40`, letterSpacing: "0.04em" }}>{label}</div>;
  }

  function DiffMini({ label, rev, before }) {
    return (
      <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.line}`, borderRadius: 12, padding: 14, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{rev}</div>
        </div>
        <PrismMiniMosaic before={before} dark />
      </div>
    );
  }

  function ChangeRow({ kind, text, meta }) {
    const c = kind === "add" ? T.lime : kind === "remove" ? T.coral : T.amber;
    const bg = kind === "add" ? T.limeBg : kind === "remove" ? T.coralBg : T.amberBg;
    const g = kind === "add" ? "+" : kind === "remove" ? "−" : "~";
    return (
      <div style={{ background: bg, border: `1px solid ${c}40`, padding: "10px 12px", borderRadius: 10, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: c, boxShadow: `0 0 8px ${c}` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
          <div style={{ width: 14, color: c, fontFamily: F.mono, fontSize: 14, fontWeight: 700, textAlign: "center" }}>{g}</div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500 }}>{text}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textDim, marginLeft: 28, marginTop: 2, paddingLeft: 6 }}>{meta}</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPONENTS & STATES
  // ═══════════════════════════════════════════════════════════════════════

  function Components() {
    const p = { paneMuted: T.textMute, paneText: T.text, divider: T.line, chip: T.surface1 };
    return (
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, padding: "28px 32px", boxSizing: "border-box", overflow: "hidden", position: "relative" }}>
        <MeshBg opacity={0.6} />
        <div style={{ marginBottom: 24, position: "relative" }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.indigoHi, letterSpacing: "0.18em" }}>COMPONENTS & STATES · PRISM</div>
          <div style={{ fontFamily: F.sans, fontSize: 36, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 4 }}>The boring & critical set.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, position: "relative" }}>
          <Card title="Buttons">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn primary>Freeze contracts</Btn>
                <Btn>Secondary</Btn>
                <Btn ghost>Ghost</Btn>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn danger>Discard</Btn>
                <Btn disabled>Disabled</Btn>
                <Btn primary><span>Freezing</span><Spinner /></Btn>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn size="sm">Small</Btn>
                <Btn size="lg">Large</Btn>
                <Btn primary icon>Glyph</Btn>
              </div>
              <div style={{ display: "flex", gap: 4, background: T.surface1, padding: 3, borderRadius: 10, border: `1px solid ${T.line}`, alignSelf: "start" }}>
                <Seg active>force</Seg><Seg>layered</Seg><Seg>radial</Seg>
              </div>
            </div>
          </Card>

          <Card title="Inputs">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Project name">
                <input value="checkout-platform" readOnly style={inputStyle()} />
              </Field>
              <Field label="Filter mosaic">
                <div style={{ position: "relative" }}>
                  <input placeholder="type :contract or @order…" style={{ ...inputStyle(), paddingLeft: 32, boxShadow: `0 0 0 1px ${T.indigo}` }} />
                  <div style={{ position: "absolute", left: 12, top: 9, color: T.indigoHi, fontFamily: F.mono, fontSize: 12 }}>/</div>
                  <div style={{ position: "absolute", right: 10, top: 7, fontFamily: F.mono, fontSize: 10, color: T.textMute, padding: "2px 6px", background: T.surface2, borderRadius: 4 }}>⌘F</div>
                </div>
              </Field>
              <Field label="Bounded context">
                <select style={inputStyle()}><option>Sales</option></select>
              </Field>
              <Field label="Notes" hint="markdown supported">
                <textarea rows="2" style={{ ...inputStyle(), fontFamily: F.body, resize: "none", lineHeight: 1.5 }} defaultValue="Refunds belong on the same contract — see ADR-031."></textarea>
              </Field>
              <div style={{ display: "flex", gap: 14 }}>
                <Check label="Required" checked />
                <Check label="Idempotent" checked />
                <Check label="Locked" />
              </div>
            </div>
          </Card>

          <Card title="Menus">
            <div style={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 12, padding: 5, boxShadow: `0 16px 48px -8px rgba(0,0,0,0.6), 0 0 0 1px ${T.line}`, backdropFilter: "blur(20px)" }}>
              <MenuRow label="Freeze contracts" kbd="⌘⇧F" />
              <MenuRow label="Mark as drift"    kbd="⌘D" />
              <MenuRow label="Open in Mosaic"   kbd="↵" />
              <MenuRow label="Compare with v2"  kbd="⌘V" />
              <div style={{ height: 1, background: T.line, margin: "4px 0" }} />
              <MenuRow label="Delete node"      kbd="⌫" danger />
            </div>
            <div style={{ marginTop: 16, background: T.surface0, border: `1px solid ${T.lineHi}`, borderRadius: 14, overflow: "hidden", boxShadow: `0 30px 80px -20px ${T.indigo}50, 0 0 0 1px ${T.indigo}25` }}>
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.line}`, background: `linear-gradient(180deg, ${T.indigoBg}, transparent)` }}>
                <span style={{ color: T.indigoHi, fontFamily: F.mono }}>›</span>
                <span style={{ fontFamily: F.mono, fontSize: 13 }}>derive use-cases from</span>
                <span style={{ width: 2, height: 13, background: T.indigo, boxShadow: `0 0 8px ${T.indigo}`, animation: "blink 1s steps(2) infinite" }} />
                <div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 10, color: T.textMute }}>↑↓ ⏎</div>
              </div>
              <PaletteRow icon="◆" type="contract" label="Checkout v3" sub="frozen · 2 use cases" hot />
              <PaletteRow icon="◆" type="contract" label="Refund v1"   sub="frozen" />
              <PaletteRow icon="✦" type="decision" label="ADR-031 · Async pay" />
              <PaletteRow icon="▦" type="action"   label="ALL contracts" sub="freeze and re-derive · ⌘⏎" />
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 24, position: "relative" }}>
          <Card title="Empty · no mosaic">
            <StateBox>
              <PrismLogo size={64} />
              <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 18 }}>No mosaic yet.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDim, marginTop: 6, maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Point Tessera at a project directory and watch the first tiles snap into place.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Btn primary>Index a project</Btn>
                <Btn ghost>Open existing</Btn>
              </div>
            </StateBox>
          </Card>
          <Card title="Loading · indexing">
            <StateBox>
              <BuildingTiles />
              <div style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 600, marginTop: 14, letterSpacing: "-0.015em" }}>Laying tiles…</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 4 }}>parsed 412 / 1240 · 7 modules · 2 contexts</div>
              <div style={{ width: "75%", height: 4, background: "rgba(255,255,255,0.06)", marginTop: 16, borderRadius: 2, overflow: "hidden", position: "relative" }}>
                <div style={{ width: "33%", height: "100%", background: `linear-gradient(90deg, ${T.indigo}, ${T.magenta})`, borderRadius: 2, boxShadow: `0 0 16px ${T.indigo}90` }} />
              </div>
            </StateBox>
          </Card>
          <Card title="Error · drift detected">
            <StateBox>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: T.coralBg, border: `1px solid ${T.coral}`, color: T.coral, display: "grid", placeItems: "center", fontFamily: F.sans, fontSize: 28, fontWeight: 700, boxShadow: `0 0 32px ${T.coral}55` }}>!</div>
              <div style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 600, marginTop: 14, letterSpacing: "-0.015em" }}>Payment drifted from its contract.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDim, marginTop: 6, maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>
                StripeGateway diverged from <span style={{ fontFamily: F.mono, color: T.text }}>Checkout v3</span> at <span style={{ fontFamily: F.mono, color: T.text }}>process_charge()</span>.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Btn primary>Re-derive</Btn>
                <Btn danger>Accept drift</Btn>
              </div>
            </StateBox>
          </Card>
        </div>
        <style>{`@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  function Card({ title, children }) {
    return (
      <div>
        <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.indigoHi, marginBottom: 12 }}>{title}</div>
        {children}
      </div>
    );
  }

  function Btn({ children, primary, ghost, danger, disabled, size, icon }) {
    let s = { padding: size === "lg" ? "10px 18px" : size === "sm" ? "5px 11px" : "8px 14px", fontFamily: F.sans, fontSize: size === "lg" ? 13 : size === "sm" ? 11 : 12, fontWeight: 600, borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${T.line}`, background: "rgba(255,255,255,0.04)", color: T.text, transition: "all 0.15s" };
    if (primary) s = { ...s, background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`, color: "#fff", border: `1px solid ${T.indigoHi}`, fontWeight: 600, boxShadow: `0 6px 20px -4px ${T.indigo}90, 0 0 0 1px ${T.indigo}30 inset` };
    if (ghost)   s = { ...s, background: "transparent", border: "1px solid transparent", color: T.textDim };
    if (danger)  s = { ...s, background: T.coralBg, border: `1px solid ${T.coral}55`, color: T.coral };
    if (disabled) s = { ...s, opacity: 0.4, cursor: "not-allowed" };
    return <button style={s}>{icon && <span style={{ color: primary ? "#fff" : T.indigoHi }}>✦</span>}{children}</button>;
  }

  function Field({ label, hint, children }) {
    return (
      <label style={{ display: "grid", gap: 5 }}>
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
          {hint && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute }}>{hint}</span>}
        </span>
        {children}
      </label>
    );
  }

  function inputStyle() {
    return { width: "100%", padding: "8px 11px", border: `1px solid ${T.line}`, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontFamily: F.mono, fontSize: 12, color: T.text, outline: "none", boxSizing: "border-box" };
  }

  function Check({ label, checked }) {
    return (
      <label style={{ display: "flex", gap: 7, alignItems: "center", cursor: "pointer", fontFamily: F.sans, fontSize: 12 }}>
        <span style={{ width: 16, height: 16, border: `1.5px solid ${checked ? T.indigo : T.lineHi}`, background: checked ? T.indigo : "transparent", borderRadius: 4, display: "grid", placeItems: "center", color: "#fff", fontSize: 10, boxShadow: checked ? `0 0 8px ${T.indigo}66` : "none" }}>{checked && "✓"}</span>
        {label}
      </label>
    );
  }

  function MenuRow({ label, kbd, danger }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "7px 10px", borderRadius: 6, color: danger ? T.coral : T.text, cursor: "pointer" }}>
        <span style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{kbd}</span>
      </div>
    );
  }

  function PaletteRow({ icon, type, label, sub, hot }) {
    const color = { contract: T.indigo, decision: T.violet, action: T.magenta }[type] || T.textMute;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.line}`, background: hot ? T.indigoBg : "transparent", borderLeft: hot ? `2px solid ${T.indigo}` : "2px solid transparent" }}>
        <div style={{ width: 24, height: 24, background: color, color: type === "decision" ? "#fff" : "#fff", fontFamily: F.sans, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", borderRadius: 6, boxShadow: hot ? `0 4px 12px ${color}80` : "none" }}>{icon}</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, color: T.text }}>{label}</div>
          {sub && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: T.textMute, letterSpacing: "0.08em", textTransform: "uppercase" }}>:{type}</div>
      </div>
    );
  }

  function StateBox({ children }) {
    return (
      <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${T.line}`, borderRadius: 14, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: 320, position: "relative", overflow: "hidden", backdropFilter: "blur(20px)" }}>
        {children}
      </div>
    );
  }

  function BuildingTiles() {
    return (
      <svg width="200" height="80" viewBox="0 0 200 80">
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i % 10) * 20 + 1;
          const y = Math.floor(i / 10) * 38 + 1;
          const filled = i < 13;
          const c = [T.indigo, T.cyan, T.magenta, T.violet, T.lime][i % 5];
          return <rect key={i} x={x} y={y} width={18} height={36} rx="4" fill={filled ? c : "rgba(255,255,255,0.06)"} opacity={filled ? (1 - i * 0.04) : 1} filter={filled ? `drop-shadow(0 4px 10px ${c}80)` : undefined} />;
        })}
      </svg>
    );
  }

  function Spinner() {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="14 28" strokeLinecap="round" />
      </svg>
    );
  }

  window.Prism = { Foundations, ShellDark, ShellLight, InspectorDiff, Components };
})();
