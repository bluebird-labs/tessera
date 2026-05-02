# RFC 0003 — `tessera index` Produces a SQLite Mirror of the SCIP Index

| Field | Value |
| --- | --- |
| Status | Draft |
| Author | Sylvain Estevez |
| Created | 2026-05-02 |
| Supersedes | RFC 0001; RFC 0002 |
| Related | (future) RFC: Derived structural graph layer over the mirror; (future) RFC: Native in-process indexers; (future) RFC: Consumers (retrieval, impact, navigation, codemod, overview) |

---

## 1. Summary

`tessera index <path>` produces **a single SQLite database** that is a faithful, lossless mirror of the SCIP index data emitted by per-language indexers. v1 covers the same languages as RFC 0001 — Rust, Go, TypeScript, Python — using the same external indexers (`rust-analyzer scip`, `scip-go`, `scip-typescript`, `scip-python`).

The change from RFC 0001: instead of re-publishing each indexer's `.scip` protobuf file under a consistent name, Tessera **decodes** each indexer's output in-process via the [`scip`][scip-crate] Rust crate and **ingests** it into mirror tables in a project-level SQLite database (default: `<path>/.tessera/index.db`). No `.scip` files remain on disk after `tessera index` returns.

The mirror is SCIP-isomorphic — table and column names track the SCIP proto, no information is dropped, no interpretation is layered on. A Tessera-shaped derived graph (`nodes`, `edges`) over this mirror is deferred to a follow-up RFC.

[scip-crate]: https://crates.io/crates/scip
[scip]: https://github.com/scip-code/scip

---

## 2. Motivation

RFC 0001 framed `tessera index` as a file-mover: shell out to per-language SCIP indexers, capture each tool's `.scip` artifact, rename it consistently, and exit. That positioning has two problems:

1. **Wrong abstraction boundary.** Re-publishing each indexer's binary protobuf makes Tessera a thin pass-through. Every downstream consumer Tessera plans to ship — context retrieval, impact analysis, navigation, structural overview, codemod, DDD overlay — needs a representation Tessera owns and can extend, not the indexer-shaped one. The longer the indexers' wire format remains the public contract, the more downstream code is shaped around it.

2. **Opaque deliverable.** A `.scip` file is a Protocol Buffer-encoded `Index` message; `cat` and `grep` produce noise. RFC 0002 proposed a bespoke pretty-printer (`tessera show`) to close this loop. SQLite makes the loop close itself: `sqlite3 index.db` is built into every relevant operating system and gives a shell, schema introspection, and ad-hoc SQL for free. RFC 0002 is therefore superseded — the readability problem it solved no longer exists in the form it was written for.

The mirror layer is the smallest concrete step Tessera can take to own its data. It commits to nothing about the structural-graph shape or DDD overlay — those remain follow-ups — but it changes the artifact users and downstream code see from "the indexers' bytes" to "Tessera's database".

---

## 3. Goals & Non-Goals

### 3.1 Goals

- One CLI command — `tessera index <path>` — that produces a SQLite database describing the project's SCIP index data.
- Same language coverage as RFC 0001: **Rust, Go, TypeScript, Python.** Same external indexers, invoked the same way.
- **Lossless mirror.** Every field the SCIP proto exposes is preserved in the database. No interpretation, no field renaming beyond cosmetic snake-casing, no quiet drops.
- Single project-level database file. Per-language data co-located in shared tables, distinguished by a `language` column.
- Independently inspectable with the standard `sqlite3` CLI; no Tessera-specific tooling required to answer "what's in the index?".

### 3.2 Non-Goals

- **Derived `nodes`/`edges` graph layer.** Deferred to a follow-up RFC. v1 ships only the mirror.
- **Cross-language symbol linking.** SCIP symbol IDs are scoped per package; Tessera does not invent cross-language references in v1. Consumers that want such links derive them themselves.
- **Native in-process indexers.** Deferred (carried from RFC 0001).
- **Tree-sitter / stack-graphs fallback.** Deferred (carried from RFC 0001).
- **Monorepo / nested-manifest discovery.** Deferred (carried from RFC 0001).
- **Incremental indexing.** Each `tessera index` invocation produces a fresh database from scratch.
- **Parallel indexer execution.** v1 runs indexers sequentially.
- **DDD overlay, domain models, interpretive views.** Deferred (carried from RFC 0001).
- **Configuration files.** No `.tessera.toml`. The CLI is the entire configuration surface.
- **Library API.** v1 exposes only the CLI.
- **Bundling external indexers.** Users install the indexers themselves.
- **Persisting the indexers' raw `.scip` files.** Transient ingestion artifacts only; deleted after ingestion. Not a deliverable.

