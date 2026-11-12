import { Tree } from "@angular-devkit/schematics";
import {
  SchematicTestRunner,
  UnitTestTree,
} from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";

const collectionPath = path.join(__dirname, "../collection.json");

function expectedFiles(root: string, name: string): string[] {
  const dir = `${root}/${name}`;
  return [
    `${dir}/${name}.routes.ts`,
    `${dir}/components/index.ts`,
    `${dir}/common/index.ts`,
    `${dir}/common/models/${name}.model.ts`,
    `${dir}/common/services/${name}.service.ts`,
    `${dir}/common/services/${name}-grid.service.ts`,
    `${dir}/pages/index.ts`,
    `${dir}/pages/${name}-list/${name}-list.component.ts`,
    `${dir}/pages/${name}-list/${name}-list.component.html`,
    `${dir}/pages/${name}-list/${name}-list.component.scss`,
    `${dir}/pages/${name}-form/${name}-form.component.ts`,
    `${dir}/pages/${name}-form/${name}-form.component.html`,
    `${dir}/pages/${name}-form/${name}-form.component.scss`,
  ];
}

describe("fuse-feature", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  describe("with default path", () => {
    let tree: UnitTestTree;

    beforeAll(async () => {
      tree = await runner.runSchematic("fuse-feature", { name: "UserProfile" });
    });

    it("creates the expected files under src/app/modules/admin with dasherized names", () => {
      for (const file of expectedFiles("/src/app/modules/admin", "user-profile")) {
        expect(tree.exists(file)).withContext(file).toBe(true);
      }
    });

    it("uses classified and camelized names inside the templates", () => {
      const routes = tree.readText(
        "/src/app/modules/admin/user-profile/user-profile.routes.ts"
      );
      expect(routes).toContain("UserProfileListComponent");
      expect(routes).toContain("UserProfileFormComponent");
      expect(routes).toContain("export const userProfileRoutes");
      expect(routes).toContain("export default userProfileRoutes");

      const list = tree.readText(
        "/src/app/modules/admin/user-profile/pages/user-profile-list/user-profile-list.component.ts"
      );
      expect(list).toContain("export class UserProfileListComponent");
    });

    it("leaves no unrendered template tags or placeholder paths", () => {
      for (const file of tree.files) {
        expect(file).not.toContain("__");
        expect(tree.readText(file)).withContext(file).not.toMatch(/<%|%>/);
      }
    });
  });

  it("respects the path option", async () => {
    const tree = await runner.runSchematic("fuse-feature", {
      name: "mahsulot",
      path: "src/app/modules/shop",
    });

    for (const file of expectedFiles("/src/app/modules/shop", "mahsulot")) {
      expect(tree.exists(file)).withContext(file).toBe(true);
    }
    expect(tree.files.some((f) => f.startsWith("/src/app/modules/admin/"))).toBe(false);
  });
});

const starterRoot = path.join(__dirname, "../fuse-starter/files");
const readStarter = (file: string) => fs.readFileSync(path.join(starterRoot, file), "utf-8");

const ROUTES = "/src/app/app.routes.ts";
const NAV = "/src/app/core/navigation/navigation.ts";
const EN = "/src/assets/i18n/en.json";
const TR = "/src/assets/i18n/tr.json";

/** A tree with the starter's angular.json, routes, navigation and i18n files. */
function fuseWorkspace(): Tree {
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
  return tree;
}

function snapshot(tree: Tree): Record<string, string> {
  const result: Record<string, string> = {};
  tree.visit((p) => {
    result[p] = tree.readText(p);
  });
  return result;
}

const FIELDS = "name:string,price:number,active:boolean,note:text?,status:enum(active|blocked),soldAt:date?";

