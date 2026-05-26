// identity/studio.jsx — Direction C: Studio
// High-contrast near-monochrome with one electric accent (lime) plus a
// punch hue (magenta) reserved for danger/decision. Cursor / Arc / Geist
// register. Confident, dense, opinionated, fast.

(function () {
  const T = {
    // dark: true black
    bg:       "#000000",
    bgWarm:   "#050505",
    surface0: "#0a0a0b",
    surface1: "#111114",
    surface2: "#191920",
    surface3: "#22232c",
    line:     "#2a2b35",
    lineHi:   "#3a3b48",
    lineSoft: "rgba(255,255,255,0.08)",
    // dark text
    text:    "#ffffff",
    text90:  "#e8e8ec",
    textDim: "rgba(255,255,255,0.66)",
    textMute:"rgba(255,255,255,0.40)",
    textFade:"rgba(255,255,255,0.20)",
    // light: true white
    paper:    "#ffffff",
    paperLo:  "#fafafa",
    paperDim: "#f3f3f5",
    paperLine:"#e3e3e8",
    paperLineHi:"#d4d4dc",
    // light text
    textL:    "#000000",
    textDimL: "rgba(0,0,0,0.66)",
    textMuteL:"rgba(0,0,0,0.42)",
    textFadeL:"rgba(0,0,0,0.18)",
    // hero accent — electric lime
    lime:    "#c4f53e",
    limeDim: "#a5d12d",
    limeBg:  "rgba(196,245,62,0.14)",
    limeBg2: "rgba(196,245,62,0.24)",
    // counter — hot magenta for danger / decision pin
    pink:    "#ff3e7f",
    pinkBg:  "rgba(255,62,127,0.14)",
    // soft state hues
    amber:   "#fbbf24",
    amberBg: "rgba(251,191,36,0.16)",
    // node tone scale (dark mode)
    n900:  "#f5f5f7", // brightest tile
    n700:  "#c8c8d0",
    n500:  "#7e7e88",
    n300:  "#3f404a",
    n100:  "#1d1d24",
    // node tone scale (light mode)
    l900: "#000000",
    l700: "#3e3e44",
    l500: "#9a9aa2",
    l300: "#cdcdd2",
    l100: "#ededf0",
  };

  const F = {
    sans: '"Inter Tight", "Geist", system-ui, sans-serif',
    body: '"Inter", "Geist", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Geist Mono", "SF Mono", Menlo, monospace',
  };

  const graphDark = {
    bg: T.bg,
    edge: T.text90,
    edgeMuted: T.n300,
    edgeLabelBg: T.surface2,
    edgeLabelFg: T.textDim,
    grout: T.surface0,
    groutOpacity: 1,
    selection: T.lime,
    frozen: T.lime,
    drift: T.pink,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.n900, stroke: "rgba(0,0,0,0.4)", text: "#000",     shape: "tile" },
      useCase:   { fill: T.n700, stroke: "rgba(0,0,0,0.4)", text: "#000",     shape: "tile" },
      aggregate: { fill: T.n500, stroke: "rgba(0,0,0,0.3)", text: "#fff",     shape: "tile" },
      module:    { fill: "transparent", stroke: T.n500,     text: T.textDim,  shape: "rounded" },
      decision:  { fill: T.pink, stroke: "#fff",            text: "#fff",     shape: "marker" },
      actor:     { fill: T.bg,   stroke: T.n700,            text: T.text,     shape: "circle" },
    },
  };

  const graphLight = {
    bg: T.paper,
    edge: T.textL,
    edgeMuted: T.l500,
    edgeLabelBg: T.paperLo,
    edgeLabelFg: T.textDimL,
    grout: T.paperDim,
    groutOpacity: 1,
    selection: T.limeDim,
    frozen: T.limeDim,
    drift: T.pink,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.l900, stroke: T.l900, text: "#fff",     shape: "tile" },
      useCase:   { fill: T.l700, stroke: T.l700, text: "#fff",     shape: "tile" },
      aggregate: { fill: T.l500, stroke: T.l700, text: "#fff",     shape: "tile" },
      module:    { fill: "transparent", stroke: T.l500, text: T.textDimL, shape: "rounded" },
      decision:  { fill: T.pink, stroke: T.l900, text: "#fff",     shape: "marker" },
      actor:     { fill: T.paper, stroke: T.l900, text: T.l900,    shape: "circle" },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════
  // FOUNDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  function Foundations() {
    return (
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, padding: 40, position: "relative", overflow: "hidden", boxSizing: "border-box" }}>
        {/* faint diagonal grid */}
        <DiagonalGrid color="rgba(255,255,255,0.025)" />

        <div style={{ position: "relative" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", border: `1px solid ${T.lime}`, color: T.lime, borderRadius: 0, fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 18 }}>
                <span style={{ width: 6, height: 6, background: T.lime }} />
                Direction C · Studio
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 80, fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.045em", maxWidth: 1000 }}>
                <div>Architectural<br/>control.</div>
                <div style={{ color: T.lime }}>At velocity.</div>
              </div>
              <div style={{ fontFamily: F.body, fontSize: 16, color: T.textDim, marginTop: 18, maxWidth: 660, lineHeight: 1.5 }}>
                No ornament. No noise. Black, white, and one bright signal. The graph is the protagonist; everything else gets out of the way.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <StudioLogo size={44} />
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, marginTop: 8, letterSpacing: "0.1em" }}>TESSERA · v0.1</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>2026.05</div>
            </div>
          </div>

          {/* The accent in context */}
          <div style={{ marginBottom: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "stretch" }}>
            <div style={{ background: T.lime, color: "#000", padding: "20px 22px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
              <div style={{ fontFamily: F.sans, fontSize: 76, fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.045em" }}>1</div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>One accent · ONE meaning</div>
                <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>Lime is always: <em>this is yours, this is now, this is selected, this is frozen.</em> Never decorative.</div>
              </div>
            </div>
            <div style={{ background: T.pink, color: "#fff", padding: "20px 22px", display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center" }}>
              <div style={{ fontFamily: F.sans, fontSize: 76, fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.045em" }}>!</div>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>One punch · ONE warning</div>
                <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 500, marginTop: 4, lineHeight: 1.4 }}>Magenta is always: <em>drift, danger, decision-pin.</em> If you see it, look twice.</div>
              </div>
            </div>
          </div>

          {/* Tone scale */}
          <Sec title="Tone scale · the only palette">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 4 }}>
              <ToneSwatch color="#000000" label="000" dark />
              <ToneSwatch color={T.surface0} label="020" dark />
              <ToneSwatch color={T.surface1} label="040" dark />
              <ToneSwatch color={T.surface2} label="080" dark />
              <ToneSwatch color={T.surface3} label="120" dark />
              <ToneSwatch color={T.line} label="180" dark />
              <ToneSwatch color={T.n300} label="300" dark />
              <ToneSwatch color={T.n500} label="500" dark />
              <ToneSwatch color={T.n700} label="700" dark />
              <ToneSwatch color={T.text90} label="900" dark />
              <ToneSwatch color="#ffffff" label="999" dark />
            </div>
          </Sec>

          {/* Accents */}
          <Sec title="Accent · the only colors">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <AccentBig color={T.lime} label="Electric lime" value="#c4f53e" use="selected · frozen · primary CTA · active rail" dark />
              <AccentBig color={T.pink} label="Hot magenta" value="#ff3e7f" use="drift · danger · decision pin" dark />
            </div>
          </Sec>

          {/* Type & legend */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32, marginTop: 8 }}>
            <div>
              <Sec title="Typography">
                <TypeRow weight={800} size={56} spec="Tessera" sub="Display · 800 · -4.5% · hero" />
                <TypeRow weight={700} size={32} spec="Cascade · Use cases · Contracts" sub="Heading · 700 · -3%" />
                <TypeRow weight={500} size={14} font={F.body} spec="A contract is the frozen promise between layers. Implementations descend from it." sub="Body · 500 · 1.5 lh · Inter" />
                <TypeRow weight={600} size={12} spec="FREEZE CONTRACTS · RE-DERIVE · OPEN MOSAIC" sub="UI · 600 · 10% tracking · UPPER" upper />
                <TypeRow weight={400} size={13} font={F.mono} spec="node:contract@checkout-v3#a1b" sub="Mono · 400 · IDs · code · diff" />
              </Sec>
            </div>
            <div>
              <Sec title="Node legend · shape > color">
                <NodeLegend />
              </Sec>
              <Sec title="Density · radii · motion" top>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
                  {[0, 2, 4, 8, 999].map((r, i) => (
                    <div key={i} style={{ display: "grid", gap: 4, justifyItems: "center" }}>
                      <div style={{ width: 52, height: 32, background: T.n900, borderRadius: r === 999 ? 999 : r }} />
                      <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{["sharp", "2", "4", "8", "full"][i]}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textDim, lineHeight: 1.85 }}>
                  <div>spring · stiff <span style={{ color: T.textMute }}>k=400 d=30 · for tiles snapping</span></div>
                  <div>spring · soft <span style={{ color: T.textMute }}>k=180 d=22 · for panels</span></div>
                  <div>linear · 120ms <span style={{ color: T.textMute }}>· for hover state changes</span></div>
                </div>
              </Sec>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function DiagonalGrid({ color }) {
    return (
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <defs>
          <pattern id="sd-diag" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 0 14 L 14 0" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sd-diag)" />
      </svg>
    );
  }

  function Sec({ title, top, children }) {
    return (
      <div style={{ marginTop: top ? 22 : 0, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: T.lime, fontWeight: 600 }}>{title}</div>
          <div style={{ flex: 1, height: 1, background: T.lineSoft }} />
        </div>
        {children}
      </div>
    );
  }

  function ToneSwatch({ color, label, dark }) {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ width: "100%", height: 64, background: color, border: `1px solid ${dark ? T.line : T.paperLine}` }} />
        <div style={{ fontFamily: F.mono, fontSize: 9.5, color: dark ? T.textMute : T.textMuteL, letterSpacing: "0.04em" }}>{label}</div>
      </div>
    );
  }

  function AccentBig({ color, label, value, use, dark }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, height: 110 }}>
        <div style={{ background: color }} />
        <div style={{ background: dark ? T.surface1 : T.paperLo, border: `1px solid ${dark ? T.line : T.paperLine}`, padding: "14px 16px", display: "grid", alignContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 700 }}>{label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: dark ? T.textMute : T.textMuteL }}>{value}</div>
            </div>
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: dark ? T.textDim : T.textDimL, marginTop: 6, lineHeight: 1.4 }}>{use}</div>
          </div>
        </div>
      </div>
    );
  }

  function TypeRow({ weight, size, font, spec, sub, upper }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", alignItems: "baseline", gap: 24, paddingBlock: 14, borderTop: `1px solid ${T.lineSoft}` }}>
        <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.textMute, letterSpacing: "0.08em" }}>{sub}</div>
        <div style={{ fontFamily: font || F.sans, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: weight >= 700 ? "-0.03em" : weight >= 600 ? "-0.012em" : "0", textTransform: upper ? "uppercase" : "none", color: T.text }}>{spec}</div>
      </div>
    );
  }

  function NodeLegend() {
    const items = [
      { type: "contract",  label: "Contract",  fill: T.n900, shape: "tile" },
      { type: "useCase",   label: "Use case",  fill: T.n700, shape: "tile" },
      { type: "aggregate", label: "Aggregate", fill: T.n500, shape: "tile" },
      { type: "module",    label: "Module",    fill: "transparent", stroke: T.n500, shape: "rounded" },
      { type: "decision",  label: "Decision",  fill: T.pink, shape: "marker" },
      { type: "actor",     label: "Actor",     fill: "transparent", stroke: T.n700, shape: "circle" },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {items.map(it => (
          <div key={it.type} style={{ background: T.surface1, border: `1px solid ${T.line}`, padding: 12 }}>
            <svg width="100%" height="44" viewBox="0 0 120 44">
              <g transform="translate(60,22)">
                {it.shape === "tile" && <rect x="-16" y="-16" width="32" height="32" rx="2" fill={it.fill} />}
                {it.shape === "rounded" && <rect x="-24" y="-11" width="48" height="22" rx="11" fill={it.fill} stroke={it.stroke} strokeWidth="1.2" />}
                {it.shape === "marker" && (
                  <g transform="rotate(45)">
                    <rect x="-12" y="-12" width="24" height="24" rx="2" fill={it.fill} />
                  </g>
                )}
                {it.shape === "circle" && <circle r="14" fill={it.fill} stroke={it.stroke} strokeWidth="1.2" />}
              </g>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 3 }}>
              <div style={{ fontFamily: F.sans, fontSize: 11.5, fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute }}>:{it.type}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function StudioLogo({ size = 36 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <rect x="2"  y="2"  width="14" height="14" fill={T.text} />
        <rect x="20" y="2"  width="14" height="14" fill={T.lime} />
        <rect x="2"  y="20" width="14" height="14" fill={T.text} />
        <rect x="20" y="20" width="14" height="14" fill={T.text} />
      </svg>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // APP SHELL
  // ═══════════════════════════════════════════════════════════════════════

  function Shell({ dark }) {
    const p = dark
      ? { bg: T.bg, rail: T.bg, railText: T.textMute, railActive: T.text,
          chrome: T.bg, divider: T.line, paneBg: T.bg, paneText: T.text, paneMuted: T.textMute,
          stage: T.bg, chip: T.surface1, chipFg: T.text }
      : { bg: T.paper, rail: T.paper, railText: T.textMuteL, railActive: T.textL,
          chrome: T.paper, divider: T.paperLine, paneBg: T.paper, paneText: T.textL, paneMuted: T.textMuteL,
          stage: T.paper, chip: T.paperLo, chipFg: T.textL };

    const railItems = ["mosaic", "cascade", "contracts", "domain", "agents", "history", "settings"];
    const railIcons = ["▦", "≡", "◇", "◐", "◬", "◷", "✦"];

    return (
      <div style={{ height: "100%", width: "100%", background: p.bg, fontFamily: F.sans, color: p.paneText, display: "grid", gridTemplateRows: "40px 1fr 24px", overflow: "hidden" }}>
        {/* Titlebar */}
        <div style={{ background: p.chrome, borderBottom: `1px solid ${p.divider}`, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", paddingInline: 12, gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <WindowChrome />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StudioLogo size={18} />
              <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 800, letterSpacing: "-0.025em" }}>TESSERA</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center" }}>
            <Crumb p={p}>checkout-platform</Crumb>
            <Slash p={p} />
            <Crumb p={p}>main</Crumb>
            <Slash p={p} />
            <Crumb p={p} active>Mosaic · Checkout</Crumb>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ fontFamily: F.mono, fontSize: 11, padding: "4px 10px", background: p.chip, border: `1px solid ${p.divider}`, color: p.paneMuted, borderRadius: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⌘K</span><span style={{ color: p.paneText, fontFamily: F.sans }}>search</span>
            </button>
            <div style={{ width: 22, height: 22, background: T.lime, color: "#000", fontFamily: F.sans, fontWeight: 800, fontSize: 10, display: "grid", placeItems: "center", borderRadius: 0 }}>EM</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "52px 232px 1fr 296px", overflow: "hidden" }}>
          {/* Rail */}
          <div style={{ background: p.rail, borderRight: `1px solid ${p.divider}` }}>
            {railItems.map((it, i) => (
              <div key={it} style={{ display: "grid", placeItems: "center", height: 48, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.lime }} />}
                <div style={{ width: 30, height: 30, display: "grid", placeItems: "center", color: i === 0 ? p.railActive : p.railText, background: i === 0 ? (dark ? T.surface1 : T.paperDim) : "transparent", fontSize: 15 }}>{railIcons[i]}</div>
              </div>
            ))}
          </div>

          {/* Outliner */}
          <div style={{ background: p.paneBg, borderRight: `1px solid ${p.divider}`, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto" }}>
            <div style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.18em", textTransform: "uppercase" }}>Cascade</div>
              <div style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 700, letterSpacing: "-0.022em", marginTop: 4 }}>Checkout v3</div>
            </div>
            <div style={{ display: "grid" }}>
              <CascadeRow p={p} num="01" label="Contracts"      count="4 of 4" state="frozen"   dark={dark} />
              <CascadeRow p={p} num="02" label="Use cases"      count="7 of 7" state="frozen"   dark={dark} active />
              <CascadeRow p={p} num="03" label="Placement"      count="3 of 8" state="drafting" dark={dark} />
              <CascadeRow p={p} num="04" label="Implementation" count="—"      state="locked"   dark={dark} />
            </div>
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>Views</div>
              <ViewRow p={p} icon="▦" label="Mosaic · all" active />
              <ViewRow p={p} icon="◇" label="Bounded contexts" />
              <ViewRow p={p} icon="≈" label="User flow · checkout" />
              <ViewRow p={p} icon="△" label="Class · Order" />
              <ViewRow p={p} icon="⌬" label="Agent · derivations" hint="2" />
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${p.divider}`, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, background: T.lime }} />
              <span>cloud · synced</span>
            </div>
          </div>

          {/* Stage */}
          <div style={{ background: p.stage, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 700, letterSpacing: "-0.028em" }}>Checkout · Mosaic</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted }}>12 nodes · 12 edges · <span style={{ color: T.pink }}>1 drift</span></div>
              </div>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${p.divider}` }}>
                <Tab active>FORCE</Tab>
                <Tab>LAYERED</Tab>
                <Tab>RADIAL</Tab>
              </div>
            </div>
            <div style={{ display: "flex", gap: 0, padding: "10px 18px", borderBottom: `1px solid ${p.divider}`, alignItems: "center", flexWrap: "wrap" }}>
              <FilterChip p={p} tone={dark ? T.n500 : T.l500} label="AGGREGATE" count="4" />
              <FilterChip p={p} tone={dark ? T.n700 : T.l700} label="USECASE"   count="2" />
              <FilterChip p={p} tone={dark ? T.n900 : T.l900} label="CONTRACT"  count="1" />
              <FilterChip p={p} tone="transparent" outline={dark ? T.n500 : T.l500} label="MODULE" count="3" />
              <FilterChip p={p} tone={T.pink} label="DECISION" count="1" />
              <FilterChip p={p} tone="transparent" outline={dark ? T.n700 : T.l700} label="ACTOR" count="1" />
              <div style={{ flex: 1 }} />
              <button style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 600, padding: "5px 10px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>⌥ FILTER</button>
              <button style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, padding: "5px 11px", background: T.lime, border: `1px solid ${T.lime}`, color: "#000", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", marginLeft: 6 }}>COMPARE v2</button>
            </div>
            <div style={{ position: "relative" }}>
              <MosaicGraph theme={dark ? graphDark : graphLight} width={1100} height={680} font={F.sans} />
              {/* sharp tooltip */}
              <div style={{ position: "absolute", left: 720, top: 200, padding: 0, background: p.stage, border: `1px solid ${T.lime}`, borderRadius: 0, fontFamily: F.sans, fontSize: 12, color: p.paneText, minWidth: 240 }}>
                <div style={{ background: T.lime, color: "#000", padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>AGGREGATE</div>
                  <div style={{ fontFamily: F.mono, fontSize: 9.5, fontWeight: 600 }}>SELECTED</div>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Order</div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 3 }}>node:aggregate@order#7c4</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>6 invariants · derived from Checkout v3</div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector */}
          <div style={{ background: p.paneBg, borderLeft: `1px solid ${p.divider}`, overflow: "hidden" }}>
            <InspectorRight p={p} dark={dark} />
          </div>
        </div>

        <div style={{ background: p.chrome, borderTop: `1px solid ${p.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 14, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.06em" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, background: T.lime }} />HEALTHY</span>
            <span>7 FROZEN · <span style={{ color: T.pink }}>1 DRIFT</span></span>
          </div>
          <span>MOSAIC@CHECKOUT · REV 042 · SYNCED 12s</span>
          <span>HAIKU-4-5 · IDLE</span>
        </div>
      </div>
    );
  }

  function Crumb({ p, active, children }) {
    return (
      <div style={{ padding: "4px 10px", fontFamily: F.mono, fontSize: 11, color: active ? p.paneText : p.paneMuted, fontWeight: active ? 700 : 400, letterSpacing: active ? "-0.005em" : "0.02em", background: active ? p.chip : "transparent" }}>{children}</div>
    );
  }
  function Slash({ p }) {
    return <span style={{ color: p.paneMuted, fontFamily: F.mono, fontSize: 11 }}>/</span>;
  }

  function CascadeRow({ p, num, label, count, state, active, dark }) {
    const sColor = state === "frozen" ? T.lime : state === "drafting" ? T.amber : p.paneMuted;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 0, alignItems: "center", padding: "12px 12px", borderBottom: `1px solid ${p.divider}`, background: active ? (dark ? T.surface1 : T.paperLo) : "transparent", borderLeft: active ? `3px solid ${T.lime}` : "3px solid transparent" }}>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: p.paneMuted, letterSpacing: "0.04em" }}>{num}</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 2 }}>{count}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: sColor, letterSpacing: "0.14em", textTransform: "uppercase", padding: "2px 6px", border: state === "locked" ? `1px dashed ${p.divider}` : state === "frozen" ? `1px solid ${T.lime}` : `1px solid ${T.amber}`, fontWeight: 600 }}>{state}</div>
      </div>
    );
  }

  function ViewRow({ p, icon, label, active, hint }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: `1px solid transparent` }}>
        <span style={{ color: p.paneMuted, fontSize: 12, textAlign: "center" }}>{icon}</span>
        <span style={{ fontFamily: F.sans, fontSize: 12.5, color: active ? p.paneText : p.paneMuted, fontWeight: active ? 600 : 400 }}>{label}</span>
        {hint && <span style={{ fontFamily: F.mono, fontSize: 9, color: "#000", background: T.lime, padding: "1px 5px", fontWeight: 700 }}>{hint}</span>}
      </div>
    );
  }

  function Tab({ active, children }) {
    return <div style={{ padding: "5px 12px", fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", background: active ? T.lime : "transparent", color: active ? "#000" : "currentColor", cursor: "pointer" }}>{children}</div>;
  }

  function FilterChip({ p, tone, outline, label, count }) {
    const isAccent = tone === T.pink;
    const isLight = tone === "#f5f5f7" || tone === "#c8c8d0";
    return (
      <div style={{ display: "inline-flex", alignItems: "center", padding: 0, marginRight: 6 }}>
        <div style={{ width: 12, height: 12, background: tone, border: outline ? `1.2px solid ${outline}` : "none" }} />
        <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, padding: "3px 8px", border: `1px solid ${p.divider}`, borderLeft: "none", letterSpacing: "0.08em", color: p.paneText }}>{label}</div>
        <div style={{ fontFamily: F.mono, fontSize: 9.5, padding: "3px 7px", background: p.chip, color: p.paneMuted, border: `1px solid ${p.divider}`, borderLeft: "none" }}>{count}</div>
      </div>
    );
  }

  function InspectorRight({ p, dark }) {
    return (
      <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto auto 1fr auto", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${p.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, background: dark ? T.n900 : T.l900 }} />
            <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>CONTRACT</div>
            <div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 9.5, padding: "3px 7px", background: T.lime, color: "#000", letterSpacing: "0.12em", fontWeight: 700 }}>FROZEN</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 800, letterSpacing: "-0.028em", marginTop: 8 }}>Checkout v3</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted, marginTop: 4 }}>node:contract@checkout-v3</div>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${p.divider}` }}>
          {["SCHEMA", "CASCADE", "HISTORY", "NOTES"].map((t, i) => (
            <div key={t} style={{ padding: "10px 12px", fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", color: i === 0 ? p.paneText : p.paneMuted, background: i === 0 ? (dark ? T.surface1 : T.paperLo) : "transparent", borderRight: `1px solid ${p.divider}`, borderBottom: i === 0 ? `2px solid ${T.lime}` : "2px solid transparent" }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", overflow: "auto", fontFamily: F.mono, fontSize: 11.5, lineHeight: 1.7 }}>
          <div style={{ color: p.paneMuted }}>{"{"}</div>
          <div style={{ paddingLeft: 14 }}><Tk c={p.paneText} bold>"name"</Tk>: "PlaceOrder",</div>
          <div style={{ paddingLeft: 14 }}><Tk c={p.paneText} bold>"in"</Tk>: OrderRequest,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={p.paneText} bold>"out"</Tk>: result&lt;OrderConfirm, Declined&gt;,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={p.paneText} bold>"idempotent"</Tk>: <Tk c={T.lime} bold>true</Tk>,</div>
          <div style={{ paddingLeft: 14 }}><Tk c={p.paneText} bold>"invariants"</Tk>: [</div>
          <div style={{ paddingLeft: 28, color: p.paneText }}>"customer.exists",</div>
          <div style={{ paddingLeft: 28, color: p.paneText }}>"cart.total > 0",</div>
          <div style={{ paddingLeft: 28, color: p.paneText }}>"payment.authorized",</div>
          <div style={{ paddingLeft: 28, color: p.paneMuted }}>"…(3 more)"</div>
          <div style={{ paddingLeft: 14, color: p.paneMuted }}>]</div>
          <div style={{ color: p.paneMuted }}>{"}"}</div>
          <div style={{ marginTop: 18, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>DERIVES</div>
          <div style={{ marginTop: 8 }}>
            <DerivePill p={p} dark={dark} tone={dark ? T.n700 : T.l700} text="PlaceOrder · UseCase" />
            <DerivePill p={p} dark={dark} tone={dark ? T.n500 : T.l500} text="Order · Aggregate" />
            <DerivePill p={p} dark={dark} tone={T.pink} text="Payment · drift detected" warn />
          </div>
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${p.divider}`, display: "grid", gap: 8 }}>
          <button style={{ padding: "10px 14px", background: T.lime, color: "#000", border: "none", fontFamily: F.sans, fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.005em", cursor: "pointer" }}>RE-DERIVE DOWNSTREAM →</button>
          <button style={{ padding: "10px 14px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, fontFamily: F.sans, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>EDIT SCHEMA</button>
        </div>
      </div>
    );
  }

  function Tk({ c, bold, children }) { return <span style={{ color: c, fontWeight: bold ? 600 : 400 }}>{children}</span>; }

  function DerivePill({ p, dark, tone, text, warn }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", marginBottom: 4, background: warn ? T.pinkBg : "transparent", border: `1px solid ${warn ? T.pink : p.divider}`, fontFamily: F.sans, fontSize: 12 }}>
        <div style={{ width: 10, height: 10, background: tone }} />
        <span style={{ color: warn ? T.pink : p.paneText, fontWeight: warn ? 600 : 400 }}>{text}</span>
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
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px 16px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.lime, letterSpacing: "0.2em", marginBottom: 6, fontWeight: 600 }}>INSPECTOR & GRAPH DIFF · STUDIO</div>
          <div style={{ fontFamily: F.sans, fontSize: 44, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            <span>Review where it's </span><span style={{ color: T.lime }}>still cheap.</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>
          {/* Inspector */}
          <div style={{ borderRight: `1px solid ${T.line}`, background: T.bg, padding: "20px 22px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 18, height: 18, background: T.n900 }} />
              <div style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 800, letterSpacing: "-0.028em" }}>Checkout v3</div>
              <div style={{ fontFamily: F.mono, fontSize: 9.5, padding: "3px 7px", background: T.lime, color: "#000", letterSpacing: "0.12em", fontWeight: 700 }}>FROZEN</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 6 }}>node:contract@checkout-v3 · rev 042 · 14s ago</div>

            <Subsec title="SCHEMA">
              <PropRow k="name"        v={<span style={{ color: T.text, fontFamily: F.mono }}>"PlaceOrder"</span>} />
              <PropRow k="in"          v={<span style={{ fontFamily: F.mono }}>OrderRequest</span>} />
              <PropRow k="out"         v={<span style={{ fontFamily: F.mono }}>result&lt;OrderConfirm, Declined&gt;</span>} />
              <PropRow k="invariants"  v={<span style={{ fontFamily: F.mono }}>6</span>} />
              <PropRow k="idempotent"  v={<span style={{ color: T.lime, fontFamily: F.mono, fontWeight: 600 }}>true</span>} />
            </Subsec>

            <Subsec title="DERIVES DOWNSTREAM">
              <DerivePill p={p} dark tone={T.n700} text="PlaceOrder · UseCase" />
              <DerivePill p={p} dark tone={T.n500} text="Order · Aggregate" />
              <DerivePill p={p} dark tone={T.pink} text="Payment · drift detected" warn />
              <DerivePill p={p} dark tone="transparent" text="OrderRepo.save · Module · locked" />
            </Subsec>

            <Subsec title="ANNOTATIONS · 3">
              <AnnoCard who="EMMA" text="Idempotency-key should be required, not optional. Refunds depend on it." when="2m ago" />
              <AnnoCard who="RAO"  text="ADR-031 supersedes the synchronous model. Link this contract back." when="38m ago" />
              <AnnoCard who="CLAUDE" agent text="Detected 1 downstream stale node: Payment. Re-run placement?" when="1h ago" />
            </Subsec>
          </div>

          {/* Diff */}
          <div style={{ padding: "20px 28px", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 28, fontWeight: 800, letterSpacing: "-0.028em" }}>v2 → v3</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 4 }}>+3 nodes · −1 node · ~4 edges · 2 contracts</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <DiffPill tone={T.lime} label="+3 ADDED" />
                <DiffPill tone={T.pink} label="−1 REMOVED" />
                <DiffPill tone={T.amber} label="~4 CHANGED" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 0, border: `1px solid ${T.line}`, width: "fit-content" }}>
              <Tab active>SIDE-BY-SIDE</Tab>
              <Tab>OVERLAY</Tab>
              <Tab>ONLY CHANGES</Tab>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, overflow: "hidden" }}>
              <DiffMini label="BEFORE · v2" rev="REV 041 · FROZEN" before />
              <DiffMini label="AFTER · v3"  rev="REV 042 · CURRENT" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <ChangeRow kind="add"    text="Fraud Check · UseCase" meta="cascades into Payment" />
              <ChangeRow kind="add"    text="ADR-031 · Decision"    meta="async payments" />
              <ChangeRow kind="add"    text="StripeGateway · Module" meta="replaces in-house gateway" />
              <ChangeRow kind="remove" text="Payment.sync_charge"   meta="superseded by ADR-031" />
              <ChangeRow kind="change" text="Order.invariants"      meta="6 → 7 (idempotency)" />
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
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: T.lime, marginBottom: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
          <span>{title}</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>
        {children}
      </div>
    );
  }

  function PropRow({ k, v }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>{k}</div>
        <div style={{ fontFamily: F.sans, fontSize: 12 }}>{v}</div>
      </div>
    );
  }

  function AnnoCard({ who, text, when, agent }) {
    return (
      <div style={{ background: "transparent", border: `1px solid ${T.line}`, padding: "10px 12px", marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, fontWeight: 700, color: T.lime, letterSpacing: "0.12em" }}>{agent ? "⌬ " : ""}{who}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute }}>{when}</div>
        </div>
        <div style={{ fontFamily: F.body, fontSize: 13, marginTop: 5, lineHeight: 1.5 }}>{text}</div>
      </div>
    );
  }

  function DiffPill({ tone, label }) {
    return <div style={{ padding: "3px 8px", background: tone, color: tone === T.pink ? "#fff" : "#000", fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{label}</div>;
  }

  function DiffMini({ label, rev, before }) {
    return (
      <div style={{ background: T.bg, border: `1px solid ${T.line}`, padding: 0, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em" }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em" }}>{rev}</div>
        </div>
        <svg viewBox="0 0 380 280" width="100%" height="100%">
          <g fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3">
            <path d={curvePath(70,90,180,130,0.15)} />
            <path d={curvePath(180,130,290,80,0.15)} />
            <path d={curvePath(180,130,260,200,0.15)} />
            <path d={curvePath(260,200,330,160,0.15)} />
            {!before && <path d={curvePath(290,80,340,40,0.22)} stroke={T.lime} strokeWidth="1.8" />}
            {before  && <path d={curvePath(260,200,330,250,0.2)} stroke={T.pink} strokeWidth="1.3" strokeDasharray="3 3" />}
          </g>
          <NodeMini x={70} y={90}   fill={T.n700}    label="PlaceOrder" />
          <NodeMini x={180} y={130} fill={T.n900}    label="Checkout v3" ring={!before ? T.lime : null} />
          <NodeMini x={290} y={80}  fill={T.n500}    label="Order" />
          <NodeMini x={260} y={200} fill={T.n500}    label="Payment" drift={!before} />
          <NodeMini x={330} y={160} fill="transparent" stroke={T.n500} label="OrderSvc" muted />
          {!before && <NodeMarker x={340} y={40} label="ADR-031" added />}
          {before && <NodeRemoved x={330} y={250} label="sync_charge" />}
        </svg>
      </div>
    );
  }

  function NodeMini({ x, y, fill, stroke, label, ring, drift, muted }) {
    return (
      <g>
        {ring && <rect x={x - 24} y={y - 24} width={48} height={48} fill="none" stroke={ring} strokeWidth="1.5" />}
        <rect x={x - 18} y={y - 18} width={36} height={36} rx="2" fill={fill} stroke={stroke} strokeWidth={stroke ? 1.3 : 0} />
        {drift && <rect x={x + 11} y={y - 17} width={6} height={6} fill={T.pink} />}
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="700" fill={muted ? T.textDim : fill === T.n900 || fill === T.n700 ? "#000" : "#fff"}>{label}</text>
      </g>
    );
  }

  function NodeMarker({ x, y, label, added }) {
    return (
      <g>
        {added && <rect x={x - 24} y={y - 24} width={48} height={48} fill="none" stroke={T.lime} strokeWidth="1.4" strokeDasharray="3 3" />}
        <g transform={`rotate(45 ${x} ${y})`}>
          <rect x={x - 12} y={y - 12} width={24} height={24} fill={T.pink} />
        </g>
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="700" fill="#fff">{label}</text>
      </g>
    );
  }

  function NodeRemoved({ x, y, label }) {
    return (
      <g opacity="0.55">
        <rect x={x - 22} y={y - 22} width={44} height={44} fill="none" stroke={T.pink} strokeWidth="1.2" strokeDasharray="3 3" />
        <rect x={x - 18} y={y - 18} width={36} height={36} fill="transparent" stroke={T.n500} strokeWidth="1.2" />
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="600" fill={T.text} textDecoration="line-through">{label}</text>
      </g>
    );
  }

  function ChangeRow({ kind, text, meta }) {
    const c = kind === "add" ? T.lime : kind === "remove" ? T.pink : T.amber;
    const g = kind === "add" ? "+" : kind === "remove" ? "−" : "~";
    return (
      <div style={{ border: `1px solid ${T.line}`, padding: 0, display: "grid", gridTemplateColumns: "32px 1fr" }}>
        <div style={{ background: c, color: kind === "remove" ? "#fff" : "#000", fontFamily: F.mono, fontSize: 18, fontWeight: 800, display: "grid", placeItems: "center" }}>{g}</div>
        <div style={{ padding: "8px 12px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 600 }}>{text}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, marginTop: 2 }}>{meta}</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPONENTS & STATES
  // ═══════════════════════════════════════════════════════════════════════

  function Components() {
    const p = { paneMuted: T.textMute, paneText: T.text, divider: T.line, chip: T.surface1 };
    return (
      <div style={{ height: "100%", background: T.bg, color: T.text, fontFamily: F.sans, padding: "28px 32px", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.lime, letterSpacing: "0.2em", fontWeight: 600 }}>COMPONENTS & STATES · STUDIO</div>
          <div style={{ fontFamily: F.sans, fontSize: 44, fontWeight: 800, letterSpacing: "-0.038em", marginTop: 4 }}>The boring & critical set.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <Card title="BUTTONS">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn primary>FREEZE CONTRACTS</Btn>
                <Btn>SECONDARY</Btn>
                <Btn ghost>GHOST</Btn>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn danger>DISCARD</Btn>
                <Btn disabled>DISABLED</Btn>
                <Btn primary><span>FREEZING</span><Spinner /></Btn>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn size="sm">SMALL</Btn>
                <Btn size="lg">LARGE</Btn>
                <Btn primary icon>GLYPH</Btn>
              </div>
              <div style={{ display: "flex", gap: 0, border: `1px solid ${T.line}`, width: "fit-content" }}>
                <Tab active>FORCE</Tab><Tab>LAYERED</Tab><Tab>RADIAL</Tab>
              </div>
            </div>
          </Card>

          <Card title="INPUTS">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="PROJECT NAME">
                <input value="checkout-platform" readOnly style={input()} />
              </Field>
              <Field label="FILTER MOSAIC">
                <div style={{ position: "relative" }}>
                  <input placeholder="type :contract or @order…" style={{ ...input(), paddingLeft: 32, borderColor: T.lime, boxShadow: `inset 0 0 0 1px ${T.lime}` }} />
                  <div style={{ position: "absolute", left: 10, top: 9, color: T.lime, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>/</div>
                  <div style={{ position: "absolute", right: 8, top: 7, fontFamily: F.mono, fontSize: 9.5, color: T.textMute, padding: "2px 6px", background: T.surface2, fontWeight: 700 }}>⌘F</div>
                </div>
              </Field>
              <Field label="BOUNDED CONTEXT">
                <select style={input()}><option>Sales</option></select>
              </Field>
              <Field label="NOTES" hint="MARKDOWN">
                <textarea rows="2" style={{ ...input(), fontFamily: F.body, fontSize: 13, resize: "none", lineHeight: 1.5 }} defaultValue="Refunds belong on the same contract — see ADR-031."></textarea>
              </Field>
              <div style={{ display: "flex", gap: 14 }}>
                <Check label="REQUIRED" checked />
                <Check label="IDEMPOTENT" checked />
                <Check label="LOCKED" />
              </div>
            </div>
          </Card>

          <Card title="MENUS">
            <div style={{ background: T.bg, border: `1px solid ${T.line}` }}>
              <MenuRow label="FREEZE CONTRACTS" kbd="⌘⇧F" />
              <MenuRow label="MARK AS DRIFT"    kbd="⌘D" />
              <MenuRow label="OPEN IN MOSAIC"   kbd="↵" />
              <MenuRow label="COMPARE WITH v2"  kbd="⌘V" />
              <div style={{ height: 1, background: T.line }} />
              <MenuRow label="DELETE NODE"      kbd="⌫" danger />
            </div>
            <div style={{ marginTop: 14, background: T.bg, border: `1px solid ${T.lime}`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.line}`, background: T.surface0 }}>
                <span style={{ color: T.lime, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>›</span>
                <span style={{ fontFamily: F.mono, fontSize: 12 }}>derive use-cases from</span>
                <span style={{ width: 6, height: 13, background: T.lime, animation: "blink 1s steps(2) infinite" }} />
                <div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em" }}>↑↓ ⏎</div>
              </div>
              <PalRow icon="◆" type="contract" label="Checkout v3" sub="frozen · 2 use cases" hot />
              <PalRow icon="◆" type="contract" label="Refund v1" sub="frozen" />
              <PalRow icon="✦" type="decision" label="ADR-031 · Async pay" sub="" />
              <PalRow icon="▦" type="action"   label="ALL contracts" sub="freeze & re-derive · ⌘⏎" />
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 24 }}>
          <Card title="EMPTY · NO MOSAIC">
            <StateBox>
              <StudioLogo size={72} />
              <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 800, letterSpacing: "-0.028em", marginTop: 18, textTransform: "uppercase" }}>No mosaic yet.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDim, marginTop: 8, maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Point Tessera at a project directory and we'll lay the first tiles.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Btn primary>INDEX A PROJECT</Btn>
                <Btn ghost>OPEN EXISTING</Btn>
              </div>
            </StateBox>
          </Card>
          <Card title="LOADING · INDEXING">
            <StateBox>
              <TilesBuilding />
              <div style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 800, marginTop: 14, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Laying tiles…</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMute, marginTop: 6, letterSpacing: "0.04em" }}>parsed 412 / 1240 · 7 modules · 2 contexts</div>
              <div style={{ width: "75%", height: 4, background: T.surface2, marginTop: 16, overflow: "hidden" }}>
                <div style={{ width: "33%", height: "100%", background: T.lime }} />
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, marginTop: 8, letterSpacing: "0.06em" }}>CORE/PLACE_ORDER.RS</div>
            </StateBox>
          </Card>
          <Card title="ERROR · DRIFT DETECTED">
            <StateBox>
              <div style={{ width: 72, height: 72, background: T.pink, color: "#fff", display: "grid", placeItems: "center", fontFamily: F.sans, fontSize: 36, fontWeight: 800 }}>!</div>
              <div style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 800, marginTop: 14, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Payment drifted.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDim, marginTop: 6, maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>
                StripeGateway diverged from <span style={{ fontFamily: F.mono, color: T.text, fontWeight: 600 }}>Checkout v3</span> at <span style={{ fontFamily: F.mono, color: T.text, fontWeight: 600 }}>process_charge()</span>.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Btn primary>RE-DERIVE</Btn>
                <Btn danger>ACCEPT DRIFT</Btn>
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
        <div style={{ fontFamily: F.mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.lime, marginBottom: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
          <span>{title}</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>
        {children}
      </div>
    );
  }

  function Btn({ children, primary, ghost, danger, disabled, size, icon }) {
    let s = { padding: size === "lg" ? "11px 18px" : size === "sm" ? "5px 11px" : "8px 14px", fontFamily: F.sans, fontSize: size === "lg" ? 12.5 : size === "sm" ? 10.5 : 11.5, fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.text };
    if (primary) s = { ...s, background: T.lime, color: "#000", borderColor: T.lime };
    if (ghost)   s = { ...s, background: "transparent", borderColor: "transparent", color: T.textDim, letterSpacing: "0.04em", fontWeight: 600 };
    if (danger)  s = { ...s, background: "transparent", borderColor: T.pink, color: T.pink };
    if (disabled) s = { ...s, opacity: 0.32, cursor: "not-allowed" };
    return <button style={s}>{icon && <span style={{ color: primary ? "#000" : T.lime }}>✦</span>}{children}</button>;
  }

  function Field({ label, hint, children }) {
    return (
      <label style={{ display: "grid", gap: 5 }}>
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, letterSpacing: "0.16em", fontWeight: 600 }}>{label}</span>
          {hint && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMute, letterSpacing: "0.1em" }}>{hint}</span>}
        </span>
        {children}
      </label>
    );
  }

  function input() {
    return { width: "100%", padding: "8px 11px", border: `1px solid ${T.line}`, background: T.bg, fontFamily: F.mono, fontSize: 12, color: T.text, outline: "none", boxSizing: "border-box", borderRadius: 0 };
  }

  function Check({ label, checked }) {
    return (
      <label style={{ display: "flex", gap: 7, alignItems: "center", cursor: "pointer", fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 }}>
        <span style={{ width: 14, height: 14, border: `1.5px solid ${checked ? T.lime : T.lineHi}`, background: checked ? T.lime : "transparent", display: "grid", placeItems: "center", color: "#000", fontSize: 10, fontWeight: 800 }}>{checked && "✓"}</span>
        {label}
      </label>
    );
  }

  function MenuRow({ label, kbd, danger }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "9px 12px", color: danger ? T.pink : T.text, cursor: "pointer", borderBottom: `1px solid ${T.line}` }}>
        <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, fontWeight: 600 }}>{kbd}</span>
      </div>
    );
  }

  function PalRow({ icon, type, label, sub, hot }) {
    const tone = { contract: T.n900, decision: T.pink, action: T.lime }[type] || T.n500;
    const textOn = { contract: "#000", decision: "#fff", action: "#000" }[type] || "#000";
    return (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${T.line}`, background: hot ? T.surface1 : "transparent", borderLeft: hot ? `3px solid ${T.lime}` : "3px solid transparent" }}>
        <div style={{ width: 24, height: 24, background: tone, color: textOn, fontFamily: F.sans, fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center" }}>{icon}</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 600 }}>{label}</div>
          {sub && <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMute, marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>:{type}</div>
      </div>
    );
  }

  function StateBox({ children }) {
    return (
      <div style={{ background: T.bg, border: `1px solid ${T.line}`, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: 320 }}>{children}</div>
    );
  }

  function TilesBuilding() {
    return (
      <svg width="200" height="80" viewBox="0 0 200 80">
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i % 10) * 20 + 1;
          const y = Math.floor(i / 10) * 38 + 1;
          const filled = i < 13;
          const isAccent = i === 12;
          return <rect key={i} x={x} y={y} width={18} height={36} fill={isAccent ? T.lime : filled ? T.n900 : T.surface2} />;
        })}
      </svg>
    );
  }

  function Spinner() {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#000" strokeWidth="2.5" strokeDasharray="14 28" strokeLinecap="round" />
      </svg>
    );
  }

  window.Studio = { Foundations, ShellDark, ShellLight, InspectorDiff, Components };
})();
