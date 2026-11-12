/**
 * `--fields` spec parser. Shared syntax for the backend (nest-schematics)
 * and the frontend (fuse-schematics), so it has no Nest/Angular dependencies.
 * Copy it with `node scripts/sync-fields.mjs <dir>`; both packages test it
 * against the same examples (`fields-contract.json`).
 *
 *   "name:string:unique,price:decimal(12,2):default(0),category:relation(Category),tags:relation(Tag[])?"
 *
 * - entries are comma-separated `name:type[:modifier...]` (commas inside `(...)` do not split)
 * - a trailing `?` makes the field nullable/optional; a missing type is `string`
 * - types: string | string(N) | text | int | number | decimal(p,s) | boolean | date | json
 *          | enum(a|b) | relation(Entity) | relation(Entity[]) | file(kind) | file(kind)[]
 * - modifiers: unique | index | default(v) | min(n) | max(n) | cascade | set-null | label(field)
 */
export type FieldType = 'string' | 'text' | 'int' | 'number' | 'decimal' | 'boolean' | 'date' | 'json' | 'enum' | 'relation' | 'file';
export type FileKind = 'image' | 'video' | 'audio' | 'pdf' | 'other';
export type FieldDefault = string | number | boolean | Record<string, unknown> | unknown[];
export interface FieldSpec {
    /** Property name as written (camelCase recommended), e.g. `fullName`. */
    name: string;
    type: FieldType;
    nullable: boolean;
    /** `enum` only. */
    enumValues?: string[];
    /** `string(N)` only: varchar length. */
    length?: number;
    /** `decimal(p,s)` only (`decimal` alone = 12,2). */
    precision?: number;
    scale?: number;
    /** `relation` only: target entity class, e.g. `Category`. */
    target?: string;
    /** `file` only. */
    kind?: FileKind;
    /** `relation` and `file`: `Entity[]` / `kind[]` = many (ManyToMany). */
    many?: boolean;
    unique?: boolean;
    index?: boolean;
    /** Typed by field type: boolean, number, string, `'now'` (date) or JSON (json). */
    default?: FieldDefault;
    /** String/text length, number range, or item count for many relations/files. */
    min?: number;
    max?: number;
    /** Single relation/file only; default: set-null when nullable, restrict otherwise. */
    onDelete?: 'cascade' | 'set-null';
    /** `relation` only: display field of the target (default: name, title or id). */
    label?: string;
}
export declare const FIELD_TYPES: readonly FieldType[];
export declare const FILE_KINDS: readonly FileKind[];
export declare const FIELD_MODIFIERS: readonly string[];
/** Columns every entity already has (BaseEntity). */
export declare const RESERVED_FIELD_NAMES: readonly string[];
export declare const DEFAULT_DECIMAL: {
    readonly precision: 12;
    readonly scale: 2;
};
export declare const MAX_VARCHAR = 10485760;
export declare class FieldSpecError extends Error {
    constructor(message: string);
}
/** `category` / `sp-year` / `SpYear` → `Category` / `SpYear` / `SpYear`. */
export declare function classifyName(name: string): string;
/** Naive singular for id keys: `tags` → `tag`, `categories` → `category`, `news` stays. */
export declare function singular(name: string): string;
/**
 * Property the DTO / form / JSON uses for a field: `category` → `categoryId`,
 * `tags` (many) → `tagIds`, `image:file(image)` → `imageId`, anything else → its name.
 */
export declare function fieldKey(f: Pick<FieldSpec, 'name' | 'type' | 'many'>): string;
export declare function parseFields(spec: string | undefined | null): FieldSpec[];
/** One field in normalised `name:type[:modifier...][?]` form. */
export declare function stringifyField(f: FieldSpec): string;
/** Inverse of `parseFields` (normalised form): `parseFields(stringifyFields(x))` equals `x`. */
export declare function stringifyFields(fields: FieldSpec[]): string;
