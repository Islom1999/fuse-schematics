import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { uiRandomId } from '@ui/services/utils/ui-utils'
import { UiAlertIconDirective, UiAlertTitleDirective } from './ui-alert.directives'
import { UiAlertService } from './ui-alert.service'
import { UI_ALERT_ICONS, UiAlertAppearance, uiAlertTone, UiAlertType } from './ui-alert.types'

const STORAGE_PREFIX = 'ui-alert:'

function readDismissal(name: string): boolean | undefined {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_PREFIX + name)
    return value === null || value === undefined ? undefined : value === 'true'
  } catch {
    return undefined
  }
}

function writeDismissal(name: string, dismissed: boolean): void {
  try {
    if (dismissed) globalThis.localStorage?.setItem(STORAGE_PREFIX + name, 'true')
    else globalThis.localStorage?.removeItem(STORAGE_PREFIX + name)
  } catch {
    // Storage unavailable or full: the dismissal is simply not remembered.
  }
}

/**
 * Inline message box with eight types and four appearances, an optional icon and title,
 * and optional dismissal (addressable by name through `UiAlertService`).
 * Slots: `[uiAlertTitle]`, `[uiAlertIcon]`, default slot = message.
 */
@Component({
  selector: 'ui-alert',
  exportAs: 'uiAlert',
  standalone: true,
  imports: [UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
  template: `
    @if (visible()) {
      <div
        class="ui-alert-container"
        [class]="containerClass()"
        [attr.role]="role()"
        [animate.enter]="enterClass()"
        animate.leave="ui-alert-leave"
      >
        @if (tone().stripe) {
          <div class="ui-alert-stripe" [class]="tone().stripe"></div>
        }
        @if (showIcon()) {
          <div class="ui-alert-icon" [class]="tone().icon">
            <ng-content select="[uiAlertIcon]" />
            @if (!customIcon()) {
              <ui-icon class="icon-size-5" [icon]="defaultIcon()" />
            }
          </div>
        }
        <div class="ui-alert-content">
          @if (titleSlot()) {
            <div class="ui-alert-title" [class]="tone().title"><ng-content select="[uiAlertTitle]" /></div>
          }
          <div class="ui-alert-message" [class]="tone().message"><ng-content /></div>
        </div>
        @if (dismissible()) {
          <button
            type="button"
            class="ui-alert-dismiss"
            [class]="tone().close"
            aria-label="Dismiss"
            (click)="dismiss()"
          >
            <ui-icon class="icon-size-4" icon="pi pi-times" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ui-alert-container {
      position: relative;
      display: flex;
      padding: 16px;
      border-radius: 6px;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .ui-alert-appearance-border {
      overflow: hidden;
    }

    .ui-alert-stripe {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 4px;
    }

    .ui-alert-icon {
      display: flex;
      flex-shrink: 0;
      align-self: flex-start;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin-right: 12px;
      border-radius: 50%;
      color: currentColor;
    }

    .ui-alert-content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      line-height: 20px;
    }

    .ui-alert-is-dismissible .ui-alert-content {
      margin-right: 32px;
    }

    .ui-alert-title {
      font-weight: 600;
      line-height: 20px;
    }

    .ui-alert-message {
      line-height: 20px;
    }

    .ui-alert-message:empty {
      display: none;
    }

    .ui-alert-title + .ui-alert-message {
      margin-top: 4px;
    }

    .ui-alert-dismiss {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
      isolation: isolate;
    }

    .ui-alert-dismiss::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background: currentColor;
      opacity: 0;
      transition: opacity 150ms ease;
    }

    .ui-alert-dismiss:hover::before {
      opacity: 0.1;
    }

    .ui-alert-dismiss:active::before {
      opacity: 0.16;
    }

    .ui-alert-dismiss:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    .ui-alert-enter {
      animation: ui-alert-fade-in var(--ui-duration-entering, 225ms)
        var(--ui-ease-decelerate, cubic-bezier(0, 0, 0.2, 1));
    }

    .ui-alert-leave {
      animation: ui-alert-fade-out var(--ui-duration-exiting, 195ms)
        var(--ui-ease-accelerate, cubic-bezier(0.4, 0, 1, 1)) forwards;
    }

    @keyframes ui-alert-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ui-alert-fade-out {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ui-alert-enter,
      .ui-alert-leave {
        animation: none;
      }
    }
  `,
})
export class UiAlertComponent implements OnInit {
  private readonly alerts = inject(UiAlertService)

  readonly appearance = input<UiAlertAppearance>('soft')
  readonly type = input<UiAlertType>('primary')
  /** Name used by `UiAlertService` and as the persistence key. Random by default. */
  readonly name = input<string>(uiRandomId())
  readonly dismissible = input(false, { transform: booleanAttribute })
  /** Two-way: `[(dismissed)]`. Ignored while the alert is not dismissible. */
  readonly dismissed = model(false)
  readonly showIcon = input(true, { transform: booleanAttribute })
  /** Remember the dismissal across reloads in localStorage under `ui-alert:<name>`. */
  readonly persistDismissal = input(false, { transform: booleanAttribute })

  protected readonly customIcon = contentChild(UiAlertIconDirective)
  protected readonly titleSlot = contentChild(UiAlertTitleDirective)

  /** Rendered unless dismissible and dismissed. */
  protected readonly visible = computed(() => !this.dismissible() || !this.dismissed())
  protected readonly tone = computed(() => uiAlertTone(this.type(), this.appearance()))
  protected readonly defaultIcon = computed(() => UI_ALERT_ICONS[this.type()] ?? UI_ALERT_ICONS.primary)
  protected readonly role = computed(() => {
    const type = this.type()
    return type === 'error' || type === 'warn' || type === 'warning' ? 'alert' : 'status'
  })
  protected readonly hostClass = computed(
    () => `ui-alert ui-alert-appearance-${this.appearance()} ui-alert-type-${this.type()}`,
  )
  protected readonly containerClass = computed(() => {
    const classes = [`ui-alert-appearance-${this.appearance()}`, this.tone().box]
    if (this.dismissible()) classes.push('ui-alert-is-dismissible')
    return classes.join(' ')
  })

  // No enter animation on the first render, so alerts that start visible do not flash.
  private readonly ready = signal(false)
  protected readonly enterClass = computed(() => (this.ready() ? 'ui-alert-enter' : ''))

  constructor() {
    inject(DestroyRef).onDestroy(this.alerts.register(this))
    afterNextRender(() => this.ready.set(true))
  }

  ngOnInit(): void {
    if (!this.dismissible()) return
    const name = this.name()
    const initial = (this.persistDismissal() ? readDismissal(name) : undefined) ?? this.alerts.requested(name)
    if (initial !== undefined && initial !== this.dismissed()) this.dismissed.set(initial)
  }

  /** Hides a dismissible alert and emits `dismissedChange(true)`. No-op otherwise. */
  dismiss(): void {
    this.setDismissed(true)
  }

  /** Shows a dismissed alert again and emits `dismissedChange(false)`. No-op otherwise. */
  show(): void {
    this.setDismissed(false)
  }

  private setDismissed(value: boolean): void {
    if (!this.dismissible() || this.dismissed() === value) return
    this.dismissed.set(value)
    const name = this.name()
    if (this.persistDismissal()) writeDismissal(name, value)
    this.alerts.report(name, value)
  }
}
