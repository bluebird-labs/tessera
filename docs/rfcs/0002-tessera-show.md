# RFC 0002 — `tessera show` — Human-readable SCIP Inspection

| Field | Value |
| --- | --- |
| Status | Superseded |
| Author | Sylvain Estevez |
| Created | 2026-05-01 |
| Replaces | — |
| Superseded by | RFC 0003 (the `.scip` file artifact this RFC inspects no longer exists; readability is now `sqlite3 index.db`) |
| Related | RFC 0001 (`tessera index` orchestrator); (future) RFC: `tessera query` |

---

## 1. Summary

The `tessera show <file>` command reads a SCIP index file (e.g. one produced by `tessera index`) and prints its contents in a human-readable form. v1 covers the SCIP wire format at a structural level — `Metadata`, per-`Document` summary, top-level totals — without filtering or query semantics.

This is the first time Tessera **parses** a SCIP file. RFC 0001 deliberately deferred all SCIP byte-level handling; this RFC opens that door for a single, narrow purpose: making the orchestrator's output inspectable without a separate tool.

---

## 2. Motivation

A `.scip` file is a Protocol Buffer-encoded `Index` message — useless to a human with `cat`. To answer "what did `tessera index` actually produce?", users currently need an external tool (Sourcegraph's `scip print`). Shipping our own minimal printer:

- Closes the immediate "what's in this file?" loop without a separate install.
- Establishes the SCIP-parsing layer that downstream consumers (impact analysis, navigation, retrieval) will rely on.
- Stays consistent with the CLI ergonomics already in place (`--format pretty|json`, `--color`, `Render` trait).

---

## 3. Goals & Non-Goals

### 3.1 Goals

- One CLI command — `tessera show <file>` — that decodes any well-formed SCIP `Index` proto file and prints a structural summary.
- Pretty mode: `Metadata` block, top-level totals (documents / symbols / occurrences), and a per-document line listing relative path + symbol/occurrence counts.
- JSON mode: the same data, stably shaped for scripting (`tessera show ... --format json | jq`).
- Reuse the existing `Render` trait, `emit` pipeline, and global flags.
- Use a maintained Rust SCIP crate (the [`scip`](https://crates.io/crates/scip) crate is the obvious candidate) rather than hand-rolling protobuf decoding.

### 3.2 Non-Goals

- **Querying / filtering.** No `--symbol`, no `--document`, no glob filters in v1. A future `tessera query` is the home for that.
- **Source-context rendering.** No printing of indexed source code with highlighted occurrences. Useful, bigger, deferred.
- **Cross-file analysis.** v1 reads exactly one file at a time.
- **Diffing two SCIP files.** Useful, separate.
- **Validation / linting** beyond "the file decodes". `scip lint` is the canonical validator.
- **Writing SCIP files.** Read-only.
- **Interpretive overlays.** Whatever the SCIP proto exposes natively, we print. No Tessera-specific symbol classification, DDD overlay, etc.

---

## 4. CLI Surface

```
tessera show <file>
```

| Argument | Description | Default |
| --- | --- | --- |
| `<file>` | Path to a `.scip` file. Required. | — |

Inherits the global `--format {pretty,json}` and `--color {auto,always,never}` flags. The command exits non-zero on missing file, unreadable file, or proto decode failure.

---

## 5. Pipeline

```
tessera show <file>
  │
  ├─ 1. Read <file> as bytes (error on missing/unreadable).
  │
  ├─ 2. Decode bytes as a SCIP `Index` proto via the `scip` crate
  │     (error on malformed input).
  │
  ├─ 3. Build an in-memory summary:
  │       • Metadata block (version, tool_info, project_root, …).
  │       • Per-document: relative_path, symbol count, occurrence count.
  │       • Totals: documents, symbols, occurrences.
  │
  └─ 4. Emit via the existing render pipeline.
```

The decoded `Index` is consumed once and dropped — no persistent in-memory representation, no caching.

---

## 6. Output

### 6.1 Pretty

Suggested layout (exact spacing/styling at the implementer's discretion):

```
tessera show forks/pino/.tessera/typescript.scip
  metadata:
    version       0.3.0
    tool          scip-typescript 0.3.10
    project_root  file:///.../pino
  totals:
    documents      42
    symbols       380
    occurrences  4218
  documents:
    lib/foo.ts          symbols=12  occurrences=98
    lib/bar.ts          symbols= 7  occurrences=44
    …
    (plus N more)
```

- Print non-default `Metadata` fields only — minimize noise.
- Cap the `documents:` listing at a fixed value (suggested: 100). When truncated, append `(plus N more)`. v1 ships a fixed cap; flag-based tuning is a future addition.
- Use the existing `Styles` palette: `heading` for the title, `key` for field labels, `dim` for paths, plain for numerics.

### 6.2 JSON

```json
{
  "file": "forks/pino/.tessera/typescript.scip",
  "metadata": {
    "version": "0.3.0",
    "tool_info": { "name": "scip-typescript", "version": "0.3.10", "arguments": [] },
    "project_root": "file:///.../pino",
    "text_document_encoding": "UTF8"
  },
  "totals": { "documents": 42, "symbols": 380, "occurrences": 4218 },
  "documents": [
    { "relative_path": "lib/foo.ts", "symbols": 12, "occurrences": 98 },
    { "relative_path": "lib/bar.ts", "symbols":  7, "occurrences": 44 }
  ]
}
```

JSON includes **all** documents (no cap). Scripting consumers paginate themselves. Field names mirror the SCIP proto where possible; numeric counts use the `Document.symbols.len()` and `Document.occurrences.len()` from the decoded message.

---

## 7. Failure Handling

| Condition | Behavior |
| --- | --- |
| `<file>` missing or unreadable | Exit non-zero with the underlying I/O error and the rejected path. |
| `<file>` does not decode as a SCIP `Index` proto | Exit non-zero with the proto decoder's error. |
| `<file>` decodes but is empty (zero documents) | Render normally — a valid empty index is real (e.g. a project with no source files); exit 0. |

The exit code is binary success/failure — no partial-success encoding.

---

## 8. Implementation Notes (non-binding)

- **Crate placement.** Decode + summary logic lives in `tessera-scip` alongside the orchestrator (currently `language`/`detect`/`indexer`/`orchestrate` modules). Add a `parse` (or `inspect`) module that depends on the [`scip`](https://crates.io/crates/scip) crate. The CLI's `tessera show` subcommand is a thin wrapper, mirroring `tessera index`.
- **Render pattern.** Define a `ShowReport` (or similar) value implementing `serde::Serialize + Render`; the subcommand returns it from a `pub(crate) fn run(...)` and `commands::run` feeds it through `emit`.
- **Tests.**
  - Unit: round-trip a synthetic `Index` (build via the `scip` crate's types, encode to bytes, decode, summarize) — assert totals, metadata fields, per-document counts.
  - Integration: `tessera show <fixture.scip>` succeeds; `tessera show /tmp/does-not-exist` exits non-zero; `tessera show <random-bytes>` exits non-zero with a decode error.
- **No new global state.** No CLI flags beyond what's already global.

---

## 9. Out of Scope / Future Direction

This RFC is intentionally narrow. The following are *not* specified here and will land in follow-up RFCs:

- `tessera query <file> [--symbol …] [--document …] [--language …]` — filtered slices of an index.
- Source rendering with occurrence highlights (`tessera show … --source` or a separate command).
- Diff between two SCIP files (`tessera diff a.scip b.scip`).
- Reading multiple files in one invocation, with or without merging.
- Streaming/incremental parsing for very large indexes.

Each is a real direction; just not yet.
