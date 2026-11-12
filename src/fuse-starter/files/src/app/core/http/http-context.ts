import { HttpContextToken } from '@angular/common/http'

/** Set to true on a request whose errors the caller shows itself; `errorInterceptor` then stays quiet. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false)

/**
 * Set to true on a request that `authInterceptor` must leave alone: no token is added and a 401
 * does not trigger a refresh or a sign-out.
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false)
