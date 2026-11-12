import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiVerticalNavigationAppearance } from '@ui/navigation/navigation.types'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { ButtonDirective } from 'primeng/button'
import { VerticalFooterComponent } from '../shared/vertical-footer.component'
import { MAIN_NAVIGATION, VerticalHeaderComponent } from '../shared/vertical-header.component'

/** Dense layout: dark 80 px icon rail that expands on hover, with a header toggle to the full width. */
@Component({
  selector: 'app-dense-layout',
  imports: [
    ButtonDirective,
    RouterOutlet,
    TranslocoPipe,
    UiIconComponent,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    VerticalFooterComponent,
    VerticalHeaderComponent,
  ],
  templateUrl: './dense.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-auto' },
})
export class DenseLayoutComponent {
  protected readonly navigationName = MAIN_NAVIGATION
  protected readonly navigation = inject(NavigationService).navigation
  protected readonly isScreenSmall = inject(UiMediaWatcherService).isLtMd

  /** `dense` on desktop, `default` on small screens; reset on every breakpoint change. */
  protected readonly appearance = linkedSignal<UiVerticalNavigationAppearance>(() =>
    this.isScreenSmall() ? 'default' : 'dense',
  )

  protected toggleAppearance(): void {
    this.appearance.update((appearance) => (appearance === 'dense' ? 'default' : 'dense'))
  }
}
