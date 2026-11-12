import { Injectable, inject } from '@angular/core'
import { BaseApiService } from 'app/core/services/base.service'
import { Observable } from 'rxjs'
import { IQueueClean, IQueueJobPage, IQueueOverview, QueueJobStatus } from './queue.model'

/** Background queues of the back-end `queue` add-on: reading needs `queue.read`, the buttons `queue.write`. */
@Injectable({ providedIn: 'root' })
export class QueueAdminService {
  private readonly baseApi = inject(BaseApiService)
  private readonly endpoint = 'admin/queues'

  overview(): Observable<IQueueOverview> {
    return this.baseApi.get<IQueueOverview>(this.endpoint)
  }

  /** Newest first. `status` is required; `page` starts at 1 and `limit` is 1 to 100 (page/limit, not first/rows). */
  jobs(queue: string, status: QueueJobStatus, page: number, limit: number): Observable<IQueueJobPage> {
    return this.baseApi.get<IQueueJobPage>(`${this.endpoint}/${encodeURIComponent(queue)}/jobs`, {
      queryParams: { status, page, limit },
    })
  }

  /** 409 when the job is not `failed`. */
  retry(queue: string, jobId: string): Observable<{ success: boolean }> {
    return this.baseApi.post<{ success: boolean }>(
      `${this.endpoint}/${encodeURIComponent(queue)}/jobs/${encodeURIComponent(jobId)}/retry`,
      {},
    )
  }

  clean(queue: string, body: IQueueClean): Observable<{ removed: number }> {
    return this.baseApi.post<{ removed: number }>(`${this.endpoint}/${encodeURIComponent(queue)}/clean`, body)
  }

  /** Workers take no new jobs; running jobs finish. */
  pause(queue: string): Observable<{ name: string; paused: boolean }> {
    return this.baseApi.post<{ name: string; paused: boolean }>(`${this.endpoint}/${encodeURIComponent(queue)}/pause`, {})
  }

  resume(queue: string): Observable<{ name: string; paused: boolean }> {
    return this.baseApi.post<{ name: string; paused: boolean }>(`${this.endpoint}/${encodeURIComponent(queue)}/resume`, {})
  }
}
