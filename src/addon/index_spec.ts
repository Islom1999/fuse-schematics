import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner, UnitTestTree } from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";
import { ADDONS } from "./addons";
import { ADDON_NAMES, AddonName } from "./translations";
import { translationsFor } from "./index";

const collectionPath = path.join(__dirname, "../collection.json");
const starterRoot = path.join(__dirname, "../fuse-starter/files");
const filesRoot = path.join(__dirname, "../../src/addon/files");
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

/** Template files of an add-on, relative to its folder. */
function templateFiles(name: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(path.relative(path.join(filesRoot, name), full));
    }
  };
  walk(path.join(filesRoot, name));
  return out.sort();
}

function lookup(json: any, key: string): unknown {
  return key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), json);
}

describe("addon", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  for (const name of ADDON_NAMES) {
    describe(name, () => {
      let tree: UnitTestTree;

      beforeAll(async () => {
        tree = await runner.runSchematic("addon", { name }, fuseWorkspace());
      });

      it("copies every template file to src/app/modules/admin/<name>", () => {
        const files = templateFiles(name);
        expect(files.length).toBeGreaterThan(3);
        for (const file of files) {
          expect(tree.exists(`/src/app/modules/admin/${name}/${file}`)).withContext(file).toBe(true);
        }
        expect(tree.exists(`/src/app/modules/admin/${name}/${name}.routes.ts`)).toBe(true);
      });

      it("leaves no unrendered template tags or placeholder paths", () => {
        for (const file of tree.files.filter((f) => f.includes(`/modules/admin/${name}/`))) {
          expect(file).not.toContain("__");
          expect(tree.readText(file)).withContext(file).not.toMatch(/<%|%>/);
        }
      });

      it("registers the lazy route with a sourceRoot-relative import", () => {
        const routes = tree.readText(ROUTES);
        expect(routes).toContain(`path: '${name}'`);
        expect(routes).toContain(`import('app/modules/admin/${name}/${name}.routes')`);
        expect(routes.split(`path: '${name}'`).length - 1).toBe(1);
      });

      it("adds the navigation item to all four navigation arrays", () => {
        const nav = tree.readText(NAV);
        expect(nav.split(`id   : '${name}'`).length - 1).toBe(4);
        expect(nav).toContain(`title: '${ADDONS[name].title}'`);
        expect(nav).toContain(`icon : '${ADDONS[name].icon}'`);
        expect(nav).toContain(`link : '/${name}'`);
      });

      it("adds the translations: Turkish text to tr.json, English to en.json", () => {
        const en = JSON.parse(tree.readText(EN));
        const tr = JSON.parse(tree.readText(TR));
        const key = (name as string).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        expect(en.admin[key]).withContext("en").toBeDefined();
        expect(tr.admin[key]).withContext("tr").toBeDefined();
        expect(en.admin.common.noPermission).toBe("You do not have permission to view this page.");
        expect(tr.admin.common.noPermission).not.toBe(en.admin.common.noPermission);
        expect(JSON.stringify(en.admin[key])).not.toEqual(JSON.stringify(tr.admin[key]));
      });

      it("is idempotent when run twice", async () => {
        const first = snapshot(tree);
        const twice = await runner.runSchematic("addon", { name }, tree);
        expect(snapshot(twice)).toEqual(first);
      });
    });
  }

  it("keeps edited files on a second run and overwrites them with --force", async () => {
    const file = "/src/app/modules/admin/ai/common/ai.model.ts";
    const once = await runner.runSchematic("addon", { name: "ai" }, fuseWorkspace());
    const original = once.readText(file);
    once.overwrite(file, "// edited\n");

    const kept = await runner.runSchematic("addon", { name: "ai" }, once);
    expect(kept.readText(file)).toBe("// edited\n");

    const forced = await runner.runSchematic("addon", { name: "ai", force: true }, kept);
    expect(forced.readText(file)).toBe(original);
  });

  it("keeps earlier add-ons and does not duplicate shared translations", async () => {
    let tree = await runner.runSchematic("addon", { name: "users" }, fuseWorkspace());
    tree = await runner.runSchematic("addon", { name: "payments" }, tree);
    const routes = tree.readText(ROUTES);
    expect(routes).toContain("path: 'users'");
    expect(routes).toContain("path: 'payments'");
    const en = JSON.parse(tree.readText(EN));
    expect(en.admin.users).toBeDefined();
    expect(en.admin.payments).toBeDefined();
    expect(en.admin.system).toBeDefined();
  });

  it("does not overwrite existing translations", async () => {
    const ws = fuseWorkspace();
    ws.overwrite(EN, JSON.stringify({ admin: { common: { refresh: "Reload" } } }, null, 2) + "\n");
    const tree = await runner.runSchematic("addon", { name: "ai" }, ws);
    const en = JSON.parse(tree.readText(EN));
    expect(en.admin.common.refresh).toBe("Reload");
    expect(en.admin.common.cancel).toBe("Cancel");
  });

  it("gives other languages the English text", async () => {
    const ws = fuseWorkspace();
    ws.create("/src/assets/i18n/de.json", "{}\n");
    const tree = await runner.runSchematic("addon", { name: "ai" }, ws);
    const de = JSON.parse(tree.readText("/src/assets/i18n/de.json"));
    const en = JSON.parse(tree.readText(EN));
    expect(de.admin.ai).toEqual(en.admin.ai);
  });

  for (const [flag, file] of [
    ["skipRoute", ROUTES],
    ["skipNav", NAV],
    ["skipI18n", EN],
  ] as const) {
    it(`--${flag} leaves ${file} untouched`, async () => {
      const ws = fuseWorkspace();
      const before = ws.readText(file);
      const tree = await runner.runSchematic("addon", { name: "users", [flag]: true }, ws);
      expect(tree.readText(file)).toBe(before);
      expect(tree.exists("/src/app/modules/admin/users/users.routes.ts")).toBe(true);
    });
  }

  it("is available as admin-addon", async () => {
    const tree = await runner.runSchematic("admin-addon", { name: "ai" }, fuseWorkspace());
    expect(tree.exists("/src/app/modules/admin/ai/ai.routes.ts")).toBe(true);
  });

  it("normalizes the name (apiLogs, API_Logs -> api-logs)", async () => {
    for (const name of ["apiLogs", "API_Logs", " api-logs "]) {
      const tree = await runner.runSchematic("addon", { name }, fuseWorkspace());
      expect(tree.exists("/src/app/modules/admin/api-logs/api-logs.routes.ts")).withContext(name).toBe(true);
      expect(tree.readText(ROUTES)).toContain("path: 'api-logs'");
    }
  });

  it("rejects an unknown or missing name", async () => {
    await expectAsync(runner.runSchematic("addon", { name: "billing" }, fuseWorkspace())).toBeRejectedWithError(
      /Unknown add-on "billing"/
    );
    await expectAsync(runner.runSchematic("addon", { name: "" }, fuseWorkspace())).toBeRejectedWithError(
      /name is required/
    );
  });

  it("warns instead of failing when the target files are missing", async () => {
    const warnings: string[] = [];
    const sub = runner.logger.subscribe((entry) => {
      if (entry.level === "warn") warnings.push(entry.message);
    });
    try {
      const tree = await runner.runSchematic("addon", { name: "ai" });
      expect(tree.exists("/src/app/modules/admin/ai/ai.routes.ts")).toBe(true);
    } finally {
      sub.unsubscribe();
    }
    expect(warnings.some((w) => w.includes("app.routes.ts not found"))).toBe(true);
    expect(warnings.some((w) => w.includes("navigation.ts not found"))).toBe(true);
    expect(warnings.some((w) => w.includes("No translation files found"))).toBe(true);
  });

  it("registers a custom --path with a sourceRoot-relative import", async () => {
    const tree = await runner.runSchematic("addon", { name: "ai", path: "src/app/modules/shop" }, fuseWorkspace());
    expect(tree.exists("/src/app/modules/shop/ai/ai.routes.ts")).toBe(true);
    expect(tree.readText(ROUTES)).toContain("import('app/modules/shop/ai/ai.routes')");
  });

  describe("i18n coverage", () => {
    const keyPattern = /['"`](admin\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+\.?)['"`]/g;
    const staticKeys = (name: AddonName): Map<string, string> => {
      const found = new Map<string, string>();
      for (const file of templateFiles(name)) {
        const text = fs.readFileSync(path.join(filesRoot, name, file), "utf-8");
        for (const m of text.matchAll(keyPattern)) found.set(m[1], file);
        for (const m of text.matchAll(/\{\{\s*'(admin\.[A-Za-z0-9_.]+)'/g)) found.set(m[1], file);
      }
      return found;
    };

    for (const name of ADDON_NAMES) {
      it(`${name}: every static admin.* key used by the templates exists in en and tr`, () => {
        const keys = staticKeys(name);
        expect(keys.size).toBeGreaterThan(5);
        for (const language of ["en", "tr"]) {
          const json = { admin: translationsFor(ADDONS[name], language)["admin"] };
          for (const [key, file] of keys) {
            // A key ending in "." is a dynamic prefix (`'admin.ai.cards.' + id`): its group must exist.
            const found = lookup(json, key.replace(/\.$/, ""));
            const ok = key.endsWith(".") ? typeof found === "object" : typeof found === "string" || typeof found === "object";
            expect(found != null && ok).withContext(`${language}: ${key} (${file})`).toBe(true);
          }
        }
      });
    }

    it("the starter i18n files contain all shared add-on keys", () => {
      for (const language of ["en", "tr"]) {
        const starter = JSON.parse(readStarter(`src/assets/i18n/${language}.json`));
        const common = translationsFor(ADDONS.ai, language) as any;
        for (const group of ["common", "grid", "sessions"]) {
          const wanted = common.admin[group];
          if (!wanted) continue;
          expect(starter.admin[group]).withContext(`${language} admin.${group}`).toEqual(jasmine.objectContaining(wanted));
        }
      }
    });
  });
});
