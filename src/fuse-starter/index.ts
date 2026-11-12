import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  mergeWith,
  forEach,
  SchematicsException,
  TaskId,
} from "@angular-devkit/schematics";
import {
  NodePackageInstallTask,
  RepositoryInitializerTask,
} from "@angular-devkit/schematics/tasks";
import { normalize, strings } from "@angular-devkit/core";
import { Schema } from "./schema";

export const INITIAL_COMMIT_MESSAGE = "chore: initial commit from fuse-schematics";

/**
 * Rewrites the `name` of the template's root package.json. Done on the parsed
 * JSON (not via EJS) so the 400-file template tree is never run through the
 * template engine.
 */
export function renamePackageJson(content: string, name: string): string {
  const pkg = JSON.parse(content);
  pkg.name = name;
  return JSON.stringify(pkg, null, 2) + (content.endsWith("\n") ? "\n" : "");
}

export function fuseStarter(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Validate project name
    if (!options.name || options.name.trim().length === 0) {
      throw new SchematicsException("Project name is required.");
    }

    const projectName = strings.dasherize(options.name.trim());
    const targetPath = options.directory
      ? normalize(`${options.directory}/${projectName}`)
      : normalize(projectName);

    // Check if directory already exists
    const existingDir = tree.getDir(targetPath);
    if (
      tree.exists(targetPath) ||
      existingDir.subfiles.length > 0 ||
      existingDir.subdirs.length > 0
    ) {
      throw new SchematicsException(
        `Directory "${targetPath}" already exists. Please choose a different name.`
      );
    }

    context.logger.info(`Creating Fuse starter project "${projectName}"...`);
    context.logger.info(`📁 Location: ${targetPath}`);

    // Copy all files from template
    // npm nashr qilishda `.gitignore` fayllarini olib tashlaydi, shuning uchun
    // shablonda `gitignore` nomi bilan saqlanadi va bu yerda qayta nomlanadi
    const templateSource = apply(url("./files"), [
      forEach((entry) => {
        if (entry.path === "/package.json") {
          return {
            path: entry.path,
            content: Buffer.from(renamePackageJson(entry.content.toString("utf-8"), projectName)),
          };
        }
        if (entry.path.endsWith("/gitignore")) {
          return {
            path: normalize(entry.path.replace(/\/gitignore$/, "/.gitignore")),
            content: entry.content,
          };
        }
        return entry;
      }),
      move(targetPath),
    ]);

    const installTaskIds: TaskId[] = [];
    if (!options.skipInstall) {
      installTaskIds.push(
        context.addTask(new NodePackageInstallTask({ workingDirectory: targetPath }))
      );
    }
    if (!options.skipGit) {
      context.addTask(
        new RepositoryInitializerTask(targetPath, { message: INITIAL_COMMIT_MESSAGE }),
        installTaskIds
      );
    }

    return mergeWith(templateSource);
  };
}
