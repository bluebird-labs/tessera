import type { FactValue, RegistryValue } from "../mosaic.js";

export const ModuleKind = {
  Package: "package",
  Namespace: "namespace",
  FileModule: "file_module",
  CrateMod: "crate_mod",
  Singleton: "singleton",
} as const;

export const ScopeKind = {
  Module: "module",
  Type: "type",
  Function: "function",
  Block: "block",
  MatchArm: "match_arm",
  Closure: "closure",
} as const;

export const TypeForm = {
  Primitive: "primitive",
  Structural: "structural",
  Nominal: "nominal",
  Alias: "alias",
} as const;

export const CanonicalTypeKind = {
  Int: "int",
  Float: "float",
  Bool: "bool",
  String: "string",
  Byte: "byte",
  Char: "char",
  Void: "void",
  Never: "never",
  Null: "null",
  Any: "any",
  Unknown: "unknown",
  Record: "record",
  Tuple: "tuple",
  Sum: "sum",
  Function: "function",
  Reference: "reference",
  List: "list",
  Map: "map",
  Set: "set",
  Optional: "optional",
  Result: "result",
  Future: "future",
  Channel: "channel",
  Iterator: "iterator",
  Intersection: "intersection",
  Alias: "alias",
} as const;

export const ConformanceProfile = {
  Core: "core",
  Ops: "ops",
  Effects: "effects",
} as const;

export const SymbolRole = {
  Parameter: "parameter",
  Test: "test",
} as const;

export function moduleKind(v: string): FactValue {
  return { Enum: { ModuleKind: v } satisfies RegistryValue };
}

export function scopeKind(v: string): FactValue {
  return { Enum: { ScopeKind: v } satisfies RegistryValue };
}

export function typeForm(v: string): FactValue {
  return { Enum: { TypeForm: v } satisfies RegistryValue };
}

export function canonicalTypeKind(v: string): FactValue {
  return { Enum: { CanonicalTypeKind: v } satisfies RegistryValue };
}

export function conformanceProfile(v: string): FactValue {
  return { Enum: { ConformanceProfile: v } satisfies RegistryValue };
}

export function symbolRole(v: string): FactValue {
  return { Enum: { SymbolRole: v } satisfies RegistryValue };
}
