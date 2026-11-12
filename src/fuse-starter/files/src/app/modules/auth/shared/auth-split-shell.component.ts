import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Page frame of sign-in, forgot-password and reset-password: the form column on the left and,
 * from `md`, a dark decorative panel on the right. The form content is projected.
 */
@Component({
  selector: 'app-auth-split-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  host: { class: 'flex min-w-0 flex-auto flex-col' },
  template: `
    <div
      class="flex min-w-0 flex-auto flex-col sm:flex-row sm:items-center sm:justify-center md:items-stretch md:justify-start"
    >
      <div
        class="w-full px-4 py-8 sm:w-auto sm:rounded-2xl sm:bg-card sm:p-12 sm:shadow md:flex md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none"
      >
        <div class="mx-auto w-80 max-w-full md:mx-0">
          <ng-content />
        </div>
      </div>

      <div
        class="relative hidden w-1/2 flex-auto items-center justify-center overflow-hidden bg-gray-800 p-16 md:flex lg:px-28 dark:border-l"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="auth-ring auth-ring-start"></div>
          <div class="auth-ring auth-ring-end"></div>
          <svg class="absolute -right-16 -top-16 text-gray-700" width="220" height="192" viewBox="0 0 220 192" fill="none">
            <defs>
              <pattern id="app-auth-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="4" y="4" width="4" height="4" rx="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="220" height="192" fill="url(#app-auth-dots)" />
          </svg>
        </div>

        <div class="relative z-10 w-full max-w-4xl">
          <div class="text-7xl font-bold leading-none text-gray-100">
            <div>{{ 'auth.panel.title1' | transloco }}</div>
            <div>{{ 'auth.panel.title2' | transloco }}</div>
          </div>
          <div class="mt-6 text-xl leading-7 tracking-tight text-gray-400">{{ 'auth.panel.text' | transloco }}</div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .auth-ring {
      position: absolute;
      border-radius: 9999px;
      border-style: solid;
      border-color: rgb(51 65 85 / 0.25);
    }

    .auth-ring-start {
      top: -366px;
      left: -506px;
      width: 872px;
      height: 872px;
      border-width: 166px;
    }

    .auth-ring-end {
      right: -482px;
      bottom: -281px;
      width: 818px;
      height: 818px;
      border-width: 156px;
    }
  `,
})
export class AuthSplitShellComponent {}
