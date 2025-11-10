import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  url,
  template,
  move,
  chain,
  mergeWith,
  MergeStrategy,
} from "@angular-devkit/schematics";
import { strings } from "@angular-devkit/core";
import { Schema } from "./schema";
import { normalize } from "path";

export function fuseFeature(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Validate name
    if (!options.name) {
      throw new Error("Feature name is required!");
    }

    // Set default values
    options.path = options.path || "src/app/modules/admin";
    options.prefix = options.prefix || "app";

    // Normalize path
    const featurePath = normalize(
      `${options.path}/${strings.dasherize(options.name)}`
    );

    context.logger.info(`Creating feature module: ${options.name}`);
    context.logger.info(`Path: ${featurePath}`);

    // Prepare template options
    const templateOptions = {
      ...options,
      ...strings,
      name: options.name,
    };

    // Apply templates
    const templateSource = apply(url("./files"), [
      template(templateOptions),
      move(options.path || "src/app/modules/admin"),
    ]);

    const rule = chain([mergeWith(templateSource, MergeStrategy.Overwrite)]);

    return rule(tree, context);
  };
}
