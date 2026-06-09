# Tessera · Visual Identity & Component Handoff

**Direction:** Prism · vibrant, dark-first, glass surfaces, multi-hue accent system, depth-of-field diagrams.

This document is the source of truth for the Tessera desktop app's visual language. It pairs with two live references: `canvas/index.html` (the frozen visual-identity artboards) and `diagrams/index.html` (the diagram language + docking workspace, built in real D3). Implementation lives in `crates/desktop/`; this doc tells you what to build, not how to build it.

---

## 1 · Visual principles

1. **Color carries meaning.** Hue maps to graph-node type, never to decoration. Never introduce a new accent without a semantic reason.
2. **Surfaces are glass, not paint.** Panels use translucent dark fills with backdrop blur. Lines are 6–12% white over the canvas, not solid grays.
3. **Selection glows, the rest fades.** The graph and inspector both follow the same focus model — what you're working on is vivid; everything else recedes.
4. **Type carries hierarchy.** Display weights are tight (`-2.5%` to `-3.5%` tracking). UI is medium. Mono is for anything copyable: IDs, queries, code, diff.
5. **Motion is springs.** Transitions snap with stiff/soft springs (see §5). Linear easing is reserved for hover-state color shifts only.
6. **No ornament.** No skeuomorphic textures, no gratuitous gradients, no shadows that don't carry meaning. Glows tint to the element's accent — they're shorthand for "this is alive."
7. **One language, many views.** Domain, data, flows, architecture and UX are the *same* graph grammar re-projected — not five separate diagram tools. A Reservation is magenta whether it's an aggregate in the domain graph, the `reservations` table in the ERD, or a step in a flow. Color↔type, depth tiers, edge grammar, state badges and the inspector behave identically in every view. Learn the language once.
8. **The workspace belongs to the user.** The screen is a canvas of floating, dockable tiles — drag, tab, split, float, resize, collapse. View-switching is the rail; it is *not* a row of tabs in the title bar. Layout persists across reloads and resets in one click. Never lock the user into one arrangement.

---

## 2 · Color tokens

Tessera names tokens both **semantically** (what they do) and exposes a **brand-poetic primitive layer** for thematic flexibility. Define primitives once, then alias semantics onto them.

### Primitive layer

```css
:root {
  /* Surface — the canvas */
  --canvas:        #07080f;   /* base bg; everything sits on this */
  --canvas-warp:   #0a0c18;   /* slight warm shift, for gradient meshes */
  --surface-0:     #0e0f1a;   /* card / panel backing */
  --surface-1:     rgba(255,255,255,0.025);  /* glass overlay 2.5% */
  --surface-2:     #1a1d2e;   /* elevated card */
  --surface-3:     #222640;   /* pressed / hover-on-elev */

  /* Lines — hairline boundaries */
  --line:          rgba(255,255,255,0.06);
  --line-hi:       rgba(255,255,255,0.12);

  /* Text */
  --text:          #f5f6fb;          /* primary */
  --text-dim:      rgba(245,246,251,0.66);  /* secondary */
  --text-mute:     rgba(245,246,251,0.38);  /* tertiary, captions */

  /* Vibrant accent spectrum */
  --indigo:        #5b6bff;          --indigo-hi:    #7d8aff;
  --magenta:       #ff4d8c;          --magenta-hi:   #ff7ba9;
  --cyan:          #22d3ee;          --cyan-hi:      #5be7f5;
  --lime:          #a3e635;          --lime-hi:      #c0ee72;
  --violet:        #a855f7;          --violet-hi:    #c084fc;
  --amber:         #fb923c;
  --coral:         #fb7185;

  /* Accent backgrounds (low-alpha for chips & callouts) */
  --indigo-bg:     rgba(91,107,255,0.14);   --indigo-bg-2: rgba(91,107,255,0.22);
  --magenta-bg:    rgba(255,77,140,0.14);
  --cyan-bg:       rgba(34,211,238,0.14);
  --lime-bg:       rgba(163,230,53,0.14);
  --violet-bg:     rgba(168,85,247,0.16);
  --amber-bg:      rgba(251,146,60,0.16);
  --coral-bg:      rgba(251,113,133,0.14);
}
```

