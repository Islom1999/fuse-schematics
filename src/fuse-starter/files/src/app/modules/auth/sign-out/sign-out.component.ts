import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { AuthService } from 'app/core/auth/auth.service'
import { interval, take } from 'rxjs'

const COUNTDOWN_SECONDS = 5

/** Signs out on entry, then counts down and goes to `/sign-in`. */
@Component({
  selector: 'app-sign-out',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
  host: { class: 'flex min-w-0 flex-auto flex-col' },
  template: `
    <div class="flex min-w-0 flex-auto flex-col sm:items-center sm:justify-center">
      <div class="w-full px-4 py-8 sm:w-auto sm:rounded-2xl sm:bg-card sm:p-12 sm:shadow">
        <div class="mx-auto flex w-80 max-w-full flex-col items-center text-center">
          <img class="w-12" src="assets/images/logo/logo.svg" [alt]="'auth.logoAlt' | transloco" />
          <h1 class="mt-8 text-4xl font-extrabold leading-10 tracking-tight">{{ 'auth.signOut.title' | transloco }}</h1>
          <p class="mt-0.5 font-medium" aria-live="polite">
            @switch (countdown()) {
              @case (0) {
                {{ 'auth.signOut.redirecting' | transloco }}
              }
              @case (1) {
                {{ 'auth.signOut.redirectingInOne' | transloco }}
              }
              @default {
                {{ 'auth.signOut.redirectingIn' | transloco: { seconds: countdown() } }}
              }
            }
          </p>
          <div class="mt-8 text-md font-medium">
            <a class="text-primary-500 hover:underline" routerLink="/sign-in">{{ 'auth.signOut.goToSignIn' | transloco }}</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SignOutComponent {
  private readonly router = inject(Router)
  protected readonly countdown = signal(COUNTDOWN_SECONDS)

  constructor() {
    inject(AuthService).signOut().subscribe()
    interval(1000)
      .pipe(take(COUNTDOWN_SECONDS), takeUntilDestroyed())
      .subscribe(() => {
        this.countdown.update((value) => value - 1)
        if (this.countdown() === 0) void this.router.navigateByUrl('/sign-in')
      })
  }
}
