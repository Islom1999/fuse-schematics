import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiFullscreenComponent } from '@ui/components/fullscreen'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiNavigationService } from '@ui/navigation/navigation.service'
import { LanguagesComponent } from 'app/layout/common/languages/languages.component'
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component'
import { SearchComponent } from 'app/layout/common/search/search.component'
import { UserComponent } from 'app/layout/common/user/user.component'
import { ButtonDirective } from 'primeng/button'

/** Name under which every vertical layout registers its main navigation. */
export const MAIN_NAVIGATION = 'mainNavigation'

/**
 * Top bar of the vertical layouts: hamburger, optional projected buttons next to it, and the
 * actions group (languages, fullscreen, search, notifications, user).
 */
@Component({
  selector: 'app-vertical-header',
  imports: [
    ButtonDirective,
    LanguagesComponent,
    NotificationsComponent,
    SearchComponent,
    TranslocoPipe,
    UiFullscreenComponent,
    UiIconComponent,
    UserComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <header
      class="relative z-49 flex h-16 w-full flex-0 items-center bg-card px-4 shadow md:px-6 dark:border-b dark:bg-transparent dark:shadow-none print:hidden"
    >
      <div class="flex items-center space-x-2 pr-2">
        <button
          type="button"
          pButton
          class="p-button-icon-only h-10 w-10 p-0"
          [text]="true"
          [rounded]="true"
          [attr.aria-label]="'layout.toggleNavigation' | transloco"
          (click)="toggleNavigation()"
        >
          <ui-icon class="icon-size-6" svgIcon="heroicons_outline:bars-3" />
        </button>
        <ng-content />
      </div>

      <div class="ml-auto flex items-center space-x-0.5 pl-2 sm:space-x-2">
        <app-languages />
        <ui-fullscreen class="hidden md:block" [tooltip]="'layout.fullscreen' | transloco" />
        <app-search appearance="bar" />
        @if (showNotifications()) {
          <app-notifications />
        }
        @if (showUser()) {
          <app-user />
        }
      </div>
    </header>
  `,
})
export class VerticalHeaderComponent {
  private readonly navigationService = inject(UiNavigationService)

  /** Show the notifications bell in the actions group. */
  readonly showNotifications = input(true)
  /** Show the user menu in the actions group. */
  readonly showUser = input(true)

  protected toggleNavigation(): void {
    this.navigationService.getComponent(MAIN_NAVIGATION)?.toggle?.()
  }
}
