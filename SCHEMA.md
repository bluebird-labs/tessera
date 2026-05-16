# Tessera Canonical Graph Specification

> **Version:** 0.1.0
> **Status:** Normative schema specification for future canonical graph producers and consumers. The current `tessera index` CLI surface is reserved but not yet implemented.
> **Project context:** [ABOUT.md](ABOUT.md) defines what Tessera is. [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) define repository conventions.

## 1. Abstract

The Tessera canonical graph is the lowest-level representation of a codebase in the open-core substrate. It represents source programs as a structural graph of corpora, modules, scopes, declarations, source anchors, types, operations, and effects. Higher-level Tessera views may project from this graph, but they are not part of this specification.

This document defines the v0.1 canonical graph model, its closed registries, required validation rules, and producer and consumer conformance requirements.

## 2. Conformance Language

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, and `MAY` are to be interpreted as normative requirements for v0.1.

A **producer** is software that emits a canonical graph from source code, build metadata, dependency metadata, or analyzer output. An indexer is a producer.

A **consumer** is software that reads, validates, stores, queries, or transforms a canonical graph.

An **analyzer** is a producer and consumer that derives additional facts or edges from an existing canonical graph without changing the source program.

A **canonical graph** is a graph that satisfies this specification, including object definitions, identity rules, registries, containment rules, and validation requirements.

## 3. Scope and Non-Goals

This specification covers the structural graph substrate for Tessera's open-core repository: graph objects, identity, anchors, type interlingua, effects, node kinds, edge kinds, containment, cross-corpus references, and conformance.

This specification does not define a wire format, storage engine, query language, desktop application, MCP server, cloud collaboration service, contract cascade workflow, review surface, or UI behavior. Those systems may depend on the canonical graph but are outside v0.1.

## 4. Relationship to Kythe

The Tessera canonical graph is Kythe-inspired and proprietary. Producers MAY use Kythe concepts to guide implementation, but a Tessera graph MUST conform to this specification rather than to Kythe wire formats or schemas.

Tessera adopts these Kythe-shaped ideas:

- VName-style structural identity for declarations.
- Anchor nodes that map UTF-8 source byte ranges to semantic graph nodes.
- A fact-and-edge graph model with typed nodes and typed relationships.

Tessera intentionally differs from Kythe:

- Tessera is a structural IR with control constructs, type interlingua, and effects, not only a cross-reference index.
- Tessera lowers languages into one shared abstract vocabulary instead of exposing language-specific schemas as the primary model.
- Tessera type concepts are canonical where possible; language-specific details are facts.

No v0.1 producer or consumer may claim Kythe wire compatibility solely by conforming to this document.

## 5. Specification Principles

The following principles are normative constraints on v0.1 graphs:

- The canonical graph MUST be derived deterministically from source and declared build/dependency metadata.
- The graph MUST use the registries in this document for all standard node kinds, edge kinds, effect categories, and canonical type concepts.
- Language-specific behavior MUST be represented with `lang/<language>/...` facts unless a standard Tessera construct exists.
- Files MUST NOT be primary semantic containment parents. Modules, scopes, and symbols are the primary containment hierarchy.
- Anchors MUST be first-class nodes. Source-to-graph mapping MUST be represented by edges from anchors to semantic nodes.
- Generic, macro, and template definitions MUST be represented pre-expansion in canonical v0.1. Post-expansion views are analyzer extensions.
- Dataflow is structural and derivable in v0.1. Producers MUST NOT emit `data_flows_to` as a standard edge kind; analyzers MAY emit it as an extension edge.

## 6. Graph Data Model

### 6.1 Graph

A `Graph` is a set of nodes, edges, and graph-level metadata. A graph MUST contain exactly one root `Corpus` node for each indexed corpus represented by the graph. A graph MAY contain more than one corpus when dependencies or external references are represented.

Every non-root node MUST be reachable from a `Corpus` node through `child_of`, `defined_in`, `defines_module`, `depends_on`, an anchor role edge, or another edge kind explicitly permitted by the Edge Kind Registry. Consumers MUST reject graphs with unreachable non-root nodes unless the node is marked with `tessera/ref/unresolved = true`.

### 6.2 Node

A `Node` has:

- `id`: a `NodeId`.
- `kind`: one value from the Node Kind Registry.
- `facts`: zero or more facts keyed by namespaced strings.

Node identifiers MUST be unique within a graph. A node's `kind` MUST match all source and target constraints imposed by its incident standard edges.

### 6.3 Edge

An `Edge` has:

- `kind`: one value from the Edge Kind Registry, or an extension edge kind under `x-<vendor>/...`.
- `source`: the source `NodeId`.
- `target`: the target `NodeId`.
- `ordinal`: an optional non-negative integer.
- `facts`: zero or more relationship facts permitted by the Edge Kind Registry.

