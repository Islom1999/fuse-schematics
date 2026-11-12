import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";
import { loadOpenApiDocument, schemaToFields } from "../utils/openapi";

const collectionPath = path.join(__dirname, "../collection.json");
const starterRoot = path.join(__dirname, "../fuse-starter/files");
const readStarter = (file: string) => fs.readFileSync(path.join(starterRoot, file), "utf-8");

const ADMIN = "/src/app/modules/admin";
const FEATURE = (name: string) => `${ADMIN}/${name}`;
const FORM = (name: string) => `${FEATURE(name)}/pages/${name}-form/${name}-form.component.ts`;
const LIST = (name: string) => `${FEATURE(name)}/pages/${name}-list/${name}-list.component.ts`;
const MODEL = (name: string) => `${FEATURE(name)}/common/models/${name}.model.ts`;

/** The fields of the task's example plus a label, a list of files and an unusual target name. */
const FIELDS =
  "name:string,category:relation(Kategoriya):label(title),tags:relation(Tag[])?,image:file(image)?,docs:file(pdf)[]?,spYear:relation(SpYear)?";

function workspace(extra: Record<string, unknown> = {}): Tree {
  const tree = Tree.empty();
  for (const file of [
    "angular.json",
    "src/app/app.routes.ts",
    "src/app/core/navigation/navigation.ts",
    "src/assets/i18n/en.json",
    "src/assets/i18n/tr.json",
  ]) {
    tree.create(`/${file}`, readStarter(file));
  }
  for (const [file, doc] of Object.entries(extra)) {
    tree.create(file, JSON.stringify(doc, null, 2));
  }
  return tree;
}

