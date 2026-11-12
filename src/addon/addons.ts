import { ADDON_NAMES, AddonName } from './translations';

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

export const ADDONS: Record<AddonName, AddonDefinition> = {
  users: {
    name: 'users',
    title: 'Users',
    icon: 'heroicons_outline:user-group',
    permission: 'user.read / user.write',
    backend: 'auth-client',
  },
  'api-logs': {
    name: 'api-logs',
    title: 'API Logs',
    icon: 'heroicons_outline:server-stack',
    permission: 'server_api_log.read',
    backend: 'api-logs',
  },
  notifications: {
    name: 'notifications',
    title: 'Notifications',
    icon: 'heroicons_outline:megaphone',
    permission: 'notification.read / notification.write',
    backend: 'notifications',
  },
  payments: {
    name: 'payments',
    title: 'Payments',
    icon: 'heroicons_outline:banknotes',
    permission: 'payment.read / payment.write',
    backend: 'payment',
  },
  ai: {
    name: 'ai',
    title: 'AI Usage',
    icon: 'heroicons_outline:sparkles',
    permission: 'ai.read',
    backend: 'ai',
  },
  queue: {
    name: 'queue',
    title: 'Queues',
    icon: 'heroicons_outline:queue-list',
    permission: 'queue.read / queue.write',
    backend: 'queue',
  },
};

/**
 * Maps user input to an add-on name: `api-logs`, `apiLogs`, `API_Logs` and `api logs` all give
 * `api-logs`. Returns `undefined` for an unknown name.
 */
export function resolveAddonName(input: string): AddonName | undefined {
  const normalized = input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
  return (ADDON_NAMES as readonly string[]).includes(normalized) ? (normalized as AddonName) : undefined;
}
