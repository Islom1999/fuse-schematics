import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  apply,
  url,
  template,
  move,
  chain,
  mergeWith,
  MergeStrategy,
  filter,
  noop,
} from "@angular-devkit/schematics";
import { normalize, strings } from "@angular-devkit/core";
import { Schema } from "./schema";
import { FieldSpecError, parseFields, stringifyFields } from "../utils/fields";
import {
  SchemaFields,
  discoverResources,
  findResource,
  findSchemaName,
  listSchemaNames,
  schemaCandidates,
  schemaToFields,
} from "../utils/openapi";
import { loadOpenApi, logSchemaFields } from "../utils/openapi-source";
import { getProjectInfo, joinPath, readSchematicsConfig } from "../utils/workspace";
import {
  addLazyRoute,
  addNavigationItem,
  mergeTranslations,
  routesImportPath,
} from "../utils/registration";
import {
  DEFAULT_FIELDS,
  RenderContext,
  buildTranslations,
  renderColumns,
  renderFilterConfig,
  renderFormFields,
  renderMapToModel,
  renderModelMembers,
  titleCase,
} from "./render";

export const NAVIGATION_ICON = "heroicons_outline:rectangle-stack";

interface ResolvedOptions {
  name: string;
  dasherized: string;
  /** Parent directory of the feature folder, no leading slash. */
  path: string;
  prefix: string;
  sourceRoot: string;
  skipForm: boolean;
  ctx: RenderContext;
}

export interface FeatureLocation {
  /** Parent directory of the feature folders, no leading slash. */
  path: string;
  prefix: string;
  sourceRoot: string;
}

/**
 * Resolves where features go. Precedence: CLI flag > fuse-schematics.json
 * (`fuse-feature` section) > computed default (`<sourceRoot>/app/modules/admin`).
 */
export function resolveFeatureLocation(
  tree: Tree,
  options: { path?: string; project?: string; prefix?: string },
  context: SchematicContext
): FeatureLocation {
  let project;
  try {
    project = getProjectInfo(tree, options.project, context.logger);
  } catch (e) {
    throw new SchematicsException((e as Error).message);
  }

  const config = readSchematicsConfig(tree, "fuse-feature", context.logger);
  const configString = (key: string) =>
    typeof config[key] === "string" && (config[key] as string).trim() ? (config[key] as string) : undefined;

  return {
    path: joinPath(options.path || configString("path") || joinPath(project.sourceRoot, "app/modules/admin")),
    prefix: options.prefix || configString("prefix") || "app",
    sourceRoot: project.sourceRoot,
  };
}

function resolveOptions(options: Schema, tree: Tree, context: SchematicContext): ResolvedOptions {
  if (!options.name || !options.name.trim()) {
    throw new SchematicsException("Feature name is required!");
  }
  const name = options.name.trim();

  let fields;
  try {
    fields = parseFields(options.fields);
  } catch (e) {
    if (e instanceof FieldSpecError) {
      throw new SchematicsException(`Invalid --fields: ${e.message}`);
    }
    throw e;
  }

  const location = resolveFeatureLocation(tree, options, context);

  return {
    name,
    dasherized: strings.dasherize(name),
    path: location.path,
    prefix: location.prefix,
    sourceRoot: location.sourceRoot,
    skipForm: !!options.skipForm,
    ctx: { name, fields: fields.length ? fields : DEFAULT_FIELDS },
  };
}

/**
 * `--fields` as given, or — with `--openapi` and no `--fields` — the fields of
 * `--schema`, or of the OpenAPI resource matching the feature name.
 */
async function resolveFieldsOption(options: Schema, tree: Tree, context: SchematicContext): Promise<string | undefined> {
  const openapi = options.openapi && options.openapi.trim();
  if (!openapi) {
    if (options.schema) {
      throw new SchematicsException("--schema requires --openapi <path-or-url>.");
    }
    return options.fields;
  }
  if (options.fields && options.fields.trim()) {
    context.logger.info("--fields given; ignoring --openapi.");
    return options.fields;
  }

  const doc = await loadOpenApi(tree, openapi);
  const name = options.name.trim();
  let result: SchemaFields;
  let source: string;

  if (options.schema) {
    const schemaName = findSchemaName(doc, options.schema.trim());
    if (!schemaName) {
      throw new SchematicsException(
        `Schema "${options.schema}" not found in ${openapi}. Available schemas: ${
          listSchemaNames(doc).join(", ") || "(none)"
        }.`
      );
    }
    result = schemaToFields(doc, schemaName);
    source = schemaName;
  } else {
    const resources = discoverResources(doc);
    const resource = findResource(resources, name);
    const named = resource ? undefined : schemaCandidates(doc, name)[0];
    if (resource) {
      result = resource;
      source = `${resource.sourceSchema} (resource '${resource.name}')`;
    } else if (named) {
      result = schemaToFields(doc, named);
      source = named;
    } else {
      throw new SchematicsException(
        `No resource matching "${name}" in ${openapi}. Available resources: ${
          resources.map((r) => r.name).join(", ") || "(none)"
        }. Use --schema <SchemaName> to pick a schema (available: ${listSchemaNames(doc).join(", ") || "none"}).`
      );
    }
  }

  logSchemaFields(context.logger, source, result);
  if (result.fields.length === 0) {
    context.logger.warn(`${source} has no usable fields; generating the default 'name' field.`);
  }
  return stringifyFields(result.fields);
}

