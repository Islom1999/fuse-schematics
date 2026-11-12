import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { AuthService } from 'app/core/auth/auth.service'
import { ButtonDirective, ButtonLabel } from 'primeng/button'
import { InputText } from 'primeng/inputtext'
import { AuthAlertComponent } from '../shared/auth-alert.component'
import { AuthAlert, authAlert, firstError, httpStatus } from '../shared/auth-form'
import { AuthSpinnerComponent } from '../shared/auth-spinner.component'
import { AuthSplitShellComponent } from '../shared/auth-split-shell.component'

const EMAIL_MESSAGES = { required: 'auth.validation.emailRequired', email: 'auth.validation.emailInvalid' }

@Component({
  selector: 'app-forgot-password',
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
    AuthSpinnerComponent,
  ],
  host: { class: 'flex min-w-0 flex-auto flex-col' },
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService)

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  })
  protected readonly busy = signal(false)
  protected readonly alert = signal<AuthAlert | null>(null)

  protected emailError(): string | null {
    return firstError(this.form.controls.email, EMAIL_MESSAGES)
  }

  protected submit(): void {
    if (this.busy()) return
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.busy.set(true)
    this.alert.set(null)
    const { email } = this.form.getRawValue()
    this.form.disable()

    // The backend answers the same for unknown emails, so the result never reveals an account.
    this.auth.forgotPassword(email).subscribe({
      next: () => this.done(authAlert('success', 'auth.forgotPassword.sent')),
      error: (error: unknown) =>
        this.done(
          authAlert('error', httpStatus(error) === 400 ? 'auth.validation.emailInvalid' : 'auth.errors.generic'),
        ),
    })
  }

  private done(alert: AuthAlert): void {
    this.busy.set(false)
    this.form.enable()
    this.form.reset()
    this.alert.set(alert)
  }
}
