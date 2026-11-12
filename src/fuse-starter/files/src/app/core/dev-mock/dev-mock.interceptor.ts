import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http'
import { inject, isDevMode } from '@angular/core'
import { decodeJwtPayload } from 'app/core/auth/auth.utils'
import { buildNavigation } from 'app/core/navigation/navigation.service'
import { User } from 'app/core/user/user.types'
import { DITokens } from 'app/core/utils/di-tokens'
import { AdminNotificationDto } from 'app/layout/common/notifications/notifications.types'
import { environment } from 'environments/environment'
import type { MediaFile } from 'app/core/upload/upload.types'
import { concat, map, mergeMap, Observable, throwError, timer } from 'rxjs'

/*
 * Development-only fake backend for sign-in, session refresh, the current user, the navigation,
 * the admin notifications, search and multipart file uploads (kept in memory, tus is not mocked).
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
  const statusText = status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Bad Request'
  const error = { statusCode: status, error: statusText, message, path: `/api/${path}`, timestamp: new Date().toISOString() }
  return timer(LATENCY_MS).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, statusText, url: req.url, error }))),
  )
}

/** `AdminNotification`s of the mock admin (in memory: reset by a reload). */
const notifications: AdminNotificationDto[] = [
  {
    id: 'dev-notification-1',
    title: 'Welcome',
    description: 'This is a dev-mock notification. Open it or mark it as read.',
    icon: 'heroicons_mini:star',
    link: '/example',
    time: new Date().toISOString(),
    read: false,
  },
]

/** `POST search`: the mock admin matches as an `admins` hit, like the backend's admins provider. */
function search(query: unknown): { id: string; label: string; results: object[] }[] {
  const needle = typeof query === 'string' ? query.trim().toLowerCase() : ''
  if (needle.length < 2 || !(USER.email.includes(needle) || USER.name.toLowerCase().includes(needle))) return []
  return [{ id: 'admins', label: 'Admins', results: [{ id: USER.id, link: `/admins/${USER.id}`, value: USER.email, title: USER.name }] }]
}

/** Files "uploaded" through the mock, by id (in memory: they are gone after a reload). */
const mediaFiles = new Map<string, MediaFile>()

function fakeMedia(file: File, usage: string): MediaFile {
  const id = randomId()
  const kind = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
        ? 'audio'
        : file.type === 'application/pdf'
          ? 'pdf'
          : 'other'
  const url = URL.createObjectURL(file)
  const media: MediaFile = {
    id, kind, usage, storage: 'local', originalName: file.name, mime: file.type, size: file.size,
    width: null, height: null, duration: null, used: false, ownerType: null, ownerId: null,
    uploadedById: USER.id, uploadedByType: 'admin', url, thumbnailUrl: kind === 'image' ? url : null,
    createdAt: new Date().toISOString(),
  }
  mediaFiles.set(id, media)
  return media
}

/** `POST admin/files/upload`: progress events, then `201 MediaFile[]`. */
function upload(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const form = req.body instanceof FormData ? req.body : new FormData()
  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  const total = files.reduce((sum, f) => sum + f.size, 0) || 1
  const usage = req.params.get('usage') ?? 'general'
  const progress = [0.3, 0.7, 1].map((part) =>
    timer(LATENCY_MS / 3).pipe(
      map(() => ({ type: HttpEventType.UploadProgress, loaded: Math.round(total * part), total }) as HttpEvent<unknown>),
    ),
  )
  const done = timer(LATENCY_MS / 3).pipe(
    map(() => new HttpResponse({ status: 201, statusText: 'Created', url: req.url, body: files.map((f) => fakeMedia(f, usage)) })),
  )
  return concat(...progress, done)
}

function handle(req: HttpRequest<unknown>, path: string): Observable<HttpEvent<unknown>> | null {
  const route = `${req.method} ${path}`
  const mediaId = /^admin\/files\/([^/]+)$/.exec(path)?.[1]
  if (req.method === 'GET' && mediaId && mediaId !== 'upload') {
    const media = mediaFiles.get(mediaId)
    return media ? reply(req, media) : fail(req, path, 404, 'File not found')
  }
  const notificationId = /^admin\/me\/notifications\/([^/]+)\/read$/.exec(path)?.[1]
  if (req.method === 'POST' && notificationId) {
    if (!sessionOf(bearer(req))) return fail(req, path, 401, 'Unauthorized')
    const found = notifications.find((item) => item.id === decodeURIComponent(notificationId))
    if (!found) return fail(req, path, 404, 'Notification not found')
    found.read = true
    return reply(req, found)
  }
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
    case 'POST admin/files/upload':
      return sessionOf(bearer(req)) ? upload(req) : fail(req, path, 401, 'Unauthorized')
    case 'GET navigation':
      return reply(req, buildNavigation())
    case 'GET admin/me/notifications':
      return sessionOf(bearer(req)) ? reply(req, notifications) : fail(req, path, 401, 'Unauthorized')
    case 'POST search':
      return sessionOf(bearer(req)) ? reply(req, search(body<{ query: string }>(req).query)) : fail(req, path, 401, 'Unauthorized')
    default:
      return null
  }
}

/** Serves the auth, user, navigation, notifications and search endpoints in development when `environment.devMock` is on. */
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
