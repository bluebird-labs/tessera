## TypeScript
- sindresorhus/got — HTTP client library. ~15k LOC of TS, mature, single tsconfig.json at root, well-typed, no build-system weirdness. Great exercise for scip-typescript because it makes heavy use of generics, conditional types, and re-exports — the things that distinguish typecheck-grade indexing from syntactic parsing.
- colinhacks/zod (the v3 branch or a pre-v4 tag) — runtime schema validation. Type-system-heavy in interesting ways: lots of inferred types, branded types, recursive type definitions. If your SCIP-to-graph mapping handles zod's symbols cleanly, it'll handle most real-world TS. Single-package on older versions; recent versions moved to a workspace, so pin to a v3.x tag.
- pinojs/pino — fast Node logger. ~5k LOC, simple structure, lots of plugin/transport patterns. Lighter than the other two; useful as a "does my pipeline finish in seconds, not minutes" smoke test.

I'd start with pino for fast iteration, move to got once the basics work, and use zod as the "does the hard stuff work" stress test.

## Rust
- BurntSushi/ripgrep — well-known, ~30k LOC, idiomatic Rust, modest dependency tree, builds cleanly. rust-analyzer SCIP emission against ripgrep is basically the canonical test case — if it doesn't work here, something is wrong with your setup, not the project.
- clap-rs/clap — the argument parser. Heavy use of traits, derive macros, generics. Good stress test for whether your graph captures derive-macro-generated symbols sensibly (they show up in SCIP output but with caveats — worth seeing what rust-analyzer actually emits for them).
- tokio-rs/mini-redis — Tokio's pedagogical Redis implementation. ~3k LOC, async-heavy, single binary + lib structure. Smaller than ripgrep, useful for fast iteration.

mini-redis first, ripgrep second, clap if you want to see how derive macros interact with the graph.

## Python
- psf/requests — HTTP library, ~10k LOC, mature, well-typed in recent versions (has a py.typed marker), single pyproject.toml. The canonical "real Python project that pyright handles well" test case.
- pallets/click — CLI framework, ~15k LOC, decorator-heavy. Useful because Python decorators are exactly the kind of thing where SCIP/pyright's output gets interesting — you want to see whether your graph correctly anchors decorated functions vs. their decorators.
- encode/httpx — modern HTTP client, fully type-annotated, async-first. Cleaner type story than requests (younger codebase, types weren't retrofitted). Good test for scip-python's handling of modern Python typing features (Protocol, TypedDict, Generic).

httpx if you want the cleanest types, requests if you want a battle-tested project with retrofitted types (which is more representative of real-world Python).

## Go
- spf13/cobra — CLI library, well-known, single module, clean structure. ~20k LOC, idiomatic Go, exercises interface satisfaction patterns scip-go should resolve cleanly.
- google/uuid — UUID library, tiny (~2k LOC), zero dependencies, single module. Boring on purpose — useful as the "is the pipeline actually working" test before pointing at anything bigger.
- tidwall/gjson — JSON parser, ~5k LOC, single package, no deps. Real-world enough to be useful, small enough to iterate fast.

uuid first as a smoke test, cobra as the "real project" test.