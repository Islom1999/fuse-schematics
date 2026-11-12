import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner, UnitTestTree } from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";
import { nestOpenApi } from "../utils/openapi-fixtures_spec";
import { parseNameList } from "./index";

const collectionPath = path.join(__dirname, "../collection.json");
const starterRoot = path.join(__dirname, "../fuse-starter/files");

const ROUTES = "/src/app/app.routes.ts";
const NAV = "/src/app/core/navigation/navigation.ts";
const EN = "/src/assets/i18n/en.json";
const ADMIN = "/src/app/modules/admin";

/** Starter angular.json/routes/navigation/i18n plus the NestJS swagger document. */
function workspace(doc: unknown = nestOpenApi()): Tree {
  const tree = Tree.empty();
  for (const file of [
    "angular.json",
    "src/app/app.routes.ts",
    "src/app/core/navigation/navigation.ts",
    "src/assets/i18n/en.json",
    "src/assets/i18n/tr.json",
  ]) {
    tree.create(`/${file}`, fs.readFileSync(path.join(starterRoot, file), "utf-8"));
  }
  tree.create("/swagger.json", JSON.stringify(doc, null, 2));
  return tree;
}

function snapshot(tree: Tree): Record<string, string> {
  const result: Record<string, string> = {};
  tree.visit((p) => {
    result[p] = tree.readText(p);
  });
  return result;
}

