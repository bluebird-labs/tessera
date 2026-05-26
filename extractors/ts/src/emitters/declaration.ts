import {
  Node,
  SyntaxKind,
  type SourceFile,
  type FunctionDeclaration,
  type VariableDeclaration,
  type InterfaceDeclaration,
  type TypeAliasDeclaration,
  type ModuleDeclaration,
  type ClassDeclaration,
  type EnumDeclaration,
  type PropertySignature,
  type MethodSignature,
  type PropertyAssignment,
} from "ts-morph";
import type { MosaicStream } from "../builder.js";
import type { FactValue, TesseraKind } from "../mosaic.js";
import {
  declarationId,
  fileId,
  moduleId,
  anchorId,
  scopeNodeId,
  filePathToModulePath,
} from "../id.js";
import { getCorpusRelativePath } from "../project.js";
import * as F from "../util/facts.js";
import { ScopeKind, SymbolRole, symbolRole, scopeKind } from "../util/enums.js";

export function emitDeclarations(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
  sourceFile: SourceFile,
): void {
  const relPath = getCorpusRelativePath(projectRoot, sourceFile.getFilePath());
  const lang = relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
  const modPath = filePathToModulePath(relPath);
  const mid = moduleId(corpus, lang, modPath);
  const fid = fileId(corpus, relPath);

  let anchorOrd = 0;
  let scopeOrd = 0;

  const emitDecl = (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts: Record<string, FactValue> = {},
  ) => {
    const did = declarationId(corpus, lang, modPath, scope, name);
    const facts: Record<string, FactValue> = { ...extraFacts };

    const jsDocs = Node.isJSDocable(node) ? node.getJsDocs() : [];
    if (jsDocs.length > 0) {
      const docText = jsDocs.map((d) => d.getDescription().trim()).join("\n");
      if (docText) facts[F.DOC_TEXT] = { String: docText };
    }

    stream.emitTile(did, kind, facts);
    stream.emitBond("child_of", did, parentId);
    stream.emitBond("defined_in", did, fid);

    const aid = anchorId(corpus, lang, modPath, scope, name, anchorOrd++);
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: node.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: node.getEnd() },
    });
    stream.emitBond("defines", aid, did);

    return did;
  };

  for (const stmt of sourceFile.getStatements()) {
    if (Node.isFunctionDeclaration(stmt)) {
      const name = stmt.getName();
      if (!name) continue;
      const did = emitDecl(name, "Function", "", mid, stmt);
      emitFunctionScope(stream, corpus, lang, modPath, did, name, stmt, fid, relPath, scopeOrd++, anchorOrd);
      emitParams(stream, corpus, lang, modPath, did, name, stmt, fid, relPath, anchorOrd);
    } else if (Node.isVariableStatement(stmt)) {
      for (const decl of stmt.getDeclarationList().getDeclarations()) {
        emitVariableDecl(stream, corpus, lang, modPath, "", mid, fid, relPath, decl, anchorOrd, scopeOrd, emitDecl);
      }
    } else if (Node.isInterfaceDeclaration(stmt)) {
      emitInterface(stream, corpus, lang, modPath, "", mid, fid, relPath, stmt, anchorOrd, scopeOrd, emitDecl);
    } else if (Node.isTypeAliasDeclaration(stmt)) {
      const name = stmt.getName();
      emitDecl(name, "Type", "", mid, stmt);
    } else if (Node.isClassDeclaration(stmt)) {
      emitClass(stream, corpus, lang, modPath, "", mid, fid, relPath, stmt, anchorOrd, scopeOrd, emitDecl);
    } else if (Node.isEnumDeclaration(stmt)) {
      emitEnum(stream, corpus, lang, modPath, "", mid, fid, relPath, stmt, anchorOrd, emitDecl);
    } else if (Node.isModuleDeclaration(stmt)) {
      emitNamespace(stream, corpus, lang, modPath, "", mid, fid, relPath, stmt, anchorOrd, scopeOrd, emitDecl);
    }
  }
}

