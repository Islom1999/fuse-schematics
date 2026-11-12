import { Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import { Schema } from "./schema";
export declare const NAVIGATION_ICON = "heroicons_outline:rectangle-stack";
export interface FeatureLocation {
    /** Parent directory of the feature folders, no leading slash. */
    path: string;
    prefix: string;
    sourceRoot: string;
}
/**
 * Resolves where features go. Precedence: CLI flag > fuse-schematics.json
 * (`fuse-feature` section) > computed default (`<sourceRoot>/app/modules/admin`).
 */
export declare function resolveFeatureLocation(tree: Tree, options: {
    path?: string;
    project?: string;
    prefix?: string;
}, context: SchematicContext): FeatureLocation;
export declare function fuseFeature(options: Schema): Rule;