---

## 4. CLI Surface

```
tessera index <path> [--output <file>]
```

| Argument | Description | Default |
| --- | --- | --- |
| `<path>` | Path to the project directory to index. Required positional. | — |
| `--output` / `-o` | Path to the SQLite database file to write. | `<path>/.tessera/index.db` |

`<path>` must be an existing directory. If the parent directory of the output file does not exist, Tessera creates it. The command exits non-zero on invalid input, on no detected languages, or when no indexer succeeds.

This replaces RFC 0001's `--output-dir` flag: the deliverable is now a single file, not a directory of `.scip` files. The conventional `<path>/.tessera/` location is preserved, just with `index.db` inside instead of `{lang}.scip`.

---

## 5. Pipeline

```
tessera index <path>
  │
  ├─ 1. Resolve <path> to a canonical absolute directory.
  │     Resolve <output> (default: <path>/.tessera/index.db); create the
  │     parent directory if it does not exist.
  │
  ├─ 2. Open (or create + truncate) the output SQLite database. Apply the
  │     mirror schema (§7). Each invocation starts from an empty database;
  │     no upsert in v1.
  │
  ├─ 3. Detect languages from root-level manifests (§6).
  │
  ├─ 4. For each detected language, sequentially:
  │       a. Look up the indexer command (unchanged from RFC 0001 §7).
  │       b. Verify the binary is on PATH; if not → warn and skip.
  │       c. Invoke the indexer with cwd = <path>; the indexer writes to
  │          <path>/index.scip.
  │       d. If the indexer exits non-zero → warn (with stderr); delete any
  │          partial <path>/index.scip; skip that language; continue.
  │       e. Read <path>/index.scip into memory; decode as a SCIP `Index`
  │          proto via the `scip` crate. On decode failure → warn; delete
  │          the file; skip; continue.
  │       f. Open a transaction on the output DB. INSERT the decoded
  │          message into the mirror tables, tagged with the source
  │          `language`. Commit. On any DB error → roll back; warn; continue.
  │       g. Delete <path>/index.scip before the next language is invoked
  │          (closes RFC 0001's filename-collision window).
  │
  └─ 5. Exit 0 if at least one language committed; exit non-zero otherwise.
```

The decoded `Index` is held in memory only long enough to ingest it; no SCIP-level state survives across iterations. The output database is the only persisted artifact.

---

## 6. Language Detection

Unchanged from RFC 0001 §6. Manifest-based, root-level, non-recursive.

| Language | Manifest signal |
| --- | --- |
| Rust | `Cargo.toml` |
| Go | `go.mod` |
| TypeScript | `tsconfig.json` OR `package.json` |
| Python | `pyproject.toml` OR `setup.py` OR `requirements.txt` OR any `*.py` file in the root |

Monorepo discovery, nested-manifest support, and explicit language-selection flags remain out of scope.

---

## 7. Mirror Schema

The mirror is SCIP-isomorphic: every concept the SCIP proto names has a dedicated table; every field that proto exposes survives ingestion. Table and column names track the SCIP proto names (snake-cased where needed). The schema is layered such that a future RFC can populate a derived `nodes`/`edges` view without altering the mirror.

The sketch below is illustrative; final column lists, types, and indices are fixed during implementation. The binding constraint is **lossless ingest** — no field a future graph or consumer might need may be silently dropped.