describe("fuse-feature --fields", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);
  let tree: UnitTestTree;
  const dir = "/src/app/modules/admin/mahsulot";

  beforeAll(async () => {
    tree = await runner.runSchematic("fuse-feature", { name: "mahsulot", fields: FIELDS }, fuseWorkspace());
  });

  it("generates typed model interfaces", () => {
    const model = tree.readText(`${dir}/common/models/mahsulot.model.ts`);
    expect(model).toContain(
      [
        "export interface IMahsulot extends IBaseModel {",
        "  name: string",
        "  price: number",
        "  active: boolean",
        "  note?: string",
        "  status: 'active' | 'blocked'",
        "  soldAt?: Date",
        "}",
      ].join("\n")
    );
    expect(model).toContain("export interface IMahsulotCreate {\n  name: string\n  price: number");
    expect(model).toContain(
      "export interface IMahsulotUpdate {\n  name?: string\n  price?: number\n  active?: boolean\n  note?: string\n  status?: 'active' | 'blocked'\n  soldAt?: Date\n}"
    );
  });

  it("generates formly fields with props and the starter's registered types", () => {
    const form = tree.readText(`${dir}/pages/mahsulot-form/mahsulot-form.component.ts`);
    expect(form).not.toContain("templateOptions");
    expect(form).toContain("key: 'name',\n        type: 'input',");
    expect(form).toContain("key: 'price',\n        type: 'input-number',");
    expect(form).toContain("key: 'active',\n        type: 'checkbox',\n        defaultValue: false,");
    expect(form).toContain("key: 'note',\n        type: 'textarea',");
    expect(form).toContain("key: 'status',\n        type: 'select',");
    expect(form).toContain(
      "options: [\n            { label: 'active', value: 'active' },\n            { label: 'blocked', value: 'blocked' },\n          ],"
    );
    expect(form).toContain("key: 'soldAt',\n        type: 'datepicker',");
    expect(form).toContain("label: 'admin.mahsulot.fields.price',\n          required: true,");
    // optional fields and checkboxes are not required
    const note = form.slice(form.indexOf("key: 'note'"), form.indexOf("key: 'status'"));
    expect(note).not.toContain("required");
    const active = form.slice(form.indexOf("key: 'active'"), form.indexOf("key: 'note'"));
    expect(active).not.toContain("required");
    expect(form).toContain("soldAt: data.soldAt ? new Date(data.soldAt) : undefined,");
    expect(form).toContain("price: data.price,");
  });

  it("generates grid columns and table filter fields", () => {
    const list = tree.readText(`${dir}/pages/mahsulot-list/mahsulot-list.component.ts`);
    expect(list).toContain("field: 'price',\n      header: 'admin.mahsulot.fields.price',\n    },");
    expect(list).toContain(
      "field: 'soldAt',\n      header: 'admin.mahsulot.fields.soldAt',\n      template: 'date',"
    );
    expect(list).not.toContain("field: 'key'");
    expect(list).toContain("label: 'admin.mahsulot.name',\n        placeholder: 'admin.mahsulot.namePlaceholder',");
    expect(list).toContain("key: 'price',\n        type: 'number',");
    expect(list).toContain("key: 'active',\n        type: 'select',");
    expect(list).toContain("key: 'soldAt',\n        type: 'date',");
    expect(list).toContain("columns: 3,");
  });

  it("adds i18n keys for every field to every language file", () => {
    for (const file of [EN, TR]) {
      const json = JSON.parse(tree.readText(file));
      expect(json.layout).withContext(file).toBeDefined();
      const keys = json.admin.mahsulot;
      for (const k of ["title", "addNew", "create", "edit", "name", "namePlaceholder"]) {
        expect(keys[k]).withContext(`${file} ${k}`).toEqual(jasmine.any(String));
      }
      expect(Object.keys(keys.fields)).toEqual(["name", "price", "active", "note", "status", "soldAt"]);
      expect(keys.fields.soldAt).toBe("Sold at");
      // Labels of the yes/no select rendered for the boolean `active` filter.
      // The starter already ships these keys (translated in tr.json), and merging never overwrites.
      expect(json.admin.grid.filter).withContext(file).toEqual(file === TR ? { yes: "Evet", no: "Hayır" } : { yes: "Yes", no: "No" });
    }
    expect(tree.readText(EN)).toContain('\n    "admin": {');
  });

  it("rejects an invalid --fields value", async () => {
    await expectAsync(
      runner.runSchematic("fuse-feature", { name: "x", fields: "price:money" }, fuseWorkspace())
    ).toBeRejectedWithError(/Invalid --fields: Unknown type "money"/);
  });
});