/** What the backend's swagger document holds for FIELDS (patterns.md, "OpenAPI extensions"). */
function backendDocument(): Record<string, any> {
  const relation = (entity: string, multiple: boolean, label = "name") => ({
    entity,
    endpoint: `/admin/${entity === "SpYear" ? "sp-year" : entity.toLowerCase()}/options`,
    label,
    multiple,
  });
  const uuid = { type: "string", format: "uuid" };
  return {
    openapi: "3.0.0",
    info: { title: "api", version: "1" },
    paths: {
      "/api/admin/product": { post: { requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProductDto" } } } } } },
      "/api/admin/product/{id}": { get: {} },
    },
    components: {
      schemas: {
        CreateProductDto: {
          type: "object",
          required: ["name", "categoryId"],
          properties: {
            name: { type: "string" },
            categoryId: { ...uuid, "x-relation": relation("Kategoriya", false, "title") },
            tagIds: { type: "array", items: uuid, "x-relation": relation("Tag", true) },
            imageId: { ...uuid, nullable: true, "x-file": { kind: "image", multiple: false } },
            docIds: { type: "array", items: uuid, "x-file": { kind: "pdf", multiple: true } },
            spYearId: { ...uuid, nullable: true, "x-relation": relation("SpYear", false) },
          },
        },
      },
    },
  };
}

describe("fuse-feature relation and file fields", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  describe("--fields", () => {
    let tree: Tree;

    beforeAll(async () => {
      tree = await runner.runSchematic("fuse-feature", { name: "product", fields: FIELDS }, workspace());
    });

    it("models the ids the backend expects and the joined row of a single relation", () => {
      const model = tree.readText(MODEL("product"));
      expect(model).toContain(
        [
          "export interface IProduct extends IBaseModel {",
          "  name: string",
          "  categoryId: string",
          "  category?: Record<string, unknown>",
          "  tagIds?: string[]",
          "  imageId?: string",
          "  docIds?: string[]",
          "  spYearId?: string",
          "  spYear?: Record<string, unknown>",
          "}",
        ].join("\n")
      );
      expect(model).toContain("export interface IProductCreate {\n  name: string\n  categoryId: string\n  tagIds?: string[]");
    });

    it("uses relation-select for relations, with the endpoint, multiple and the label column", () => {
      const form = tree.readText(FORM("product"));
      expect(form).toContain(
        [
          "        key: 'categoryId',",
          "        type: 'relation-select',",
          "        props: {",
          "          label: 'admin.product.fields.category',",
          "          required: true,",
          "          endpoint: 'admin/kategoriya/options',",
          "          multiple: false,",
          "          labelField: 'title',",
          "          translate: true,",
          "        },",
        ].join("\n")
      );
      expect(form).toContain("key: 'tagIds',\n        type: 'relation-select',");
      expect(form).toContain("endpoint: 'admin/tag/options',\n          multiple: true,");
      expect(form).toContain("endpoint: 'admin/sp-year/options',");
      expect(form).not.toContain("key: 'category',");
    });

    it("wires file fields to the upload type with kind and multiple only", () => {
      const form = tree.readText(FORM("product"));
      expect(form).toContain(
        "key: 'imageId',\n        type: 'upload',\n        props: {\n          label: 'admin.product.fields.image',\n          kind: 'image',\n          multiple: false,\n          translate: true,\n        },"
      );
      expect(form).toContain("key: 'docIds',\n        type: 'upload',");
      expect(form).toContain("kind: 'pdf',\n          multiple: true,");
    });

    it("maps the model by key", () => {
      const form = tree.readText(FORM("product"));
      expect(form).toContain("categoryId: data.categoryId,");
      expect(form).toContain("tagIds: data.tagIds,");
      expect(form).toContain("docIds: data.docIds,");
    });

    it("shows the label of a single relation in the grid and leaves out lists and files", () => {
      const list = tree.readText(LIST("product"));
      expect(list).toContain(
        "field: 'category',\n      header: 'admin.product.fields.category',\n      template: 'relation',\n      labelField: 'title',\n      sortable: false,"
      );
      expect(list).toContain("field: 'spYear',");
      expect(list).not.toMatch(/field: '(tags|image|docs|tagIds|imageId)'/);
    });

    it("only filters scalar fields", () => {
      const list = tree.readText(LIST("product"));
      const filter = list.slice(list.indexOf("filterConfig"), list.indexOf("columns: IColumn[]"));
      expect(filter).toContain("key: 'name'");
      expect(filter).not.toMatch(/category|tags|image|docs|spYear/);
    });

    it("translates the field labels by field name", () => {
      const en = JSON.parse(tree.readText("/src/assets/i18n/en.json"));
      expect(en.admin.product.fields).toEqual(
        jasmine.objectContaining({ category: "Category", tags: "Tags", image: "Image", docs: "Docs", spYear: "Sp year" })
      );
    });
  });

  describe("scalar types of the shared syntax", () => {
    it("generates number, json, default and length props", async () => {
      const tree = await runner.runSchematic(
        "fuse-feature",
        {
          name: "item",
          fields:
            "title:string(32):unique,qty:int:min(1):max(9),price:decimal(12,2):default(0),meta:json?,active:boolean:default(true),status:enum(draft|published):default(draft),code:string:index:min(2):max(8)",
        },
        workspace()
      );
      const model = tree.readText(MODEL("item"));
      expect(model).toContain("  qty: number\n  price: number\n  meta?: Record<string, unknown>\n  active: boolean");
      const form = tree.readText(FORM("item"));
      expect(form).toContain("required: true,\n          maxLength: 32,");
      expect(form).toContain("maxFractionDigits: 0,\n          min: 1,\n          max: 9,");
      expect(form).toContain("key: 'price',\n        type: 'input-number',\n        defaultValue: 0,");
      expect(form).toContain("minFractionDigits: 2,\n          maxFractionDigits: 2,");
      expect(form).toContain("key: 'meta',\n        type: 'json',");
      expect(form).toContain("key: 'active',\n        type: 'checkbox',\n        defaultValue: true,");
      expect(form).toContain("key: 'status',\n        type: 'select',\n        defaultValue: 'draft',");
      expect(form).toContain("minLength: 2,\n          maxLength: 8,");
      const list = tree.readText(LIST("item"));
      expect(list).not.toContain("field: 'meta'");
      expect(list).toContain("key: 'qty',\n        type: 'number',");
    });

    it("rejects a spec the backend would reject, with the parser's message", async () => {
      await expectAsync(
        runner.runSchematic("fuse-feature", { name: "item", fields: "categoryId:relation(Category)" }, workspace())
      ).toBeRejectedWithError(/Invalid --fields: Name the relation "categoryId" without the Id suffix/);
    });
  });

  describe("--openapi (x-relation / x-file)", () => {
    const featureFiles = (tree: Tree) => {
      const result: Record<string, string> = {};
      tree.visit((p) => {
        if (p.startsWith(FEATURE("product"))) result[p] = tree.readText(p);
      });
      return result;
    };

    it("maps the extensions to relation and file fields", () => {
      const doc = loadOpenApiDocument(backendDocument());
      const { fields, skipped, warnings } = schemaToFields(doc, "CreateProductDto");
      expect(skipped).toEqual([]);
      expect(warnings).toEqual([]);
      expect(fields).toEqual([
        { name: "name", type: "string", nullable: false },
        { name: "category", type: "relation", nullable: false, target: "Kategoriya", many: false, label: "title" },
        { name: "tag", type: "relation", nullable: true, target: "Tag", many: true, label: "name" },
        { name: "image", type: "file", nullable: true, kind: "image", many: false },
        { name: "doc", type: "file", nullable: true, kind: "pdf", many: true },
        { name: "spYear", type: "relation", nullable: true, target: "SpYear", many: false, label: "name" },
      ]);
    });

    it("generates the same feature as --fields (fuse-feature --openapi and fuse-openapi)", async () => {
      const expected = await runner.runSchematic(
        "fuse-feature",
        { name: "product", fields: "name,category:relation(Kategoriya):label(title),tag:relation(Tag[]):label(name)?,image:file(image)?,doc:file(pdf)[]?,spYear:relation(SpYear):label(name)?" },
        workspace()
      );
      const viaFeature = await runner.runSchematic(
        "fuse-feature",
        { name: "product", openapi: "./swagger.json" },
        workspace({ "/swagger.json": backendDocument() })
      );
      const viaOpenapi = await runner.runSchematic("openapi", { openapi: "./swagger.json" }, workspace({ "/swagger.json": backendDocument() }));

      const want = featureFiles(expected);
      expect(Object.keys(want).length).toBeGreaterThan(10);
      expect(featureFiles(viaFeature)).toEqual(want);
      expect(featureFiles(viaOpenapi)).toEqual(want);
    });

    it("keeps the id keys and endpoints of the document in the generated form", async () => {
      const tree = await runner.runSchematic(
        "fuse-feature",
        { name: "product", openapi: "./swagger.json" },
        workspace({ "/swagger.json": backendDocument() })
      );
      const form = tree.readText(FORM("product"));
      expect(form).toContain("key: 'categoryId',\n        type: 'relation-select',");
      expect(form).toContain("key: 'tagIds',\n        type: 'relation-select',");
      expect(form).toContain("key: 'imageId',\n        type: 'upload',");
      expect(form).toContain("key: 'docIds',\n        type: 'upload',");
      expect(form).toContain("endpoint: 'admin/sp-year/options',");
    });

    it("warns about an endpoint the generator cannot reproduce and skips a property without an id suffix", () => {
      const doc = backendDocument();
      const props = doc.components.schemas.CreateProductDto.properties;
      props.categoryId["x-relation"].endpoint = "/admin/custom/options";
      props.owner = { type: "string", format: "uuid", "x-relation": { entity: "User", multiple: false } };
      const { fields, skipped, warnings } = schemaToFields(loadOpenApiDocument(doc), "CreateProductDto");
      expect(fields.some((f) => f.name === "category")).toBe(true);
      expect(warnings.join("\n")).toContain('x-relation endpoint "/admin/custom/options" differs from "/admin/kategoriya/options"');
      expect(skipped).toEqual([{ name: "owner", reason: "x-relation without an Id suffix in the property name" }]);
    });

    it("falls back to the kind other, with a warning, for an unknown x-file kind", () => {
      const doc = backendDocument();
      doc.components.schemas.CreateProductDto.properties.imageId["x-file"] = { kind: "gif", multiple: false };
      const { fields, warnings } = schemaToFields(loadOpenApiDocument(doc), "CreateProductDto");
      expect(fields.find((f) => f.name === "image")).toEqual(jasmine.objectContaining({ kind: "other" }));
      expect(warnings.join("\n")).toContain('x-file kind "gif"');
    });
  });
});

describe("fuse-starter formly types for relation and file fields", () => {
  const config = readStarter("src/app/app.config.ts");

  for (const [name, component, file] of [
    ["relation-select", "TypeRelationSelect", "type-relation-select.ts"],
    ["json", "TypeJson", "type-json.ts"],
    ["upload", "TypeUpload", "type-upload.component.ts"],
  ]) {
    it(`registers '${name}'`, () => {
      expect(fs.existsSync(path.join(starterRoot, "src/app/shared/ngx-formly", file))).toBe(true);
      expect(config).toContain(`name: '${name}',\n            component: ${component},`);
    });
  }

  it("reads the options endpoint with search, ids, limit and label", () => {
    const type = readStarter("src/app/shared/ngx-formly/type-relation-select.ts");
    for (const param of ["search", "ids", "limit", "label"]) {
      expect(type).toContain(`${param}:`);
    }
    expect(type).toContain("<p-multiselect");
    expect(type).toContain("<p-select");
  });
});
