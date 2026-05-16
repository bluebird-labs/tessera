# Tessera

A knowledge-graph-centered ecosystem for engineers staying in architectural control as AI coding agents take on more of the work. Tessera models code and business domain in one substrate, runs work through a cascade of frozen layers (contracts → use cases → placement → implementation), and surfaces the graph through a desktop app, CLI, MCP server, and (commercially) a cloud-backed shared graph. See [`ABOUT.md`](ABOUT.md) for the full positioning.

This repo is the open-core foundation. Today it ships the `tessera` CLI; the indexer that turns a project directory into the structural graph is being rebuilt around homemade per-language parsers and is not yet implemented. [`SCHEMA.md`](SCHEMA.md) is the canonical graph schema specification for this substrate. The unified code+domain layer, cascading-contracts workflow, and review surfaces described in `ABOUT.md` sit above this substrate and are not yet in this repo.

Rust monorepo, very early stage. The root development entrypoint is
`cargo xtask`; the desktop frontend uses pnpm behind that Rust workflow.

## Repository layout

```
SCHEMA.md       # canonical graph schema specification
crates/
  cli/            # `tessera` binary
  core/           # shared app-neutral Rust metadata and future substrate logic
  desktop/        # Tauri desktop app; Vite/React is view-only
  xtask/          # root automation for CLI and desktop workflows
docs/
  fixtures.md     # toolchains and setup for analyzer test fixtures
  test-repos.md   # candidate fixture repos per language
forks/            # gitignored — third-party repos used as analyzer fixtures
```

## Requirements

- Rust toolchain pinned by [`rust-toolchain.toml`](rust-toolchain.toml) (currently `1.85`, with `rustfmt` and `clippy`). `rustup` will fetch it automatically on first build.
- pnpm for desktop UI tooling. The primary commands below call pnpm through
  `cargo xtask`.

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
cargo xtask desktop
tessera version                      # pretty mode (default)
tessera version --format json        # machine-readable
```

`tessera index <project>` is reserved on the CLI surface but currently exits with a "not yet implemented" error — the indexer is being rebuilt around homemade per-language parsers.

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
the desktop frontend build, and the desktop Rust build. Direct pnpm commands
under `crates/desktop` are intended only as frontend debugging escape hatches;
prefer `cargo xtask desktop` and `cargo xtask desktop-build` from the repo root.

## Desktop

`crates/desktop` is the first Tauri shell for Tessera. The React/Vite code is
the view layer only: rendering, layout, local view state, and Tauri command
invocation. Product and application behavior that needs to be shared between
the CLI and desktop belongs in Rust crates under `crates/`, starting with
`crates/core` when immediately useful.

The startup screen displays the extracted parchment Tessera logo asset at
`crates/desktop/src/assets/tessera-logo-parchment.svg`, derived from the
supplied brand sheet without the alternate ink treatment or sheet labels.

## Analyzer test fixtures

`forks/` holds language-specific projects we exercise the analyzer against. It is gitignored and excluded from the Cargo workspace. See [`docs/fixtures.md`](docs/fixtures.md) for toolchains and per-fork setup, and [`docs/test-repos.md`](docs/test-repos.md) for candidate projects.
