import { Injectable, inject } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { Observable, map } from 'rxjs'
import { ICampaign } from './campaign.model'
import { NotificationAdminService } from './notification-admin.service'

@Injectable()
export class CampaignGridService extends GridService<ICampaign> {
  private readonly notificationService = inject(NotificationAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<ICampaign>> {
    return this.notificationService.campaigns(toTableQuery(params, ['target'])).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