Standard edge kinds MUST obey the source kind set, target kind set, cardinality, ordinal rule, and edge-fact rule in the registry. Edge facts MUST NOT be used on a standard edge unless that edge registry row permits them.

### 6.4 Fact

A `Fact` is a keyed value attached to a node or permitted edge. Fact keys MUST use one of these namespaces:

- `tessera/*`: reserved for this specification.
- `lang/<language>/*`: reserved for language-specific producer facts. `<language>` MUST be one of the language tags defined in Section 7.2 or an extension tag beginning with `x-`.
- `x-<vendor>/*`: reserved for experimental or vendor extension facts.

### 6.5 FactValue

The v0.1 `FactValue` union is closed:

- `string`: UTF-8 text.
- `integer`: signed 64-bit integer.
- `boolean`: true or false.
- `bytes`: uninterpreted bytes.
- `enum`: string value from a registry-defined enumeration.
- `node_ref`: canonical `NodeId` string.
- `list`: ordered list of values whose element shape is defined by the fact key.
- `map`: string-keyed map whose value shape is defined by the fact key.

Arbitrary nested payloads are forbidden. A `map` or `list` fact MUST be explicitly allowed by this specification or by an extension namespace. Consumers MUST preserve unknown extension facts but MAY reject malformed standard fact values.

### 6.6 Standard Fact Key Registry

The v0.1 standard `tessera/*` fact key registry is closed. Consumers MUST reject unregistered `tessera/*` fact keys unless they explicitly support a newer schema version.

