import { Rule } from "@angular-devkit/schematics";
import { Schema } from "./schema";
/**
 * `ng add fuse-schematics`: the package is saved as a devDependency by the
 * Angular CLI (see `ng-add.save` in package.json). This schematic only checks
 * that the workspace is an Angular (ideally Fuse) project and prints usage.
 * It does not modify any file.
 */
export declare function ngAdd(options: Schema): Rule;
