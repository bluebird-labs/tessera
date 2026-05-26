import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { Project } from "ts-morph";
import type { MosaicStream } from "../builder.js";
import { corpusId, fileId, moduleId, dependencyId, filePathToModulePath } from "../id.js";
import { getCorpusRelativePath } from "../project.js";
import * as F from "../util/facts.js";
import { ModuleKind, ConformanceProfile, conformanceProfile } from "../util/enums.js";

export function emitCorpus(
  stream: MosaicStream,
  corpus: string,
  name: string,
): void {
  stream.emitTile(corpusId(corpus), "Corpus", {
    [F.SCHEMA_VERSION]: { String: "0.1.0" },
    [F.CORPUS_NAME]: { String: name },
    [F.CONFORMANCE_PROFILES]: {
      List: [conformanceProfile(ConformanceProfile.Core)],
    },
  });
}

export function emitFiles(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
  project: Project,
): void {
  const cid = corpusId(corpus);

  for (const sourceFile of project.getSourceFiles()) {
    const absPath = sourceFile.getFilePath();
    const relPath = getCorpusRelativePath(projectRoot, absPath);
    if (relPath.includes("node_modules/")) continue;

    const content = sourceFile.getFullText();
    const digest = createHash("sha256").update(content).digest("hex");

    const fid = fileId(corpus, relPath);
    stream.emitTile(fid, "File", {
      [F.FILE_PATH]: { String: relPath },
      [F.FILE_DIGEST]: { String: digest },
    });

    const lang = relPath.endsWith(".ts") || relPath.endsWith(".d.ts") ? "ts" : "js";
    const modPath = filePathToModulePath(relPath);
    const mid = moduleId(corpus, lang, modPath);

    if (!stream.hasTile(mid)) {
      stream.emitTile(mid, "Module", {
        [F.MODULE_KIND]: { Enum: { ModuleKind: ModuleKind.FileModule } },
      });
      stream.emitBond("child_of", mid, cid);
    }

    stream.emitBond("defines_module", fid, mid);
  }
}

export function emitDependencies(
  stream: MosaicStream,
  corpus: string,
  projectRoot: string,
): void {
  const pkgPath = join(projectRoot, "package.json");
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
  } catch {
    return;
  }

  const cid = corpusId(corpus);

  type DepMeta = { versionSpec: string; devOnly: boolean; optional: boolean };
  const acc = new Map<string, DepMeta>();

  const collect = (
    deps: Record<string, string>,
    opts: { devOnly?: boolean; optional?: boolean } = {},
  ) => {
    for (const [name, versionSpec] of Object.entries(deps)) {
      const prev = acc.get(name);
      acc.set(name, {
        versionSpec: prev?.versionSpec ?? versionSpec,
        devOnly: Boolean(prev?.devOnly || opts.devOnly),
        optional: Boolean(prev?.optional || opts.optional),
      });
    }
  };

  if (pkg.dependencies && typeof pkg.dependencies === "object")
    collect(pkg.dependencies as Record<string, string>);
  if (pkg.devDependencies && typeof pkg.devDependencies === "object")
    collect(pkg.devDependencies as Record<string, string>, { devOnly: true });
  if (pkg.optionalDependencies && typeof pkg.optionalDependencies === "object")
    collect(pkg.optionalDependencies as Record<string, string>, { optional: true });

  for (const [name, meta] of acc) {
    const did = dependencyId(corpus, name);
    const facts: Record<string, import("../mosaic.js").FactValue> = {
      [F.DEPENDENCY_NAME]: { String: name },
      [F.DEPENDENCY_VERSION_SPEC]: { String: meta.versionSpec },
    };
    if (meta.devOnly) facts[F.DEPENDENCY_DEV_ONLY] = { Boolean: true };
    if (meta.optional) facts[F.DEPENDENCY_OPTIONAL] = { Boolean: true };

    stream.emitTile(did, "Dependency", facts);
    stream.emitBond("depends_on", cid, did);
  }
}