| Fact key | Valid on | Value shape | Allowed values or rule |
| --- | --- | --- | --- |
| `tessera/schema/version` | `Corpus` | string | `0.1.0` for this version |
| `tessera/corpus/name` | `Corpus` | string | Producer-defined corpus display name |
| `tessera/file/path` | `File` | string | Corpus-relative path |
| `tessera/file/digest` | `File` | string | Producer-defined content digest string |
| `tessera/module/kind` | `Module` | enum | `package`, `namespace`, `file_module`, `crate_mod`, `singleton` |
| `tessera/dependency/name` | `Dependency` | string | Declared dependency name |
| `tessera/dependency/version_spec` | `Dependency` | string | Declared dependency version constraint |
| `tessera/dependency/resolved_version` | `Dependency` | string | Resolved dependency version |
| `tessera/dependency/optional` | `Dependency` | boolean | Whether dependency is optional |
| `tessera/dependency/dev_only` | `Dependency` | boolean | Whether dependency is development-only |
| `tessera/scope/kind` | `Scope` | enum | `module`, `type`, `function`, `block`, `match_arm`, `closure` |
| `tessera/anchor/file` | `Anchor` | string | Corpus-relative source path |
| `tessera/anchor/byte_start` | `Anchor` | integer | UTF-8 source byte offset |
| `tessera/anchor/byte_end` | `Anchor` | integer | UTF-8 source byte offset |
| `tessera/anchor/snippet` | `Anchor` | string | Optional source excerpt |
| `tessera/type/form` | `Type` | enum | `primitive`, `structural`, `nominal`, `alias` |
| `tessera/type/canonical_kind` | `Type` | enum | Primitive type or structural composer registry value |
| `tessera/effect/category` | operation, expression, declaration | list | `EffectCategory` values |
| `tessera/effect/payload` | operation, expression, declaration | map | Payload shape from Section 10.2 |
| `tessera/effect/aggregate` | `Function`, `Lambda` | list | `EffectCategory` values |
| `tessera/generated` | any generated node | boolean | `true` when source anchors are unavailable |
| `tessera/ref/unresolved` | unresolved node or reference-bearing node | boolean | `true` when resolution is incomplete |
| `tessera/symbol/role` | declaration | enum | `parameter`, `test`, or producer-defined extension role under `x-<vendor>:<role>` |
| `tessera/doc/text` | declaration | string | Documentation text associated with a symbol |
| `tessera/loop/kind` | `Loop` | enum | `while`, `for`, `loop`, `do_while` |
| `tessera/binop/kind` | `BinOp` | enum | `add`, `sub`, `mul`, `div`, `mod`, `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `and`, `or`, `bitand`, `bitor`, `bitxor`, `shl`, `shr` |
| `tessera/unop/kind` | `UnOp` | enum | `neg`, `not`, `deref`, `addr_of` |
| `tessera/assign/op` | `Assign` | enum | `add`, `sub`, `mul`, `div`, `mod`, `bitand`, `bitor`, `bitxor`, `shl`, `shr` |
| `tessera/literal/kind` | `Literal` | enum | `int`, `float`, `string`, `bool`, `null`, `regex` |
| `tessera/literal/value` | `Literal` | string, integer, boolean, bytes | Literal value when representable |
| `tessera/range/inclusive` | `Range` | boolean | Whether the range includes its end |
| `tessera/pattern/kind` | `Pattern` | enum | `wildcard`, `binding`, `literal`, `record`, `tuple`, `variant`, `or`, `range`, `guard` |
| `tessera/channel/op` | `ChannelOp` | enum | `send`, `recv`, `select` |

### 6.7 Ordinal

An `Ordinal` is a non-negative integer used only when an edge registry row requires or permits ordered relationships. Ordinals for a given `(source, edge kind)` pair MUST be dense and zero-based unless the edge registry states otherwise.

## 7. Identity

### 7.1 NodeId Fields

A `NodeId` is a five-field structural identity:

```text
NodeId {
  corpus:    string,
  language:  string,
  module:    string,
  scope:     string,
  signature: string
}
```

Field rules:

- `corpus` MUST be a non-empty lowercase locator for the indexed unit, such as `github.com/tessera-dev/tessera@<commit>`, `rustc/std@1.85`, or `crates.io/serde@1.0.197`.
- `language` MUST be a canonical language tag or `_` for cross-language nodes.
- `module` MUST be empty only on `Corpus` and `File` nodes. Non-empty module paths MUST be normalized with `.` separators.
- `scope` MUST be empty for corpus-level and module-level nodes. Nested scopes MUST use `.` separators.
- `signature` MUST be non-empty for every node except a `Corpus` node, where it MUST be `_`.

Field values MUST be Unicode NFC normalized, MUST NOT contain ASCII control characters, and MUST NOT contain the separator characters `|` or newline.

### 7.2 Language Tags

The v0.1 standard language tags are:

```text
c, cpp, csharp, go, java, js, kotlin, php, py, ruby, rust, scala, swift, ts, _
```

Producers MAY use extension language tags beginning with `x-` for languages not yet in the registry.

### 7.3 Canonical String Syntax

The canonical rendering of a `NodeId` is:

```text
nodeid:v0:<percent(corpus)>|<language>|<percent(module)>|<percent(scope)>|<percent(signature)>
```

Percent encoding MUST encode `|`, `%`, newline, carriage return, and all ASCII control characters. Producers MUST render the same `NodeId` to the same canonical string. Consumers MUST compare `NodeId` values by decoded field equality, not by raw string spelling.

### 7.4 Deterministic Construction

Producers MUST construct identifiers deterministically without a central registry or side state.

- `Corpus` nodes use `module = ""`, `scope = ""`, and `signature = "_"`.
- `File` nodes use `language = "_"`, the containing corpus, `module = ""`, `scope = ""`, and `signature = "file:<normalized-corpus-relative-path>"`.
- `Module` nodes use the normalized module path in `module`, empty `scope`, and `signature = "_"`.
- Declaration nodes use their containing module, lexical scope path, and a normalized local signature. Overloads MUST include a deterministic disambiguator derived from declared parameter arity and type references when available.
- `Scope` nodes use the enclosing declaration or scope signature plus `#Scope#<ordinal>`.
- Expression, operation, pattern, and control nodes use `{parent-signature}#<kind>#<ordinal>` with depth-first, left-to-right ordinal assignment over the canonical AST.
- `TypeRef` nodes use `{parent-signature}#TypeRef#<ordinal>` unless they are shared built-in type references, in which case producers MAY use `_` language and a stable interlingua signature.
- `Anchor` nodes use `{parent-signature}#Anchor#<byte_start>#<byte_end>#<ordinal>`.

### 7.5 Stability Guarantees

Conforming producers MUST provide these identity stability properties:

| Edit | Declaration IDs | Fine-grained IDs |
| --- | --- | --- |
| Reformatting only | Stable | Stable when canonical AST order and anchor ranges are unchanged |
| Renaming a symbol | Renamed symbol changes | Descendants re-root under the renamed signature |
| Inserting a statement inside a function | Enclosing declaration stable | Ordinals at and after the insertion point may change |
| Moving a symbol to a new module | Moved symbol changes | Descendants re-root under the moved symbol |
| Adding or removing sibling declarations | Unchanged siblings stable | Descendants of unchanged siblings stable |

Most durable annotations SHOULD pin to declarations. Fine-grained annotations MAY use anchor-relative pinning above this schema.

## 8. Anchors

An `Anchor` node maps a source byte range to semantic graph nodes.

Required anchor facts:

