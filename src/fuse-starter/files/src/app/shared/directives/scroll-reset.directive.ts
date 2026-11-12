import { DestroyRef, Directive, ElementRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'

/**
 * Scrolls the host element back to the top after every completed navigation.
 * Put it on the scrollable container of a layout or page:
 *
 *   <div class="overflow-y-auto" appScrollReset>...</div>
 */
@Directive({
  selector: '[appScrollReset]',
  standalone: true,
})
export class ScrollResetDirective {
  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        element.scrollTop = 0
        element.scrollLeft = 0
      })
  }
}
