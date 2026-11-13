/**
 * OpenAPI 3.x / Swagger 2.0 → `FieldSpec[]`.
 *
 * Pure helpers (no Angular / schematics dependencies) used by the
 * `fuse-feature --openapi` option and the `fuse-openapi` schematic:
 *
 * - {@link parseOpenApiText} parses a JSON or YAML document;
 * - {@link loadOpenApiDocument} validates it and indexes its schemas;
 * - {@link schemaToFields} maps one schema (with `$ref`, `allOf`, `nullable`,
 *   `required` resolved) to field definitions;
 * - {@link discoverResources} finds the CRUD resources in `paths`
 *   (`/admin/<name>`, `/admin/<name>/{id}`, optionally behind a global prefix
 *   such as `/api`) and picks the schema of each one.
 *
 * Type mapping (first match wins):
 *
 * | OpenAPI property                                    | field type      |
 * | --------------------------------------------------- | --------------- |
 * | `enum` of strings                                   | `enum(a\|b)`    |
 * | `string` + `format: date` / `date-time`             | `date`          |
 * | `string` + `maxLength > 255` or `format: textarea`  | `text`          |
 * | `string` (any other format)                         | `string`        |
 * | `integer` / `number` (also numeric enums)           | `number`        |
 * | `boolean`                                           | `boolean`       |
 * | `type: object` without properties (NestJS `T\|null`) | inferred from   |
 * |   maxLength/format/minimum/example, else string if   | the keywords,   |
 * |   nullable (with a warning)                          | else skipped    |
 * | `x-relation` (`categoryId`, `tagIds`)                | `relation(T)` / |
 * |   (checked before the rows above)                   | `relation(T[])` |
 * | `x-file` (`imageId`, `docIds`)                      | `file(kind)` /  |
 * |                                                     | `file(kind)[]`  |
 * | `object`, `array`, `$ref` to an object, binary      | skipped         |
 *
 * `id`, `createdAt`, `updatedAt`, `deletedAt` and `readOnly` properties are
 * skipped. A field is optional when it is not listed in `required` or is
 * nullable (`nullable: true`, `x-nullable: true`, `type: [..., 'null']`, or an
 * `anyOf`/`oneOf` with a `null` branch).
 */
import { parse as parseYaml } from 'yaml';
import {
  FILE_KINDS,
  FieldSpec,
  FieldType,
  FileKind,
  classifyName,
  fieldKey,
  parseFields,
  stringifyFields,
} from './fields';

export class OpenApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenApiError';
    Object.setPrototypeOf(this, OpenApiError.prototype);
  }
}

/** Properties every backend entity has; never rendered as form fields. */
export const SYSTEM_PROPERTIES: readonly string[] = ['id', 'createdAt', 'updatedAt', 'deletedAt'];

/** `format` values that turn a string into a multi-line `text` field. */
export const TEXT_FORMATS: readonly string[] = ['textarea', 'text', 'multiline'];

/** Strings longer than this are rendered as `text` (textarea). */
export const TEXT_MAX_LENGTH = 255;

/** Path segment the CRUD controllers live under (`admin/<name>`). */
export const DEFAULT_RESOURCE_ANCHOR = 'admin';

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

// ───────────────────────── loading ─────────────────────────

/**
 * Parses a JSON or YAML OpenAPI document. `source` is only used in error
 * messages.
 */
export function parseOpenApiText(text: string, source = 'OpenAPI document'): any {
  const trimmed = text.replace(/^﻿/, '').trim();
  if (!trimmed) {
    throw new OpenApiError(`${source} is empty.`);
  }
  if (/^</.test(trimmed)) {
    throw new OpenApiError(
      `${source} is HTML, not an OpenAPI document (is it the Swagger UI page?). ` +
        'Point to the JSON endpoint instead, e.g. http://localhost:3000/docs/admin-json.'
    );
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new OpenApiError(`${source} is not valid JSON: ${(e as Error).message}`);
    }
  }
  try {
    return parseYaml(trimmed);
  } catch (e) {
    throw new OpenApiError(
      `${source} is neither valid JSON nor YAML: ${(e as Error).message}. Export the document as JSON and try again.`
    );
  }
}

