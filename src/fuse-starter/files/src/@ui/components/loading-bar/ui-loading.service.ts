import { computed, Injectable, signal } from '@angular/core'

export type UiLoadingMode = 'determinate' | 'indeterminate'

/**
 * State of the top loading bar. Requests are counted per instance by `uiLoadingInterceptor`;
 * code can also drive the bar by hand with `show()` / `hide()` and determinate progress.
 */
@Injectable({ providedIn: 'root' })
export class UiLoadingService {
  private readonly _auto = signal(true)
  private readonly _mode = signal<UiLoadingMode>('indeterminate')
  private readonly _progress = signal(0)
  private readonly _manual = signal(false)
  private readonly _pending = signal(0)

  /** Whether HTTP requests show the bar automatically. */
  readonly auto = this._auto.asReadonly()
  readonly mode = this._mode.asReadonly()
  /** Determinate progress, 0..100. */
  readonly progress = this._progress.asReadonly()
  /** Number of tracked in-flight requests. */
  readonly pendingRequests = this._pending.asReadonly()
  /** True while shown by hand or while any tracked request is pending. */
  readonly visible = computed(() => this._manual() || this._pending() > 0)

  show(): void {
    this._manual.set(true)
  }

  hide(): void {
    this._manual.set(false)
  }

  setAutoMode(value: boolean): void {
    this._auto.set(value)
  }

  setMode(value: UiLoadingMode): void {
    this._mode.set(value)
  }

  /** Sets determinate progress; values outside 0..100 are rejected. */
  setProgress(value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      console.error(`UiLoadingService: progress must be between 0 and 100, got ${value}`)
      return
    }
    this._progress.set(value)
  }

  /** Registers one in-flight request. Returns an idempotent function that ends it. */
  beginRequest(): () => void {
    this._pending.update((count) => count + 1)
    let ended = false
    return () => {
      if (ended) return
      ended = true
      this._pending.update((count) => Math.max(0, count - 1))
    }
  }
}
