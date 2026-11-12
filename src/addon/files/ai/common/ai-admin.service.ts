import { Injectable, inject } from '@angular/core'
import { BaseApiService } from 'app/core/services/base.service'
import { Observable } from 'rxjs'
import { IAiStats, IAiStatsQuery, IAiUsage, IAiUsageQuery } from './ai.model'

@Injectable({ providedIn: 'root' })
export class AiAdminService {
  private readonly baseApi = inject(BaseApiService)

  /** `days` is 1 to 365 (default 30), `top` is 1 to 100 (default 10). With `from` (`YYYY-MM-DD`) `days` is ignored. */
  stats(query: IAiStatsQuery): Observable<IAiStats> {
    return this.baseApi.get<IAiStats>('admin/ai/stats', { queryParams: this.clean({ ...query }) })
  }

  /**
   * Messages and tokens per user and day or month. The route exists only when the back-end was
   * generated with `ai --quota`; without it the answer is 404.
   */
  usage(query: IAiUsageQuery): Observable<IAiUsage> {
    return this.baseApi.get<IAiUsage>('admin/ai/usage', { queryParams: this.clean({ ...query }) })
  }

  private clean(query: Record<string, string | number | undefined>): Record<string, string | number> {
    const result: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') result[key] = value
    }
    return result
  }
}
