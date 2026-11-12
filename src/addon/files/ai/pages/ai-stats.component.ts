import { DatePipe, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { SelectModule } from 'primeng/select'
import { TableModule } from 'primeng/table'
import { AiAdminService } from '../common/ai-admin.service'
import { IAiStats } from '../common/ai.model'

/** AI usage: totals as cards, and the usage by day, model and user as tables. Needs `ai.read`. */
@Component({
  selector: 'app-ai-stats',
  imports: [DatePipe, DecimalPipe, FormsModule, ButtonModule, MessageModule, SelectModule, TableModule, TranslocoPipe],
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
  protected readonly maxDayRequests = computed(() =>
    Math.max(1, ...(this.stats()?.byDay ?? []).map((row) => row.requests)),
  )

  constructor() {
    effect(() => {
      const days = this.days()
      const top = this.top()
      if (this.canRead()) this.load(days, top)
    })
  }

  protected refresh(): void {
    this.load(this.days(), this.top())
  }

  private load(days: number, top: number): void {
    this.loading.set(true)
    this.service.stats(days, top).subscribe({
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