- `tessera/anchor/file`: corpus-relative UTF-8 path string.
- `tessera/anchor/byte_start`: integer.
- `tessera/anchor/byte_end`: integer.

Optional anchor facts:

- `tessera/anchor/snippet`: short source excerpt for debugging.
- `lang/<language>/anchor/token_start` and `lang/<language>/anchor/token_end`: logical-token extension facts for languages that need layout-aware recovery.

Byte offsets MUST be measured over the exact indexed source file bytes after dependency checkout but before parsing transformations. Ranges are half-open: `[byte_start, byte_end)`. `byte_start` MUST be less than or equal to `byte_end`. Offsets MUST point to UTF-8 byte positions for UTF-8 source files. For non-UTF-8 source, producers MUST either transcode before indexing and record a `lang/<language>/source/encoding` fact on the `File`, or reject the file.

Anchor role edges are standard edge kinds from `Anchor` to semantic nodes:

| Edge kind | Required target meaning |
| --- | --- |
| `defines` | Definition site for a declaration or module |
| `declares` | Declaration without definition |
| `binds` | Binding introduction for a name |
| `references` | Non-defining reference |
| `reads` | Value read |
| `writes` | Value write or assignment |
| `calls` | Call site |
| `instantiates` | Generic, template, or macro instantiation site |
| `throws` | Throw, raise, panic, or equivalent site |
| `imports` | Import, use, include, or require site |
| `extends` | Inheritance, implementation, trait, interface, or conformance reference |

A single anchor MAY have multiple role edges. A semantic node MAY have many anchors. A source range MAY map to many semantic nodes.

Producers MUST emit anchors for every declaration, binding, reference, import, call, read, write, instantiation, throw site, and inheritance or conformance reference that can be localized to source. Generated nodes without source text MUST carry `tessera/generated = true` and MAY omit anchors.

## 9. Type Interlingua

Every represented source type MUST map to a `Type` or `TypeRef` node. Language-specific type facts MAY refine the canonical type but MUST NOT replace it.

### 9.1 Primitive Type Registry

The primitive canonical type kinds are closed in v0.1:

| Kind | Meaning |
| --- | --- |
| `int` | Integral numeric value |
| `float` | Floating-point numeric value |
| `bool` | Boolean value |
| `string` | Text string |
| `byte` | Byte-sized value |
| `char` | Character or scalar-value character |
| `void` | No returned value |
| `never` | Non-returning computation |
| `null` | Null, nil, none, or equivalent literal type |

Primitive types SHOULD be represented as `Type` nodes with `tessera/type/form = "primitive"` and `tessera/type/canonical_kind` set to one registry value.

### 9.2 Structural Type Composer Registry

The structural composers are closed in v0.1:

| Kind | Required representation |
| --- | --- |
| `record` | Named fields through `field` edges |
| `tuple` | Ordinal element fields through `field` or `element` edges |
| `sum` | Variants through `variant` edges |
| `function` | Parameter type refs through `param_type` edges and return through `returns` |
| `reference` | Referenced type through `target` or `type_arg` |
| `list` | Element type through `type_arg[0]` |
| `map` | Key and value types through `type_arg[0]` and `type_arg[1]` |
| `set` | Element type through `type_arg[0]` |
| `optional` | Wrapped type through `type_arg[0]` |
| `result` | Success and error types through `type_arg[0]` and `type_arg[1]` |
| `future` | Yield type through `type_arg[0]` |
| `channel` | Message type through `type_arg[0]` |
| `iterator` | Item type through `type_arg[0]` |
| `alias` | Aliased type through `target` |

### 9.3 Nominal Types and Aliases

A user-defined nominal type MUST be a `Type` node. It MUST carry `tessera/type/canonical_kind` set to a primitive kind, structural composer, or `alias`. Its nominal identity is its `NodeId`; structurally identical declarations in different modules are distinct types.

Type aliases, typedefs, and newtypes MUST use `tessera/type/canonical_kind = "alias"` when the source construct is primarily a named alias. Producers SHOULD add language facts when a language distinguishes transparent aliases from nominal newtypes.

### 9.4 Type References and Generic Arguments

A type use MUST be represented by a `TypeRef` node.

- `TypeRef -> Type` uses the `target` edge.
- Generic or template arguments use `type_arg` edges with dense zero-based ordinals.
- Lifetime, ownership, variance, mutability, nullability, and linearity facts remain language facts in v0.1.
- `Vec<i32>` and `Vec<String>` are separate `TypeRef` nodes that target the same `Vec` type declaration with different `type_arg[0]` targets.

## 10. Effects

Effects attach to operation nodes and MAY attach to declarations when known from source signatures.

### 10.1 EffectCategory Registry

The v0.1 `EffectCategory` registry is closed:

