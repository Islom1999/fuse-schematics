import { ChangeDetectionStrategy, Component } from '@angular/core'

/** 24 px white spinner shown in a submit button while its request runs. */
@Component({
  selector: 'app-auth-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex', role: 'progressbar', 'aria-busy': 'true' },
  template: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.3" stroke-width="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
  `,
  styles: `
    :host {
      color: #fff;
    }

    svg {
      animation: app-auth-spin 0.8s linear infinite;
    }

    @keyframes app-auth-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class AuthSpinnerComponent {}
