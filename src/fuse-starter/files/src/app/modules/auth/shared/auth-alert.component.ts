import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiAlertComponent } from '@ui/components/alert/ui-alert.component'
import { AuthAlert } from './auth-form'

/** Outline alert for the auth forms. It shakes once when it appears. */
@Component({
  selector: 'app-auth-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiAlertComponent, TranslocoPipe],
  host: { class: 'block' },
  template: `
    <ui-alert appearance="outline" [type]="alert().type" [showIcon]="false">
      @if (alert().key; as key) {
        {{ key | transloco: alert().params }}
      } @else {
        {{ alert().text }}
      }
    </ui-alert>
  `,
  styles: `
    :host {
      animation: app-auth-alert-shake 400ms ease-in-out;
    }

    @keyframes app-auth-alert-shake {
      0%,
      100% {
        transform: translateX(0);
      }
      20%,
      60% {
        transform: translateX(-6px);
      }
      40%,
      80% {
        transform: translateX(6px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
})
export class AuthAlertComponent {
  readonly alert = input.required<AuthAlert>()
}