describe("fuse-feature registration", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  it("registers the route, navigation item and translations by default", async () => {
    const tree = await runner.runSchematic("fuse-feature", { name: "UserProfile" }, fuseWorkspace());

    const routes = tree.readText(ROUTES);
    expect(routes).toContain(
      "{\n        path: 'user-profile',\n        loadChildren: () => import('app/modules/admin/user-profile/user-profile.routes'),\n      },"
    );

    const nav = tree.readText(NAV);
    expect(nav.split("id   : 'user-profile'").length - 1).toBe(4);
    expect(nav).toContain("title: 'User Profile'");
    expect(nav).toContain("icon : 'heroicons_outline:rectangle-stack'");
    expect(nav).toContain("link : '/user-profile'");

    const en = JSON.parse(tree.readText(EN));
    expect(en.admin.userProfile.fields).toEqual({ name: "Name" });
    expect(en.admin.userProfile.title).toBe("User Profile");
  });

  it("is idempotent when run twice", async () => {
    const once = await runner.runSchematic("fuse-feature", { name: "mahsulot", fields: FIELDS }, fuseWorkspace());
    const first = snapshot(once);
    const twice = await runner.runSchematic("fuse-feature", { name: "mahsulot", fields: FIELDS }, once);
    expect(snapshot(twice)).toEqual(first);
  });

  it("keeps previously registered features when adding another one", async () => {
    const one = await runner.runSchematic("fuse-feature", { name: "mahsulot" }, fuseWorkspace());
    const two = await runner.runSchematic("fuse-feature", { name: "kategoriya" }, one);
    const routes = two.readText(ROUTES);
    expect(routes).toContain("path: 'mahsulot'");
    expect(routes).toContain("path: 'kategoriya'");
    // The starter also ships shared admin.* keys (common, grid, system), so only check the features.
    expect(Object.keys(JSON.parse(two.readText(TR)).admin)).toEqual(jasmine.arrayContaining(["mahsulot", "kategoriya"]));
  });

  it("does not overwrite existing translations", async () => {
    const ws = fuseWorkspace();
    ws.overwrite(EN, JSON.stringify({ admin: { mahsulot: { title: "Mahsulotlar" } } }, null, 2) + "\n");
    const tree = await runner.runSchematic("fuse-feature", { name: "mahsulot" }, ws);
    const en = JSON.parse(tree.readText(EN));
    expect(en.admin.mahsulot.title).toBe("Mahsulotlar");
    expect(en.admin.mahsulot.addNew).toBe("Add new");
    expect(tree.readText(EN)).toContain('\n  "admin": {');
  });

  for (const [flag, file] of [
    ["skipRoute", ROUTES],
    ["skipNav", NAV],
    ["skipI18n", EN],
  ] as const) {
    it(`--${flag} leaves ${file} untouched`, async () => {
      const ws = fuseWorkspace();
      const before = ws.readText(file);
      const tree = await runner.runSchematic("fuse-feature", { name: "mahsulot", [flag]: true }, ws);
      expect(tree.readText(file)).toBe(before);
      expect(tree.exists("/src/app/modules/admin/mahsulot/mahsulot.routes.ts")).toBe(true);
    });
  }

  it("warns instead of failing when the target files are missing", async () => {
    const warnings: string[] = [];
    const sub = runner.logger.subscribe((entry) => {
      if (entry.level === "warn") warnings.push(entry.message);
    });
    try {
      const tree = await runner.runSchematic("fuse-feature", { name: "mahsulot" });
      expect(tree.exists("/src/app/modules/admin/mahsulot/mahsulot.routes.ts")).toBe(true);
    } finally {
      sub.unsubscribe();
    }
    expect(warnings.some((w) => w.includes("app.routes.ts not found"))).toBe(true);
    expect(warnings.some((w) => w.includes("navigation.ts not found"))).toBe(true);
    expect(warnings.some((w) => w.includes("No translation files found"))).toBe(true);
  });

  it("registers a custom --path with a sourceRoot-relative import", async () => {
    const tree = await runner.runSchematic(
      "fuse-feature",
      { name: "mahsulot", path: "src/app/modules/shop" },
      fuseWorkspace()
    );
    expect(tree.readText(ROUTES)).toContain("import('app/modules/shop/mahsulot/mahsulot.routes')");
  });
});

