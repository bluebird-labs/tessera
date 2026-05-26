# CLAUDE.md — design/

Instructions for Claude Code when working inside `crates/desktop/design/`.

## What this folder is

This is the visual identity reference for the Tessera desktop app. It's a *spec*, not implementation. The Vite/React app lives in `crates/desktop/src/`; this folder tells you what it should look like.

## How to use it

Different tasks need different files. Don't read everything every time.

| Task | Read first |
|---|---|
| Add a new screen | `DESIGN_SYSTEM.md` §1 (principles), §7 (shell), §8 (components) |
| Build the graph canvas | `DESIGN_SYSTEM.md` §6 (Mosaic diagram model) — most important section in the doc. Cross-reference `canvas/prism.jsx#PrismMosaic` |
| Style tokens or theming | `tokens.css` — copy into the app's global stylesheet. Reference `DESIGN_SYSTEM.md` §2 for what each token *means*. |
| Component styling (button, input, menu) | `DESIGN_SYSTEM.md` §8. Source for visual reference: `canvas/prism.jsx` Components section. |
| Motion / animation | `DESIGN_SYSTEM.md` §5. Springs are the default; linear easing only for short hover color shifts. |
| Empty / loading / error | `DESIGN_SYSTEM.md` §8 (states) |

## Looking at the canvas

Most subjective decisions should be checked against the live canvas, not the markdown. Open it:

```sh
open crates/desktop/design/canvas/index.html
```

If you need to inspect a specific artboard programmatically, read the relevant file in `canvas/` directly — these are real React components, not opaque images. `canvas/prism.jsx` is where all the chosen-direction artboards live.

## Token authoring rules

`tokens.css` is the only place token values are authored. If you change a token:

1. Update `tokens.css`
2. Update the matching table in `DESIGN_SYSTEM.md` §2
3. Search the app for hardcoded references and replace with the variable

Do not invent new tokens inside `crates/desktop/src/`. If you need a value that isn't here, add it to `tokens.css` first.

## Cardinal rules (these come from §10 of the design system, repeated here for visibility)

1. **One primary action per screen.** The indigo gradient button. Promote/demote others.
2. **Lime means frozen / done / success.** Nothing else, ever.
3. **Coral/magenta means drift / destructive.** Never decorative.
4. **Color carries meaning** — hue maps to node type. Don't introduce a new accent without a semantic reason.
5. **Springs, not eases.** Snap transitions are reserved for hover color shifts.

## What's intentionally underspecified

These are decisions for the implementer (see `DESIGN_SYSTEM.md` §11 for the full list):

- Force-direction tuning for very large graphs
- When 3D mode kicks in vs. 2D + camera
- Persistence model for pinned nodes
- High-DPI tuning for backdrop-blur

Don't invent answers — ask the user.

## What you should *not* do

- Don't modify `canvas/alternates/` — those are the rejected directions kept for historical reference.
- Don't add new HTML files to the canvas. The canvas is frozen; if you want to prototype new screens, do it in the app.
- Don't add raster image assets here. The brand is type + color + motion. If you genuinely need imagery, ask first.

---

*Folder maintained as Tessera's design contract. If you change the contract, change this folder.*
