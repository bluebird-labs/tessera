// identity/instrument.jsx — Direction B: Instrument
// Engineering precision. Cool slate, electric indigo signal, Inter Tight +
// JetBrains Mono. Tiles are a quiet structural grid; chrome stays out of
// the way. Linear/Raycast tier restraint.

(function () {
  // ─── TOKENS ────────────────────────────────────────────────────────────
  const T = {
    // dark surfaces
    slate950: "#0a0d14",
    slate900: "#0f131b",
    slate850: "#141925",
    slate800: "#1a2030",
    slate700: "#222a3d",
    line:     "#2a3245",
    lineHi:   "#3a445d",
    // light surfaces
    paper:    "#fcfcfd",
    paperLo:  "#f4f5f8",
    paperDim: "#e8eaf0",
    paperLine:"#dfe2eb",
    paperLineHi:"#c8cdd9",
    // text dark
    textDark: "#e8ecf5",
    textDimD: "#a4abbd",
    textMuteD:"#6a7184",
    // text light
    textLight:"#0b0e16",
    textDimL: "#4a5168",
    textMuteL:"#7a8197",
    // signal
    indigo:    "#6a7aff",
    indigoSoft:"#8a96ff",
    indigoBg:  "rgba(106,122,255,0.12)",
    emerald:   "#19b773",
    amber:     "#f0a93a",
    rose:      "#e2486b",
    violet:    "#a87bff",
    cyan:      "#34c6e0",
  };

  const F = {
    sans: '"Inter Tight", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  };

  const graphDark = {
    bg: T.slate950,
    edge: T.lineHi,
    edgeMuted: T.line,
    edgeLabelBg: T.slate850,
    edgeLabelFg: T.textDimD,
    grout: T.slate900,
    groutOpacity: 0.9,
    selection: T.indigo,
    frozen: T.emerald,
    drift: T.rose,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.slate800, stroke: T.indigo,   text: T.textDark,  shape: "tile" },
      useCase:   { fill: T.slate800, stroke: T.cyan,     text: T.textDark,  shape: "tile" },
      aggregate: { fill: T.slate800, stroke: T.amber,    text: T.textDark,  shape: "tile" },
      module:    { fill: T.slate900, stroke: T.textMuteD,text: T.textDimD,  shape: "rounded" },
      decision:  { fill: T.violet,   stroke: T.textDark, text: T.slate950,  shape: "marker" },
      actor:     { fill: T.slate850, stroke: T.textMuteD,text: T.textDark,  shape: "circle" },
    },
  };

  const graphLight = {
    bg: T.paper,
    edge: T.paperLineHi,
    edgeMuted: T.paperLine,
    edgeLabelBg: T.paperLo,
    edgeLabelFg: T.textMuteL,
    grout: T.paperLine,
    groutOpacity: 0.6,
    selection: T.indigo,
    frozen: T.emerald,
    drift: T.rose,
    monoFont: F.mono,
    type: {
      contract:  { fill: T.paperLo,  stroke: T.indigo, text: T.textLight, shape: "tile" },
      useCase:   { fill: T.paperLo,  stroke: T.cyan,   text: T.textLight, shape: "tile" },
      aggregate: { fill: T.paperLo,  stroke: T.amber,  text: T.textLight, shape: "tile" },
      module:    { fill: T.paperDim, stroke: T.textMuteL, text: T.textDimL, shape: "rounded" },
      decision:  { fill: T.violet,   stroke: T.textLight, text: T.paper, shape: "marker" },
      actor:     { fill: T.paper,    stroke: T.textMuteL, text: T.textLight, shape: "circle" },
    },
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SHARED ATOMS
  // ═══════════════════════════════════════════════════════════════════════

  function Swatch({ color, label, value, dark }) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ width: "100%", height: 64, background: color, borderRadius: 6, border: `1px solid ${dark ? T.line : T.paperLine}` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: dark ? T.textDark : T.textLight }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: dark ? T.textMuteD : T.textMuteL }}>{value}</div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTBOARD 1 — FOUNDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  function Foundations() {
    return (
      <div style={{ background: T.paper, color: T.textLight, fontFamily: F.sans, padding: 40, height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.indigo, letterSpacing: "0.16em", marginBottom: 8 }}>DIRECTION B · INSTRUMENT</div>
            <div style={{ fontFamily: F.sans, fontSize: 54, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.025em", maxWidth: 900 }}>
              An instrument for thinking in graphs.
            </div>
            <div style={{ fontFamily: F.body, fontSize: 17, color: T.textDimL, marginTop: 12, maxWidth: 720, lineHeight: 1.5 }}>
              Precision before personality. The chrome stays out of the way; the graph is the only thing the eye lands on. Color is signal — used sparingly and always meaning the same thing.
            </div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuteL, textAlign: "right" }}>
            <div>TESSERA</div>
            <div>v0.1.0</div>
            <div>2026.05</div>
          </div>
        </div>

        {/* Quiet grid motif strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(48, 1fr)", gap: 2, marginBottom: 28 }}>
          {Array.from({ length: 48 }, (_, i) => (
            <div key={i} style={{ aspectRatio: "1", background: i % 7 === 3 ? T.indigo : T.paperDim, opacity: i % 7 === 3 ? 1 : (0.5 + (i % 5) * 0.1), borderRadius: 1 }} />
          ))}
        </div>

        {/* Token rows */}
        <Section title="Surface · slate scale">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <Swatch color={T.slate950} label="slate-950" value="#0a0d14" dark />
            <Swatch color={T.slate900} label="slate-900" value="#0f131b" dark />
            <Swatch color={T.slate850} label="slate-850" value="#141925" dark />
            <Swatch color={T.slate800} label="slate-800" value="#1a2030" dark />
            <Swatch color={T.line}     label="line"      value="#2a3245" dark />
            <Swatch color={T.lineHi}   label="line-hi"   value="#3a445d" dark />
          </div>
        </Section>

        <Section title="Surface · paper scale">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <Swatch color={T.paper}      label="paper"      value="#fcfcfd" />
            <Swatch color={T.paperLo}    label="paper-lo"   value="#f4f5f8" />
            <Swatch color={T.paperDim}   label="paper-dim"  value="#e8eaf0" />
            <Swatch color={T.paperLine}  label="paper-line" value="#dfe2eb" />
            <Swatch color={T.paperLineHi}label="paper-line+"value="#c8cdd9" />
            <Swatch color={T.textDimL}   label="text-dim"   value="#4a5168" />
          </div>
        </Section>

        <Section title="Signal · color means something">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <SignalSwatch color={T.indigo}  label="indigo"  value="#6a7aff" use="primary · selected · accent" />
            <SignalSwatch color={T.emerald} label="emerald" value="#19b773" use="frozen · success" />
            <SignalSwatch color={T.amber}   label="amber"   value="#f0a93a" use="drafting · warn" />
            <SignalSwatch color={T.rose}    label="rose"    value="#e2486b" use="drift · destructive" />
            <SignalSwatch color={T.violet}  label="violet"  value="#a87bff" use="decision · ADR" />
            <SignalSwatch color={T.cyan}    label="cyan"    value="#34c6e0" use="agent · in-flight" />
          </div>
        </Section>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, marginTop: 22 }}>
          <div>
            <TitledMono label="Typography" />
            <TypeRow name="Display · Inter Tight 600"  sub="-2.5% tracking · view titles" weight={600} size={42}  spec="Tessera. Engineering at the right altitude." />
            <TypeRow name="Heading · Inter Tight 600"  sub="-1.5% tracking · panel titles" weight={600} size={24} spec="Cascade · Use cases" />
            <TypeRow name="Body · Inter 400"           sub="for inspector text · readable"  weight={400} size={14} font={F.body} spec="A contract is the frozen promise between layers. Implementations descend from it." />
            <TypeRow name="UI · Inter Tight 500"       sub="for buttons & labels" weight={500} size={13} spec="Freeze contracts · Open mosaic · Re-derive" />
            <TypeRow name="Caption · Inter Tight 600"  sub="11px · 12% tracking · UPPER" weight={600} size={11} upper spec="CASCADE · CHECKOUT · DERIVES" />
            <TypeRow name="Mono · JetBrains 400"       sub="IDs, query, code" weight={400} size={13} font={F.mono} spec="node:contract@checkout-v3#a1b" />
          </div>
          <div>
            <TitledMono label="Node legend" />
            <NodeLegend />
            <TitledMono label="Spacing · 4·8·12·16·24·32·48" top />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 4 }}>
              {[4,8,12,16,24,32,48,64].map(s => (
                <div key={s} style={{ display: "grid", placeItems: "center", gap: 4 }}>
                  <div style={{ width: s, height: 24, background: T.indigo, borderRadius: 1, opacity: 0.85 }} />
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{s}</div>
                </div>
              ))}
            </div>
            <TitledMono label="Radii" top />
            <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
              {[2,4,6,8,999].map((r,i) => (
                <div key={r} style={{ display: "grid", gap: 4, justifyItems: "center" }}>
                  <div style={{ width: 56, height: 32, background: T.slate900, borderRadius: r }} />
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{["2","4","6","8","full"][i]}</div>
                </div>
              ))}
            </div>
            <TitledMono label="Tokens" top />
            <div style={{ fontFamily: F.mono, fontSize: 11, lineHeight: 1.85, color: T.textDimL, columnCount: 2, columnGap: 24, marginTop: 4 }}>
              <div>--surface-0 · slate-950</div>
              <div>--surface-1 · slate-900</div>
              <div>--surface-2 · slate-850</div>
              <div>--surface-3 · slate-800</div>
              <div>--line</div>
              <div>--line-strong</div>
              <div>--accent</div>
              <div>--ok / --warn / --err</div>
              <div>--node-stroke-*</div>
              <div>--graph-bg</div>
              <div>--text · --text-dim</div>
              <div>--text-mute</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SignalSwatch({ color, label, value, use }) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ width: "100%", height: 64, background: color, borderRadius: 6, position: "relative" }}>
          <div style={{ position: "absolute", inset: 8, border: `1px dashed ${T.paper}`, opacity: 0.35, borderRadius: 3 }} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600 }}>{label}</div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{value}</div>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, marginTop: 3 }}>{use}</div>
        </div>
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.indigo, marginBottom: 10 }}>{title}</div>
        {children}
      </div>
    );
  }

  function TitledMono({ label, top }) {
    return <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.indigo, marginBottom: 10, marginTop: top ? 22 : 0 }}>{label}</div>;
  }

  function TypeRow({ name, sub, weight, size, font, spec, upper }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "baseline", gap: 24, paddingBlock: 14, borderTop: `1px solid ${T.paperLine}` }}>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: T.textLight, letterSpacing: "0.04em" }}>{name}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, marginTop: 4 }}>{sub}</div>
        </div>
        <div style={{ fontFamily: font || F.sans, fontWeight: weight, fontSize: size, color: T.textLight, lineHeight: 1.1, letterSpacing: weight >= 600 ? "-0.018em" : "0", textTransform: upper ? "uppercase" : "none" }}>{spec}</div>
      </div>
    );
  }

  function NodeLegend() {
    const items = [
      { type: "contract",  label: "Contract",  border: T.indigo, fill: T.paperLo, shape: "tile" },
      { type: "useCase",   label: "Use case",  border: T.cyan,   fill: T.paperLo, shape: "tile" },
      { type: "aggregate", label: "Aggregate", border: T.amber,  fill: T.paperLo, shape: "tile" },
      { type: "module",    label: "Module",    border: T.textMuteL, fill: T.paperDim, shape: "rounded" },
      { type: "decision",  label: "Decision",  border: T.textLight, fill: T.violet, shape: "marker" },
      { type: "actor",     label: "Actor",     border: T.textMuteL, fill: T.paper,  shape: "circle" },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {items.map(it => (
          <div key={it.type} style={{ background: T.paperLo, padding: 12, borderRadius: 6, border: `1px solid ${T.paperLine}` }}>
            <svg width="100%" height="48" viewBox="0 0 120 48">
              <g transform="translate(60,24)">
                {it.shape === "tile" && <rect x="-16" y="-16" width="32" height="32" rx="3" fill={it.fill} stroke={it.border} strokeWidth="1.5" />}
                {it.shape === "rounded" && <rect x="-24" y="-11" width="48" height="22" rx="11" fill={it.fill} stroke={it.border} strokeWidth="1.2" />}
                {it.shape === "marker" && (
                  <g>
                    <rect x="-12" y="-12" width="24" height="24" rx="2" fill={it.fill} stroke={it.border} strokeWidth="1.2" transform="rotate(45)" />
                  </g>
                )}
                {it.shape === "circle" && <circle r="14" fill={it.fill} stroke={it.border} strokeWidth="1.2" />}
              </g>
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
              <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>:{it.type}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTBOARD 2/3 — APP SHELL
  // ═══════════════════════════════════════════════════════════════════════

  function Shell({ dark }) {
    const p = dark
      ? { bg: T.slate950, rail: T.slate900, railText: T.textMuteD, railActive: T.indigo,
          topbar: T.slate900, topbarText: T.textDark, topbarMuted: T.textMuteD,
          divider: T.line, paneBg: T.slate900, paneText: T.textDark, paneMuted: T.textMuteD,
          stage: T.slate950, status: T.slate900, chip: T.slate850, chipFg: T.textDark, accent: T.indigo, hover: T.slate850 }
      : { bg: T.paper, rail: T.paperLo, railText: T.textMuteL, railActive: T.indigo,
          topbar: T.paper, topbarText: T.textLight, topbarMuted: T.textMuteL,
          divider: T.paperLine, paneBg: T.paper, paneText: T.textLight, paneMuted: T.textMuteL,
          stage: T.paper, status: T.paperLo, chip: T.paperLo, chipFg: T.textLight, accent: T.indigo, hover: T.paperDim };

    const railItems = ["mosaic", "cascade", "contracts", "domain", "agents", "history", "settings"];
    const railIcons = ["▦", "≡", "◇", "◐", "◬", "◷", "✦"];

    return (
      <div style={{ height: "100%", width: "100%", background: p.bg, fontFamily: F.sans, color: p.paneText, display: "grid", gridTemplateRows: "40px 1fr 24px", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: p.topbar, borderBottom: `1px solid ${p.divider}`, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", paddingInline: 12, gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <WindowChrome />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Logomark size={16} fg={dark ? T.textDark : T.textLight} />
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>Tessera</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: p.topbarMuted, padding: "3px 8px", background: p.chip, borderRadius: 4, border: `1px solid ${p.divider}` }}>checkout-platform</div>
            <span style={{ color: p.topbarMuted }}>›</span>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: p.topbarMuted, padding: "3px 8px", background: p.chip, borderRadius: 4, border: `1px solid ${p.divider}` }}>main</div>
            <span style={{ color: p.topbarMuted }}>›</span>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: p.accent, padding: "3px 8px", background: T.indigoBg, borderRadius: 4 }}>Mosaic · Checkout</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 10px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: p.paneMuted }}>⌘K</span>
              <span style={{ color: p.paneMuted }}>·</span>
              <span>Search</span>
            </button>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: T.indigo, color: T.paper, fontFamily: F.sans, fontWeight: 600, fontSize: 10, display: "grid", placeItems: "center" }}>EM</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "52px 232px 1fr 296px", overflow: "hidden" }}>
          {/* Rail */}
          <div style={{ background: p.rail, borderRight: `1px solid ${p.divider}`, paddingTop: 6 }}>
            {railItems.map((it, i) => (
              <div key={it} style={{ display: "grid", placeItems: "center", height: 44, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: p.accent, borderRadius: 1 }} />}
                <div style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 6, color: i === 0 ? p.railActive : p.railText, background: i === 0 ? T.indigoBg : "transparent", fontSize: 15 }}>{railIcons[i]}</div>
              </div>
            ))}
          </div>

          {/* Outliner */}
          <div style={{ background: p.paneBg, borderRight: `1px solid ${p.divider}`, overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em", color: p.paneMuted, textTransform: "uppercase" }}>Cascade</div>
              <div style={{ fontFamily: F.sans, fontSize: 16, fontWeight: 600, marginTop: 4, letterSpacing: "-0.01em" }}>Checkout v3</div>
            </div>
            <div style={{ padding: "8px 6px", display: "grid", gap: 2 }}>
              <Stage p={p} dot={T.indigo} label="Contracts"      count="4/4"  state="frozen" />
              <Stage p={p} dot={T.cyan}   label="Use cases"      count="7/7"  state="frozen" active />
              <Stage p={p} dot={T.amber}  label="Placement"      count="3/8"  state="drafting" />
              <Stage p={p} dot={T.textMuteD} label="Implementation" count="—" state="locked" />
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${p.divider}` }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em", color: p.paneMuted, textTransform: "uppercase", marginBottom: 8 }}>Views</div>
              <ViewItem p={p} icon="▦" label="Mosaic · all" active />
              <ViewItem p={p} icon="◇" label="Bounded contexts" />
              <ViewItem p={p} icon="≈" label="User flow · checkout" />
              <ViewItem p={p} icon="△" label="Class · Order" />
              <ViewItem p={p} icon="⌬" label="Agent · derivations" hint="2" />
            </div>
            <div style={{ borderTop: `1px solid ${p.divider}`, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.mono, fontSize: 10, color: p.paneMuted }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.emerald }} />
                <span>connected · cloud graph</span>
              </div>
            </div>
          </div>

          {/* Stage */}
          <div style={{ background: p.stage, position: "relative", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${p.divider}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Mosaic · Checkout</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted }}>12 nodes · 12 edges · 1 drift</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <SegmentedItem p={p} active>force</SegmentedItem>
                <SegmentedItem p={p}>layered</SegmentedItem>
                <SegmentedItem p={p}>radial</SegmentedItem>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderBottom: `1px solid ${p.divider}`, alignItems: "center" }}>
              <PillFilter p={p} dot={T.amber}  label="Aggregate" count={4} />
              <PillFilter p={p} dot={T.cyan}   label="UseCase"   count={2} />
              <PillFilter p={p} dot={T.indigo} label="Contract"  count={1} />
              <PillFilter p={p} dot={T.textMuteD} label="Module" count={3} />
              <PillFilter p={p} dot={T.violet} label="Decision"  count={1} />
              <PillFilter p={p} dot={T.textMuteD} label="Actor"  count={1} />
              <div style={{ flex: 1 }} />
              <button style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "4px 9px", background: "transparent", border: `1px solid ${p.divider}`, color: p.paneText, borderRadius: 4, cursor: "pointer" }}>⌥ filter</button>
              <button style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "4px 9px", background: T.indigoBg, border: `1px solid ${T.indigo}`, color: p.accent, borderRadius: 4, cursor: "pointer" }}>compare v2 ▾</button>
            </div>
            <div style={{ position: "relative" }}>
              <MosaicGraph
                theme={dark ? graphDark : graphLight}
                width={1100}
                height={680}
                font={F.sans}
                showGrout
              />
              {/* tooltip */}
              <div style={{ position: "absolute", left: 720, top: 200, background: dark ? T.slate850 : T.paper, border: `1px solid ${p.divider}`, padding: "8px 10px", borderRadius: 6, fontFamily: F.sans, fontSize: 11.5, boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(15,19,27,0.08)", minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, background: T.amber, borderRadius: 2 }} />
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>aggregate</div>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, marginTop: 4 }}>Order</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 2 }}>node:aggregate@order#7c4</div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: p.paneText, marginTop: 6 }}>6 invariants · derived from Checkout v3</div>
              </div>
            </div>
          </div>

          {/* Inspector */}
          <div style={{ background: p.paneBg, borderLeft: `1px solid ${p.divider}`, overflow: "hidden" }}>
            <InspectorRight p={p} dark={dark} />
          </div>
        </div>

        {/* Status */}
        <div style={{ background: p.status, borderTop: `1px solid ${p.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 14, fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.04em" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: T.emerald }} /> graph healthy</span>
            <span>cascade · 7 frozen · 1 drift</span>
          </div>
          <span>mosaic@checkout · rev 042 · synced 12s ago</span>
          <span>haiku-4-5 · idle</span>
        </div>
      </div>
    );
  }

  function Stage({ p, dot, label, count, state, active }) {
    const stateMap = { frozen: T.emerald, drafting: T.amber, locked: T.textMuteD };
    return (
      <div style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 6, background: active ? p.chip : "transparent", cursor: "pointer" }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: dot }} />
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, marginTop: 1 }}>{count}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: stateMap[state], letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 5px", borderRadius: 3, background: state === "frozen" ? "rgba(25,183,115,0.12)" : state === "drafting" ? "rgba(240,169,58,0.14)" : "transparent", border: state === "locked" ? `1px dashed ${p.divider}` : "none" }}>
          {state}
        </div>
      </div>
    );
  }

  function ViewItem({ p, icon, label, active, hint }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 8, alignItems: "center", padding: "5px 8px", borderRadius: 4, background: active ? p.chip : "transparent" }}>
        <span style={{ color: p.paneMuted, fontSize: 12, textAlign: "center" }}>{icon}</span>
        <span style={{ fontFamily: F.sans, fontSize: 12, color: active ? p.paneText : p.paneMuted }}>{label}</span>
        {hint && <span style={{ fontFamily: F.mono, fontSize: 9, color: T.cyan, padding: "1px 5px", background: "rgba(52,198,224,0.16)", borderRadius: 8 }}>{hint}</span>}
      </div>
    );
  }

  function SegmentedItem({ p, active, children }) {
    return (
      <div style={{ padding: "4px 10px", borderRadius: 4, fontFamily: F.sans, fontSize: 11, fontWeight: 500, background: active ? T.indigoBg : "transparent", color: active ? T.indigo : p.paneMuted, border: `1px solid ${active ? T.indigo : "transparent"}`, cursor: "pointer" }}>{children}</div>
    );
  }

  function PillFilter({ p, dot, label, count }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px 4px 6px", borderRadius: 999, background: p.chip, border: `1px solid ${p.divider}`, fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: p.paneText, cursor: "pointer" }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: dot }} />
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
            <div style={{ width: 12, height: 12, background: T.indigo, borderRadius: 2 }} />
            <div style={{ fontFamily: F.mono, fontSize: 10, color: p.paneMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Contract</div>
            <div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 9, padding: "2px 6px", background: "rgba(25,183,115,0.16)", color: T.emerald, borderRadius: 3, letterSpacing: "0.08em" }}>FROZEN</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 6 }}>Checkout v3</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: p.paneMuted, marginTop: 4 }}>node:contract@checkout-v3</div>
        </div>
        <div style={{ display: "flex", padding: "0 12px", borderBottom: `1px solid ${p.divider}` }}>
          {["Schema", "Cascade", "History", "Notes"].map((t, i) => (
            <div key={t} style={{ padding: "8px 10px", fontFamily: F.sans, fontSize: 11.5, fontWeight: 500, color: i === 0 ? p.paneText : p.paneMuted, borderBottom: i === 0 ? `1.5px solid ${T.indigo}` : "1.5px solid transparent" }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: "14px 16px", overflow: "auto", fontFamily: F.mono, fontSize: 11.5, lineHeight: 1.65, color: p.paneText }}>
          <div style={{ color: p.paneMuted }}>{`{`}</div>
          <div style={{ paddingLeft: 14 }}><span style={{ color: T.amber }}>"name"</span><span style={{ color: p.paneMuted }}>: </span><span style={{ color: T.emerald }}>"PlaceOrder"</span><span style={{ color: p.paneMuted }}>,</span></div>
          <div style={{ paddingLeft: 14 }}><span style={{ color: T.amber }}>"in"</span><span style={{ color: p.paneMuted }}>: </span><span style={{ color: T.cyan }}>OrderRequest</span><span style={{ color: p.paneMuted }}>,</span></div>
          <div style={{ paddingLeft: 14 }}><span style={{ color: T.amber }}>"out"</span><span style={{ color: p.paneMuted }}>: </span><span style={{ color: T.cyan }}>result&lt;OrderConfirm, Declined&gt;</span><span style={{ color: p.paneMuted }}>,</span></div>
          <div style={{ paddingLeft: 14 }}><span style={{ color: T.amber }}>"idempotent"</span><span style={{ color: p.paneMuted }}>: </span><span style={{ color: T.violet }}>true</span><span style={{ color: p.paneMuted }}>,</span></div>
          <div style={{ paddingLeft: 14 }}><span style={{ color: T.amber }}>"invariants"</span><span style={{ color: p.paneMuted }}>: [</span></div>
          <div style={{ paddingLeft: 28, color: T.emerald }}>"customer.exists",</div>
          <div style={{ paddingLeft: 28, color: T.emerald }}>"cart.total &gt; 0",</div>
          <div style={{ paddingLeft: 28, color: T.emerald }}>"payment.authorized",</div>
          <div style={{ paddingLeft: 28, color: T.emerald }}>"…(3 more)"</div>
          <div style={{ paddingLeft: 14, color: p.paneMuted }}>]</div>
          <div style={{ color: p.paneMuted }}>{`}`}</div>
          <div style={{ marginTop: 16, fontFamily: F.mono, fontSize: 10, color: T.indigo, letterSpacing: "0.1em", textTransform: "uppercase" }}>derives</div>
          <div style={{ marginTop: 6, fontFamily: F.sans, fontSize: 12, color: p.paneText, lineHeight: 1.6 }}>
            <DerivePill p={p} color={T.cyan} text="PlaceOrder · UseCase" />
            <DerivePill p={p} color={T.amber} text="Order · Aggregate" />
            <DerivePill p={p} color={T.rose} text="Payment · drift" warn />
          </div>
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${p.divider}`, display: "grid", gap: 6 }}>
          <button style={{ padding: "8px 12px", border: "none", background: T.indigo, color: T.paper, fontFamily: F.sans, fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: "pointer" }}>Re-derive downstream</button>
          <button style={{ padding: "8px 12px", border: `1px solid ${p.divider}`, background: "transparent", color: p.paneText, fontFamily: F.sans, fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: "pointer" }}>Edit schema</button>
        </div>
      </div>
    );
  }

  function DerivePill({ p, color, text, warn }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", marginBlock: 4, background: warn ? "rgba(226,72,107,0.1)" : p.chip, borderRadius: 4, fontFamily: F.sans, fontSize: 11.5, color: warn ? T.rose : p.paneText, border: `1px solid ${warn ? "rgba(226,72,107,0.4)" : "transparent"}` }}>
        <div style={{ width: 6, height: 6, borderRadius: 1, background: color }} />
        <span>{text}</span>
      </div>
    );
  }

  function ShellDark()  { return <Shell dark />; }
  function ShellLight() { return <Shell />;     }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTBOARD 4 — INSPECTOR & DIFF
  // ═══════════════════════════════════════════════════════════════════════

  function InspectorDiff() {
    const p = { paneMuted: T.textMuteL, paneText: T.textLight, divider: T.paperLine, chip: T.paperLo, chipFg: T.textLight };
    return (
      <div style={{ height: "100%", background: T.paper, color: T.textLight, fontFamily: F.sans, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}>
        <div style={{ padding: "22px 32px 14px", borderBottom: `1px solid ${T.paperLine}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.indigo, letterSpacing: "0.16em", marginBottom: 4 }}>INSPECTOR & GRAPH DIFF · INSTRUMENT</div>
          <div style={{ fontFamily: F.sans, fontSize: 32, fontWeight: 600, letterSpacing: "-0.022em" }}>Review at the altitude where it's still cheap.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>
          {/* Inspector */}
          <div style={{ borderRight: `1px solid ${T.paperLine}`, background: T.paperLo, padding: "20px 22px", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, background: T.indigo, borderRadius: 2 }} />
              <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em" }}>Checkout v3</div>
              <div style={{ fontFamily: F.mono, fontSize: 10, padding: "2px 6px", background: "rgba(25,183,115,0.16)", color: T.emerald, borderRadius: 3, letterSpacing: "0.08em" }}>FROZEN</div>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuteL, marginTop: 6 }}>node:contract@checkout-v3 · rev 042 · 14s ago</div>

            <Subsection title="Schema">
              <PropRow k="name"        v={<span style={{ color: T.emerald, fontFamily: F.mono }}>"PlaceOrder"</span>} />
              <PropRow k="in"          v={<span style={{ color: T.cyan, fontFamily: F.mono }}>OrderRequest</span>} />
              <PropRow k="out"         v={<span style={{ color: T.cyan, fontFamily: F.mono }}>result&lt;OrderConfirm, Declined&gt;</span>} />
              <PropRow k="invariants"  v={<span style={{ color: T.textLight, fontFamily: F.mono }}>6</span>} />
              <PropRow k="idempotent"  v={<span style={{ color: T.violet, fontFamily: F.mono }}>true</span>} />
            </Subsection>

            <Subsection title="Derives">
              <DerivePill p={p} color={T.cyan} text="PlaceOrder · UseCase" />
              <DerivePill p={p} color={T.amber} text="Order · Aggregate" />
              <DerivePill p={p} color={T.rose} text="Payment · drift detected" warn />
              <DerivePill p={p} color={T.textMuteL} text="OrderRepo.save · Module · locked" />
            </Subsection>

            <Subsection title="Annotations · 3">
              <AnnoCard color={T.indigo} who="Emma" text="Idempotency-key should be required, not optional. Refunds depend on it." when="2m ago" />
              <AnnoCard color={T.violet} who="Rao"  text="ADR-031 supersedes sync model — link this contract back." when="38m ago" />
              <AnnoCard color={T.cyan}   who="Claude" agent text="Detected 1 downstream stale node: Payment. Re-run placement?" when="1h ago" />
            </Subsection>
          </div>

          {/* Diff */}
          <div style={{ padding: "20px 28px", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr auto", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>checkout-v2 → v3</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuteL, marginTop: 4 }}>+3 nodes · −1 node · ~4 edges · 2 contracts changed</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <DiffPill color={T.emerald} bg="rgba(25,183,115,0.12)" label="+3 added" />
                <DiffPill color={T.rose}    bg="rgba(226,72,107,0.12)" label="−1 removed" />
                <DiffPill color={T.amber}   bg="rgba(240,169,58,0.16)" label="~4 changed" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <SegmentedItem p={p} active>side-by-side</SegmentedItem>
              <SegmentedItem p={p}>overlay</SegmentedItem>
              <SegmentedItem p={p}>only changes</SegmentedItem>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, overflow: "hidden" }}>
              <MiniPanel label="Before · v2" rev="041 · frozen" before />
              <MiniPanel label="After · v3"  rev="042 · current" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <ChangeLine kind="add"    text="Fraud Check · UseCase" meta="cascades into Payment" />
              <ChangeLine kind="add"    text="ADR-031 · Decision" meta="async payments" />
              <ChangeLine kind="add"    text="StripeGateway · Module" meta="replaces in-house gateway" />
              <ChangeLine kind="remove" text="Payment.sync_charge" meta="superseded by ADR-031" />
              <ChangeLine kind="change" text="Order.invariants" meta="6 → 7 (idempotency)" />
              <ChangeLine kind="change" text="Customer ⟶ Order edge" meta="now via Cart" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function Subsection({ title, children }) {
    return (
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.indigo, marginBottom: 8 }}>{title}</div>
        {children}
      </div>
    );
  }

  function PropRow({ k, v }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10, padding: "5px 0", borderBottom: `1px solid ${T.paperLine}` }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: T.textLight }}>{v}</div>
      </div>
    );
  }

  function AnnoCard({ color, who, text, when, agent }) {
    return (
      <div style={{ background: T.paper, border: `1px solid ${T.paperLine}`, borderLeft: `2px solid ${color}`, padding: "9px 11px", borderRadius: 4, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color, letterSpacing: "0.08em" }}>{agent ? "⌬ " : ""}{who}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{when}</div>
        </div>
        <div style={{ fontFamily: F.body, fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{text}</div>
      </div>
    );
  }

  function DiffPill({ color, bg, label }) {
    return <div style={{ padding: "3px 9px", borderRadius: 999, background: bg, color, fontFamily: F.mono, fontSize: 11, fontWeight: 500 }}>{label}</div>;
  }

  function MiniPanel({ label, rev, before }) {
    return (
      <div style={{ background: T.paperLo, border: `1px solid ${T.paperLine}`, borderRadius: 6, padding: 14, display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600 }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{rev}</div>
        </div>
        <svg viewBox="0 0 380 280" width="100%" height="100%">
          <g opacity="0.55">
            {[0,1,2,3,4,5,6,7,8].map(i => <line key={i} x1={i*44} y1={0} x2={i*44} y2={280} stroke={T.paperLine} strokeWidth="0.5" />)}
            {[0,1,2,3,4,5,6].map(i => <line key={i} x1={0} y1={i*44} x2={380} y2={i*44} stroke={T.paperLine} strokeWidth="0.5" />)}
          </g>
          <g fill="none" stroke={T.paperLineHi} strokeWidth="1.3">
            <path d={curvePath(70,90,180,130,0.15)} />
            <path d={curvePath(180,130,290,80,0.15)} />
            <path d={curvePath(180,130,260,200,0.15)} />
            <path d={curvePath(260,200,330,160,0.15)} />
            {!before && <path d={curvePath(290,80,340,40,0.2)} stroke={T.emerald} strokeWidth="1.6" />}
            {before  && <path d={curvePath(260,200,330,250,0.2)} stroke={T.rose} strokeWidth="1.3" strokeDasharray="3 3" />}
          </g>
          <NodeTile x={70} y={90}  border={T.cyan}   label="PlaceOrder" />
          <NodeTile x={180} y={130} border={T.indigo} label="Checkout v3" ring={!before ? T.emerald : null} />
          <NodeTile x={290} y={80}  border={T.amber}  label="Order" />
          <NodeTile x={260} y={200} border={T.amber}  label="Payment" drift={!before} />
          <NodeTile x={330} y={160} border={T.textMuteL} label="OrderSvc" muted />
          {!before && <NodeMarker x={340} y={40}  label="ADR-031" added />}
          {before && <NodeCircle x={330} y={250} label="sync_charge" removed />}
        </svg>
      </div>
    );
  }

  function NodeTile({ x, y, border, label, ring, drift, muted }) {
    return (
      <g>
        {ring && <rect x={x - 22} y={y - 22} width={44} height={44} rx="3" fill="none" stroke={ring} strokeWidth="1.2" />}
        <rect x={x - 18} y={y - 18} width={36} height={36} rx="3" fill={muted ? T.paperDim : T.paperLo} stroke={border} strokeWidth="1.5" />
        {drift && <circle cx={x + 14} cy={y - 14} r="3.5" fill={T.rose} />}
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="600" fill={T.textLight}>{label}</text>
      </g>
    );
  }

  function NodeMarker({ x, y, label, added }) {
    return (
      <g>
        {added && <rect x={x - 24} y={y - 24} width={48} height={48} fill="none" stroke={T.emerald} strokeWidth="1.2" strokeDasharray="3 3" rx="3" />}
        <g transform={`rotate(45 ${x} ${y})`}>
          <rect x={x - 12} y={y - 12} width={24} height={24} fill={T.violet} stroke={T.textLight} strokeWidth="1.2" rx="2" />
        </g>
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="600" fill={T.paper}>{label}</text>
      </g>
    );
  }

  function NodeCircle({ x, y, label, removed }) {
    return (
      <g opacity={removed ? 0.55 : 1}>
        {removed && <circle cx={x} cy={y} r="22" fill="none" stroke={T.rose} strokeWidth="1.2" strokeDasharray="3 3" />}
        <circle cx={x} cy={y} r="18" fill={T.paperDim} stroke={T.textMuteL} strokeWidth="1.2" />
        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontFamily={F.sans} fontWeight="500" fill={T.textLight} textDecoration={removed ? "line-through" : "none"}>{label}</text>
      </g>
    );
  }

  function ChangeLine({ kind, text, meta }) {
    const c = kind === "add" ? T.emerald : kind === "remove" ? T.rose : T.amber;
    const bg = kind === "add" ? "rgba(25,183,115,0.06)" : kind === "remove" ? "rgba(226,72,107,0.06)" : "rgba(240,169,58,0.08)";
    const g = kind === "add" ? "+" : kind === "remove" ? "−" : "~";
    return (
      <div style={{ background: bg, border: `1px solid ${T.paperLine}`, borderLeft: `3px solid ${c}`, padding: "8px 12px", borderRadius: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, color: c, fontFamily: F.mono, fontSize: 14, fontWeight: 700, textAlign: "center" }}>{g}</div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, fontWeight: 500 }}>{text}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, marginLeft: 24, marginTop: 2 }}>{meta}</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTBOARD 5 — COMPONENTS & STATES
  // ═══════════════════════════════════════════════════════════════════════

  function Components() {
    const p = { paneMuted: T.textMuteL, paneText: T.textLight, divider: T.paperLine, chip: T.paperLo };
    return (
      <div style={{ height: "100%", background: T.paper, color: T.textLight, fontFamily: F.sans, padding: "26px 32px", boxSizing: "border-box", overflow: "hidden" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.indigo, letterSpacing: "0.16em" }}>COMPONENTS & STATES · INSTRUMENT</div>
          <div style={{ fontFamily: F.sans, fontSize: 32, fontWeight: 600, letterSpacing: "-0.022em", marginTop: 4 }}>The boring & critical set.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <Card title="Buttons">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn primary>Freeze contracts</Btn>
                <Btn>Secondary</Btn>
                <Btn ghost>Ghost</Btn>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn danger>Discard</Btn>
                <Btn disabled>Disabled</Btn>
                <Btn primary><span>Freezing</span> <Spinner /></Btn>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm">Small</Btn>
                <Btn size="lg">Large</Btn>
                <Btn primary icon="✦">Glyph</Btn>
              </div>
              <div style={{ display: "flex", gap: 4, padding: 3, background: T.paperLo, borderRadius: 6, alignSelf: "start" }}>
                <Seg active>force</Seg><Seg>layered</Seg><Seg>radial</Seg>
              </div>
            </div>
          </Card>

          <Card title="Inputs">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Project name">
                <input value="checkout-platform" readOnly style={input()} />
              </Field>
              <Field label="Filter mosaic">
                <div style={{ position: "relative" }}>
                  <input placeholder="type :contract or @order…" style={{ ...input(), paddingLeft: 30 }} />
                  <div style={{ position: "absolute", left: 9, top: 8, color: T.textMuteL, fontFamily: F.mono, fontSize: 12 }}>/</div>
                  <div style={{ position: "absolute", right: 9, top: 6, fontFamily: F.mono, fontSize: 10, color: T.textMuteL, padding: "2px 6px", background: T.paperDim, borderRadius: 3 }}>⌘F</div>
                </div>
              </Field>
              <Field label="Bounded context">
                <select style={input()}><option>Sales</option></select>
              </Field>
              <Field label="Notes" hint="markdown supported">
                <textarea rows="3" style={{ ...input(), fontFamily: F.body, resize: "none", lineHeight: 1.5 }} defaultValue="Refunds belong on the same contract — see ADR-031."></textarea>
              </Field>
              <div style={{ display: "flex", gap: 14 }}>
                <Check label="Required" checked />
                <Check label="Idempotent" checked />
                <Check label="Locked" />
              </div>
            </div>
          </Card>

          <Card title="Menus">
            <div style={{ background: T.paper, border: `1px solid ${T.paperLine}`, borderRadius: 6, padding: 5, boxShadow: "0 8px 24px rgba(15,19,27,0.06)" }}>
              <MenuRow label="Freeze contracts" kbd="⌘⇧F" icon="◆" />
              <MenuRow label="Mark as drift"    kbd="⌘D"  icon="✦" />
              <MenuRow label="Open in Mosaic"   kbd="↵"   icon="▦" />
              <MenuRow label="Compare with v2"  kbd="⌘V"  icon="≈" />
              <div style={{ height: 1, background: T.paperLine, margin: "4px 0" }} />
              <MenuRow label="Delete node"      kbd="⌫"   icon="−" danger />
            </div>
            <div style={{ marginTop: 16, background: T.slate950, color: T.textDark, borderRadius: 8, overflow: "hidden", boxShadow: "0 24px 60px -16px rgba(10,13,20,0.5)" }}>
              <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.line}` }}>
                <span style={{ color: T.indigo, fontFamily: F.mono }}>›</span>
                <span style={{ fontFamily: F.mono, fontSize: 13 }}>derive use-cases from</span>
                <span style={{ width: 2, height: 13, background: T.indigo, animation: "blink 1s steps(2) infinite" }} />
                <div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 10, color: T.textMuteD }}>4 results · ↑↓ ⏎</div>
              </div>
              <PaletteRow icon="◆" type="contract" label="Checkout v3" sub="frozen · derives 2 use cases" />
              <PaletteRow icon="◆" type="contract" label="Refund v1" sub="frozen" />
              <PaletteRow icon="✦" type="decision" label="ADR-031 · Async pay" sub="decision" hot />
              <PaletteRow icon="▦" type="action"  label="ALL contracts" sub="freeze and re-derive · ⌘⏎" />
            </div>
          </Card>
        </div>

        {/* States */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginTop: 24 }}>
          <Card title="Empty · no mosaic">
            <StateBox>
              <LogoLarge />
              <div style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 600, marginTop: 16, letterSpacing: "-0.01em" }}>No mosaic yet.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDimL, marginTop: 6, maxWidth: 280, textAlign: "center", lineHeight: 1.5 }}>Point Tessera at a project directory and we'll build the first graph.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Btn primary>Index a project</Btn>
                <Btn ghost>Open existing</Btn>
              </div>
            </StateBox>
          </Card>
          <Card title="Loading · indexing">
            <StateBox>
              <BuildingGrid />
              <div style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 600, marginTop: 14 }}>Building the graph…</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: T.textMuteL, marginTop: 4 }}>parsed 412 / 1240 files · 7 modules · 2 contexts</div>
              <div style={{ width: "75%", height: 4, background: T.paperLine, marginTop: 16, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: "33%", height: "100%", background: T.indigo, borderRadius: 2 }} />
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, marginTop: 8 }}>parser: rust-analyzer · core/place_order.rs</div>
            </StateBox>
          </Card>
          <Card title="Error · drift detected">
            <StateBox tone="warn">
              <div style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(226,72,107,0.12)", border: `1px solid ${T.rose}`, color: T.rose, display: "grid", placeItems: "center", fontFamily: F.sans, fontSize: 28, fontWeight: 600 }}>!</div>
              <div style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 600, marginTop: 14, letterSpacing: "-0.01em" }}>Payment drifted from its contract.</div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: T.textDimL, marginTop: 6, maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>
                StripeGateway diverged from <span style={{ fontFamily: F.mono, color: T.textLight }}>Checkout v3</span> at <span style={{ fontFamily: F.mono, color: T.textLight }}>process_charge()</span>.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Btn primary>Re-derive</Btn>
                <Btn danger>Accept drift</Btn>
              </div>
            </StateBox>
          </Card>
        </div>
        <style>{`@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
      </div>
    );
  }

  function Card({ title, children }) {
    return (
      <div>
        <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.indigo, marginBottom: 12 }}>{title}</div>
        {children}
      </div>
    );
  }

  function Btn({ children, primary, ghost, danger, disabled, size, icon }) {
    let base = { padding: size === "lg" ? "10px 16px" : size === "sm" ? "5px 10px" : "8px 12px", fontFamily: F.sans, fontSize: size === "lg" ? 13 : size === "sm" ? 11 : 12, fontWeight: 500, borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${T.paperLine}`, background: T.paper, color: T.textLight };
    if (primary) base = { ...base, background: T.indigo, color: T.paper, borderColor: T.indigo, fontWeight: 600 };
    if (ghost)   base = { ...base, background: "transparent", borderColor: "transparent", color: T.textDimL };
    if (danger)  base = { ...base, background: "transparent", borderColor: T.rose, color: T.rose, fontWeight: 600 };
    if (disabled) base = { ...base, opacity: 0.42, cursor: "not-allowed" };
    return (
      <button style={base}>
        {icon && <span style={{ color: primary ? T.paper : T.indigo, fontSize: 12 }}>{icon}</span>}
        {children}
      </button>
    );
  }

  function Seg({ active, children }) {
    return <div style={{ padding: "4px 10px", borderRadius: 4, fontFamily: F.sans, fontSize: 11, fontWeight: 500, color: active ? T.textLight : T.textMuteL, background: active ? T.paper : "transparent", boxShadow: active ? "0 1px 2px rgba(15,19,27,0.06)" : "none" }}>{children}</div>;
  }

  function Field({ label, hint, children }) {
    return (
      <label style={{ display: "grid", gap: 5 }}>
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
          {hint && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: T.textMuteL }}>{hint}</span>}
        </span>
        {children}
      </label>
    );
  }

  function input() {
    return { width: "100%", padding: "7px 9px", border: `1px solid ${T.paperLine}`, background: T.paper, borderRadius: 6, fontFamily: F.mono, fontSize: 12, color: T.textLight, outline: "none", boxSizing: "border-box" };
  }

  function Check({ label, checked }) {
    return (
      <label style={{ display: "flex", gap: 7, alignItems: "center", cursor: "pointer", fontFamily: F.sans, fontSize: 12 }}>
        <span style={{ width: 14, height: 14, border: `1.5px solid ${checked ? T.indigo : T.paperLineHi}`, background: checked ? T.indigo : T.paper, borderRadius: 3, display: "grid", placeItems: "center", color: T.paper, fontSize: 10 }}>{checked && "✓"}</span>
        {label}
      </label>
    );
  }

  function MenuRow({ label, kbd, icon, danger }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: 8, alignItems: "center", padding: "6px 8px", borderRadius: 4, cursor: "pointer", color: danger ? T.rose : T.textLight }}>
        <span style={{ color: danger ? T.rose : T.textMuteL, fontSize: 12, textAlign: "center" }}>{icon}</span>
        <span style={{ fontFamily: F.sans, fontSize: 12.5 }}>{label}</span>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteL }}>{kbd}</span>
      </div>
    );
  }

  function PaletteRow({ icon, type, label, sub, hot }) {
    const color = { contract: T.indigo, decision: T.violet, action: T.amber }[type] || T.textMuteD;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.line}`, background: hot ? T.slate850 : "transparent" }}>
        <div style={{ width: 22, height: 22, background: color, color: type === "decision" ? T.slate950 : T.slate950, fontFamily: F.sans, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", borderRadius: 4 }}>{icon}</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, color: T.textDark }}>{label}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.textMuteD, marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 9, color: T.textMuteD, letterSpacing: "0.08em", textTransform: "uppercase" }}>:{type}</div>
      </div>
    );
  }

  function StateBox({ children }) {
    return (
      <div style={{ background: T.paperLo, border: `1px solid ${T.paperLine}`, borderRadius: 8, padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: 320 }}>
        {children}
      </div>
    );
  }

  function LogoLarge() {
    return (
      <svg width="72" height="72" viewBox="0 0 72 72">
        <rect x="4" y="4" width="28" height="28" rx="3" fill={T.paperDim} stroke={T.paperLineHi} strokeWidth="1.2" />
        <rect x="40" y="4" width="28" height="28" rx="3" fill={T.indigo} />
        <rect x="4" y="40" width="28" height="28" rx="3" fill={T.indigo} opacity="0.5" />
        <rect x="40" y="40" width="28" height="28" rx="3" fill={T.paperDim} stroke={T.paperLineHi} strokeWidth="1.2" />
      </svg>
    );
  }

  function BuildingGrid() {
    return (
      <svg width="180" height="80" viewBox="0 0 180 80">
        {Array.from({ length: 18 }, (_, i) => {
          const x = (i % 9) * 20 + 1;
          const y = Math.floor(i / 9) * 38 + 1;
          const filled = i < 11;
          return <rect key={i} x={x} y={y} width={18} height={36} rx="2" fill={filled ? T.indigo : T.paperDim} opacity={filled ? (1 - i * 0.04) : 1} />;
        })}
      </svg>
    );
  }

  function Spinner() {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={T.paper} strokeWidth="2.5" strokeDasharray="14 28" strokeLinecap="round" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </svg>
    );
  }

  window.Instrument = { Foundations, ShellDark, ShellLight, InspectorDiff, Components };
})();
