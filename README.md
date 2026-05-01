# Tessera

An LLM-powered coding harness. Rust monorepo, very early stage.

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

## Repository layout

```
crates/
  kernel/     # core (placeholder)
  context/    # context system (placeholder)
  analyzer/   # static analysis (placeholder)
  cli/        # `tessera` binary
docs/
  rfcs/       # RFCs (see 0001-project-graph-schema.md)
forks/        # gitignored — third-party repos used as analyzer fixtures
```

## Test fixtures (`forks/`)

`forks/` holds shallow clones of real-world projects we exercise the analyzer against (one per language; see [`docs/test-repos.md`](docs/test-repos.md) for candidates). It is gitignored, and excluded from the Cargo workspace via `exclude = ["forks"]` in the root `Cargo.toml`.

### Toolchains

Each language uses its own version manager. Install the managers via Homebrew (one-time):

```sh
brew install nvm rustup pyenv goenv     # nvm/rustup likely already present
```

Then install the toolchains:

| Manager | Version pinned | Install |
| --- | --- | --- |
| `nvm`    | Node 24.x      | `nvm install --lts` |
| `rustup` | Rust 1.85+     | `rustup default stable` |
| `pyenv`  | Python 3.13.13 | `pyenv install 3.13.13 && pyenv global 3.13.13` |
| `goenv`  | Go 1.26.2      | `goenv install 1.26.2 && goenv global 1.26.2` |

Make sure pyenv/goenv shims are on `PATH` (e.g. `export PATH="$(pyenv root)/shims:$(goenv root)/shims:$PATH"` in your shell rc).

### Per-fork setup

Clone the chosen repos into `forks/`, then:

```sh
# TypeScript (e.g. pino)
cd forks/pino && npm install

# Rust (e.g. mini-redis) — no setup; cargo handles deps
cd forks/mini-redis

# Python (e.g. requests)
cd forks/requests && python -m venv .venv \
  && .venv/bin/pip install -e '.[socks]' \
       'pytest-httpbin==2.1.0' 'httpbin~=0.10.0' \
       pytest-cov pytest-mock pytest-xdist 'pytest>=3' trustme

# Go (e.g. uuid) — no setup; go modules handle deps
cd forks/uuid
```

### Running each suite

```sh
cd forks/pino       && npm test                    # or: npx borp test/<file>.test.js
cd forks/mini-redis && cargo test
cd forks/requests   && .venv/bin/pytest
cd forks/uuid       && go test ./...
```
