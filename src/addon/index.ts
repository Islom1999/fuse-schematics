import {
  MergeStrategy,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  apply,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  url,
} from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { ADDONS, AddonDefinition, resolveAddonName } from "./addons";
import { ADDON_NAMES, ADDON_TRANSLATIONS, COMMON_TRANSLATIONS, LocalizedTree } from "./translations";
import { getProjectInfo, joinPath, readSchematicsConfig } from "../utils/workspace";
import {
  TranslationTree,
  addLazyRoute,
  addNavigationItem,
  mergeTranslations,
  routesImportPath,
} from "../utils/registration";

interface ResolvedAddon {
  addon: AddonDefinition;
  /** Parent directory of the page folder, no leading slash. */
  path: string;
  sourceRoot: string;
  force: boolean;
}

/** Deep-merges `extra` into a copy of `base`; the leaves of `extra` win. */
function mergeTrees(base: TranslationTree, extra: TranslationTree): TranslationTree {
  const result: TranslationTree = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = result[key];
    result[key] =
      typeof value !== "string" && current && typeof current !== "string"
        ? mergeTrees(current, value)
        : value;
  }
  return result;
}

/** Translations for one language file: the shared keys plus the add-on's; non-Turkish files get English. */
export function translationsFor(addon: AddonDefinition, language: string): TranslationTree {
  const lang: keyof LocalizedTree = language === "tr" ? "tr" : "en";
  return mergeTrees(COMMON_TRANSLATIONS[lang], ADDON_TRANSLATIONS[addon.name][lang]);
}

function resolveAddon(options: Schema, tree: Tree, context: SchematicContext): ResolvedAddon {
  if (!options.name || !options.name.trim()) {
    throw new SchematicsException(`Add-on name is required. Choose one of: ${ADDON_NAMES.join(", ")}.`);
  }
  const name = resolveAddonName(options.name);
  if (!name) {
    throw new SchematicsException(
      `Unknown add-on "${options.name}". Choose one of: ${ADDON_NAMES.join(", ")}.`
    );
  }

  let project;
  try {
    project = getProjectInfo(tree, options.project, context.logger);
  } catch (e) {
    throw new SchematicsException((e as Error).message);
  }
  const config = readSchematicsConfig(tree, "addon", context.logger);
  const configPath = typeof config.path === "string" && config.path.trim() ? config.path : undefined;

  return {
    addon: ADDONS[name],
    path: joinPath(options.path || configPath || joinPath(project.sourceRoot, "app/modules/admin")),
    sourceRoot: project.sourceRoot,
    force: !!options.force,
  };
}

/**
 * Copies the page module. Files that already exist are kept (so edits survive a second run)
 * unless `--force` is given; running it again therefore changes nothing.
 */
function generateFiles(o: ResolvedAddon): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const target = `/${joinPath(o.path, o.addon.name)}`;
    let skipped = 0;
    const source = apply(url(`./files/${o.addon.name}`), [
      o.force
        ? noop()
        : filter((path) => {
            const exists = tree.exists(`${target}${path}`);
            if (exists) skipped++;
            return !exists;
          }),
      move(target),
    ]);
    return chain([
      mergeWith(source, MergeStrategy.Overwrite),
      () => {
        if (skipped > 0) {
          context.logger.info(`Kept ${skipped} existing file(s) in ${target} (use --force to overwrite).`);
        }
      },
    ]);
  };
}

function registerRoute(o: ResolvedAddon): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const file = `/${joinPath(o.sourceRoot, "app/app.routes.ts")}`;
    if (!tree.exists(file)) {
      context.logger.warn(`${file} not found; skipping route registration.`);
      return;
    }
    const name = o.addon.name;
    const importPath = routesImportPath(o.sourceRoot, joinPath(o.path, name, `${name}.routes`), file);
    const result = addLazyRoute(tree.readText(file), name, importPath, file);
    if (result.warning) {
      context.logger.warn(`${result.warning} Skipping route registration.`);
    } else if (result.changed) {
      tree.overwrite(file, result.content);
      context.logger.info(`Registered route '${name}' in ${file}`);
    } else {
      context.logger.info(`Route '${name}' already registered in ${file}`);
    }
  };
}

function registerNavigation(o: ResolvedAddon): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const file = `/${joinPath(o.sourceRoot, "app/core/navigation/navigation.ts")}`;
    if (!tree.exists(file)) {
      context.logger.warn(`${file} not found; skipping navigation registration.`);
      return;
    }
    const name = o.addon.name;
    const result = addNavigationItem(
      tree.readText(file),
      { id: name, title: o.addon.title, icon: o.addon.icon, link: `/${name}` },
      file
    );
    if (result.warning) {
      context.logger.warn(`${result.warning} Skipping navigation registration.`);
    } else if (result.changed) {
      tree.overwrite(file, result.content);
      context.logger.info(`Added navigation item '${name}' to ${file}`);
    } else {
      context.logger.info(`Navigation item '${name}' already present in ${file}`);
    }
  };
}

function registerTranslations(o: ResolvedAddon): Rule {
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

    for (const file of files) {
      const language = file.slice(file.lastIndexOf("/") + 1, -".json".length);
      try {
        const result = mergeTranslations(tree.readText(file), translationsFor(o.addon, language));
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

export function addon(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const o = resolveAddon(options, tree, context);

    context.logger.info(`Adding admin page: ${o.addon.name}`);
    context.logger.info(`Path: ${joinPath(o.path, o.addon.name)}`);
    context.logger.info(
      `Needs the back-end '${o.addon.backend}' add-on; admin permission: ${o.addon.permission}.`
    );

    return chain([
      generateFiles(o),
      options.skipRoute ? noop() : registerRoute(o),
      options.skipNav ? noop() : registerNavigation(o),
      options.skipI18n ? noop() : registerTranslations(o),
    ]);
  };
}
