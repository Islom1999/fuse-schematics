/** A notification as the widget shows it (mapped from `AdminNotification`, see `notifications.service.ts`). */
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
  /** `true`: `link` is a router link; otherwise a plain external `href`. The backend always sends router links. */
  useRouter?: boolean
  read: boolean
}

/** `AdminNotification` as served by `GET admin/me/notifications` (absent values are `null`). */
export interface AdminNotificationDto {
  id: string
  title: string
  description: string | null
  /** e.g. `heroicons_mini:star`. */
  icon: string | null
  /** Router link of this app. */
  link: string | null
  /** Created at, ISO 8601. */
  time: string
  read: boolean
}

/** Contract name for `AppNotification` (the DOM already has a global `Notification`). */
export type Notification = AppNotification
