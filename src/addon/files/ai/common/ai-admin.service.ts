import { Injectable, inject } from '@angular/core'
import { BaseApiService } from 'app/core/services/base.service'
import { Observable } from 'rxjs'
import { IAiStats } from './ai.model'

@Injectable({ providedIn: 'root' })
export class AiAdminService {
  private readonly baseApi = inject(BaseApiService)

  /** `days` is 1 to 365 (default 30), `top` is 1 to 100 (default 10). */
  stats(days: number, top: number): Observable<IAiStats> {
    return this.baseApi.get<IAiStats>('admin/ai/stats', { queryParams: { days, top } })
  }
}
