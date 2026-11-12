import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { VerticalFooterComponent } from '../shared/vertical-footer.component'
import { MAIN_NAVIGATION, VerticalHeaderComponent } from '../shared/vertical-header.component'

/** Compact layout: dark 112 px navigation with stacked icon and title items. */
@Component({
  selector: 'app-compact-layout',
  imports: [
    RouterOutlet,
    TranslocoPipe,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    VerticalFooterComponent,
    VerticalHeaderComponent,
  ],
  templateUrl: './compact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-auto' },
})
export class CompactLayoutComponent {
  protected readonly navigationName = MAIN_NAVIGATION
  protected readonly navigation = inject(NavigationService).navigation
  protected readonly isScreenSmall = inject(UiMediaWatcherService).isLtMd
}
