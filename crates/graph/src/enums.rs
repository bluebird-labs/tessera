use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::error::ParseEnumError;

macro_rules! spec_enum {
    (
        $(#[$meta:meta])*
        $vis:vis enum $name:ident {
            $($variant:ident => $str:literal),+ $(,)?
        }
    ) => {
        $(#[$meta])*
        #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
        $vis enum $name {
            $(
                #[serde(rename = $str)]
                $variant,
            )+
        }

        impl $name {
            #[allow(clippy::missing_const_for_fn)]
            pub fn as_str(self) -> &'static str {
                match self {
                    $(Self::$variant => $str,)+
                }
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                f.write_str(self.as_str())
            }
        }

        impl FromStr for $name {
            type Err = ParseEnumError;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $($str => Ok(Self::$variant),)+
                    _ => Err(ParseEnumError {
                        type_name: stringify!($name),
                        value: s.into(),
                    }),
                }
            }
        }
    };
}

spec_enum! {
    /// Module namespace kind (spec §6.6).
    pub enum ModuleKind {
        Package => "package",
        Namespace => "namespace",
        FileModule => "file_module",
        CrateMod => "crate_mod",
        Singleton => "singleton",
    }
}

spec_enum! {
    /// Lexical scope kind (spec §6.6).
    pub enum ScopeKind {
        Module => "module",
        Type => "type",
        Function => "function",
        Block => "block",
        MatchArm => "match_arm",
        Closure => "closure",
    }
}

spec_enum! {
    /// Type form (spec §9).
    pub enum TypeForm {
        Primitive => "primitive",
        Structural => "structural",
        Nominal => "nominal",
        Alias => "alias",
    }
}

spec_enum! {
    /// Canonical type kind — primitives and structural composers (spec §9.1, §9.2).
    pub enum CanonicalTypeKind {
        Int => "int",
        Float => "float",
        Bool => "bool",
        String => "string",
        Byte => "byte",
        Char => "char",
        Void => "void",
        Never => "never",
        Null => "null",
        Any => "any",
        Unknown => "unknown",
        Record => "record",
        Tuple => "tuple",
        Sum => "sum",
        Function => "function",
        Reference => "reference",
        List => "list",
        Map => "map",
        Set => "set",
        Optional => "optional",
        Result => "result",
        Future => "future",
        Channel => "channel",
        Iterator => "iterator",
        Intersection => "intersection",
        Alias => "alias",
    }
}

spec_enum! {
    /// Effect category (spec §10.1).
    pub enum EffectCategory {
        Pure => "Pure",
        Read => "Read",
        Write => "Write",
        Allocate => "Allocate",
        IO => "IO",
        FS => "FS",
        Net => "Net",
        Process => "Process",
        Time => "Time",
        Random => "Random",
        NonDeterminism => "NonDeterminism",
        Sync => "Sync",
        Concurrent => "Concurrent",
        Async => "Async",
        Panic => "Panic",
        Unsafe => "Unsafe",
        FFI => "FFI",
    }
}

spec_enum! {
    /// Loop kind (spec §6.6).
    pub enum LoopKind {
        While => "while",
        For => "for",
        Loop => "loop",
        DoWhile => "do_while",
    }
}

spec_enum! {
    /// Binary operator kind (spec §6.6).
    pub enum BinOpKind {
        Add => "add",
        Sub => "sub",
        Mul => "mul",
        Div => "div",
        Mod => "mod",
        Eq => "eq",
        Ne => "ne",
        Lt => "lt",
        Lte => "lte",
        Gt => "gt",
        Gte => "gte",
        And => "and",
        Or => "or",
        Bitand => "bitand",
        Bitor => "bitor",
        Bitxor => "bitxor",
        Shl => "shl",
        Shr => "shr",
    }
}

spec_enum! {
    /// Unary operator kind (spec §6.6).
    pub enum UnOpKind {
        Neg => "neg",
        Not => "not",
        Deref => "deref",
        AddrOf => "addr_of",
    }
}

spec_enum! {
    /// Compound assignment operator (spec §6.6).
    pub enum AssignOp {
        Add => "add",
        Sub => "sub",
        Mul => "mul",
        Div => "div",
        Mod => "mod",
        Bitand => "bitand",
        Bitor => "bitor",
        Bitxor => "bitxor",
        Shl => "shl",
        Shr => "shr",
    }
}

spec_enum! {
    /// Literal kind (spec §6.6).
    pub enum LiteralKind {
        Int => "int",
        Float => "float",
        String => "string",
        Bool => "bool",
        Null => "null",
        Regex => "regex",
    }
}

spec_enum! {
    /// Pattern kind (spec §6.6).
    pub enum PatternKind {
        Wildcard => "wildcard",
        Binding => "binding",
        Literal => "literal",
        Record => "record",
        Tuple => "tuple",
        Variant => "variant",
        Or => "or",
        Range => "range",
        Guard => "guard",
    }
}

spec_enum! {
    /// Channel operation kind (spec §6.6).
    pub enum ChannelOpKind {
        Send => "send",
        Recv => "recv",
        Select => "select",
    }
}

spec_enum! {
    /// Conformance profile (spec §15.1).
    pub enum ConformanceProfile {
        Core => "core",
        Ops => "ops",
        Effects => "effects",
    }
}

