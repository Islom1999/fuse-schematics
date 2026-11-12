import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, viewChild } from '@angular/core'
import { Router } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent } from '@ui'
import { User } from 'app/core/user/user.types'
import { UserService } from 'app/core/user/user.service'
import { environment } from 'environments/environment'
import { ButtonDirective } from 'primeng/button'
import { Popover } from 'primeng/popover'

export type UserStatus = NonNullable<User['status']>

/** Route of the "Profile" item; `null` = placeholder that only closes the menu. */
export const PROFILE_ROUTE: string | null = null
/** Route of the "Settings" item; `null` = placeholder that only closes the menu. */
export const SETTINGS_ROUTE: string | null = null
/** Route that performs the sign-out. */
export const SIGN_OUT_ROUTE = '/sign-out'

/** Status options of the user menu: value, i18n key and dot color class. */
export const USER_STATUSES: readonly { value: UserStatus; label: string; dot: string }[] = [
  { value: 'online', label: 'user.statuses.online', dot: 'bg-green-500' },
  { value: 'away', label: 'user.statuses.away', dot: 'bg-amber-500' },
  { value: 'busy', label: 'user.statuses.busy', dot: 'bg-red-500' },
  { value: 'not-visible', label: 'user.statuses.invisible', dot: 'bg-gray-400' },
]

/** Header user menu: avatar (or initials, or an icon) with the signed-in email, status and sign out. */
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [ButtonDirective, Popover, TranslocoPipe, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user.component.html',
})
export class UserComponent {
  private readonly userService = inject(UserService)
  private readonly router = inject(Router)
  private readonly popover = viewChild.required<Popover>('popover')

  /** Show the user's picture (or initials) in the trigger; `false` shows the user-circle icon. */
  readonly showAvatar = input(true)

  protected readonly user = this.userService.user
  /** The status section and the dot exist only with `features.userStatus`. */
  protected readonly statusEnabled = environment.features.userStatus
  protected readonly statuses = USER_STATUSES
  protected readonly statusOpen = signal(false)
  protected readonly profileRoute = PROFILE_ROUTE
  protected readonly settingsRoute = SETTINGS_ROUTE

  protected readonly initials = computed(() => {
    const user = this.user()
    const source = user?.name?.trim() || user?.email || ''
    const words = source.split(/\s+/).filter(Boolean)
    return ((words[0]?.charAt(0) ?? '') + (words.length > 1 ? words[words.length - 1].charAt(0) : '')).toUpperCase()
  })

  protected readonly statusDot = computed(() => {
    const status = this.statusEnabled ? this.user()?.status : undefined
    return status ? (USER_STATUSES.find((item) => item.value === status)?.dot ?? null) : null
  })

  protected openRoute(route: string | null): void {
    this.popover().hide()
    if (route) void this.router.navigateByUrl(route)
  }

  protected setStatus(status: UserStatus): void {
    const user = this.user()
    if (!user) return
    this.userService.update({ status }).subscribe({
      error: (error: unknown) => {
        // No PATCH /auth/me on the backend yet: keep the status on the client only.
        if (error instanceof HttpErrorResponse && (error.status === 404 || error.status === 405)) {
          this.userService.set({ ...user, status })
        }
      },
    })
    this.popover().hide()
  }

  protected signOut(): void {
    this.popover().hide()
    void this.router.navigateByUrl(SIGN_OUT_ROUTE)
  }
}
