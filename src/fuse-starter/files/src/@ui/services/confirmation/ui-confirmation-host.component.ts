import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { uiRandomId } from '@ui/services/utils/ui-utils'
import { ConfirmationService, ConfirmEventType } from 'primeng/api'
import { Button } from 'primeng/button'
import { ConfirmDialog } from 'primeng/confirmdialog'
import { UiConfirmationColor, UiConfirmationResolvedConfig } from './ui-confirmation.types'

/** `p-confirmdialog` key used by the host. */
export const UI_CONFIRMATION_KEY = 'ui-confirmation'

/** Callbacks of one opened confirmation. */
export interface UiConfirmationHandlers {
  accept: () => void
  reject: (type?: ConfirmEventType) => void
}

const ICON_COLORS: Record<UiConfirmationColor, string> = {
  primary: 'text-primary-600 bg-primary-100 dark:text-primary-50 dark:bg-primary-600',
  accent: 'text-accent-600 bg-accent-100 dark:text-accent-50 dark:bg-accent-600',
  warn: 'text-warn-600 bg-warn-100 dark:text-warn-50 dark:bg-warn-600',
  basic: 'text-gray-600 bg-gray-100 dark:text-gray-50 dark:bg-gray-600',
  info: 'text-blue-600 bg-blue-100 dark:text-blue-50 dark:bg-blue-600',
  success: 'text-green-500 bg-green-100 dark:text-green-50 dark:bg-green-500',
  warning: 'text-amber-500 bg-amber-100 dark:text-amber-50 dark:bg-amber-500',
  error: 'text-red-600 bg-red-100 dark:text-red-50 dark:bg-red-600',
}

const SEVERITIES = { primary: 'primary', accent: 'secondary', warn: 'danger' } as const

interface UiConfirmationPanelA11y {
  labelledBy: string | null
  describedBy: string | null
  focus: string | null
}

/** Sets the dialog's aria references and moves focus to the default action once the panel is rendered. */
@Directive({ selector: '[uiConfirmationPanel]' })
export class UiConfirmationPanelDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef)

  readonly uiConfirmationPanel = input.required<UiConfirmationPanelA11y>()

  constructor() {
    afterNextRender(() => {
      const a11y = this.uiConfirmationPanel()
      const panel = this.element.nativeElement
      const dialog = panel.closest('.p-dialog')
      setOrRemove(dialog, 'aria-labelledby', a11y.labelledBy)
      setOrRemove(dialog, 'aria-describedby', a11y.describedBy)
      if (a11y.focus) panel.querySelector<HTMLElement>(a11y.focus)?.focus()
    })
  }
}

/**
 * Internal host of `UiConfirmationService`: one `p-confirmdialog` with a headless template.
 * It is mounted on `document.body` by the service on the first `open()`.
 */
