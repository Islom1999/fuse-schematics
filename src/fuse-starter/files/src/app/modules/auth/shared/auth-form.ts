import { HttpErrorResponse } from '@angular/common/http'
import { AbstractControl } from '@angular/forms'

/** One message shown above an auth form. A new `id` replays the entry animation. */
export interface AuthAlert {
  id: number
  type: 'success' | 'error'
  /** i18n key, translated with `params`. */
  key?: string
  params?: Record<string, unknown>
  /** Literal text from the backend, shown as is (used when there is no `key`). */
  text?: string
}

let nextAlertId = 0

export function authAlert(type: AuthAlert['type'], key: string, params?: Record<string, unknown>): AuthAlert {
  return { id: ++nextAlertId, type, key, params }
}

export function authAlertText(type: AuthAlert['type'], text: string): AuthAlert {
  return { id: ++nextAlertId, type, text }
}

/** HTTP status of an error, or `null` when it is not an HTTP error. */
export function httpStatus(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null
}

/** First `message` of the backend error body (`string | string[]`), if any. */
export function backendMessage(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) return null
  const message = (error.error as { message?: unknown } | null)?.message
  const first = Array.isArray(message) ? message[0] : message
  return typeof first === 'string' && first.trim() ? first : null
}

/**
 * The i18n key of the first failing validator, in the order of `messages`, once the control was
 * touched. `null` while valid, untouched or disabled.
 */
export function firstError(control: AbstractControl, messages: Record<string, string>): string | null {
  if (!control.invalid || !control.touched) return null
  for (const [error, key] of Object.entries(messages)) {
    if (control.hasError(error)) return key
  }
  return null
}

/** True for an in-app path such as `/example?x=1` (not `//host` or an absolute URL). */
export function isAppPath(url: string | null): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')
}
