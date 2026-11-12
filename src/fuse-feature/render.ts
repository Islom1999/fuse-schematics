import { strings } from '@angular-devkit/core';
import { FieldSpec, fieldKey } from '../utils/fields';
import { dasherizeName } from '../utils/openapi';
import { TranslationTree } from '../utils/registration';

/**
 * Turns parsed field definitions into the TypeScript snippets injected into
 * the fuse-feature templates. Output follows the starter's Prettier config
 * (no semicolons, single quotes, 2-space indent, trailing commas).
 */

/** Used when `--fields` is not given: keeps the historical single `name` field. */
export const DEFAULT_FIELDS: FieldSpec[] = [{ name: 'name', type: 'string', nullable: false }];

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

export function tsType(field: FieldSpec): string {
  switch (field.type) {
    case 'number':
    case 'int':
    case 'decimal':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'Date';
    case 'json':
      return 'Record<string, unknown>';
    case 'enum':
      return (field.enumValues || []).map(quote).join(' | ');
    case 'relation':
    case 'file':
      return field.many ? 'string[]' : 'string';
    default:
      return 'string';
  }
}

/** Single relation: the joined row the list endpoint returns next to `categoryId`. */
const isJoinedRelation = (field: FieldSpec) => field.type === 'relation' && !field.many;

/** Fields that can be shown as a grid column (the list endpoint joins single relations only). */
const isGridField = (field: FieldSpec) =>
  field.type !== 'json' && field.type !== 'file' && !(field.type === 'relation' && field.many);

/** Fields the table filter can search with a plain input / number / date / select. */
const isFilterField = (field: FieldSpec) => field.type !== 'json' && field.type !== 'file' && field.type !== 'relation';

/** `GET admin/<resource>/options` of a relation target (`SpYear` → `admin/sp-year/options`). */
export function relationEndpoint(field: FieldSpec): string {
  return `admin/${dasherizeName(field.target || field.name)}/options`;
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
  fields: FieldSpec[];
}

export function i18nPrefix(name: string): string {
  return `admin.${strings.camelize(name)}`;
}

/** Interface members (each line indented by 2 spaces, no trailing newline). */
export function renderModelMembers(fields: FieldSpec[], mode: 'entity' | 'create' | 'update'): string {
  const lines: string[] = [];
  for (const f of fields) {
    // List rows have no ManyToMany ids (only the detail does), so they are optional on the entity.
    const optional = mode === 'update' || f.nullable || (mode === 'entity' && f.many === true) ? '?' : '';
    lines.push(`${INDENT}${key(fieldKey(f))}${optional}: ${tsType(f)}`);
    if (mode === 'entity' && isJoinedRelation(f)) {
      lines.push(`${INDENT}${key(f.name)}?: Record<string, unknown>`);
    }
  }
  return lines.join('\n');
}

function defaultValue(field: FieldSpec): unknown {
  if (field.default === 'now' && field.type === 'date') {
    return raw('new Date()');
  }
  return field.default;
}

function formField(field: FieldSpec, prefix: string): Record<string, unknown> {
  const label = `${prefix}.fields.${field.name}`;
  const required = !field.nullable && field.type !== 'boolean' ? true : undefined;
  const k = fieldKey(field);
  const initial = defaultValue(field);

  switch (field.type) {
    case 'number':
    case 'int':
    case 'decimal': {
      const fraction = field.type === 'int' ? 0 : field.type === 'decimal' ? field.scale : undefined;
      return {
        key: k,
        type: 'input-number',
        defaultValue: initial,
        props: {
          label,
          required,
          minFractionDigits: field.type === 'decimal' ? fraction : undefined,
          maxFractionDigits: fraction,
          min: field.min,
          max: field.max,
          translate: true,
        },
      };
    }
    case 'text':
      return {
        key: k,
        type: 'textarea',
        defaultValue: initial,
        props: { label, required, rows: 4, minLength: field.min, maxLength: field.max ?? field.length, translate: true },
      };
    case 'json':
      return {
        key: k,
        type: 'json',
        defaultValue: initial,
        props: { label, required, rows: 6, translate: true },
      };
    case 'date':
      return {
        key: k,
        type: 'datepicker',
        defaultValue: initial,
        props: { label, required, showIcon: true, dateFormat: 'dd.mm.yy', translate: true },
      };
    case 'boolean':
      return { key: k, type: 'checkbox', defaultValue: initial ?? false, props: { label, translate: true } };
    case 'enum':
      return {
        key: k,
        type: 'select',
        defaultValue: initial,
        props: {
          label,
          required,
          options: (field.enumValues || []).map((v) => inline({ label: v, value: v })),
          translate: true,
        },
      };
    case 'relation':
      return {
        key: k,
        type: 'relation-select',
        props: {
          label,
          required: field.many ? undefined : required,
          endpoint: relationEndpoint(field),
          multiple: field.many === true,
          labelField: field.label,
          translate: true,
        },
      };
    case 'file':
      return {
        key: k,
        type: 'upload',
        props: { label, required: field.many ? undefined : required, kind: field.kind, multiple: field.many === true, translate: true },
      };
    default:
      return {
        key: k,
        type: 'input',
        defaultValue: initial,
        props: { label, required, minLength: field.min, maxLength: field.max ?? field.length, translate: true },
      };
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
    const k = fieldKey(f);
    const access = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? `data.${k}` : `data[${quote(k)}]`;
    obj[k] = raw(f.type === 'date' ? `${access} ? new Date(${access}) : undefined` : access);
  }
  return lit(obj, INDENT.repeat(2));
}

/** `IColumn[]` literal for the list component, base indent 2 spaces. */
export function renderColumns(ctx: RenderContext): string {
  const prefix = i18nPrefix(ctx.name);
  return lit(
    ctx.fields.filter(isGridField).map((f) => {
      const header = `${prefix}.fields.${f.name}`;
      if (f.type === 'relation') {
        // Shows `row.<name>[labelField]` (the joined row), or the id when the row is not joined.
        return { field: f.name, header, template: 'relation', labelField: f.label, sortable: false };
      }
      return { field: f.name, header, template: f.type === 'date' ? 'date' : undefined };
    }),
    INDENT
  );
}

function filterField(field: FieldSpec, prefix: string): Record<string, unknown> {
  // The `name` filter keeps its historical dedicated i18n keys.
  const label = field.name === 'name' ? `${prefix}.name` : `${prefix}.fields.${field.name}`;
  const placeholder = field.name === 'name' ? `${prefix}.namePlaceholder` : undefined;

  switch (field.type) {
    case 'number':
    case 'int':
    case 'decimal':
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
  const filterable = ctx.fields.filter(isFilterField);
  return lit(
    {
      columns: filterable.length > 1 ? 3 : 1,
      showResetButton: true,
      fields: filterable.map((f) => filterField(f, prefix)),
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