@Component({
  selector: 'ui-confirmation-host',
  standalone: true,
  imports: [ConfirmDialog, Button, UiIconComponent, UiConfirmationPanelDirective],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Static key: set before the first change detection, when open() already fires.
         appendTo self: the host already sits on body, and moving the panel later would drop focus. -->
    <p-confirmdialog
      key="ui-confirmation"
      appendTo="self"
      styleClass="ui-confirmation"
      maskStyleClass="ui-confirmation-mask"
    >
      <ng-template #headless>
        @if (view(); as view) {
          <div class="ui-confirmation-panel" [uiConfirmationPanel]="a11y()">
            @if (view.dismissible) {
              <button
                type="button"
                class="ui-confirmation-close text-secondary hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close"
                (click)="dismiss()"
              >
                <ui-icon svgIcon="heroicons_outline:x-mark" />
              </button>
            }

            @if (view.icon.show || view.title || view.message) {
              <div class="ui-confirmation-body">
                @if (view.icon.show) {
                  <div class="ui-confirmation-icon" [class]="iconClass()">
                    <ui-icon [svgIcon]="view.icon.name" />
                  </div>
                }
                @if (view.title || view.message) {
                  <div class="ui-confirmation-text">
                    @if (view.title) {
                      <h2 class="ui-confirmation-title" [id]="titleId" [innerHTML]="view.title"></h2>
                    }
                    @if (view.message) {
                      <div
                        class="ui-confirmation-message text-secondary"
                        [id]="messageId"
                        [innerHTML]="view.message"
                      ></div>
                    }
                  </div>
                }
              </div>
            }

            @if (view.actions.cancel.show || view.actions.confirm.show) {
              <div class="ui-confirmation-actions bg-gray-50 dark:bg-black/10">
                @if (view.actions.cancel.show) {
                  <p-button
                    styleClass="ui-confirmation-cancel"
                    [label]="view.actions.cancel.label"
                    [outlined]="true"
                    (onClick)="cancel()"
                  />
                }
                @if (view.actions.confirm.show) {
                  <p-button
                    styleClass="ui-confirmation-confirm"
                    [label]="view.actions.confirm.label"
                    [severity]="severity()"
                    (onClick)="confirm()"
                  />
                }
              </div>
            }
          </div>
        }
      </ng-template>
    </p-confirmdialog>
  `,
  styles: `
    .p-dialog.ui-confirmation {
      width: 420px;
      max-width: calc(100vw - 32px);
      border: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .ui-confirmation-panel {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .ui-confirmation-close {
      position: absolute;
      top: 16px;
      right: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
    }

    .ui-confirmation-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px 32px 24px;
      text-align: center;
    }

    .ui-confirmation-icon {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
    }

    .ui-confirmation-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .ui-confirmation-title {
      margin: 0;
      font-size: 18px;
      line-height: 24px;
      font-weight: 500;
    }

    .ui-confirmation-message {
      font-size: 14px;
    }

    .ui-confirmation-title + .ui-confirmation-message {
      margin-top: 4px;
    }

    .ui-confirmation-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 24px;
    }

    @media (min-width: 600px) {
      .ui-confirmation-body {
        flex-direction: row;
        align-items: flex-start;
        padding: 32px;
        text-align: start;
      }

      .ui-confirmation-text {
        padding-right: 32px;
      }

      .ui-confirmation-actions {
        justify-content: flex-end;
      }
    }
  `,
})
export class UiConfirmationHostComponent {
  private readonly confirmation = inject(ConfirmationService)
  private readonly dialog = viewChild.required(ConfirmDialog)

  protected readonly titleId = `ui-confirmation-title-${uiRandomId()}`
  protected readonly messageId = `ui-confirmation-message-${uiRandomId()}`
  protected readonly view = signal<UiConfirmationResolvedConfig | null>(null)

  protected readonly iconClass = computed(() => {
    const color = this.view()?.icon.color ?? 'warn'
    return ICON_COLORS[color] ?? ICON_COLORS.warn
  })
  protected readonly severity = computed(() => SEVERITIES[this.view()?.actions.confirm.color ?? 'warn'] ?? 'danger')
  protected readonly a11y = computed<UiConfirmationPanelA11y>(() => {
    const view = this.view()
    if (!view) return { labelledBy: null, describedBy: null, focus: null }
    const { confirm, cancel } = view.actions
    const safeFirst = confirm.color === 'warn'
    const focus =
      (safeFirst && cancel.show && '.ui-confirmation-cancel') ||
      (confirm.show && '.ui-confirmation-confirm') ||
      (cancel.show && '.ui-confirmation-cancel') ||
      (view.dismissible && '.ui-confirmation-close') ||
      null
    return {
      labelledBy: view.title ? this.titleId : null,
      describedBy: view.message ? this.messageId : null,
      focus,
    }
  })

  /** Shows `config`; replaces a confirmation that is already open. */
  show(config: UiConfirmationResolvedConfig, handlers: UiConfirmationHandlers): void {
    this.view.set(config)
    this.confirmation.confirm({
      key: UI_CONFIRMATION_KEY,
      modal: true,
      blockScroll: true,
      closable: config.dismissible,
      closeOnEscape: config.dismissible,
      dismissableMask: config.dismissible,
      defaultFocus: 'none',
      accept: handlers.accept,
      reject: handlers.reject,
    })
  }

  /** Hides the dialog without calling any handler. */
  hide(): void {
    this.confirmation.close()
  }

  protected confirm(): void {
    this.dialog().onAccept()
  }

  protected cancel(): void {
    this.dialog().onReject()
  }

  protected dismiss(): void {
    this.dialog().close()
  }
}

function setOrRemove(element: Element | null, name: string, value: string | null): void {
  if (!element) return
  if (value) element.setAttribute(name, value)
  else element.removeAttribute(name)
}
