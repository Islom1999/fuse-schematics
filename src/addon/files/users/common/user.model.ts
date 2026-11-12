/**
 * `admin/users`: a client (mobile or web) user. Which of phone, email and the social ids exist
 * depends on the sign-in methods chosen when the back-end add-on was installed.
 */
export interface IUser {
  id: string
  /** Account number (a bigint, kept as a string; starts at 100000). */
  accountNo: string
  name: string | null
  language: string | null
  isBlocked: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  phone?: string | null
  email?: string | null
  emailVerified?: boolean
  googleSub?: string | null
  appleSub?: string | null
  telegramId?: string | null
}

/**
 * Body of `POST admin/users`. The fields after `isBlocked` exist only for the sign-in methods the
 * back-end was generated with, so send only what was filled in.
 */
export interface IUserCreate {
  /** At most 120 characters. */
  name?: string
  /** At most 10 characters, for example `uz`. */
  language?: string | null
  isBlocked?: boolean
  /** E.164, `^\+\d{9,15}$`, unique. Needs the `phone` method. */
  phone?: string | null
  /** At most 254 characters, unique. Needs the `email` method. */
  email?: string | null
  /** The admin vouches for the address. */
  emailVerified?: boolean
  /** 8 to 128 characters (not 200 like the admin password). */
  password?: string
}

/** Body of `PATCH admin/users/:id`: every create field, all optional; `null` clears phone and email. */
export type IUserUpdate = Partial<IUserCreate>

/** `DELETE admin/users/:id`: a soft delete that also revokes every session. */
export interface IUserDeleted {
  deleted: boolean
  id: string
}

/** `GET admin/users/:id/push-devices` (needs `notification.read`). The full token is never returned. */
export interface IPushDevice {
  sessionId: string
  /** First 6 and last 4 characters of the token. */
  tokenMasked: string
  platform: string | null
  deviceName: string | null
  appVersion: string | null
  lastSeenAt: string | null
}
