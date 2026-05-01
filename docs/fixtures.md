# Analyzer test fixtures

`forks/` holds shallow clones of real-world projects we exercise the analyzer against (one per language). It is gitignored, and excluded from the Cargo workspace via `exclude = ["forks"]` in the root `Cargo.toml`. Candidate projects per language are catalogued in [`test-repos.md`](test-repos.md).

## Toolchains

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

## Per-fork setup

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

## Running each suite

```sh
cd forks/pino       && npm test                    # or: npx borp test/<file>.test.js
cd forks/mini-redis && cargo test
cd forks/requests   && .venv/bin/pytest
cd forks/uuid       && go test ./...
```