| Category | Meaning |
| --- | --- |
| `Pure` | No observable side effects |
| `Read` | Reads in-memory state |
| `Write` | Writes in-memory state |
| `Allocate` | Allocates memory |
| `IO` | Generic input or output |
| `FS` | File-system operation |
| `Net` | Network operation |
| `Process` | Process or subprocess interaction |
| `Time` | Observes time |
| `Random` | Observes randomness |
| `NonDeterminism` | Other nondeterministic observation |
| `Sync` | Synchronization primitive |
| `Concurrent` | Starts or coordinates concurrent execution |
| `Async` | Yields to or resumes from an async scheduler |
| `Panic` | May throw, raise, or panic |
| `Unsafe` | Uses language-level unsafe capability |
| `FFI` | Calls foreign-language code |

Effect categories are not mutually exclusive. `Pure` MUST NOT appear with any other category on the same node.

### 10.2 Effect Facts and Payloads

Effect-bearing nodes use:

- `tessera/effect/category`: list of `EffectCategory` enum strings.
- `tessera/effect/payload`: optional map whose keys are permitted by the category rules below.
- `tessera/effect/aggregate`: optional list of aggregate `EffectCategory` enum strings on `Function` nodes.

Permitted payload keys:

| Category | Keys |
| --- | --- |
| `FS` | `op`, `path`, `mode` |
| `Net` | `op`, `endpoint`, `protocol` |
| `Process` | `op`, `command`, `pid` |
| `Panic` | `type`, `reason` |
| `Unsafe` | `capability`, `reason` |
| `FFI` | `language`, `symbol`, `abi` |

Payload values MUST be strings except `type`, which MAY be a `node_ref`. Other categories MUST NOT use standard payload keys in v0.1.

### 10.3 Aggregate Effects

Aggregate function effects are analyzer-derived unless a source language exposes an effect signature or the producer can compute the body closure exactly. Producers MAY emit `tessera/effect/aggregate`; analyzers SHOULD derive it when absent. Consumers MUST treat aggregate facts as summaries and operation-level effect facts as the primary source of emitted effect evidence.

## 11. Node Kind Registry

The v0.1 node kind registry is closed for standard kinds:

| Kind | Group | Required or permitted facts |
| --- | --- | --- |
| `Corpus` | Metadata | `tessera/schema/version`, `tessera/corpus/name` |
| `File` | File/module | `tessera/file/path`, optional `tessera/file/digest` |
| `Module` | File/module | `tessera/module/kind` |
| `Dependency` | Metadata | `tessera/dependency/name`, optional registered dependency facts |
| `Scope` | Scope | `tessera/scope/kind` |
| `Anchor` | Metadata | anchor facts from Section 8 |
| `TypeRef` | Type | type-use facts from Section 9 |
| `Function` | Declaration | optional `tessera/symbol/role` |
| `Type` | Declaration/type | `tessera/type/form`, `tessera/type/canonical_kind` |
| `Variable` | Declaration | optional `tessera/symbol/role` |
| `Field` | Declaration/type | optional field facts |
| `Variant` | Declaration/type | optional variant facts |
| `Constant` | Declaration | optional constant facts |
| `Macro` | Declaration | optional macro facts |
| `Block` | Operation | optional block facts |
| `If` | Operation | none required |
| `Match` | Operation | none required |
| `Loop` | Operation | `tessera/loop/kind` |
| `Break` | Operation | none required |
| `Continue` | Operation | none required |
| `Return` | Operation | none required |
| `Yield` | Operation/concurrency | optional effect facts |
| `Throw` | Operation | optional effect facts |
| `TryCatch` | Operation | none required |
| `Defer` | Operation | none required |
| `Call` | Expression | optional effect facts |
| `BinOp` | Expression | `tessera/binop/kind` |
| `UnOp` | Expression | `tessera/unop/kind` |
| `Assign` | Expression | optional `tessera/assign/op` |
| `Index` | Expression | none required |
| `Access` | Expression | none required |
| `Literal` | Expression | `tessera/literal/kind`, optional `tessera/literal/value` |
| `Lambda` | Expression/declaration | optional function facts |
| `Cast` | Expression | none required |
| `Tuple` | Expression | none required |
| `RecordLit` | Expression | none required |
| `ListLit` | Expression | none required |
| `MapLit` | Expression | none required |
| `SetLit` | Expression | none required |
| `Range` | Expression | optional `tessera/range/inclusive` |
| `Pattern` | Pattern | `tessera/pattern/kind` |
| `Spawn` | Concurrency | effect facts including `Concurrent` |
| `Await` | Concurrency | effect facts including `Async` |
| `ChannelOp` | Concurrency | `tessera/channel/op` |

