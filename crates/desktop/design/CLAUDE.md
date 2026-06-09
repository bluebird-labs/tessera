# CLAUDE.md — design/

Instructions for Claude Code when working inside `crates/desktop/design/`.

## What this folder is

The visual-identity and interaction reference for the Tessera desktop app. It's a *spec + reference implementation*, not the shipping app. The Vite/React (Tauri) app lives in `crates/desktop/src/`; this folder tells you what it should look like and how it should behave.

Two reference layers, different jobs:
- **`canvas/prism.jsx`** — frozen *visual-identity* reference. The 5 chosen artboards. Check final look against this.
- **`diagrams/`** — *behavioural* reference. The diagram language + the docking workspace, built and validated in real D3. Translate structure and interaction from here.

## How to use it

Different tasks need different files. Don't read everything every time.

| Task | Read first |
|---|---|
| Style tokens or theming | `tokens.css` (single source of truth) + `DESIGN_SYSTEM.md` §2 for what each token *means*. |
| Build / change the diagram canvas | `DESIGN_SYSTEM.md` §6 (the diagram language) — the most important section. Then read `diagrams/viz-core.js` (the grammar) and the relevant `diagrams/view-*.js`. |
| Add a **new view angle** (e.g. Architecture, UX) | `DESIGN_SYSTEM.md` §6.6. Implement it as a new `view-*.js` that reuses `viz-core.js` — do **not** invent new colors, shapes, tier logic or edge styles. Register it on the rail. |
| Build / change the workspace (panels, docking) | `DESIGN_SYSTEM.md` §7 + `diagrams/workspace.js` (engine) and `diagrams/app.js` (how panels register + how selection stays global). |
| Add a new screen / panel | `DESIGN_SYSTEM.md` §1 (principles), §7 (shell + workspace), §8 (components) |
| Component styling (button, input, menu) | `DESIGN_SYSTEM.md` §8. Visual reference: `canvas/prism.jsx` Components section. |
| Motion / animation | `DESIGN_SYSTEM.md` §5. Springs are the default; linear easing only for short hover color shifts. |
| Empty / loading / error | `DESIGN_SYSTEM.md` §8 (states) |

## Looking at the references

Subjective decisions get checked against the live files, not the markdown:

```sh
open crates/desktop/design/diagrams/index.html   # workspace + all views, interactive
open crates/desktop/design/canvas/index.html      # the visual-identity artboards
```

Both are real code, not opaque images — read the source directly. `diagrams/viz-core.js` is where the grammar lives; if prose and code disagree, **the code wins**.

## Token authoring rules

`tokens.css` is the only place token values are authored. If you change a token:

1. Update `tokens.css`
2. Update the matching table/section in `DESIGN_SYSTEM.md`
3. Search the app for hardcoded references and replace with the variable

Do not invent new tokens inside `crates/desktop/src/`. If you need a value that isn't here, add it to `tokens.css` first. The diagram language has dedicated token groups — `--node-*`, `--tier-*`, `--edge-*`, `--erd-*`, `--flow-*`, `--selection-ring` — and the workspace has `--ws-*`. Extend those groups; don't hardcode.

## Cardinal rules

1. **One primary action per screen.** The indigo gradient button. Promote/demote others.
2. **Lime means frozen / done / success, and the selection ring.** Nothing else, ever.
3. **Coral/magenta means drift / destructive / forbidden.** Never decorative.
4. **Color is bound to node type; shape to role.** (§6.1) Don't add an accent without a semantic reason, and don't recolor a type.
5. **One language, many views.** A new view angle re-projects the *same* grammar (`viz-core.js`) onto a new topology. Selection, depth tiers, the lime halo, edge grammar and the inspector binding must behave identically to the existing views.
6. **Selection glows, the rest fades.** Every view runs the focus/mid/ghost tier model on selection (§6.2). Animate the transition — never snap.
7. **The workspace is the user's.** Panels float, dock, tab, split, resize; layout persists; `Reset layout` always exists. View-switching is the rail, never title-bar tabs. (§7)
8. **Selection is global state, not panel-local.** Dragging/tabbing/splitting/closing panels must never lose what's selected. Park panel bodies; don't destroy them.
9. **Springs, not eases.** Snap transitions are reserved for hover color shifts.

## What's intentionally underspecified

Decisions for the implementer (see `DESIGN_SYSTEM.md` §11):

- Force-direction tuning + fallback layout for very large graphs
- When 3D / camera-depth navigation engages vs. 2D
- Persistence model for pinned nodes (local vs. per-project metadata)
- High-DPI tuning for backdrop-blur
- Whether floating frames may overflow the workspace bounds or are always clamped

Don't invent answers — ask the user.

## What you should *not* do

- Don't modify `canvas/alternates/` — rejected directions kept for reference.
- Don't add new HTML files to `canvas/` — it's frozen. Prototype new screens in the app or in `diagrams/`.
- Don't put view-switching in the title bar (principle 8 / §7).
- Don't re-skin the diagram per view — the grammar is shared on purpose.
- Don't add raster image assets here. The brand is type + color + motion. If you genuinely need imagery, ask first.

---

*Folder maintained as Tessera's design contract. If you change the contract, change this folder.*
