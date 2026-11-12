import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import * as path from "path";
import { nestOpenApi, swagger2Doc } from "../utils/openapi-fixtures_spec";

const collectionPath = path.join(__dirname, "../collection.json");
const MODEL = (name: string) => `/src/app/modules/admin/${name}/common/models/${name}.model.ts`;

function workspaceWith(file: string, doc: unknown): Tree {
  const tree = Tree.empty();
  tree.create(file, JSON.stringify(doc, null, 2));
  return tree;
}

describe("fuse-feature --openapi", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  it("takes the fields of the resource matching the feature name", async () => {
    const tree = await runner.runSchematic(
      "fuse-feature",
      { name: "Mahsulot", openapi: "./swagger.json" },
      workspaceWith("/swagger.json", nestOpenApi())
    );
    const model = tree.readText(MODEL("mahsulot"));
    expect(model).toContain(
      [
        "export interface IMahsulot extends IBaseModel {",
        "  name: string",
        "  price: number",
        "  active?: boolean",
        "  note?: string",
        "  status: 'active' | 'blocked'",
        "  soldAt?: Date",
        "  kategoriyaId?: string",
        "}",
      ].join("\n")
    );
    const form = tree.readText(
      "/src/app/modules/admin/mahsulot/pages/mahsulot-form/mahsulot-form.component.ts"
    );
    expect(form).toContain("key: 'soldAt',\n        type: 'datepicker',");
  });

  it("uses --schema when given (and accepts a loosely written schema name)", async () => {
    const tree = await runner.runSchematic(
      "fuse-feature",
      { name: "product", openapi: "specs/api.json", schema: "new-product" },
      workspaceWith("/specs/api.json", swagger2Doc())
    );
    const model = tree.readText(MODEL("product"));
    expect(model).toContain("  title: string\n  price: number\n  stock?: number\n  kind: 'physical' | 'digital'");
    expect(model).toContain("  releasedOn?: Date\n  body?: string\n}");
    expect(model).not.toContain("tags");
    const form = tree.readText("/src/app/modules/admin/product/pages/product-form/product-form.component.ts");
    expect(form).toContain("key: 'body',\n        type: 'textarea',");
  });

  it("matches a schema named like the feature when no resource matches", async () => {
    const tree = await runner.runSchematic(
      "fuse-feature",
      { name: "order", openapi: "swagger.json" },
      workspaceWith("/swagger.json", swagger2Doc())
    );
    expect(tree.readText(MODEL("order"))).toContain("export interface IOrder extends IBaseModel {\n  total?: number\n}");
  });

  it("lets --fields win over --openapi (the document is not even read)", async () => {
    const tree = await runner.runSchematic("fuse-feature", {
      name: "mahsulot",
      fields: "title:string",
      openapi: "./does-not-exist.json",
    });
    expect(tree.readText(MODEL("mahsulot"))).toContain("export interface IMahsulot extends IBaseModel {\n  title: string\n}");
  });

  it("lists the available resources when none matches", async () => {
    await expectAsync(
      runner.runSchematic(
        "fuse-feature",
        { name: "buyurtma", openapi: "swagger.json" },
        workspaceWith("/swagger.json", nestOpenApi())
      )
    ).toBeRejectedWithError(/No resource matching "buyurtma".*Available resources: kategoriya, mahsulot\..*--schema/);
  });

  it("lists the available schemas when --schema is unknown", async () => {
    await expectAsync(
      runner.runSchematic(
        "fuse-feature",
        { name: "x", openapi: "swagger.json", schema: "Nope" },
        workspaceWith("/swagger.json", nestOpenApi())
      )
    ).toBeRejectedWithError(/Schema "Nope" not found in swagger.json\. Available schemas: SignInDto, .*CreateMahsulotDto/);
  });

  it("requires --openapi for --schema and reports a missing document", async () => {
    await expectAsync(runner.runSchematic("fuse-feature", { name: "x", schema: "X" })).toBeRejectedWithError(
      /--schema requires --openapi/
    );
    await expectAsync(
      runner.runSchematic("fuse-feature", { name: "x", openapi: "nope.json" })
    ).toBeRejectedWithError(/OpenAPI document "nope.json" not found/);
  });

  it("downloads the document from a URL", async () => {
    const g = globalThis as any;
    const original = g.fetch;
    g.fetch = jasmine
      .createSpy("fetch")
      .and.resolveTo({ ok: true, status: 200, text: async () => JSON.stringify(nestOpenApi()) });
    try {
      const tree = await runner.runSchematic("fuse-feature", {
        name: "kategoriya",
        openapi: "http://localhost:3000/docs-json",
      });
      expect(tree.readText(MODEL("kategoriya"))).toContain("  name: string\n  description?: string");
      expect(g.fetch).toHaveBeenCalledWith("http://localhost:3000/docs-json", jasmine.any(Object));
    } finally {
      g.fetch = original;
    }
  });

  it("logs the chosen schema, skipped properties and warnings", async () => {
    const messages: string[] = [];
    const sub = runner.logger.subscribe((e) => messages.push(`${e.level}: ${e.message}`));
    try {
      await runner.runSchematic(
        "fuse-feature",
        { name: "product", openapi: "swagger.json", schema: "Product" },
        workspaceWith("/swagger.json", swagger2Doc())
      );
    } finally {
      sub.unsubscribe();
    }
    expect(messages).toContain(
      "info: Fields from Product: title:string,price:number,stock:number?,kind:enum(physical|digital),available:boolean?,releasedOn:date?,body:text?"
    );
    expect(messages).toContain("info:   skipped 'tags': array");
    expect(messages).toContain("info:   skipped 'supplier': object (Supplier)");
  });
});
