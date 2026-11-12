import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  PLATFORM_ID,
} from '@angular/core'
import { ConfirmEventType } from 'primeng/api'
import { AsyncSubject } from 'rxjs'
import { UiConfirmationHostComponent } from './ui-confirmation-host.component'
import {
  UI_CONFIRMATION_DEFAULTS,
  UiConfirmationConfig,
  UiConfirmationRef,
  UiConfirmationResolvedConfig,
  UiConfirmationResult,
} from './ui-confirmation.types'

/**
 * Modal "are you sure?" dialog on PrimeNG `p-confirmdialog`. The dialog host is mounted on
 * `document.body` on the first `open()`, so apps need no template or provider changes.
 */
@Injectable({ providedIn: 'root' })
export class UiConfirmationService {
  private readonly appRef = inject(ApplicationRef)
  private readonly injector = inject(EnvironmentInjector)
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private host: ComponentRef<UiConfirmationHostComponent> | null = null
  private settleActive: ((result: UiConfirmationResult) => void) | null = null

  /** Opens a confirmation; `config` is deep-merged over the defaults. A dialog already open is replaced. */
  open(config: UiConfirmationConfig = {}): UiConfirmationRef {
    const resolved = resolveConfig(config)
    const subject = new AsyncSubject<UiConfirmationResult>()
    let resolvePromise!: (result: UiConfirmationResult) => void
    const closed = new Promise<UiConfirmationResult>((resolve) => (resolvePromise = resolve))
    const invoker = this.document.activeElement as HTMLElement | null

    let done = false
    const settle = (result: UiConfirmationResult) => {
      if (done) return
      done = true
      if (this.settleActive === settle) this.settleActive = null
      subject.next(result)
      subject.complete()
      resolvePromise(result)
      if (invoker && invoker !== this.document.body && invoker.isConnected) invoker.focus?.()
    }

    const ref: UiConfirmationRef = {
      onClose: subject.asObservable(),
      closed,
      close: (result?: UiConfirmationResult) => {
        if (done) return
        const active = this.settleActive === settle
        settle(result)
        if (active) this.host?.instance.hide()
      },
    }

    if (!this.isBrowser) {
      settle(undefined)
      return ref
    }

    this.settleActive?.(undefined)
    this.settleActive = settle
    this.ensureHost().show(resolved, {
      accept: () => settle('confirmed'),
      reject: (type) => settle(type === ConfirmEventType.REJECT ? 'cancelled' : undefined),
    })
    return ref
  }

  private ensureHost(): UiConfirmationHostComponent {
    if (!this.host) {
      this.host = createComponent(UiConfirmationHostComponent, { environmentInjector: this.injector })
      this.appRef.attachView(this.host.hostView)
      this.document.body.appendChild(this.host.location.nativeElement)
    }
    return this.host.instance
  }
}

function resolveConfig(config: UiConfirmationConfig): UiConfirmationResolvedConfig {
  const defaults = UI_CONFIRMATION_DEFAULTS
  return {
    title: config.title ?? defaults.title,
    message: config.message ?? defaults.message,
    icon: { ...defaults.icon, ...defined(config.icon) },
    actions: {
      confirm: { ...defaults.actions.confirm, ...defined(config.actions?.confirm) },
      cancel: { ...defaults.actions.cancel, ...defined(config.actions?.cancel) },
    },
    dismissible: config.dismissible ?? defaults.dismissible,
  }
}

/** Drops `undefined` values so they do not override defaults. */
function defined<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {}
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>
}
