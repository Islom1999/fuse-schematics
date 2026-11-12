import * as ts from 'typescript';
/**
 * Pure source-transformation helpers used by fuse-feature to register a
 * generated feature in the host Fuse application (routes, navigation, i18n).
 * Every function is idempotent: running it twice yields the same output as
 * running it once.
 */
export interface SourceEditResult {
    content: string;
    changed: boolean;
    /** Set when the expected anchor could not be found; content is unchanged. */
    warning?: string;
}
/**
 * Locates the `children` array of the admin layout route: the route object
 * whose `resolve` contains `initialData`, or else the one whose children
 * contain `path: 'example'`.
 */
export declare function findAdminChildrenArray(sf: ts.SourceFile): ts.ArrayLiteralExpression | undefined;
/**
 * Adds `{ path, loadChildren: () => import(importPath) }` to the admin route
 * children in an `app.routes.ts` source.
 */
export declare function addLazyRoute(source: string, routePath: string, importPath: string, fileName?: string): SourceEditResult;
export declare const NAVIGATION_EXPORTS: string[];
export interface NavigationItem {
    id: string;
    title: string;
    icon: string;
    link: string;
    type?: string;
}
/**
 * Appends a `basic` navigation item to each of the Fuse navigation arrays
 * (default, compact, futuristic, horizontal) that does not already contain an
 * item with the same id.
 */
export declare function addNavigationItem(source: string, item: NavigationItem, fileName?: string): SourceEditResult;
export type TranslationTree = {
    [key: string]: string | TranslationTree;
};
/**
 * Merges `translations` into a JSON translation file, adding only missing
 * keys (existing values are never overwritten). A key counts as existing when
 * it is present either nested (`{"a":{"b":..}}`) or as a flat dotted key
 * (`{"a.b": ..}`). Keeps the file's indentation and trailing newline.
 */
export declare function mergeTranslations(jsonText: string, translations: TranslationTree): SourceEditResult;
/**
 * Computes the module specifier used in app.routes.ts for a feature's routes
 * file. Paths under `sourceRoot` become `baseUrl`-relative (`app/...`, the
 * Fuse convention); anything else becomes relative to the routes file.
 */
export declare function routesImportPath(sourceRoot: string, featureRoutesFile: string, appRoutesFile: string): string;
