import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'

/**
 * Eye button that shows or hides the password of `target`. Place it inside a `relative` wrapper
 * next to the input; it sits at the right edge, vertically centred.
 */
@Component({
  selector: 'app-auth-password-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent, TranslocoPipe],
  host: { class: 'absolute right-0.5 top-1/2 flex -translate-y-1/2' },
  template: `
    <button
      type="button"
      tabindex="-1"
      class="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-hover"
      [attr.aria-label]="(visible() ? 'auth.hidePassword' : 'auth.showPassword') | transloco"
      [attr.aria-pressed]="visible()"
      (click)="toggle()"
    >
      <ui-icon class="icon-size-5" [svgIcon]="visible() ? 'heroicons_solid:eye-slash' : 'heroicons_solid:eye'" />
    </button>
  `,
})
export class AuthPasswordToggleComponent {
  readonly target = input.required<HTMLInputElement>()
  protected readonly visible = signal(false)

  protected toggle(): void {
    const visible = !this.visible()
    this.visible.set(visible)
    this.target().type = visible ? 'text' : 'password'
  }
}