/// Typed wrapper for all spec-defined enumeration values used in facts.
///
/// Replaces raw strings in [`FactValue::Enum`](crate::FactValue::Enum) so the
/// graph is not stringly typed.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum RegistryValue {
    ModuleKind(ModuleKind),
    ScopeKind(ScopeKind),
    TypeForm(TypeForm),
    CanonicalTypeKind(CanonicalTypeKind),
    EffectCategory(EffectCategory),
    LoopKind(LoopKind),
    BinOpKind(BinOpKind),
    UnOpKind(UnOpKind),
    AssignOp(AssignOp),
    LiteralKind(LiteralKind),
    PatternKind(PatternKind),
    ChannelOpKind(ChannelOpKind),
    SymbolRole(SymbolRole),
    ConformanceProfile(ConformanceProfile),
    Extension(String),
}

impl RegistryValue {
    pub fn as_str(&self) -> &str {
        match self {
            Self::ModuleKind(v) => v.as_str(),
            Self::ScopeKind(v) => v.as_str(),
            Self::TypeForm(v) => v.as_str(),
            Self::CanonicalTypeKind(v) => v.as_str(),
            Self::EffectCategory(v) => v.as_str(),
            Self::LoopKind(v) => v.as_str(),
            Self::BinOpKind(v) => v.as_str(),
            Self::UnOpKind(v) => v.as_str(),
            Self::AssignOp(v) => v.as_str(),
            Self::LiteralKind(v) => v.as_str(),
            Self::PatternKind(v) => v.as_str(),
            Self::ChannelOpKind(v) => v.as_str(),
            Self::SymbolRole(v) => v.as_str(),
            Self::ConformanceProfile(v) => v.as_str(),
            Self::Extension(s) => s,
        }
    }
}

impl fmt::Display for RegistryValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

macro_rules! registry_from {
    ($variant:ident, $inner:ty) => {
        impl From<$inner> for RegistryValue {
            fn from(v: $inner) -> Self {
                Self::$variant(v)
            }
        }
    };
}

registry_from!(ModuleKind, ModuleKind);
registry_from!(ScopeKind, ScopeKind);
registry_from!(TypeForm, TypeForm);
registry_from!(CanonicalTypeKind, CanonicalTypeKind);
registry_from!(EffectCategory, EffectCategory);
registry_from!(LoopKind, LoopKind);
registry_from!(BinOpKind, BinOpKind);
registry_from!(UnOpKind, UnOpKind);
registry_from!(AssignOp, AssignOp);
registry_from!(LiteralKind, LiteralKind);
registry_from!(PatternKind, PatternKind);
registry_from!(ChannelOpKind, ChannelOpKind);
registry_from!(ConformanceProfile, ConformanceProfile);

impl From<SymbolRole> for RegistryValue {
    fn from(v: SymbolRole) -> Self {
        Self::SymbolRole(v)
    }
}

/// Symbol role (spec §6.6). Includes extension roles via `x-<vendor>:<role>`.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SymbolRole {
    #[serde(rename = "parameter")]
    Parameter,
    #[serde(rename = "test")]
    Test,
    Extension(String),
}

impl SymbolRole {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Parameter => "parameter",
            Self::Test => "test",
            Self::Extension(s) => s,
        }
    }
}

impl fmt::Display for SymbolRole {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for SymbolRole {
    type Err = std::convert::Infallible;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "parameter" => Self::Parameter,
            "test" => Self::Test,
            other => Self::Extension(other.into()),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spec_enum_round_trip() {
        assert_eq!(ModuleKind::Package.as_str(), "package");
        assert_eq!(ModuleKind::Package.to_string(), "package");
        assert_eq!(
            "package".parse::<ModuleKind>().unwrap(),
            ModuleKind::Package
        );

        assert_eq!(ScopeKind::Block.as_str(), "block");
        assert_eq!("block".parse::<ScopeKind>().unwrap(), ScopeKind::Block);

        assert_eq!(EffectCategory::IO.as_str(), "IO");
        assert_eq!("IO".parse::<EffectCategory>().unwrap(), EffectCategory::IO);
    }

    #[test]
    fn spec_enum_rejects_unknown() {
        assert!("nope".parse::<ModuleKind>().is_err());
        assert!("nope".parse::<LoopKind>().is_err());
    }

    #[test]
    fn registry_value_display_and_as_str() {
        let rv = RegistryValue::ModuleKind(ModuleKind::Package);
        assert_eq!(rv.as_str(), "package");
        assert_eq!(rv.to_string(), "package");

        let ext = RegistryValue::Extension("custom".into());
        assert_eq!(ext.as_str(), "custom");
        assert_eq!(ext.to_string(), "custom");
    }

    #[test]
    fn registry_value_from_impls() {
        let rv: RegistryValue = ModuleKind::Package.into();
        assert_eq!(rv, RegistryValue::ModuleKind(ModuleKind::Package));

        let rv: RegistryValue = BinOpKind::Add.into();
        assert_eq!(rv, RegistryValue::BinOpKind(BinOpKind::Add));

        let rv: RegistryValue = SymbolRole::Parameter.into();
        assert_eq!(rv, RegistryValue::SymbolRole(SymbolRole::Parameter));
    }

    #[test]
    fn symbol_role_round_trip() {
        assert_eq!(SymbolRole::Parameter.as_str(), "parameter");
        assert_eq!(SymbolRole::Parameter.to_string(), "parameter");
        assert_eq!(
            "parameter".parse::<SymbolRole>().unwrap(),
            SymbolRole::Parameter
        );
        assert_eq!(
            "x-custom:role".parse::<SymbolRole>().unwrap(),
            SymbolRole::Extension("x-custom:role".into())
        );
    }
}
