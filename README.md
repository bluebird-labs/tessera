# Tessera

A knowledge-graph-centered ecosystem for engineers staying in architectural control as AI coding agents take on more of the work. Tessera models code and business domain in one substrate, runs work through a cascade of frozen layers (contracts → use cases → placement → implementation), and surfaces the graph through a desktop app, CLI, MCP server, and (commercially) a cloud-backed shared graph. See [`ABOUT.md`](ABOUT.md) for the full positioning.

This repo is the open-core foundation. Today it ships the `tessera` CLI, an indexer that turns a project directory into a structural graph via per-language extractors, a TerminusDB-backed persistence path behind an abstract ingestion port, and an early Tauri desktop shell. [`crates/graph/SPEC.md`](crates/graph/SPEC.md) is the canonical graph specification for this substrate. The unified code+domain layer, cascading-contracts workflow, and review surfaces described in `ABOUT.md` sit above this substrate and are not yet in this repo.

Rust monorepo, very early stage. The root development entrypoint is
`cargo xtask`; the desktop and site frontends use pnpm behind that Rust workflow.

## Repository layout

```
crates/
  cli/            # `tessera` binary
  core/           # app identity + ingest() bridge (entries → session)
  desktop/        # Tauri desktop app; Vite/React is view-only
  graph/          # canonical graph types and SPEC.md (normative specification)
  indexer/        # project indexer: runs language extractors, produces graph
  projects/       # SQLite registry of opened project folders (desktop picker)
  store/          # ingestion port: trait IngestionSession + test double
  terminusdb/     # TerminusDB adapter: client, mapping, batching
extractors/
  ts/             # TypeScript extractor (ts-morph), spawned by the indexer
site/             # @tessera/site landing page (Vite/React)
xtask/            # workspace-root automation crate (cargo xtask)
docs/
  fixtures.md     # toolchains and setup for analyzer test fixtures
  test-repos.md   # candidate fixture repos per language
forks/            # gitignored — third-party repos used as analyzer fixtures
```

[`ARCHITECTURE.md`](ARCHITECTURE.md) has the crate dependency graph and the boundaries between port, adapter, and composition roots.

## Requirements

- Rust toolchain pinned by [`rust-toolchain.toml`](rust-toolchain.toml) (currently `1.85`, with `rustfmt` and `clippy`). `rustup` will fetch it automatically on first build.
- pnpm for desktop UI tooling. The primary commands below call pnpm through
  `cargo xtask`.
- Docker for the TerminusDB graph store (`docker-compose.yml` at repo root). Copy `.env.example` to `.env` and set `TERMINUSDB_ADMIN_PASS`.

## Build

```sh
cargo build -p tessera-cli
cargo xtask desktop-build
```

The binary is produced at `target/debug/tessera`.

## Install (development)

For active development, symlink the debug build into a directory on your `PATH` once. Subsequent `cargo build`s update the binary in place — no re-install needed.

```sh
# pick any directory already on your PATH (~/.attic/bin, ~/bin, /usr/local/bin, ...)
ln -s "$PWD/target/debug/tessera" ~/.attic/bin/tessera
```

Verify:

```sh
which tessera
tessera --help
```

For a release-quality install (slower compile, copies the binary into `~/.cargo/bin`):

```sh
cargo install --path crates/cli
```

## Usage

```sh
tessera --help
cargo xtask cli -- --help
cargo xtask desktop                  # launch the desktop app
cargo xtask site                     # dev-serve the landing site
tessera version                      # pretty mode (default)
tessera version --format json        # machine-readable
```

`tessera index <project>` runs the per-language extractors on the target directory and reports tile/bond counts.

```sh
tessera index ./some-project                     # index only, report counts
tessera index ./some-project --corpus my-corpus  # override corpus name
tessera index ./some-project --store             # also persist to TerminusDB
```

`--store` requires a running TerminusDB (see Requirements) and the `TERMINUSDB_*` environment variables.

Global flags available on every subcommand:

| Flag | Values | Default |
| --- | --- | --- |
| `--format` | `pretty`, `json` | `pretty` |
| `--color` | `auto`, `always`, `never` | `auto` |

`--color auto` honours the `NO_COLOR` and `CLICOLOR` environment variables and TTY detection.

## Tests

```sh
cargo test -p tessera-cli
cargo xtask check
```

`cargo xtask check` runs Rust formatting checks, workspace clippy, CLI tests,
the desktop frontend build, the desktop Rust build, and the site build. Direct
pnpm commands under `crates/desktop` and `site` are intended only as frontend
debugging escape hatches; prefer `cargo xtask desktop`, `cargo xtask
desktop-build`, and `cargo xtask site-build` from the repo root.

The `tessera-terminusdb` integration tests are `#[ignore]`d unless a TerminusDB
instance is running; bring one up with `docker compose up -d` first.

## Desktop

`crates/desktop` is the first Tauri shell for Tessera. The React/Vite code is
the view layer only: rendering, layout, local view state, and Tauri command
invocation. Product and application behavior that needs to be shared between
the CLI and desktop belongs in Rust crates under `crates/`, starting with
`crates/core` when immediately useful.

The startup screen displays the extracted parchment Tessera logo asset at
`crates/desktop/src/assets/tessera-logo-parchment.svg`, derived from the
supplied brand sheet without the alternate ink treatment or sheet labels.

Current state: the project picker and project screen are wired to Rust through
`tessera-projects`. The workspace shell at `/demo` — docking panels and the
Domain/Data/Flow projections — is still a design prototype running on the
hardcoded demo dataset in `src/viz/data.ts`. Connecting the indexer to those
views is the next piece of work.

## Analyzer test fixtures

`forks/` holds language-specific projects we exercise the analyzer against. It is gitignored and excluded from the Cargo workspace. See [`docs/fixtures.md`](docs/fixtures.md) for toolchains and per-fork setup, and [`docs/test-repos.md`](docs/test-repos.md) for candidate projects.
