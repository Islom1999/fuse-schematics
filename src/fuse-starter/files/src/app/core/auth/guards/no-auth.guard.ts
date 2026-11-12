import { inject } from '@angular/core'
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router'
import { AuthService } from 'app/core/auth/auth.service'
import { map } from 'rxjs'

/** Lets guests through; signed-in users go to `/`. */
export const noAuthGuard: CanActivateFn & CanActivateChildFn = () => {
  const router = inject(Router)
  return inject(AuthService)
    .check()
    .pipe(map((authenticated) => (authenticated ? router.parseUrl('/') : true)))
}
