# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

[`ABOUT.md`](ABOUT.md) is the source of truth for what Tessera is. Briefly: a knowledge-graph-centered ecosystem (desktop app, CLI, MCP server, cloud-backed graph) for engineers retaining architectural control as agents take on more work. Code and domain live in one graph; work flows through a cascade of frozen layers (contracts → use cases → placement → implementation), with annotations bound to stable node IDs and upstream edits propagating downstream automatically. Open-core: CLI, MCP server, single-user desktop app, and the graph schema/modeling primitives are OSS; the shared cloud graph + team/enterprise integrations are commercial.

This repo is the open-core *foundation*. Today it ships the `tessera` CLI; the indexer that turns a project directory into the structural graph is being rebuilt around homemade per-language parsers and is not yet implemented (the `tessera index` subcommand currently errors with "not yet implemented"). The DDD/domain layer, cascading-contracts workflow, and review/UX surfaces described in `ABOUT.md` sit above this substrate and are not in this repo. When working here, don't expand scope into product, UI, or workflow concerns — the structural graph and the tooling around it are the unit of work.

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

## Workspace layout

Flat workspace: every crate lives directly under `crates/` (binary or library). Workspace members are `["crates/*"]`. Future siblings should be named `tessera-<role>` and placed alongside the existing crates.

- `crates/cli` — `tessera-cli` package, ships the `tessera` binary.
- `crates/core` — `tessera-core` package, currently shared app identity metadata and the first home for app-neutral Rust logic when it is immediately needed.
- `crates/desktop` — `tessera-desktop` package, a minimal Tauri shell. Its Vite/React code is view-only: rendering, layout, view state, and Tauri command invocation.
- `crates/xtask` — `tessera-xtask` package, the root automation entrypoint exposed through the Cargo alias `cargo xtask`.
- Shared deps live in `[workspace.dependencies]` in the root `Cargo.toml`; member crates reference them with `dep = { workspace = true }`.
- pnpm is desktop UI tooling only. Prefer `cargo xtask desktop`, `cargo xtask desktop-build`, and `cargo xtask check`; direct pnpm commands under `crates/desktop` are debugging escape hatches.
- Product/application behavior shared between CLI and desktop belongs in Rust crates under `crates/`, not in TypeScript. The desktop startup uses the extracted parchment logo asset at `crates/desktop/src/assets/tessera-logo-parchment.svg`; do not replace it with the full brand sheet or reintroduce the sheet labels.

## CLI architecture

The CLI is organized so subcommands plug in by implementing one trait and registering one enum variant.

- **Entry & parsing** (`crates/cli/src/main.rs`, `cli.rs`): `main` parses `cli::Cli` (clap derive), dispatches to `commands::run`, and on `Err` prints via `term::Term` and exits non-zero. Global flags `--format {pretty,json}` and `--color {auto,always,never}` are declared `global = true` on `Cli` and propagate to every subcommand.
- **Subcommand dispatch** (`crates/cli/src/commands/mod.rs`): `Command` is a `clap::Subcommand` enum; `run(cli)` matches on it, invokes the subcommand's `run()`, and feeds the returned value through `render::emit`. Adding a subcommand = new module under `commands/`, new variant on `Command`, new `match` arm.
- **Rendering** (`crates/cli/src/render.rs`): every subcommand returns a `serde::Serialize` value that also implements `Render::render_pretty`. `emit` selects between `render_pretty` (pretty mode) and `serde_json::to_writer_pretty` (json mode). Render impls write ANSI styles unconditionally; the writer is wrapped in `anstream::AutoStream`, which strips escapes when stdout isn't a TTY or when `NO_COLOR` / `CLICOLOR` ask. Don't gate styling on TTY detection inside renderers — let `anstream` handle it.
- **Stderr** (`crates/cli/src/term.rs`): `Term` is the stderr equivalent — used for `info`/`warn`/`error` lines. Errors bubbled out of `commands::run` are formatted with `{err:#}` (anyhow chain) by `main`.

Tests in `render.rs` show the pattern for verifying both modes plus `anstream::StripStream` for the no-color path.
