# RFC 0001 — `tessera index` — SCIP Indexer Orchestration

| Field | Value |
| --- | --- |
| Status | Draft |
| Author | Sylvain Estevez |
| Created | 2026-05-01 |
| Replaces | — |
| Related | (future) RFC: Internal Project Graph; RFC: Native in-process indexers; RFC: Consumers (retrieval, impact, navigation, codemod, overview) |

---

## 1. Summary

The `tessera index <path>` command produces **one [SCIP][scip] index file per detected language** for a project directory by orchestrating pre-installed external SCIP indexers. v1 covers **Rust, Go, TypeScript, and Python.**

Tessera does not implement its own indexers in v1. It shells out to the canonical per-language tools (`rust-analyzer`, `scip-go`, `scip-typescript`, `scip-python`) and writes each indexer's raw output to a per-language file in the output directory. **No merging, no rewriting, no metadata fabrication** — Tessera is purely an orchestrator at this stage.

This is a deliberately thin v1. There is no internal graph, no downstream consumers, no DDD overlay, no in-process semantic analysis, and no SCIP-level interpretation. The deliverables are the raw `.scip` files the upstream indexers produce, captured and named consistently.

[scip]: https://github.com/scip-code/scip

---

## 2. Motivation

A SCIP index is the substrate for everything Tessera will do later — context retrieval, impact analysis, navigation, structural overview, codemod planning. Before any of that becomes useful, Tessera must be able to **produce an index**.

The fastest path to a working `.scip` file is to delegate to existing, mature, language-specific indexers maintained by the SCIP community. v1 wraps those tools behind a single CLI with consistent ergonomics. Native in-process indexers, an internal graph model, interpretive overlays, and downstream consumers are out of scope here and will land in follow-up RFCs.

---

## 3. Goals & Non-Goals

### 3.1 Goals

- One CLI command — `tessera index <path>` — that produces SCIP index files for a project directory.
- Day-one language coverage: **Rust, Go, TypeScript, Python.**
- Manifest-based language detection (trivial to extend; no heavy generic detector pulled in for four languages).
- Each external indexer is invoked through its native CLI conventions; a failure in one indexer does not abort indexing of the others.
- One `.scip` file per detected language, written verbatim from the upstream indexer's output and named consistently. Each file is independently consumable by any SCIP-aware tool.

### 3.2 Non-Goals

- **Merging per-language SCIP indexes** into a single combined `Index` proto. v1 leaves each indexer's output untouched. Merging requires fabricating a single `Metadata` block, which is interpretation Tessera does not yet warrant; deferred until a downstream consumer needs a unified index.
- **Tessera's own internal graph data model.** Deferred to a follow-up RFC.
- **Native in-process indexers** (e.g., direct use of `oxc`, `ra_ap_*`, `ruff_python_parser`). Deferred.
- **Tree-sitter / stack-graphs fallback** for languages without a SCIP indexer. Deferred.
- **Downstream consumers** — context retrieval, impact analysis, navigation, codemod, overview. Deferred.
- **DDD overlay, domain models, interpretive views.** Deferred.
- **Nested-manifest / monorepo discovery.** v1 detects manifests at the root of `<path>` only; sub-projects are not auto-discovered.
- **Incremental indexing.** Each invocation produces fresh indexes from scratch.
- **Parallel indexer execution.** v1 runs indexers sequentially.
- **Configuration files.** No `.tessera.toml`. The CLI is the entire configuration surface.
- **Library API.** v1 exposes only the CLI; no `pub` Rust API for embedders.
- **Bundling external indexers.** Users install the indexers themselves.

---

## 4. CLI Surface

```
tessera index <path> [--output-dir <dir>]
```

| Argument | Description | Default |
| --- | --- | --- |
| `<path>` | Path to the project directory to index. Required positional. | — |
| `--output-dir` / `-o` | Directory in which to write the per-language `.scip` files. | `<path>/.tessera` |

Output filenames are fixed by language: `rust.scip`, `go.scip`, `typescript.scip`, `python.scip`. `<path>` must be an existing directory. The command exits non-zero on invalid input, on no detected languages, or when no indexer succeeds.

---

## 5. Pipeline

```
tessera index <path>
  │
  ├─ 1. Resolve <path> to a canonical absolute directory.
  │     Resolve <output-dir> (default: <path>/.tessera); create if it does
  │     not exist.
  │
  ├─ 2. Detect languages from root-level manifests (§6).
  │
  ├─ 3. For each detected language, sequentially:
  │       a. Look up the indexer command (§7).
  │       b. Verify the binary is on PATH; if not → warn and skip.
  │       c. Invoke the indexer per its native interface, with the working
  │          directory set to <path>; the indexer writes its raw output to
  │          <path>/index.scip (§7).
  │       d. If the indexer exits non-zero → warn (with its stderr) and skip.
  │       e. On success, move <path>/index.scip → <output-dir>/<lang>.scip
  │          before invoking the next indexer (avoids cross-indexer collision).
  │
  └─ 4. Exit 0 if at least one indexer succeeded; exit non-zero otherwise.
```

Tessera does not deserialize, parse, merge, or rewrite the `.scip` payloads. Each output file is byte-identical to what the upstream indexer produced, only renamed and relocated.

---

## 6. Language Detection