### Light-mode primitives (override at `[data-theme="light"]`)

```css
[data-theme="light"] {
  --canvas:        #fbfbfd;
  --canvas-warp:   #f5f6fb;
  --surface-0:     #ffffff;
  --surface-1:     rgba(7,8,15,0.025);
  --surface-2:     #eef0f7;
  --surface-3:     #e2e5f0;
  --line:          rgba(7,8,15,0.08);
  --line-hi:       rgba(7,8,15,0.14);
  --text:          #0a0b14;
  --text-dim:      rgba(10,11,20,0.66);
  --text-mute:     rgba(10,11,20,0.42);
  /* Accents stay the same — they're the brand's chromatic identity */
}
```

### Semantic aliases (use these in components)

```css
:root {
  /* Node types — each is bound to one accent forever.
     entity & value share the domain (magenta) hue; they differ by SHAPE. */
  --node-contract:      var(--indigo);    /* frozen API/promise */
  --node-usecase:       var(--cyan);      /* behavior */
  --node-aggregate:     var(--magenta);   /* domain entity cluster (root) */
  --node-entity:        var(--magenta);   /* identity-bearing member (circle) */
  --node-value:         var(--magenta);   /* identity-LESS value object (hollow chip) */
  --node-module:        var(--surface-3); /* code-level concrete */
  --node-decision:      var(--violet);    /* ADR */
  --node-actor:         var(--text);      /* external agent */

  /* Cascade state */
  --state-frozen:       var(--lime);      /* committed, immutable */
  --state-drafting:     var(--amber);     /* in-flight */
  --state-locked:       var(--text-mute); /* not yet unlocked */
  --state-drift:        var(--coral);     /* impl ≠ contract */
  --state-error:        var(--coral);

  /* Interactive */
  --accent:             var(--indigo);    /* primary action */
  --accent-grad:        linear-gradient(135deg, var(--indigo), var(--violet));
}
```

Three further semantic groups live in `tokens.css` and are documented where they're used: **depth-of-field tiers** (`--tier-*`, §6.2), **ERD field markers** (`--erd-*`, §6.6) and **flow paths** (`--flow-*`, §6.6), plus the **docking-workspace** tokens (`--ws-*`, §7). Add to those groups rather than hardcoding values in views.

### Usage rules (non-negotiable)

- **Lime = frozen / done / success.** Nothing else.
- **Coral/magenta** in graphs = drift or destructive. Never decorative.
- **Indigo gradient** is the primary CTA. One primary button per screen.
- Accent backgrounds (`*-bg` tokens) are for chips, callouts, and selected rows. Never as the main surface of a panel.

---

## 3 · Typography

```css
:root {
  --font-sans: "Inter Tight", "Geist", system-ui, -apple-system, sans-serif;
  --font-body: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", "SF Mono", Menlo, monospace;
}
```

Load weights 300–700 for `Inter Tight` and `Inter`, 400/500/600 for `JetBrains Mono`.

### Scale

| Token            | Family    | Weight | Size  | Tracking | Use                            |
|------------------|-----------|--------|-------|----------|--------------------------------|
| `--text-display` | sans      | 700    | 48–64 | -3.5%    | Hero, foundation page          |
| `--text-h1`      | sans      | 700    | 32    | -3%      | Stage view title               |
| `--text-h2`      | sans      | 600    | 22    | -2%      | Panel titles, inspector header |
| `--text-h3`      | sans      | 600    | 17    | -1.5%    | Section headers in outliner    |
| `--text-body`    | body      | 400–500| 14    | 0        | Inspector paragraphs, body     |
| `--text-ui`      | sans      | 500–600| 12    | 0        | Buttons, menu rows, labels     |
| `--text-caption` | sans/mono | 600–700| 10–11 | +14%     | UPPERCASE micro-labels          |
| `--text-mono`    | mono      | 400    | 11–13 | 0        | IDs, code, diffs, queries      |

### Gradient text (for hero only)