```sql
CREATE TABLE metadata (
  language          TEXT PRIMARY KEY,         -- 'rust' | 'go' | 'typescript' | 'python'
  scip_version      INTEGER NOT NULL,         -- ProtocolVersion
  tool_name         TEXT NOT NULL,
  tool_version      TEXT NOT NULL,
  tool_arguments    TEXT NOT NULL,            -- JSON array
  project_root      TEXT NOT NULL,
  text_encoding     INTEGER NOT NULL,         -- TextEncoding enum
  indexed_at        TEXT NOT NULL             -- ISO 8601, set by Tessera
);

CREATE TABLE documents (
  id                INTEGER PRIMARY KEY,
  language          TEXT NOT NULL REFERENCES metadata(language),
  scip_language     TEXT NOT NULL,            -- Document.language (SCIP's per-doc language tag)
  relative_path     TEXT NOT NULL,
  text              TEXT,                     -- nullable; SCIP indexers don't always emit
  position_encoding INTEGER NOT NULL,
  UNIQUE(language, relative_path)
);

CREATE TABLE symbols (
  id                INTEGER PRIMARY KEY,
  language          TEXT NOT NULL REFERENCES metadata(language),
  document_id       INTEGER REFERENCES documents(id),  -- nullable for external symbols
  scip_symbol       TEXT NOT NULL,            -- canonical SCIP symbol string
  kind              INTEGER NOT NULL,         -- SymbolInformation.Kind
  display_name      TEXT,
  documentation     TEXT,                     -- joined newline-separated
  signature_documentation TEXT,
  enclosing_symbol  TEXT,
  UNIQUE(language, scip_symbol)
);

CREATE TABLE occurrences (
  id                INTEGER PRIMARY KEY,
  document_id       INTEGER NOT NULL REFERENCES documents(id),
  symbol_id         INTEGER NOT NULL REFERENCES symbols(id),
  start_line        INTEGER NOT NULL,
  start_character   INTEGER NOT NULL,
  end_line          INTEGER NOT NULL,
  end_character     INTEGER NOT NULL,
  symbol_roles      INTEGER NOT NULL,         -- bitfield, SymbolRole
  syntax_kind       INTEGER,
  override_documentation TEXT,                -- joined newline-separated
  enclosing_range   TEXT                      -- JSON [sl, sc, el, ec]; nullable
);

CREATE TABLE relationships (
  symbol_id         INTEGER NOT NULL REFERENCES symbols(id),
  related_symbol    TEXT NOT NULL,            -- the SCIP symbol string of the related symbol
  is_reference      INTEGER NOT NULL,         -- 0/1
  is_implementation INTEGER NOT NULL,
  is_type_definition INTEGER NOT NULL,
  is_definition     INTEGER NOT NULL,
  PRIMARY KEY (symbol_id, related_symbol)
);

CREATE TABLE diagnostics (
  occurrence_id     INTEGER NOT NULL REFERENCES occurrences(id),
  severity          INTEGER NOT NULL,
  code              TEXT,
  message           TEXT,
  source            TEXT,
  tags              TEXT                      -- JSON array of DiagnosticTag enums
);
```

Notes:

- **External symbols.** SCIP's `Index.external_symbols` list is folded into `symbols` with `document_id IS NULL`. The `symbols` table is the single source of truth for symbol facts regardless of whether the symbol is local to a document or external; a discriminator is unnecessary because `document_id` carries it.
- **Relationships.** The related symbol is stored as a string rather than as an FK, because SCIP relationships can target external symbols not yet ingested in another language's pass. Resolving these strings to symbol IDs is a derivation step (and a graph-layer concern).
- **Indices.** Implementation will add indices on `(symbol_id)` for `occurrences` and `relationships`, on `(document_id)` for `occurrences`, and on `scip_symbol` for `symbols`. The exact set is tuned during implementation.
- **`text_encoding`** lives on `metadata`, not `documents`, because SCIP scopes encoding at the index level.

---

## 8. Re-Index Semantics

Each `tessera index` invocation produces a fresh database. If the output file exists, it is removed (or its tables are dropped) before the schema is applied. No upsert, no merge with prior state, no incremental ingestion.

Rationale: incremental indexing requires a content-addressing or watermark scheme that is meaningful to design only once we know which downstream consumers care about deltas. v1 keeps re-indexing simple; incremental ingestion is a follow-up RFC.

---

## 9. Failure Handling

