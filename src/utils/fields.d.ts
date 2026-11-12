/**
 * Dependency-free parser for the `--fields` option shared by fuse-schematics
 * (and sibling generators that want the same syntax).
 *
 * Syntax: a comma-separated list of `name:type` entries.
 *
 *   name:string,price:number,active:boolean,note:text?,status:enum(active|blocked)
 *
 * - `type` is one of {@link FIELD_TYPES} (case-insensitive). When omitted
 *   (`name` or `name?`), it defaults to `string`.
 * - A trailing `?` on the type (`note:text?`) or on the name (`note?:text`)
 *   marks the field as not required.
 * - Enum values are listed in parentheses separated by `|`:
 *   `status:enum(active|blocked)`.
 * - Whitespace around tokens is ignored, empty entries (e.g. a trailing
 *   comma) are skipped.
 */
export declare const FIELD_TYPES: readonly ["string", "number", "boolean", "date", "text", "enum"];
export type FieldType = (typeof FIELD_TYPES)[number];
export interface FieldDefinition {
    /** Property name, a valid JavaScript identifier. */
    name: string;
    /** Normalised (lower-case) field type. */
    type: FieldType;
    /** `false` when the field was declared with a `?` suffix. */
    required: boolean;
    /** Allowed values, only present for `enum` fields. */
    enumValues?: string[];
}
export declare class FieldParseError extends Error {
    constructor(message: string);
}
/**
 * Parses a `--fields` definition string. Returns an empty array for an empty
 * or whitespace-only input. Throws {@link FieldParseError} on invalid input.
 */
export declare function parseFields(input: string | undefined | null): FieldDefinition[];
/**
 * Serialises field definitions back into the `--fields` syntax.
 * `parseFields(stringifyFields(x))` round-trips.
 */
export declare function stringifyFields(fields: FieldDefinition[]): string;
