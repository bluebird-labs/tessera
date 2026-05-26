# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

[`ABOUT.md`](ABOUT.md) is the source of truth for what Tessera is. Briefly: a knowledge-graph-centered ecosystem (desktop app, CLI, MCP server, cloud-backed graph) for engineers retaining architectural control as agents take on more work. Code and domain live in one graph; work flows through a cascade of frozen layers (contracts → use cases → placement → implementation), with annotations bound to stable node IDs and upstream edits propagating downstream automatically. Open-core: CLI, MCP server, single-user desktop app, and the graph schema/modeling primitives are OSS; the shared cloud graph + team/enterprise integrations are commercial.

This repo is the open-core *foundation*. It ships the `tessera` CLI, a per-language indexer (`tessera index`), the canonical graph types (`tessera-graph`), and a TerminusDB persistence layer (`tessera-store`). The DDD/domain layer, cascading-contracts workflow, and review/UX surfaces described in `ABOUT.md` sit above this substrate and are not in this repo. When working here, don't expand scope into product, UI, or workflow concerns — the structural graph and the tooling around it are the unit of work.

## Build & test

Workspace uses Cargo with `resolver = "3"` and edition 2024; toolchain is pinned to 1.85 by `rust-toolchain.toml` (rustup fetches it on first build).

```sh
cargo xtask cli -- --help            # run the existing CLI from the repo root
cargo xtask desktop                  # launch the Tauri desktop app
cargo xtask desktop-build            # build the Vite UI and desktop crate
cargo xtask check                    # fmt, clippy, CLI tests, desktop builds
cargo test  -p tessera-cli -- <name> # single CLI test by name substring
```

`forks/` is gitignored and excluded from the workspace (`exclude = ["forks"]`); never add it to `members`. It holds shallow clones of real-world projects used as analyzer fixtures — see `docs/test-repos.md` for the curated list and `docs/fixtures.md` for per-fork setup.

## Lint baseline

`unsafe_code` is `forbid`-level workspace-wide, and clippy `all`, `pedantic`, `nursery`, and `cargo` groups are all denied in the root `Cargo.toml` (`[workspace.lints]`). New code is expected to clear that bar — `cargo xtask check` runs `cargo clippy --workspace --all-targets` and will reject pedantic/nursery violations the same way it rejects errors. The narrow set of project-wide allowances (e.g. `module_name_repetitions`, `must_use_candidate`, `missing_errors_doc`) is documented inline next to the lint table; don't widen them casually.

## Workspace layout

Flat workspace: every product crate lives directly under `crates/` (binary or library). Workspace members are `["crates/*", "xtask"]`. The repo-level automation crate `xtask` sits at the workspace root, following the canonical `cargo-xtask` pattern — it is not a product crate. Future product siblings should be named `tessera-<role>` and placed alongside the existing crates under `crates/`.

