import { Tree } from '@angular-devkit/schematics';
import { logging } from '@angular-devkit/core';
import { OpenApiDocument, SchemaFields } from './openapi';
/** How long a `--openapi <url>` request may take. */
export declare const FETCH_TIMEOUT_MS = 30000;
export declare function isHttpUrl(source: string): boolean;
/**
 * Reads the raw text of `--openapi`: an http(s) URL (fetched), a path inside
 * the workspace (read from the Tree, relative to the workspace root), or as a
 * last resort a file on disk relative to the current directory (e.g. a path
 * outside the workspace such as `../api/swagger.json`).
 */
export declare function readOpenApiSource(tree: Tree, source: string): Promise<string>;
/** Reads, parses and validates the `--openapi` document. */
export declare function loadOpenApi(tree: Tree, source: string): Promise<OpenApiDocument>;
/** Logs the fields taken from a schema, the skipped properties and warnings. */
export declare function logSchemaFields(logger: logging.LoggerApi, source: string, result: SchemaFields): void;
