import { Rule } from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { AddonDefinition } from "./addons";
import { TranslationTree } from "../utils/registration";
/** Translations for one language file: the shared keys plus the add-on's; non-Turkish files get English. */
export declare function translationsFor(addon: AddonDefinition, language: string): TranslationTree;
export declare function addon(options: Schema): Rule;
