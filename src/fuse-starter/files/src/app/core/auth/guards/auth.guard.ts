import { inject } from '@angular/core'
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router'
import { AuthService } from 'app/core/auth/auth.service'
import { map } from 'rxjs'

/** Lets signed-in users through; others go to `/sign-in?redirectURL=<target>`. */
export const authGuard: CanActivateFn & CanActivateChildFn = (_route, state) => {
  const router = inject(Router)
  return inject(AuthService)
    .check()
    .pipe(
      map((authenticated) => {
        if (authenticated) return true
        const queryParams = state.url && state.url !== '/' && state.url !== '/sign-out' ? { redirectURL: state.url } : {}
        return router.createUrlTree(['/sign-in'], { queryParams })
      }),
    )
}
