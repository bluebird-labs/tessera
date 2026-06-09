/* Tessera · view-data.js — Entity-Relationship view.
 * Same domain, expressed as physical tables. Each table is a glass card with
 * typed field rows; PK / FK / unique / index roles are marked. Relationships
 * use crow's-foot cardinality. Tables stay in their domain hue. Selecting a
 * table focuses it + its neighbours and drives the inspector. Two layouts:
 * spatial (hand-placed) and grid (tidy columns) — the view where this matters.
 */
(function () {
  "use strict";
  const VC = window.VizCore;
  const { C, HUE, curve } = VC;
  const D = window.AtlasData.data;

  const HUEC = { magenta: C.magenta, cyan: C.cyan, violet: C.violet, amber: C.amber, indigo: C.indigo };
  const CW = 196;                 // card width
  const HEAD = 34, ROW = 22, PAD = 8;
  const tableById = new Map(D.tables.map((t) => [t.id, t]));
  const cardHeight = (t) => HEAD + t.fields.length * ROW + PAD;

  // adjacency for focus tiers (table ↔ table)
  const adj = {};
  D.rels.forEach((r) => { (adj[r.from] = adj[r.from] || []).push(r.to); (adj[r.to] = adj[r.to] || []).push(r.from); });

  // hand-tuned spatial positions (fractions); listings is the hub
  const SPATIAL = {
    guests:        { fx: 0.10, fy: 0.10 },
    hosts:         { fx: 0.10, fy: 0.62 },
    reservations:  { fx: 0.42, fy: 0.10 },
    listings:      { fx: 0.44, fy: 0.60 },
    payments:      { fx: 0.76, fy: 0.07 },
    reviews:       { fx: 0.76, fy: 0.40 },
    availability:  { fx: 0.76, fy: 0.74 },
    listing_photos:{ fx: 0.45, fy: 1.0 },
  };

  function gridPositions(width) {
    // 4 columns by logical grouping
    const order = ["guests", "reservations", "payments", "reviews", "hosts", "listings", "availability", "listing_photos"];
    const cols = 4, gapX = (width - cols * CW) / (cols + 1);
    const pos = {};
    order.forEach((id, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      pos[id] = { x: gapX + c * (CW + gapX), yTop: r === 0 ? 24 : 320 };
    });
    return pos;
  }

  function describe(id) {
    const t = tableById.get(id);
    if (!t) return null;
    const accent = HUEC[t.accent] || C.indigo;
    const badges = [];
    if (t.drift) badges.push({ label: "DRIFT", color: C.coral, bg: "rgba(251,113,133,0.14)" });
    const idxCount = t.fields.filter((f) => f.idx).length;
    const fkCount = t.fields.filter((f) => f.fk).length;
    const fieldHtml = t.fields.map((f) => {
      const role = f.pk ? `<span style="color:${C.amber}">PK</span>` : f.fk ? `<span style="color:${C.cyan}">FK</span>` : f.unique ? `<span style="color:${C.violet}">U</span>` : "";
      return `<div class="prop"><div class="k" style="text-transform:none;letter-spacing:0">${f.name}${f.idx ? ' <span style="color:'+C.textMute+'">·idx</span>' : ""}</div><div class="v mono" style="display:flex;justify-content:space-between;gap:8px"><span style="color:${C.cyanHi}">${f.ftype}</span><span>${role}</span></div></div>`;
    }).join("");
    const rels = [];
    D.rels.forEach((r) => {
      if (r.from === id) rels.push({ label: tableById.get(r.to).label, color: HUEC[tableById.get(r.to).accent], kind: "1 ─< many", target: r.to });
      else if (r.to === id) rels.push({ label: tableById.get(r.from).label, color: HUEC[tableById.get(r.from).accent], kind: "many >─ 1", target: r.from });
    });
    return {
      type: "module", typeLabel: "table", title: t.label, accent,
      id: `table@${t.id} · ${t.fields.length} cols`,
      badges,
      sections: [
        { title: `Columns · ${t.fields.length}`, html: fieldHtml },
        { title: "Indexes & keys", props: [
          { k: "primary key", v: t.fields.find((f) => f.pk)?.name || "—", mono: true, color: C.amber },
          { k: "foreign keys", v: String(fkCount), mono: true, color: C.cyan },
          { k: "indexes", v: String(idxCount), mono: true },
        ] },
        { title: `Relations · ${rels.length}`, rels },
      ],
      actions: [{ label: "Edit schema", kind: "primary" }, { label: "Migration", kind: "ghost" }],
    };
  }

  function outliner() {
    return [{ section: "Tables", rows: D.tables.map((t) => ({
      id: t.id, label: t.label, color: HUEC[t.accent],
      sub: t.fields.length + " cols · " + t.fields.filter((f) => f.fk).length + " fk",
      badge: t.drift ? { label: "drift", color: C.coral } : null,
    })) }];
  }

  // crow's-foot end symbol at (x,y), `dir` = +1 enters from left, -1 from right
  function foot(g, x, y, dir, card, color) {
    const k = 11 * dir;
    if (card === "many") {
      g.append("path").attr("d", `M ${x + k} ${y - 7} L ${x} ${y} L ${x + k} ${y + 7}`).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1.3);
      g.append("line").attr("x1", x + k).attr("y1", y).attr("x2", x + k * 1.3).attr("y2", y).attr("stroke", color).attr("stroke-width", 1.3);
    } else if (card === "one") {
      g.append("line").attr("x1", x + k * 0.7).attr("y1", y - 6).attr("x2", x + k * 0.7).attr("y2", y + 6).attr("stroke", color).attr("stroke-width", 1.3);
    } else { // oneopt: circle + bar
      g.append("circle").attr("cx", x + k * 1.1).attr("cy", y).attr("r", 3.4).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1.2);
      g.append("line").attr("x1", x + k * 0.55).attr("y1", y - 6).attr("x2", x + k * 0.55).attr("y2", y + 6).attr("stroke", color).attr("stroke-width", 1.3);
    }
  }

  function render(ctx) {
    const { svg, width, height, layout, select } = ctx;
    const mode = layout || "spatial";
    const root = svg.append("g").attr("class", "erd-root");
    const edgeLayer = root.append("g");
    const cardLayer = root.append("g");
    const VW = 1240, VH = 820; // fixed virtual layout space; fit() scales to canvas

    // position cards
    const tables = D.tables.map((t) => Object.assign({ w: CW, h: cardHeight(t) }, t));
    const grid = mode === "grid" ? gridPositions(VW) : null;
    tables.forEach((t) => {
      if (mode === "grid") { t.x = grid[t.id].x; t.y = grid[t.id].yTop; }
      else { const p = SPATIAL[t.id]; t.x = p.fx * (VW - CW) ; t.y = p.fy * (VH - t.h) * 0.92 + 10; }
    });
    const pos = new Map(tables.map((t) => [t.id, t]));

    // ── relationship edges ──
    function fieldY(t, fname) {
      const i = t.fields.findIndex((f) => f.name === fname);
      return t.y + HEAD + (i + 0.5) * ROW;
    }
    const edgeSel = edgeLayer.selectAll("g.rel").data(D.rels).enter().append("g").attr("class", "rel-edge");
    edgeSel.append("path").attr("fill", "none");
    edgeSel.append("g").attr("class", "feet");

    function routeEdges() {
      edgeSel.each(function (r) {
        const P = pos.get(r.from), Ch = pos.get(r.to);
        const color = HUEC[P.accent] || C.lineHi;
        // choose sides: connect from parent side nearest child
        const pRight = P.x + P.w, chRight = Ch.x + Ch.w;
        let x1, x2, d1, d2;
        const py = fieldY(P, P.fields.find((f) => f.pk).name);
        const cy = fieldY(Ch, r.fk);
        if (Ch.x >= pRight - 20) { x1 = pRight; d1 = -1; x2 = Ch.x; d2 = +1; }
        else if (chRight <= P.x + 20) { x1 = P.x; d1 = +1; x2 = chRight; d2 = -1; }
        else if (Ch.x + Ch.w / 2 >= P.x + P.w / 2) { x1 = pRight; d1 = -1; x2 = Ch.x; d2 = +1; }
        else { x1 = P.x; d1 = +1; x2 = chRight; d2 = -1; }
        const g = d3.select(this);
        const midX = (x1 + x2) / 2;
        g.select("path").attr("d", `M ${x1} ${py} C ${midX} ${py} ${midX} ${cy} ${x2} ${cy}`)
          .attr("stroke", color).attr("stroke-width", 1.4).attr("stroke-opacity", 0.6)
          .attr("data-from", r.from).attr("data-to", r.to);
        const feet = g.select(".feet"); feet.selectAll("*").remove();
        foot(feet, x1, py, d1, r.fromCard, color);
        foot(feet, x2, cy, d2, r.toCard, color);
      });
    }

    // ── table cards ──
    const card = cardLayer.selectAll("g.card").data(tables, (d) => d.id).enter().append("g")
      .attr("class", "card").style("cursor", "pointer").attr("transform", (d) => `translate(${d.x},${d.y})`);

    card.each(function (t) {
      const g = d3.select(this);
      const accent = HUEC[t.accent] || C.indigo;
      g.append("rect").attr("class", "card-bg").attr("width", t.w).attr("height", t.h).attr("rx", 10)
        .attr("fill", "#10121f").attr("stroke", C.line).attr("stroke-width", 1)
        .style("filter", "drop-shadow(0 10px 24px rgba(0,0,0,0.45))");
      // header
      g.append("rect").attr("width", t.w).attr("height", HEAD).attr("rx", 10).attr("fill", accent).attr("fill-opacity", 0.16);
      g.append("rect").attr("y", HEAD - 10).attr("width", t.w).attr("height", 10).attr("fill", accent).attr("fill-opacity", 0.16);
      g.append("rect").attr("class", "accent-bar").attr("width", 3).attr("height", HEAD).attr("rx", 1.5).attr("fill", accent);
      g.append("circle").attr("cx", 16).attr("cy", HEAD / 2).attr("r", 3.5).attr("fill", accent).style("filter", `drop-shadow(0 0 5px ${accent})`);
      g.append("text").attr("x", 28).attr("y", HEAD / 2 + 4).attr("font-family", "var(--font-mono)").attr("font-size", 12).attr("font-weight", 600).attr("fill", C.text).text(t.label);
      if (t.drift) g.append("text").attr("x", t.w - 10).attr("y", HEAD / 2 + 3.5).attr("text-anchor", "end").attr("font-family", "var(--font-mono)").attr("font-size", 8).attr("letter-spacing", "0.1em").attr("fill", C.coral).text("DRIFT");
      // field rows
      t.fields.forEach((f, i) => {
        const ry = HEAD + i * ROW;
        const row = g.append("g").attr("transform", `translate(0,${ry})`);
        if (i % 2 === 1) row.append("rect").attr("width", t.w).attr("height", ROW).attr("fill", "rgba(255,255,255,0.015)");
        // key glyph
        if (f.pk) row.append("text").attr("x", 11).attr("y", ROW / 2 + 4).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", C.amber).text("◆");
        else if (f.fk) row.append("text").attr("x", 11).attr("y", ROW / 2 + 4).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", C.cyan).text("◇");
        row.append("text").attr("x", 22).attr("y", ROW / 2 + 4).attr("font-family", "var(--font-mono)").attr("font-size", 10.5)
          .attr("fill", f.pk ? C.text : C.textDim).attr("font-weight", f.pk ? 600 : 400).text(f.name);
        row.append("text").attr("x", t.w - 10).attr("y", ROW / 2 + 4).attr("text-anchor", "end").attr("font-family", "var(--font-mono)").attr("font-size", 9.5)
          .attr("fill", C.textMute).text(f.ftype);
        if (f.unique) row.append("text").attr("x", t.w - 10).attr("y", ROW / 2 + 4).attr("text-anchor", "end").attr("opacity", 0).text("");
        if (f.idx) row.append("rect").attr("x", 22).attr("y", ROW / 2 + 7).attr("width", f.name.length * 6).attr("height", 1).attr("fill", C.indigo).attr("opacity", 0.5);
      });
    });

    card.append("rect").attr("class", "sel-ring").attr("width", (d) => d.w).attr("height", (d) => d.h).attr("rx", 10).attr("fill", "none").attr("stroke", "none").attr("pointer-events", "none");

    card.on("click", (ev, t) => { ev.stopPropagation(); select(t.id); });
    svg.on("click", () => select(null));

    card.call(d3.drag()
      .on("start", function () { d3.select(this).raise(); })
      .on("drag", function (ev, d) { d.x += ev.dx; d.y += ev.dy; d3.select(this).attr("transform", `translate(${d.x},${d.y})`); routeEdges(); })
      .on("end", function () {}));

    routeEdges();
    applyTiers(ctx.selectedId);

    function applyTiers(selId) {
      const tier = VC.computeTiers(tables.map((t) => t.id), adj, selId);
      card.transition().duration(320).style("opacity", (t) => {
        const s = tier[t.id];
        return s === "ghost" ? 0.28 : s === "mid" ? 0.7 : 1;
      });
      card.select(".sel-ring").attr("stroke", (t) => t.id === selId ? C.lime : "none").attr("stroke-width", 1.6).attr("stroke-dasharray", "4 3");
      card.select(".card-bg").attr("stroke", (t) => t.id === selId ? (HUEC[t.accent]) : C.line).attr("stroke-width", (t) => t.id === selId ? 1.5 : 1)
        .style("filter", (t) => t.id === selId ? `drop-shadow(0 12px 30px ${HUEC[t.accent]}55)` : "drop-shadow(0 10px 24px rgba(0,0,0,0.45))");
      edgeSel.transition().duration(320).style("opacity", (r) => {
        const a = tier[r.from], b = tier[r.to];
        if (!selId) return 1;
        if (a === "ghost" && b === "ghost") return 0.12;
        if (r.from === selId || r.to === selId) return 1;
        return 0.3;
      });
    }

    const z = VC.attachZoom(svg, root, { scaleExtent: [0.4, 2.4] });
    function fit(animate) {
      const minX = Math.min(...tables.map((t) => t.x)) - 30;
      const maxX = Math.max(...tables.map((t) => t.x + t.w)) + 30;
      const minY = Math.min(...tables.map((t) => t.y)) - 30;
      const maxY = Math.max(...tables.map((t) => t.y + t.h)) + 30;
      const k = Math.min(width / (maxX - minX), height / (maxY - minY), 1.3) * 0.96;
      const t = d3.zoomIdentity.translate(width / 2 - k * (minX + maxX) / 2, height / 2 - k * (minY + maxY) / 2).scale(k);
      if (animate) svg.transition().duration(450).call(z.zoom.transform, t); else svg.call(z.zoom.transform, t);
    }
    fit(false);

    return { highlight: applyTiers, fit: () => fit(true), zoomBy: (f) => svg.transition().duration(200).call(z.zoom.scaleBy, f) };
  }

  window.TesseraViews = window.TesseraViews || {};
  window.TesseraViews.data = {
    id: "data", label: "Data", crumb: "Data · ERD",
    eyebrow: "Schema", title: "Atlas Stays",
    stageTitle: "Data · ERD", stageMeta: `${D.tables.length} tables · ${D.rels.length} relations · <span style="color:var(--coral)">1 drift</span>`,
    defaultLayout: "spatial",
    layouts: [{ id: "spatial", label: "spatial" }, { id: "grid", label: "grid" }],
    filters: [],
    filterHint: "drag tables to rearrange · click a table to focus its relations",
    legendTitle: "Field markers",
    legend: [
      { glyph: '<span style="color:#fb923c">◆</span>', label: "Primary key" },
      { glyph: '<span style="color:#22d3ee">◇</span>', label: "Foreign key" },
      { glyph: '<span style="color:#5b6bff">▁</span>', label: "Indexed column" },
      { glyph: "─<", label: "1 → many" },
      { glyph: "─o", label: "zero-or-one" },
    ],
    outliner, describe, render,
  };
})();