describe("fuse-feature workspace resolution", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  function multiProjectWorkspace(): Tree {
    const tree = Tree.empty();
    tree.create(
      "/angular.json",
      JSON.stringify({
        version: 1,
        projects: {
          lib: { projectType: "library", root: "projects/lib", sourceRoot: "projects/lib/src" },
          shop: { projectType: "application", root: "projects/shop", sourceRoot: "projects/shop/src" },
          admin: { projectType: "application", root: "projects/admin" },
        },
      })
    );
    tree.create("/projects/shop/src/app/app.routes.ts", readStarter("src/app/app.routes.ts"));
    return tree;
  }

  it("reads sourceRoot of the first application project from angular.json", async () => {
    const tree = await runner.runSchematic("fuse-feature", { name: "mahsulot" }, multiProjectWorkspace());
    expect(tree.exists("/projects/shop/src/app/modules/admin/mahsulot/mahsulot.routes.ts")).toBe(true);
    expect(tree.files.some((f) => f.startsWith("/src/"))).toBe(false);
    expect(tree.readText("/projects/shop/src/app/app.routes.ts")).toContain(
      "import('app/modules/admin/mahsulot/mahsulot.routes')"
    );
  });

  it("honours --project (sourceRoot defaults to <root>/src)", async () => {
    const tree = await runner.runSchematic(
      "fuse-feature",
      { name: "mahsulot", project: "admin" },
      multiProjectWorkspace()
    );
    expect(tree.exists("/projects/admin/src/app/modules/admin/mahsulot/mahsulot.routes.ts")).toBe(true);
  });

  it("rejects an unknown --project", async () => {
    await expectAsync(
      runner.runSchematic("fuse-feature", { name: "mahsulot", project: "nope" }, multiProjectWorkspace())
    ).toBeRejectedWithError(/Project "nope" does not exist/);
  });

  it("uses fuse-schematics.json defaults, with CLI flags taking precedence", async () => {
    const ws = Tree.empty();
    ws.create(
      "/fuse-schematics.json",
      JSON.stringify({ "fuse-feature": { path: "src/app/features", prefix: "shop" } })
    );

    const fromConfig = await runner.runSchematic("fuse-feature", { name: "mahsulot" }, ws);
    const list = "/src/app/features/mahsulot/pages/mahsulot-list/mahsulot-list.component.ts";
    expect(fromConfig.exists(list)).toBe(true);
    expect(fromConfig.readText(list)).toContain("selector: 'shop-mahsulot'");

    const ws2 = Tree.empty();
    ws2.create(
      "/fuse-schematics.json",
      JSON.stringify({ "fuse-feature": { path: "src/app/features", prefix: "shop" } })
    );
    const fromFlags = await runner.runSchematic(
      "fuse-feature",
      { name: "mahsulot", path: "src/app/other", prefix: "x" },
      ws2
    );
    const list2 = "/src/app/other/mahsulot/pages/mahsulot-list/mahsulot-list.component.ts";
    expect(fromFlags.exists(list2)).toBe(true);
    expect(fromFlags.readText(list2)).toContain("selector: 'x-mahsulot'");
  });
});
