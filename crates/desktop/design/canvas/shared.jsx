// identity/shared.jsx — primitives shared across the three directions.
// Exposes:
//   window.MosaicData   — the canonical demo graph (nodes + edges)
//   window.MosaicGraph  — themeable SVG mosaic graph renderer
//   window.curvePath    — bezier helper for edges
//   window.Logomark     — minimalist wordmark used in app shells
//   window.WindowChrome — macOS-style traffic lights (Tauri-on-mac feel)

(function () {
  // ─── Canonical demo graph ──────────────────────────────────────────────
  // A modest "Checkout" Mosaic. Mixes contracts, use cases, aggregates,
  // code modules and a single placement decision so every node type is
  // exercised at least once. Coordinates are hand-tuned to feel
  // force-directed without the cost of simulating it on every render.
  //
  // type taxonomy (every direction colors these the same way semantically):
  //   contract  — frozen API/promise between layers
  //   useCase   — behavior, what the system does
  //   aggregate — domain entity cluster
  //   module    — code-level concrete (class, file, service)
  //   decision  — architectural ADR
  //   actor     — external agent (user, system)
  const nodes = [
    { id: "place-order",       type: "useCase",   label: "Place Order",          x: 470, y: 240, r: 26 },
    { id: "checkout-contract", type: "contract",  label: "Checkout v3",          x: 700, y: 180, r: 28, frozen: true },
    { id: "order",             type: "aggregate", label: "Order",                x: 880, y: 290, r: 30 },
    { id: "customer",          type: "aggregate", label: "Customer",             x: 280, y: 380, r: 26 },
    { id: "cart",              type: "aggregate", label: "Cart",                 x: 540, y: 440, r: 22 },
    { id: "payment",           type: "aggregate", label: "Payment",              x: 1010, y: 470, r: 26 },
    { id: "order-svc",         type: "module",    label: "OrderService",         x: 820, y: 580, r: 20 },
    { id: "payment-gw",        type: "module",    label: "Stripe Gateway",       x: 1120, y: 600, r: 18, drift: true },
    { id: "order-repo",        type: "module",    label: "OrderRepo",            x: 660, y: 640, r: 18 },
    { id: "fraud-check",       type: "useCase",   label: "Fraud Check",          x: 1180, y: 360, r: 22 },
    { id: "adr-031",           type: "decision",  label: "ADR-031 · Async Pay",  x: 970, y: 130, r: 16 },
    { id: "shopper",           type: "actor",     label: "Shopper",              x: 120, y: 240, r: 18 },
  ];

  // Edges intentionally cross a little — keeps the canvas honest.
  const edges = [
    { from: "shopper",           to: "place-order",       kind: "invokes" },
    { from: "place-order",       to: "checkout-contract", kind: "derives", label: "derives" },
    { from: "checkout-contract", to: "order",             kind: "shapes",  label: "shapes" },
    { from: "place-order",       to: "cart",              kind: "reads" },
    { from: "place-order",       to: "customer",          kind: "reads" },
    { from: "cart",              to: "order",             kind: "becomes" },
    { from: "order",             to: "payment",           kind: "requires", label: "requires" },
    { from: "order",             to: "order-svc",         kind: "impl" },
    { from: "order-svc",         to: "order-repo",        kind: "impl" },
    { from: "payment",           to: "payment-gw",        kind: "impl", drift: true },
    { from: "payment",           to: "fraud-check",       kind: "gates", label: "gates" },
    { from: "adr-031",           to: "payment",           kind: "decides", dashed: true },
  ];

  window.MosaicData = { nodes, edges };

  // ─── Curve helper ─────────────────────────────────────────────────────
  // Two-control bezier that bows outward from the straight line. `lift` is
  // a unit offset (0 = straight, 1 = noticeable curl). Returns an SVG `d`.
  function curvePath(x1, y1, x2, y2, lift = 0.18) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    // perpendicular normal, rotated CCW (gives consistent bow direction)
    const nx = -dy / len;
    const ny = dx / len;
    const cx1 = x1 + dx * 0.33 + nx * len * lift;
    const cy1 = y1 + dy * 0.33 + ny * len * lift;
    const cx2 = x1 + dx * 0.66 + nx * len * lift;
    const cy2 = y1 + dy * 0.66 + ny * len * lift;
    return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  }
  window.curvePath = curvePath;

  // ─── Themeable mosaic graph ───────────────────────────────────────────
  // Props:
  //   theme:    { bg, edge, edgeMuted, edgeLabelBg, edgeLabelFg, type:
  //               { contract, useCase, aggregate, module, decision, actor } }
  //              each type entry: { fill, stroke, text, shape: "tile"|"rounded"|"hex"|"diamond"|"circle"|"marker" }
  //   width, height
  //   selectedId?      — id of currently selected node (gets ring)
  //   hoverId?         — id of currently hovered node (gets soft halo)
  //   showGrout?       — render grout grid underneath (mosaic motif)
  //   showTerritory?   — render territory fills behind clusters (cartographer)
  //   font?            — font-family for labels
  function MosaicGraph(props) {
    const {
      theme,
      width = 1200,
      height = 700,
      selectedId = "order",
      hoverId = "checkout-contract",
      showGrout = false,
      showTerritory = false,
      font = "Inter Tight, sans-serif",
      labelStyle = "inside", // 'inside' or 'below'
      data = window.MosaicData,
      onChangeId,
    } = props;

    const nodeById = React.useMemo(() => {
      const m = new Map();
      for (const n of data.nodes) m.set(n.id, n);
      return m;
    }, [data]);

    // Per-type renderer ────────────────────────────────────────────────
    function renderShape(n, typeStyle) {
      const { fill, stroke, shape } = typeStyle;
      const r = n.r;
      const cx = n.x;
      const cy = n.y;
      const sw = 1.4;
      // Tile (default for aggregate/contract): rotated rounded square
      switch (shape) {
        case "tile": {
          // square rotated 0° with rounded corners; ceramic feel
          const s = r * 1.7;
          return (
            <rect
              x={cx - s / 2}
              y={cy - s / 2}
              width={s}
              height={s}
              rx={Math.max(2, r * 0.16)}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          );
        }
        case "diamond": {
          const s = r * 1.5;
          return (
            <rect
              x={cx - s / 2}
              y={cy - s / 2}
              width={s}
              height={s}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              transform={`rotate(45 ${cx} ${cy})`}
            />
          );
        }
        case "hex": {
          const pts = [];
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
          }
          return (
            <polygon
              points={pts.join(" ")}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          );
        }
        case "rounded": {
          const w = r * 2.4;
          const h = r * 1.6;
          return (
            <rect
              x={cx - w / 2}
              y={cy - h / 2}
              width={w}
              height={h}
              rx={r * 0.7}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          );
        }
        case "marker": {
          // ADR pin — small chamfered square
          const s = r * 1.5;
          return (
            <g>
              <rect
                x={cx - s / 2}
                y={cy - s / 2}
                width={s}
                height={s}
                rx={3}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
                transform={`rotate(45 ${cx} ${cy})`}
              />
              <circle cx={cx} cy={cy} r={r * 0.32} fill={stroke} />
            </g>
          );
        }
        case "circle":
        default:
          return (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          );
      }
    }

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ display: "block", background: theme.bg, fontFamily: font }}
      >
        <defs>
          {/* arrowhead, two flavors */}
          <marker
            id="mg-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0,0 L 10,5 L 0,10 z" fill={theme.edge} />
          </marker>
          <marker
            id="mg-arrow-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0,0 L 10,5 L 0,10 z" fill={theme.edgeMuted} />
          </marker>
          {/* selection halo */}
          <filter id="mg-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Grout grid underneath — invisible structural mosaic */}
        {showGrout && (
          <g opacity={theme.groutOpacity ?? 0.5}>
            {Array.from({ length: Math.ceil(width / 48) + 1 }, (_, i) => (
              <line
                key={`gx${i}`}
                x1={i * 48}
                y1={0}
                x2={i * 48}
                y2={height}
                stroke={theme.grout || theme.edgeMuted}
                strokeWidth={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(height / 48) + 1 }, (_, i) => (
              <line
                key={`gy${i}`}
                x1={0}
                y1={i * 48}
                x2={width}
                y2={i * 48}
                stroke={theme.grout || theme.edgeMuted}
                strokeWidth={0.5}
              />
            ))}
          </g>
        )}

        {/* Territory fills (cartographer) */}
        {showTerritory && theme.territories && (
          <g>
            {theme.territories.map((t, i) => (
              <ellipse
                key={i}
                cx={t.cx}
                cy={t.cy}
                rx={t.rx}
                ry={t.ry}
                fill={t.fill}
                opacity={t.opacity ?? 0.18}
                transform={t.rotate ? `rotate(${t.rotate} ${t.cx} ${t.cy})` : undefined}
              />
            ))}
            {/* contour lines around the central territory for atlas vibe */}
            {theme.contours &&
              theme.contours.map((c, i) => (
                <ellipse
                  key={`c${i}`}
                  cx={c.cx}
                  cy={c.cy}
                  rx={c.rx}
                  ry={c.ry}
                  fill="none"
                  stroke={theme.contourStroke}
                  strokeWidth={0.6}
                  strokeDasharray="3 4"
                  opacity={0.4}
                  transform={c.rotate ? `rotate(${c.rotate} ${c.cx} ${c.cy})` : undefined}
                />
              ))}
          </g>
        )}

        {/* Edges */}
        <g>
          {data.edges.map((e, i) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;
            const lift = e.kind === "decides" ? 0.34 : 0.18;
            const d = curvePath(a.x, a.y, b.x, b.y, lift);
            const muted = e.kind === "impl" || e.kind === "reads";
            const stroke = muted ? theme.edgeMuted : theme.edge;
            const sw = e.kind === "derives" || e.kind === "shapes" ? 1.8 : 1.3;
            const dashed = e.dashed || e.kind === "decides";
            // mid-edge label position (approximation via quarter-bezier eval)
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 8;
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dashed ? "5 5" : undefined}
                  markerEnd={muted ? "url(#mg-arrow-muted)" : "url(#mg-arrow)"}
                  opacity={e.drift ? 0.55 : 0.92}
                />
                {e.label && (
                  <g>
                    <rect
                      x={mx - 28}
                      y={my - 8}
                      width={56}
                      height={16}
                      rx={3}
                      fill={theme.edgeLabelBg}
                    />
                    <text
                      x={mx}
                      y={my + 3}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily={theme.monoFont || "JetBrains Mono, monospace"}
                      fill={theme.edgeLabelFg}
                      style={{ letterSpacing: "0.04em" }}
                    >
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {data.nodes.map((n) => {
            const ts = theme.type[n.type];
            if (!ts) return null;
            const isSelected = n.id === selectedId;
            const isHovered = n.id === hoverId;
            return (
              <g key={n.id} style={{ cursor: "pointer" }} onClick={() => onChangeId && onChangeId(n.id)}>
                {/* hover halo */}
                {isHovered && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r * 1.8}
                    fill={ts.fill}
                    opacity={0.18}
                    filter="url(#mg-halo)"
                  />
                )}
                {/* selection ring */}
                {isSelected && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 8}
                    fill="none"
                    stroke={theme.selection || ts.stroke}
                    strokeWidth={1.5}
                    strokeDasharray="2 3"
                  />
                )}
                {/* frozen badge ring */}
                {n.frozen && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + 4}
                    fill="none"
                    stroke={theme.frozen || ts.stroke}
                    strokeWidth={1}
                    opacity={0.85}
                  />
                )}
                {/* drift indicator (small dot at top-right) */}
                {n.drift && (
                  <circle
                    cx={n.x + n.r * 0.78}
                    cy={n.y - n.r * 0.78}
                    r={3.5}
                    fill={theme.drift || "#c44434"}
                  />
                )}
                {renderShape(n, ts)}
                {/* label */}
                {labelStyle === "inside" ? (
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    fontSize={n.type === "actor" || n.type === "module" || n.type === "decision" ? "9.5" : "11"}
                    fontFamily={font}
                    fontWeight={600}
                    fill={ts.text}
                    style={{ pointerEvents: "none", letterSpacing: "0.01em" }}
                  >
                    {n.label}
                  </text>
                ) : (
                  <text
                    x={n.x}
                    y={n.y + n.r + 14}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily={font}
                    fontWeight={500}
                    fill={theme.labelBelow || ts.text}
                    style={{ pointerEvents: "none" }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  }
  window.MosaicGraph = MosaicGraph;

  // ─── Logomark used in shells ──────────────────────────────────────────
  // A subtle four-tile mark that reads as both 'mosaic' and 'T'.
  function Logomark({ size = 22, fg = "#1a1d24", bg = "transparent" }) {
    const s = size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" style={{ background: bg }}>
        <rect x="2"  y="2"  width="9" height="9" rx="1" fill={fg} opacity="0.25" />
        <rect x="13" y="2"  width="9" height="9" rx="1" fill={fg} opacity="0.55" />
        <rect x="2"  y="13" width="9" height="9" rx="1" fill={fg} opacity="0.55" />
        <rect x="13" y="13" width="9" height="9" rx="1" fill={fg} />
      </svg>
    );
  }
  window.Logomark = Logomark;

  // ─── Window chrome (macOS-style traffic lights) ───────────────────────
  function WindowChrome({ tint = "#cfcfcf" }) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57", opacity: 0.85 }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e", opacity: 0.85 }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840", opacity: 0.85 }} />
      </div>
    );
  }
  window.WindowChrome = WindowChrome;

  // ─── Tile motif strip — a horizontal frieze used in shells/headers ────
  function TileFrieze({ palette = ["#444", "#666", "#888"], opacity = 0.18, count = 64 }) {
    const tiles = [];
    for (let i = 0; i < count; i++) {
      tiles.push(
        <rect
          key={i}
          x={i * 12}
          y={i % 2 === 0 ? 0 : 2}
          width={10}
          height={10}
          rx={1}
          fill={palette[i % palette.length]}
        />
      );
    }
    return (
      <svg width="100%" height="14" viewBox={`0 0 ${count * 12} 14`} opacity={opacity}>
        {tiles}
      </svg>
    );
  }
  window.TileFrieze = TileFrieze;
})();
