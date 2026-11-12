/** A signed-in device (admin or client user), as returned by the `.../sessions` routes. */
export interface ISession {
  id: string
  deviceId: string
  deviceName: string | null
  platform: string | null
  os: string | null
  appVersion: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  /** Always false for client users. */
  isCurrent: boolean
}
