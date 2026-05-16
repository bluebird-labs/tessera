# AGENTS.md

Guidance for coding agents working in this repository.

## Project context

[`ABOUT.md`](ABOUT.md) is the source of truth for what Tessera is. In this repository, keep scope anchored to the open-core substrate: the Rust workspace, the `tessera` CLI, and the structural graph tooling that will sit underneath future higher-level workflows.

Current state matters:

- This repo is early-stage and currently ships the `tessera` CLI.
- The project-directory indexer is being rebuilt around homemade per-language parsers and is not implemented yet.
- `tessera index` is intentionally present on the CLI surface but currently returns a "not yet implemented" error.
- The broader product story in `ABOUT.md` includes desktop, MCP, and cloud-backed collaboration, but those surfaces are not implemented here today.

Do not expand a task into product, UI, or workflow work unless the repository already contains that implementation.

## Working rules

- Prefer small, local changes that match the existing code shape.
- Preserve the current CLI architecture instead of introducing parallel abstractions.
- Keep workspace dependency management centralized in the root `Cargo.toml` under `[workspace.dependencies]`.
- Do not add `forks/` to workspace members. It is gitignored and excluded on purpose.

## Repository layout

```text
crates/
  cli/            # tessera-cli package, produces the `tessera` binary
docs/
  fixtures.md     # analyzer fixture setup
  test-repos.md   # candidate analyzer fixture repositories
forks/            # gitignored third-party repos used as analyzer fixtures
```

Workspace members live directly under `crates/*`. Future crates should follow the existing naming pattern and remain flat siblings under `crates/`.

## Build and test

Toolchain is pinned in [`rust-toolchain.toml`](rust-toolchain.toml) to Rust `1.85`.

```sh
cargo build -p tessera-cli
cargo test -p tessera-cli
cargo test -p tessera-cli -- <name>
cargo fmt --all
cargo clippy --workspace --all-targets
```

## CLI architecture

The CLI is structured so new subcommands plug in with minimal surface area.

- Entry and argument parsing live in `crates/cli/src/main.rs` and `crates/cli/src/cli.rs`.
- Subcommand registration and dispatch live in `crates/cli/src/commands/mod.rs`.
- Output rendering lives in `crates/cli/src/render.rs`.
- Stderr formatting lives in `crates/cli/src/term.rs`.

When adding a subcommand:

1. Add a module under `crates/cli/src/commands/`.
2. Add a variant to the `Command` enum.
3. Add a dispatch arm in `commands::run`.
4. Return a `serde::Serialize` value that also implements the existing pretty-rendering pattern.

Global flags `--format` and `--color` are intentionally shared across subcommands. Rendering code should rely on the existing stream handling rather than doing its own TTY/color gating.

## Testing expectations

- Add or update targeted tests when changing CLI behavior.
- Prefer narrow test coverage for isolated changes.
- Broaden coverage when touching shared rendering, command dispatch, or output contracts.

## Documentation alignment

If a change affects project behavior or repository conventions, update the relevant docs in the same change:

- [`README.md`](README.md) for user-facing behavior
- [`CLAUDE.md`](CLAUDE.md) and this file for agent guidance
- [`docs/fixtures.md`](docs/fixtures.md) or [`docs/test-repos.md`](docs/test-repos.md) for analyzer fixture workflow changes
