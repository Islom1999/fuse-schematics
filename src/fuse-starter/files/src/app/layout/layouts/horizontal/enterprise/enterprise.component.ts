import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiFullscreenComponent } from '@ui/components/fullscreen'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'
import { UiHorizontalNavigationComponent } from '@ui/navigation/horizontal'
import { UiNavigationService } from '@ui/navigation/navigation.service'
import { UiNavigationComponentRef } from '@ui/navigation/navigation.types'
import { UiVerticalNavigationComponent } from '@ui/navigation/vertical'
import { UiMediaWatcherService } from '@ui/services/media-watcher'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { LanguagesComponent } from 'app/layout/common/languages/languages.component'
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component'
import { SearchComponent } from 'app/layout/common/search/search.component'
import { UserComponent } from 'app/layout/common/user/user.component'
import { ButtonDirective } from 'primeng/button'

/** Horizontal layout: a dark top bar (logo and actions) above a light bar with the horizontal navigation. */
@Component({
  selector: 'app-enterprise-layout',
  standalone: true,
  imports: [
    ButtonDirective,
    LanguagesComponent,
    NotificationsComponent,
    RouterOutlet,
    SearchComponent,
    TranslocoPipe,
    UiFullscreenComponent,
    UiHorizontalNavigationComponent,
    UiIconComponent,
    UiLoadingBarComponent,
    UiVerticalNavigationComponent,
    UserComponent,
  ],
  templateUrl: './enterprise.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-auto w-full' },
})
export class EnterpriseLayoutComponent {
  private readonly navigationService = inject(NavigationService)
  private readonly uiNavigationService = inject(UiNavigationService)
  private readonly isMd = inject(UiMediaWatcherService).is('md')

  protected readonly navigation = this.navigationService.navigation
  protected readonly isScreenSmall = computed(() => !this.isMd())
  protected readonly currentYear = new Date().getFullYear()

  /** Toggles the registered navigation `name` (the small-screen drawer). */
  toggleNavigation(name: string): void {
    this.uiNavigationService.getComponent<UiNavigationComponentRef>(name)?.toggle?.()
  }
}