/** Validates a parsed document and indexes its named schemas. */
export function loadOpenApiDocument(input: unknown): OpenApiDocument {
  if (!isObject(input)) {
    throw new OpenApiError('OpenAPI document must be a JSON object.');
  }
  const raw = input as any;
  if (typeof raw.openapi === 'string' && /^3\./.test(raw.openapi)) {
    const schemas = isObject(raw.components) && isObject(raw.components.schemas) ? raw.components.schemas : {};
    return { version: 3, schemas, raw };
  }
  if (raw.swagger === '2.0' || raw.swagger === 2) {
    return { version: 2, schemas: isObject(raw.definitions) ? raw.definitions : {}, raw };
  }
  throw new OpenApiError(
    'Unsupported document: expected an OpenAPI 3.x (`"openapi": "3.x.x"`) or Swagger 2.0 (`"swagger": "2.0"`) document.'
  );
}

/** Names of all named schemas, in document order. */
export function listSchemaNames(doc: OpenApiDocument): string[] {
  return Object.keys(doc.schemas);
}

/**
 * Finds a named schema: exact match first, then a case/punctuation
 * insensitive one (`create-mahsulot-dto` → `CreateMahsulotDto`).
 */
export function findSchemaName(doc: OpenApiDocument, name: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(doc.schemas, name)) {
    return name;
  }
  const wanted = nameKey(name);
  return listSchemaNames(doc).find((n) => nameKey(n) === wanted);
}

// ───────────────────────── $ref / allOf ─────────────────────────

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Resolves a local JSON pointer (`#/components/schemas/X`, `#/definitions/X`, ...). */
export function resolveRef(doc: OpenApiDocument, ref: string): any {
  if (typeof ref !== 'string' || !ref.startsWith('#')) {
    throw new OpenApiError(`External $ref "${ref}" is not supported; bundle the document into a single file.`);
  }
  const segments = ref
    .slice(1)
    .split('/')
    .filter((s) => s.length > 0)
    .map((s) => decodeURIComponent(s).replace(/~1/g, '/').replace(/~0/g, '~'));
  let node: any = doc.raw;
  for (const segment of segments) {
    if (!isObject(node) && !Array.isArray(node)) {
      node = undefined;
      break;
    }
    node = (node as any)[segment];
  }
  if (node === undefined) {
    throw new OpenApiError(`Cannot resolve $ref "${ref}".`);
  }
  return node;
}

