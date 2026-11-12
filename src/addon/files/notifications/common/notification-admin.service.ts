import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IBroadcast, ICampaign, ICampaignDetail } from './campaign.model'

/** Campaigns of the back-end `notifications` add-on. */
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

  /** Sends to all users, to the given users or to one platform. Needs `notification.write`. */
  broadcast(body: IBroadcast): Observable<ICampaign> {
    return this.baseApi.post<ICampaign>(`${this.endpoint}/broadcast`, body)
  }
}
