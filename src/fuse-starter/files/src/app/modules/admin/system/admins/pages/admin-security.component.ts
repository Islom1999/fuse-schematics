import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { ISession } from 'app/shared/models/session.model'
import { SessionsPanelComponent } from 'app/shared/components/sessions-panel/sessions-panel.component'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { AdminService } from '../common/admin.service'

const PASSWORD_MIN = 8
const PASSWORD_MAX = 200

/** Block, new password and device sessions of one admin. Reading needs `admin.read`, the rest `admin.write`. */
@Component({
  selector: 'app-admin-security',
  imports: [ButtonModule, InputTextModule, SessionsPanelComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-security.component.html',
})
export class AdminSecurityComponent {
  private readonly adminService = inject(AdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)

  readonly adminId = input.required<string>()
  readonly isBlocked = input(false)
  /** Emits after the admin was blocked or unblocked. */
  readonly blockedChange = output<boolean>()

  protected readonly canRead = computed(() => this.users.hasPermission('admin.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('admin.write'))
  protected readonly sessions = signal<ISession[]>([])
  protected readonly loading = signal(false)
  protected readonly password = signal('')
  protected readonly passwordValid = computed(
    () => this.password().length >= PASSWORD_MIN && this.password().length <= PASSWORD_MAX,
  )

  constructor() {
    effect(() => {
      const id = this.adminId()
      if (this.canRead()) this.loadSessions(id)
    })
  }

  protected onPasswordInput(event: Event): void {
    this.password.set((event.target as HTMLInputElement).value)
  }

  protected toggleBlocked(): void {
    const block = !this.isBlocked()
    const prefix = block ? 'admin.system.admins.blockConfirm' : 'admin.system.admins.unblockConfirm'
    this.feedback.confirm(`${prefix}.title`, `${prefix}.message`).subscribe(() => {
      this.adminService.setBlocked(this.adminId(), block).subscribe({
        next: () => {
          this.feedback.success(block ? 'admin.system.admins.blockedDone' : 'admin.system.admins.unblockedDone')
          this.blockedChange.emit(block)
        },
        error: (error: unknown) => this.feedback.httpError(error),
      })
    })
  }

  protected savePassword(): void {
    if (!this.passwordValid()) return
    this.adminService.setPassword(this.adminId(), this.password()).subscribe({
      next: () => {
        this.password.set('')
        this.feedback.success('admin.system.admins.passwordChanged')
        this.loadSessions(this.adminId())
      },
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }

  protected revoke(session: ISession): void {
    this.adminService.revokeSession(this.adminId(), session.id).subscribe({
      next: () => {
        this.feedback.success('admin.sessions.revoked')
        this.loadSessions(this.adminId())
      },
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }

  protected revokeAll(): void {
    this.feedback.confirm('admin.sessions.revokeAllConfirm.title', 'admin.sessions.revokeAllConfirm.message').subscribe(() => {
      this.adminService.revokeSessions(this.adminId()).subscribe({
        next: ({ revoked }) => {
          this.feedback.success('admin.sessions.revokedCount', { count: revoked })
          this.loadSessions(this.adminId())
        },
        error: (error: unknown) => this.feedback.httpError(error),
      })
    })
  }

  private loadSessions(id: string): void {
    this.loading.set(true)
    this.adminService.sessions(id).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
