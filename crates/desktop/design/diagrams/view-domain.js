/* Tessera · view-domain.js — DDD domain graph.
 * A live d3-force graph. Bounded contexts are drawn as soft territory hulls;
 * aggregates are tiles, entities circles, value objects hollow dashed chips,
 * use cases & contracts tiles in their bound hue. Selecting a node drives the
 * focus / mid / ghost depth tiers and the inspector.
 */
(function () {
  "use strict";
  const VC = window.VizCore;
  const { C, TYPE, STATE, HUE, TIER_STYLE, curve, drawNode, drawSelectionRing } = VC;
  const D = window.AtlasData.domain;

  const R = { aggregate: 27, contract: 22, useCase: 22, entity: 16, value: 17, decision: 19, actor: 18 };
  const radiusOf = (n) => R[n.type] || 18;

  const EDGE = {
    muted: new Set(["contains", "has", "reads"]),
    dashed: new Set(["decides", "syncs"]),
  };

  const adjacency = VC.adjacencyOf(D.edges);
  const nodeIndex = new Map(D.nodes.map((n) => [n.id, n]));

  // context centroids as fractions of canvas — actors live off to the left
  const CTX_POS = {
    booking:   { fx: 0.40, fy: 0.40 },
    inventory: { fx: 0.70, fy: 0.30 },
    billing:   { fx: 0.72, fy: 0.72 },
    reviews:   { fx: 0.40, fy: 0.78 },
  };

  function describe(id) {
    const n = nodeIndex.get(id);
    if (!n) return null;
    const t = TYPE[n.type];
    const ctx = D.contexts.find((c) => c.id === n.ctx);
    const badges = [];
    if (n.frozen) badges.push({ label: "FROZEN", color: C.lime, bg: "rgba(163,230,53,0.14)" });
    if (n.drift) badges.push({ label: "DRIFT", color: C.coral, bg: "rgba(251,113,133,0.14)" });
    if (n.ext) badges.push({ label: "EXTERNAL", color: C.textMute });

    const props = [{ k: "kind", v: t.label, mono: false }];
    if (ctx) props.push({ k: "context", v: ctx.label, color: HUE[ctx.hue] });
    if (n.type === "aggregate") props.push({ k: "root", v: n.root ? "true" : "false", mono: true, color: C.violet });
    if (n.type === "value") props.push({ k: "identity", v: "none · by value", mono: true, color: C.magentaHi });
    if (n.type === "contract") { props.push({ k: "version", v: n.label.split(" ").pop(), mono: true }); props.push({ k: "idempotent", v: "true", mono: true, color: C.violet }); }

    // relations from edges touching this node
    const rels = [];
    D.edges.forEach((e) => {
      if (e.from === id) {
        const o = nodeIndex.get(e.to);
        rels.push({ label: o.label, color: TYPE[o.type].glow, kind: e.kind, target: o.id });
      } else if (e.to === id) {
        const o = nodeIndex.get(e.from);
        rels.push({ label: o.label, color: TYPE[o.type].glow, kind: "← " + e.kind, target: o.id });
      }
    });

    return {
      type: n.type, typeLabel: t.label, title: n.label,
      id: `node:${n.type}@${id}`,
      badges,
      sections: [
        { title: "Schema", props },
        { title: `Relations · ${rels.length}`, rels },
      ],
      actions: n.type === "contract"
        ? [{ label: "Re-derive", kind: "primary" }, { label: "Open", kind: "" }]
        : [{ label: "Edit", kind: "primary" }, { label: "History", kind: "ghost" }],
    };
  }

  function outliner() {
    const grps = [{ section: "Bounded contexts", rows: [] }];
    D.contexts.forEach((c) => {
      grps[0].rows.push({ id: null, label: c.label, color: HUE[c.hue],
        sub: D.nodes.filter((n) => n.ctx === c.id).length + " elements" });
    });
    const agg = { section: "Aggregates", rows: D.nodes.filter((n) => n.type === "aggregate").map((n) => ({
      id: n.id, label: n.label, color: C.magenta,
      sub: n.root ? "root" : "",
      badge: n.drift ? { label: "drift", color: C.coral } : (n.frozen ? { label: "frozen", color: C.lime } : null),
    })) };
    const con = { section: "Contracts", rows: D.nodes.filter((n) => n.type === "contract").map((n) => ({
      id: n.id, label: n.label, color: C.indigo, badge: { label: "frozen", color: C.lime },
    })) };
    return [grps[0], agg, con];
  }

  let sim = null;

  function render(ctx) {
    const { svg, width, height, layout, disabledTypes, select } = ctx;
    const VW = 1200, VH = 740; // fixed virtual layout space; fit() scales it to the canvas
    const layoutMode = layout || "contexts";
    const root = svg.append("g").attr("class", "domain-root");
    const hullLayer = root.append("g");
    const edgeLayer = root.append("g");
    const nodeLayer = root.append("g");

    // spotlight wash under the focus area
    svg.insert("rect", ":first-child").attr("width", width).attr("height", height).attr("fill", "transparent");

    // build working copies
    const nodes = D.nodes
      .filter((n) => !disabledTypes.has(n.type))
      .map((n) => Object.assign({}, n, nodeIndex.get(n.id).__pos || {}));
    const visible = new Set(nodes.map((n) => n.id));
    const links = D.edges
      .filter((e) => visible.has(e.from) && visible.has(e.to))
      .map((e) => Object.assign({}, e, { source: e.from, target: e.to }));

    // seed positions near context centroid (stable, avoids fly-in)
    nodes.forEach((n) => {
      if (n.x == null) {
        const p = CTX_POS[n.ctx] || { fx: 0.12, fy: 0.5 };
        n.x = p.fx * VW + (Math.random() - 0.5) * 80;
        n.y = p.fy * VH + (Math.random() - 0.5) * 80;
        if (!n.ctx) { n.x = 0.1 * VW + (Math.random() - 0.5) * 40; n.y = (0.3 + Math.random() * 0.5) * VH; }
      }
    });

    if (sim) sim.stop();
    sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id)
        .distance((l) => (l.kind === "contains" || l.kind === "has" ? 64 : 116))
        .strength((l) => (l.kind === "references" ? 0.25 : 0.7)))
      .force("charge", d3.forceManyBody().strength(-560))
      .force("collide", d3.forceCollide().radius((d) => radiusOf(d) + 26))
      .alphaDecay(0.045);

    if (layoutMode === "contexts") {
      sim.force("x", d3.forceX((d) => (CTX_POS[d.ctx] ? CTX_POS[d.ctx].fx * VW : 0.1 * VW)).strength((d) => (d.ctx ? 0.34 : 0.18)))
         .force("y", d3.forceY((d) => (CTX_POS[d.ctx] ? CTX_POS[d.ctx].fy * VH : 0.5 * VH)).strength((d) => (d.ctx ? 0.34 : 0.12)));
    } else if (layoutMode === "radial") {
      const ring = { contract: 110, aggregate: 200, useCase: 200, entity: 290, value: 290, decision: 90, actor: 340, module: 290 };
      sim.force("r", d3.forceRadial((d) => ring[d.type] || 250, VW / 2, VH / 2).strength(0.55))
         .force("x", d3.forceX(VW / 2).strength(0.02)).force("y", d3.forceY(VH / 2).strength(0.02));
    } else {
      sim.force("center", d3.forceCenter(VW / 2, VH / 2))
         .force("x", d3.forceX(VW / 2).strength(0.03)).force("y", d3.forceY(VH / 2).strength(0.03));
    }

    // settle synchronously so the first paint is calm
    sim.alpha(1);
    for (let i = 0; i < 300; i++) sim.tick();
    sim.stop();
    // cache positions for layout switches
    nodes.forEach((n) => { nodeIndex.get(n.id).__pos = { x: n.x, y: n.y }; });

    // ── edges ──
    const linkSel = edgeLayer.selectAll("g.edge").data(links).enter().append("g").attr("class", "edge");
    linkSel.append("path").attr("class", "edge-path").attr("fill", "none");
    const labeled = linkSel.filter((d) => d.label);
    labeled.append("rect").attr("class", "edge-lbl-bg").attr("height", 16).attr("rx", 8).attr("fill", C.surface2).attr("stroke", C.line).attr("stroke-width", 0.5);
    labeled.append("text").attr("class", "edge-lbl").attr("text-anchor", "middle").attr("font-family", "var(--font-mono)").attr("font-size", 9.5).attr("fill", C.textDim).attr("dy", 3).text((d) => d.label);

    // ── context hulls ──
    function drawHulls() {
      const data = D.contexts.map((c) => {
        const pts = nodes.filter((n) => n.ctx === c.id).map((n) => [n.x, n.y]);
        return { c, pts };
      }).filter((d) => d.pts.length >= 2);
      const sel = hullLayer.selectAll("g.hull").data(data, (d) => d.c.id);
      const enter = sel.enter().append("g").attr("class", "hull");
      enter.append("path");
      enter.append("text").attr("class", "hull-lbl");
      const merged = enter.merge(sel);
      merged.select("path").attr("d", (d) => hullPath(d.pts, 40))
        .attr("fill", (d) => HUE[d.c.hue]).attr("fill-opacity", 0.07)
        .attr("stroke", (d) => HUE[d.c.hue]).attr("stroke-opacity", 0.32)
        .attr("stroke-width", 1).attr("stroke-dasharray", "2 5");
      merged.select("text.hull-lbl").each(function (d) {
        const xs = d.pts.map((p) => p[0]), ys = d.pts.map((p) => p[1]);
        d3.select(this).attr("x", Math.min(...xs) - 4).attr("y", Math.min(...ys) - 30)
          .attr("font-family", "var(--font-mono)").attr("font-size", 10).attr("letter-spacing", "0.16em")
          .attr("fill", HUE[d.c.hue]).attr("opacity", 0.8).attr("text-transform", "uppercase")
          .text(d.c.label.toUpperCase());
      });
    }

    function hullPath(points, pad) {
      if (points.length < 3) {
        // pad a 2-point cluster into a blob
        const [a, b] = points.length === 2 ? points : [points[0], [points[0][0] + 1, points[0][1] + 1]];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        points = [[mx - pad, my - pad], [mx + pad, my - pad], [mx + pad, my + pad], [mx - pad, my + pad]];
      }
      const hull = d3.polygonHull(points);
      const cx = d3.mean(hull, (p) => p[0]), cy = d3.mean(hull, (p) => p[1]);
      const expanded = hull.map((p) => {
        const dx = p[0] - cx, dy = p[1] - cy, len = Math.hypot(dx, dy) || 1;
        return [p[0] + (dx / len) * pad, p[1] + (dy / len) * pad];
      });
      return d3.line().curve(d3.curveCatmullRomClosed.alpha(0.7))(expanded);
    }

    // ── nodes ──
    const g = nodeLayer.selectAll("g.node").data(nodes, (d) => d.id).enter().append("g")
      .attr("class", "node").style("cursor", "pointer");

    g.each(function (n) {
      const sel = d3.select(this);
      sel.append("g").attr("class", "ring-slot");
      const shape = sel.append("g").attr("class", "shape-slot");
      drawNode(shape, n, radiusOf(n));
      if (n.frozen) sel.append("circle").attr("class", "frozen-ring").attr("r", radiusOf(n) + 5).attr("fill", "none").attr("stroke", C.lime).attr("stroke-width", 1).attr("stroke-dasharray", "2 3").attr("opacity", 0.8);
      if (n.drift) sel.append("circle").attr("class", "drift").attr("cx", radiusOf(n) * 0.72).attr("cy", -radiusOf(n) * 0.72).attr("r", 4.5).attr("fill", C.coral).style("filter", `drop-shadow(0 0 7px ${C.coral})`);
      // label
      const lbl = sel.append("g").attr("class", "label").style("pointer-events", "none");
      lbl.append("text").attr("class", "l1").attr("text-anchor", "middle").attr("y", radiusOf(n) + 16)
        .attr("font-family", "var(--font-sans)").attr("font-weight", 600).attr("font-size", 12).attr("fill", C.text).text(n.label);
      lbl.append("text").attr("class", "l2").attr("text-anchor", "middle").attr("y", radiusOf(n) + 29)
        .attr("font-family", "var(--font-mono)").attr("font-size", 8.5).attr("letter-spacing", "0.1em")
        .attr("fill", C.textMute).text(":" + n.type);
    });

    g.on("click", (ev, n) => { ev.stopPropagation(); select(n.id); });
    g.on("mouseenter", function (ev, n) { if (!ctx.__sel) d3.select(this).select(".shape-slot").transition().duration(120).attr("transform", "scale(1.08)"); })
     .on("mouseleave", function () { d3.select(this).select(".shape-slot").transition().duration(160).attr("transform", "scale(1)"); });

    svg.on("click", () => select(null));

    g.call(d3.drag()
      .on("start", (ev, d) => { sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on("end", (ev, d) => { sim.alphaTarget(0); d.fx = null; d.fy = null; nodeIndex.get(d.id).__pos = { x: d.x, y: d.y }; }));

    function tick() {
      linkSel.select(".edge-path").attr("d", (l) => {
        const lift = l.kind === "decides" ? 0.32 : l.kind === "references" ? 0.22 : 0.16;
        return curve(l.source.x, l.source.y, l.target.x, l.target.y, lift);
      });
      labeled.select(".edge-lbl-bg").attr("x", (l) => (l.source.x + l.target.x) / 2 - 30).attr("y", (l) => (l.source.y + l.target.y) / 2 - 16).attr("width", 60);
      labeled.select(".edge-lbl").attr("x", (l) => (l.source.x + l.target.x) / 2).attr("y", (l) => (l.source.y + l.target.y) / 2 - 8);
      g.attr("transform", (d) => `translate(${d.x},${d.y})`);
      drawHulls();
    }
    sim.on("tick", tick);
    tick();

    applyTiers(ctx.selectedId);

    function applyTiers(selId) {
      ctx.__sel = selId;
      const tier = VC.computeTiers(nodes.map((n) => n.id), adjacency, selId);
      g.each(function (n) {
        const st = TIER_STYLE[tier[n.id]] || TIER_STYLE.focus;
        const sel = d3.select(this);
        sel.transition().duration(360).style("opacity", st.opacity);
        sel.select(".shape-slot").style("filter", tier[n.id] === "ghost" ? "url(#blurGhost)" : tier[n.id] === "mid" ? "url(#blurMid)" : null);
        sel.select(".label").transition().duration(300).style("opacity", st.label);
        // selection ring
        const rs = sel.select(".ring-slot"); rs.selectAll("*").remove();
        if (n.id === selId) drawSelectionRing(rs, radiusOf(n), TYPE[n.type].glow);
      });
      linkSel.transition().duration(360).style("opacity", (l) => {
        const a = tier[l.source.id || l.source], b = tier[l.target.id || l.target];
        if (a === "ghost" || b === "ghost") return 0.12;
        if (a === "mid" || b === "mid") return 0.5;
        return 1;
      });
      linkSel.select(".edge-path")
        .attr("stroke", (l) => l.drift ? C.coral : EDGE.muted.has(l.kind) ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)")
        .attr("stroke-width", (l) => (l.label ? 1.8 : 1.3))
        .attr("stroke-dasharray", (l) => (l.drift || EDGE.dashed.has(l.kind)) ? "5 5" : null)
        .attr("marker-end", (l) => l.drift ? "url(#arrowCoral)" : EDGE.muted.has(l.kind) ? "url(#arrowMuted)" : "url(#arrow)");
    }

    // zoom
    const z = VC.attachZoom(svg, root, { scaleExtent: [0.4, 2.6] });
    function fit(animate) {
      const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs) - 60, maxX = Math.max(...xs) + 60, minY = Math.min(...ys) - 70, maxY = Math.max(...ys) + 70;
      const bw = maxX - minX, bh = maxY - minY;
      const k = Math.min(width / bw, height / bh, 1.4) * 0.94;
      const t = d3.zoomIdentity.translate(width / 2 - k * (minX + maxX) / 2, height / 2 - k * (minY + maxY) / 2).scale(k);
      if (animate) svg.transition().duration(450).call(z.zoom.transform, t);
      else svg.call(z.zoom.transform, t);
    }
    fit(false);

    return {
      highlight: applyTiers,
      fit: () => fit(true),
      zoomBy: (f) => svg.transition().duration(200).call(z.zoom.scaleBy, f),
    };
  }

  window.TesseraViews = window.TesseraViews || {};
  window.TesseraViews.domain = {
    id: "domain", label: "Domain", crumb: "Domain",
    eyebrow: "Bounded contexts", title: "Atlas Stays",
    stageTitle: "Domain", stageMeta: `${D.nodes.length} elements · ${D.contexts.length} contexts · <span style="color:var(--coral)">1 drift</span>`,
    defaultLayout: "contexts",
    layouts: [{ id: "contexts", label: "contexts" }, { id: "force", label: "force" }, { id: "radial", label: "radial" }],
    filters: [
      { id: "aggregate", label: "Aggregate", color: C.magenta, count: 4 },
      { id: "entity", label: "Entity", color: C.magentaHi, count: 4 },
      { id: "value", label: "Value obj", color: C.magenta, count: 4 },
      { id: "useCase", label: "Use case", color: C.cyan, count: 5 },
      { id: "contract", label: "Contract", color: C.indigo, count: 3 },
      { id: "decision", label: "Decision", color: C.violet, count: 1 },
      { id: "actor", label: "Actor", color: C.text, count: 3 },
    ],
    filterHint: "toggle a type to filter · click a tile to focus",
    legendTitle: "Shape = role",
    legend: [
      { glyph: "▦", label: "Tile · aggregate, contract" },
      { glyph: "●", label: "Circle · entity" },
      { glyph: "⬭", label: "Dashed · value object" },
      { glyph: "◆", label: "Diamond · decision" },
      { glyph: "◌", label: "Hollow · actor" },
    ],
    outliner, describe, render,
  };
})();
