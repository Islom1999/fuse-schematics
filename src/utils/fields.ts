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

export const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'text', 'enum'] as const;

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

export class FieldParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldParseError';
    Object.setPrototypeOf(this, FieldParseError.prototype);
  }
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const ENUM_VALUE = /^[A-Za-z0-9_$][A-Za-z0-9_$.\- ]*$/;
const ENUM_TYPE = /^enum\s*\(([\s\S]*)\)$/i;

/**
 * Splits `input` on commas that are not inside parentheses.
 */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of input) {
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth < 0) {
        throw new FieldParseError(`Unbalanced ")" in fields definition "${input}".`);
      }
    }

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (depth !== 0) {
    throw new FieldParseError(`Unbalanced "(" in fields definition "${input}".`);
  }
  parts.push(current);
  return parts;
}

function parseEntry(entry: string): FieldDefinition {
  const colon = entry.indexOf(':');
  let rawName = (colon === -1 ? entry : entry.slice(0, colon)).trim();
  let rawType = colon === -1 ? '' : entry.slice(colon + 1).trim();
  let required = true;

  if (rawName.endsWith('?')) {
    required = false;
    rawName = rawName.slice(0, -1).trim();
  }
  if (rawType.endsWith('?')) {
    required = false;
    rawType = rawType.slice(0, -1).trim();
  }

  if (!rawName) {
    throw new FieldParseError(`Missing field name in "${entry.trim()}".`);
  }
  if (!IDENTIFIER.test(rawName)) {
    throw new FieldParseError(
      `Invalid field name "${rawName}": use letters, digits, "_" or "$" and do not start with a digit.`
    );
  }
  if (colon !== -1 && !rawType) {
    throw new FieldParseError(`Missing type for field "${rawName}".`);
  }

  if (!rawType) {
    return { name: rawName, type: 'string', required };
  }

  const enumMatch = ENUM_TYPE.exec(rawType);
  if (enumMatch) {
    const values = enumMatch[1]
      .split('|')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (values.length === 0) {
      throw new FieldParseError(`Enum field "${rawName}" needs at least one value, e.g. enum(a|b).`);
    }
    for (const value of values) {
      if (!ENUM_VALUE.test(value)) {
        throw new FieldParseError(`Invalid enum value "${value}" for field "${rawName}".`);
      }
    }
    const duplicate = values.find((v, i) => values.indexOf(v) !== i);
    if (duplicate !== undefined) {
      throw new FieldParseError(`Duplicate enum value "${duplicate}" for field "${rawName}".`);
    }
    return { name: rawName, type: 'enum', required, enumValues: values };
  }

  const type = rawType.toLowerCase();
  if (type === 'enum') {
    throw new FieldParseError(
      `Enum field "${rawName}" needs values, e.g. ${rawName}:enum(active|blocked).`
    );
  }
  if (!(FIELD_TYPES as readonly string[]).includes(type)) {
    throw new FieldParseError(
      `Unknown type "${rawType}" for field "${rawName}". Supported types: ${FIELD_TYPES.join(', ')}.`
    );
  }

  return { name: rawName, type: type as FieldType, required };
}

/**
 * Parses a `--fields` definition string. Returns an empty array for an empty
 * or whitespace-only input. Throws {@link FieldParseError} on invalid input.
 */
export function parseFields(input: string | undefined | null): FieldDefinition[] {
  if (input === undefined || input === null || input.trim() === '') {
    return [];
  }

  const fields: FieldDefinition[] = [];
  const seen = new Set<string>();

  for (const entry of splitTopLevel(input)) {
    if (entry.trim() === '') {
      continue;
    }
    const field = parseEntry(entry);
    if (seen.has(field.name)) {
      throw new FieldParseError(`Duplicate field "${field.name}".`);
    }
    seen.add(field.name);
    fields.push(field);
  }

  return fields;
}

/**
 * Serialises field definitions back into the `--fields` syntax.
 * `parseFields(stringifyFields(x))` round-trips.
 */
export function stringifyFields(fields: FieldDefinition[]): string {
  return fields
    .map((f) => {
      const type = f.type === 'enum' ? `enum(${(f.enumValues || []).join('|')})` : f.type;
      return `${f.name}:${type}${f.required ? '' : '?'}`;
    })
    .join(',');
}
