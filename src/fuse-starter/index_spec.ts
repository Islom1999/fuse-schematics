import { Tree } from "@angular-devkit/schematics";
import {
  SchematicTestRunner,
  UnitTestTree,
} from "@angular-devkit/schematics/testing";
import * as path from "path";
import { INITIAL_COMMIT_MESSAGE, renamePackageJson } from "./index";

const collectionPath = path.join(__dirname, "../collection.json");

describe("fuse-starter", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);
  let tree: UnitTestTree;

  beforeAll(async () => {
    tree = await runner.runSchematic("fuse-starter", { name: "demo" });
  });

  it("creates the key project files", () => {
    for (const file of [
      "/demo/package.json",
      "/demo/angular.json",
      "/demo/tsconfig.json",
      "/demo/src/main.ts",
      "/demo/src/app/app.config.ts",
      "/demo/src/app/app.routes.ts",
    ]) {
      expect(tree.exists(file)).withContext(file).toBe(true);
    }
  });

  it("dasherizes the project name and honours the directory option", async () => {
    const result = await runner.runSchematic("fuse-starter", {
      name: "MyApp",
      directory: "projects",
    });
    expect(result.exists("/projects/my-app/package.json")).toBe(true);
    expect(result.exists("/MyApp/package.json")).toBe(false);
  });

  it("resolves every lazy import('app/...') in app.routes.ts to an existing file", () => {
    const routes = tree.readText("/demo/src/app/app.routes.ts");
    const imports = [...routes.matchAll(/import\(\s*['"](app\/[^'"]+)['"]\s*\)/g)].map(
      (m) => m[1]
    );

    expect(imports.length).toBeGreaterThan(0);
    for (const specifier of imports) {
      const base = `/demo/src/${specifier}`;
      const resolved = [`${base}.ts`, `${base}/index.ts`].some((p) => tree.exists(p));
      expect(resolved).withContext(`${specifier} does not resolve`).toBe(true);
    }
  });

  it("throws when the target project already exists", async () => {
    const existing = Tree.empty();
    existing.create("/demo/package.json", "{}");

    await expectAsync(
      runner.runSchematic("fuse-starter", { name: "demo" }, existing)
    ).toBeRejected();
  });

  it("throws when the name is empty", async () => {
    await expectAsync(
      runner.runSchematic("fuse-starter", { name: "  " })
    ).toBeRejectedWithError(/Project name is required/);
  });
  it("renders the dasherized project name into package.json", async () => {
    expect(JSON.parse(tree.readText("/demo/package.json")).name).toBe("demo");
    const result = await runner.runSchematic("fuse-starter", { name: "MyShop", skipInstall: true, skipGit: true });
    const text = result.readText("/my-shop/package.json");
    expect(JSON.parse(text).name).toBe("my-shop");
    expect(text).toMatch(/^\{\n  "name": "my-shop",\n/);
  });

  it("renames gitignore to .gitignore and leaves template-like content untouched", () => {
    expect(tree.exists("/demo/.gitignore")).toBe(true);
    expect(tree.exists("/demo/gitignore")).toBe(false);
  });

  describe("tasks", () => {
    const taskNames = () => runner.tasks.map((t) => t.name);

    it("schedules npm install and git init by default", async () => {
      await runner.runSchematic("fuse-starter", { name: "demo" });
      expect(taskNames()).toEqual(["node-package", "repo-init"]);
      const [install, git] = runner.tasks;
      expect((install.options as any).command).toBe("install");
      expect((install.options as any).workingDirectory).toBe("demo");
      expect((git.options as any).workingDirectory).toBe("demo");
      expect((git.options as any).commit).toBe(true);
      expect((git.options as any).message).toBe(INITIAL_COMMIT_MESSAGE);
    });

    it("skips npm install with --skipInstall", async () => {
      await runner.runSchematic("fuse-starter", { name: "demo", skipInstall: true });
      expect(taskNames()).toEqual(["repo-init"]);
    });

    it("skips git init with --skipGit", async () => {
      await runner.runSchematic("fuse-starter", { name: "demo", skipGit: true });
      expect(taskNames()).toEqual(["node-package"]);
    });

    it("schedules nothing with --skipInstall --skipGit", async () => {
      await runner.runSchematic("fuse-starter", { name: "demo", skipInstall: true, skipGit: true });
      expect(taskNames()).toEqual([]);
    });

    it("installs inside --directory", async () => {
      await runner.runSchematic("fuse-starter", { name: "demo", directory: "apps", skipGit: true });
      expect((runner.tasks[0].options as any).workingDirectory).toBe("apps/demo");
    });
  });
});

describe("renamePackageJson", () => {
  it("only changes the name and keeps formatting / trailing newline", () => {
    const input = '{\n  "name": "fuse-angular",\n  "private": true\n}\n';
    expect(renamePackageJson(input, "shop")).toBe('{\n  "name": "shop",\n  "private": true\n}\n');
  });
});
