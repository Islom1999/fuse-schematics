import { Observable } from 'rxjs'

export type UiConfirmationColor = 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error'

export type UiConfirmationResult = 'confirmed' | 'cancelled' | undefined

export interface UiConfirmationConfig {
  /** May contain simple HTML (sanitized). */
  title?: string
  /** May contain simple HTML (sanitized). */
  message?: string
  icon?: { show?: boolean; name?: string; color?: UiConfirmationColor }
  actions?: {
    confirm?: { show?: boolean; label?: string; color?: 'primary' | 'accent' | 'warn' }
    cancel?: { show?: boolean; label?: string }
  }
  /** Shows a close button and lets Esc and the mask close the dialog (result `undefined`). */
  dismissible?: boolean
}

/** A config with every default filled in. */
export interface UiConfirmationResolvedConfig {
  title: string
  message: string
  icon: { show: boolean; name: string; color: UiConfirmationColor }
  actions: {
    confirm: { show: boolean; label: string; color: 'primary' | 'accent' | 'warn' }
    cancel: { show: boolean; label: string }
  }
  dismissible: boolean
}

export interface UiConfirmationRef {
  /** Emits once with the result, then completes. */
  readonly onClose: Observable<UiConfirmationResult>
  /** Same result as a promise. */
  readonly closed: Promise<UiConfirmationResult>
  close(result?: UiConfirmationResult): void
}

export const UI_CONFIRMATION_DEFAULTS: UiConfirmationResolvedConfig = {
  title: 'Confirm action',
  message: 'Are you sure you want to confirm this action?',
  icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
  actions: {
    confirm: { show: true, label: 'Confirm', color: 'warn' },
    cancel: { show: true, label: 'Cancel' },
  },
  dismissible: false,
}