describe("fuse-openapi", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  describe("on the fuse-nest-schematics document", () => {
    let tree: UnitTestTree;

    beforeAll(async () => {
      tree = await runner.runSchematic("openapi", { openapi: "./swagger.json" }, workspace());
    });

    it("generates one feature per resource", () => {
      for (const name of ["mahsulot", "kategoriya"]) {
        expect(tree.exists(`${ADMIN}/${name}/${name}.routes.ts`)).withContext(name).toBe(true);
        expect(tree.exists(`${ADMIN}/${name}/pages/${name}-form/${name}-form.component.ts`)).toBe(true);
      }
      expect(tree.files.filter((f) => f.endsWith(".routes.ts") && f.startsWith(ADMIN)).length).toBe(2);
    });

    it("uses the Create DTO fields", () => {
      const model = tree.readText(`${ADMIN}/mahsulot/common/models/mahsulot.model.ts`);
      expect(model).toContain("  status: 'active' | 'blocked'\n  soldAt?: Date\n  kategoriyaId?: string\n}");
      const kategoriya = tree.readText(`${ADMIN}/kategoriya/common/models/kategoriya.model.ts`);
      expect(kategoriya).toContain(
        "export interface IKategoriya extends IBaseModel {\n  name: string\n  description?: string\n  sortOrder?: string\n  active?: boolean\n}"
      );
    });

    it("registers routes, navigation and translations for every resource", () => {
      const routes = tree.readText(ROUTES);
      expect(routes).toContain("import('app/modules/admin/mahsulot/mahsulot.routes')");
      expect(routes).toContain("import('app/modules/admin/kategoriya/kategoriya.routes')");
      expect(tree.readText(NAV)).toContain("link : '/kategoriya'");
      const en = JSON.parse(tree.readText(EN));
      expect(Object.keys(en.admin.mahsulot.fields)).toEqual([
        "name",
        "price",
        "active",
        "note",
        "status",
        "soldAt",
        "kategoriyaId",
      ]);
    });

    it("skips existing features on a re-run, leaving the tree unchanged", async () => {
      const before = snapshot(tree);
      const messages: string[] = [];
      const sub = runner.logger.subscribe((e) => messages.push(e.message));
      let again: UnitTestTree;
      try {
        again = await runner.runSchematic("openapi", { openapi: "./swagger.json" }, tree);
      } finally {
        sub.unsubscribe();
      }
      expect(snapshot(again)).toEqual(before);
      expect(messages).toContain(
        "Skipping 'mahsulot': /src/app/modules/admin/mahsulot already exists (use --force to regenerate)."
      );
    });
  });

  it("regenerates existing features with --force (registration stays idempotent)", async () => {
    const once = await runner.runSchematic("openapi", { openapi: "swagger.json" }, workspace());
    const model = `${ADMIN}/mahsulot/common/models/mahsulot.model.ts`;
    once.overwrite(model, "// edited\n");
    const forced = await runner.runSchematic("openapi", { openapi: "swagger.json", force: true }, once);
    expect(forced.readText(model)).toContain("export interface IMahsulot");
    expect(forced.readText(ROUTES).split("path: 'mahsulot'").length - 1).toBe(1);
  });

  it("honours --include and --exclude", async () => {
    const included = await runner.runSchematic("openapi", { openapi: "swagger.json", include: "Mahsulot" }, workspace());
    expect(included.exists(`${ADMIN}/mahsulot/mahsulot.routes.ts`)).toBe(true);
    expect(included.exists(`${ADMIN}/kategoriya/kategoriya.routes.ts`)).toBe(false);

    const excluded = await runner.runSchematic(
      "openapi",
      { openapi: "swagger.json", exclude: "mahsulot, other" },
      workspace()
    );
    expect(excluded.exists(`${ADMIN}/mahsulot/mahsulot.routes.ts`)).toBe(false);
    expect(excluded.exists(`${ADMIN}/kategoriya/kategoriya.routes.ts`)).toBe(true);
  });

  it("rejects unknown --include names, listing the resources", async () => {
    await expectAsync(
      runner.runSchematic("openapi", { openapi: "swagger.json", include: "mahsulot,buyurtma" }, workspace())
    ).toBeRejectedWithError(/--include: no resource named "buyurtma"\. Available resources: kategoriya, mahsulot/);
  });

  it("passes --path, --prefix and the skip flags to every feature", async () => {
    const ws = workspace();
    const routes = ws.readText(ROUTES);
    const tree = await runner.runSchematic(
      "openapi",
      { openapi: "swagger.json", path: "src/app/modules/shop", prefix: "shop", skipRoute: true, skipNav: true, skipI18n: true },
      ws
    );
    const list = `/src/app/modules/shop/kategoriya/pages/kategoriya-list/kategoriya-list.component.ts`;
    expect(tree.readText(list)).toContain("selector: 'shop-kategoriya'");
    expect(tree.files.some((f) => f.startsWith(`${ADMIN}/`))).toBe(false);
    expect(tree.readText(ROUTES)).toBe(routes);
  });

  it("fails when the document has no CRUD resources", async () => {
    const doc = { openapi: "3.0.0", paths: { "/health": { get: {} } }, components: { schemas: {} } };
    await expectAsync(runner.runSchematic("openapi", { openapi: "swagger.json" }, workspace(doc))).toBeRejectedWithError(
      /No CRUD resources found in swagger.json/
    );
  });

  it("loads the document from a URL", async () => {
    const g = globalThis as any;
    const original = g.fetch;
    g.fetch = jasmine
      .createSpy("fetch")
      .and.resolveTo({ ok: true, status: 200, text: async () => JSON.stringify(nestOpenApi()) });
    try {
      const tree = await runner.runSchematic("openapi", { openapi: "http://localhost:3000/docs-json" }, workspace());
      expect(tree.exists(`${ADMIN}/kategoriya/kategoriya.routes.ts`)).toBe(true);
      expect(tree.exists(`${ADMIN}/mahsulot/mahsulot.routes.ts`)).toBe(true);
    } finally {
      g.fetch = original;
    }
  });

  it("parses comma-separated name lists", () => {
    expect(parseNameList(" a, b ,,c ")).toEqual(["a", "b", "c"]);
    expect(parseNameList(["a", "b,c"])).toEqual(["a", "b", "c"]);
    expect(parseNameList(undefined)).toEqual([]);
  });
});
