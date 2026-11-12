import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  input,
  signal,
  TemplateRef,
} from '@angular/core'
import { ButtonDirective } from 'primeng/button'
import { Tooltip } from 'primeng/tooltip'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitFullscreenEnabled?: boolean
  webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

/**
 * Toolbar icon button that toggles browser fullscreen for the whole document.
 * Renders nothing when the Fullscreen API is unavailable.
 */
@Component({
  selector: 'ui-fullscreen',
  exportAs: 'uiFullscreen',
  standalone: true,
  imports: [ButtonDirective, NgTemplateOutlet, Tooltip, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-fullscreen',
    '(document:fullscreenchange)': 'sync()',
    '(document:webkitfullscreenchange)': 'sync()',
  },
  template: `
    @if (supported()) {
      <button
        type="button"
        pButton
        class="ui-fullscreen-button p-button-icon-only"
        [text]="true"
        [rounded]="true"
        [pTooltip]="tooltip()"
        [attr.aria-label]="tooltip()"
        [attr.aria-pressed]="isFullscreen()"
        (click)="toggle()"
      >
        @if (iconTemplate(); as template) {
          <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: isFullscreen() }" />
        } @else {
          <ui-icon [icon]="glyph()" />
        }
      </button>
    }
  `,
  styles: `
    .ui-fullscreen-button {
      width: 2.5rem;
      height: 2.5rem;
      padding: 0.5rem 0;
      border-radius: 50%;
    }
  `,
})
export class UiFullscreenComponent {
  private readonly document = inject(DOCUMENT) as FullscreenDocument

  /** Tooltip and accessible label of the button. */
  readonly tooltip = input<string>('Toggle Fullscreen')
  /** Optional custom icon template; replaces the default glyph. Context: `$implicit` = isFullscreen. */
  readonly iconTemplate = input<TemplateRef<unknown> | undefined>(undefined)

  private readonly _isFullscreen = signal(this.currentElement() !== null)
  /** True while the document is in fullscreen; follows `fullscreenchange`. */
  readonly isFullscreen = this._isFullscreen.asReadonly()
  /** False when the Fullscreen API is unavailable. */
  readonly supported = signal(this.detectSupport()).asReadonly()

  protected readonly glyph = computed(() => (this.isFullscreen() ? 'pi pi-window-minimize' : 'pi pi-window-maximize'))

  /** Exits fullscreen when active, otherwise enters it on the document element. */
  toggle(): void {
    if (this.currentElement()) void this.exit()
    else void this.enter()
  }

  async enter(): Promise<void> {
    const element = this.document.documentElement as FullscreenElement
    const request = element.requestFullscreen ?? element.webkitRequestFullscreen
    if (!request) return
    try {
      await request.call(element)
    } catch (error) {
      console.debug('UiFullscreen: request rejected', error)
    }
    this.sync()
  }

  async exit(): Promise<void> {
    const doc = this.document
    const leave = doc.exitFullscreen ?? doc.webkitExitFullscreen
    if (!leave || !this.currentElement()) return
    try {
      await leave.call(doc)
    } catch (error) {
      console.debug('UiFullscreen: exit rejected', error)
    }
    this.sync()
  }

  protected sync(): void {
    this._isFullscreen.set(this.currentElement() !== null)
  }

  private currentElement(): Element | null {
    return this.document.fullscreenElement ?? this.document.webkitFullscreenElement ?? null
  }

  private detectSupport(): boolean {
    const element = this.document.documentElement as FullscreenElement | null
    if (!element || !(element.requestFullscreen || element.webkitRequestFullscreen)) return false
    return (this.document.fullscreenEnabled ?? this.document.webkitFullscreenEnabled) !== false
  }
}
