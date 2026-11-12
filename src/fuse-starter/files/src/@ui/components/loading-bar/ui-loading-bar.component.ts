import { booleanAttribute, ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core'
import { ProgressBar } from 'primeng/progressbar'
import { UiLoadingService } from './ui-loading.service'

/**
 * 6 px progress bar fixed to the top of the viewport. All state comes from `UiLoadingService`,
 * so one service drives every layout.
 */
@Component({
  selector: 'ui-loading-bar',
  standalone: true,
  imports: [ProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-loading-bar' },
  template: `
    @if (loading.visible()) {
      <p-progressbar
        role="progressbar"
        aria-label="Loading"
        [mode]="loading.mode()"
        [value]="loading.progress()"
        [showValue]="false"
      />
    }
  `,
  styles: `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999;
      display: block;
      width: 100%;
      height: 6px;
      pointer-events: none;
      --p-progressbar-height: 6px;
      --p-progressbar-border-radius: 0;
    }

    p-progressbar {
      display: block;
      width: 100%;
      height: 6px;
      border-radius: 0;
    }

    @media print {
      :host {
        display: none;
      }
    }
  `,
})
export class UiLoadingBarComponent {
  protected readonly loading = inject(UiLoadingService)

  /** When it changes, it sets the service's auto mode. Default true. */
  readonly autoMode = input(true, { transform: booleanAttribute })

  constructor() {
    // The default (true) does not override a mode set in code; only a bound value change does.
    let applied = true
    effect(() => {
      const value = this.autoMode()
      if (value === applied) return
      applied = value
      this.loading.setAutoMode(value)
    })
  }
}
