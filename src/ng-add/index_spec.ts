import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner, UnitTestTree } from "@angular-devkit/schematics/testing";
import * as fs from "fs";
import * as path from "path";

const collectionPath = path.join(__dirname, "../collection.json");
const starterRoot = path.join(__dirname, "../fuse-starter/files");

describe("ng-add", () => {
  const runner = new SchematicTestRunner("fuse-schematics", collectionPath);

  function collectLogs(): { messages: { level: string; message: string }[]; stop: () => void } {
    const messages: { level: string; message: string }[] = [];
    const sub = runner.logger.subscribe((e) => messages.push({ level: e.level, message: e.message }));
    return { messages, stop: () => sub.unsubscribe() };
  }

  it("is registered in collection.json and package.json declares ng-add.save", () => {
    const collection = JSON.parse(fs.readFileSync(collectionPath, "utf-8"));
    expect(collection.schematics["ng-add"]).toBeDefined();
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8"));
    expect(pkg["ng-add"]).toEqual({ save: "devDependencies" });
  });

  it("fails outside an Angular workspace", async () => {
    await expectAsync(runner.runSchematic("ng-add", {})).toBeRejectedWithError(/angular\.json not found/);
  });

  it("prints usage for a Fuse workspace without changing files", async () => {
    const ws = Tree.empty();
    for (const file of [
      "angular.json",
      "package.json",
      "src/app/app.routes.ts",
      "src/app/core/navigation/navigation.ts",
      "src/app/shared/components/grid/index.ts",
    ]) {
      ws.create(`/${file}`, fs.readFileSync(path.join(starterRoot, file)));
    }
    let before = 0;
    ws.visit(() => before++);

    const logs = collectLogs();
    let tree: UnitTestTree;
    try {
      tree = await runner.runSchematic("ng-add", {}, ws);
    } finally {
      logs.stop();
    }
    expect(tree!.files.length).toBe(before);
    expect(logs.messages.filter((m) => m.level === "warn")).toEqual([]);
    const info = logs.messages.map((m) => m.message).join("\n");
    expect(info).toContain("ng g fuse-schematics:crud <name>");
    expect(info).toContain('project "fuse"');
    expect(info).toContain("fuse-schematics.json");
  });

  it("warns when the workspace is not a Fuse project", async () => {
    const ws = Tree.empty();
    ws.create("/angular.json", JSON.stringify({ version: 1, projects: { app: { projectType: "application", root: "", sourceRoot: "src" } } }));
    ws.create("/package.json", JSON.stringify({ dependencies: {} }));
    const logs = collectLogs();
    try {
      await runner.runSchematic("ng-add", {}, ws);
    } finally {
      logs.stop();
    }
    const warnings = logs.messages.filter((m) => m.level === "warn").map((m) => m.message).join("\n");
    expect(warnings).toContain("@angular/core is not listed");
    expect(warnings).toContain("does not look like a Fuse starter project");
  });
});
