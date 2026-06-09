# Tessera Design

The single source of truth for the visual language of the Tessera desktop app. Direction: **Prism** — vibrant, dark-first, glass surfaces, multi-hue semantic accents, depth-of-field diagrams.

## How to read this folder

```
desktop/design/
├── README.md              ← you are here
├── CLAUDE.md              ← instructions for Claude Code working in this folder
├── DESIGN_SYSTEM.md       ← the full design system: tokens, type, motion, the diagram language, the docking workspace, components, UX rules
├── tokens.css             ← drop-in CSS variables (the only place token values live)
├── canvas/                ← frozen VISUAL-IDENTITY reference (5 artboards)
│   ├── index.html         ← open in a browser to see the live design canvas
│   ├── design-canvas.jsx  ← pan/zoom/focus canvas chrome (don't modify)
│   ├── shared.jsx         ← demo graph data + helpers
│   ├── prism.jsx          ← the chosen direction · all 5 reference artboards
│   └── alternates/        ← rejected directions, kept for reference only
└── diagrams/              ← BEHAVIOURAL reference: the diagram language + docking workspace in real D3
    ├── index.html         ← open in a browser · interactive workspace + all views
    ├── viz-core.js        ← the shared diagram grammar (color/shape/tier/edge/selection)
    ├── view-domain.js     ← Domain (DDD) · view-data.js (ERD) · view-flow.js (Flows)
    ├── workspace.js       ← the floating/docking panel engine
    ├── app.js             ← wires views + panels onto the workspace; owns selection
    └── data.js            ← the shared "Atlas Stays" demo model feeding every view
```

## What's inside

The canvas contains five artboards covering every surface the app needs:

1. **Foundations** — the brand, spectrum, type specimen, node legend, motion specs.
2. **App shell · Dark** — the full window: title bar, rail, outliner, mosaic stage, inspector, status bar.
3. **App shell · Light** — same shell in light mode (dark is the brand-default).
4. **Inspector & graph diff** — node detail panel + side-by-side graph diff.
5. **Components & states** — buttons, inputs, menus, command palette, empty / loading / error states.

Every artboard is a working hi-fi mockup, not a wireframe. The depth-of-field mosaic in `prism.jsx#PrismMosaic` is the reference for how the production D3 graph should feel: vivid focus, dimmer mid-tier, blurred ghost field, vignette pulling the eye to the focal area.

## Open the references

```sh
# from repo root
open crates/desktop/design/diagrams/index.html   # the diagram language + docking workspace (interactive)
open crates/desktop/design/canvas/index.html      # the 5 visual-identity artboards
```

Both are React/D3 + browser sandboxes, no build step. In `diagrams/`: drag panel headers to move, drag a tab out to detach, drop a frame on another's edge to split or on its header to tab them together, and use **Add panel** / **Reset layout** in the title bar. In `canvas/`: pan with drag, zoom with scroll, click ⤢ on any artboard to focus it.

## Workflow

- **Adding a screen?** Find the closest existing artboard's surfaces in `DESIGN_SYSTEM.md` §7–8. Tokens come from `tokens.css`.
- **Adding a new token?** Update `tokens.css` *and* the relevant section in `DESIGN_SYSTEM.md`. Both must move together.
- **Building the graph view?** Read `DESIGN_SYSTEM.md` §6 (the diagram language) carefully; the depth tiers + shared grammar are the heart of the experience. The working build is in `diagrams/` — `viz-core.js` is the grammar, the `view-*.js` files are the projections.
- **Adding a new view angle?** Re-project the *same* grammar: a new `diagrams/view-*.js` on top of `viz-core.js`, registered on the rail. Never invent new colors/shapes/tiers per view.
- **Building the workspace?** Read §7 + `diagrams/workspace.js` (engine) and `diagrams/app.js` (panel registration + global selection).
- **Light mode work?** Open `App shell · Light` in the canvas to see the exact surfaces, then implement against the same semantic aliases — light just overrides primitives.

## What's *not* in here

- No app code. This folder describes the visual contract; implementation lives elsewhere under `crates/desktop/src/`.
- No icon set. The chrome uses Unicode geometric glyphs (◐ ⊟ ≋ ▤ ⇄ for views; ◧ ☰ ◳ ▦ ⌗ for panels); when you need more, default to Phosphor `regular` weight.
- No images. There aren't any — the brand identity is type + color + motion, not artwork.

---

*Identity exploration completed 2026.05. If you fundamentally re-think the visual language, please update this folder rather than letting it drift.*
