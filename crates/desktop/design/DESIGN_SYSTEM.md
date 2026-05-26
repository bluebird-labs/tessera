# Tessera · Visual Identity & Component Handoff

**Direction:** Prism · vibrant, dark-first, glass surfaces, multi-hue accent system, depth-of-field diagrams.

This document is the source of truth for the Tessera desktop app's visual language. It pairs with `Tessera Identity.html` (the live design canvas) for visual reference. Implementation lives in `crates/desktop/`; this doc tells you what to build, not how to build it.

---

## 1 · Visual principles

1. **Color carries meaning.** Hue maps to graph-node type, never to decoration. Never introduce a new accent without a semantic reason.
2. **Surfaces are glass, not paint.** Panels use translucent dark fills with backdrop blur. Lines are 6–12% white over the canvas, not solid grays.
3. **Selection glows, the rest fades.** The graph and inspector both follow the same focus model — what you're working on is vivid; everything else recedes.
4. **Type carries hierarchy.** Display weights are tight (`-2.5%` to `-3.5%` tracking). UI is medium. Mono is for anything copyable: IDs, queries, code, diff.
5. **Motion is springs.** Transitions snap with stiff/soft springs (see §5). Linear easing is reserved for hover-state color shifts only.
6. **No ornament.** No skeuomorphic textures, no gratuitous gradients, no shadows that don't carry meaning. Glows tint to the element's accent — they're shorthand for "this is alive."

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
  /* Node types — each is bound to one accent forever */
  --node-contract:      var(--indigo);    /* frozen API/promise */
  --node-usecase:       var(--cyan);      /* behavior */
  --node-aggregate:     var(--magenta);   /* domain entity cluster */
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

## 6 · The Mosaic diagram model

The defining surface. Three tiers of presence + camera-driven focus.

### Tiers

| Tier      | Opacity | Size factor | Blur     | Labels        | Edges          |
|-----------|---------|-------------|----------|---------------|----------------|
| **Focus** | 1.0     | 1.0         | none     | full          | full vivid     |
| **Mid**   | 0.78    | 0.6–0.7     | 0.4 px   | dimmed        | 0.5 alpha      |
| **Ghost** | 0.15–0.35 | 0.2–0.35  | 1.4 px   | hidden        | wispy traces   |

### Membership rules

A node is **focus** if:
- It's selected, OR
- It's within graph-distance 1 of the selected node, OR
- It's in the user's pinned set (manual override).

A node is **mid** if it's within graph-distance 2 of any focus node.

Everything else is **ghost**.

