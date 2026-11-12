import { Tree } from '@angular-devkit/schematics';
import { logging } from '@angular-devkit/core';
/** Name of the optional per-workspace configuration file. */
export declare const CONFIG_FILE = "fuse-schematics.json";
export interface WorkspaceProjectInfo {
    /** Project name in angular.json, or `undefined` when none was found. */
    name?: string;
    /** Project root ('' for the default single-project layout). */
    root: string;
    /** Project sourceRoot without leading/trailing slashes, e.g. `src`. */
    sourceRoot: string;
}
/**
 * Parses JSON, tolerating `//` and `/* *\/` comments and trailing commas
 * (angular.json is sometimes hand-edited like a JSONC file).
 */
export declare function parseJsonLoose(text: string): any;
export declare function readJson(tree: Tree, path: string): any | undefined;
/**
 * Resolves the target project from angular.json: the project named
 * `projectName`, otherwise the first `application` project, otherwise the
 * first project. Falls back to `{ root: '', sourceRoot: 'src' }` when there is
 * no (readable) angular.json.
 */
export declare function getProjectInfo(tree: Tree, projectName?: string, logger?: logging.LoggerApi): WorkspaceProjectInfo;
/**
 * Reads the `section` of `<workspace root>/fuse-schematics.json`, if present.
 */
export declare function readSchematicsConfig(tree: Tree, section: string, logger?: logging.LoggerApi): Record<string, unknown>;
/** Joins path segments with `/`, dropping empty segments and duplicate slashes. */
export declare function joinPath(...segments: string[]): string;
