import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { map } from 'rxjs'
import { CAMPAIGN_STATUS_SEVERITY } from '../common/campaign-status'
import { ICampaignDetail } from '../common/campaign.model'
import { NotificationAdminService } from '../common/notification-admin.service'

/**
 * One campaign with its delivery counts. Counts can still change while a queue sends the push
 * messages: use refresh. A scheduled campaign can be cancelled (`notification.write`).
 */
@Component({
  selector: 'app-campaign-detail',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, TagModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-detail.component.html',
})
export class CampaignDetailComponent {
  private readonly service = inject(NotificationAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)
  private readonly router = inject(Router)

  private readonly route = inject(ActivatedRoute)

  protected readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  })

  protected readonly canRead = computed(() => this.users.hasPermission('notification.read'))
  protected readonly detail = signal<ICampaignDetail | null>(null)
  protected readonly loading = signal(false)
  protected readonly canWrite = computed(() => this.users.hasPermission('notification.write'))
  protected readonly cancelling = signal(false)
  protected readonly statusSeverity = CAMPAIGN_STATUS_SEVERITY

  protected readonly stats = computed(() => {
    const stats = this.detail()?.stats
    if (!stats) return []
    return [
      { key: 'total', value: stats.total },
      { key: 'read', value: stats.read },
      { key: 'pushPending', value: stats.pushPending },
      { key: 'pushSent', value: stats.pushSent },
      { key: 'pushFailed', value: stats.pushFailed },
      { key: 'pushSkipped', value: stats.pushSkipped },
    ]
  })

  constructor() {
    effect(() => {
      const id = this.id()
      if (id && this.canRead()) this.load(id)
    })
  }

  protected refresh(): void {
    const id = this.id()
    if (id) this.load(id)
  }

  /** Deletes a scheduled campaign; the back-end answers 409 once it is sending, sent or failed. */
  protected cancelCampaign(): void {
    const id = this.id()
    if (!id) return
    this.feedback.confirm('admin.notifications.cancelConfirm.title', 'admin.notifications.cancelConfirm.message').subscribe(() => {
      this.cancelling.set(true)
      this.service.cancelCampaign(id).subscribe({
        next: () => {
          this.cancelling.set(false)
          this.feedback.success('admin.notifications.cancelled')
          void this.router.navigate(['/notifications'])
        },
        error: (error: unknown) => {
          this.cancelling.set(false)
          this.feedback.httpError(error)
          this.load(id)
        },
      })
    })
  }

  private load(id: string): void {
    this.loading.set(true)
    this.service.campaign(id).subscribe({
      next: (detail) => {
        this.detail.set(detail)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
