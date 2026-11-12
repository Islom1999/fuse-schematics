import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http'
import { inject, isDevMode } from '@angular/core'
import { decodeJwtPayload } from 'app/core/auth/auth.utils'
import { buildNavigation } from 'app/core/navigation/navigation.service'
import { User } from 'app/core/user/user.types'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { map, mergeMap, Observable, throwError, timer } from 'rxjs'

/*
 * Development-only fake backend for sign-in, session refresh, the current user and the navigation.
 * Enable it with `environment.devMock`. Every other request goes to the network untouched.
 * Delete this folder (and its entry in `withInterceptors`) to drop it.
 */

const LATENCY_MS = 300
const EMAIL = 'admin@example.com'
const PASSWORD = 'admin'
const ACCESS_TOKEN_TTL_S = 60 * 60
const SESSIONS_KEY = 'dev-mock:sessions'

const USER: User = { id: 'dev-admin', email: EMAIL, name: 'Admin', permissions: ['*'] }

let announced = false
let warned = false

/** sid -> current refresh token. Kept in localStorage so a reload keeps the fake sessions. */
function readSessions(): Record<string, string> {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(SESSIONS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function writeSessions(sessions: Record<string, string>): void {
  try {
    globalThis.localStorage?.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    // Ignore: sessions then live only in memory for this request.
  }
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}

function base64Url(value: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function accessToken(sid: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub: USER.id, sid, email: USER.email, name: USER.name, permissions: USER.permissions, typ: 'admin' }
  return `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({ ...payload, iat: now, exp: now + ACCESS_TOKEN_TTL_S })}.dev-mock`
}

/** Issues a new token pair for `sid`; the previous refresh token of that session stops working. */
function issue(sid: string): { accessToken: string; refreshToken: string; expiresIn: number; user: User } {
  const refreshToken = `dev-refresh.${randomId()}`
  writeSessions({ ...readSessions(), [sid]: refreshToken })
  return { accessToken: accessToken(sid), refreshToken, expiresIn: ACCESS_TOKEN_TTL_S, user: USER }
}

/** The session id of a valid, unexpired mock access token whose session is still open. */
function sessionOf(token: string | null | undefined): string | null {
  if (!token || !token.endsWith('.dev-mock')) return null
  const payload = decodeJwtPayload(token)
  const sid = payload?.['sid']
  const exp = payload?.['exp']
  if (typeof sid !== 'string' || typeof exp !== 'number' || exp * 1000 <= Date.now()) return null
  return sid in readSessions() ? sid : null
}

function bearer(req: HttpRequest<unknown>): string | null {
  const header = req.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

function body<T>(req: HttpRequest<unknown>): Partial<T> {
  return (req.body && typeof req.body === 'object' ? req.body : {}) as Partial<T>
}

function reply<T>(req: HttpRequest<unknown>, payload: T): Observable<HttpEvent<unknown>> {
  return timer(LATENCY_MS).pipe(map(() => new HttpResponse({ status: 200, statusText: 'OK', url: req.url, body: payload })))
}

function fail(req: HttpRequest<unknown>, path: string, status: number, message: string): Observable<never> {
  const statusText = status === 401 ? 'Unauthorized' : 'Bad Request'
  const error = { statusCode: status, error: statusText, message, path: `/api/${path}`, timestamp: new Date().toISOString() }
  return timer(LATENCY_MS).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, statusText, url: req.url, error }))),
  )
}

function handle(req: HttpRequest<unknown>, path: string): Observable<HttpEvent<unknown>> | null {
  const route = `${req.method} ${path}`
  switch (route) {
    case 'POST auth/sign-in': {
      const { email, password } = body<{ email: string; password: string }>(req)
      if (email?.toLowerCase() !== EMAIL || password !== PASSWORD) {
        return fail(req, path, 401, 'Invalid email or password')
      }
      return reply(req, issue(randomId()))
    }
    case 'POST auth/refresh': {
      const { refreshToken } = body<{ refreshToken: string }>(req)
      const sessions = readSessions()
      const sid = Object.keys(sessions).find((id) => sessions[id] === refreshToken)
      if (!refreshToken || !sid) return fail(req, path, 401, 'Invalid refresh token')
      return reply(req, issue(sid))
    }
    case 'POST auth/sign-in-with-token': {
      const sid = sessionOf(body<{ accessToken: string }>(req).accessToken)
      return sid ? reply(req, issue(sid)) : fail(req, path, 401, 'Invalid or expired token')
    }
    case 'POST auth/sign-out': {
      const sid = sessionOf(bearer(req))
      if (!sid) return fail(req, path, 401, 'Unauthorized')
      const sessions = readSessions()
      delete sessions[sid]
      writeSessions(sessions)
      return reply(req, { success: true })
    }
    case 'GET auth/me':
      return sessionOf(bearer(req)) ? reply(req, USER) : fail(req, path, 401, 'Unauthorized')
    case 'GET navigation':
      return reply(req, buildNavigation())
    default:
      return null
  }
}

/** Serves the auth, user and navigation endpoints in development when `environment.devMock` is on. */
export const devMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.devMock) return next(req)
  if (!isDevMode()) {
    if (!warned) console.warn('[dev-mock] environment.devMock is ignored in production mode')
    warned = true
    return next(req)
  }

  const base = (inject(DITokens.API_BASE_URL, { optional: true }) ?? environment.apiUrl).replace(/\/+$/, '')
  const url = req.url.split(/[?#]/)[0]
  if (!url.startsWith(`${base}/`)) return next(req)
  const path = url.slice(base.length + 1).replace(/\/+$/, '')

  const mocked = handle(req, path)
  if (!mocked) return next(req)
  if (!announced) console.info('[dev-mock] enabled')
  announced = true
  console.debug(`[dev-mock] ${req.method} ${path}`)
  return mocked
}
