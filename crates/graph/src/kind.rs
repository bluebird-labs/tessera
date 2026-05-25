use serde::{Deserialize, Serialize};

/// Tessera kind — closed registry of tile types (spec §11).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum TesseraKind {
    // Metadata
    Corpus,
    Dependency,
    Anchor,
    // File/module
    File,
    Module,
    // Scope
    Scope,
    // Type
    TypeRef,
    // Declaration
    Function,
    Type,
    Variable,
    Field,
    Variant,
    Constant,
    Macro,
    // Operation
    Block,
    If,
    Match,
    Loop,
    Break,
    Continue,
    Return,
    Yield,
    Throw,
    TryCatch,
    Defer,
    // Expression
    Call,
    BinOp,
    UnOp,
    Assign,
    Index,
    Access,
    Literal,
    Lambda,
    Cast,
    Tuple,
    RecordLit,
    ListLit,
    MapLit,
    SetLit,
    Range,
    // Pattern
    Pattern,
    // Concurrency
    Spawn,
    Await,
    ChannelOp,
}

/// Logical grouping of tessera kinds (spec §11).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TesseraKindGroup {
    Metadata,
    FileModule,
    Scope,
    TypeUse,
    Declaration,
    Operation,
    Expression,
    Pattern,
    Concurrency,
}

impl TesseraKind {
    pub const fn group(self) -> TesseraKindGroup {
        match self {
            Self::Corpus | Self::Dependency | Self::Anchor => TesseraKindGroup::Metadata,
            Self::File | Self::Module => TesseraKindGroup::FileModule,
            Self::Scope => TesseraKindGroup::Scope,
            Self::TypeRef => TesseraKindGroup::TypeUse,
            Self::Function
            | Self::Type
            | Self::Variable
            | Self::Field
            | Self::Variant
            | Self::Constant
            | Self::Macro => TesseraKindGroup::Declaration,
            Self::Block
            | Self::If
            | Self::Match
            | Self::Loop
            | Self::Break
            | Self::Continue
            | Self::Return
            | Self::Yield
            | Self::Throw
            | Self::TryCatch
            | Self::Defer => TesseraKindGroup::Operation,
            Self::Call
            | Self::BinOp
            | Self::UnOp
            | Self::Assign
            | Self::Index
            | Self::Access
            | Self::Literal
            | Self::Lambda
            | Self::Cast
            | Self::Tuple
            | Self::RecordLit
            | Self::ListLit
            | Self::MapLit
            | Self::SetLit
            | Self::Range => TesseraKindGroup::Expression,
            Self::Pattern => TesseraKindGroup::Pattern,
            Self::Spawn | Self::Await | Self::ChannelOp => TesseraKindGroup::Concurrency,
        }
    }

    /// Declaration kinds as defined by the spec edge registry.
    pub const fn is_declaration(self) -> bool {
        matches!(
            self,
            Self::Function
                | Self::Type
                | Self::Variable
                | Self::Field
                | Self::Variant
                | Self::Constant
                | Self::Macro
        )
    }

    /// Expression kinds as defined by the spec edge registry.
    pub const fn is_expression(self) -> bool {
        matches!(
            self,
            Self::Call
                | Self::BinOp
                | Self::UnOp
                | Self::Assign
                | Self::Index
                | Self::Access
                | Self::Literal
                | Self::Lambda
                | Self::Cast
                | Self::Tuple
                | Self::RecordLit
                | Self::ListLit
                | Self::MapLit
                | Self::SetLit
                | Self::Range
        )
    }

    /// Operation kinds as defined by the spec edge registry.
    pub const fn is_operation(self) -> bool {
        matches!(
            self,
            Self::Block
                | Self::If
                | Self::Match
                | Self::Loop
                | Self::Break
                | Self::Continue
                | Self::Return
                | Self::Yield
                | Self::Throw
                | Self::TryCatch
                | Self::Defer
        )
    }
}