Manifest-based, root-level only. The detector inspects the immediate contents of `<path>` for the following signals. Multiple matches are expected and supported (polyglot projects); each detected language runs through its own indexer.

| Language | Manifest signal |
| --- | --- |
| Rust | `Cargo.toml` |
| Go | `go.mod` |
| TypeScript | `tsconfig.json` OR `package.json` |
| Python | `pyproject.toml` OR `setup.py` OR `requirements.txt` OR any `*.py` file in the root |

Notes:

- Detection is non-recursive. Manifests in subdirectories are ignored. Monorepo support is a follow-up.
- For TypeScript, `package.json` is sufficient even without `tsconfig.json`; vanilla JS projects also produce SCIP via `scip-typescript`.
- For Python, the `*.py` fallback covers loose checkouts without a build-system manifest.

---

## 7. Indexer Mapping

The orchestrator invokes each indexer per its native CLI convention and captures the produced `.scip` file. Tessera does not patch or wrap the indexers; it treats each as a black box that takes source as input and emits a SCIP index as output.

| Language | Indexer | Install | Invocation | Output location |
| --- | --- | --- | --- | --- |
| Rust | `rust-analyzer` | `rustup component add rust-analyzer` (or distro package) | `rust-analyzer scip <path>` | `<path>/index.scip` |
| Go | `scip-go` | `go install github.com/scip-code/scip-go/cmd/scip-go@latest` | `scip-go` (cwd = `<path>`) | `<path>/index.scip` |
| TypeScript | `scip-typescript` | `npm install -g @sourcegraph/scip-typescript` | `scip-typescript index` (cwd = `<path>`) | `<path>/index.scip` |
| Python | `scip-python` | `npm install -g @sourcegraph/scip-python` | `scip-python index <path>` | `<path>/index.scip` |

**Filename collision.** All four indexers conventionally write to `<path>/index.scip`. Because v1 runs indexers sequentially, the orchestrator moves each `index.scip` to its final per-language destination (`<output-dir>/<language>.scip`) immediately after the indexer completes, before invoking the next. This avoids any source duplication and keeps the indexers' native conventions intact. Parallel execution would require a different strategy (see §11 Open Questions).

**Why these specific indexers.** All four are listed as canonical in the [scip-code README's "Tools using SCIP" section][scip-tools]. `rust-analyzer` is the official Rust SCIP path (there is no separate `scip-rust` indexer). `scip-go`, `scip-typescript`, and `scip-python` are the upstream-maintained indexers for their respective languages.

[scip-tools]: https://github.com/scip-code/scip#tools-using-scip

---

## 8. Output Files

Tessera writes one `.scip` file per detected and successfully-indexed language to `<output-dir>` (default: `<path>/.tessera`). Filenames are fixed:

| Language | Output filename |
| --- | --- |
| Rust | `rust.scip` |
| Go | `go.scip` |
| TypeScript | `typescript.scip` |
| Python | `python.scip` |

Each file is the **byte-identical output** of its upstream indexer, only renamed and relocated. Tessera does not deserialize the protobuf, does not touch `metadata`, does not adjust `project_root`, does not deduplicate documents. The `.scip` file Tessera writes is the same `.scip` file the indexer produced — full stop.

Each output file is independently consumable by any SCIP-aware tool (Sourcegraph, `scip-lsp`, the `scip` CLI, etc.). Consumers that want a unified view across languages can merge the files themselves; that operation is intentionally outside Tessera's v1 responsibility.

**Pre-existing files.** If `<output-dir>/<language>.scip` already exists from a previous run, Tessera overwrites it. Indexer behavior on a pre-existing `<path>/index.scip` (overwrite vs. append) is the indexer's own; Tessera does not intervene.

---

## 9. Failure Handling

| Condition | Behavior |
| --- | --- |
| `<path>` does not exist or is not a directory | Exit non-zero with a clear error naming the rejected path. |
| Zero manifests detected | Exit non-zero with an error listing the manifests Tessera looked for. |
| Indexer binary not on PATH | Warn (naming the missing binary and the install command); skip that language; continue. |
| Indexer exits non-zero | Warn with the indexer's stderr; skip that language; continue. |
| All detected indexers failed or were skipped | Exit non-zero. |
| At least one indexer succeeded | Exit 0. |

The exit code does not encode partial-failure state in v1. Warnings on stderr are the source of truth for "what got skipped and why." Indexer stderr is surfaced verbatim on Tessera's stderr (Tessera adds its own prefixed warnings on top for skips and failures); indexers can be chatty, and v1 makes no attempt to suppress or filter their output.

---

## 10. Out of Scope / Future Direction

This RFC is intentionally narrow. The following are *not* specified here and will land in follow-up RFCs:

- Tessera's own internal graph data model (separate from the SCIP wire format).
- Native in-process indexers (oxc, ra_ap_*, ruff_python_parser, etc.) that would remove the external-binary dependency.
- Tree-sitter / stack-graphs fallback for languages without a SCIP indexer.
- Downstream consumers — LLM context retrieval, impact analysis, navigation, structural overview, codemod / pattern matching.
- DDD overlay and other interpretive views.
- Monorepo / nested-manifest discovery.
- Incremental indexing.
- Parallel indexer execution.
- A library API for embedding the orchestrator inside other Rust tools.
- A daemon mode for long-running re-indexing on file change.

Each is a real direction; just not yet.
