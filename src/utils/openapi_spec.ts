import { parseFields, stringifyFields } from "./fields";
import {
  OpenApiError,
  dasherizeName,
  discoverResources,
  findResource,
  findSchemaName,
  loadOpenApiDocument,
  namesMatch,
  parseOpenApiText,
  schemaCandidates,
  schemaToFields,
} from "./openapi";
import { nestOpenApi, swagger2Doc } from "./openapi-fixtures_spec";

function oas3(schemas: Record<string, any>, paths: Record<string, any> = {}): any {
  return { openapi: "3.0.3", info: { title: "t", version: "1" }, paths, components: { schemas } };
}

describe("openapi: loading", () => {
  it("accepts OpenAPI 3.x and Swagger 2.0 documents and indexes their schemas", () => {
    const v3 = loadOpenApiDocument(nestOpenApi());
    expect(v3.version).toBe(3);
    expect(Object.keys(v3.schemas)).toContain("CreateMahsulotDto");

    const v2 = loadOpenApiDocument(swagger2Doc());
    expect(v2.version).toBe(2);
    expect(Object.keys(v2.schemas)).toContain("NewProduct");

    expect(loadOpenApiDocument({ openapi: "3.1.0", paths: {} }).schemas).toEqual({});
  });

  it("rejects anything else", () => {
    expect(() => loadOpenApiDocument({ swagger: "1.2" })).toThrowError(OpenApiError, /Unsupported document/);
    expect(() => loadOpenApiDocument([])).toThrowError(OpenApiError, /JSON object/);
    expect(() => loadOpenApiDocument("x")).toThrowError(OpenApiError);
  });

  it("parses JSON and YAML text", () => {
    expect(parseOpenApiText('{"openapi":"3.0.0"}')).toEqual({ openapi: "3.0.0" });
    const yaml = [
      "openapi: 3.0.0",
      "components:",
      "  schemas:",
      "    Tag:",
      "      type: object",
      "      required: [name]",
      "      properties:",
      "        name: { type: string }",
    ].join("\n");
    const doc = loadOpenApiDocument(parseOpenApiText(yaml));
    expect(schemaToFields(doc, "Tag").fields).toEqual([{ name: "name", type: "string", nullable: false }]);
  });

  it("gives clear errors for empty, HTML and malformed input", () => {
    expect(() => parseOpenApiText("  ")).toThrowError(OpenApiError, /empty/);
    expect(() => parseOpenApiText("<!DOCTYPE html><html>")).toThrowError(OpenApiError, /docs-json/);
    expect(() => parseOpenApiText('{"openapi":')).toThrowError(OpenApiError, /not valid JSON/);
    expect(() => parseOpenApiText("a: b: c")).toThrowError(OpenApiError, /export the document as JSON/i);
  });
});

