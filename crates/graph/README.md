# tessera-graph

Rust home for the Tessera canonical graph: node, edge, fact, and identity
types, plus the producer and consumer traits that operate over them.

## Status

Crate skeleton only. No types or traits are implemented yet. The structural
model, registries, identity rules, and conformance profiles that this crate
will encode live in [`SPEC.md`](SPEC.md) — the normative specification of the
canonical graph (v0.1.0).

Read [`SPEC.md`](SPEC.md) before adding code here. Every public type or trait
introduced in this crate must trace back to a section of `SPEC.md`, and the
crate is the only place where the spec's data model becomes Rust.

## Layout

```
crates/graph/
  SPEC.md         # normative specification of the canonical graph
  README.md       # this file
  Cargo.toml      # `tessera-graph` package manifest
  src/lib.rs      # crate root (no implementations yet)
```

## Analyzer strategy

Building a canonical graph from source requires two kinds of information:

1. **Structural** — AST with precise byte-range anchors, scope/containment
   hierarchy, and control-flow / operation nodes (`core` + `ops` profiles).
2. **Semantic** — resolved types, cross-references (def/ref/call/read/write),
   and cross-module symbol identity (`core` profile, type interlingua).

The approach is Kythe-inspired: for each language, hook directly into the
compiler or type-checker — the tool that already has the complete typed AST —
and extract both structural and semantic data in one pass. This avoids lossy
intermediate formats that discard information the graph spec requires:

- **SCIP** (Sourcegraph) is a navigation index of symbols and occurrences. It
  does not capture scope hierarchy, control flow, expression trees, or
  operation-level detail — roughly 40% of what the Tessera spec demands. Going
  through SCIP means reconstructing discarded information from a second tool.
- **LSP responses** are interactive and per-cursor, not designed for batch
  extraction.

Each language gets a thin extraction shim — a script or plugin that walks the
compiler's internal model and serializes to an intermediary file (protobuf or
JSON). The Rust indexer consumes that file. The integration boundary is a file
format, not an API; this frees tool selection from Rust-embeddability
constraints and lets us use the most complete analyzer per language.

Tree-sitter grammars exist for every target language and serve as a universal
fallback for fast, incremental CST parsing and anchor extraction when the full
semantic pipeline is unavailable (e.g. uncompilable projects, partial indexing).

### Per-language choices

| Language | Analyzer | Runtime | Coverage |
| --- | --- | --- | --- |
| TypeScript | ts-morph (wraps tsc) | Node.js | Full typed AST, cross-refs, scope hierarchy, control flow |
| Rust | rust-analyzer | Rust (subprocess) | Full typed HIR, macro expansion, cross-refs, control flow |
| Go | go/ast + go/types | Go (subprocess) | Full typed AST, cross-refs, scope hierarchy, control flow |
| Python | Pyright + ruff\_python\_parser | Node.js + Rust parser | Types and cross-refs (Pyright) + AST with spans (ruff) |
| Java | javac Compiler Tree API | JDK (subprocess) | Full typed AST, cross-refs, scope hierarchy, control flow |
| Kotlin | Kotlin Analysis API (Standalone) | JVM (subprocess) | Full semantic model, AST, cross-refs, scope hierarchy |

### TypeScript — ts-morph

**ts-morph** wraps the full TypeScript Compiler API with a high-level,
navigable object model. It exposes the complete typed AST: every declaration,
expression, statement, and control-flow construct with byte-range source
positions, full type resolution (generics, conditional types, module
resolution), and cross-reference tracking (definitions, references, call sites,
implementations). A Node.js script walks the ts-morph `Project` and serializes
the graph to protobuf/JSON.

ts-morph is the right level of abstraction for graph extraction: it provides
the same semantic completeness as raw `tsc` but with an API designed for
programmatic traversal rather than compilation. It handles tsconfig resolution,
multi-file projects, and node_modules automatically.

Alternatives considered and rejected:

- *tsc directly* — ts-morph wraps it; using tsc's raw API is more verbose for
  the same result.
- *OXC* — fast Rust-native parser with scope tree, but no type checking;
  would still need a separate semantic pass.
- *scip-typescript* — captures cross-references but not control flow, scope
  hierarchy, or expression trees; covers only the `core` profile.
