import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { VerticalFooterComponent } from '../shared/vertical-footer.component'
import { MAIN_NAVIGATION, VerticalHeaderComponent } from '../shared/vertical-header.component'

/** Thin layout: light 80 px icon-only navigation (card background), top bar and footer. */
@Component({
  selector: 'app-thin-layout',
  imports: [
    RouterOutlet,
    TranslocoPipe,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    VerticalFooterComponent,
    VerticalHeaderComponent,
  ],
  templateUrl: './thin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-auto' },
})
export class ThinLayoutComponent {
  protected readonly navigationName = MAIN_NAVIGATION
  protected readonly navigation = inject(NavigationService).navigation
  protected readonly isScreenSmall = inject(UiMediaWatcherService).isLtMd
}