describe("openapi: schemaToFields", () => {
  it("maps the property types", () => {
    const doc = loadOpenApiDocument(
      oas3({
        All: {
          type: "object",
          required: ["title", "count", "ratio", "enabled", "day", "at", "body", "kind", "summary"],
          properties: {
            title: { type: "string", maxLength: 255 },
            count: { type: "integer", format: "int32" },
            ratio: { type: "number", format: "double" },
            enabled: { type: "boolean" },
            day: { type: "string", format: "date" },
            at: { type: "string", format: "date-time" },
            body: { type: "string", maxLength: 256 },
            kind: { type: "string", enum: ["a", "b-c", "in_progress"] },
            summary: { type: "string", format: "textarea" },
            email: { type: "string", format: "email" },
            level: { type: "integer", enum: [1, 2, 3] },
          },
        },
      })
    );
    expect(schemaToFields(doc, "All")).toEqual({
      fields: [
        { name: "title", type: "string", nullable: false },
        { name: "count", type: "number", nullable: false },
        { name: "ratio", type: "number", nullable: false },
        { name: "enabled", type: "boolean", nullable: false },
        { name: "day", type: "date", nullable: false },
        { name: "at", type: "date", nullable: false },
        { name: "body", type: "text", nullable: false },
        { name: "kind", type: "enum", nullable: false, enumValues: ["a", "b-c", "in_progress"] },
        { name: "summary", type: "text", nullable: false },
        { name: "email", type: "string", nullable: true },
        { name: "level", type: "number", nullable: true },
      ],
      skipped: [],
      warnings: [],
    });
  });

  it("treats properties not in `required` or nullable as optional", () => {
    const doc = loadOpenApiDocument(
      oas3({
        X: {
          type: "object",
          required: ["a", "b", "c", "d", "e"],
          properties: {
            a: { type: "string" },
            b: { type: "string", nullable: true },
            c: { type: ["string", "null"] },
            d: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
            e: { type: "string", "x-nullable": true },
            f: { type: "string" },
          },
        },
      })
    );
    expect(schemaToFields(doc, "X").fields).toEqual([
      { name: "a", type: "string", nullable: false },
      { name: "b", type: "string", nullable: true },
      { name: "c", type: "string", nullable: true },
      { name: "d", type: "date", nullable: true },
      { name: "e", type: "string", nullable: true },
      { name: "f", type: "string", nullable: true },
    ]);
  });

  it("skips system, readOnly, object, array and binary properties and reports why", () => {
    const doc = loadOpenApiDocument(
      oas3({
        Address: { type: "object", properties: { city: { type: "string" } } },
        X: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
            slug: { type: "string", readOnly: true },
            name: { type: "string" },
            address: { $ref: "#/components/schemas/Address" },
            meta: { type: "object", additionalProperties: true },
            tags: { type: "array", items: { type: "string" } },
            photo: { type: "string", format: "binary" },
            "x-key": { type: "string" },
            anything: {},
          },
        },
      })
    );
    const result = schemaToFields(doc, "X");
    expect(result.fields).toEqual([{ name: "name", type: "string", nullable: true }]);
    expect(result.skipped).toEqual([
      { name: "id", reason: "system field" },
      { name: "createdAt", reason: "system field" },
      { name: "updatedAt", reason: "system field" },
      { name: "deletedAt", reason: "system field" },
      { name: "slug", reason: "readOnly" },
      { name: "address", reason: "object (Address)" },
      { name: "meta", reason: "object" },
      { name: "tags", reason: "array" },
      { name: "photo", reason: "binary string (format: binary)" },
      { name: "x-key", reason: "not a valid identifier" },
      { name: "anything", reason: "no type" },
    ]);
  });

  it("resolves $ref properties, enum schemas and single-member allOf wrappers", () => {
    const doc = loadOpenApiDocument(
      oas3({
        Status: { type: "string", enum: ["draft", "published"] },
        Post: {
          type: "object",
          required: ["status", "previous"],
          properties: {
            status: { $ref: "#/components/schemas/Status" },
            previous: { allOf: [{ $ref: "#/components/schemas/Status" }], nullable: true },
            next: { oneOf: [{ $ref: "#/components/schemas/Status" }, { type: "null" }] },
          },
        },
      })
    );
    expect(schemaToFields(doc, "Post").fields).toEqual([
      { name: "status", type: "enum", nullable: false, enumValues: ["draft", "published"] },
      { name: "previous", type: "enum", nullable: true, enumValues: ["draft", "published"] },
      { name: "next", type: "enum", nullable: true, enumValues: ["draft", "published"] },
    ]);
  });

  it("merges allOf members (properties and required) across $refs", () => {
    const doc = loadOpenApiDocument(
      oas3({
        Base: {
          type: "object",
          required: ["id", "code"],
          properties: { id: { type: "string" }, code: { type: "string" } },
        },
        Named: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
        Item: {
          allOf: [
            { $ref: "#/components/schemas/Base" },
            { $ref: "#/components/schemas/Named" },
            { type: "object", properties: { qty: { type: "integer" } } },
          ],
          required: ["qty"],
          properties: { note: { type: "string", maxLength: 1000 } },
        },
      })
    );
    expect(schemaToFields(doc, "Item").fields).toEqual([
      { name: "code", type: "string", nullable: false },
      { name: "name", type: "string", nullable: false },
      { name: "qty", type: "number", nullable: false },
      { name: "note", type: "text", nullable: true },
    ]);
  });

  it("works on Swagger 2.0 definitions (x-nullable, $ref enum, allOf)", () => {
    const doc = loadOpenApiDocument(swagger2Doc());
    const result = schemaToFields(doc, "Product");
    expect(result.fields).toEqual([
      { name: "title", type: "string", nullable: false },
      { name: "price", type: "number", nullable: false },
      { name: "stock", type: "number", nullable: true },
      { name: "kind", type: "enum", nullable: false, enumValues: ["physical", "digital"] },
      { name: "available", type: "boolean", nullable: true },
      { name: "releasedOn", type: "date", nullable: true },
      { name: "body", type: "text", nullable: true },
    ]);
    expect(result.skipped.map((s) => s.name)).toEqual(["id", "createdAt", "tags", "supplier"]);
  });

  it("infers the type of property-less `type: object` properties (NestJS `T | null`)", () => {
    const doc = loadOpenApiDocument(
      oas3({
        X: {
          type: "object",
          properties: {
            note: { type: "object", nullable: true },
            code: { type: "object", maxLength: 20 },
            body: { type: "object", maxLength: 2000, nullable: true },
            qty: { type: "object", minimum: 0 },
            sortField: { type: "object", example: "createdAt" },
            sortOrder: { type: "object", example: -1 },
            at: { type: "object", format: "date-time", nullable: true },
            blob: { type: "object" },
            meta: { type: "object", nullable: true, additionalProperties: true },
          },
        },
      })
    );
    const result = schemaToFields(doc, "X");
    expect(result.fields.map((f) => `${f.name}:${f.type}`)).toEqual([
      "note:string",
      "code:string",
      "body:text",
      "qty:number",
      "sortField:string",
      "sortOrder:number",
      "at:date",
    ]);
    expect(result.warnings.length).toBe(7);
    expect(result.skipped).toEqual([
      { name: "blob", reason: "object" },
      { name: "meta", reason: "object" },
    ]);
  });

  it("falls back to string (with a warning) for enum values the --fields syntax cannot hold", () => {
    const doc = loadOpenApiDocument(
      oas3({ X: { type: "object", properties: { mode: { type: "string", enum: ["a,b", "c"] } } } })
    );
    const result = schemaToFields(doc, "X");
    expect(result.fields).toEqual([{ name: "mode", type: "string", nullable: true }]);
    expect(result.warnings.length).toBe(1);
  });

  it("produces fields that round-trip through the --fields syntax", () => {
    const doc = loadOpenApiDocument(nestOpenApi());
    const { fields } = schemaToFields(doc, "CreateMahsulotDto");
    expect(parseFields(stringifyFields(fields))).toEqual(fields);
    expect(stringifyFields(fields)).toBe(
      "name:string,price:number,active:boolean?,note:string?,status:enum(active|blocked),soldAt:date?,kategoriyaId:string?"
    );
  });

  it("finds schemas case-insensitively and rejects unknown names / external refs / cycles", () => {
    const doc = loadOpenApiDocument(
      oas3({
        CreateMahsulotDto: { type: "object", properties: {} },
        Ext: { $ref: "other.json#/X" },
        Loop: { allOf: [{ $ref: "#/components/schemas/Loop" }] },
      })
    );
    expect(findSchemaName(doc, "create-mahsulot-dto")).toBe("CreateMahsulotDto");
    expect(findSchemaName(doc, "nope")).toBeUndefined();
    expect(() => schemaToFields(doc, "nope")).toThrowError(OpenApiError, /not found/);
    expect(() => schemaToFields(doc, "Ext")).toThrowError(OpenApiError, /External \$ref/);
    expect(() => schemaToFields(doc, "Loop")).toThrowError(OpenApiError, /Circular/);
  });
});

