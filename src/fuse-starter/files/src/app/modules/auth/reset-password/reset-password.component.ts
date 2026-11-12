import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiValidators } from '@ui/validators/ui-validators'
import { AuthService } from 'app/core/auth/auth.service'
import { ButtonDirective, ButtonLabel } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { AuthAlertComponent } from '../shared/auth-alert.component'
import { AuthAlert, authAlert, firstError, httpStatus } from '../shared/auth-form'
import { AuthPasswordToggleComponent } from '../shared/auth-password-toggle.component'
import { AuthSpinnerComponent } from '../shared/auth-spinner.component'
import { AuthSplitShellComponent } from '../shared/auth-split-shell.component'

/** Minimum password length (DECISIONS A3). */
export const PASSWORD_MIN_LENGTH = 8

const MESSAGES = {
  password: { required: 'auth.validation.passwordRequired', minlength: 'auth.validation.passwordMinLength' },
  passwordConfirm: {
    required: 'auth.validation.passwordConfirmRequired',
    mustMatch: 'auth.validation.passwordsMustMatch',
  },
}

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    InputText,
    ButtonDirective,
    ButtonLabel,
    AuthSplitShellComponent,
    AuthAlertComponent,
    AuthPasswordToggleComponent,
    AuthSpinnerComponent,
  ],
  host: { class: 'flex min-w-0 flex-auto flex-col' },
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService)
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token')

  protected readonly minLength = PASSWORD_MIN_LENGTH
  protected readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)],
      }),
      passwordConfirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: UiValidators.mustMatch('password', 'passwordConfirm') },
  )
  protected readonly busy = signal(false)
  /** No token in the link, or the password was reset: the form stays disabled. */
  protected readonly locked = signal(false)
  protected readonly alert = signal<AuthAlert | null>(null)

  constructor() {
    if (!this.token) this.lock(authAlert('error', 'auth.resetPassword.invalidToken'))
  }

  protected error(name: keyof typeof MESSAGES): string | null {
    return firstError(this.form.controls[name], MESSAGES[name])
  }

  protected submit(): void {
    if (this.busy() || this.locked() || !this.token) return
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.busy.set(true)
    this.alert.set(null)
    const { password } = this.form.getRawValue()
    this.form.disable()

    this.auth.resetPassword(this.token, password).subscribe({
      next: () => {
        this.busy.set(false)
        this.form.reset()
        this.lock(authAlert('success', 'auth.resetPassword.success'))
      },
      error: (error: unknown) => {
        const status = httpStatus(error)
        this.busy.set(false)
        this.form.enable()
        this.form.reset()
        this.alert.set(
          authAlert('error', status === 400 || status === 401 ? 'auth.resetPassword.invalidToken' : 'auth.errors.generic'),
        )
      },
    })
  }

  private lock(alert: AuthAlert): void {
    this.locked.set(true)
    this.form.disable()
    this.alert.set(alert)
  }
}
