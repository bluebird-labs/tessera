//! Standard `tessera/*` fact key constants (spec §6.6).

// Corpus
pub const SCHEMA_VERSION: &str = "tessera/schema/version";
pub const CORPUS_NAME: &str = "tessera/corpus/name";
pub const CONFORMANCE_PROFILES: &str = "tessera/conformance/profiles";

// File
pub const FILE_PATH: &str = "tessera/file/path";
pub const FILE_DIGEST: &str = "tessera/file/digest";

// Module
pub const MODULE_KIND: &str = "tessera/module/kind";

// Dependency
pub const DEPENDENCY_NAME: &str = "tessera/dependency/name";
pub const DEPENDENCY_VERSION_SPEC: &str = "tessera/dependency/version_spec";
pub const DEPENDENCY_RESOLVED_VERSION: &str = "tessera/dependency/resolved_version";
pub const DEPENDENCY_OPTIONAL: &str = "tessera/dependency/optional";
pub const DEPENDENCY_DEV_ONLY: &str = "tessera/dependency/dev_only";

// Scope
pub const SCOPE_KIND: &str = "tessera/scope/kind";

// Anchor
pub const ANCHOR_FILE: &str = "tessera/anchor/file";
pub const ANCHOR_BYTE_START: &str = "tessera/anchor/byte_start";
pub const ANCHOR_BYTE_END: &str = "tessera/anchor/byte_end";
pub const ANCHOR_SNIPPET: &str = "tessera/anchor/snippet";

// Type
pub const TYPE_FORM: &str = "tessera/type/form";
pub const TYPE_CANONICAL_KIND: &str = "tessera/type/canonical_kind";

// Effect
pub const EFFECT_CATEGORY: &str = "tessera/effect/category";
pub const EFFECT_PAYLOAD: &str = "tessera/effect/payload";
pub const EFFECT_AGGREGATE: &str = "tessera/effect/aggregate";

// General
pub const GENERATED: &str = "tessera/generated";
pub const REF_UNRESOLVED: &str = "tessera/ref/unresolved";
pub const SYMBOL_ROLE: &str = "tessera/symbol/role";
pub const DOC_TEXT: &str = "tessera/doc/text";

// Operation-specific
pub const LOOP_KIND: &str = "tessera/loop/kind";
pub const BINOP_KIND: &str = "tessera/binop/kind";
pub const UNOP_KIND: &str = "tessera/unop/kind";
pub const ASSIGN_OP: &str = "tessera/assign/op";
pub const LITERAL_KIND: &str = "tessera/literal/kind";
pub const LITERAL_VALUE: &str = "tessera/literal/value";
pub const RANGE_INCLUSIVE: &str = "tessera/range/inclusive";
pub const PATTERN_KIND: &str = "tessera/pattern/kind";
pub const CHANNEL_OP: &str = "tessera/channel/op";