function generateFiles(o: ResolvedOptions): Rule {
  const templateOptions = {
    ...strings,
    name: o.name,
    prefix: o.prefix,
    skipForm: o.skipForm,
    modelEntityMembers: renderModelMembers(o.ctx.fields, "entity"),
    modelCreateMembers: renderModelMembers(o.ctx.fields, "create"),
    modelUpdateMembers: renderModelMembers(o.ctx.fields, "update"),
    formFieldsCode: renderFormFields(o.ctx),
    mapToModelCode: renderMapToModel(o.ctx),
    columnsCode: renderColumns(o.ctx),
    filterConfigCode: renderFilterConfig(o.ctx),
  };

  const templateSource = apply(url("./files"), [
    o.skipForm ? filter((p) => !/\/pages\/[^/]+-form\//.test(p)) : noop(),
    template(templateOptions),
    move(o.path),
  ]);

  return mergeWith(templateSource, MergeStrategy.Overwrite);
}

function registerRoute(o: ResolvedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const file = `/${joinPath(o.sourceRoot, "app/app.routes.ts")}`;
    if (!tree.exists(file)) {
      context.logger.warn(`${file} not found; skipping route registration.`);
      return;
    }
    const importPath = routesImportPath(
      o.sourceRoot,
      joinPath(o.path, o.dasherized, `${o.dasherized}.routes`),
      file
    );
    const result = addLazyRoute(tree.readText(file), o.dasherized, importPath, file);
    if (result.warning) {
      context.logger.warn(`${result.warning} Skipping route registration.`);
    } else if (result.changed) {
      tree.overwrite(file, result.content);
      context.logger.info(`Registered route '${o.dasherized}' in ${file}`);
    } else {
      context.logger.info(`Route '${o.dasherized}' already registered in ${file}`);
    }
  };
}

function registerNavigation(o: ResolvedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const file = `/${joinPath(o.sourceRoot, "app/core/navigation/navigation.ts")}`;
    if (!tree.exists(file)) {
      context.logger.warn(`${file} not found; skipping navigation registration.`);
      return;
    }
    const result = addNavigationItem(
      tree.readText(file),
      {
        id: o.dasherized,
        title: titleCase(o.name),
        icon: NAVIGATION_ICON,
        link: `/${o.dasherized}`,
      },
      file
    );
    if (result.warning) {
      context.logger.warn(`${result.warning} Skipping navigation registration.`);
    } else if (result.changed) {
      tree.overwrite(file, result.content);
      context.logger.info(`Added navigation item '${o.dasherized}' to ${file}`);
    } else {
      context.logger.info(`Navigation item '${o.dasherized}' already present in ${file}`);
    }
  };
}

function registerTranslations(o: ResolvedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const dir = `/${joinPath(o.sourceRoot, "assets/i18n")}`;
    const files = tree
      .getDir(dir)
      .subfiles.filter((f) => f.endsWith(".json"))
      .map((f) => `${dir}/${f}`);

    if (files.length === 0) {
      context.logger.warn(`No translation files found in ${dir}; skipping i18n keys.`);
      return;
    }

    const translations = buildTranslations(o.ctx);
    for (const file of files) {
      try {
        const result = mergeTranslations(tree.readText(file), translations);
        if (result.warning) {
          context.logger.warn(`${file}: ${result.warning} Skipping.`);
        } else if (result.changed) {
          tree.overwrite(file, result.content);
          context.logger.info(`Added translation keys to ${file}`);
        }
      } catch (e) {
        context.logger.warn(`Could not update ${file} (${(e as Error).message}); skipping.`);
      }
    }
  };
}

export function fuseFeature(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    if (!options.name || !options.name.trim()) {
      throw new SchematicsException("Feature name is required!");
    }
    const fields = await resolveFieldsOption(options, tree, context);
    const o = resolveOptions({ ...options, fields }, tree, context);

    context.logger.info(`Creating feature module: ${o.name}`);
    context.logger.info(`Path: ${normalize(`${o.path}/${o.dasherized}`)}`);

    return chain([
      generateFiles(o),
      options.skipRoute ? noop() : registerRoute(o),
      options.skipNav ? noop() : registerNavigation(o),
      options.skipI18n ? noop() : registerTranslations(o),
    ]);
  };
}
