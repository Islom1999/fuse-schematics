import { TranslationTree } from '../utils/registration';
/** Per-language translation tree. Languages other than `tr` fall back to the English text. */
export interface LocalizedTree {
    en: TranslationTree;
    tr: TranslationTree;
}
/**
 * Keys shared by the starter's admin pages and by every add-on page: dialog buttons, the grid and
 * the session lists. The starter ships them already; the add-on merges them (adds only the missing
 * keys) so a project made from an older starter still gets working labels.
 */
export declare const COMMON_TRANSLATIONS: LocalizedTree;
export declare const ADDON_NAMES: readonly ["users", "api-logs", "notifications", "payments", "ai", "queue"];
export type AddonName = (typeof ADDON_NAMES)[number];
/** Translation keys of each add-on page, under `admin.<camelCasedName>`. */
export declare const ADDON_TRANSLATIONS: Record<AddonName, LocalizedTree>;
