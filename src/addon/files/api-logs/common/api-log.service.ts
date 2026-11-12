import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IApiLog, IApiLogStats } from './api-log.model'

/** Read-only access to the server API logs. */
@Injectable({ providedIn: 'root' })
export class ApiLogService {
  private readonly baseApi = inject(BaseApiService)
  private readonly endpoint = 'admin/server-api-logs'

  getAllPagination(params: TableQueryDTO): Observable<IPagination<IApiLog[]>> {
    return this.baseApi.post<IPagination<IApiLog[]>>(`${this.endpoint}/pagination`, { ...params })
  }

  /** The log with its request and response bodies. */
  getById(id: string): Observable<IApiLog> {
    return this.baseApi.get<IApiLog>(`${this.endpoint}/${id}`)
  }

  /** Counts and durations of the last `hours` hours (1 to 720). */
  stats(hours: number): Observable<IApiLogStats> {
    return this.baseApi.get<IApiLogStats>(`${this.endpoint}/stats/summary`, { queryParams: { hours } })
  }
}
