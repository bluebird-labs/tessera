# Tessera Design

The single source of truth for the visual language of the Tessera desktop app. Direction: **Prism** — vibrant, dark-first, glass surfaces, multi-hue semantic accents, depth-of-field diagrams.

## How to read this folder

```
desktop/design/
├── README.md              ← you are here
├── CLAUDE.md              ← instructions for Claude Code working in this folder
├── DESIGN_SYSTEM.md       ← the full design system: tokens, type, motion, components, UX rules
├── tokens.css             ← drop-in CSS variables (the only place token values live)
└── canvas/
    ├── index.html         ← open this in a browser to see the live design canvas
    ├── design-canvas.jsx  ← pan/zoom/focus canvas chrome (don't modify)
    ├── shared.jsx         ← demo graph data + helpers
    ├── prism.jsx          ← the chosen direction · all 5 reference artboards
    └── alternates/        ← rejected directions, kept for reference only
        ├── instrument.jsx
        └── studio.jsx
```

## What's inside

The canvas contains five artboards covering every surface the app needs:

1. **Foundations** — the brand, spectrum, type specimen, node legend, motion specs.
2. **App shell · Dark** — the full window: title bar, rail, outliner, mosaic stage, inspector, status bar.
3. **App shell · Light** — same shell in light mode (dark is the brand-default).
4. **Inspector & graph diff** — node detail panel + side-by-side graph diff.
5. **Components & states** — buttons, inputs, menus, command palette, empty / loading / error states.

Every artboard is a working hi-fi mockup, not a wireframe. The depth-of-field mosaic in `prism.jsx#PrismMosaic` is the reference for how the production D3 graph should feel: vivid focus, dimmer mid-tier, blurred ghost field, vignette pulling the eye to the focal area.

## Open the canvas

```sh
# from repo root
open crates/desktop/design/canvas/index.html
```

The canvas is a React + Babel-in-browser sandbox, no build step required. Pan with mouse drag, zoom with scroll, click ⤢ on any artboard to focus it full-screen.

## Workflow

- **Adding a screen?** Find the closest existing artboard's surfaces in `DESIGN_SYSTEM.md` §7–8. Tokens come from `tokens.css`.
- **Adding a new token?** Update `tokens.css` *and* the relevant section in `DESIGN_SYSTEM.md`. Both must move together.
- **Building the graph view?** Read `DESIGN_SYSTEM.md` §6 (Mosaic diagram model) carefully; the depth tiers + camera model are the heart of the experience.
- **Light mode work?** Open `App shell · Light` in the canvas to see the exact surfaces, then implement against the same semantic aliases — light just overrides primitives.

## What's *not* in here

- No app code. This folder describes the visual contract; implementation lives elsewhere under `crates/desktop/src/`.
- No icon set. The chrome uses Unicode geometric glyphs (▦ ≡ ◇ ◐ ◬ ◷ ✦); when you need more, default to Phosphor `regular` weight.
- No images. There aren't any — the brand identity is type + color + motion, not artwork.

---

*Identity exploration completed 2026.05. If you fundamentally re-think the visual language, please update this folder rather than letting it drift.*
