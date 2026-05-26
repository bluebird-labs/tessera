import { Node, SyntaxKind, type SourceFile } from "ts-morph";
import type { MosaicStream } from "../builder.js";
import {
  moduleId,
  dependencyId,
  anchorId,
  filePathToModulePath,
} from "../id.js";
import { getCorpusRelativePath } from "../project.js";
import * as F from "../util/facts.js";
import { resolve, dirname, relative } from "node:path";

export function emitImports(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
  sourceFile: SourceFile,
): void {
  const relPath = getCorpusRelativePath(projectRoot, sourceFile.getFilePath());
  const lang =
    relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
  const modPath = filePathToModulePath(relPath);
  let anchorOrd = 1000;

  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const expr = call.getExpression();
    if (!Node.isIdentifier(expr) || expr.getText() !== "require") continue;

    const args = call.getArguments();
    if (args.length === 0) continue;
    const firstArg = args[0];
    if (!Node.isStringLiteral(firstArg)) continue;

    const specifier = firstArg.getLiteralValue();
    const targetId = resolveSpecifier(stream, corpus, lang, projectRoot, sourceFile, specifier);
    if (!targetId) continue;

    const aid = anchorId(corpus, lang, modPath, "", `require(${specifier})`, anchorOrd++);
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: call.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: call.getEnd() },
    });
    stream.emitBond("imports", aid, targetId);
  }

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const specifier = importDecl.getModuleSpecifierValue();
    const targetId = resolveSpecifier(stream, corpus, lang, projectRoot, sourceFile, specifier);
    if (!targetId) continue;

    const aid = anchorId(corpus, lang, modPath, "", `import(${specifier})`, anchorOrd++);
    stream.emitTile(aid, "Anchor", {
      [F.ANCHOR_FILE]: { String: relPath },
      [F.ANCHOR_BYTE_START]: { Integer: importDecl.getStart() },
      [F.ANCHOR_BYTE_END]: { Integer: importDecl.getEnd() },
    });
    stream.emitBond("imports", aid, targetId);
  }
}

function resolveSpecifier(
  stream: MosaicStream,
  corpus: string,
  lang: string,
  projectRoot: string,
  sourceFile: SourceFile,
  specifier: string,
): import("../mosaic.js").TesseraId | null {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    const sourceDir = dirname(sourceFile.getFilePath());
    const resolved = resolve(sourceDir, specifier);
    const rel = relative(projectRoot, resolved);
    const targetModPath = filePathToModulePath(rel);
    return moduleId(corpus, lang, targetModPath);
  }

  const bare = specifier.startsWith("node:") ? specifier.slice(5) : specifier;
  const pkgName = extractPackageName(bare);

  const depId = dependencyId(corpus, pkgName);
  if (!stream.hasTile(depId)) {
    stream.emitTile(depId, "Dependency", {
      [F.DEPENDENCY_NAME]: { String: pkgName },
    });
    const cid = { corpus, language: "_", module: "", scope: "", signature: "_" };
    stream.emitBond("depends_on", cid, depId);
  }

  return depId;
}

function extractPackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}
