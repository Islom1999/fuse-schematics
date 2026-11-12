export interface Schema {
  /** Add-on page: `users`, `api-logs`, `notifications`, `payments` or `ai`. */
  name: string;
  /** Directory the page folder is created in. Default: `<sourceRoot>/app/modules/admin`. */
  path?: string;
  /** angular.json project used to resolve sourceRoot. Default: first application. */
  project?: string;
  /** Overwrite page files that already exist. Default: existing files are kept. */
  force?: boolean;
  /** Do not register the route in app.routes.ts. */
  skipRoute?: boolean;
  /** Do not add the navigation item to navigation.ts. */
  skipNav?: boolean;
  /** Do not add i18n keys to assets/i18n/*.json. */
  skipI18n?: boolean;
}
