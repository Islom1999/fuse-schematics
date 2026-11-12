import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { SessionsPanelComponent } from 'app/shared/components/sessions-panel/sessions-panel.component'
import { ISession } from 'app/shared/models/session.model'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog'
import { TagModule } from 'primeng/tag'
import { IUser } from '../common/user.model'
import { UserAdminService } from '../common/user-admin.service'

/** Dialog opened from the list: the user, the block button (`user.write`) and the device sessions. */
@Component({
  selector: 'app-user-detail',
  imports: [DatePipe, ButtonModule, TagModule, TranslocoPipe, SessionsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private readonly userAdmin = inject(UserAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)
  private readonly dialogRef = inject(DynamicDialogRef, { optional: true })
  private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true })

  private readonly id = this.dialogConfig?.data?.id as string | undefined

  protected readonly user = signal<IUser | null>(null)
  protected readonly sessions = signal<ISession[]>([])
  protected readonly loadingSessions = signal(false)
  protected readonly canWrite = computed(() => this.users.hasPermission('user.write'))

  /** Social and messenger ids the user has; the set depends on the back-end sign-in methods. */
  protected readonly identities = computed(() => {
    const user = this.user()
    if (!user) return []
    return [
      { label: 'Google', value: user.googleSub },
      { label: 'Apple', value: user.appleSub },
      { label: 'Telegram', value: user.telegramId },
    ].filter((item) => !!item.value)
  })

  ngOnInit(): void {
    if (!this.id) return
    this.userAdmin.getById(this.id).subscribe({
      next: (user) => this.user.set(user),
      error: (error: unknown) => {
        this.feedback.httpError(error)
        this.dialogRef?.close(false)
      },
    })
    this.loadSessions()
  }

  protected toggleBlocked(): void {
    const user = this.user()
    if (!user) return
    const block = !user.isBlocked
    const prefix = block ? 'admin.users.blockConfirm' : 'admin.users.unblockConfirm'
    this.feedback.confirm(`${prefix}.title`, `${prefix}.message`).subscribe(() => {
      this.userAdmin.setBlocked(user.id, block).subscribe({
        next: (updated) => {
          this.user.set(updated)
          this.feedback.success(block ? 'admin.users.blockedDone' : 'admin.users.unblockedDone')
          this.loadSessions()
        },
        error: (error: unknown) => this.feedback.httpError(error),
      })
    })
  }

  protected revoke(session: ISession): void {
    const id = this.id
    if (!id) return
    this.userAdmin.revokeSession(id, session.id).subscribe({
      next: () => {
        this.feedback.success('admin.sessions.revoked')
        this.loadSessions()
      },
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }

  protected revokeAll(): void {
    const id = this.id
    if (!id) return
    this.feedback.confirm('admin.sessions.revokeAllConfirm.title', 'admin.sessions.revokeAllConfirm.message').subscribe(() => {
      this.userAdmin.revokeSessions(id).subscribe({
        next: ({ revoked }) => {
          this.feedback.success('admin.sessions.revokedCount', { count: revoked })
          this.loadSessions()
        },
        error: (error: unknown) => this.feedback.httpError(error),
      })
    })
  }

  protected close(): void {
    this.dialogRef?.close(false)
  }

  private loadSessions(): void {
    if (!this.id) return
    this.loadingSessions.set(true)
    this.userAdmin.sessions(this.id).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions)
        this.loadingSessions.set(false)
      },
      error: (error: unknown) => {
        this.loadingSessions.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
