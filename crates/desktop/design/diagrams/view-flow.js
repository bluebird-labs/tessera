/* Tessera · view-flow.js — request→response flow, caller's POV.
 * "Book a stay" travels down through layered lanes (Actor → Edge → App →
 * Domain → Infra) and the response climbs back to a 201. The happy path is a
 * glowing animated spine; two error branches (409, 402) peel off in coral.
 * Steps keep their type colour, so a contract is indigo here exactly as in the
 * domain graph. Selecting a step drives the inspector.
 */
(function () {
  "use strict";
  const VC = window.VizCore;
  const { C, TYPE, curve } = VC;
  const D = window.AtlasData.flow;

  const stepById = new Map(D.steps.map((s) => [s.id, s]));
  const laneIndex = new Map(D.lanes.map((l, i) => [l.id, i]));
  const SW = 138, SH = 46;        // step box
  const adj = {};
  D.edges.forEach((e) => { (adj[e.from] = adj[e.from] || []).push(e.to); (adj[e.to] = adj[e.to] || []).push(e.from); });

  // sequence column for each step (x slot). Terminals share branch columns.
  const COL = { "s-traveler": 0, "s-api": 1, "s-book": 2, "s-avail": 3, "s-price": 4, "s-resv": 5, "s-pay": 6, "s-repo": 7, "s-201": 8, "s-409": 3, "s-402": 6 };

  function describe(id) {
    const s = stepById.get(id);
    if (!s) return null;
    const t = TYPE[s.type];
    const lane = D.lanes[laneIndex.get(s.lane)];
    const badges = [];
    if (s.terminal === "ok") badges.push({ label: "RESPONSE 2XX", color: C.lime, bg: "rgba(163,230,53,0.14)" });
    if (s.terminal === "err") badges.push({ label: "ERROR PATH", color: C.coral, bg: "rgba(251,113,133,0.14)" });
    if (s.drift) badges.push({ label: "DRIFT", color: C.coral, bg: "rgba(251,113,133,0.14)" });
    const ins = D.edges.filter((e) => e.to === id).map((e) => ({ label: stepById.get(e.from).label, color: TYPE[stepById.get(e.from).type].glow, kind: (e.label || "→") + (e.path === "err" ? " · err" : ""), target: e.from }));
    const outs = D.edges.filter((e) => e.from === id).map((e) => ({ label: stepById.get(e.to).label, color: TYPE[stepById.get(e.to).type].glow, kind: (e.label || "→") + (e.path === "err" ? " · err" : ""), target: e.to }));
    return {
      type: s.type, typeLabel: t.label, title: s.label, accent: s.terminal === "err" ? C.coral : t.glow,
      id: `step ${s.seq || "—"} · ${s.id}`,
      badges,
      sections: [
        { title: "Step", props: [
          { k: "lane", v: lane.label },
          { k: "kind", v: t.label },
          { k: "detail", v: s.sub || "—", mono: true, color: C.cyanHi },
          { k: "sequence", v: s.seq ? "#" + s.seq : "entry/exit", mono: true },
        ] },
        ins.length ? { title: "Called by", rels: ins } : null,
        outs.length ? { title: "Calls", rels: outs } : null,
      ].filter(Boolean),
      actions: [{ label: "Trace", kind: "primary" }, { label: "Logs", kind: "ghost" }],
    };
  }

  function outliner() {
    const seq = D.steps.filter((s) => s.seq).sort((a, b) => a.seq.localeCompare(b.seq));
    return [
      { section: "Call sequence", rows: seq.map((s) => ({
        id: s.id, label: s.seq + " · " + s.label, color: TYPE[s.type].glow, sub: s.sub,
        badge: s.drift ? { label: "drift", color: C.coral } : null,
      })) },
      { section: "Outcomes", rows: D.steps.filter((s) => s.terminal).map((s) => ({
        id: s.id, label: s.label, color: s.terminal === "ok" ? C.lime : C.coral,
        badge: { label: s.terminal === "ok" ? "2xx" : "err", color: s.terminal === "ok" ? C.lime : C.coral },
      })) },
    ];
  }

  function render(ctx) {
    const { svg, width, height, layout, select } = ctx;
    const vertical = (layout === "vertical");
    const root = svg.append("g").attr("class", "flow-root");
    const laneLayer = root.append("g");
    const edgeLayer = root.append("g");
    const stepLayer = root.append("g");

    const LBL = 120;                       // lane-label gutter
    const nLanes = D.lanes.length, nCols = 9;
    // fixed virtual layout space → fit() scales to whatever the canvas is, so
    // steps never overlap regardless of pane width.
    const colW = 158, laneH = 122;
    const VW = vertical ? (nLanes * laneH + LBL) : (LBL + nCols * colW + 30);
    const VH = vertical ? (40 + nCols * 86) : (40 + nLanes * laneH);
    const innerW = VW - LBL - 40, innerH = VH - 40;
    const laneSpan = (vertical ? innerW : innerH) / nLanes;
    const colSpan = (vertical ? innerH : innerW) / nCols;

    // position: along = sequence axis, cross = lane axis
    function place(s) {
      const lane = laneIndex.get(s.lane);
      const col = COL[s.id];
      let cross = laneSpan * (lane + 0.5);
      const along = colSpan * (col + 0.5);
      // nudge error terminals off their lane center so they don't collide
      let crossAdj = cross;
      if (s.terminal === "err") crossAdj = cross + (vertical ? 0 : laneSpan * 0.55) + (vertical ? laneSpan * 0.0 : 0);
      if (vertical) return { x: LBL + 40 + crossAdj, y: 20 + along };
      return { x: LBL + 20 + along, y: 20 + crossAdj };
    }
    const steps = D.steps.map((s) => Object.assign({}, s, place(s)));
    const pById = new Map(steps.map((s) => [s.id, s]));

    // ── lane bands + labels ──
    D.lanes.forEach((l, i) => {
      const g = laneLayer.append("g");
      if (vertical) {
        const x = LBL + 40 + laneSpan * i;
        g.append("rect").attr("x", x).attr("y", 12).attr("width", laneSpan).attr("height", innerH + 8).attr("fill", i % 2 ? "rgba(255,255,255,0.018)" : "transparent");
        g.append("text").attr("x", x + laneSpan / 2).attr("y", 28).attr("text-anchor", "middle").attr("font-family", "var(--font-mono)").attr("font-size", 9.5).attr("letter-spacing", "0.16em").attr("fill", C.textMute).text(l.label.toUpperCase());
      } else {
        const y = 20 + laneSpan * i;
        g.append("rect").attr("x", LBL).attr("y", y).attr("width", innerW + 40).attr("height", laneSpan).attr("fill", i % 2 ? "rgba(255,255,255,0.018)" : "transparent");
        g.append("line").attr("x1", LBL).attr("y1", y).attr("x2", VW - 20).attr("y2", y).attr("stroke", C.line).attr("stroke-width", 1);
        g.append("text").attr("x", 16).attr("y", y + laneSpan / 2 + 4).attr("font-family", "var(--font-mono)").attr("font-size", 9.5).attr("letter-spacing", "0.14em").attr("fill", C.textMute).text(l.label.toUpperCase());
      }
    });

    // ── edges ──
    function edgePath(e) {
      const a = pById.get(e.from), b = pById.get(e.to);
      const ax = a.x, ay = a.y, bx = b.x, by = b.y;
      return curve(ax, ay, bx, by, 0.12);
    }
    const edgeSel = edgeLayer.selectAll("g.fe").data(D.edges).enter().append("g");
    edgeSel.append("path").attr("class", "base").attr("fill", "none")
      .attr("d", edgePath)
      .attr("stroke", (e) => e.path === "err" ? C.coral : (e.drift ? C.coral : "rgba(255,255,255,0.5)"))
      .attr("stroke-width", (e) => e.path === "happy" ? 2 : 1.3)
      .attr("stroke-dasharray", (e) => e.path === "err" || e.drift ? "5 5" : null)
      .attr("opacity", (e) => e.path === "err" ? 0.7 : 0.92)
      .attr("marker-end", (e) => e.path === "err" || e.drift ? "url(#arrowCoral)" : "url(#arrow)");
    // animated flow overlay on the happy spine
    edgeSel.filter((e) => e.path === "happy" && !e.drift).append("path").attr("class", "flow-anim").attr("fill", "none")
      .attr("d", edgePath).attr("stroke", C.cyanHi).attr("stroke-width", 2).attr("stroke-linecap", "round")
      .attr("stroke-dasharray", "1 13").attr("opacity", 0.9).style("filter", `drop-shadow(0 0 4px ${C.cyan})`);
    // edge labels
    edgeSel.filter((e) => e.label).each(function (e) {
      const a = pById.get(e.from), b = pById.get(e.to);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const g = d3.select(this);
      const w = e.label.length * 6 + 14;
      g.append("rect").attr("x", mx - w / 2).attr("y", my - 9).attr("width", w).attr("height", 17).attr("rx", 8.5).attr("fill", C.surface2).attr("stroke", e.path === "err" ? C.coral + "66" : C.line).attr("stroke-width", 0.6);
      g.append("text").attr("x", mx).attr("y", my + 3).attr("text-anchor", "middle").attr("font-family", "var(--font-mono)").attr("font-size", 9).attr("fill", e.path === "err" ? C.coral : C.textDim).text(e.label);
    });

    // ── step nodes ──
    const step = stepLayer.selectAll("g.step").data(steps, (d) => d.id).enter().append("g")
      .attr("class", "step").style("cursor", "pointer").attr("transform", (d) => `translate(${d.x},${d.y})`);

    step.each(function (s) {
      const g = d3.select(this);
      const t = TYPE[s.type];
      const err = s.terminal === "err", ok = s.terminal === "ok";
      g.append("rect").attr("class", "sel-ring").attr("x", -SW / 2 - 5).attr("y", -SH / 2 - 5).attr("width", SW + 10).attr("height", SH + 10).attr("rx", 13).attr("fill", "none").attr("stroke", "none");
      const box = g.append("rect").attr("class", "box").attr("x", -SW / 2).attr("y", -SH / 2).attr("width", SW).attr("height", SH).attr("rx", 10);
      if (s.type === "actor") box.attr("fill", "#13152a").attr("stroke", C.lineHi).attr("stroke-width", 1.4);
      else if (err) box.attr("fill", "rgba(251,113,133,0.10)").attr("stroke", C.coral).attr("stroke-width", 1.3);
      else if (s.type === "module") box.attr("fill", "#1a1d2e").attr("stroke", C.lineHi).attr("stroke-width", 1).style("filter", "drop-shadow(0 6px 16px rgba(0,0,0,0.4))");
      else box.attr("fill", `url(#grad-${s.type})`).attr("stroke", "rgba(255,255,255,0.4)").attr("stroke-width", 1.1).style("filter", `drop-shadow(0 6px 18px ${t.glow}55)`);
      if (ok) g.append("rect").attr("x", -SW / 2 - 4).attr("y", -SH / 2 - 4).attr("width", SW + 8).attr("height", SH + 8).attr("rx", 13).attr("fill", "none").attr("stroke", C.lime).attr("stroke-width", 1.2).attr("stroke-dasharray", "4 3").attr("opacity", 0.85);
      // seq badge
      if (s.seq) {
        g.append("circle").attr("cx", -SW / 2 + 2).attr("cy", -SH / 2 + 2).attr("r", 10).attr("fill", C.canvas).attr("stroke", err ? C.coral : t.glow).attr("stroke-width", 1.3);
        g.append("text").attr("x", -SW / 2 + 2).attr("y", -SH / 2 + 5.5).attr("text-anchor", "middle").attr("font-family", "var(--font-mono)").attr("font-size", 9).attr("font-weight", 600).attr("fill", err ? C.coral : t.glow).text(s.seq);
      }
      const fg = (s.type === "module" || s.type === "actor") ? C.text : err ? C.coral : t.text;
      g.append("text").attr("x", 0).attr("y", s.sub ? -2 : 4).attr("text-anchor", "middle").attr("font-family", "var(--font-sans)").attr("font-size", 12.5).attr("font-weight", 600).attr("fill", fg).text(s.label);
      if (s.sub) g.append("text").attr("x", 0).attr("y", 12).attr("text-anchor", "middle").attr("font-family", "var(--font-mono)").attr("font-size", 8.5).attr("fill", (s.type === "module" || s.type === "actor") ? C.textMute : "rgba(255,255,255,0.7)").text(s.sub);
      if (s.drift) g.append("circle").attr("cx", SW / 2 - 6).attr("cy", -SH / 2 + 6).attr("r", 4).attr("fill", C.coral).style("filter", `drop-shadow(0 0 6px ${C.coral})`);
    });

    step.on("click", (ev, s) => { ev.stopPropagation(); select(s.id); });
    svg.on("click", () => select(null));

    applyTiers(ctx.selectedId);
    function applyTiers(selId) {
      const tier = VC.computeTiers(steps.map((s) => s.id), adj, selId);
      step.transition().duration(300).style("opacity", (s) => {
        if (!selId) return 1;
        const t = tier[s.id];
        return t === "ghost" ? 0.32 : t === "mid" ? 0.78 : 1;
      });
      step.select(".sel-ring").attr("stroke", (s) => s.id === selId ? C.lime : "none").attr("stroke-width", 1.6).attr("stroke-dasharray", "4 3");
      edgeSel.selectAll(".base").transition().duration(300).attr("opacity", function () {
        const e = d3.select(this.parentNode).datum();
        if (!selId) return e.path === "err" ? 0.7 : 0.92;
        return (e.from === selId || e.to === selId) ? 1 : 0.18;
      });
    }

    const z = VC.attachZoom(svg, root, { scaleExtent: [0.4, 2.2] });
    function fit(animate) {
      const xs = steps.map((s) => s.x), ys = steps.map((s) => s.y);
      const minX = Math.min(...xs) - SW / 2 - 30, maxX = Math.max(...xs) + SW / 2 + 30;
      const minY = Math.min(...ys) - SH - 24, maxY = Math.max(...ys) + SH + 24;
      const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.25) * 0.97;
      const t = d3.zoomIdentity.translate(width / 2 - k * (minX + maxX) / 2, height / 2 - k * (minY + maxY) / 2).scale(k);
      if (animate) svg.transition().duration(450).call(z.zoom.transform, t); else svg.call(z.zoom.transform, t);
    }
    fit(false);

    return { highlight: applyTiers, fit: () => fit(true), zoomBy: (f) => svg.transition().duration(200).call(z.zoom.scaleBy, f) };
  }

  window.TesseraViews = window.TesseraViews || {};
  window.TesseraViews.flow = {
    id: "flow", label: "Flows", crumb: "Flow",
    eyebrow: "Request → response", title: "Book a stay",
    stageTitle: "Flow · Book a stay", stageMeta: `8 steps · happy path + 2 error branches · <span style="color:var(--coral)">1 drift</span>`,
    defaultLayout: "horizontal",
    layouts: [{ id: "horizontal", label: "horizontal" }, { id: "vertical", label: "vertical" }],
    filters: [],
    filterHint: "follow the glowing spine · click a step to trace it",
    legendTitle: "Path",
    legend: [
      { glyph: '<span style="color:#5be7f5">━</span>', label: "Happy path (animated)" },
      { glyph: '<span style="color:#fb7185">┄</span>', label: "Error branch" },
      { glyph: '<span style="color:#a3e635">◌</span>', label: "2xx response" },
      { glyph: '<span style="color:#fb7185">●</span>', label: "Contract drift" },
    ],
    outliner, describe, render,
  };
})();
