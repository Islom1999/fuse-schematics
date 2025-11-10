import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  move,
  mergeWith,
  SchematicsException,
} from "@angular-devkit/schematics";
import { normalize, strings } from "@angular-devkit/core";
import { Schema } from "./schema";

export function fuseStarter(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Validate project name
    if (!options.name || options.name.trim().length === 0) {
      throw new SchematicsException("Project name is required.");
    }

    const projectName = strings.dasherize(options.name);
    const targetPath = options.directory
      ? normalize(`${options.directory}/${projectName}`)
      : normalize(projectName);

    // Check if directory already exists
    if (tree.exists(targetPath)) {
      throw new SchematicsException(
        `Directory "${targetPath}" already exists. Please choose a different name.`
      );
    }

    context.logger.info(`Creating Fuse starter project "${projectName}"...`);
    context.logger.info(`📁 Location: ${targetPath}`);

    // Copy all files from template
    const templateSource = apply(url("./files"), [move(targetPath)]);

    return mergeWith(templateSource)(tree, context);
  };
}
