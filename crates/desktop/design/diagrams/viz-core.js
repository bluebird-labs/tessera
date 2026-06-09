/* Tessera · viz-core.js
 * ─────────────────────────────────────────────────────────────────────────
 * The shared graphical grammar every view obeys. If a rule about color,
 * shape, edges, depth tiers, badges, or selection lives anywhere, it lives
 * here — so the Domain graph, the ERD and the Flow diagram all speak the
 * same language. Views import these helpers; they never re-invent them.
 */
(function () {
  "use strict";

  // ─── Palette (mirrors tokens.css; duplicated as JS for D3 fills) ────────
  const C = {
    canvas:   "#07080f",
    surface0: "#0e0f1a",
    surface2: "#1a1d2e",
    surface3: "#222640",
    line:     "rgba(255,255,255,0.06)",
    lineHi:   "rgba(255,255,255,0.12)",
    text:     "#f5f6fb",
    textDim:  "rgba(245,246,251,0.66)",
    textMute: "rgba(245,246,251,0.38)",
    indigo:   "#5b6bff", indigoHi:  "#7d8aff",
    magenta:  "#ff4d8c", magentaHi: "#ff7ba9",
    cyan:     "#22d3ee", cyanHi:    "#5be7f5",
    lime:     "#a3e635", limeHi:    "#c0ee72",
    violet:   "#a855f7", violetHi:  "#c084fc",
    amber:    "#fb923c",
    coral:    "#fb7185",
  };

  // ─── type → visual identity (color is bound to type forever) ────────────
  // from/to = radial gradient stops; glow = halo tint; shape = default form.
  const TYPE = {
    contract:  { from: C.indigo,   to: C.violet,   glow: C.indigo,  stroke: C.indigoHi,  text: "#fff",    shape: "tile",    label: "contract"  },
    useCase:   { from: C.cyan,     to: C.indigo,   glow: C.cyan,    stroke: C.cyanHi,    text: "#02141a", shape: "tile",    label: "use case"  },
    aggregate: { from: C.magenta,  to: C.coral,    glow: C.magenta, stroke: C.magentaHi, text: "#fff",    shape: "tile",    label: "aggregate" },
    entity:    { from: C.magenta,  to: C.magenta,  glow: C.magenta, stroke: C.magentaHi, text: "#fff",    shape: "circle",  label: "entity"    },
    value:     { from: "none",     to: "none",     glow: C.magenta, stroke: C.magentaHi, text: C.magentaHi, shape: "value", label: "value object" },
    module:    { from: C.surface3, to: C.surface2, glow: C.lineHi,  stroke: C.lineHi,    text: C.textDim, shape: "rounded", label: "module"    },
    decision:  { from: C.violet,   to: C.magenta,  glow: C.violet,  stroke: C.violetHi,  text: "#fff",    shape: "marker",  label: "decision"  },
    actor:     { from: C.surface3, to: C.surface3, glow: C.lineHi,  stroke: C.lineHi,    text: C.text,    shape: "actor",   label: "actor"     },
  };

  const STATE = {
    frozen:   C.lime,
    drafting: C.amber,
    locked:   C.textMute,
    drift:    C.coral,
  };

  const HUE = { magenta: C.magenta, cyan: C.cyan, violet: C.violet, amber: C.amber, indigo: C.indigo, lime: C.lime };

  // ─── curve helper — quadratic-ish bezier that bows outward ──────────────
  function curve(x1, y1, x2, y2, lift) {
    if (lift == null) lift = 0.16;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const cx1 = x1 + dx * 0.33 + nx * len * lift;
    const cy1 = y1 + dy * 0.33 + ny * len * lift;
    const cx2 = x1 + dx * 0.66 + nx * len * lift;
    const cy2 = y1 + dy * 0.66 + ny * len * lift;
    return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  }

  // orthogonal elbow (used by ERD relationships) — exits sides, not centers
  function elbow(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  }

  // ─── shared <defs>: gradients, glow, blur, arrowheads, vignette ─────────
  function injectDefs(svg) {
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");
    defs.selectAll("*").remove();

    Object.entries(TYPE).forEach(([k, v]) => {
      if (v.from === "none") return;
      const g = defs.append("radialGradient").attr("id", `grad-${k}`).attr("cx", "35%").attr("cy", "28%").attr("r", "85%");
      g.append("stop").attr("offset", "0%").attr("stop-color", v.from);
      g.append("stop").attr("offset", "100%").attr("stop-color", v.to);
    });

    const glow = defs.append("filter").attr("id", "glow").attr("x", "-120%").attr("y", "-120%").attr("width", "340%").attr("height", "340%");
    glow.append("feGaussianBlur").attr("stdDeviation", "9");

    const bMid = defs.append("filter").attr("id", "blurMid").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    bMid.append("feGaussianBlur").attr("stdDeviation", "0.5");
    const bGhost = defs.append("filter").attr("id", "blurGhost").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    bGhost.append("feGaussianBlur").attr("stdDeviation", "1.5");

    [["arrow", "rgba(255,255,255,0.55)"], ["arrowMuted", "rgba(255,255,255,0.18)"], ["arrowCoral", C.coral], ["arrowLime", C.lime]].forEach(([id, fill]) => {
      const m = defs.append("marker").attr("id", id).attr("viewBox", "0 0 10 10").attr("refX", 8.5).attr("refY", 5)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto-start-reverse");
      m.append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", fill);
    });
  }

  // ─── depth-of-field tiers ───────────────────────────────────────────────
  // Given a selectedId and an adjacency map, classify every node into one of
  // focus / mid / ghost by graph distance. This is THE move that makes the
  // language feel alive and consistent: what you touch glows, the rest fades.
  function computeTiers(ids, adjacency, selectedId) {
    const tier = {};
    if (!selectedId || !adjacency[selectedId]) {
      // nothing selected → everything is focus (flat, legible default)
      ids.forEach((id) => (tier[id] = "focus"));
      return tier;
    }
    const dist = {};
    const q = [selectedId];
    dist[selectedId] = 0;
    while (q.length) {
      const cur = q.shift();
      (adjacency[cur] || []).forEach((nb) => {
        if (dist[nb] === undefined) { dist[nb] = dist[cur] + 1; q.push(nb); }
      });
    }
    ids.forEach((id) => {
      const d = dist[id];
      tier[id] = d === undefined ? "ghost" : d <= 1 ? "focus" : d === 2 ? "mid" : "ghost";
    });
    return tier;
  }

  const TIER_STYLE = {
    focus: { opacity: 1,    scale: 1,    label: 1 },
    mid:   { opacity: 0.62, scale: 0.82, label: 0.6 },
    ghost: { opacity: 0.2,  scale: 0.6,  label: 0 },
  };

  // ─── node shape renderer (used by Domain graph) ─────────────────────────
  // Appends the shape for a node into selection `g` (a <g> already positioned).
  function drawNode(g, n, r) {
    const t = TYPE[n.type];
    const id = `grad-${n.type}`;
    if (n.type === "decision") {
      g.append("rect").attr("x", -r * 0.82).attr("y", -r * 0.82).attr("width", r * 1.64).attr("height", r * 1.64)
        .attr("rx", 5).attr("transform", "rotate(45)")
        .attr("fill", `url(#${id})`).attr("stroke", "rgba(255,255,255,0.5)").attr("stroke-width", 1.2)
        .style("filter", `drop-shadow(0 5px 16px ${t.glow}88)`);
    } else if (n.type === "actor") {
      g.append("circle").attr("r", r).attr("fill", n.ext ? "transparent" : C.surface2)
        .attr("stroke", t.stroke).attr("stroke-width", 1.5).attr("stroke-dasharray", n.ext ? "3 3" : null);
      g.append("circle").attr("r", r * 0.34).attr("cy", -r * 0.12).attr("fill", C.text).attr("opacity", 0.85);
      g.append("path").attr("d", `M ${-r * 0.5} ${r * 0.55} Q 0 ${-r * 0.1} ${r * 0.5} ${r * 0.55}`)
        .attr("fill", "none").attr("stroke", C.text).attr("stroke-width", 1.4).attr("opacity", 0.85);
    } else if (n.type === "value") {
      // identity-LESS: hollow dashed rounded chip, no fill
      g.append("rect").attr("x", -r * 0.95).attr("y", -r * 0.62).attr("width", r * 1.9).attr("height", r * 1.24)
        .attr("rx", r * 0.34).attr("fill", "rgba(255,77,140,0.06)")
        .attr("stroke", t.stroke).attr("stroke-width", 1.2).attr("stroke-dasharray", "4 3");
    } else if (t.shape === "tile") {
      const s = r * 1.74;
      g.append("rect").attr("x", -s / 2).attr("y", -s / 2).attr("width", s).attr("height", s)
        .attr("rx", Math.max(3, r * 0.2)).attr("fill", `url(#${id})`)
        .attr("stroke", "rgba(255,255,255,0.42)").attr("stroke-width", 1.2)
        .style("filter", `drop-shadow(0 6px 18px ${t.glow}66)`);
    } else if (t.shape === "rounded") {
      const w = r * 2.3, h = r * 1.5;
      g.append("rect").attr("x", -w / 2).attr("y", -h / 2).attr("width", w).attr("height", h)
        .attr("rx", r * 0.5).attr("fill", `url(#${id})`).attr("stroke", t.stroke).attr("stroke-width", 1.1);
    } else {
      g.append("circle").attr("r", r).attr("fill", `url(#${id})`)
        .attr("stroke", "rgba(255,255,255,0.42)").attr("stroke-width", 1.1)
        .style("filter", `drop-shadow(0 5px 14px ${t.glow}55)`);
    }
  }

  // selection halo + lime "yours to act on" ring
  function drawSelectionRing(g, r, glow) {
    g.append("circle").attr("class", "sel-halo").attr("r", r * 2.3).attr("fill", glow).attr("opacity", 0.3).attr("filter", "url(#glow)");
    g.append("circle").attr("class", "sel-ring").attr("r", r + 9).attr("fill", "none").attr("stroke", C.lime).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 3");
  }

  // ─── d3-zoom wiring shared by every view ────────────────────────────────
  function attachZoom(svg, viewport, opts) {
    opts = opts || {};
    const zoom = d3.zoom().scaleExtent(opts.scaleExtent || [0.35, 3])
      .on("zoom", (ev) => viewport.attr("transform", ev.transform));
    svg.call(zoom).on("dblclick.zoom", null);
    if (opts.initial) svg.call(zoom.transform, opts.initial);
    return { zoom, reset: (t) => svg.transition().duration(500).call(zoom.transform, t || d3.zoomIdentity) };
  }

  // build an undirected adjacency map from {from,to} edges
  function adjacencyOf(edges) {
    const adj = {};
    edges.forEach((e) => {
      (adj[e.from] = adj[e.from] || []).push(e.to);
      (adj[e.to] = adj[e.to] || []).push(e.from);
    });
    return adj;
  }

  window.VizCore = {
    C, TYPE, STATE, HUE, TIER_STYLE,
    curve, elbow, injectDefs, computeTiers, drawNode, drawSelectionRing,
    attachZoom, adjacencyOf,
  };
})();
