import { Injectable, Signal, signal, WritableSignal } from '@angular/core'

/** What the service needs from a live alert. */
export interface UiAlertRef {
  name(): string
  dismiss(): void
  show(): void
}

/**
 * Dismisses or shows alerts by name. The last requested state per name is kept,
 * so an alert created later with that name starts in that state.
 */
@Injectable({ providedIn: 'root' })
export class UiAlertService {
  private readonly states = new Map<string, WritableSignal<boolean>>()
  private readonly alerts = new Set<UiAlertRef>()

  /** Dismisses every live alert with this name. */
  dismiss(name: string): void {
    this.request(name, true)
  }

  /** Shows every live alert with this name. */
  show(name: string): void {
    this.request(name, false)
  }

  /** Reactive dismissed state for a name (false when unknown). */
  isDismissed(name: string): Signal<boolean> {
    if (!name) return signal(false).asReadonly()
    return this.state(name).asReadonly()
  }

  /** @internal Last requested state for a name, or undefined when none was requested. */
  requested(name: string): boolean | undefined {
    return this.states.get(name)?.()
  }

  /** @internal Called by an alert when its own state changes, so `isDismissed()` stays accurate. */
  report(name: string, dismissed: boolean): void {
    this.states.get(name)?.set(dismissed)
  }

  /** @internal */
  register(alert: UiAlertRef): () => void {
    this.alerts.add(alert)
    return () => this.alerts.delete(alert)
  }

  private request(name: string, dismissed: boolean): void {
    if (!name) return
    this.state(name).set(dismissed)
    for (const alert of [...this.alerts]) {
      if (alert.name() !== name) continue
      if (dismissed) alert.dismiss()
      else alert.show()
    }
  }

  private state(name: string): WritableSignal<boolean> {
    let state = this.states.get(name)
    if (!state) {
      state = signal(false)
      this.states.set(name, state)
    }
    return state
  }
}
