import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { UserService } from 'app/core/user/user.service'
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component'
import { UserComponent } from 'app/layout/common/user/user.component'
import { userInitials } from '../shared/user-initials'
import { MAIN_NAVIGATION, VerticalHeaderComponent } from '../shared/vertical-header.component'

/**
 * Classy layout (the default): dark navigation with notifications, the user menu and a user card
 * at the top, and a faint logo below the items. No footer.
 */
@Component({
  selector: 'app-classy-layout',
  imports: [
    NotificationsComponent,
    RouterOutlet,
    TranslocoPipe,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    UserComponent,
    VerticalHeaderComponent,
  ],
  templateUrl: './classy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-auto' },
})
export class ClassyLayoutComponent {
  protected readonly navigationName = MAIN_NAVIGATION
  protected readonly navigation = inject(NavigationService).navigation
  protected readonly user = inject(UserService).user
  protected readonly isScreenSmall = inject(UiMediaWatcherService).isLtMd
  protected readonly initials = computed(() => userInitials(this.user()?.name))
}
