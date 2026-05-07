# Tessera

A knowledge-graph-centered ecosystem for engineers staying in architectural control as AI coding agents take on more of the work. Tessera models code and business domain in one substrate, runs work through a cascade of frozen layers (contracts → use cases → placement → implementation), and surfaces the graph through a desktop app, CLI, MCP server, and (commercially) a cloud-backed shared graph. See [`ABOUT.md`](ABOUT.md) for the full positioning.

This repo is the open-core foundation. Today that's the `tessera` CLI and the SQLite-backed *structural* graph it produces from SCIP indexers — the substrate the rest of the ecosystem sits on top of. The unified code+domain layer, cascading-contracts workflow, and review surfaces described in `ABOUT.md` are built on top of this substrate and are not yet in this repo.

Rust monorepo, very early stage.

## Repository layout

```
crates/
  cli/            # `tessera` binary
  scip/           # SCIP indexer orchestration + SQLite mirror ingestion
docs/
  rfcs/           # RFCs (0003 = SQLite mirror)
  fixtures.md     # toolchains and setup for analyzer test fixtures
  test-repos.md   # candidate fixture repos per language
forks/            # gitignored — third-party repos used as analyzer fixtures
```

## Requirements

- Rust toolchain pinned by [`rust-toolchain.toml`](rust-toolchain.toml) (currently `1.85`, with `rustfmt` and `clippy`). `rustup` will fetch it automatically on first build.

## Build

```sh
cargo build -p tessera-cli
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
tessera version                      # pretty mode (default)
tessera version --format json        # machine-readable

tessera index <project>              # → <project>/.tessera/index.db
tessera index <project> -o my.db     # custom output path
sqlite3 <project>/.tessera/index.db .tables   # inspect what landed
```

`tessera index` invokes `rust-analyzer scip` / `scip-go` / `scip-typescript` / `scip-python` for each detected language and ingests the result into one SQLite database. See [`docs/rfcs/0003-tessera-index-sqlite-mirror.md`](docs/rfcs/0003-tessera-index-sqlite-mirror.md) for the schema and pipeline.

Global flags available on every subcommand:

| Flag | Values | Default |
| --- | --- | --- |
| `--format` | `pretty`, `json` | `pretty` |
| `--color` | `auto`, `always`, `never` | `auto` |

`--color auto` honours the `NO_COLOR` and `CLICOLOR` environment variables and TTY detection.

## Tests

```sh
cargo test -p tessera-cli
```

## Analyzer test fixtures

`forks/` holds language-specific projects we exercise the analyzer against. It is gitignored and excluded from the Cargo workspace. See [`docs/fixtures.md`](docs/fixtures.md) for toolchains and per-fork setup, and [`docs/test-repos.md`](docs/test-repos.md) for candidate projects.
