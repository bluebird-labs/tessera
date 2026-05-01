# Tessera

An LLM coding harness for experienced engineers. Deterministic-first, fast, reliable — and a deliberate departure from the chat-window UX.

Rust monorepo, very early stage.

## Repository layout

```
crates/
  cli/            # `tessera` binary
  scip/           # SCIP-based analyzer (placeholder)
docs/
  rfcs/           # RFCs (see 0001-project-graph-schema.md)
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
# pick any directory already on your PATH (~/.local/bin, ~/bin, /usr/local/bin, ...)
ln -s "$PWD/target/debug/tessera" ~/.local/bin/tessera
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
```

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