function emitVariableDecl(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentId: import("../mosaic.js").TesseraId,
  _fid: import("../mosaic.js").TesseraId,
  _relPath: string,
  decl: VariableDeclaration,
  _anchorOrd: number,
  _scopeOrd: number,
  emitDecl: (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts?: Record<string, FactValue>,
  ) => import("../mosaic.js").TesseraId,
): void {
  const name = decl.getName();
  const init = decl.getInitializer();

  if (
    init &&
    (Node.isFunctionExpression(init) || Node.isArrowFunction(init))
  ) {
    emitDecl(name, "Function", scope, parentId, decl);
  } else {
    const isConst =
      decl.getVariableStatement()?.getDeclarationKind() === "const" as never;
    emitDecl(name, isConst ? "Constant" : "Variable", scope, parentId, decl);
  }
}

function emitFunctionScope(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  parentId: import("../mosaic.js").TesseraId,
  parentSig: string,
  _fn: FunctionDeclaration,
  _fid: import("../mosaic.js").TesseraId,
  _relPath: string,
  scopeOrd: number,
  _anchorOrd: number,
): void {
  const sid = scopeNodeId(corpus, lang, modPath, "", parentSig, scopeOrd);
  stream.emitTile(sid, "Scope", {
    [F.SCOPE_KIND]: scopeKind(ScopeKind.Function),
  });
  stream.emitBond("child_of", sid, parentId);
  stream.emitBond("enclosing_scope", sid, parentId);
}

function emitParams(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  fnId: import("../mosaic.js").TesseraId,
  fnName: string,
  fn: FunctionDeclaration,
  fid: import("../mosaic.js").TesseraId,
  relPath: string,
  anchorOrdBase: number,
): void {
  let ord = anchorOrdBase;
  for (const param of fn.getParameters()) {
    const name = param.getName();
    const pid = declarationId(corpus, lang, modPath, fnName, name);

    stream.emitTile(pid, "Variable", {
      [F.SYMBOL_ROLE]: symbolRole(SymbolRole.Parameter),
    });
    stream.emitBond("child_of", pid, fnId);
    stream.emitBond("defined_in", pid, fid);

    const aid = anchorId(corpus, lang, modPath, fnName, name, ord++);
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: param.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: param.getEnd() },
    });
    stream.emitBond("defines", aid, pid);
  }
}

function emitInterface(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentId: import("../mosaic.js").TesseraId,
  fid: import("../mosaic.js").TesseraId,
  relPath: string,
  iface: InterfaceDeclaration,
  anchorOrd: number,
  _scopeOrd: number,
  emitDecl: (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts?: Record<string, FactValue>,
  ) => import("../mosaic.js").TesseraId,
): void {
  const name = iface.getName();
  const did = emitDecl(name, "Type", scope, parentId, iface);

  for (const prop of iface.getProperties()) {
    const propName = prop.getName();
    const fieldId = declarationId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      propName,
    );
    stream.emitTile(fieldId, "Field", {});
    stream.emitBond("child_of", fieldId, did);
    stream.emitBond("defined_in", fieldId, fid);

    const aid = anchorId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      propName,
      anchorOrd++,
    );
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: prop.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: prop.getEnd() },
    });
    stream.emitBond("defines", aid, fieldId);
  }

  for (const method of iface.getMethods()) {
    const methodName = method.getName();
    const methodId = declarationId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      methodName,
    );
    stream.emitTile(methodId, "Function", {});
    stream.emitBond("child_of", methodId, did);
    stream.emitBond("defined_in", methodId, fid);
  }
}