Comments and docstrings MUST be represented as facts on the documented symbol, such as `tessera/doc/text` or language-specific structured doc facts. v0.1 has no `Doc` node kind.

Tests MUST be represented as ordinary symbols with `tessera/symbol/role = "test"`.

## 12. Edge Kind Registry

The v0.1 edge kind registry is closed for standard edges. Cardinality is stated from the source node's perspective. `many` means zero or more unless a section above requires coverage.

| Edge kind | Source kinds | Target kinds | Cardinality | Ordinal | Edge facts |
| --- | --- | --- | --- | --- | --- |
| `child_of` | any non-`Corpus` | `Corpus`, `Module`, `Scope`, declaration, operation | exactly 1 except side nodes | forbidden | none |
| `enclosing_scope` | declaration, operation, `Anchor`, `TypeRef` | `Scope` | at most 1 | forbidden | none |
| `defined_in` | declaration, `Module` | `File` | many | optional when multiple files | none |
| `defines_module` | `File` | `Module` | many | optional | none |
| `depends_on` | `Corpus`, `Dependency`, `Module` | `Corpus`, `Dependency` | many | forbidden | `version_spec`, `resolved_version`, `optional`, `dev_only` |
| `defines` | `Anchor` | declaration, `Module` | many | forbidden | none |
| `declares` | `Anchor` | declaration | many | forbidden | none |
| `binds` | `Anchor` | `Variable`, `Function`, `Type`, `Field`, `Constant`, `Macro` | many | forbidden | none |
| `references` | `Anchor`, operation, expression | declaration, `Type`, `Module`, `Dependency` | many | forbidden | none |
| `reads` | `Anchor`, operation, expression | `Variable`, `Field`, `Constant`, `Access` | many | forbidden | none |
| `writes` | `Anchor`, operation, expression | `Variable`, `Field`, `Access` | many | forbidden | none |
| `calls` | `Anchor`, `Call` | `Function`, `Lambda`, `Macro` | many | forbidden | none |
| `instantiates` | `Anchor`, `Call`, `TypeRef` | `Type`, `Function`, `Macro` | many | forbidden | `type_args` |
| `throws` | `Anchor`, `Throw`, `Call`, `Function` | `Type`, `TypeRef` | many | forbidden | none |
| `imports` | `Anchor`, `Module` | `Module`, `Dependency`, `Corpus` | many | forbidden | none |
| `extends` | `Anchor`, `Type` | `Type`, `TypeRef` | many | forbidden | none |
| `conforms_to` | `Type` | `Type`, `TypeRef` | many | forbidden | none |
| `has_type` | `Variable`, `Field`, `Constant`, expression | `TypeRef` | at most 1 | forbidden | none |
| `returns` | `Function`, `Lambda` | `TypeRef` | at most 1 | forbidden | none |
| `param_type` | `Function`, `Lambda` | `TypeRef` | many | required | none |
| `field` | `Type`, `Access` | `Field` | many | required for type fields | none |
| `variant` | `Type` | `Variant` | many | required | none |
| `target` | `TypeRef`, `Assign`, `Access` | `Type`, `TypeRef`, expression, declaration | at most 1 | forbidden | none |
| `type_arg` | `TypeRef` | `TypeRef` | many | required | none |
| `cond` | `If`, `Loop` | expression | at most 1 | forbidden | none |
| `then` | `If` | `Block`, expression | at most 1 | forbidden | none |
| `else` | `If` | `Block`, expression | at most 1 | forbidden | none |
| `body` | `Function`, `Lambda`, `Loop`, `TryCatch`, `Defer`, `Spawn` | `Block`, expression | at most 1 | forbidden | none |
| `arm` | `Match` | `Block`, expression, `Pattern` | many | required | none |
| `pattern` | `Match`, `Pattern` | `Pattern` | many | optional | none |
| `guard` | `Match`, `Pattern` | expression | at most 1 | forbidden | none |
| `subject` | `Match` | expression | at most 1 | forbidden | none |
| `callee` | `Call` | expression, `Function`, `Lambda`, `Macro` | at most 1 | forbidden | none |
| `arg` | `Call` | expression | many | required | none |
| `receiver` | `Call`, `Access` | expression | at most 1 | forbidden | none |
| `lhs` | `BinOp` | expression | exactly 1 | forbidden | none |
| `rhs` | `BinOp` | expression | exactly 1 | forbidden | none |
| `operand` | `UnOp`, `Cast`, `Return`, `Yield`, `Throw`, `Await` | expression | at most 1 | forbidden | none |
| `value` | `Assign`, `Return`, `Yield`, `Throw`, `Field`, `Variable`, `Constant` | expression | at most 1 | forbidden | none |
| `iter` | `Loop` | expression | at most 1 | forbidden | none |
| `start` | `Range` | expression | at most 1 | forbidden | none |
| `end` | `Range` | expression | at most 1 | forbidden | none |
| `element` | `Tuple`, `RecordLit`, `ListLit`, `MapLit`, `SetLit` | expression | many | required | none |
| `handler` | `TryCatch` | `Block`, `Function`, `Lambda` | many | required | none |
| `finally` | `TryCatch` | `Block` | at most 1 | forbidden | none |
| `may_throw` | `Function`, `Lambda`, `Call` | `Type`, `TypeRef` | many | forbidden | none |
| `effect_carrier` | `Function`, `Lambda`, operation | `Type`, `TypeRef` | many | forbidden | none |

