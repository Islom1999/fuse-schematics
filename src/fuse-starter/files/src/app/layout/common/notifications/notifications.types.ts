/** A notification as served by `GET /notifications`. */
export interface AppNotification {
  id: string
  /** `ui-icon` name, e.g. `heroicons_mini:star`. */
  icon?: string
  /** Image URL; shown instead of the icon when present. */
  image?: string
  title?: string
  /** May contain simple HTML (bold, links); rendered through Angular's sanitizer. */
  description?: string
  /** ISO 8601. */
  time: string
  link?: string
  /** `true`: `link` is a router link; otherwise a plain external `href`. */
  useRouter?: boolean
  read: boolean
}

/** Contract name for `AppNotification` (the DOM already has a global `Notification`). */
export type Notification = AppNotification
