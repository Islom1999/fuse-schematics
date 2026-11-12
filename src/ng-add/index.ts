import { Rule, SchematicContext, SchematicsException, Tree } from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { CONFIG_FILE, getProjectInfo, joinPath, readJson } from "../utils/workspace";

const PACKAGE = "@islom1999/fuse-schematics";

/**
 * `ng add @islom1999/fuse-schematics`: the package is saved as a devDependency by the
 * Angular CLI (see `ng-add.save` in package.json). This schematic only checks
 * that the workspace is an Angular (ideally Fuse) project and prints usage.
 * It does not modify any file.
 */
export function ngAdd(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const { logger } = context;

    if (!tree.exists("/angular.json")) {
      throw new SchematicsException(
        `${PACKAGE}: angular.json not found. Run \`ng add ${PACKAGE}\` from the root of an Angular workspace, ` +
          `or create a new Fuse project with \`npx @angular-devkit/schematics-cli ${PACKAGE}:fuse-starter <name>\`.`
      );
    }

    let project;
    try {
      project = getProjectInfo(tree, options.project, logger);
    } catch (e) {
      throw new SchematicsException((e as Error).message);
    }

    let pkg: any;
    try {
      pkg = readJson(tree, "/package.json");
    } catch {
      pkg = undefined;
    }
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    if (!deps["@angular/core"]) {
      logger.warn("@angular/core is not listed in package.json; is this an Angular application?");
    }

    const fuseFiles = [
      joinPath(project.sourceRoot, "app/app.routes.ts"),
      joinPath(project.sourceRoot, "app/core/navigation/navigation.ts"),
      joinPath(project.sourceRoot, "app/shared/components/grid/index.ts"),
    ];
    const missing = fuseFiles.filter((f) => !tree.exists(`/${f}`));
    if (missing.length) {
      logger.warn(
        `This does not look like a Fuse starter project (missing: ${missing.join(", ")}). ` +
          "Generated features expect the Fuse shared grid/table-filter/base classes; " +
          "route/navigation registration will be skipped where files are missing."
      );
    }

    logger.info(
      [
        "",
        `${PACKAGE} is ready${project.name ? ` for project "${project.name}"` : ""} (sourceRoot: ${project.sourceRoot}).`,
        "",
        "Generate a CRUD feature:",
        `  ng g ${PACKAGE}:crud <name>`,
        `  ng g ${PACKAGE}:crud product --fields "name:string,price:number,active:boolean,note:text?,status:enum(active|blocked)"`,
        "",
        "From an OpenAPI/Swagger document (JSON or YAML, file or URL):",
        `  ng g ${PACKAGE}:openapi --openapi http://localhost:3000/docs-json`,
        `  ng g ${PACKAGE}:crud product --openapi ./swagger.json --schema CreateProductDto`,
        "",
        "Useful options: --path, --prefix, --skipForm, --skipRoute, --skipNav, --skipI18n, --project",
        "",
        `Optional defaults: create ${CONFIG_FILE} in the workspace root:`,
        `  { "fuse-feature": { "path": "${joinPath(project.sourceRoot, "app/modules/admin")}", "prefix": "app" } }`,
        "",
      ].join("\n")
    );

    return tree;
  };
}
