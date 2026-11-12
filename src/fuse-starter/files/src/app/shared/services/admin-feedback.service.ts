import { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { UiConfirmationService } from '@ui/services/confirmation'
import { MessageService } from 'primeng/api'
import { filter, map, Observable } from 'rxjs'

/** Toasts and confirmation dialogs used by the admin pages; texts are i18n keys. */
@Injectable({ providedIn: 'root' })
export class AdminFeedbackService {
  private readonly messages = inject(MessageService)
  private readonly transloco = inject(TranslocoService)
  private readonly confirmation = inject(UiConfirmationService)

  success(key: string, params?: Record<string, unknown>): void {
    this.messages.add({ severity: 'success', summary: this.transloco.translate(key, params), life: 3000 })
  }

  /**
   * Shows the message of a failed request. The error interceptor already toasts network errors,
   * 403 and 5xx, so only the other statuses (400, 404, 409, ...) are shown here.
   */
  httpError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse) || error.status === 0 || error.status === 403 || error.status >= 500) {
      return
    }
    const message = (error.error as { message?: string | string[] } | null)?.message
    const detail = Array.isArray(message) ? message.join(', ') : message
    this.messages.add({
      severity: 'error',
      summary: detail || this.transloco.translate('errors.server'),
      life: 5000,
    })
  }

  /** Emits `true` once when the user confirms; never emits when they cancel. */
  confirm(titleKey: string, messageKey: string, confirmKey = 'admin.common.confirm'): Observable<true> {
    return this.confirmation
      .open({
        title: this.transloco.translate(titleKey),
        message: this.transloco.translate(messageKey),
        actions: {
          confirm: { show: true, label: this.transloco.translate(confirmKey), color: 'warn' },
          cancel: { show: true, label: this.transloco.translate('admin.common.cancel') },
        },
        dismissible: true,
      })
      .onClose.pipe(
        filter((result) => result === 'confirmed'),
        map(() => true as const),
      )
  }
}
