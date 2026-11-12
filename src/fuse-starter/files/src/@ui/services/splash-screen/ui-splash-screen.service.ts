import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router } from '@angular/router'
import { filter, take } from 'rxjs'

/** Body class that hides the `<ui-splash-screen>` element (the CSS ships with the global styles). */
export const UI_SPLASH_SCREEN_HIDDEN_CLASS = 'ui-splash-screen-hidden'

/**
 * Controls the `<ui-splash-screen>` element from `index.html`. When created (eagerly, by `provideUi()`),
 * it hides the splash after the first navigation ends, is cancelled or fails.
 */
@Injectable({ providedIn: 'root' })
export class UiSplashScreenService {
  private readonly document = inject(DOCUMENT)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly state = signal(!this.document.body?.classList.contains(UI_SPLASH_SCREEN_HIDDEN_CLASS))

  /** Whether the splash screen is shown. */
  readonly visible = this.state.asReadonly()

  constructor() {
    const router = inject(Router, { optional: true })
    if (!this.isBrowser || !router) return
    if (router.navigated) {
      this.hide()
      return
    }
    router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError ||
            event instanceof NavigationSkipped,
        ),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.hide())
  }

  show(): void {
    this.document.body?.classList.remove(UI_SPLASH_SCREEN_HIDDEN_CLASS)
    this.state.set(true)
  }

  hide(): void {
    this.document.body?.classList.add(UI_SPLASH_SCREEN_HIDDEN_CLASS)
    this.state.set(false)
  }
}