/** Last segment of a `$ref`, i.e. the schema name. */
export function refName(ref: string): string {
  const parts = ref.split('/');
  return decodeURIComponent(parts[parts.length - 1]).replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Follows `$ref`s until a concrete schema is reached. */
function deref(doc: OpenApiDocument, schema: any, seen: Set<string> = new Set()): any {
  let current = schema;
  while (isObject(current) && typeof current.$ref === 'string') {
    if (seen.has(current.$ref)) {
      throw new OpenApiError(`Circular $ref "${current.$ref}".`);
    }
    seen.add(current.$ref);
    // Sibling keywords of $ref (allowed in 3.1) override the target.
    const { $ref, ...siblings } = current;
    const target = resolveRef(doc, $ref);
    current = Object.keys(siblings).length && isObject(target) ? { ...target, ...siblings } : target;
  }
  return current;
}

interface ObjectShape {
  properties: Record<string, any>;
  required: Set<string>;
}

/**
 * Flattens an object schema: resolves `$ref`s and merges `allOf` members
 * (properties and `required` lists) with the schema's own keywords.
 */
function flattenObject(doc: OpenApiDocument, schema: any, seen: Set<string> = new Set()): ObjectShape {
  const resolved = deref(doc, schema, new Set(seen));
  const shape: ObjectShape = { properties: {}, required: new Set() };
  if (!isObject(resolved)) {
    return shape;
  }
  const refKey = isObject(schema) && typeof schema.$ref === 'string' ? schema.$ref : undefined;
  const nextSeen = refKey ? new Set(seen).add(refKey) : seen;

  if (Array.isArray(resolved.allOf)) {
    for (const member of resolved.allOf) {
      if (isObject(member) && typeof member.$ref === 'string' && nextSeen.has(member.$ref)) {
        throw new OpenApiError(`Circular allOf $ref "${member.$ref}".`);
      }
      const sub = flattenObject(doc, member, nextSeen);
      Object.assign(shape.properties, sub.properties);
      sub.required.forEach((r) => shape.required.add(r));
    }
  }
  if (isObject(resolved.properties)) {
    Object.assign(shape.properties, resolved.properties);
  }
  if (Array.isArray(resolved.required)) {
    for (const r of resolved.required) {
      if (typeof r === 'string') {
        shape.required.add(r);
      }
    }
  }
  return shape;
}

// ───────────────────────── properties → fields ─────────────────────────

interface PropertyInfo {
  schema: any;
  nullable: boolean;
  readOnly: boolean;
  /** Name of the schema a `$ref` pointed to, if any. */
  refTarget?: string;
}

function isNullSchema(schema: any): boolean {
  return isObject(schema) && (schema.type === 'null' || (Array.isArray(schema.enum) && schema.enum.length === 1 && schema.enum[0] === null));
}

/**
 * Unwraps a property schema: follows `$ref`, single-member `allOf` (how
 * NestJS / OAS 3.0 attach `nullable` or a description to a `$ref`) and
 * nullable `anyOf`/`oneOf` unions, collecting `nullable` and `readOnly` along
 * the way.
 */
function unwrapProperty(doc: OpenApiDocument, property: any): PropertyInfo {
  let schema = property;
  let nullable = false;
  let readOnly = false;
  let refTarget: string | undefined;
  const seen = new Set<string>();

  for (let guard = 0; guard < 32 && isObject(schema); guard++) {
    nullable = nullable || schema.nullable === true || schema['x-nullable'] === true;
    readOnly = readOnly || schema.readOnly === true;

    if (typeof schema.$ref === 'string') {
      refTarget = refName(schema.$ref);
      const { $ref, ...siblings } = schema;
      if (seen.has($ref)) {
        throw new OpenApiError(`Circular $ref "${$ref}".`);
      }
      seen.add($ref);
      const target = resolveRef(doc, $ref);
      schema = isObject(target) ? { ...target, ...siblings } : target;
      continue;
    }
    if (Array.isArray(schema.allOf) && schema.allOf.length === 1 && !schema.properties) {
      const { allOf, ...siblings } = schema;
      const member = allOf[0];
      schema = isObject(member) && typeof member.$ref === 'string' ? { ...siblings, ...member } : { ...member, ...siblings };
      // Keep the $ref so it is followed (and named) on the next iteration.
      continue;
    }
    const union = Array.isArray(schema.anyOf) ? schema.anyOf : Array.isArray(schema.oneOf) ? schema.oneOf : undefined;
    if (union) {
      const nonNull = union.filter((s: any) => !isNullSchema(s));
      if (nonNull.length < union.length) {
        nullable = true;
      }
      if (nonNull.length === 1) {
        const { anyOf, oneOf, ...siblings } = schema;
        const member = nonNull[0];
        schema = isObject(member) && typeof member.$ref === 'string' ? { ...siblings, ...member } : { ...member, ...siblings };
        continue;
      }
    }
    break;
  }

  if (isObject(schema) && Array.isArray(schema.type) && schema.type.includes('null')) {
    nullable = true;
  }
  return { schema, nullable, readOnly, refTarget };
}

/** The (single, non-null) JSON type of a schema. */
function schemaType(schema: any): string | undefined {
  if (Array.isArray(schema.type)) {
    const types = schema.type.filter((t: unknown) => t !== 'null');
    return types.length === 1 ? types[0] : types.length > 1 ? 'union' : undefined;
  }
  if (typeof schema.type === 'string') {
    return schema.type;
  }
  if (Array.isArray(schema.enum)) {
    const values = schema.enum.filter((v: unknown) => v !== null);
    if (values.length && values.every((v: unknown) => typeof v === 'string')) return 'string';
    if (values.length && values.every((v: unknown) => typeof v === 'number')) return 'number';
    if (values.length && values.every((v: unknown) => typeof v === 'boolean')) return 'boolean';
  }
  if (isObject(schema.properties) || Array.isArray(schema.allOf) || schema.additionalProperties !== undefined) {
    return 'object';
  }
  if (schema.items !== undefined) {
    return 'array';
  }
  return undefined;
}

type Mapping = { type: FieldType; enumValues?: string[]; warning?: string } | { skip: string };

function mapString(schema: any, format: string | undefined): Mapping {
  if (format === 'binary' || format === 'byte') {
    return { skip: `binary string (format: ${format})` };
  }
  if (format === 'date' || format === 'date-time') {
    return { type: 'date' };
  }
  if ((format && TEXT_FORMATS.includes(format)) || (typeof schema.maxLength === 'number' && schema.maxLength > TEXT_MAX_LENGTH)) {
    return { type: 'text' };
  }
  return { type: 'string' };
}

/**
 * `type: object` without `properties` / `additionalProperties`: what
 * `@nestjs/swagger` emits for a `string | null` / `number | null` property
 * whose decorator has no explicit `type` (TypeScript reflects the union as
 * `Object`). The real type is inferred from type-specific keywords, `example`
 * / `default`, and — for a nullable property — defaults to string.
 */
function inferBareObject(schema: any, format: string | undefined, nullable: boolean): Mapping | undefined {
  const isBare =
    !isObject(schema.properties) &&
    schema.additionalProperties === undefined &&
    !Array.isArray(schema.allOf) &&
    !Array.isArray(schema.anyOf) &&
    !Array.isArray(schema.oneOf) &&
    schema.items === undefined;
  if (!isBare) return undefined;

  const sample = schema.example !== undefined && schema.example !== null ? schema.example : schema.default;
  let mapping: Mapping | undefined;
  if (format || ['maxLength', 'minLength', 'pattern'].some((k) => schema[k] !== undefined) || typeof sample === 'string') {
    mapping = mapString(schema, format);
  } else if (['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'].some((k) => schema[k] !== undefined) || typeof sample === 'number') {
    mapping = { type: 'number' };
  } else if (typeof sample === 'boolean') {
    mapping = { type: 'boolean' };
  } else if (nullable) {
    mapping = { type: 'string' };
  }
  if (!mapping || 'skip' in mapping) return mapping;
  return {
    ...mapping,
    warning:
      `declared as "type: object" without properties (NestJS reflects \`T | null\` as Object); ` +
      `generated as ${mapping.type}. Give the property an explicit type in @ApiProperty to make this exact.`,
  };
}

function mapSchema(schema: any, refTarget: string | undefined, nullable: boolean): Mapping {
  if (!isObject(schema)) {
    return { skip: 'no schema' };
  }
  const type = schemaType(schema);
  const format = typeof schema.format === 'string' ? schema.format.toLowerCase() : undefined;

  if (Array.isArray(schema.enum) && (type === 'string' || type === undefined)) {
    const values: string[] = [];
    for (const v of schema.enum) {
      if (v !== null && !values.includes(String(v))) values.push(String(v));
    }
    if (values.length) {
      return { type: 'enum', enumValues: values };
    }
  }

  switch (type) {
    case 'string':
      return mapString(schema, format);
    case 'integer':
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object':
      return inferBareObject(schema, format, nullable) ?? { skip: refTarget ? `object (${refTarget})` : 'object' };
    case 'array':
      return { skip: 'array' };
    case 'file':
      return { skip: 'file' };
    case 'union':
      return { skip: `union type (${(schema.type as string[]).join(' | ')})` };
    default:
      if (Array.isArray(schema.anyOf) || Array.isArray(schema.oneOf)) {
        return { skip: 'union (anyOf/oneOf)' };
      }
      return { skip: 'no type' };
  }
}

/** The `x-relation` / `x-file` object of a property (set on the property or on the schema it resolves to). */
function readExtension(property: any, resolved: any, key: 'x-relation' | 'x-file'): Record<string, any> | undefined {
  for (const schema of [property, resolved]) {
    if (isObject(schema) && isObject(schema[key])) return schema[key];
  }
  return undefined;
}

type Reference = { field: FieldSpec; warnings: string[] } | { skip: string };

/** `categoryId` → `category`, `tagIds` → `tag`; `undefined` when the property has no id suffix. */
function referenceName(property: string, many: boolean): string | undefined {
  const match = (many ? /^(.+)Ids$/ : /^(.+)Id$/).exec(property);
  return match ? match[1] : undefined;
}

/** Entity of an `x-relation`: its `entity`, else the segment before `/options` of its `endpoint`. */
function relationTarget(relation: Record<string, any>): string | undefined {
  if (typeof relation.entity === 'string' && relation.entity.trim()) return classifyName(relation.entity.trim());
  const segments = typeof relation.endpoint === 'string' ? relation.endpoint.split('/').filter(Boolean) : [];
  const resource = segments[segments.length - 1] === 'options' ? segments[segments.length - 2] : undefined;
  return resource ? classifyName(resource) : undefined;
}

/** Same field the backend spec `name:relation(Entity[])[:label(x)]` produces. */
function mapRelation(property: string, relation: Record<string, any>, optional: boolean): Reference {
  const many = relation.multiple === true;
  const name = referenceName(property, many);
  const target = relationTarget(relation);
  if (!name || !target) {
    return { skip: `x-relation without ${name ? 'entity' : `an ${many ? 'Ids' : 'Id'} suffix in the property name`}` };
  }
  const field: FieldSpec = { name, type: 'relation', nullable: optional, target, many };
  const warnings: string[] = [];
  if (typeof relation.label === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(relation.label.trim())) {
    field.label = relation.label.trim();
  }
  if (fieldKey(field) !== property) {
    return { skip: `x-relation key mismatch (the generator would use "${fieldKey(field)}")` };
  }
  if (!roundTrips(field)) {
    return { skip: `x-relation target "${target}" cannot be used in --fields` };
  }
  const expected = `admin/${dasherizeName(target)}/options`;
  if (typeof relation.endpoint === 'string' && relation.endpoint.replace(/^\/+|\/+$/g, '') !== expected) {
    warnings.push(
      `Property "${property}": x-relation endpoint "${relation.endpoint}" differs from "/${expected}"; the generated select uses "/${expected}".`
    );
  }
  return { field, warnings };
}

/** Same field the backend spec `name:file(kind)[]` produces. */
function mapFile(property: string, file: Record<string, any> | undefined, optional: boolean): Reference {
  const many = !!file && file.multiple === true;
  const name = referenceName(property, many);
  if (!name) {
    return { skip: `x-file without an ${many ? 'Ids' : 'Id'} suffix in the property name` };
  }
  const warnings: string[] = [];
  let kind: FileKind = 'other';
  const given = file && typeof file.kind === 'string' ? file.kind.toLowerCase() : undefined;
  if (given && FILE_KINDS.includes(given as FileKind)) {
    kind = given as FileKind;
  } else {
    warnings.push(`Property "${property}": x-file kind ${JSON.stringify(file && file.kind)} is not one of ${FILE_KINDS.join(', ')}; using "other".`);
  }
  const field: FieldSpec = { name, type: 'file', nullable: optional, kind, many };
  if (fieldKey(field) !== property) {
    return { skip: `x-file key mismatch (the generator would use "${fieldKey(field)}")` };
  }
  return { field, warnings };
}

/** `true` when `field` survives `stringifyFields` → `parseFields`. */
function roundTrips(field: FieldSpec): boolean {
  try {
    const [parsed] = parseFields(stringifyFields([field]));
    return (
      !!parsed &&
      parsed.type === field.type &&
      JSON.stringify(parsed.enumValues) === JSON.stringify(field.enumValues)
    );
  } catch {
    return false;
  }
}

/**
 * Maps the properties of an object schema (a schema object, a `$ref`, or the
 * name of a named schema) to field definitions.
 */
export function schemaToFields(doc: OpenApiDocument, schemaOrName: any): SchemaFields {
  let schema = schemaOrName;
  if (typeof schemaOrName === 'string') {
    const name = findSchemaName(doc, schemaOrName);
    if (!name) {
      throw new OpenApiError(`Schema "${schemaOrName}" not found.`);
    }
    schema = { $ref: pointerTo(doc, name) };
  }

  const shape = flattenObject(doc, schema);
  const result: SchemaFields = { fields: [], skipped: [], warnings: [] };

  for (const name of Object.keys(shape.properties)) {
    if (SYSTEM_PROPERTIES.includes(name)) {
      result.skipped.push({ name, reason: 'system field' });
      continue;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      result.skipped.push({ name, reason: 'not a valid identifier' });
      continue;
    }

    let info: PropertyInfo;
    try {
      info = unwrapProperty(doc, shape.properties[name]);
    } catch (e) {
      result.skipped.push({ name, reason: (e as Error).message });
      continue;
    }
    if (info.readOnly) {
      result.skipped.push({ name, reason: 'readOnly' });
      continue;
    }

    const optional = !shape.required.has(name) || info.nullable;

    const relation = readExtension(shape.properties[name], info.schema, 'x-relation');
    const file = readExtension(shape.properties[name], info.schema, 'x-file');
    if (relation || file) {
      const reference = relation ? mapRelation(name, relation, optional) : mapFile(name, file, optional);
      if ('skip' in reference) {
        result.skipped.push({ name, reason: reference.skip });
      } else {
        result.fields.push(reference.field);
        result.warnings.push(...reference.warnings);
      }
      continue;
    }

    const mapping = mapSchema(info.schema, info.refTarget, info.nullable);
    if ('skip' in mapping) {
      result.skipped.push({ name, reason: mapping.skip });
      continue;
    }

    let field: FieldSpec = { name, type: mapping.type, nullable: optional };
    if (mapping.enumValues) {
      field.enumValues = mapping.enumValues;
    }
    if (mapping.warning) {
      result.warnings.push(`Property "${name}" ${mapping.warning}`);
    }
    if (!roundTrips(field)) {
      result.warnings.push(
        `Property "${name}": enum values ${JSON.stringify(mapping.enumValues)} cannot be used in --fields; generated as a string field.`
      );
      field = { name, type: 'string', nullable: field.nullable };
    }
    result.fields.push(field);
  }

  return result;
}

function escapePointer(name: string): string {
  return name.replace(/~/g, '~0').replace(/\//g, '~1');
}

// ───────────────────────── resource discovery ─────────────────────────


/** Lower-cased alphanumerics only: `Create-Mahsulot_Dto` → `createmahsulotdto`. */
export function nameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function singular(key: string): string {
  if (key.endsWith('ies') && key.length > 4) return `${key.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(key)) return key.slice(0, -2);
  if (key.endsWith('s') && !key.endsWith('ss') && key.length > 3) return key.slice(0, -1);
  return key;
}

/**
 * Whether two resource / feature names refer to the same thing, ignoring
 * case, separators and a plural `s` (`UserProfile` ≈ `user-profiles`).
 */
export function namesMatch(a: string, b: string): boolean {
  const ka = nameKey(a);
  const kb = nameKey(b);
  return ka === kb || singular(ka) === singular(kb);
}

/** Same algorithm as `strings.dasherize` of @angular-devkit/core, plus sanitising. */
export function dasherizeName(value: string): string {
  return value
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const isParam = (segment: string) => /^\{.*\}$/.test(segment) || segment.startsWith(':');

interface ResourcePaths {
  name: string;
  /** Collection path (`/api/admin/mahsulot`). */
  collection: string;
  /** Item path (`/api/admin/mahsulot/{id}`), if any. */
  item?: string;
}

/** Groups `paths` into resources; see {@link discoverResources}. */
function groupResourcePaths(paths: Record<string, any>, anchor: string): ResourcePaths[] {
  const byName = new Map<string, ResourcePaths>();
  const anchorKey = anchor.toLowerCase();

  const add = (rawName: string, collection: string, item: string | undefined) => {
    const name = dasherizeName(rawName);
    if (!/^[a-z]/.test(name)) return;
    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, { name, collection, item });
    } else if (existing.collection === collection && !existing.item && item) {
      existing.item = item;
    }
  };

  const entries = Object.keys(paths).map((p) => ({
    path: p,
    segments: p.split('/').filter((s) => s.length > 0),
  }));

  // 1. Anchored: `<prefix>/admin/<name>[/...]`.
  for (const { path, segments } of entries) {
    const i = segments.findIndex((s) => s.toLowerCase() === anchorKey);
    if (i === -1 || i + 1 >= segments.length || isParam(segments[i + 1])) continue;
    const rest = segments.slice(i + 2);
    const item = rest.length === 1 && isParam(rest[0]) ? path : undefined;
    add(segments[i + 1], `/${segments.slice(0, i + 2).join('/')}`, item);
  }
  if (byName.size > 0) {
    return Array.from(byName.values());
  }

  // 2. No anchor in the document: a collection `X` with POST plus an item `X/{param}`.
  const known = new Set(Object.keys(paths));
  for (const { path, segments } of entries) {
    if (segments.length < 2 || !isParam(segments[segments.length - 1]) || isParam(segments[segments.length - 2])) {
      continue;
    }
    const collection = `/${segments.slice(0, -1).join('/')}`;
    const ops = known.has(collection) ? paths[collection] : undefined;
    if (isObject(ops) && isObject(ops.post)) {
      add(segments[segments.length - 2], collection, path);
    }
  }
  return Array.from(byName.values());
}

function operation(doc: OpenApiDocument, path: string | undefined, method: string): any | undefined {
  if (!path) return undefined;
  const item = doc.raw.paths && doc.raw.paths[path];
  if (!isObject(item)) return undefined;
  const op = item[method];
  return isObject(op) ? op : undefined;
}

/** Picks the JSON-ish schema out of an OAS 3 `content` map. */
function contentSchema(content: any): any | undefined {
  if (!isObject(content)) return undefined;
  const types = Object.keys(content);
  const preferred =
    types.find((t) => t.toLowerCase() === 'application/json') ??
    types.find((t) => /json/i.test(t)) ??
    types[0];
  return preferred && isObject(content[preferred]) ? content[preferred].schema : undefined;
}

function requestBodySchema(doc: OpenApiDocument, op: any): any | undefined {
  if (!op) return undefined;
  if (doc.version === 3) {
    const body = deref(doc, op.requestBody);
    return isObject(body) ? contentSchema(body.content) : undefined;
  }
  const params: any[] = Array.isArray(op.parameters) ? op.parameters : [];
  const body = params.map((p) => deref(doc, p)).find((p) => isObject(p) && p.in === 'body');
  return body ? body.schema : undefined;
}

function successResponseSchema(doc: OpenApiDocument, op: any): any | undefined {
  if (!op || !isObject(op.responses)) return undefined;
  const codes = Object.keys(op.responses);
  const code = codes.find((c) => c === '200') ?? codes.find((c) => /^2\d\d$/.test(c)) ?? codes.find((c) => c === 'default');
  if (!code) return undefined;
  const response = deref(doc, op.responses[code]);
  if (!isObject(response)) return undefined;
  return doc.version === 3 ? contentSchema(response.content) : response.schema;
}

/** Whether a schema describes an object with properties (after `$ref`/`allOf`). */
function hasObjectProperties(doc: OpenApiDocument, schema: any): boolean {
  if (!schema) return false;
  try {
    return Object.keys(flattenObject(doc, schema).properties).length > 0;
  } catch {
    return false;
  }
}

function describeSchema(schema: any, fallback: string): string {
  return isObject(schema) && typeof schema.$ref === 'string' ? refName(schema.$ref) : `${fallback} (inline)`;
}

/** Named schema candidates for a resource, most specific first. */
export function schemaCandidates(doc: OpenApiDocument, resource: string): string[] {
  const keys = Array.from(new Set([nameKey(resource), singular(nameKey(resource))]));
  const wanted: string[] = [];
  for (const k of keys) wanted.push(`create${k}dto`, `create${k}`);
  for (const k of keys) wanted.push(k, `${k}dto`, `${k}entity`, `${k}model`);
  const names = listSchemaNames(doc);
  const result: string[] = [];
  for (const w of wanted) {
    const match = names.find((n) => nameKey(n) === w);
    if (match && !result.includes(match)) result.push(match);
  }
  return result;
}

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
export function discoverResources(doc: OpenApiDocument, options: DiscoverOptions = {}): OpenApiResource[] {
  const paths = isObject(doc.raw.paths) ? doc.raw.paths : {};
  const groups = groupResourcePaths(paths, options.anchor || DEFAULT_RESOURCE_ANCHOR);
  const resources: OpenApiResource[] = [];

  for (const group of groups) {
    let schema: any;
    let sourceSchema: string | undefined;

    const createSchema = requestBodySchema(doc, operation(doc, group.collection, 'post'));
    if (hasObjectProperties(doc, createSchema)) {
      schema = createSchema;
      sourceSchema = describeSchema(createSchema, `POST ${group.collection}`);
    } else {
      const itemSchema = successResponseSchema(doc, operation(doc, group.item, 'get'));
      if (hasObjectProperties(doc, itemSchema)) {
        schema = itemSchema;
        sourceSchema = describeSchema(itemSchema, `GET ${group.item}`);
      } else {
        const named = schemaCandidates(doc, group.name).find((n) => hasObjectProperties(doc, { $ref: pointerTo(doc, n) }));
        if (named) {
          schema = { $ref: pointerTo(doc, named) };
          sourceSchema = named;
        }
      }
    }

    if (!schema || !sourceSchema) {
      options.onUnresolved?.({
        name: group.name,
        path: group.collection,
        reason: 'no POST request body, GET-by-id response or schema named like the resource',
      });
      continue;
    }

    resources.push({ name: group.name, path: group.collection, sourceSchema, ...schemaToFields(doc, schema) });
  }

  return resources;
}

function pointerTo(doc: OpenApiDocument, schemaName: string): string {
  return `${doc.version === 3 ? '#/components/schemas/' : '#/definitions/'}${escapePointer(schemaName)}`;
}

/** The resource matching a feature name (see {@link namesMatch}). */
export function findResource(resources: OpenApiResource[], name: string): OpenApiResource | undefined {
  return resources.find((r) => nameKey(r.name) === nameKey(name)) ?? resources.find((r) => namesMatch(r.name, name));
}