For the source and target sets above, `expression` means the expression group in the Node Kind Registry, `operation` means the operation group, and `declaration` means `Function`, `Type`, `Variable`, `Field`, `Variant`, `Constant`, or `Macro`.

The only permitted standard edge facts in v0.1 are those named in the `Edge facts` column. `version_spec`, `resolved_version`, and `type_args` are strings. `optional` and `dev_only` are booleans.

## 13. Containment

The primary containment chain is:

```text
Corpus -> Module -> Scope -> Symbol
```

Definitions:

- `Corpus`: an indexed unit such as a repository revision, package version, standard library, or dependency corpus. Each `Corpus` node MUST carry `tessera/schema/version = "0.1.0"`.
- `File`: a side node for a corpus-relative source, generated, or metadata file. A `File` MUST carry `tessera/file/path`.
- `Module`: a uniform namespace unit. `tessera/module/kind` MUST be one of `package`, `namespace`, `file_module`, `crate_mod`, or `singleton`.
- `Scope`: a lexical scope inside a module, declaration, block, or expression. `tessera/scope/kind` SHOULD be one of `module`, `type`, `function`, `block`, `match_arm`, or `closure`.
- `Symbol`: any named declaration node: `Function`, `Type`, `Variable`, `Field`, `Variant`, `Constant`, or `Macro`.
- `Anchor`: a source range node with role edges to semantic nodes.
- `TypeRef`: a type-use node that points to a canonical `Type` or another `TypeRef`.

Every non-root node that is part of semantic containment MUST have exactly one `child_of` edge. `child_of` edges are directed from child to parent. `File` nodes SHOULD be contained by their `Corpus`. `Anchor` and `TypeRef` nodes SHOULD be contained by the narrowest semantic parent that owns their source occurrence.

Files are side nodes, not primary semantic parents. Valid file side edges are:

- `defined_in`: declaration or `Module` to `File`.
- `defines_module`: `File` to `Module`.
- Anchor file facts: `tessera/anchor/file`.

A producer MUST NOT model `File -> Symbol` as primary containment.

## 14. Cross-Corpus References

External standard libraries and packages SHOULD be represented as separate `Corpus` nodes when their identity is known. Cross-corpus references use ordinary `NodeId` values whose `corpus` field differs from the referring node.

Build and dependency metadata MUST use the same node, edge, and fact model:

- A declared dependency SHOULD be a `Dependency` node in the dependent corpus.
- `Dependency` nodes SHOULD use `depends_on` to point to a resolved external `Corpus` when resolution is known.
- `depends_on` edge facts MAY include `version_spec`, `resolved_version`, `optional`, and `dev_only`.
- Build files SHOULD be represented as `File` nodes and connected to dependency or module nodes with standard edges where applicable.

Unresolved references MUST be represented without inventing unstable target identities:

- If the producer can form the intended target `NodeId`, it MAY emit the reference edge and mark the target node or reference-bearing node with `tessera/ref/unresolved = true`.
- If the producer cannot form the target `NodeId`, it MUST create a placeholder declaration node with `tessera/ref/unresolved = true` and enough `lang/<language>/...` facts to support later resolution.
- Re-indexing after dependency changes MAY replace unresolved placeholders with resolved references.

## 15. Producer Conformance

A v0.1 producer MUST emit:

1. One `Corpus` node per indexed corpus with `tessera/schema/version = "0.1.0"`.
2. `File`, `Module`, `Scope`, declaration, `Anchor`, and `TypeRef` nodes sufficient to represent all indexed source files.
3. Deterministic `NodeId` values following Section 7.
4. `child_of` containment for every semantic non-root node.
5. Anchor coverage for declarations, bindings, references, imports, calls, reads, writes, instantiations, throws, and inheritance or conformance references.
6. Canonical type mappings for every represented source type.
7. Operation nodes for represented control and expression constructs.
8. Effect category facts on operation nodes where effects are explicit in source syntax or known from language semantics.
9. Standard edge kinds and fact keys only as permitted by the registries.

