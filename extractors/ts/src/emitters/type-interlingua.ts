import {
  Node,
  SyntaxKind,
  TypeFormatFlags,
  type SourceFile,
  type Type,
} from "ts-morph";
import type { MosaicStream } from "../builder.js";
import type { FactValue, TesseraId } from "../mosaic.js";
import {
  declarationId,
  typeRefId,
  fileId,
  filePathToModulePath,
} from "../id.js";
import { getCorpusRelativePath } from "../project.js";
import * as F from "../util/facts.js";
import {
  TypeForm,
  CanonicalTypeKind,
  typeForm,
  canonicalTypeKind,
} from "../util/enums.js";

export function emitTypes(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
  sourceFile: SourceFile,
): void {
  const relPath = getCorpusRelativePath(projectRoot, sourceFile.getFilePath());
  const lang =
    relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
  const modPath = filePathToModulePath(relPath);
  const fid = fileId(corpus, relPath);
  let typeOrd = 0;

  for (const stmt of sourceFile.getStatements()) {
    if (Node.isFunctionDeclaration(stmt)) {
      const name = stmt.getName();
      if (!name) continue;
      const fnId = declarationId(corpus, lang, modPath, "", name);

      const retType = stmt.getReturnType();
      emitTypeRef(stream, corpus, lang, modPath, "", name, fnId, "returns", retType, typeOrd++);

      for (const [i, param] of stmt.getParameters().entries()) {
        const paramType = param.getType();
        const paramName = param.getNameNode().getText();
        const paramId = declarationId(corpus, lang, modPath, name, paramName);
        emitTypeRef(stream, corpus, lang, modPath, name, paramName, fnId, "param_type", paramType, typeOrd++, i);
        emitTypeRef(stream, corpus, lang, modPath, name, paramName, paramId, "has_type", paramType, typeOrd++);
      }
    } else if (Node.isVariableStatement(stmt)) {
      for (const decl of stmt.getDeclarationList().getDeclarations()) {
        const name = decl.getName();
        const declType = decl.getType();
        const did = declarationId(corpus, lang, modPath, "", name);
        emitTypeRef(stream, corpus, lang, modPath, "", name, did, "has_type", declType, typeOrd++);
      }
    } else if (Node.isInterfaceDeclaration(stmt)) {
      const name = stmt.getName();
      const did = declarationId(corpus, lang, modPath, "", name);
      emitTypeNodeFacts(stream, did, stmt.getType());

      for (const prop of stmt.getProperties()) {
        const propName = prop.getName();
        const fieldId = declarationId(corpus, lang, modPath, name, propName);
        const propType = prop.getType();
        emitTypeRef(stream, corpus, lang, modPath, name, propName, fieldId, "has_type", propType, typeOrd++);
      }

      for (const method of stmt.getMethods()) {
        const methodName = method.getName();
        const methodId = declarationId(corpus, lang, modPath, name, methodName);
        const retType = method.getReturnType();
        emitTypeRef(stream, corpus, lang, modPath, name, methodName, methodId, "returns", retType, typeOrd++);
      }

      for (const ext of stmt.getExtends()) {
        const extType = ext.getType();
        emitTypeRef(stream, corpus, lang, modPath, "", name, did, "extends", extType, typeOrd++);
      }
    } else if (Node.isTypeAliasDeclaration(stmt)) {
      const name = stmt.getName();
      const did = declarationId(corpus, lang, modPath, "", name);
      emitTypeNodeFacts(stream, did, stmt.getType());
    } else if (Node.isClassDeclaration(stmt)) {
      const name = stmt.getName();
      if (!name) continue;
      const did = declarationId(corpus, lang, modPath, "", name);
      emitTypeNodeFacts(stream, did, stmt.getType());

      for (const impl of stmt.getImplements()) {
        const implType = impl.getType();
        emitTypeRef(stream, corpus, lang, modPath, "", name, did, "conforms_to", implType, typeOrd++);
      }

      const ext = stmt.getExtends();
      if (ext) {
        emitTypeRef(stream, corpus, lang, modPath, "", name, did, "extends", ext.getType(), typeOrd++);
      }
    }
  }
}

function emitTypeRef(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentSig: string,
  sourceId: TesseraId,
  bondKind: "has_type" | "returns" | "param_type" | "extends" | "conforms_to",
  type: Type,
  ordinal: number,
  paramIndex?: number,
): void {
  const trid = typeRefId(corpus, lang, modPath, scope, parentSig, ordinal);
  const mapping = mapType(type);

  const facts: Record<string, FactValue> = {};
  if (mapping.form) facts[F.TYPE_FORM] = typeForm(mapping.form);
  if (mapping.canonicalKind)
    facts[F.TYPE_CANONICAL_KIND] = canonicalTypeKind(mapping.canonicalKind);

  stream.emitTile(trid, "TypeRef", facts);
  stream.emitBond(bondKind, sourceId, trid, paramIndex ?? null);
}

function emitTypeNodeFacts(
  stream: MosaicStream,
  typeId: TesseraId,
  type: Type,
): void {
  if (!stream.hasTile(typeId)) return;

  const mapping = mapType(type);
  if (!mapping.form && !mapping.canonicalKind) return;

  // Type facts are set during declaration emission; we just verify the type maps correctly here.
  // The actual facts on Type tesserae should be set in declaration.ts if needed.
}

interface TypeMapping {
  form: string | null;
  canonicalKind: string | null;
}

function mapType(type: Type): TypeMapping {
  if (type.isString() || type.isStringLiteral()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.String };
  }
  if (type.isNumber() || type.isNumberLiteral()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Float };
  }
  if (type.isBoolean() || type.isBooleanLiteral()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Bool };
  }
  if (type.isVoid() || type.isUndefined()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Void };
  }
  if (type.isNull()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Null };
  }
  if (type.isNever()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Never };
  }
  if (type.isAny()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Any };
  }
  if (type.isUnknown()) {
    return { form: TypeForm.Primitive, canonicalKind: CanonicalTypeKind.Unknown };
  }

  if (type.isArray()) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.List };
  }
  if (type.isTuple()) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Tuple };
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const nonNull = unionTypes.filter(
      (t) => !t.isNull() && !t.isUndefined(),
    );
    if (nonNull.length < unionTypes.length && nonNull.length === 1) {
      return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Optional };
    }
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Sum };
  }

  if (type.isIntersection()) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Intersection };
  }

  const callSignatures = type.getCallSignatures();
  if (callSignatures.length > 0 && type.getProperties().length === 0) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Function };
  }

  const typeText = type.getText(undefined, TypeFormatFlags.None);

  if (typeText.startsWith("Promise<")) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Future };
  }
  if (typeText.startsWith("Map<")) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Map };
  }
  if (typeText.startsWith("Set<")) {
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Set };
  }

  if (type.isObject() || type.isInterface() || type.isClass()) {
    const symbol = type.getSymbol();
    if (symbol) {
      return { form: TypeForm.Nominal, canonicalKind: CanonicalTypeKind.Record };
    }
    return { form: TypeForm.Structural, canonicalKind: CanonicalTypeKind.Record };
  }

  return { form: null, canonicalKind: null };
}
