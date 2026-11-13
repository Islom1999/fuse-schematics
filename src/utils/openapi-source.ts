import { SchematicsException, Tree } from '@angular-devkit/schematics';
import * as fs from 'fs';
import * as nodePath from 'path';
import { logging } from '@angular-devkit/core';
import { stringifyFields } from './fields';
import { OpenApiDocument, OpenApiError, SchemaFields, loadOpenApiDocument, parseOpenApiText } from './openapi';

/** How long a `--openapi <url>` request may take. */
export const FETCH_TIMEOUT_MS = 30000;

export function isHttpUrl(source: string): boolean {
  return /^https?:\/\//i.test(source.trim());
}

/** Workspace-relative tree path for `source`, or `undefined` when it leaves the workspace. */
function treePath(source: string): string | undefined {
  const parts: string[] = [];
  for (const segment of source.replace(/\\/g, '/').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  return parts.length ? `/${parts.join('/')}` : undefined;
}

async function fetchText(url: string): Promise<string> {
  const fetchFn: typeof fetch | undefined = (globalThis as any).fetch;
  if (typeof fetchFn !== 'function') {
    throw new SchematicsException(
      `Cannot download ${url}: global fetch is not available (Node.js >= 20 required). Save the document to a file and pass its path instead.`
    );
  }
  const timeout = (AbortSignal as any).timeout;
  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: { accept: 'application/json, application/yaml;q=0.9, text/yaml;q=0.9, */*;q=0.5' },
      signal: typeof timeout === 'function' ? timeout.call(AbortSignal, FETCH_TIMEOUT_MS) : undefined,
    });
  } catch (e) {
    const cause = (e as any)?.cause?.code || (e as Error).message;
    throw new SchematicsException(
      `Could not download the OpenAPI document from ${url} (${cause}). Is the backend running? ` +
        'For a nest-schematics API the admin JSON is served at http://localhost:3000/docs/admin-json.'
    );
  }
  if (!response.ok) {
    throw new SchematicsException(
      `Could not download the OpenAPI document from ${url}: HTTP ${response.status}${
        response.statusText ? ` ${response.statusText}` : ''
      }.`
    );
  }
  return response.text();
}

/**
 * Reads the raw text of `--openapi`: an http(s) URL (fetched), a path inside
 * the workspace (read from the Tree, relative to the workspace root), or as a
 * last resort a file on disk relative to the current directory (e.g. a path
 * outside the workspace such as `../api/swagger.json`).
 */
export async function readOpenApiSource(tree: Tree, source: string): Promise<string> {
  const value = source.trim();
  if (isHttpUrl(value)) {
    return fetchText(value);
  }

  const inTree = treePath(value);
  if (inTree && tree.exists(inTree)) {
    return tree.readText(inTree);
  }

  const onDisk = nodePath.resolve(process.cwd(), value);
  try {
    if (fs.statSync(onDisk).isFile()) {
      return fs.readFileSync(onDisk, 'utf-8');
    }
  } catch {
    // fall through to the error below
  }
  throw new SchematicsException(
    `OpenAPI document "${source}" not found. Pass a path relative to the workspace root or an http(s) URL.`
  );
}

/** Reads, parses and validates the `--openapi` document. */
export async function loadOpenApi(tree: Tree, source: string): Promise<OpenApiDocument> {
  const text = await readOpenApiSource(tree, source);
  try {
    return loadOpenApiDocument(parseOpenApiText(text, `"${source}"`));
  } catch (e) {
    if (e instanceof OpenApiError) {
      throw new SchematicsException(`Invalid --openapi: ${e.message}`);
    }
    throw e;
  }
}

/** Logs the fields taken from a schema, the skipped properties and warnings. */
export function logSchemaFields(logger: logging.LoggerApi, source: string, result: SchemaFields): void {
  logger.info(`Fields from ${source}: ${stringifyFields(result.fields) || '(none)'}`);
  for (const skipped of result.skipped) {
    logger.info(`  skipped '${skipped.name}': ${skipped.reason}`);
  }
  for (const warning of result.warnings) {
    logger.warn(`  ${warning}`);
  }
}