A producer is not required to emit aggregate function effects, post-expansion macro/template graphs, higher-level architecture views, explicit dataflow extension edges, or dependency resolution beyond locally available build metadata.

## 16. Consumer Conformance

A v0.1 consumer MUST:

- Parse and preserve all standard v0.1 node kinds, edge kinds, fact keys, and effect categories.
- Reject standard graph constructs that violate required kind, cardinality, ordinal, fact namespace, or fact value rules.
- Preserve unknown `lang/<language>/...` and `x-<vendor>/...` facts and extension edges when round-tripping a graph, unless explicitly operating in a validating discard mode.
- Treat unknown standard-looking `tessera/*` facts or unregistered standard edge/node kinds as validation errors for v0.1.
- Report enough validation context to identify the offending node, edge, or fact.

Consumers MAY ignore extension facts for analysis. Consumers MUST NOT reinterpret extension facts as standard semantics without an explicit extension contract.

## 17. Analyzer-Derived Facts and Edges

Analyzers MAY add facts or extension edges derived from a valid graph. Analyzer output remains conforming only if standard additions obey this specification and non-standard additions use extension namespaces.

Examples of analyzer-derived information in v0.1:

- `tessera/effect/aggregate` on `Function` nodes.
- Extension `x-<vendor>/data_flows_to` edges.
- Post-expansion macro, template, or monomorphization views under extension node or edge kinds.
- Cross-language ownership, lifetime, or linearity summaries under extension facts.

Analyzer-derived facts SHOULD record provenance with extension facts when the derivation is lossy or heuristic.

## 18. Extensions and Versioning

The schema version is a required `tessera/schema/version` fact on every `Corpus` node. v0.1 uses the exact string `0.1.0`.

Future minor versions may add standard node kinds, edge kinds, facts, effect categories, and language tags. Future major versions may remove or rename standard constructs. v0.1 consumers MUST reject newer major versions unless they explicitly support them.

Non-normative extension areas for future versions include:

- A concrete wire format.
- Incremental indexing protocols and stale-reference repair.
- Standard post-expansion macro/template views.
- Standard explicit dataflow edges.
- Cross-language ownership, lifetime, and linearity interlingua.
- Rich structured documentation nodes if symbol facts prove insufficient.

## 19. Example

For this tiny function:

```text
fn read_name(path: Path) -> String {
  read_to_string(path)
}
```

A producer could emit these representative nodes:

| Node | Kind | Selected facts |
| --- | --- | --- |
| `nodeid:v0:github.com/acme/app@abc123|_|||_` | `Corpus` | `tessera/schema/version = "0.1.0"` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app||_` | `Module` | `tessera/module/kind = "crate_mod"` |
| `nodeid:v0:github.com/acme/app@abc123|_|||file:src/lib.rs` | `File` | `tessera/file/path = "src/lib.rs"` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app||read_name` | `Function` | `tessera/effect/aggregate = ["FS"]` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app|read_name|path` | `Variable` | `tessera/symbol/role = "parameter"` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app|read_name|read_name#Call#0` | `Call` | `tessera/effect/category = ["FS"]`, `tessera/effect/payload = {op: "read", path: "dynamic"}` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app|read_name|read_name#Anchor#3#12#0` | `Anchor` | `tessera/anchor/file = "src/lib.rs"`, `byte_start = 3`, `byte_end = 12` |
| `nodeid:v0:github.com/acme/app@abc123|rust|app|read_name|read_name#Anchor#38#52#0` | `Anchor` | `tessera/anchor/file = "src/lib.rs"`, `byte_start = 38`, `byte_end = 52` |

Representative edges:

| Source | Edge | Target | Meaning |
| --- | --- | --- | --- |
| `Module app` | `child_of` | `Corpus` | module belongs to corpus |
| `Function read_name` | `child_of` | `Module app` | function is a module symbol |
| `Variable path` | `child_of` | `Function read_name` | parameter belongs to function |
| `Call read_to_string` | `child_of` | `Function read_name` | call occurs in function body |
| `Function read_name` | `defined_in` | `File src/lib.rs` | source file side edge |
| `Anchor 3..12` | `defines` | `Function read_name` | function name defines symbol |
| `Anchor 13..17` | `binds` | `Variable path` | parameter binding |
| `Anchor 38..52` | `calls` | `Function std::fs::read_to_string` | call site |
| `Anchor 53..57` | `reads` | `Variable path` | argument read |

The example is illustrative. It demonstrates object shape and semantics, not a required wire format.
