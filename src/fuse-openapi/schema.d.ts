export interface Schema {
  /** OpenAPI 3.x / Swagger 2.0 document: path relative to the workspace root, or http(s) URL. */
  openapi: string;
  /** Comma-separated resource names to generate. Default: all. */
  include?: string;
  /** Comma-separated resource names to leave out. */
  exclude?: string;
  /** Directory the feature folders are created in. Default: `<sourceRoot>/app/modules/admin`. */
  path?: string;
  /** angular.json project used to resolve sourceRoot. Default: first application. */
  project?: string;
  /** Component selector prefix. Default: `app`. */
  prefix?: string;
  /** Overwrite features whose folder already exists (default: skip them). */
  force?: boolean;
  /** Skip form component generation. */
  skipForm?: boolean;
  /** Do not register the routes in app.routes.ts. */
  skipRoute?: boolean;
  /** Do not add navigation items to navigation.ts. */
  skipNav?: boolean;
  /** Do not add i18n keys to assets/i18n/*.json. */
  skipI18n?: boolean;
}