| Condition | Behavior |
| --- | --- |
| `<path>` does not exist or is not a directory | Exit non-zero with a clear error naming the rejected path. |
| Output file is not writable / parent directory cannot be created | Exit non-zero with the underlying I/O error and the rejected path. |
| Zero manifests detected | Exit non-zero with an error listing the manifests Tessera looked for. |
| Indexer binary not on PATH | Warn (naming the missing binary and the install command); skip that language; continue. |
| Indexer exits non-zero | Warn with the indexer's stderr; delete any partial `<path>/index.scip`; skip that language; continue. |
| `<path>/index.scip` does not decode as a SCIP `Index` proto | Warn with the decoder's error; delete the file; skip that language; continue. |
| DB error while ingesting one language | Roll back that language's transaction; warn; continue. |
| All detected languages failed or were skipped | Exit non-zero. The output DB is left on disk in whatever state the schema-creation step reached. |
| At least one language committed | Exit 0. The output DB contains the languages that succeeded; failures are visible on stderr. |

The exit code does not encode partial-failure state in v1, mirroring RFC 0001 §9. Indexer stderr is surfaced verbatim on Tessera's stderr; Tessera adds its own prefixed warnings on top for skips, decode failures, and DB rollbacks.

Per-language transactions are the boundary for atomicity: a language's data is either fully present in the DB or fully absent. There is no all-or-nothing project-level transaction in v1.

---

## 10. Implementation Notes (non-binding)

- **Crate placement.** Ingestion + schema live in `tessera-scip` (currently an empty `lib.rs` per `CLAUDE.md`). The module shape mirrors the orchestrator's: `language`, `detect`, `indexer`, `orchestrate`, plus a new `mirror` (or `store`) module owning the schema, ingestion, and `rusqlite` glue.
- **CLI subcommand.** `crates/cli/src/commands/index.rs` is rewritten against the new contract; the `Command` enum variant in `commands/mod.rs` keeps the same name. The `Render` value the subcommand returns is a small report (path of the DB written, per-language outcomes, totals). Pretty mode prints a table; JSON mode is the same data, stably shaped.
- **Dependencies.** Add `rusqlite` (with the `bundled` feature so we don't depend on the system SQLite) and `scip` (the upstream Rust SCIP crate, named in the now-superseded RFC 0002). Both go in `[workspace.dependencies]` per CLAUDE.md, with member crates referencing them via `dep = { workspace = true }`.
- **Tests.**
  - Unit (in `tessera-scip`): build a synthetic SCIP `Index` via the `scip` crate's types, encode to bytes, ingest into an in-memory SQLite DB, assert row counts and field-level fidelity for each table.
  - Integration (in `tessera-cli`): `tessera index <fixture>` succeeds against a `forks/` fixture (e.g. one of the curated repos in `docs/test-repos.md`); `tessera index /tmp/does-not-exist` exits non-zero; the produced DB opens cleanly with `sqlite3` and `select count(*) from documents` returns a non-zero number.
- **No new global state.** No CLI flags beyond `--output` plus the existing globals (`--format`, `--color`).

---

## 11. Out of Scope / Future Direction

This RFC stops at the lossless mirror. The following are not specified here and will land in follow-up RFCs:

- **Derived structural graph layer.** A `nodes` table modeling every named program element and an `edges` table modeling defines/references/implements/contains/calls relationships, derived from the mirror.
- **Cross-language symbol linking.** Resolving `relationships.related_symbol` strings to symbol IDs across languages where SCIP symbol grammars permit.
- **Incremental indexing.** Per-language watermarking, content-addressing, or file-mtime-based skipping.
- **Native in-process indexers.** Removing the external-binary dependency for one or more languages.
- **Tree-sitter / stack-graphs fallback** for languages without a SCIP indexer.
- **Monorepo / nested-manifest discovery.**
- **Parallel indexer execution.**
- **Library API** for embedding the orchestrator inside other Rust tools.
- **Daemon mode** for long-running re-indexing on file change.
- **Downstream consumers** — context retrieval, impact analysis, navigation, structural overview, codemod, DDD overlay — all read the mirror (or the future graph layer); each is its own RFC.

Each is a real direction; just not yet.