describe("openapi: discoverResources", () => {
  it("finds the fuse-nest-schematics resources behind the /api prefix, from the Create DTOs", () => {
    const doc = loadOpenApiDocument(nestOpenApi());
    const resources = discoverResources(doc);
    expect(resources.map((r) => [r.name, r.path, r.sourceSchema])).toEqual([
      ["kategoriya", "/api/admin/kategoriya", "CreateKategoriyaDto"],
      ["mahsulot", "/api/admin/mahsulot", "CreateMahsulotDto"],
    ]);
    // `description: text?` and `sortOrder: number?` are `{ type: object, nullable: true }`
    // in the NestJS output: inferred as string, with a warning each.
    expect(resources[0].fields).toEqual([
      { name: "name", type: "string", nullable: false },
      { name: "description", type: "string", nullable: true },
      { name: "sortOrder", type: "string", nullable: true },
      { name: "active", type: "boolean", nullable: true },
    ]);
    expect(resources[0].warnings.length).toBe(2);
    expect(resources[0].warnings[0]).toMatch(/Property "description" declared as "type: object"/);
    expect(resources[1].warnings.map((w) => w.split(" ")[1])).toEqual(['"note"', '"kategoriyaId"']);
  });

  it("works without a prefix and dasherizes resource names", () => {
    const doc = loadOpenApiDocument(nestOpenApi());
    const paths: Record<string, any> = {};
    for (const [p, v] of Object.entries(doc.raw.paths)) {
      paths[p.replace("/api/", "/").replace("/mahsulot", "/userProfile")] = v;
    }
    doc.raw.paths = paths;
    expect(discoverResources(doc).map((r) => [r.name, r.path])).toEqual([
      ["kategoriya", "/admin/kategoriya"],
      ["user-profile", "/admin/userProfile"],
    ]);
  });

  it("falls back to the GET-by-id response, then to a schema named like the resource", () => {
    const raw = nestOpenApi();
    delete raw.paths["/api/admin/mahsulot"].post;
    delete raw.paths["/api/admin/kategoriya"].post;
    delete raw.paths["/api/admin/kategoriya/{id}"];
    const doc = loadOpenApiDocument(raw);
    const resources = discoverResources(doc);
    const byName = (n: string) => resources.find((r) => r.name === n)!;
    expect(byName("mahsulot").sourceSchema).toBe("Mahsulot");
    expect(byName("mahsulot").fields.find((f) => f.name === "active")).toEqual({
      name: "active",
      type: "boolean",
      nullable: false,
    });
    expect(byName("mahsulot").skipped.map((s) => s.name)).toEqual(["id", "createdAt", "updatedAt", "deletedAt"]);
    expect(byName("kategoriya").sourceSchema).toBe("CreateKategoriyaDto");
  });

  it("reports resources without a usable schema", () => {
    const doc = loadOpenApiDocument(
      oas3({}, { "/admin/reports": { get: { responses: { "200": { description: "" } } } } })
    );
    const unresolved: string[] = [];
    expect(discoverResources(doc, { onUnresolved: (r) => unresolved.push(r.name) })).toEqual([]);
    expect(unresolved).toEqual(["reports"]);
  });

  it("uses inline request bodies", () => {
    const doc = loadOpenApiDocument(
      oas3(
        {},
        {
          "/admin/tag": {
            post: {
              requestBody: {
                content: {
                  "application/json": {
                    schema: { type: "object", required: ["label"], properties: { label: { type: "string" } } },
                  },
                },
              },
            },
          },
        }
      )
    );
    const [tag] = discoverResources(doc);
    expect(tag.sourceSchema).toBe("POST /admin/tag (inline)");
    expect(tag.fields).toEqual([{ name: "label", type: "string", nullable: false }]);
  });

  it("detects collection + item paths in a Swagger 2.0 document without /admin", () => {
    const doc = loadOpenApiDocument(swagger2Doc());
    const resources = discoverResources(doc);
    expect(resources.map((r) => [r.name, r.sourceSchema])).toEqual([["products", "NewProduct"]]);
    expect(resources[0].fields.map((f) => f.name)).toEqual([
      "title",
      "price",
      "stock",
      "kind",
      "available",
      "releasedOn",
      "body",
    ]);
  });
});

describe("openapi: naming helpers", () => {
  it("matches feature and resource names loosely", () => {
    expect(namesMatch("UserProfile", "user-profile")).toBe(true);
    expect(namesMatch("product", "products")).toBe(true);
    expect(namesMatch("category", "categories")).toBe(true);
    expect(namesMatch("mahsulot", "kategoriya")).toBe(false);
    expect(dasherizeName("userProfile")).toBe("user-profile");
    expect(dasherizeName("sp_year")).toBe("sp-year");
  });

  it("finds resources and schema candidates by name", () => {
    const doc = loadOpenApiDocument(nestOpenApi());
    const resources = discoverResources(doc);
    expect(findResource(resources, "Mahsulot")!.name).toBe("mahsulot");
    expect(findResource(resources, "nope")).toBeUndefined();
    expect(schemaCandidates(doc, "mahsulot")).toEqual(["CreateMahsulotDto", "Mahsulot"]);
  });
});
