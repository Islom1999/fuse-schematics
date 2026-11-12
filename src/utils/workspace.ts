import { Tree } from '@angular-devkit/schematics';
import { logging } from '@angular-devkit/core';

/** Name of the optional per-workspace configuration file. */
export const CONFIG_FILE = 'fuse-schematics.json';

export interface WorkspaceProjectInfo {
  /** Project name in angular.json, or `undefined` when none was found. */
  name?: string;
  /** Project root ('' for the default single-project layout). */
  root: string;
  /** Project sourceRoot without leading/trailing slashes, e.g. `src`. */
  sourceRoot: string;
}

function stripSlashes(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

/**
 * Parses JSON, tolerating `//` and `/* *\/` comments and trailing commas
 * (angular.json is sometimes hand-edited like a JSONC file).
 */
export function parseJsonLoose(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const withoutComments = text.replace(
      /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      (_m, str) => str || ''
    );
    const withoutTrailingCommas = withoutComments.replace(
      /("(?:\\.|[^"\\])*")|,(\s*[}\]])/g,
      (_m, str, tail) => str || tail
    );
    return JSON.parse(withoutTrailingCommas);
  }
}

export function readJson(tree: Tree, path: string): any | undefined {
  if (!tree.exists(path)) {
    return undefined;
  }
  return parseJsonLoose(tree.readText(path));
}

/**
 * Resolves the target project from angular.json: the project named
 * `projectName`, otherwise the first `application` project, otherwise the
 * first project. Falls back to `{ root: '', sourceRoot: 'src' }` when there is
 * no (readable) angular.json.
 */
export function getProjectInfo(
  tree: Tree,
  projectName?: string,
  logger?: logging.LoggerApi
): WorkspaceProjectInfo {
  const fallback: WorkspaceProjectInfo = { root: '', sourceRoot: 'src' };

  let workspace: any;
  try {
    workspace = readJson(tree, '/angular.json');
  } catch (e) {
    logger?.warn(`Could not parse angular.json (${(e as Error).message}); assuming sourceRoot "src".`);
    return fallback;
  }
  if (!workspace) {
    if (projectName) {
      logger?.warn(`angular.json not found; ignoring --project "${projectName}".`);
    }
    return fallback;
  }

  const projects: Record<string, any> = workspace.projects || {};
  const names = Object.keys(projects);

  let name: string | undefined;
  if (projectName) {
    if (!projects[projectName]) {
      throw new Error(
        `Project "${projectName}" does not exist in angular.json. Available projects: ${
          names.join(', ') || '(none)'
        }.`
      );
    }
    name = projectName;
  } else {
    name =
      names.find((n) => projects[n] && projects[n].projectType === 'application') ?? names[0];
  }

  if (!name) {
    return fallback;
  }

  const project = projects[name] || {};
  const root = stripSlashes(project.root || '');
  const sourceRoot =
    typeof project.sourceRoot === 'string'
      ? stripSlashes(project.sourceRoot)
      : stripSlashes(root ? `${root}/src` : 'src');

  return { name, root, sourceRoot };
}

/**
 * Reads the `section` of `<workspace root>/fuse-schematics.json`, if present.
 */
export function readSchematicsConfig(
  tree: Tree,
  section: string,
  logger?: logging.LoggerApi
): Record<string, unknown> {
  const path = `/${CONFIG_FILE}`;
  if (!tree.exists(path)) {
    return {};
  }
  try {
    const config = readJson(tree, path);
    const value = config && config[section];
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch (e) {
    logger?.warn(`Could not parse ${CONFIG_FILE} (${(e as Error).message}); ignoring it.`);
    return {};
  }
}

/** Joins path segments with `/`, dropping empty segments and duplicate slashes. */
export function joinPath(...segments: string[]): string {
  return segments
    .map(stripSlashes)
    .filter((s) => s.length > 0)
    .join('/');
}
