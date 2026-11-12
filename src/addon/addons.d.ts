import { AddonName } from './translations';
export interface AddonDefinition {
    name: AddonName;
    /** Menu item title. */
    title: string;
    /** Menu item icon (Heroicons outline sprite). */
    icon: string;
    /** Permission the page needs to be useful (shown after generation). */
    permission: string;
    /** Back-end add-on that serves the page. */
    backend: string;
}
export declare const ADDONS: Record<AddonName, AddonDefinition>;
/**
 * Maps user input to an add-on name: `api-logs`, `apiLogs`, `API_Logs` and `api logs` all give
 * `api-logs`. Returns `undefined` for an unknown name.
 */
export declare function resolveAddonName(input: string): AddonName | undefined;
