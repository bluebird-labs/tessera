# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

[`ABOUT.md`](ABOUT.md) is the source of truth for what Tessera is. Briefly: a knowledge-graph-centered ecosystem (desktop app, CLI, MCP server, cloud-backed graph) for engineers retaining architectural control as agents take on more work. Code and domain live in one graph; work flows through a cascade of frozen layers (contracts → use cases → placement → implementation), with annotations bound to stable node IDs and upstream edits propagating downstream automatically. Open-core: CLI, MCP server, single-user desktop app, and the graph schema/modeling primitives are OSS; the shared cloud graph + team/enterprise integrations are commercial.

This repo is the open-core *foundation*. Today it ships the `tessera` CLI and the SQLite-backed *structural* graph (per-language SCIP indexer output ingested into a SCIP-isomorphic SQLite mirror — see RFC 0003). The DDD/domain layer, cascading-contracts workflow, and review/UX surfaces described in `ABOUT.md` sit above this substrate and are not in this repo. When working here, don't expand scope into product, UI, or workflow concerns — the structural graph and the tooling around it are the unit of work.

## Build & test

Workspace uses Cargo with `resolver = "3"` and edition 2024; toolchain is pinned to 1.85 by `rust-toolchain.toml` (rustup fetches it on first build).

```sh
cargo build -p tessera-cli           # produces target/debug/tessera
cargo test  -p tessera-cli           # whole CLI test suite
cargo test  -p tessera-cli -- <name> # single test by name substring
cargo fmt --all
cargo clippy --workspace --all-targets
```

`forks/` is gitignored and excluded from the workspace (`exclude = ["forks"]`); never add it to `members`. It holds shallow clones of real-world projects used as analyzer fixtures — see `docs/test-repos.md` for the curated list and `README.md` for per-fork setup.

## Workspace layout

- `crates/cli` — `tessera-cli` package, ships the `tessera` binary.
- `crates/scip` — `tessera-scip` library crate. Hosts language detection (`detect`), per-language indexer command mapping (`indexer`), the `orchestrate` pipeline (with `Reporter`/`Sink` traits), and the `mirror` module that owns the SQLite schema + ingestion (`MirrorDb`).
- Shared deps live in `[workspace.dependencies]` in the root `Cargo.toml`; member crates reference them with `dep = { workspace = true }`.

## CLI architecture

The CLI is organized so subcommands plug in by implementing one trait and registering one enum variant.

- **Entry & parsing** (`crates/cli/src/main.rs`, `cli.rs`): `main` parses `cli::Cli` (clap derive), dispatches to `commands::run`, and on `Err` prints via `term::Term` and exits non-zero. Global flags `--format {pretty,json}` and `--color {auto,always,never}` are declared `global = true` on `Cli` and propagate to every subcommand.
- **Subcommand dispatch** (`crates/cli/src/commands/mod.rs`): `Command` is a `clap::Subcommand` enum; `run(cli)` matches on it, invokes the subcommand's `run()`, and feeds the returned value through `render::emit`. Adding a subcommand = new module under `commands/`, new variant on `Command`, new `match` arm.
- **Rendering** (`crates/cli/src/render.rs`): every subcommand returns a `serde::Serialize` value that also implements `Render::render_pretty`. `emit` selects between `render_pretty` (pretty mode) and `serde_json::to_writer_pretty` (json mode). Render impls write ANSI styles unconditionally; the writer is wrapped in `anstream::AutoStream`, which strips escapes when stdout isn't a TTY or when `NO_COLOR` / `CLICOLOR` ask. Don't gate styling on TTY detection inside renderers — let `anstream` handle it.
- **Stderr** (`crates/cli/src/term.rs`): `Term` is the stderr equivalent — used for `info`/`warn`/`error` lines. Errors bubbled out of `commands::run` are formatted with `{err:#}` (anyhow chain) by `main`.

Tests in `render.rs` show the pattern for verifying both modes plus `anstream::StripStream` for the no-color path.

## RFCs

`docs/rfcs/` holds design RFCs. **RFC 0003** (`0003-tessera-index-sqlite-mirror.md`) is the current spec for `tessera index <path>`: shell out to per-language SCIP indexers (`rust-analyzer scip`, `scip-go`, `scip-typescript`, `scip-python`) sequentially with `cwd = <path>`, decode each `<path>/index.scip` in-process via the [`scip`](https://crates.io/crates/scip) crate, and ingest into a single SQLite database (default `<path>/.tessera/index.db`) whose schema is a SCIP-isomorphic mirror. No `.scip` files remain on disk after `tessera index` returns; per-language transactions, exit 0 if at least one language committed. Ingestion + schema live in `tessera-scip::mirror` (built on `rusqlite` with the `bundled` feature). RFC 0001 (file-mover) and RFC 0002 (`tessera show`) are superseded by 0003 — the SQLite artifact is inspectable via `sqlite3 <path>/.tessera/index.db`.
