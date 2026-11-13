import * as fs from "fs";
import * as path from "path";

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
export const NEST_OPENAPI_FILE = path.join(__dirname, "openapi-nest_spec.json");

export function nestOpenApi(): any {
  return JSON.parse(fs.readFileSync(NEST_OPENAPI_FILE, "utf-8"));
}

/** A Swagger 2.0 document without the `admin` anchor (`/products`, `/products/{id}`). */
export function swagger2Doc(): any {
  return {
    swagger: "2.0",
    info: { title: "Petstore-ish", version: "1" },
    basePath: "/v1",
    paths: {
      "/products": {
        get: { responses: { "200": { description: "", schema: { type: "array", items: { $ref: "#/definitions/Product" } } } } },
        post: {
          parameters: [{ in: "body", name: "body", required: true, schema: { $ref: "#/definitions/NewProduct" } }],
          responses: { "201": { description: "", schema: { $ref: "#/definitions/Product" } } },
        },
      },
      "/products/{id}": {
        get: {
          parameters: [{ in: "path", name: "id", required: true, type: "string" }],
          responses: { "200": { description: "", schema: { $ref: "#/definitions/Product" } } },
        },
      },
      "/orders/{orderId}": {
        get: { responses: { "200": { description: "", schema: { $ref: "#/definitions/Order" } } } },
      },
      "/login": { post: { parameters: [], responses: { "200": { description: "" } } } },
    },
    definitions: {
      Audit: {
        type: "object",
        properties: {
          id: { type: "integer", readOnly: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      NewProduct: {
        type: "object",
        required: ["title", "price", "kind"],
        properties: {
          title: { type: "string" },
          price: { type: "number", format: "double" },
          stock: { type: "integer", format: "int32" },
          kind: { $ref: "#/definitions/ProductKind" },
          available: { type: "boolean", "x-nullable": true },
          releasedOn: { type: "string", format: "date" },
          body: { type: "string", maxLength: 5000 },
          tags: { type: "array", items: { type: "string" } },
          supplier: { $ref: "#/definitions/Supplier" },
        },
      },
      ProductKind: { type: "string", enum: ["physical", "digital"] },
      Supplier: { type: "object", properties: { name: { type: "string" } } },
      Product: {
        allOf: [{ $ref: "#/definitions/Audit" }, { $ref: "#/definitions/NewProduct" }],
      },
      Order: { type: "object", properties: { total: { type: "number" } } },
    },
  };
}
