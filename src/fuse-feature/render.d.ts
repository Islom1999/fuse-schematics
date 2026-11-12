import { FieldSpec } from '../utils/fields';
import { TranslationTree } from '../utils/registration';
/**
 * Turns parsed field definitions into the TypeScript snippets injected into
 * the fuse-feature templates. Output follows the starter's Prettier config
 * (no semicolons, single quotes, 2-space indent, trailing commas).
 */
/** Used when `--fields` is not given: keeps the historical single `name` field. */
export declare const DEFAULT_FIELDS: FieldSpec[];
export declare function tsType(field: FieldSpec): string;
/** `GET admin/<resource>/options` of a relation target (`SpYear` → `admin/sp-year/options`). */
export declare function relationEndpoint(field: FieldSpec): string;
/** Human readable label: `createdAt` / `created-at` → `Created at`. */
export declare function humanize(value: string): string;
/** Title-cased name: `user-profile` → `User Profile`. */
export declare function titleCase(value: string): string;
export interface RenderContext {
    /** Feature name as given on the command line. */
    name: string;
    fields: FieldSpec[];
}
export declare function i18nPrefix(name: string): string;
/** Interface members (each line indented by 2 spaces, no trailing newline). */
export declare function renderModelMembers(fields: FieldSpec[], mode: 'entity' | 'create' | 'update'): string;
/** `[ ...formly field configs... ]` for the form component, base indent 4 spaces. */
export declare function renderFormFields(ctx: RenderContext): string;
/** Object literal returned by `mapToModel(data)`, base indent 4 spaces. */
export declare function renderMapToModel(ctx: RenderContext): string;
/** `IColumn[]` literal for the list component, base indent 2 spaces. */
export declare function renderColumns(ctx: RenderContext): string;
/** `ITableFilterConfig` literal for the list component, base indent 2 spaces. */
export declare function renderFilterConfig(ctx: RenderContext): string;
/** Translation keys used by the generated templates. */
export declare function buildTranslations(ctx: RenderContext): TranslationTree;
