use serde::{Deserialize, Serialize};

/// Bond kind — closed registry of relationship types (spec §12).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BondKind {
    // Containment and structure
    ChildOf,
    EnclosingScope,
    DefinedIn,
    DefinesModule,
    DependsOn,
    // Anchor roles
    Defines,
    Declares,
    Binds,
    References,
    Reads,
    Writes,
    Calls,
    Instantiates,
    Throws,
    Imports,
    Extends,
    // Type and conformance
    ConformsTo,
    HasType,
    Returns,
    ParamType,
    Field,
    Variant,
    Target,
    TypeArg,
    // Control flow
    Cond,
    Then,
    Else,
    Body,
    Arm,
    Pattern,
    Guard,
    Subject,
    // Call structure
    Callee,
    Arg,
    Receiver,
    // Operators
    Lhs,
    Rhs,
    Operand,
    Value,
    // Loop
    Iter,
    // Range
    Start,
    End,
    // Collection literals
    Element,
    // Exception handling
    Handler,
    Finally,
    // Effects
    MayThrow,
    EffectCarrier,
}