function emitClass(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentId: import("../mosaic.js").TesseraId,
  fid: import("../mosaic.js").TesseraId,
  relPath: string,
  cls: ClassDeclaration,
  anchorOrd: number,
  _scopeOrd: number,
  emitDecl: (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts?: Record<string, FactValue>,
  ) => import("../mosaic.js").TesseraId,
): void {
  const name = cls.getName();
  if (!name) return;
  const did = emitDecl(name, "Type", scope, parentId, cls);

  for (const prop of cls.getProperties()) {
    const propName = prop.getName();
    const fieldId = declarationId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      propName,
    );
    stream.emitTile(fieldId, "Field", {});
    stream.emitBond("child_of", fieldId, did);
    stream.emitBond("defined_in", fieldId, fid);
  }

  for (const method of cls.getMethods()) {
    const methodName = method.getName();
    const methodId = declarationId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      methodName,
    );
    stream.emitTile(methodId, "Function", {});
    stream.emitBond("child_of", methodId, did);
    stream.emitBond("defined_in", methodId, fid);
  }
}

function emitEnum(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentId: import("../mosaic.js").TesseraId,
  fid: import("../mosaic.js").TesseraId,
  relPath: string,
  enumDecl: EnumDeclaration,
  anchorOrd: number,
  emitDecl: (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts?: Record<string, FactValue>,
  ) => import("../mosaic.js").TesseraId,
): void {
  const name = enumDecl.getName();
  const did = emitDecl(name, "Type", scope, parentId, enumDecl);

  for (const member of enumDecl.getMembers()) {
    const memberName = member.getName();
    const vid = declarationId(
      corpus,
      lang,
      modPath,
      scope ? `${scope}.${name}` : name,
      memberName,
    );
    stream.emitTile(vid, "Variant", {});
    stream.emitBond("child_of", vid, did);
    stream.emitBond("defined_in", vid, fid);
  }
}

function emitNamespace(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  modPath: string,
  scope: string,
  parentId: import("../mosaic.js").TesseraId,
  fid: import("../mosaic.js").TesseraId,
  relPath: string,
  ns: ModuleDeclaration,
  anchorOrd: number,
  scopeOrd: number,
  emitDecl: (
    name: string,
    kind: TesseraKind,
    scope: string,
    parentId: import("../mosaic.js").TesseraId,
    node: Node,
    extraFacts?: Record<string, FactValue>,
  ) => import("../mosaic.js").TesseraId,
): void {
  const name = ns.getName();
  const nsMid = moduleId(corpus, lang, `${modPath}.${name}`);

  if (!stream.hasTile(nsMid)) {
    stream.emitTile(nsMid, "Module", {
      [F.MODULE_KIND]: { Enum: { ModuleKind: "namespace" } },
    });
    stream.emitBond("child_of", nsMid, parentId);
    stream.emitBond("defined_in", nsMid, fid);
  }

  const body = ns.getBody();
  if (!body || !Node.isModuleBlock(body)) return;

  for (const stmt of body.getStatements()) {
    if (Node.isInterfaceDeclaration(stmt)) {
      emitInterface(stream, corpus, lang, modPath + "." + name, scope, nsMid, fid, relPath, stmt, anchorOrd, scopeOrd, emitDecl);
    } else if (Node.isTypeAliasDeclaration(stmt)) {
      const typeName = stmt.getName();
      emitDecl(typeName, "Type", scope, nsMid, stmt);
    } else if (Node.isFunctionDeclaration(stmt)) {
      const fnName = stmt.getName();
      if (fnName) emitDecl(fnName, "Function", scope, nsMid, stmt);
    } else if (Node.isVariableStatement(stmt)) {
      for (const decl of stmt.getDeclarationList().getDeclarations()) {
        emitVariableDecl(stream, corpus, lang, modPath + "." + name, scope, nsMid, fid, relPath, decl, anchorOrd, scopeOrd, emitDecl);
      }
    } else if (Node.isModuleDeclaration(stmt)) {
      emitNamespace(stream, corpus, lang, modPath + "." + name, scope, nsMid, fid, relPath, stmt, anchorOrd, scopeOrd, emitDecl);
    }
  }
}
