import { FieldSpec } from './fields';
export declare class OpenApiError extends Error {
    constructor(message: string);
}
/** Properties every backend entity has; never rendered as form fields. */
export declare const SYSTEM_PROPERTIES: readonly string[];
/** `format` values that turn a string into a multi-line `text` field. */
export declare const TEXT_FORMATS: readonly string[];
/** Strings longer than this are rendered as `text` (textarea). */
export declare const TEXT_MAX_LENGTH = 255;
/** Path segment the CRUD controllers live under (`admin/<name>`). */
export declare const DEFAULT_RESOURCE_ANCHOR = "admin";
export interface OpenApiDocument {
    /** `2` for Swagger 2.0, `3` for OpenAPI 3.x. */
    version: 2 | 3;
    /** Named schemas: `components.schemas` (3.x) or `definitions` (2.0). */
    schemas: Record<string, any>;
    /** The parsed document as given. */
    raw: any;
}
export interface SkippedProperty {
    name: string;
    reason: string;
}
export interface SchemaFields {
    fields: FieldSpec[];
    /** Properties that could not be mapped to a field (objects, arrays, ...). */
    skipped: SkippedProperty[];
    /** Properties that were mapped with a fallback (e.g. an invalid enum). */
    warnings: string[];
}
export interface OpenApiResource extends SchemaFields {
    /** Dasherized resource name, e.g. `mahsulot`, `user-profile`. */
    name: string;
    /**
     * Schema the fields came from: a schema name (`CreateMahsulotDto`) or a
     * description of an inline schema (`POST /api/admin/mahsulot (inline)`).
     */
    sourceSchema: string;
    /** Collection path of the resource, e.g. `/api/admin/mahsulot`. */
    path: string;
}
export interface UnresolvedResource {
    name: string;
    path: string;
    reason: string;
}
export interface DiscoverOptions {
    /** Path segment the resources live under. Default: `admin`. */
    anchor?: string;
    /** Called for each resource whose schema could not be determined. */
    onUnresolved?: (resource: UnresolvedResource) => void;
}
/**
 * Parses a JSON or YAML OpenAPI document. `source` is only used in error
 * messages.
 */
export declare function parseOpenApiText(text: string, source?: string): any;
/** Validates a parsed document and indexes its named schemas. */
export declare function loadOpenApiDocument(input: unknown): OpenApiDocument;
/** Names of all named schemas, in document order. */
export declare function listSchemaNames(doc: OpenApiDocument): string[];
/**
 * Finds a named schema: exact match first, then a case/punctuation
 * insensitive one (`create-mahsulot-dto` → `CreateMahsulotDto`).
 */
export declare function findSchemaName(doc: OpenApiDocument, name: string): string | undefined;
/** Resolves a local JSON pointer (`#/components/schemas/X`, `#/definitions/X`, ...). */
export declare function resolveRef(doc: OpenApiDocument, ref: string): any;
/** Last segment of a `$ref`, i.e. the schema name. */
export declare function refName(ref: string): string;
/**
 * Maps the properties of an object schema (a schema object, a `$ref`, or the
 * name of a named schema) to field definitions.
 */
export declare function schemaToFields(doc: OpenApiDocument, schemaOrName: any): SchemaFields;
/** Lower-cased alphanumerics only: `Create-Mahsulot_Dto` → `createmahsulotdto`. */
export declare function nameKey(value: string): string;
/**
 * Whether two resource / feature names refer to the same thing, ignoring
 * case, separators and a plural `s` (`UserProfile` ≈ `user-profiles`).
 */
export declare function namesMatch(a: string, b: string): boolean;
/** Same algorithm as `strings.dasherize` of @angular-devkit/core, plus sanitising. */
export declare function dasherizeName(value: string): string;
/** Named schema candidates for a resource, most specific first. */
export declare function schemaCandidates(doc: OpenApiDocument, resource: string): string[];
/**
 * Discovers the CRUD resources of a document.
 *
 * Paths are grouped by the segment after `admin` (`/admin/<name>`,
 * `/admin/<name>/{id}`, `/api/admin/<name>/pagination`, ... all belong to
 * `<name>`); a global prefix such as `/api` or `/api/v1` is ignored. When no
 * path contains `admin`, any collection path with a POST operation and a
 * sibling `/{param}` item path is a resource.
 *
 * The schema of a resource is, in order of preference: the POST request body
 * of the collection path (the Create DTO), the success response of
 * `GET <item path>`, or a named schema like the resource (`Create<Name>Dto`,
 * `<Name>`, `<Name>Dto`, `<Name>Entity`).
 */
export declare function discoverResources(doc: OpenApiDocument, options?: DiscoverOptions): OpenApiResource[];
/** The resource matching a feature name (see {@link namesMatch}). */
export declare function findResource(resources: OpenApiResource[], name: string): OpenApiResource | undefined;
