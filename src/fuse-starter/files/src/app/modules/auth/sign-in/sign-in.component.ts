import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { AuthService } from 'app/core/auth/auth.service'
import { ButtonDirective, ButtonLabel } from 'primeng/button'
import { Checkbox } from 'primeng/checkbox'
import { InputText } from 'primeng/inputtext'
import { AuthAlertComponent } from '../shared/auth-alert.component'
import { AuthAlert, authAlert, authAlertText, backendMessage, firstError, httpStatus, isAppPath } from '../shared/auth-form'
import { AuthPasswordToggleComponent } from '../shared/auth-password-toggle.component'
import { AuthSpinnerComponent } from '../shared/auth-spinner.component'
import { AuthSplitShellComponent } from '../shared/auth-split-shell.component'

const MESSAGES = {
  email: { required: 'auth.validation.emailRequired', email: 'auth.validation.emailInvalid' },
  password: { required: 'auth.validation.passwordRequired' },
}

@Component({
  selector: 'app-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    InputText,
    Checkbox,
    ButtonDirective,
    ButtonLabel,
    AuthSplitShellComponent,
    AuthAlertComponent,
    AuthPasswordToggleComponent,
    AuthSpinnerComponent,
  ],
  host: { class: 'flex min-w-0 flex-auto flex-col' },
  templateUrl: './sign-in.component.html',
})
export class SignInComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
  })
  protected readonly busy = signal(false)
  protected readonly alert = signal<AuthAlert | null>(null)

  protected error(name: keyof typeof MESSAGES): string | null {
    return firstError(this.form.controls[name], MESSAGES[name])
  }

  protected submit(): void {
    if (this.busy()) return
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.busy.set(true)
    this.alert.set(null)
    const credentials = this.form.getRawValue()
    this.form.disable()

    this.auth.signIn(credentials).subscribe({
      next: () => {
        const redirectURL = this.route.snapshot.queryParamMap.get('redirectURL')
        void this.router.navigateByUrl(isAppPath(redirectURL) ? redirectURL : '/signed-in-redirect')
      },
      error: (error: unknown) => {
        this.busy.set(false)
        this.form.enable()
        this.form.controls.password.reset()
        this.alert.set(this.alertFor(error))
      },
    })
  }

  private alertFor(error: unknown): AuthAlert {
    switch (httpStatus(error)) {
      case 401:
        return authAlert('error', 'auth.signIn.wrongCredentials')
      case 400: {
        const message = backendMessage(error)
        return message ? authAlertText('error', message) : authAlert('error', 'auth.errors.checkForm')
      }
      case 429:
        return authAlert('error', 'auth.signIn.tooManyAttempts')
      default:
        return authAlert('error', 'auth.errors.generic')
    }
  }
}
