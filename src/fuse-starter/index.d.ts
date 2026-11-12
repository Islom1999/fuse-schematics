import { Rule } from "@angular-devkit/schematics";
import { Schema } from "./schema";
export declare const INITIAL_COMMIT_MESSAGE = "chore: initial commit from fuse-schematics";
/**
 * Rewrites the `name` of the template's root package.json. Done on the parsed
 * JSON (not via EJS) so the 400-file template tree is never run through the
 * template engine.
 */
export declare function renamePackageJson(content: string, name: string): string;
export declare function fuseStarter(options: Schema): Rule;