Tiers are re-evaluated on every selection change with spring-physics interpolation of opacity/scale/blur (don't snap — animate).

### Node visual treatment

- **Shape:** circle by default (r = 24–32 in focus, 14–18 in mid). Decision uses a 45°-rotated rounded square (marker). Actor uses a hollow circle (surface fill + outline only).
- **Fill:** radial gradient from the type's primary → adjacent hue (e.g. contract = indigo → violet, aggregate = magenta → coral).
- **Stroke:** 1.2px `rgba(255,255,255,0.42)` to lift off the canvas in dark mode; in light mode use 1px `rgba(0,0,0,0.18)`.
- **Drop shadow:** `drop-shadow(0 6px 20px {type-glow}70)` — soft, tinted to the node's accent.
- **Label:** below the node, never inside it. 12px sans 600 (700 if selected) on line 1; 9.5px mono uppercase `:type` on line 2 in `--text-mute`.
- **Badges:**
  - Drift → 5px coral circle at top-right with `drop-shadow(0 0 8px coral)`.
  - Frozen → lime dashed ring at r+8 (overlaid on selection ring if also selected).
  - Stale (downstream of a recently changed upstream) → opacity drops to 0.55, stays until re-derive.

### Selection halo

- Outer glow: radius = node.r × 2.4, accent color, opacity 0.32, Gaussian blur stdDev=14.
- Inner ring: dashed 4-3, 1.5px, lime (= "this is yours to act on now").

### Edges

- **Curve:** quadratic bezier with `lift = 0.16` for focus edges, `0.18` for mid (slightly more bow on background to imply 3D parallax). See `curvePath` in `shared.jsx` for the math.
- **Stroke:** `rgba(255,255,255,0.55)` focus, `rgba(255,255,255,0.16)` mid, `rgba(255,255,255,0.05)` ghost.
- **Width:** 1.8px (focus, with label), 1.4px (focus, no label), 1.1px (mid), 0.6px (ghost).
- **Drift edge:** coral, dashed `5 5`, opacity 0.7.
- **Decided-by edge** (decision → contract): violet, dashed `5 5`, slight extra curve.
- **Edge label:** pill shape, surface-2 fill, mono 10px, centered at midpoint with -8px y offset.

### Camera & vignette

- Radial vignette overlay: transparent at center 55%, fading to canvas color at edges (opacity 0.85 dark, 0.7 light). Pulls eye to focal region without darkening the whole canvas.
- Spotlight: faint radial gradient of `--indigo` at 10% alpha centered on focal area, gives subtle aurora-like ambient glow under the focus tier.

### 3D / depth navigation (Tauri build-out)

For the real D3 layout in Tauri:

1. **Layout:** run `d3-force` with `link`, `manyBody`, `center`, plus a custom `radial` force pulling pinned/selected nodes inward.
2. **Camera:** maintain `{ x, y, zoom }` state. On selection change, smoothly retarget camera to the bounding box of the focus tier (springs.gentle).
3. **Z-depth feel:** apply opacity & blur curves driven by *screen distance from camera target* (not graph distance — these are different and both useful, but the visual fade should follow screen distance to keep edge motion stable during pan).
4. **Pinning:** user can `⌘+click` a node to add to pin set. Pinned nodes count as focus regardless of selection.

---

## 7 · App shell layout

```
┌──────────────────────────────────────────────────────────────┐
│ Title bar (40–44px) — chrome / breadcrumb / search / avatar  │
├────┬──────────┬─────────────────────────────────┬────────────┤
│Rail│ Outliner │           Stage                 │ Inspector  │
│56px│  232px   │           1fr                   │   296px    │
│    │          │                                 │            │
├────┴──────────┴─────────────────────────────────┴────────────┤
│ Status bar (24–28px)                                         │
└──────────────────────────────────────────────────────────────┘
```

- **Title bar:** `var(--surface-0)` translucent with `backdrop-filter: blur(10px)`. macOS traffic lights inset at 12px left. Center: connection breadcrumb `project › branch › view`. Right: search button + avatar circle.
- **Rail:** background `rgba(255,255,255,0.02)` glass. 7 icons, 48px tall each. Active = `--indigo-bg` background + gradient indicator stripe on left edge (2px wide, indigo→magenta).
- **Outliner:** glass card, 4 sections — Cascade rows (with state badges), Views list, footer with sync status.
- **Stage:** the mosaic lives here. Header (view title + node count), filter bar (type pills + layout segmented), then full-bleed graph canvas.
- **Inspector:** glass card, 4 tabs (Schema, Cascade, History, Notes). Schema tab shows the contract as syntax-highlighted JSON. Footer has primary (gradient) + secondary buttons.
- **Status bar:** mono 10px, three regions: health/cascade summary | sync info | agent status.

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

Tessera does not use a free icon library. The chrome uses six glyphs from the Unicode geometric set — they look like primitives, scale crisply, and avoid the "stock icon" tell:

| Glyph | Role                |
|-------|---------------------|
| ▦     | Mosaic / graph      |
| ≡     | Cascade / stages    |
| ◇     | Contracts / domain  |
| ◐     | Domain modeling     |
| ◬     | Agents              |
| ◷     | History             |
| ✦     | Decisions / settings |

If you need additional glyphs (e.g. for filters or actions), prefer Phosphor `regular` weight at 1px stroke, color `--text-dim`.

---

## 10 · UX rules

1. **One primary action per screen.** Always the indigo gradient button. If you need two, demote one to secondary.
2. **Tabs are sectioning, segmented controls are mode switches.** Inspector uses tabs. Layout (force/layered/radial) uses segmented.
3. **State badges over icon-only indicators.** "FROZEN" reads instantly; a lock icon doesn't.
4. **Inspector follows the canvas selection.** Selecting a node in the graph updates the inspector to that node's schema/cascade/history.
5. **Annotations bind to node IDs, not positions.** When a node moves under force layout, its annotations move with it.
6. **Search is everywhere.** `⌘K` from anywhere opens the command palette. `/` in the canvas focuses the filter input.
7. **Freeze is a one-way commit by default.** Unfreezing requires an explicit "unfreeze" action that surfaces downstream consequences (which nodes will become stale).
8. **Drift is loud but never blocking.** Coral indicator + status bar entry, but the user can keep working. Resolution is async.
9. **The graph always animates between states.** Snap-cuts hide what's happening at the data layer; springs make it legible.

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

The depth-of-field diagram logic is in `canvas/prism.jsx` under `PrismMosaic` / `PrismMiniMosaic` — use it as the reference implementation pattern when translating to D3 + canvas/SVG in the Tauri app.

---

*Built 2026.05. Update this doc whenever a token changes — it is the only place token values should be authored.*
