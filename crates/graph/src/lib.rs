#![doc = "Tessera canonical graph: types, identity, and traits.\n\n\
    This crate defines the Rust representation of the canonical graph\n\
    described in `SPEC.md`. It provides:\n\n\
    - [`TesseraId`] — five-field structural identity\n\
    - [`Mosaic`], [`Tessera`], [`Bond`] — the core data model\n\
    - [`TesseraKind`], [`BondKind`] — closed registries\n\
    - [`FactValue`] — the fact value union\n\
    - [`MosaicBuilder`] — ergonomic graph construction\n\
    - [`Producer`], [`Consumer`] — conformance traits"]

mod bond;
mod build;
mod enums;
mod error;
mod fact;
pub mod fact_keys;
mod id;
mod kind;
mod mosaic;
mod traits;

pub use bond::BondKind;
pub use build::MosaicBuilder;
pub use enums::{
    AssignOp, BinOpKind, CanonicalTypeKind, ChannelOpKind, ConformanceProfile, EffectCategory,
    LiteralKind, LoopKind, ModuleKind, PatternKind, RegistryValue, ScopeKind, SymbolRole, TypeForm,
    UnOpKind,
};
pub use error::{MosaicError, ParseEnumError};
pub use fact::FactValue;
pub use id::{LanguageTag, TesseraId};
pub use kind::{TesseraKind, TesseraKindGroup};
pub use mosaic::{Bond, Mosaic, Tessera};
pub use traits::{Consumer, Producer};