- *SWC* — strips types, lossy AST, abandoned type-checker project (`stc`).
- *Biome* — type inference is best-effort / local-only, not tsc-equivalent.
- *Tree-sitter* — purely syntactic; no type or cross-reference information.

### Rust — rust-analyzer

**rust-analyzer** is the only Rust analysis tool that provides type inference,
macro expansion, name resolution, and cross-references without requiring
nightly Rust or forking the compiler. Its semantic model covers the full typed
HIR — every declaration, expression, control-flow construct, and scope — with
source-range mappings back to the original syntax. Its SCIP output path already
demonstrates deterministic batch indexing of entire workspaces.

rust-analyzer can be integrated either as a Rust library (via the `ra_ap_hir`
and `ra_ap_ide` crates published weekly on crates.io) or as a subprocess
serializing to an intermediary format. The library path gives more control over
what gets extracted; the subprocess path is simpler to maintain. Either way,
rust-analyzer is the single tool that covers structural, semantic, and
cross-reference needs for Rust in one pass.

Alternatives considered and rejected:

- *syn* — designed for proc-macro authoring, no name resolution, no type info,
  no cross-file awareness.
- *rustc as a library* — nightly-only, `#![feature(rustc_private)]`, no
  stability guarantees ever, massive dependency.
- *SCIP Rust indexer* — uses rust-analyzer internally, but its output schema
  does not capture control flow or scope hierarchy.
- *Tree-sitter* — useful as a fast fallback for anchor extraction on
  uncompilable code, but purely syntactic.

The `ra_ap_*` crate API is explicitly unstable (`0.0.x` versioning), but
actively maintained (~300+ releases). Pin a version and update on our schedule.

### Go — custom Go binary on `go/packages` + `go/types` + `go/ast`

Go's standard analysis libraries (`go/ast`, `go/types`, `go/packages` from
`x/tools`) are the canonical foundation — every other Go analysis tool (gopls,
scip-go, Kythe Go) is built on them. Using them directly in a custom Go binary
is the only approach that can cover all three Tessera conformance profiles:

- `go/ast` gives every statement, expression, and control-flow node with byte
  positions (→ anchors, ops profile).
- `go/types` gives `Info.Defs`, `Info.Uses`, `Info.Types`, `Info.Scopes` — direct
  mappings to anchor roles, `has_type` edges, and scope containment (→ core
  profile, type interlingua).
- Determinism is inherent: same source + same Go toolchain = same typed AST.

The Go binary is invoked from Rust as a subprocess and emits protobuf matching
the Tessera graph schema.

Alternatives considered and rejected:

- *scip-go* — captures symbols and references but not control flow, scope
  hierarchy, or expression trees; covers ~40% of the spec.
- *Kythe Go* — closer to Tessera's `core` profile but no `ops` coverage, and
  Bazel-centric tooling adds friction.
- *gopls* — interactive LSP, not designed for batch indexing (O(symbols)
  round-trips).
- *go/analysis framework* — lint-oriented; adds framework overhead without
  capability beyond go/types.

Tree-sitter-go is worth keeping as a fast-path for syntax-only tasks
(incremental reparsing, anchor recovery on uncompilable code).

### Python — Pyright + ruff\_python\_parser

Python's dynamic nature means no single tool provides both a complete typed
model and a full structural AST with byte-range spans. Two tools are needed,
following the same "hook into the type-checker" pattern as the other languages:

**Pyright** (Microsoft) is the dominant Python type checker — the same engine
that powers Pylance and scip-python. Rather than going through SCIP's lossy
intermediate format (which discards scope hierarchy, control flow, and
expression trees), we use Pyright's programmatic API directly. A custom Node.js
script walks Pyright's internal typed AST, extracting type resolution,
cross-references (defs, refs, calls, reads, writes), and cross-file symbol
identity, then serializes to protobuf/JSON.

**`ruff_python_parser`** provides the structural layer: a full Python AST with
byte-range spans where every control-flow construct (`if`/`for`/`while`/`try`/
`with`/`yield`/`await`) is a first-class node. It is the de facto standard
Python parser in the Rust ecosystem (used by ruff, ty, mypy 2.x, and
RustPython). The structural AST is merged with Pyright's semantic output to
produce the complete graph. Ruff's parser is needed because Pyright's internal
AST representation is optimized for type checking, not for structural graph
extraction with precise byte ranges on every expression and operation node.