```css
.hero-text {
  background: linear-gradient(120deg, #fff 0%, var(--indigo-hi) 50%, var(--magenta-hi) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 4 · Spacing, radii, elevation

### Spacing scale (multiples of 4)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`

### Radii

| Token         | Value | Use                                       |
|---------------|-------|-------------------------------------------|
| `--radius-1`  | 4px   | Inputs, small chips, badges               |
| `--radius-2`  | 6px   | Buttons, segmented controls               |
| `--radius-3`  | 8px   | Inputs (default), pill filters            |
| `--radius-4`  | 10px  | Cards, glass panels                       |
| `--radius-5`  | 12px  | Floating menus, tooltips, modals          |
| `--radius-6`  | 14px  | Large empty/state boxes                   |
| `--radius-full` | 999px | Tag chips, avatars, dot indicators       |

### Elevation (shadows ∪ glows ∪ borders)

Layers stack from canvas → floating:

```css
--elev-1: 0 1px 0 var(--line);                                /* hairline */
--elev-2: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 1px var(--line);  /* card */
--elev-3: 0 16px 48px -8px rgba(0,0,0,0.5),
          0 0 0 1px var(--line);                              /* menu / popover */
--elev-4: 0 30px 80px -20px rgba(91,107,255,0.5),
          0 0 0 1px rgba(91,107,255,0.25);                    /* spotlight popover */

/* Glows — tinted to the accent of the element */
--glow-primary: 0 6px 20px -4px rgba(91,107,255,0.9),
                inset 0 0 0 1px rgba(91,107,255,0.3);
--glow-frozen:  0 0 6px var(--lime);
--glow-drift:   0 0 8px var(--coral);
```

---

## 5 · Motion

Tessera uses spring physics for state transitions and linear easing only for short hover color changes.

```ts
const springs = {
  stiff:  { stiffness: 400, damping: 30 },   // tiles snapping into place
  soft:   { stiffness: 180, damping: 22 },   // panels, drawers
  gentle: { stiffness: 120, damping: 18 },   // viewport pans, camera moves
};

const easings = {
  standard: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  duration: 180, // ms — hover only
};
```

### Choreography

- **Tile assembly** (graph appearing, cascade stage opening): stagger 18ms between nodes, `springs.soft`.
- **Cascade transitions** (stage → stage): pane fade-in over 240ms, ribbon arrow draws across in 320ms spring.
- **Selection change in graph**: focus camera retargets via `springs.gentle` (~600ms feel). Halo glow fades in over 200ms.
- **Freeze action**: target node briefly scales 1.0 → 1.08 → 1.0 over 320ms (`springs.stiff`) while lime ring snaps in; downstream nodes pulse stale (opacity 0.4 → 0.7) sequentially.
- **Drift detection**: coral dot scales 0 → 1.2 → 1 with shake (±2px x, 3 cycles, 80ms each).

---

## 6 · The diagram language

The defining surface, and the thing that makes Tessera one product instead of five. Every view angle — Domain, Data, Flows, Architecture, UX — is the **same grammar re-projected onto a different topology**. Learn the grammar once (this section), then §6.6 shows how each view specializes it.

> **Reference implementation:** `diagrams/` is the canonical, validated build of this language in real D3 — `viz-core.js` is the shared grammar (color/shape/tier/edge/selection helpers + `<defs>`), the three `view-*.js` files are the projections, and `index.html` wires them into the docking shell. Translate *from* `diagrams/`, not from this prose, when the two disagree. (`canvas/prism.jsx` remains the static visual-identity reference only.)

### 6.1 · Node taxonomy — color is bound to type, shape to role

Color answers *"what kind of thing is this?"*; shape answers *"what role does it play?"*. The two are orthogonal and **never** repurposed for decoration.

| Type        | Token              | Color   | Shape                         | Means                                  |
|-------------|--------------------|---------|-------------------------------|----------------------------------------|
| contract    | `--node-contract`  | indigo  | tile (rounded square)         | frozen promise between layers          |
| use case    | `--node-usecase`   | cyan    | tile                          | behaviour — what the system does       |
| aggregate   | `--node-aggregate` | magenta | tile                          | domain entity cluster (root)           |
| entity      | `--node-entity`    | magenta | **filled circle**             | identity-bearing member of an aggregate|
| value object| `--node-value`     | magenta | **hollow dashed chip**        | identity-LESS value (compared by value)|
| module      | `--node-module`    | neutral | rounded pill                  | code-level concrete                    |
| decision    | `--node-decision`  | violet  | **45° diamond**               | architectural decision / ADR           |
| actor       | `--node-actor`     | white   | **hollow glyph circle**       | external agent (dashed if third-party) |

