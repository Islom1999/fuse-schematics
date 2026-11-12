export interface Schema {
  /** Feature name (e.g. `sp-year`, `user-management`). */
  name: string;
  /** Directory the feature folder is created in. Default: `<sourceRoot>/app/modules/admin`. */
  path?: string;
  /** angular.json project used to resolve sourceRoot. Default: first application. */
  project?: string;
  /** Component selector prefix. Default: `app`. */
  prefix?: string;
  /** Field list, e.g. `name:string,price:number,note:text?,status:enum(a|b)`. */
  fields?: string;
  /** OpenAPI/Swagger document (path relative to the workspace root, or http(s) URL) to read fields from. */
  openapi?: string;
  /** Schema of `openapi` to read fields from. Default: the resource matching `name`. */
  schema?: string;
  /** Skip form component generation. */
  skipForm?: boolean;
  /** Do not register the route in app.routes.ts. */
  skipRoute?: boolean;
  /** Do not add the navigation item to navigation.ts. */
  skipNav?: boolean;
  /** Do not add i18n keys to assets/i18n/*.json. */
  skipI18n?: boolean;
}
