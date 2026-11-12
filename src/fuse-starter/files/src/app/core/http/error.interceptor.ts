import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { MessageService } from 'primeng/api'
import { catchError, throwError } from 'rxjs'
import { SKIP_ERROR_TOAST } from './http-context'

/** The same toast is not repeated within this window (for example many requests failing offline). */
const REPEAT_WINDOW_MS = 2000
let lastToast = { key: '', at: 0 }

function messageKey(status: number): string | null {
  if (status === 0) return 'errors.network'
  if (status === 403) return 'errors.forbidden'
  if (status >= 500) return 'errors.server'
  return null
}

/**
 * Shows a PrimeNG toast for network errors (status 0), 403 and 5xx. Pages handle 400/401 and
 * other statuses themselves. Requests with `SKIP_ERROR_TOAST` are never toasted.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService, { optional: true })
  const transloco = inject(TranslocoService, { optional: true })

  return next(req).pipe(
    catchError((error: unknown) => {
      const key = error instanceof HttpErrorResponse ? messageKey(error.status) : null
      const now = Date.now()
      if (key && messages && !req.context.get(SKIP_ERROR_TOAST)) {
        if (lastToast.key !== key || now - lastToast.at > REPEAT_WINDOW_MS) {
          lastToast = { key, at: now }
          messages.add({ severity: 'error', summary: transloco?.translate(key) ?? key, life: 4000 })
        }
      }
      return throwError(() => error)
    }),
  )
}