Fills are a radial gradient from the type's primary → its adjacent hue (contract = indigo→violet, aggregate = magenta→coral, use case = cyan→indigo). Value objects carry **no fill** — a 1.2px dashed magenta outline only — because they have no identity to assert.

### 6.2 · Depth-of-field tiers

On every selection, classify each node by graph-distance from the selection and animate it to one of three tiers (`--tier-*` tokens). Nothing selected ⇒ everything is **focus** (flat, fully legible default).

| Tier      | Opacity | Scale | Blur     | Labels | Edges       | Distance |
|-----------|---------|-------|----------|--------|-------------|----------|
| **Focus** | 1.0     | 1.0   | none     | full   | full vivid  | selected or ≤1 hop (or pinned) |
| **Mid**   | 0.62    | 0.82  | 0.5 px   | dimmed | 0.5 alpha   | 2 hops   |
| **Ghost** | 0.20    | 0.6   | 1.5 px   | hidden | wispy trace | ≥3 hops / disconnected |

Interpolate with spring physics — never snap. This single move ("what you touch glows, the rest recedes") is what keeps a 200-node graph readable and is identical across all views. Implemented as `VizCore.computeTiers(ids, adjacency, selectedId)` + `TIER_STYLE`.

### 6.3 · Node treatment

- **Stroke:** 1.2px `rgba(255,255,255,0.42)` to lift off the canvas (dark); 1px `rgba(0,0,0,0.18)` in light mode.
- **Shadow:** `drop-shadow(0 6px 18px {type-glow}66)` — soft, tinted to the node's accent. Ghost/mid tiers swap the shadow for a `blurGhost`/`blurMid` SVG filter.
- **Label:** below the node, never inside it. Line 1 = 12px sans 600 (700 if selected); line 2 = 8.5px mono `:type` in `--text-mute`. Labels fade out entirely at the ghost tier.
- **State badges:**
  - **Drift** → 4.5px coral dot at top-right, `drop-shadow(0 0 7px coral)`. Never decorative — drift only.
  - **Frozen** → lime dashed ring at r+5 (sits under the selection ring if both apply).
  - **Stale** (downstream of an un-re-derived change) → opacity holds at ~0.55 until re-derive.

### 6.4 · Selection halo (universal)

The selected element, in *any* view, gets the same two-part halo:
- **Outer glow:** radius ≈ r×2.3, accent-tinted, opacity 0.3, `url(#glow)` blur.
- **Inner ring:** dashed `4 3`, 1.5px, **lime** (`--selection-ring`) — lime always means "this is yours to act on now."

### 6.5 · Edge grammar

- **Curve:** quadratic-ish bezier that bows outward; `lift ≈ 0.16` default, more for cross-cutting references (`0.22`) and decisions (`0.32`). `VizCore.curve()`; ERD uses orthogonal `VizCore.elbow()`.
- **Ink:** `--edge` focus, `--edge-mid` mid, `--edge-ghost` ghost. Width 1.8px (labeled) / 1.3px (plain) / down to 0.6px (ghost).
- **Containment** edges (`contains`, `has`) are muted + small arrowhead; **structural** edges (`derives`, `shapes`, `references`) are vivid.
- **Drift edge** → coral, dashed `5 5`. **Decision edge** → violet, dashed `5 5`, extra bow.
- **Label:** pill, `--surface-2` fill, mono 9–10px, centred at the midpoint.
- Arrowheads come from shared markers in `<defs>`: `arrow`, `arrowMuted`, `arrowCoral`, `arrowLime`.

### 6.6 · The views — one grammar, five projections

Each view keeps every rule above; only the **topology, layout and a few view-local marks** change. Selection, tiers, halo, inspector binding and the type→color map are constant.

