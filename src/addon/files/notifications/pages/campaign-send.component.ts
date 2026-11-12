import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core'
import { UserService } from 'app/core/user/user.service'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { CampaignPlatform, CampaignTarget, IBroadcast, TOPIC_PATTERN } from '../common/campaign.model'
import { NotificationAdminService } from '../common/notification-admin.service'

/** What the form edits; `userIds` is free text (ids separated by spaces, commas or new lines). */
interface SendModel {
  target: CampaignTarget
  userIds?: string
  platform?: CampaignPlatform
  topic?: string
  /** Optional: a future date and time schedules the campaign. */
  sendAt?: Date | null
  type?: string
  title?: string
  body?: string
  link?: string
  image?: string
}

const MAX_USER_IDS = 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Splits the user id text into unique ids. */
export function parseUserIds(text: string | undefined): string[] {
  return [...new Set((text ?? '').split(/[\s,;]+/).filter(Boolean))]
}

/** Send form: all users, chosen users (by id), one platform or a topic, now or at a chosen time. Needs `notification.write`. */
@Component({
  selector: 'app-campaign-send',
  imports: [ReactiveFormsModule, RouterLink, FormlyModule, ButtonModule, MessageModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-send.component.html',
})
export class CampaignSendComponent {
  private readonly service = inject(NotificationAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)
  private readonly router = inject(Router)

  protected readonly canWrite = computed(() => this.users.hasPermission('notification.write'))
  protected readonly sending = signal(false)

  protected readonly form = new FormGroup({})
  protected readonly model: SendModel = { target: 'all', type: 'general' }

  protected readonly fields: FormlyFieldConfig[] = [
    {
      key: 'target',
      type: 'select',
      props: {
        label: 'admin.notifications.fields.target',
        required: true,
        options: [
          { label: 'admin.notifications.targets.all', value: 'all' },
          { label: 'admin.notifications.targets.users', value: 'users' },
          { label: 'admin.notifications.targets.platform', value: 'platform' },
          { label: 'admin.notifications.targets.topic', value: 'topic' },
        ],
        translate: true,
        translateSelectOptions: true,
      },
    },
    {
      key: 'userIds',
      type: 'textarea',
      props: { label: 'admin.notifications.fields.userIds', rows: 4, translate: true },
      expressions: {
        hide: (field: FormlyFieldConfig) => field.model?.target !== 'users',
        'props.required': (field: FormlyFieldConfig) => field.model?.target === 'users',
      },
      validators: {
        userIds: {
          expression: (control: { value: string | null }, field: FormlyFieldConfig) => {
            if (field.model?.target !== 'users') return true
            const ids = parseUserIds(control.value ?? '')
            return ids.length >= 1 && ids.length <= MAX_USER_IDS && ids.every((id) => UUID.test(id))
          },
          message: 'admin.notifications.errors.userIds',
        },
      },
    },
    {
      key: 'platform',
      type: 'select',
      props: {
        label: 'admin.notifications.fields.platform',
        options: ['ios', 'android', 'web'].map((value) => ({ label: value, value })),
        translate: true,
      },
      expressions: {
        hide: (field: FormlyFieldConfig) => field.model?.target !== 'platform',
        'props.required': (field: FormlyFieldConfig) => field.model?.target === 'platform',
      },
    },
    {
      key: 'topic',
      type: 'input',
      props: {
        label: 'admin.notifications.fields.topic',
        maxLength: 100,
        pattern: TOPIC_PATTERN,
        translate: true,
      },
      expressions: {
        hide: (field: FormlyFieldConfig) => field.model?.target !== 'topic',
        'props.required': (field: FormlyFieldConfig) => field.model?.target === 'topic',
      },
      validation: { messages: { pattern: 'admin.notifications.errors.topic' } },
    },
    {
      key: 'type',
      type: 'input',
      props: {
        label: 'admin.notifications.fields.type',
        maxLength: 50,
        pattern: /^[A-Za-z0-9_.-]{1,50}$/,
        translate: true,
      },
      validation: { messages: { pattern: 'admin.notifications.errors.type' } },
    },
    {
      key: 'title',
      type: 'input',
      props: { label: 'admin.notifications.fields.title', required: true, maxLength: 200, translate: true },
    },
    {
      key: 'body',
      type: 'textarea',
      props: { label: 'admin.notifications.fields.body', rows: 4, maxLength: 4000, translate: true },
    },
    {
      key: 'link',
      type: 'input',
      props: { label: 'admin.notifications.fields.link', maxLength: 1000, translate: true },
    },
    {
      key: 'image',
      type: 'input',
      props: {
        label: 'admin.notifications.fields.image',
        maxLength: 1000,
        pattern: /^https?:\/\/\S+$/i,
        translate: true,
      },
      validation: { messages: { pattern: 'admin.notifications.errors.image' } },
    },
    {
      key: 'sendAt',
      type: 'datepicker',
      props: {
        label: 'admin.notifications.fields.sendAt',
        showTime: true,
        showIcon: true,
        showButtonBar: true,
        dateFormat: 'dd.mm.yy',
        translate: true,
      },
      validators: {
        future: {
          expression: (control: { value: Date | null }) => !control.value || control.value.getTime() > Date.now(),
          message: 'admin.notifications.errors.sendAt',
        },
      },
    },
  ]

  protected send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const body = this.toBroadcast(this.model)
    this.sending.set(true)
    this.service.broadcast(body).subscribe({
      next: (campaign) => {
        this.sending.set(false)
        this.feedback.success(campaign.status === 'scheduled' ? 'admin.notifications.scheduled' : 'admin.notifications.sent')
        void this.router.navigate(['/notifications', campaign.id])
      },
      error: (error: unknown) => {
        this.sending.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  /** Drops the empty fields and the ones the chosen target does not use. */
  private toBroadcast(model: SendModel): IBroadcast {
    const body: IBroadcast = { target: model.target, title: (model.title ?? '').trim() }
    if (model.target === 'users') body.userIds = parseUserIds(model.userIds)
    if (model.target === 'platform' && model.platform) body.platform = model.platform
    if (model.target === 'topic') body.topic = (model.topic ?? '').trim()
    if (model.sendAt) body.sendAt = model.sendAt.toISOString()
    for (const key of ['type', 'body', 'link', 'image'] as const) {
      const value = model[key]?.trim()
      if (value) body[key] = value
    }
    return body
  }
}
