/* Tessera · app.js — wires the diagram views onto the docking workspace.
 * Panels (Canvas, Outliner, Inspector, Layers, Spec) are registered with the
 * Workspace engine; the engine owns where they live. This file owns WHAT they
 * show: the active view, the current selection, and keeping every panel in
 * sync. Selection state lives here, so dragging/ tabbing/ splitting panels
 * never loses what you had selected — the inspector, outliner highlight, spec
 * and canvas focus all read from the same `state`.
 */
(function () {
  "use strict";
  const { C, TYPE } = window.VizCore;
  const V = window.TesseraViews;
  const $ = (s, r = document) => r.querySelector(s);

  // view angles in the rail (two stubbed to show the system scales)
  const RAIL = [
    { id: "domain", icon: "◐", key: "DOM", on: true },
    { id: "data",   icon: "⊟", key: "ERD", on: true },
    { id: "flow",   icon: "≋", key: "FLOW", on: true },
    { id: "arch",   icon: "▤", key: "ARCH", on: false },
    { id: "ux",     icon: "⇄", key: "UX", on: false },
  ];

  const state = {
    view: localStorage.getItem("tessera.view") || "domain",
    selected: null,
    layout: {},      // per-view layout id
    filters: {},     // per-view Set of disabled type ids
  };
  if (!V[state.view]) state.view = "domain";

  // live handles to panel bodies + the canvas D3 api
  const refs = { canvas: null, outliner: null, inspector: null, layers: null, spec: null };
  let canvasApi = null;

  // ════════════════════════════════════════════════════════════════════════
  // RAIL
  // ════════════════════════════════════════════════════════════════════════
  function renderRail() {
    const rail = $("#rail");
    rail.innerHTML = "";
    RAIL.forEach((r) => {
      const el = document.createElement("div");
      el.className = "rail-item" + (r.id === state.view ? " active" : "");
      el.style.opacity = r.on ? "1" : "0.4";
      el.title = r.on ? (V[r.id] ? V[r.id].label : r.id) : r.id + " · soon";
      el.innerHTML = `<div class="ico">${r.icon}</div><div class="rk">${r.key}</div>`;
      if (r.on) el.onclick = () => switchView(r.id);
      else el.style.cursor = "not-allowed";
      rail.appendChild(el);
    });
    const grow = document.createElement("div"); grow.className = "rail-grow"; rail.appendChild(grow);
    const sep = document.createElement("div"); sep.className = "rail-sep"; rail.appendChild(sep);
    [["⚙", "Settings"], ["◫", "Panels"]].forEach(([ic, tip]) => {
      const el = document.createElement("div"); el.className = "rail-item"; el.title = tip;
      el.innerHTML = `<div class="ico">${ic}</div>`;
      if (tip === "Panels") el.onclick = toggleAddMenu;
      rail.appendChild(el);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PANEL: CANVAS
  // ════════════════════════════════════════════════════════════════════════
  function mountCanvas(body) {
    body.style.overflow = "hidden";
    body.innerHTML =
      `<div class="cv">
         <div class="cv-tool">
           <span class="cv-title" id="cv-title"></span>
           <span class="cv-meta" id="cv-meta"></span>
           <div class="seg" id="cv-seg"></div>
         </div>
         <div class="cv-stage" id="cv-stage">
           <svg id="viz"></svg>
           <div class="zoom-ctl">
             <button id="zoom-in">+</button>
             <button id="zoom-out">−</button>
             <button id="zoom-reset" title="Fit">⊡</button>
           </div>
         </div>
       </div>`;
    refs.canvas = body;
    $("#zoom-in", body).onclick = () => canvasApi && canvasApi.zoomBy && canvasApi.zoomBy(1.3);
    $("#zoom-out", body).onclick = () => canvasApi && canvasApi.zoomBy && canvasApi.zoomBy(1 / 1.3);
    $("#zoom-reset", body).onclick = () => canvasApi && canvasApi.fit && canvasApi.fit();
    drawView();
  }

  function renderSeg() {
    if (!refs.canvas) return;
    const view = V[state.view];
    const seg = $("#cv-seg", refs.canvas);
    seg.innerHTML = "";
    (view.layouts || []).forEach((l) => {
      const b = document.createElement("button");
      b.textContent = l.label;
      b.className = state.layout[state.view] === l.id ? "on" : "";
      b.onclick = () => { state.layout[state.view] = l.id; renderSeg(); drawView(); };
      seg.appendChild(b);
    });
    seg.style.display = (view.layouts || []).length ? "" : "none";
  }

  function drawView() {
    if (!refs.canvas) return;
    const view = V[state.view];
    $("#cv-title", refs.canvas).textContent = view.stageTitle || view.label;
    $("#cv-meta", refs.canvas).innerHTML = view.stageMeta || "";
    renderSeg();
    const stage = $("#cv-stage", refs.canvas);
    const w = stage.clientWidth || 600, h = stage.clientHeight || 400;
    const svg = d3.select($("#viz", refs.canvas)).attr("width", w).attr("height", h);
    svg.selectAll("*").remove();
    window.VizCore.injectDefs(svg);
    canvasApi = view.render({
      svg, width: w, height: h,
      layout: state.layout[state.view],
      disabledTypes: state.filters[state.view] || new Set(),
      selectedId: state.selected,
      select,
    }) || {};
  }

  function fitCanvas() {
    if (!refs.canvas || !canvasApi) return;
    const stage = $("#cv-stage", refs.canvas);
    const w = stage.clientWidth, h = stage.clientHeight;
    const svg = d3.select($("#viz", refs.canvas));
    if (svg.attr("width") == w && svg.attr("height") == h) { canvasApi.fit && canvasApi.fit(); return; }
    drawView(); // size changed materially → rebuild + fit
  }

  // ════════════════════════════════════════════════════════════════════════
  // PANEL: OUTLINER
  // ════════════════════════════════════════════════════════════════════════
  function mountOutliner(body) {
    body.innerHTML = `<div class="ol"><div class="ol-head"><div class="ol-eyebrow" id="ol-eyebrow"></div><div class="ol-title" id="ol-title"></div></div><div class="ol-body" id="ol-body"></div></div>`;
    refs.outliner = body;
    renderOutliner();
  }
  function renderOutliner() {
    if (!refs.outliner) return;
    const view = V[state.view];
    $("#ol-eyebrow", refs.outliner).textContent = view.eyebrow || "View";
    $("#ol-title", refs.outliner).textContent = view.title || "Atlas Stays";
    const list = $("#ol-body", refs.outliner);
    list.innerHTML = "";
    (view.outliner ? view.outliner() : []).forEach((grp) => {
      if (grp.section) { const s = document.createElement("div"); s.className = "ol-section"; s.textContent = grp.section; list.appendChild(s); }
      (grp.rows || []).forEach((row) => {
        const el = document.createElement("div");
        el.className = "ol-row" + (row.id === state.selected ? " active" : "");
        const badge = row.badge ? `<span class="badge" style="color:${row.badge.color};background:${row.badge.bg || "transparent"};border:1px solid ${row.badge.color}55">${row.badge.label}</span>` : "";
        el.innerHTML = `<span class="swatch" style="background:${row.color || "transparent"}"></span><div><div class="lbl">${row.label}</div>${row.sub ? `<div class="sub">${row.sub}</div>` : ""}</div>${badge}`;
        if (row.id) el.onclick = () => select(row.id);
        list.appendChild(el);
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PANEL: INSPECTOR
  // ════════════════════════════════════════════════════════════════════════
  function mountInspector(body) { refs.inspector = body; renderInspector(); }
  function renderInspector() {
    if (!refs.inspector) return;
    const insp = refs.inspector;
    const view = V[state.view];
    const model = state.selected && view.describe ? view.describe(state.selected) : null;
    if (!model) {
      insp.innerHTML = `<div class="insp-empty"><div class="big">◇</div><div class="t">Nothing selected</div><div class="s">Click any tile, table, or step on the canvas. Its schema, state and relations land here — the same panel across every view.</div></div>`;
      return;
    }
    const t = TYPE[model.type] || {};
    const accent = model.accent || t.glow || C.indigo;
    const badges = (model.badges || []).map((b) => `<span class="chip" style="color:${b.color};background:${b.bg || "transparent"};border:1px solid ${b.color}55">${b.label}</span>`).join("");
    let html = `<div class="insp-head fade-in"><div class="insp-type"><span class="dot" style="background:${accent};box-shadow:0 0 8px ${accent}"></span>${model.typeLabel || (t.label || "")}</div><div class="insp-title">${model.title}${badges}</div>${model.id ? `<div class="insp-id">${model.id}</div>` : ""}</div>`;
    (model.sections || []).forEach((sec) => {
      html += `<div class="insp-sec"><h3>${sec.title}<span class="rule"></span></h3>`;
      if (sec.props) html += sec.props.map((p) => `<div class="prop"><div class="k">${p.k}</div><div class="v ${p.mono ? "mono" : ""}" style="${p.color ? `color:${p.color}` : ""}">${p.v}</div></div>`).join("");
      if (sec.rels) html += sec.rels.map((r) => `<div class="rel" data-target="${r.target || ""}"><span class="sw" style="background:${r.color}"></span><span>${r.label}</span><span class="kind">${r.kind || ""}</span></div>`).join("");
      if (sec.html) html += sec.html;
      html += `</div>`;
    });
    if (model.actions) html += `<div class="insp-foot">` + model.actions.map((a) => `<button class="btn ${a.kind || ""}">${a.label}</button>`).join("") + `</div>`;
    insp.innerHTML = html;
    insp.querySelectorAll(".rel[data-target]").forEach((el) => { const tgt = el.getAttribute("data-target"); if (tgt) el.onclick = () => select(tgt); });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PANEL: LAYERS (legend + type filters)
  // ════════════════════════════════════════════════════════════════════════
  function mountLayers(body) { refs.layers = body; renderLayers(); }
  function renderLayers() {
    if (!refs.layers) return;
    const view = V[state.view];
    const disabled = state.filters[state.view] || new Set();
    let html = `<div class="layers">`;
    const filters = view.filters || [];
    if (filters.length) {
      html += `<h4>Types · click to filter</h4>`;
      html += filters.map((f) => `<div class="lyr-row ${disabled.has(f.id) ? "off" : ""}" data-type="${f.id}"><span class="sw" style="background:${f.color}"></span><span class="nm">${f.label}</span><span class="ct">${f.count != null ? f.count : ""}</span></div>`).join("");
      html += `<div class="lyr-sep"></div>`;
    }
    html += `<h4>${view.legendTitle || "Legend"}</h4>`;
    html += (view.legend || []).map((i) => `<div class="lyr-leg"><span class="gl">${i.glyph}</span><span>${i.label}</span></div>`).join("");
    html += `</div>`;
    refs.layers.innerHTML = html;
    refs.layers.querySelectorAll(".lyr-row[data-type]").forEach((el) => {
      el.onclick = () => {
        const id = el.getAttribute("data-type");
        const d = state.filters[state.view] || new Set();
        d.has(id) ? d.delete(id) : d.add(id);
        state.filters[state.view] = d;
        renderLayers(); drawView();
      };
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PANEL: SPEC (forward-looking: the edit→spec loop, read-only preview)
  // ════════════════════════════════════════════════════════════════════════
  function mountSpec(body) { refs.spec = body; renderSpec(); }
  function renderSpec() {
    if (!refs.spec) return;
    const view = V[state.view];
    const model = state.selected && view.describe ? view.describe(state.selected) : null;
    if (!model) {
      refs.spec.innerHTML = `<div class="spec"><div class="sp-empty">Select an element to preview the spec Tessera would hand a coding agent for it.</div></div>`;
      return;
    }
    const propLines = [];
    (model.sections || []).forEach((sec) => {
      (sec.props || []).forEach((p) => propLines.push(`  <span class="kw">${p.k.replace(/\s+/g, "_")}</span>: <span class="st">${String(p.v).replace(/<[^>]+>/g, "")}</span>`));
    });
    const rels = [];
    (model.sections || []).forEach((sec) => (sec.rels || []).forEach((r) => rels.push(`  - ${r.kind} <span class="st">${r.label}</span>`)));
    refs.spec.innerHTML =
      `<div class="spec"><pre><span class="cm"># generated · ${state.view}@atlas-stays</span>
<span class="sp-h">target</span>${model.typeLabel || ""} <span class="st">${model.title}</span>
<span class="sp-h">properties</span>${propLines.join("\n") || "  <span class=\"cm\">—</span>"}
<span class="sp-h">relations</span>${rels.join("\n") || "  <span class=\"cm\">—</span>"}
<span class="sp-h">intent</span>  <span class="cm"># describe the change, then Tessera</span>
  <span class="cm"># emits a task for the agent…</span></pre></div>`;
  }

  // ════════════════════════════════════════════════════════════════════════
  // SELECTION (single source of truth across all panels)
  // ════════════════════════════════════════════════════════════════════════
  function select(id) {
    state.selected = (state.selected === id) ? null : id;
    renderInspector(); renderOutliner(); renderSpec();
    if (canvasApi && canvasApi.highlight) canvasApi.highlight(state.selected);
  }
  window.__tesseraSelect = select;

  // ════════════════════════════════════════════════════════════════════════
  // VIEW SWITCH
  // ════════════════════════════════════════════════════════════════════════
  function switchView(id) {
    state.view = id;
    state.selected = null;
    localStorage.setItem("tessera.view", id);
    const view = V[id];
    if (state.layout[id] === undefined) state.layout[id] = view.defaultLayout || (view.layouts && view.layouts[0] && view.layouts[0].id);
    $("#status-rev").textContent = id + "@atlas-stays · rev 042 · synced 12s ago";
    ws.setTitle("canvas", view.label);
    renderRail();
    renderOutliner(); renderLayers(); renderInspector(); renderSpec();
    drawView();
  }

  // ════════════════════════════════════════════════════════════════════════
  // WORKSPACE SETUP
  // ════════════════════════════════════════════════════════════════════════
  const surface = $("#workspace");
  const PANEL_META = {
    canvas:    { title: "Canvas",    icon: "◧" },
    outliner:  { title: "Outliner",  icon: "☰" },
    inspector: { title: "Inspector", icon: "◳" },
    layers:    { title: "Layers",    icon: "▦" },
    spec:      { title: "Spec",      icon: "⌗" },
  };

  function defaultLayout() {
    const W = surface.clientWidth || 1100, H = surface.clientHeight || 640;
    const g = 8, L = 232, R = 300;
    return {
      frames: [
        { id: "f-ol",   x: g, y: g, w: L, h: H - 2 * g, z: 11, tabs: ["outliner"], active: "outliner", collapsed: false, maximized: false },
        { id: "f-cv",   x: L + 2 * g, y: g, w: W - L - R - 4 * g, h: H - 2 * g, z: 12, tabs: ["canvas"], active: "canvas", collapsed: false, maximized: false },
        { id: "f-insp", x: W - R - g, y: g, w: R, h: H - 2 * g, z: 11, tabs: ["inspector"], active: "inspector", collapsed: false, maximized: false },
      ],
      tray: ["layers", "spec"],
    };
  }

  const ws = new Workspace(surface, { lsKey: "tessera.workspace.v2", default: defaultLayout, onChange: refreshAddMenu });
  ws.register({ id: "canvas",    title: PANEL_META.canvas.title,    icon: PANEL_META.canvas.icon,    mount: mountCanvas,    onResize: fitCanvas, onActivate: fitCanvas });
  ws.register({ id: "outliner",  title: PANEL_META.outliner.title,  icon: PANEL_META.outliner.icon,  mount: mountOutliner });
  ws.register({ id: "inspector", title: PANEL_META.inspector.title, icon: PANEL_META.inspector.icon, mount: mountInspector });
  ws.register({ id: "layers",    title: PANEL_META.layers.title,    icon: PANEL_META.layers.icon,    mount: mountLayers });
  ws.register({ id: "spec",      title: PANEL_META.spec.title,      icon: PANEL_META.spec.icon,      mount: mountSpec });

  // ── add-panel menu ──
  const menu = $("#add-panel-menu");
  function refreshAddMenu() {
    if (!menu) return;
    menu.innerHTML = Object.keys(PANEL_META).map((id) => {
      const placed = ws.isPlaced(id);
      return `<div class="mi ${placed ? "placed" : ""}" data-panel="${id}"><span class="gl">${PANEL_META[id].icon}</span><span>${PANEL_META[id].title}</span>${placed ? '<span style="margin-left:auto;font-size:10px;color:var(--text-mute)">placed</span>' : ""}</div>`;
    }).join("") + `<div class="sep"></div><div class="mi" data-act="reset"><span class="gl">⟲</span><span>Reset layout</span></div>`;
    menu.querySelectorAll(".mi[data-panel]").forEach((el) => { el.onclick = () => { ws.openPanel(el.getAttribute("data-panel")); closeAddMenu(); }; });
    const rb = menu.querySelector('.mi[data-act="reset"]'); if (rb) rb.onclick = () => { ws.reset(); closeAddMenu(); };
  }
  function toggleAddMenu(ev) { ev && ev.stopPropagation(); menu.classList.toggle("open"); refreshAddMenu(); }
  function closeAddMenu() { menu.classList.remove("open"); }
  $("#add-panel-btn").onclick = toggleAddMenu;
  $("#reset-layout-btn").onclick = () => ws.reset();
  document.addEventListener("click", (ev) => { if (!ev.target.closest("#add-panel-btn") && !ev.target.closest('[title="Panels"]')) closeAddMenu(); });

  // ── boot ──
  renderRail();
  ws.boot();
  // ensure canvas tab reflects the active view + first paint is correct
  ws.setTitle("canvas", V[state.view].label);
  switchView(state.view);
})();
