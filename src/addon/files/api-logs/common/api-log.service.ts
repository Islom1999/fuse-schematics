import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { CsvDownload, CsvDownloadService, toExportParams } from 'app/shared/utils/csv-download'
import { Observable } from 'rxjs'
import { IApiLogTypedFilters } from './api-log-query'
import { IApiLog, IApiLogStats } from './api-log.model'

/** Read-only access to the server API logs. */
@Injectable({ providedIn: 'root' })
export class ApiLogService {
  private readonly baseApi = inject(BaseApiService)
  private readonly csv = inject(CsvDownloadService)
  private readonly endpoint = 'admin/server-api-logs'

  getAllPagination(params: TableQueryDTO & IApiLogTypedFilters): Observable<IPagination<IApiLog[]>> {
    return this.baseApi.post<IPagination<IApiLog[]>>(`${this.endpoint}/pagination`, { ...params })
  }

  /**
   * Downloads `server-api-logs-YYYY-MM-DD-HH-mm-ss.csv` (UTF-8 with BOM, CRLF, no bodies) and saves it.
   * `limit` is 1 to 20000 (default 5000). This route sends no `X-Total-Count` or `X-Export-Truncated`.
   */
  exportCsv(query: TableQueryDTO, typed: IApiLogTypedFilters = {}, limit?: number): Observable<CsvDownload> {
    return this.csv.download('admin/server-api-logs/export', 'server-api-logs', toExportParams(query, { ...typed, limit }))
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
