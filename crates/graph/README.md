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

## Relationship to other crates

- `tessera-cli`, `tessera-desktop`, and future producers/consumers depend on
  this crate for the canonical graph vocabulary.
- `tessera-core` continues to hold app-neutral metadata; canonical-graph
  types belong here, not in `tessera-core`.
- The spec covers the open-core substrate only. Higher-level Tessera views
  (DDD layer, cascading contracts, review surfaces) sit above this crate and
  are out of scope for both `SPEC.md` and `tessera-graph`.
