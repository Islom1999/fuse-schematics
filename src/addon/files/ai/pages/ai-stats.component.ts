import { DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
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
import { IAiStats, IAiStatsQuery } from '../common/ai.model'
import { AiTabsComponent } from './ai-tabs.component'

/** AI usage: totals as cards, and the usage by day, model and user as tables, for the last days or a chosen period. Needs `ai.read`. */
@Component({
  selector: 'app-ai-stats',
  imports: [
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
  templateUrl: './ai-stats.component.html',
})
export class AiStatsComponent {
  private readonly service = inject(AiAdminService)
  private readonly feedback = inject(AdminFeedbackService)
  private readonly users = inject(UserService)

  protected readonly canRead = computed(() => this.users.hasPermission('ai.read'))

  protected readonly days = signal(30)
  protected readonly top = signal(10)
  /** `YYYY-MM-DD` (UTC). With `from` set the `days` choice is ignored; `to` defaults to today. */
  protected readonly from = signal('')
  protected readonly to = signal('')
  protected readonly dayOptions = [7, 30, 90, 365].map((value) => ({ label: `${value}`, value }))
  protected readonly topOptions = [10, 25, 50, 100].map((value) => ({ label: `${value}`, value }))

  protected readonly stats = signal<IAiStats | null>(null)
  protected readonly loading = signal(false)

  protected readonly cards = computed(() => {
    const totals = this.stats()?.totals
    if (!totals) return []
    return [
      { key: 'requests', value: totals.requests, format: '1.0-0' },
      { key: 'errors', value: totals.errors, format: '1.0-0' },
      { key: 'promptTokens', value: totals.promptTokens, format: '1.0-0' },
      { key: 'completionTokens', value: totals.completionTokens, format: '1.0-0' },
      { key: 'costUsd', value: totals.costUsd, format: '1.2-4', prefix: '$' },
      { key: 'avgLatencyMs', value: totals.avgLatencyMs, format: '1.0-0', suffix: ' ms' },
      { key: 'cacheHits', value: totals.cacheHits, format: '1.0-0' },
    ]
  })

  /** Largest daily request count, for the bar width in the by-day table. */
  /** The period is valid when both dates are empty or `from` is not after `to` and they are at most 366 days apart. */
  protected readonly periodValid = computed(() => {
    const from = this.from()
    const to = this.to()
    if (!from) return !to
    if (!to) return true
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
    return span >= 0 && span <= 366
  })

  /** Cost of the costliest day, for the bar width of the cost-by-day list. */
  protected readonly maxDayCost = computed(() => Math.max(0.000001, ...(this.stats()?.costByDay ?? []).map((row) => row.costUsd)))

  protected readonly maxDayRequests = computed(() =>
    Math.max(1, ...(this.stats()?.byDay ?? []).map((row) => row.requests)),
  )

  constructor() {
    effect(() => {
      const query = this.query()
      if (this.canRead() && this.periodValid()) this.load(query)
    })
  }

  private readonly query = computed<IAiStatsQuery>(() => {
    const from = this.from()
    const to = this.to()
    return { days: this.days(), top: this.top(), ...(from ? { from } : {}), ...(to ? { to } : {}) }
  })

  protected refresh(): void {
    if (this.periodValid()) this.load(this.query())
  }

  protected onDate(field: 'from' | 'to', event: Event): void {
    ;(field === 'from' ? this.from : this.to).set((event.target as HTMLInputElement).value)
  }

  protected clearPeriod(): void {
    this.from.set('')
    this.to.set('')
  }

  private load(query: IAiStatsQuery): void {
    this.loading.set(true)
    this.service.stats(query).subscribe({
      next: (stats) => {
        this.stats.set(stats)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
