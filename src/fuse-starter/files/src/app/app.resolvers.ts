import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { UserService } from 'app/core/user/user.service'
import { NotificationsService } from 'app/layout/common/notifications/notifications.service'
import { catchError, forkJoin, of } from 'rxjs'

/** Loads what the admin layouts need. A navigation failure fails the navigation; notifications may fail. */
export const initialDataResolver: ResolveFn<unknown> = () => {
  const users = inject(UserService)
  const user = users.user()
  return forkJoin([
    inject(NavigationService).load(),
    inject(NotificationsService)
      .getAll()
      .pipe(catchError(() => of([]))),
    user ? of(user) : users.load(),
  ])
}
