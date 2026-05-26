import {
  Node,
  SyntaxKind,
  type Identifier,
  type SourceFile,
} from "ts-morph";
import type { MosaicStream } from "../builder.js";
import type { TesseraId } from "../mosaic.js";
import {
  anchorId,
  declarationId,
  moduleId,
  filePathToModulePath,
} from "../id.js";
import { getCorpusRelativePath } from "../project.js";
import * as F from "../util/facts.js";
import { dirname, relative, resolve } from "node:path";

export function emitCrossReferences(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
  sourceFile: SourceFile,
): void {
  const relPath = getCorpusRelativePath(projectRoot, sourceFile.getFilePath());
  const lang =
    relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
  const modPath = filePathToModulePath(relPath);
  let anchorOrd = 2000;

  for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
    if (isDeclarationName(id)) continue;
    if (isImportSpecifierName(id)) continue;

    const symbol = id.getSymbol();
    if (!symbol) continue;

    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) continue;

    const firstDecl = declarations[0];
    const targetId = resolveDeclarationTarget(
      corpus,
      projectRoot,
      firstDecl,
    );
    if (!targetId) continue;
    if (!stream.hasTile(targetId)) continue;

    const bondKind = classifyReference(id);

    const aid = anchorId(corpus, lang, modPath, "", `ref#${id.getText()}`, anchorOrd++);
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: id.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: id.getEnd() },
    });
    stream.emitBond(bondKind, aid, targetId);
  }
}

function isDeclarationName(id: Identifier): boolean {
  const parent = id.getParent();
  if (!parent) return false;

  if (
    Node.isFunctionDeclaration(parent) ||
    Node.isVariableDeclaration(parent) ||
    Node.isInterfaceDeclaration(parent) ||
    Node.isTypeAliasDeclaration(parent) ||
    Node.isClassDeclaration(parent) ||
    Node.isEnumDeclaration(parent) ||
    Node.isEnumMember(parent) ||
    Node.isPropertySignature(parent) ||
    Node.isMethodSignature(parent) ||
    Node.isPropertyDeclaration(parent) ||
    Node.isMethodDeclaration(parent) ||
    Node.isParameterDeclaration(parent)
  ) {
    const nameNode = parent.getChildAtIndex(0);
    if (nameNode === id) return true;
    if ("getName" in parent) {
      try {
        const n = (parent as { getName(): string | undefined }).getName();
        if (n === id.getText()) return true;
      } catch {
        // not all nodes have getName
      }
    }
  }
  return false;
}

function isImportSpecifierName(id: Identifier): boolean {
  const parent = id.getParent();
  if (!parent) return false;
  return (
    Node.isImportSpecifier(parent) ||
    Node.isImportClause(parent) ||
    Node.isNamespaceImport(parent)
  );
}

function classifyReference(
  id: Identifier,
): "references" | "calls" | "reads" | "writes" {
  const parent = id.getParent();
  if (!parent) return "references";

  if (Node.isCallExpression(parent) && parent.getExpression() === id) {
    return "calls";
  }

  if (Node.isPropertyAccessExpression(parent)) {
    const grandparent = parent.getParent();
    if (
      grandparent &&
      Node.isCallExpression(grandparent) &&
      grandparent.getExpression() === parent
    ) {
      return "calls";
    }
  }

  if (Node.isBinaryExpression(parent)) {
    const op = parent.getOperatorToken().getKind();
    const isAssignment =
      op >= SyntaxKind.EqualsToken &&
      op <= SyntaxKind.CaretEqualsToken;
    if (isAssignment) {
      if (parent.getLeft() === id) return "writes";
      return "reads";
    }
  }

  if (
    Node.isPrefixUnaryExpression(parent) ||
    Node.isPostfixUnaryExpression(parent)
  ) {
    const op = parent.getOperatorToken();
    if (
      op === SyntaxKind.PlusPlusToken ||
      op === SyntaxKind.MinusMinusToken
    ) {
      return "writes";
    }
  }

  return "reads";
}

function resolveDeclarationTarget(
  corpus: string,
  projectRoot: string,
  decl: Node,
): TesseraId | null {
  const sourceFile = decl.getSourceFile();
  const absPath = sourceFile.getFilePath();
  const relPath = getCorpusRelativePath(projectRoot, absPath);
  if (relPath.includes("node_modules/")) return null;

  const lang =
    relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
  const modPath = filePathToModulePath(relPath);

  let name: string | undefined;
  if (
    Node.isFunctionDeclaration(decl) ||
    Node.isInterfaceDeclaration(decl) ||
    Node.isTypeAliasDeclaration(decl) ||
    Node.isClassDeclaration(decl) ||
    Node.isEnumDeclaration(decl)
  ) {
    name = decl.getName();
  } else if (Node.isVariableDeclaration(decl)) {
    name = decl.getName();
  } else if (
    Node.isPropertySignature(decl) ||
    Node.isMethodSignature(decl) ||
    Node.isPropertyDeclaration(decl) ||
    Node.isMethodDeclaration(decl) ||
    Node.isEnumMember(decl)
  ) {
    name = decl.getName();
  } else if (Node.isParameterDeclaration(decl)) {
    name = decl.getNameNode().getText();
  }

  if (!name) return null;

  const scope = getContainingScope(decl);
  return declarationId(corpus, lang, modPath, scope, name);
}

function getContainingScope(node: Node): string {
  const parts: string[] = [];
  let current = node.getParent();

  while (current) {
    if (
      Node.isFunctionDeclaration(current) ||
      Node.isMethodDeclaration(current) ||
      Node.isClassDeclaration(current) ||
      Node.isInterfaceDeclaration(current)
    ) {
      const name = current.getName();
      if (name) parts.unshift(name);
    }
    current = current.getParent();
  }

  return parts.join(".");
}
