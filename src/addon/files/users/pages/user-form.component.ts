import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core'
import { UserService } from 'app/core/user/user.service'
import { BaseFormComponent } from 'app/shared/abstracts'
import { FormActionButtonsComponent } from 'app/shared/components/form-action-buttons/form-action-buttons.component'
import { SessionsPanelComponent } from 'app/shared/components/sessions-panel/sessions-panel.component'
import { ISession } from 'app/shared/models/session.model'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { map, Observable, tap } from 'rxjs'
import { IPushDevice, IUser, IUserCreate, IUserUpdate } from '../common/user.model'
import { UserAdminService } from '../common/user-admin.service'

/** What the form edits: the user plus the optional password (never returned by the back-end). */
type UserFormModel = IUser & { password?: string }

const PHONE_PATTERN = /^\+\d{9,15}$/

/** Trimmed text, or `undefined` when empty. */
const text = (value: string | null | undefined): string | undefined => value?.trim() || undefined

/**
 * Dialog opened from the list: create, edit and delete a user (`user.write`). An existing user also
 * has the block button, the push devices (`notification.read`) and the device sessions.
 */
@Component({
  selector: 'app-user-form',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    FormlyModule,
    ButtonModule,
    TableModule,
    TagModule,
    TranslocoPipe,
    FormActionButtonsComponent,
    SessionsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form.component.html',
})
export class UserFormComponent extends BaseFormComponent<UserFormModel> {
  private readonly userAdmin = inject(UserAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)

  protected readonly canWrite = this.users.hasPermission('user.write')
  protected readonly canReadPush = this.users.hasPermission('notification.read')

  protected readonly user = signal<IUser | null>(null)
  protected readonly sessions = signal<ISession[]>([])
  protected readonly loadingSessions = signal(false)
  protected readonly pushDevices = signal<IPushDevice[]>([])
  protected readonly loadingPush = signal(false)

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

  /** The user as loaded; the update sends only the fields that differ from it. */
  private original: IUser | null = null

  override ngOnInit(): void {
    super.ngOnInit()
    if (this.id) {
      this.loadSessions()
      this.loadPushDevices()
    }
  }

  protected initFormFields(): void {
    const disabled = !this.canWrite
    const editing = !!this.id
    // A loaded user shows only the sign-in fields the back-end has; a new user shows all of them.
    const hasPhone = !editing || this.original?.phone !== undefined
    const hasEmail = !editing || this.original?.email !== undefined
    const fields: FormlyFieldConfig[] = [
      { key: 'name', type: 'input', props: { label: 'admin.users.fields.name', maxLength: 120, disabled, translate: true } },
      { key: 'language', type: 'input', props: { label: 'admin.users.fields.language', maxLength: 10, disabled, translate: true } },
    ]
    if (hasPhone) {
      fields.push({
        key: 'phone',
        type: 'input',
        props: {
          label: 'admin.users.fields.phone',
          placeholder: '+998901234567',
          pattern: PHONE_PATTERN,
          disabled,
          translate: true,
        },
        validation: { messages: { pattern: 'admin.users.errors.phone' } },
      })
    }
    if (hasEmail) {
      fields.push(
        {
          key: 'email',
          type: 'input',
          props: { label: 'admin.users.fields.email', type: 'email', maxLength: 254, disabled, translate: true },
        },
        { key: 'emailVerified', type: 'checkbox', props: { label: 'admin.users.fields.emailVerified', disabled, translate: true } },
        {
          key: 'password',
          type: 'input',
          props: {
            label: 'admin.users.fields.password',
            type: 'password',
            minLength: 8,
            maxLength: 128,
            disabled,
            translate: true,
          },
        },
      )
    }
    if (!editing) {
      fields.push({ key: 'isBlocked', type: 'checkbox', props: { label: 'admin.users.fields.isBlocked', translate: true } })
    }
    this.fields = fields
  }

  protected getById(id: string): Observable<UserFormModel> {
    return this.userAdmin.getById(id)
  }

  protected create(data: Partial<UserFormModel>): Observable<UserFormModel> {
    const body: IUserCreate = {
      name: text(data.name),
      language: text(data.language),
      phone: text(data.phone),
      email: text(data.email),
      password: data.password || undefined,
      ...(data.emailVerified ? { emailVerified: true } : {}),
      ...(data.isBlocked ? { isBlocked: true } : {}),
    }
    return this.userAdmin.create(this.withoutEmpty(body)).pipe(this.notify('admin.common.saved'))
  }

  protected update(id: string, data: Partial<UserFormModel>): Observable<UserFormModel> {
    return this.userAdmin.update(id, this.diff(data)).pipe(this.notify('admin.common.saved'))
  }

  protected delete(id: string): Observable<UserFormModel> {
    return this.userAdmin.delete(id).pipe(
      map(() => this.model as UserFormModel),
      this.notify('admin.common.deleted'),
    )
  }

  protected mapToModel(data: UserFormModel): Partial<UserFormModel> {
    this.original = data
    this.user.set(data)
    return {
      id: data.id,
      name: data.name,
      language: data.language,
      phone: data.phone,
      email: data.email,
      emailVerified: data.emailVerified,
      isBlocked: data.isBlocked,
    }
  }

  protected getDeleteTitle(): string {
    return this.transloco.translate('admin.users.deleteTitle')
  }

  protected getDeleteMessage(): string {
    return this.transloco.translate('admin.users.deleteMessage', {
      name: this.user()?.name || this.user()?.accountNo || '',
    })
  }

  protected toggleBlocked(): void {
    const user = this.user()
    if (!user) return
    const block = !user.isBlocked
    const prefix = block ? 'admin.users.blockConfirm' : 'admin.users.unblockConfirm'
    this.feedback.confirm(`${prefix}.title`, `${prefix}.message`).subscribe(() => {
      this.userAdmin.setBlocked(user.id, block).subscribe({
        next: (updated) => {
          this.user.set({ ...user, ...updated })
          this.original = { ...user, ...updated }
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

  /** Only the fields the admin changed; an emptied phone or email is sent as `null` to clear it. */
  private diff(data: Partial<UserFormModel>): IUserUpdate {
    const before = this.original
    const body: IUserUpdate = {}
    const name = text(data.name) ?? ''
    if (name !== (before?.name ?? '')) body.name = name
    const language = text(data.language) ?? null
    if (language !== (before?.language ?? null)) body.language = language
    for (const key of ['phone', 'email'] as const) {
      if (before?.[key] === undefined) continue
      const value = text(data[key]) ?? null
      if (value !== (before[key] ?? null)) body[key] = value
    }
    if (before?.email !== undefined && !!data.emailVerified !== !!before.emailVerified) {
      body.emailVerified = !!data.emailVerified
    }
    if (data.password) body.password = data.password
    return body
  }

  private withoutEmpty(body: IUserCreate): IUserCreate {
    return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined)) as IUserCreate
  }

  private notify(successKey: string) {
    return tap<UserFormModel>({
      next: () => this.feedback.success(successKey),
      error: (error: unknown) => this.feedback.httpError(error),
    })
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

  /** The push devices come from the back-end `notifications` add-on; without it the route is missing and the list stays empty. */
  private loadPushDevices(): void {
    if (!this.id || !this.canReadPush) return
    this.loadingPush.set(true)
    this.userAdmin.pushDevices(this.id).subscribe({
      next: (devices) => {
        this.pushDevices.set(devices)
        this.loadingPush.set(false)
      },
      error: () => this.loadingPush.set(false),
    })
  }
}
