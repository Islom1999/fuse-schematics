import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { UserService } from 'app/core/user/user.service'
import { UserComponent } from 'app/layout/common/user/user.component'
import { VerticalFooterComponent } from '../shared/vertical-footer.component'
import { MAIN_NAVIGATION, VerticalHeaderComponent } from '../shared/vertical-header.component'

/** Futuristic layout: indigo navigation with the user menu, name and email pinned to its bottom. */
@Component({
  selector: 'app-futuristic-layout',
  imports: [
    RouterOutlet,
    TranslocoPipe,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    UserComponent,
    VerticalFooterComponent,
    VerticalHeaderComponent,
  ],
  templateUrl: './futuristic.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-auto' },
})
export class FuturisticLayoutComponent {
  protected readonly navigationName = MAIN_NAVIGATION
  protected readonly navigation = inject(NavigationService).navigation
  protected readonly user = inject(UserService).user
  protected readonly isScreenSmall = inject(UiMediaWatcherService).isLtMd
}