**Domain (DDD)** — force-directed graph. Bounded contexts render as soft dashed **territory hulls** (catmull-rom closed, context-hue at 7% fill) behind their clusters. Layouts: `contexts` (centroid-clustered) · `force` · `radial`. The home of aggregates/entities/value objects/contracts/use-cases/decisions.

**Data (ERD)** — table cards. Each table is a glass card in its domain hue with a typed field row per column; field markers use `--erd-*`: `◆` PK (amber), `◇` FK (cyan), unique (violet), indexed columns get an indigo underline. Relationships are **crow's-foot** edges (one / many / zero-or-one) anchored on the FK row. Layouts: `spatial` (hand-placed) · `grid` (tidy columns). Tables map 1:1 to domain aggregates/entities — same name, same color.

**Flows** — request→response, caller's POV. Steps sit in horizontal **swimlanes** (Actor · Edge/API · Application · Domain · Infra). The happy path is a glowing **animated spine** (`--flow-happy`, marching dashes); error branches peel off dashed in `--flow-error`; the 2xx terminal wears a `--flow-ok` ring. Each step keeps its type color (a contract step is indigo, exactly as in the domain graph). Layouts: `horizontal` · `vertical`.

**Architecture** *(planned)* — layered bands with allowed/forbidden dependency edges (forbidden = coral, like drift). Reuses module + contract + boundary marks.

**UX / Sequence** *(planned)* — actor-goal lifelines, system POV. Reuses actor + use-case + message-edge marks.

> Layouts are computed in a **fixed virtual coordinate space** and fit-to-canvas via `d3-zoom`, so a diagram never overlaps itself at narrow widths — it letterboxes and scales. Keep this pattern for new views.

### 6.7 · Camera, layout & scale (Tauri build-out)

- **Layout:** `d3-force` (`link` + `manyBody` + `collide` + a per-view positioning force), settled synchronously for a calm first paint, then interactive. Above ~250 nodes, fall back to pre-computed / clustered layouts (see §11).
- **Zoom/pan:** shared `VizCore.attachZoom`; `fit()` frames the focus tier's bounding box (springs.gentle feel).
- **Pinning:** `⌘+click` adds a node to the pin set; pinned nodes count as focus regardless of selection.
- **Vignette/spotlight:** optional radial wash of `--indigo` at ~10% under the focus region for ambient depth — never darken the whole canvas.

---

## 7 · App shell & the docking workspace

The shell is three fixed bands; the middle band is a **fluid workspace** the user owns.

```
┌──────────────────────────────────────────────────────────────┐
│ Title bar (44px) — lights · brand · project · + Add panel ·   │
│                    ⟲ Reset layout · ⌘K search · avatar        │
├────┬─────────────────────────────────────────────────────────┤
│Rail│  Workspace (1fr) — a canvas of floating, dockable tiles  │
│56px│  ┌──────────┐ ┌───────────────────┐ ┌────────────┐       │
│ ◐  │  │ Outliner │ │ ◧ Domain (Canvas) │ │ Inspector  │ …     │
│ ⊟  │  └──────────┘ └───────────────────┘ └────────────┘       │
│ ≋  │  (drag headers · drag a tab out to detach · drop on an    │
│ ▤  │   edge to split · drop on a header to tab together)       │
├────┴─────────────────────────────────────────────────────────┤
│ Status bar (28px) — health/cascade · sync · agent             │
└──────────────────────────────────────────────────────────────┘
```

### Title bar
`var(--surface-0)` translucent, `backdrop-filter: blur(10px)`. macOS lights inset 12px left, then brand mark + a project chip. **Center holds workspace controls, not view tabs:** `+ Add panel` (opens the panel menu) and `⟲ Reset layout`. Right: `⌘K` search + avatar. View-switching is *never* here — it lives in the rail (principle 8).

### Rail (view-switching + global nav)
Glass, `rgba(255,255,255,0.02)`. Top group = the view angles, each a 48px icon with a tiny mono key beneath (`DOM` `ERD` `FLOW` `ARCH` `UX`). Active = `--indigo-bg` fill + a 2px indigo→magenta stripe on the left edge; disabled/"soon" views sit at 0.4 opacity. A spacer pushes a bottom group (settings ⚙, panels ◫) — that's the "global nav, separate from view tabs" the rail is *kept* for.

