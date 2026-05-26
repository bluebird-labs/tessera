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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn group_classification() {
        assert_eq!(TesseraKind::Corpus.group(), TesseraKindGroup::Metadata);
        assert_eq!(TesseraKind::File.group(), TesseraKindGroup::FileModule);
        assert_eq!(TesseraKind::Scope.group(), TesseraKindGroup::Scope);
        assert_eq!(TesseraKind::TypeRef.group(), TesseraKindGroup::TypeUse);
        assert_eq!(TesseraKind::Function.group(), TesseraKindGroup::Declaration);
        assert_eq!(TesseraKind::Block.group(), TesseraKindGroup::Operation);
        assert_eq!(TesseraKind::Call.group(), TesseraKindGroup::Expression);
        assert_eq!(TesseraKind::Pattern.group(), TesseraKindGroup::Pattern);
        assert_eq!(TesseraKind::Spawn.group(), TesseraKindGroup::Concurrency);
    }

    #[test]
    fn is_declaration_only_matches_declaration_kinds() {
        assert!(TesseraKind::Function.is_declaration());
        assert!(TesseraKind::Variable.is_declaration());
        assert!(TesseraKind::Macro.is_declaration());
        assert!(!TesseraKind::Call.is_declaration());
        assert!(!TesseraKind::Block.is_declaration());
    }

    #[test]
    fn is_expression_only_matches_expression_kinds() {
        assert!(TesseraKind::Call.is_expression());
        assert!(TesseraKind::Literal.is_expression());
        assert!(TesseraKind::Range.is_expression());
        assert!(!TesseraKind::Function.is_expression());
        assert!(!TesseraKind::Block.is_expression());
    }

    #[test]
    fn is_operation_only_matches_operation_kinds() {
        assert!(TesseraKind::Block.is_operation());
        assert!(TesseraKind::If.is_operation());
        assert!(TesseraKind::Defer.is_operation());
        assert!(!TesseraKind::Call.is_operation());
        assert!(!TesseraKind::Function.is_operation());
    }
}
