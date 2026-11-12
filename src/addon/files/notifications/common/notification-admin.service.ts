import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IBroadcast, ICampaign, ICampaignDetail, INotification } from './campaign.model'

/** `POST admin/notifications/pagination`: the table query and an optional user filter. */
export interface INotificationQuery extends TableQueryDTO {
  userId?: string
}

/** Campaigns and delivered notifications of the back-end `notifications` add-on. */
@Injectable({ providedIn: 'root' })
export class NotificationAdminService {
  private readonly baseApi = inject(BaseApiService)
  private readonly endpoint = 'admin/notifications'

  campaigns(params: TableQueryDTO): Observable<IPagination<ICampaign[]>> {
    return this.baseApi.post<IPagination<ICampaign[]>>(`${this.endpoint}/campaigns/pagination`, { ...params })
  }

  campaign(id: string): Observable<ICampaignDetail> {
    return this.baseApi.get<ICampaignDetail>(`${this.endpoint}/campaigns/${id}`)
  }

  /**
   * Sends to all users, to the given users, to one platform or to a topic. With `sendAt` the
   * campaign is scheduled. Needs `notification.write`.
   */
  broadcast(body: IBroadcast): Observable<ICampaign> {
    return this.baseApi.post<ICampaign>(`${this.endpoint}/broadcast`, body)
  }

  /** Cancels a scheduled campaign (soft delete); 409 once it is sending, sent or failed. */
  cancelCampaign(id: string): Observable<{ success: boolean }> {
    return this.baseApi.delete<{ success: boolean }>(`${this.endpoint}/campaigns/${id}`)
  }

  /** Every notification of every user, newest first. Searches `title`, `body` and `type`. */
  notifications(params: INotificationQuery): Observable<IPagination<INotification[]>> {
    return this.baseApi.post<IPagination<INotification[]>>(`${this.endpoint}/pagination`, { ...params })
  }

  /** Delivers it again: marks it unread and pushes again. */
  resend(id: string): Observable<INotification> {
    return this.baseApi.post<INotification>(`${this.endpoint}/${id}/resend`, {})
  }

  /** Soft delete: the user no longer sees it. */
  remove(id: string): Observable<{ success: boolean }> {
    return this.baseApi.delete<{ success: boolean }>(`${this.endpoint}/${id}`)
  }
}
