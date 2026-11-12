import { strings } from '@angular-devkit/core';
import { FieldDefinition } from '../utils/fields';
import { TranslationTree } from '../utils/registration';

/**
 * Turns parsed field definitions into the TypeScript snippets injected into
 * the fuse-feature templates. Output follows the starter's Prettier config
 * (no semicolons, single quotes, 2-space indent, trailing commas).
 */

/** Used when `--fields` is not given: keeps the historical single `name` field. */
export const DEFAULT_FIELDS: FieldDefinition[] = [{ name: 'name', type: 'string', required: true }];

const PRINT_WIDTH = 100;
const INDENT = '  ';

class Raw {
  constructor(readonly code: string) {}
}
class Inline {
  constructor(readonly value: Record<string, unknown>) {}
}

const raw = (code: string) => new Raw(code);
const inline = (value: Record<string, unknown>) => new Inline(value);

function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function key(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : quote(name);
}

function entries(obj: Record<string, unknown>): [string, unknown][] {
  return Object.entries(obj).filter(([, v]) => v !== undefined);
}

/**
 * Serialises a value as a TypeScript literal. The first line is not indented;
 * `column` is the number of characters already on that line (used to decide
 * whether a short array fits on one line, like Prettier would).
 */
function lit(value: unknown, indent: string, column = indent.length): string {
  if (value instanceof Raw) {
    return value.code;
  }
  if (typeof value === 'string') {
    return quote(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Inline) {
    const body = entries(value.value)
      .map(([k, v]) => `${key(k)}: ${lit(v, indent)}`)
      .join(', ');
    return `{ ${body} }`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const simple = value.every(
      (v) => !(v !== null && typeof v === 'object') || v instanceof Inline || v instanceof Raw
    );
    // Prettier always breaks arrays of 2+ objects that each have 2+ keys.
    const objectMatrix =
      value.length > 1 && value.every((v) => v instanceof Inline && entries(v.value).length > 1);
    if (simple && !objectMatrix) {
      const oneLine = `[${value.map((v) => lit(v, indent)).join(', ')}]`;
      // +1 for the trailing comma that follows every property/element.
      if (column + oneLine.length + 1 <= PRINT_WIDTH) {
        return oneLine;
      }
    }
    const inner = indent + INDENT;
    return `[\n${value.map((v) => `${inner}${lit(v, inner)},`).join('\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const inner = indent + INDENT;
    const body = entries(value as Record<string, unknown>)
      .map(([k, v]) => `${inner}${key(k)}: ${lit(v, inner, inner.length + key(k).length + 2)},`)
      .join('\n');
    return `{\n${body}\n${indent}}`;
  }
  return 'undefined';
}

export function tsType(field: FieldDefinition): string {
  switch (field.type) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'Date';
    case 'enum':
      return (field.enumValues || []).map(quote).join(' | ');
    default:
      return 'string';
  }
}

/** Human readable label: `createdAt` / `created-at` → `Created at`. */
export function humanize(value: string): string {
  const words = strings
    .dasherize(value)
    .split(/[-_\s]+/)
    .filter(Boolean);
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Title-cased name: `user-profile` → `User Profile`. */
export function titleCase(value: string): string {
  return strings
    .dasherize(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface RenderContext {
  /** Feature name as given on the command line. */
  name: string;
  fields: FieldDefinition[];
}

export function i18nPrefix(name: string): string {
  return `admin.${strings.camelize(name)}`;
}

/** Interface members (each line indented by 2 spaces, no trailing newline). */
export function renderModelMembers(fields: FieldDefinition[], mode: 'entity' | 'create' | 'update'): string {
  return fields
    .map((f) => {
      const optional = mode === 'update' || !f.required ? '?' : '';
      return `${INDENT}${key(f.name)}${optional}: ${tsType(f)}`;
    })
    .join('\n');
}

function formField(field: FieldDefinition, prefix: string): Record<string, unknown> {
  const label = `${prefix}.fields.${field.name}`;
  const required = field.required && field.type !== 'boolean' ? true : undefined;

  switch (field.type) {
    case 'number':
      return { key: field.name, type: 'input-number', props: { label, required, translate: true } };
    case 'text':
      return { key: field.name, type: 'textarea', props: { label, required, rows: 4, translate: true } };
    case 'date':
      return {
        key: field.name,
        type: 'datepicker',
        props: { label, required, showIcon: true, dateFormat: 'dd.mm.yy', translate: true },
      };
    case 'boolean':
      return { key: field.name, type: 'checkbox', defaultValue: false, props: { label, translate: true } };
    case 'enum':
      return {
        key: field.name,
        type: 'select',
        props: {
          label,
          required,
          options: (field.enumValues || []).map((v) => inline({ label: v, value: v })),
          translate: true,
        },
      };
    default:
      return { key: field.name, type: 'input', props: { label, required, translate: true } };
  }
}

/** `[ ...formly field configs... ]` for the form component, base indent 4 spaces. */
export function renderFormFields(ctx: RenderContext): string {
  const prefix = i18nPrefix(ctx.name);
  return lit(
    ctx.fields.map((f) => formField(f, prefix)),
    INDENT.repeat(2)
  );
}

/** Object literal returned by `mapToModel(data)`, base indent 4 spaces. */
export function renderMapToModel(ctx: RenderContext): string {
  const obj: Record<string, unknown> = {};
  for (const f of ctx.fields) {
    const access = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(f.name) ? `data.${f.name}` : `data[${quote(f.name)}]`;
    obj[f.name] = raw(f.type === 'date' ? `${access} ? new Date(${access}) : undefined` : access);
  }
  return lit(obj, INDENT.repeat(2));
}

/** `IColumn[]` literal for the list component, base indent 2 spaces. */
export function renderColumns(ctx: RenderContext): string {
  const prefix = i18nPrefix(ctx.name);
  return lit(
    ctx.fields.map((f) => ({
      field: f.name,
      header: `${prefix}.fields.${f.name}`,
      template: f.type === 'date' ? 'date' : undefined,
    })),
    INDENT
  );
}

function filterField(field: FieldDefinition, prefix: string): Record<string, unknown> {
  // The `name` filter keeps its historical dedicated i18n keys.
  const label = field.name === 'name' ? `${prefix}.name` : `${prefix}.fields.${field.name}`;
  const placeholder = field.name === 'name' ? `${prefix}.namePlaceholder` : undefined;

  switch (field.type) {
    case 'number':
      return { key: field.name, type: 'number', label, placeholder, props: inline({ translate: true }) };
    case 'date':
      return { key: field.name, type: 'date', label, placeholder, props: inline({ translate: true }) };
    case 'boolean':
      return {
        key: field.name,
        type: 'select',
        label,
        placeholder,
        options: [
          inline({ label: 'admin.grid.filter.yes', value: true }),
          inline({ label: 'admin.grid.filter.no', value: false }),
        ],
        props: inline({ translate: true, translateSelectOptions: true }),
      };
    case 'enum':
      return {
        key: field.name,
        type: 'select',
        label,
        placeholder,
        options: (field.enumValues || []).map((v) => inline({ label: v, value: v })),
        props: inline({ translate: true }),
      };
    default:
      return { key: field.name, type: 'input', label, placeholder, props: inline({ translate: true }) };
  }
}

/** `ITableFilterConfig` literal for the list component, base indent 2 spaces. */
export function renderFilterConfig(ctx: RenderContext): string {
  const prefix = i18nPrefix(ctx.name);
  return lit(
    {
      columns: ctx.fields.length > 1 ? 3 : 1,
      showResetButton: true,
      fields: ctx.fields.map((f) => filterField(f, prefix)),
    },
    INDENT
  );
}

/** Translation keys used by the generated templates. */
export function buildTranslations(ctx: RenderContext): TranslationTree {
  const title = titleCase(ctx.name);
  const fields: TranslationTree = {};
  for (const f of ctx.fields) {
    fields[f.name] = humanize(f.name);
  }
  const admin: TranslationTree = {
    [strings.camelize(ctx.name)]: {
      title,
      addNew: 'Add new',
      create: `Create ${title}`,
      edit: `Edit ${title}`,
      name: 'Name',
      namePlaceholder: 'Search by name',
      fields,
    },
  };
  // Shared labels of the yes/no select used by boolean table filters.
  if (ctx.fields.some((f) => f.type === 'boolean')) {
    admin['grid'] = { filter: { yes: 'Yes', no: 'No' } };
  }
  return { admin };
}
