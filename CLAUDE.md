# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `crates/scip` — `tessera-scip` library crate. Currently a placeholder (empty `lib.rs`); will host SCIP-related code.
- Shared deps live in `[workspace.dependencies]` in the root `Cargo.toml`; member crates reference them with `dep = { workspace = true }`.

## CLI architecture

The CLI is organized so subcommands plug in by implementing one trait and registering one enum variant.

- **Entry & parsing** (`crates/cli/src/main.rs`, `cli.rs`): `main` parses `cli::Cli` (clap derive), dispatches to `commands::run`, and on `Err` prints via `term::Term` and exits non-zero. Global flags `--format {pretty,json}` and `--color {auto,always,never}` are declared `global = true` on `Cli` and propagate to every subcommand.
- **Subcommand dispatch** (`crates/cli/src/commands/mod.rs`): `Command` is a `clap::Subcommand` enum; `run(cli)` matches on it, invokes the subcommand's `run()`, and feeds the returned value through `render::emit`. Adding a subcommand = new module under `commands/`, new variant on `Command`, new `match` arm.
- **Rendering** (`crates/cli/src/render.rs`): every subcommand returns a `serde::Serialize` value that also implements `Render::render_pretty`. `emit` selects between `render_pretty` (pretty mode) and `serde_json::to_writer_pretty` (json mode). Render impls write ANSI styles unconditionally; the writer is wrapped in `anstream::AutoStream`, which strips escapes when stdout isn't a TTY or when `NO_COLOR` / `CLICOLOR` ask. Don't gate styling on TTY detection inside renderers — let `anstream` handle it.
- **Stderr** (`crates/cli/src/term.rs`): `Term` is the stderr equivalent — used for `info`/`warn`/`error` lines. Errors bubbled out of `commands::run` are formatted with `{err:#}` (anyhow chain) by `main`.

Tests in `render.rs` show the pattern for verifying both modes plus `anstream::StripStream` for the no-color path.

## RFCs

`docs/rfcs/` holds design RFCs. **RFC 0001** (`0001-project-graph-schema.md`) specifies `tessera index <path>`: an orchestrator that shells out to per-language SCIP indexers (`rust-analyzer scip`, `scip-go`, `scip-typescript`, `scip-python`), runs them sequentially with `cwd = <path>`, moves each `<path>/index.scip` to `<output-dir>/<lang>.scip` between runs, and exits 0 if at least one succeeded. Per the RFC, Tessera does **not** parse, merge, or rewrite SCIP payloads in v1 — files are byte-identical to upstream output. When implementing v1 of `tessera index`, treat that RFC as the spec.