### Workspace (the canvas of tiles)
The middle band is a positioned surface with a faint dot-grid (`--ws-surface-dot`, 26px) that reads as a canvas. Every region is a **Frame** — a glass tile (`--ws-frame-bg`, `--ws-frame-radius`, `backdrop-filter: blur(22px)`) holding one or more **Panels** as tabs. Frames float; they can also snap into a tidy tiled arrangement. The diagram itself is just the **Canvas** panel — it floats and docks like any other.

**Panels (default set):** `Canvas` (◧, the active view's diagram + layout segmented + zoom; its tab label tracks the view name), `Outliner` (☰, element tree), `Inspector` (◳, selection detail), `Layers` (▦, type filters + legend), `Spec` (⌗, read-only preview of the spec Tessera would hand a coding agent for the selection — the forward hook for the edit→spec loop). Default layout: Outliner | Canvas | Inspector tiled edge-to-edge; Layers + Spec in the Add-panel tray.

**Frame anatomy:** a `--ws-header-h` (34px) header = tab strip (left) + window controls (collapse `–` / maximize `▢` / close `×`, right). Active tab carries an indigo→magenta underline.

**Interactions (all pointer-driven, see `workspace.js`):**
- **Move** — drag a header. Magnetic snap (`--ws-snap`, 9px) to surface edges and neighbour frame edges.
- **Resize** — 8 edge/corner handles, snapping to the same guides; `MIN 200×120`.
- **Tab together** — drag a frame onto another's header zone → its panels merge in as tabs (`--ws-dock-tab` violet hint).
- **Split** — drag a frame onto another's left/right/top/bottom quarter → the two sit side-by-side, each taking half (`--ws-dock-split` indigo hint).
- **Detach** — drag a single tab out of a multi-tab group → it pops into a new floating frame at the pointer.
- **Collapse / Maximize / Close** — header buttons; closed panels return to the Add-panel tray (never destroyed). Double-click header = maximize toggle.

**Persistence:** the full layout (frame rects, z-order, tab groups, tray, active view) serializes to `localStorage` on every change and restores on load. `⟲ Reset layout` clears it and rebuilds the default. Panel bodies are **parked, never destroyed**, so D3 state, scroll position and selection survive every drag/tab/split.

**Selection is the single source of truth.** It lives in app state, not in any panel — so dragging, tabbing, splitting or closing panels never loses what's selected. The Canvas highlight, Outliner active row, Inspector and Spec all read from it. Re-fit the Canvas diagram on its frame's resize/activate (a parked, zero-size panel must re-fit when shown).

---

## 8 · Components

### Buttons

| Variant     | Background                                | Border                       | Text         | Used for                          |
|-------------|-------------------------------------------|------------------------------|--------------|-----------------------------------|
| **Primary** | `var(--accent-grad)`                      | 1px `var(--indigo-hi)`       | white 600    | One per screen. Freeze, Re-derive |
| Secondary   | `rgba(255,255,255,0.04)` (glass)          | 1px `var(--line)`            | text 500     | Edit, Cancel, Open                |
| Ghost       | transparent                                | none                         | `--text-dim` | Tertiary actions, dismiss          |
| Danger      | `var(--coral-bg)`                          | 1px `rgba(coral,0.55)`       | coral 600    | Discard, Delete, Accept drift     |
| Disabled    | inherit                                    | inherit                      | inherit 0.4α | All variants                       |

- Heights: sm `5+11px`, md `8+14px`, lg `10+18px`.
- Border radius: `--radius-4` (10px).
- Hover: lighten background by 4%, transition with `linear 120ms`.
- Loading: replace icon position with 12px Spinner (lime stroke on primary, indigo on others).
- Primary boxShadow on hover: scale glow to `0 8px 28px -4px rgba(91,107,255,1.0)`.

### Inputs

- Padding `8px 11px`, radius `--radius-3` (8px), background `rgba(255,255,255,0.03)`, border `1px var(--line)`.
- **Focused**: border `var(--indigo)`, boxShadow `0 0 0 3px var(--indigo-bg)`.
- Mono inputs for IDs, paths, queries. Body font for prose (notes, annotations).
- Filter inputs in graph chrome get a `/` glyph in indigo-hi at left, `⌘F` chip at right.

### Menus & command palette

**Standard menu:**
- Float card: `--surface-2`, `--radius-5`, `--elev-3`, `backdrop-filter: blur(20px)`.
- Rows: 7-10px padding, hover background `--surface-3`. Right side shows `⌘K`-style hotkey hint in `--text-mute` mono.
- Destructive items: `--coral` text.

**Command palette:**
- Larger glass card, `--elev-4` (uses indigo glow shadow).
- Header: `›` prompt in indigo-hi + mono input + blinking caret (lime).
- Results: rows with type badge (colored square + glyph), label, sub (mono mute), `:type` chip on right.
- Hot/selected row: `--indigo-bg` background + `2px solid var(--indigo)` left border.

### Cards & glass panels

- Background: `rgba(255,255,255,0.025)` over `--canvas`. In light mode: `rgba(7,8,15,0.025)`.
- Border: 1px `--line`. Radius: `--radius-4` (10px) for content cards, `--radius-5` (12px) for floating ones.
- Always apply `backdrop-filter: blur(20px)` on glass surfaces. Provide `-webkit-` prefix.

### Chips & pills

- **Filter chip** (graph type filter): background `--surface-1`, 1px `--line`, radius `--radius-full`. Inside: 8px squared color dot + label sans 11px 500 + mono 9.5px count.
- **State badge** (frozen / drafting / locked): mono 9px 600 uppercase, 2px 6px padding, accent border, low-alpha accent bg.
- **Annotation pill** (in inspector lists): left-edge 3px accent strip + label + author/time.

### Diff surfaces

The graph diff uses the same node treatment as the main mosaic. Side-by-side panels:
- Before panel: same diagram with the removed node ghosted (dashed coral ring, strikethrough label, opacity 0.55).
- After panel: same diagram with the added node showing a dashed lime ring at r+8 (the "added" indicator).
- Below panels: 3-column change list. Each row: glass card, left border 3px in semantic color (lime add / coral remove / amber change), sans label + mono meta.
- Diff pills at top: small rounded chips, accent border + bg, mono uppercase label.

### Empty / loading / error

All three live inside a glass "state box": radius `--radius-6`, 32×24 padding, content centered, min-height 320.

- **Empty**: 64px Prism logo + h3 + body line + primary/ghost button pair.
- **Loading**: animated grid of small tiles (`Tile assembly` choreography), bold caption, mono progress text, gradient progress bar (`linear-gradient(90deg, indigo, magenta)`).
- **Error**: 64px circle (coral bg + 1px coral border) with bold `!` glyph + glow, h3 + body + primary "fix" + danger "accept" buttons.

---

## 9 · Iconography

Tessera does not use a free icon library. The chrome uses glyphs from the Unicode geometric set — they look like primitives, scale crisply, and avoid the "stock icon" tell. The shipped chrome uses:

| Glyph | Role                          |
|-------|-------------------------------|
| ◐     | Domain view (rail key `DOM`)  |
| ⊟     | Data / ERD view (`ERD`)       |
| ≋     | Flows view (`FLOW`)           |
| ▤     | Architecture view (`ARCH`)    |
| ⇄     | UX / sequence view (`UX`)     |
| ◧     | Canvas panel                  |
| ☰     | Outliner panel                |
| ◳     | Inspector panel               |
| ▦     | Layers panel (filters+legend) |
| ⌗     | Spec panel                    |
| ⚙ ◫   | Rail global nav (settings, panels) |

If you need additional glyphs (e.g. for filters or actions), prefer Phosphor `regular` weight at 1px stroke, color `--text-dim`. Keep one glyph bound to one meaning, the same way color is bound to type.

---

## 10 · UX rules

1. **One primary action per screen.** Always the indigo gradient button. If you need two, demote one to secondary.
2. **View-switching is the rail; panels are tabs/segments inside frames.** Don't put view tabs in the title bar. Inspector-style sectioning uses tabs; mode switches (force/layered/radial, spatial/grid) use the segmented control.
3. **State badges over icon-only indicators.** "FROZEN" reads instantly; a lock icon doesn't.
4. **Inspector follows the canvas selection.** Selecting a node in any view updates the inspector — and the spec preview and outliner highlight — to that element. Selection is global state, not panel-local.
5. **Annotations bind to node IDs, not positions.** When a node moves under force layout, its annotations move with it.
6. **Search is everywhere.** `⌘K` from anywhere opens the command palette. `/` in the canvas focuses the filter input.
7. **Freeze is a one-way commit by default.** Unfreezing requires an explicit "unfreeze" action that surfaces downstream consequences (which nodes will become stale).
8. **Drift is loud but never blocking.** Coral indicator + status bar entry, but the user can keep working. Resolution is async.
9. **The graph always animates between states.** Snap-cuts hide what's happening at the data layer; springs make it legible.
10. **The layout is the user's and it persists.** Frames can be moved, tabbed, split, floated and closed freely; the arrangement survives reload. Always offer one-click `Reset layout`. Closing a panel parks it in the tray — never destroy its state.

---

## 11 · Open questions for implementation

These are intentional gaps — answer them with Claude Code when you get there:

- **Force-direction tuning:** at what node count does the force sim become unusable? Implement a fallback (Cytoscape `cose-bilkent` or pre-computed layouts) above N nodes.
- **3D mode:** when does the "3D space" navigation kick in? Default to 2D + camera; expose 3D as a setting or auto-engage past a node count threshold.
- **Persistence of pinned nodes:** local-only or per-project graph metadata?
- **Light mode parity:** every artboard ships dark + light, but the brand reads dark-first. Confirm with users which mode they default to.
- **High-DPI / Retina sharpness:** validate the glass blur effects don't degrade on non-Retina displays.

---

## 12 · Files in this folder

| File                            | Purpose                                       |
|---------------------------------|-----------------------------------------------|
| `README.md`                     | Folder orientation                            |
| `CLAUDE.md`                     | Instructions for Claude Code working here     |
| `DESIGN_SYSTEM.md`              | This document                                 |
| `tokens.css`                    | Drop-in CSS variables (single source of truth for token values) |
| `canvas/index.html`             | Live design canvas — open in a browser        |
| `canvas/design-canvas.jsx`      | Canvas chrome (starter component, don't modify) |
| `canvas/shared.jsx`             | Demo graph data + helpers + window chrome     |
| `canvas/prism.jsx`              | **The chosen direction.** All 5 artboards.    |
| `canvas/alternates/instrument.jsx` | Rejected alternate — kept for reference       |
| `canvas/alternates/studio.jsx`  | Rejected alternate — kept for reference       |
| `diagrams/index.html`           | **Canonical reference implementation** — the docking workspace + all views, in real D3. Open in a browser. |
| `diagrams/viz-core.js`          | The shared diagram grammar (color/shape/tier/edge/selection helpers + `<defs>`) |
| `diagrams/view-domain.js`       | Domain (DDD) projection — force graph + context hulls |
| `diagrams/view-data.js`         | Data (ERD) projection — table cards + crow's-foot edges |
| `diagrams/view-flow.js`         | Flows projection — swimlanes + animated happy path |
| `diagrams/workspace.js`         | The docking engine (frames, drag/snap/tab/split/float, persistence) |
| `diagrams/app.js`               | Wires views + panels onto the workspace; owns selection |
| `diagrams/data.js`              | The shared "Atlas Stays" demo model feeding every view |

Two reference layers, different jobs: **`canvas/prism.jsx`** is the frozen *visual-identity* reference (the 5 chosen artboards). **`diagrams/`** is the *behavioural* reference — the diagram language and docking workspace built and validated in real D3. When implementing in Tauri, translate structure and interaction from `diagrams/` and check final look against `canvas/`.

---

*Built 2026.05. Update this doc whenever a token changes — it is the only place token values should be authored.*
