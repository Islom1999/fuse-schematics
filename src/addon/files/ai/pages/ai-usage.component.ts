import { HttpErrorResponse } from '@angular/common/http'
import { DatePipe, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { SelectModule } from 'primeng/select'
import { TableModule } from 'primeng/table'
import { AiAdminService } from '../common/ai-admin.service'
import { IAiUsage, IAiUsageQuery } from '../common/ai.model'
import { AiTabsComponent } from './ai-tabs.component'

/**
 * Quota usage from `GET admin/ai/usage`: messages and tokens per user, by day and by month, and with
 * a user id the limits of that user. The route exists only with the back-end `ai --quota` option.
 * Needs `ai.read`.
 */
@Component({
  selector: 'app-ai-usage',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    AiTabsComponent,
    ButtonModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-usage.component.html',
})
export class AiUsageComponent {
  private readonly service = inject(AiAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)

  protected readonly canRead = computed(() => this.users.hasPermission('ai.read'))

  protected readonly userId = signal('')
  /** `YYYY-MM-DD` (UTC); empty uses the back-end default (the last 30 days). */
  protected readonly from = signal('')
  protected readonly to = signal('')
  protected readonly limit = signal(100)
  protected readonly limitOptions = [50, 100, 250, 500, 1000].map((value) => ({ label: `${value}`, value }))

  protected readonly usage = signal<IAiUsage | null>(null)
  protected readonly loading = signal(false)
  /** The route answered 404: the back-end has no quota add-on. */
  protected readonly unavailable = signal(false)

  protected readonly periodValid = computed(() => {
    const from = this.from()
    const to = this.to()
    if (!from || !to) return true
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
    return span >= 0 && span <= 366
  })

  protected readonly cards = computed(() => {
    const totals = this.usage()?.totals
    if (!totals) return []
    return [
      { key: 'dailyMessages', value: totals.dailyMessages },
      { key: 'dailyTokens', value: totals.dailyTokens },
      { key: 'dailyUsers', value: totals.dailyUsers },
      { key: 'monthlyMessages', value: totals.monthlyMessages },
      { key: 'monthlyTokens', value: totals.monthlyTokens },
      { key: 'monthlyUsers', value: totals.monthlyUsers },
    ]
  })

  constructor() {
    if (this.canRead()) this.load()
  }

  protected onInput(field: 'userId' | 'from' | 'to', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value.trim())
  }

  protected load(): void {
    if (!this.periodValid()) return
    const query: IAiUsageQuery = {
      limit: this.limit(),
      ...(this.userId() ? { userId: this.userId() } : {}),
      ...(this.from() ? { from: this.from() } : {}),
      ...(this.to() ? { to: this.to() } : {}),
    }
    this.loading.set(true)
    this.unavailable.set(false)
    this.service.usage(query).subscribe({
      next: (usage) => {
        this.usage.set(usage)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.usage.set(null)
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.unavailable.set(true)
        } else {
          this.feedback.httpError(error)
        }
      },
    })
  }

  /** `limit` 0 means no limit. */
  protected percent(value: number, limit: number): number {
    return limit > 0 ? Math.min(100, (value / limit) * 100) : 0
  }
}
