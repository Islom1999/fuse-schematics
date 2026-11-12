import { DestroyRef, signal, Signal } from '@angular/core'

/**
 * A live boolean signal for one CSS media query. Without `matchMedia` (server, old engines) it is
 * always `false`. The listener is removed when `destroyRef` is destroyed.
 */
export function uiMediaQuerySignal(win: Window | null, query: string, destroyRef: DestroyRef): Signal<boolean> {
  if (!win || typeof win.matchMedia !== 'function') return signal(false).asReadonly()

  const list = win.matchMedia(query)
  const matches = signal(list.matches)
  const listener = (event: MediaQueryListEvent) => matches.set(event.matches)
  list.addEventListener('change', listener)
  destroyRef.onDestroy(() => list.removeEventListener('change', listener))
  return matches.asReadonly()
}
