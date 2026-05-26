import { Project, ScriptTarget, ModuleKind } from "ts-morph";
import { resolve } from "node:path";

export interface ProjectOptions {
  projectRoot: string;
  tsConfigPath?: string;
}

export function createProject(opts: ProjectOptions): Project {
  const root = resolve(opts.projectRoot);
  const tsConfigPath = opts.tsConfigPath
    ? resolve(opts.tsConfigPath)
    : undefined;

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.CommonJS,
      allowJs: true,
      checkJs: true,
      strict: false,
      skipLibCheck: true,
      noEmit: true,
    },
  });

  project.addSourceFilesAtPaths([
    `${root}/*.js`,
    `${root}/lib/**/*.js`,
    `${root}/*.d.ts`,
  ]);

  return project;
}

export function getCorpusRelativePath(
  projectRoot: string,
  absolutePath: string,
): string {
  const root = resolve(projectRoot);
  const rel = absolutePath.startsWith(root + "/")
    ? absolutePath.slice(root.length + 1)
    : absolutePath;
  return rel;
}
