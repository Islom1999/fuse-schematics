/**
 * OpenAPI fixtures shared by the openapi / fuse-feature / fuse-openapi specs.
 * (Named `*_spec` so they are excluded from the published package.)
 */
/**
 * The real `@nestjs/swagger` output of a nest-schematics API (global
 * prefix `api`), exported without a database (`NestFactory.create(ApiModule,
 * { preview: true })` + `SwaggerModule.createDocument`) after:
 *   nest-starter shop-api --apps api
 *   nest-crud kategoriya --fields "name:string,description:text?,sortOrder:number?,active:boolean"
 *   nest-crud mahsulot --fields "name:string,price:number,active:boolean,note:text?,status:enum(active|blocked),soldAt:date?,kategoriyaId:string?"
 *
 * Note how the nullable `text?` / `number?` / `string?` fields come out as
 * `{ "type": "object", "nullable": true }` (TypeScript reflects `T | null` as
 * Object).
 */
export declare const NEST_OPENAPI_FILE: string;
export declare function nestOpenApi(): any;
/** A Swagger 2.0 document without the `admin` anchor (`/products`, `/products/{id}`). */
export declare function swagger2Doc(): any;
