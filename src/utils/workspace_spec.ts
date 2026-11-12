import { Tree } from "@angular-devkit/schematics";
import { getProjectInfo, joinPath, parseJsonLoose, readSchematicsConfig } from "./workspace";

describe("workspace utils", () => {
  it("parseJsonLoose tolerates comments and trailing commas but not inside strings", () => {
    expect(parseJsonLoose('{ // c\n "a": "x//y", /* b */ "b": [1,2,], }')).toEqual({ a: "x//y", b: [1, 2] });
  });

  it("getProjectInfo falls back to src without angular.json", () => {
    expect(getProjectInfo(Tree.empty())).toEqual({ root: "", sourceRoot: "src" });
  });

  it("getProjectInfo picks the first application and normalises slashes", () => {
    const tree = Tree.empty();
    tree.create(
      "/angular.json",
      JSON.stringify({ projects: { l: { projectType: "library" }, a: { projectType: "application", root: "", sourceRoot: "/client/src/" } } })
    );
    expect(getProjectInfo(tree)).toEqual({ name: "a", root: "", sourceRoot: "client/src" });
  });

  it("readSchematicsConfig returns the section or an empty object", () => {
    const tree = Tree.empty();
    expect(readSchematicsConfig(tree, "fuse-feature")).toEqual({});
    tree.create("/fuse-schematics.json", '{ "fuse-feature": { "path": "src/x" }, "other": 1 }');
    expect(readSchematicsConfig(tree, "fuse-feature")).toEqual({ path: "src/x" });
    expect(readSchematicsConfig(tree, "other")).toEqual({});
    tree.overwrite("/fuse-schematics.json", "{ broken");
    expect(readSchematicsConfig(tree, "fuse-feature")).toEqual({});
  });

  it("joinPath drops empty segments and stray slashes", () => {
    expect(joinPath("/src/", "", "app/modules/admin/")).toBe("src/app/modules/admin");
  });
});
