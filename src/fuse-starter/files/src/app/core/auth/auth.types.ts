import { User } from 'app/core/user/user.types'

export interface SignInCredentials {
  email: string
  password: string
  /** Keep the session in `localStorage` (true) or `sessionStorage` (false). */
  rememberMe: boolean
}

/** Body of `sign-in`, `refresh` and `sign-in-with-token`. `expiresIn` is in seconds. */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

/** Standard error body of the backend for every non-2xx response. */
export interface ApiErrorBody {
  statusCode: number
  error: string
  message: string | string[]
  path: string
  timestamp: string
}