Alternatives considered and rejected:

- *scip-python* — wraps Pyright but emits SCIP, a navigation index that
  discards scope hierarchy, control flow, and expression trees. Lossy
  intermediate for our use case.
- *mypy* — no structured graph export API; internal cache format is unstable.
- *Jedi* — maintenance mode, no bulk graph output.
- *Tree-sitter* — less structural fidelity than ruff's parser for Python-
  specific constructs.

**ty** (formerly Red Knot), Astral's Rust-native Python type checker, is the
planned long-term replacement for the Pyright subprocess. Currently beta
(0.0.x, targeting 1.0 in 2026), it would provide full type inference from the
same Rust process as the parser. Monitor `ty_python_semantic` for a stable API
or graph export.

### Java — javac Compiler Tree API

The **javac Compiler Tree API** (`com.sun.source.tree`) via a custom compiler
plugin is the recommended approach. At the ANALYZE phase, every AST node
carries resolved type bindings and the full expression/statement tree is
available — covering `core`, `ops`, and `effects` profiles in a single pass.

This is the actual Java compiler: type resolution is authoritative by
definition, determinism is inherent, and any machine with a JDK can run it with
no extra dependency. The plugin (~few hundred lines of Java) walks the typed
AST and emits protobuf matching the Tessera graph schema; Rust invokes it as
`javac -Xplugin:TesseraIndexer`.

Alternatives considered and rejected:

- *scip-java* — navigation-only (no control flow, no expression trees, no
  scope hierarchy); requires Gradle/Maven/sbt build integration.
- *Eclipse JDT* — equivalent capability but requires the Eclipse runtime or
  standalone JDT Core jar with complex classpath configuration.
- *Kythe Java* — no `ops` profile coverage; Bazel-centric.
- *JavaParser + JavaSymbolSolver* — less robust type resolution than javac for
  complex generics and annotation processing. Reasonable fallback if javac
  plugin coupling is undesirable.
- *Spoon* — clean metamodel over JDT but adds an abstraction layer we don't
  need when emitting our own schema.

Tree-sitter-java serves as a fast fallback for anchors and structural skeleton
when the project is not compilable.

### Kotlin — Kotlin Analysis API (Standalone)

Kotlin is the least mature ecosystem for structural code intelligence. No
existing tool produces a Tessera-compatible graph out of the box.

The **Kotlin Analysis API** (Standalone mode) is the only tool that provides
compiler-grade type resolution, cross-references, scope/containment, and full
AST access for all Kotlin features (coroutines, nullable types, extension
functions, reified generics). It exposes the K2 compiler frontend as a
library — the same engine that powers IntelliJ's Kotlin plugin. A thin Kotlin
CLI (~500 lines) using `StandaloneAnalysisAPISessionBuilder` walks the semantic
model and serializes to protobuf/JSON for Rust consumption. The Analysis API
provides both the structural AST (with byte-range positions) and the semantic
model in one pass, so no second tool is needed for structure. JVM startup cost
is ~2–4s.

Alternatives considered and rejected:

- *scip-kotlin* — low activity (last CI Aug 2023), subset of Analysis API
  capability, still requires the full compiler.
- *Kythe Kotlin* — dead prototype (~2022), incomplete coverage.
- *KtLint / detekt* — lint frameworks, no cross-reference or graph output.
- *IntelliJ PSI directly* — the Analysis API is the supported abstraction over
  PSI; going lower buys nothing.
- *Tree-sitter-kotlin* — only ~61% structural match against the JetBrains
  reference parser; not reliable enough for a primary role.

Java tooling (JDT, Kythe Java, scip-java) does not cover Kotlin — `.kt`
source features have no Java-source equivalents.

## Relationship to other crates

- `tessera-cli`, `tessera-desktop`, and future producers/consumers depend on
  this crate for the canonical graph vocabulary.
- `tessera-core` continues to hold app-neutral metadata; canonical-graph
  types belong here, not in `tessera-core`.
- The spec covers the open-core substrate only. Higher-level Tessera views
  (DDD layer, cascading contracts, review surfaces) sit above this crate and
  are out of scope for both `SPEC.md` and `tessera-graph`.
