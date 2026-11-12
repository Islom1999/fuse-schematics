export type UserStatus = 'online' | 'away' | 'busy' | 'not-visible'

/** The signed-in admin, as returned by `GET auth/me`. `permissions: ['*']` grants everything. */
export interface User {
  id: string
  email: string
  name: string
  permissions: string[]
  /** Optional image URL; the UI falls back to initials. */
  avatar?: string
  /** Optional presence status (see `environment.features.userStatus`). */
  status?: UserStatus
}
