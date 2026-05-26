import { resolve } from "node:path";
import { createProject, getCorpusRelativePath } from "./project.js";
import { MosaicStream } from "./builder.js";
import { emitCorpus, emitFiles, emitDependencies } from "./emitters/corpus.js";
import { emitDeclarations } from "./emitters/declaration.js";
import { emitImports } from "./emitters/imports.js";
import { emitCrossReferences } from "./emitters/anchor.js";
import { emitTypes } from "./emitters/type-interlingua.js";

function main(): void {
  const projectRoot = process.argv[2];
  if (!projectRoot) {
    process.stderr.write(
      "Usage: tsx src/index.ts <project-root> [corpus-name]\n",
    );
    process.exit(1);
  }

  const root = resolve(projectRoot);
  const corpusName = process.argv[3] ?? root.split("/").pop() ?? "unknown";
  const corpus = `local/${corpusName}`;

  const project = createProject({ projectRoot: root });
  const stream = new MosaicStream();

  emitCorpus(stream, corpus, corpusName);
  emitDependencies(stream, corpus, root);
  emitFiles(stream, corpus, root, project);

  for (const sourceFile of project.getSourceFiles()) {
    const relPath = getCorpusRelativePath(root, sourceFile.getFilePath());
    if (relPath.includes("node_modules/")) continue;

    emitDeclarations(stream, corpus, root, sourceFile);
    emitImports(stream, corpus, root, sourceFile);
  }

  for (const sourceFile of project.getSourceFiles()) {
    const relPath = getCorpusRelativePath(root, sourceFile.getFilePath());
    if (relPath.includes("node_modules/")) continue;

    emitCrossReferences(stream, corpus, root, sourceFile);
    emitTypes(stream, corpus, root, sourceFile);
  }
}

main();
