import { Project, ScriptTarget, ModuleKind } from "ts-morph";
import { relative, resolve } from "node:path";

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
    `${root}/**/*.ts`,
    `${root}/**/*.tsx`,
    `${root}/**/*.js`,
    `${root}/**/*.d.ts`,
    `!${root}/**/node_modules/**`,
    `!${root}/**/test/**`,
    `!${root}/**/tests/**`,
    `!${root}/**/__tests__/**`,
    `!${root}/**/benchmarks/**`,
  ]);

  return project;
}

export function getCorpusRelativePath(
  projectRoot: string,
  absolutePath: string,
): string {
  return relative(resolve(projectRoot), resolve(absolutePath));
}
