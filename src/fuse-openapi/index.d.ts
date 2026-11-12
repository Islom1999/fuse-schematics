import { Rule } from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { OpenApiResource } from "../utils/openapi";
/** `"a, b"` / `["a", "b,c"]` → `["a", "b", "c"]`. */
export declare function parseNameList(value: string | string[] | undefined): string[];
/** Applies `--include` / `--exclude`; unknown `--include` names are an error. */
export declare function selectResources(resources: OpenApiResource[], include: string[], exclude: string[]): OpenApiResource[];
export declare function fuseOpenapi(options: Schema): Rule;
