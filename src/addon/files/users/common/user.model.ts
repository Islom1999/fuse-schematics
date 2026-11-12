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
  phone?: string | null
  email?: string | null
  emailVerified?: boolean
  googleSub?: string | null
  appleSub?: string | null
  telegramId?: string | null
}
