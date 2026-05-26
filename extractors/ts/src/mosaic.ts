export interface TesseraId {
  corpus: string;
  language: string;
  module: string;
  scope: string;
  signature: string;
}

export type TesseraKind =
  | "Corpus"
  | "Dependency"
  | "Anchor"
  | "File"
  | "Module"
  | "Scope"
  | "TypeRef"
  | "Function"
  | "Type"
  | "Variable"
  | "Field"
  | "Variant"
  | "Constant"
  | "Macro"
  | "Block"
  | "If"
  | "Match"
  | "Loop"
  | "Break"
  | "Continue"
  | "Return"
  | "Yield"
  | "Throw"
  | "TryCatch"
  | "Defer"
  | "Call"
  | "BinOp"
  | "UnOp"
  | "Assign"
  | "Index"
  | "Access"
  | "Literal"
  | "Lambda"
  | "Cast"
  | "Tuple"
  | "RecordLit"
  | "ListLit"
  | "MapLit"
  | "SetLit"
  | "Range"
  | "Pattern"
  | "Spawn"
  | "Await"
  | "ChannelOp";

export type BondKind =
  | "child_of"
  | "enclosing_scope"
  | "defined_in"
  | "defines_module"
  | "depends_on"
  | "defines"
  | "declares"
  | "binds"
  | "references"
  | "reads"
  | "writes"
  | "calls"
  | "instantiates"
  | "throws"
  | "imports"
  | "extends"
  | "conforms_to"
  | "has_type"
  | "returns"
  | "param_type"
  | "field"
  | "variant"
  | "target"
  | "type_arg"
  | "cond"
  | "then"
  | "else"
  | "body"
  | "arm"
  | "pattern"
  | "guard"
  | "subject"
  | "callee"
  | "arg"
  | "receiver"
  | "lhs"
  | "rhs"
  | "operand"
  | "value"
  | "iter"
  | "start"
  | "end"
  | "element"
  | "handler"
  | "finally"
  | "may_throw"
  | "effect_carrier";

export type RegistryValue =
  | { ModuleKind: string }
  | { ScopeKind: string }
  | { TypeForm: string }
  | { CanonicalTypeKind: string }
  | { EffectCategory: string }
  | { LoopKind: string }
  | { BinOpKind: string }
  | { UnOpKind: string }
  | { AssignOp: string }
  | { LiteralKind: string }
  | { PatternKind: string }
  | { ChannelOpKind: string }
  | { SymbolRole: string }
  | { ConformanceProfile: string }
  | { Extension: string };

export type FactValue =
  | { String: string }
  | { Integer: number }
  | { Boolean: boolean }
  | { Bytes: number[] }
  | { Enum: RegistryValue }
  | { NodeRef: TesseraId }
  | { List: FactValue[] }
  | { Map: Record<string, FactValue> };

export interface Tessera {
  id: TesseraId;
  kind: TesseraKind;
  facts: Record<string, FactValue>;
}

export interface Bond {
  kind: BondKind;
  source: TesseraId;
  target: TesseraId;
  ordinal: number | null;
  facts: Record<string, FactValue>;
}

export type NdjsonLine = { tile: Tessera } | { bond: Bond };