- `crates/cli` — `tessera-cli` package, ships the `tessera` binary.
- `crates/core` — `tessera-core` package, shared app identity metadata and the first home for app-neutral Rust logic.
- `crates/desktop` — `tessera-desktop` package, a minimal Tauri shell. Its Vite/React code is view-only: rendering, layout, view state, and Tauri command invocation.
- `crates/graph` — `tessera-graph` package, the canonical graph types (`Mosaic`, `Tessera`, `Bond`, `TesseraKind`, `BondKind`, `FactValue`, `TesseraId`) and `Producer`/`Consumer` conformance traits. The normative specification is `crates/graph/SPEC.md`.
- `crates/indexer` — `tessera-indexer` package. Discovers and spawns language extractors (currently TypeScript via `tsx`), reads their NDJSON output, and assembles a validated `Mosaic`.
- `crates/store` — `tessera-store` package. Async `TerminusClient` (reqwest/basic-auth) for database and document CRUD against TerminusDB. Config from env vars (`TERMINUSDB_HOST`, `TERMINUSDB_PORT`, `TERMINUSDB_USER`, `TERMINUSDB_ADMIN_PASS`).
- `extractors/ts` — TypeScript extractor (ts-morph), invoked as a child process by the indexer. Has its own `package.json`; pnpm-managed.
- `xtask` — `tessera-xtask` package at the workspace root, the automation entrypoint exposed through the Cargo alias `cargo xtask`.
- Shared deps live in `[workspace.dependencies]` in the root `Cargo.toml`; member crates reference them with `dep = { workspace = true }`.
- pnpm is desktop UI tooling only. Prefer `cargo xtask desktop`, `cargo xtask desktop-build`, and `cargo xtask check`; direct pnpm commands under `crates/desktop` are debugging escape hatches.
- Product/application behavior shared between CLI and desktop belongs in Rust crates under `crates/`, not in TypeScript. The desktop startup uses the extracted parchment logo asset at `crates/desktop/src/assets/tessera-logo-parchment.svg`; do not replace it with the full brand sheet or reintroduce the sheet labels.

## Graph vocabulary

The spec and code use specific terms — don't substitute generic graph jargon:

- **Tessera** — a single graph node (a tile in the mosaic). Typed by `TesseraKind` (53 variants: corpus, file, module, function, type, expression, pattern, concurrency primitives, etc.).
- **Bond** — a typed directed edge. `BondKind` has 40+ variants (containment, anchoring, control flow, type conformance, etc.).
- **Mosaic** — the complete graph for a corpus. Built via `MosaicBuilder`.
- **TesseraId** — five-field structural identity (VName-style, per SPEC §6.2), not an opaque UUID.
- **FactValue** — closed union for metadata attached to tesserae (String, Integer, Boolean, Bytes, Enum, NodeRef, List, Map). Fact keys are namespaced: `tessera/*`, `lang/<language>/*`, `x-<vendor>/*`.

## CI

`.github/workflows/ci.yaml` runs five jobs: `fmt`, `clippy`, `test`, `coverage`, `desktop`. Coverage thresholds are enforced: 35% for `tessera-cli`, 77% for `tessera-graph`. The `clippy` and `test` jobs exclude `tessera-desktop` (it requires system GTK/webkit deps).

## CLI architecture

The CLI is organized so subcommands plug in by implementing one trait and registering one enum variant.

- **Entry & parsing** (`crates/cli/src/main.rs`, `cli.rs`): `main` parses `cli::Cli` (clap derive), dispatches to `commands::run`, and on `Err` prints via `term::Term` and exits non-zero. Global flags `--format {pretty,json}` and `--color {auto,always,never}` are declared `global = true` on `Cli` and propagate to every subcommand.
- **Subcommand dispatch** (`crates/cli/src/commands/mod.rs`): `Command` is a `clap::Subcommand` enum; `run(cli)` matches on it, invokes the subcommand's `run()`, and feeds the returned value through `render::emit`. Adding a subcommand = new module under `commands/`, new variant on `Command`, new `match` arm.
- **Rendering** (`crates/cli/src/render.rs`): every subcommand returns a `serde::Serialize` value that also implements `Render::render_pretty`. `emit` selects between `render_pretty` (pretty mode) and `serde_json::to_writer_pretty` (json mode). Render impls write ANSI styles unconditionally; the writer is wrapped in `anstream::AutoStream`, which strips escapes when stdout isn't a TTY or when `NO_COLOR` / `CLICOLOR` ask. Don't gate styling on TTY detection inside renderers — let `anstream` handle it.
- **Stderr** (`crates/cli/src/term.rs`): `Term` is the stderr equivalent — used for `info`/`warn`/`error` lines. Errors bubbled out of `commands::run` are formatted with `{err:#}` (anyhow chain) by `main`.

Tests in `render.rs` show the pattern for verifying both modes plus `anstream::StripStream` for the no-color path.
