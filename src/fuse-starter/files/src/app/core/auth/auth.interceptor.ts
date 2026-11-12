import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { SKIP_AUTH } from 'app/core/http/http-context'
import { DITokens } from 'app/core/utils/di-tokens'
import { catchError, Observable, switchMap, throwError } from 'rxjs'
import { AuthService } from './auth.service'
import { AuthTokenStorage } from './auth.storage'
import { isTokenExpired } from './auth.utils'

function apiPath(url: string, apiUrl: string): string | null {
  const base = apiUrl.replace(/\/+$/, '')
  if (!url.startsWith(base)) return null
  const rest = url.slice(base.length)
  if (rest && !/^[/?#]/.test(rest)) return null
  return rest.replace(/^\/+/, '')
}

function is401(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && error.status === 401
}

/**
 * Adds the bearer token to API requests (never to other hosts) and the device headers to
 * `auth/*` calls. Before sending with an expired access token it refreshes first. On a 401 it
 * refreshes once and retries; parallel 401s wait for the same refresh. When the refresh fails the
 * session is cleared and the app goes to `/sign-in?redirectURL=...`.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const path = apiPath(req.url, inject(DITokens.API_BASE_URL))
  if (path === null) return next(req)

  const request = path.startsWith('auth/')
    ? req.clone({ setHeaders: { 'x-device-id': AuthTokenStorage.deviceId(), 'x-platform': 'web' } })
    : req
  if (req.context.get(SKIP_AUTH)) return next(request)

  const auth = inject(AuthService)
  const router = inject(Router)

  const send = (token: string | null): Observable<HttpEvent<unknown>> =>
    next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request)

  const expire = (error: unknown): Observable<never> => {
    auth.clearSession()
    const url = router.url
    if (!url.startsWith('/sign-in')) {
      const queryParams = url && url !== '/' && url !== '/sign-out' ? { redirectURL: url } : {}
      void router.navigate(['/sign-in'], { queryParams })
    }
    return throwError(() => error)
  }

  /** Last attempt: a 401 here ends the session. */
  const sendFinal = (token: string): Observable<HttpEvent<unknown>> =>
    send(token).pipe(catchError((error: unknown) => (is401(error) ? expire(error) : throwError(() => error))))

  const refreshThenSend = (original?: unknown): Observable<HttpEvent<unknown>> =>
    auth.refresh().pipe(
      catchError((refreshError: unknown) => expire(original ?? refreshError)),
      switchMap((token) => sendFinal(token)),
    )

  const current = auth.accessToken()
  const usable = current && !isTokenExpired(current) ? current : null
  if (!usable && auth.canRefresh) return refreshThenSend()

  return send(usable).pipe(
    catchError((error: unknown) => {
      if (!is401(error)) return throwError(() => error)
      // Another request refreshed while this one was in flight: retry with the new token.
      const latest = auth.accessToken()
      if (latest && latest !== usable && !isTokenExpired(latest)) return sendFinal(latest)
      if (!auth.canRefresh) return expire(error)
      return refreshThenSend(error)
    }),
  )
}
