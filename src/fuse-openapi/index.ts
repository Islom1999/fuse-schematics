import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  chain,
  schematic,
} from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { Schema as FeatureSchema } from "../fuse-feature/schema";
import { resolveFeatureLocation } from "../fuse-feature/index";
import { stringifyFields } from "../utils/fields";
import { OpenApiResource, discoverResources, nameKey, namesMatch } from "../utils/openapi";
import { loadOpenApi, logSchemaFields } from "../utils/openapi-source";
import { joinPath } from "../utils/workspace";

/** `"a, b"` / `["a", "b,c"]` → `["a", "b", "c"]`. */
export function parseNameList(value: string | string[] | undefined): string[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items
    .reduce<string[]>((all, item) => all.concat(String(item).split(",")), [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Applies `--include` / `--exclude`; unknown `--include` names are an error. */
export function selectResources(
  resources: OpenApiResource[],
  include: string[],
  exclude: string[]
): OpenApiResource[] {
  const matches = (resource: OpenApiResource, name: string) =>
    nameKey(resource.name) === nameKey(name) || namesMatch(resource.name, name);

  const unknown = include.filter((name) => !resources.some((r) => matches(r, name)));
  if (unknown.length) {
    throw new SchematicsException(
      `--include: no resource named ${unknown.map((n) => `"${n}"`).join(", ")}. Available resources: ${
        resources.map((r) => r.name).join(", ") || "(none)"
      }.`
    );
  }
  return resources.filter(
    (r) =>
      (include.length === 0 || include.some((name) => matches(r, name))) &&
      !exclude.some((name) => matches(r, name))
  );
}

function featureExists(tree: Tree, dir: string): boolean {
  const entry = tree.getDir(`/${dir}`);
  return entry.subfiles.length > 0 || entry.subdirs.length > 0;
}

export function fuseOpenapi(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const source = options.openapi && options.openapi.trim();
    if (!source) {
      throw new SchematicsException("--openapi <path-or-url> is required.");
    }

    const doc = await loadOpenApi(tree, source);
    const discovered = discoverResources(doc, {
      onUnresolved: (r) => context.logger.warn(`Skipping resource '${r.name}' (${r.path}): ${r.reason}.`),
    });
    if (discovered.length === 0) {
      throw new SchematicsException(
        `No CRUD resources found in ${source}: expected paths like /admin/<name> and /admin/<name>/{id}. ` +
          "Use `fuse-feature <name> --openapi <doc> --schema <SchemaName>` to generate a feature from a single schema."
      );
    }

    const resources = selectResources(discovered, parseNameList(options.include), parseNameList(options.exclude));
    if (resources.length === 0) {
      context.logger.warn("No resources left after --include/--exclude; nothing to generate.");
      return;
    }

    const location = resolveFeatureLocation(tree, options, context);
    context.logger.info(
      `Found ${discovered.length} resource(s) in ${source}: ${discovered.map((r) => r.name).join(", ")}`
    );

    const rules: Rule[] = [];
    for (const resource of resources) {
      const dir = joinPath(location.path, resource.name);
      if (featureExists(tree, dir) && !options.force) {
        context.logger.info(`Skipping '${resource.name}': /${dir} already exists (use --force to regenerate).`);
        continue;
      }

      logSchemaFields(context.logger, `${resource.sourceSchema} (resource '${resource.name}')`, resource);
      if (resource.fields.length === 0) {
        context.logger.warn(`'${resource.name}' has no usable fields; generating the default 'name' field.`);
      }

      const featureOptions: FeatureSchema = {
        name: resource.name,
        fields: stringifyFields(resource.fields),
        path: location.path,
        prefix: location.prefix,
        skipForm: !!options.skipForm,
        skipRoute: !!options.skipRoute,
        skipNav: !!options.skipNav,
        skipI18n: !!options.skipI18n,
      };
      if (options.project) {
        featureOptions.project = options.project;
      }
      rules.push(schematic("fuse-feature", featureOptions));
    }

    return chain(rules);
  };
}
