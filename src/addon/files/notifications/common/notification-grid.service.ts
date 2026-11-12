import { Injectable, inject } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { Observable, map } from 'rxjs'
import { INotification } from './campaign.model'
import { INotificationQuery, NotificationAdminService } from './notification-admin.service'

@Injectable()
export class NotificationGridService extends GridService<INotification> {
  private readonly notificationService = inject(NotificationAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<INotification>> {
    const query: INotificationQuery = toTableQuery(params, ['pushStatus'])
    // `userId` is a typed field of the route, not a column filter.
    const filters = { ...(query.filters ?? {}) }
    const rule = filters['userId']
    delete filters['userId']
    const userId = rule && typeof rule === 'object' ? (rule as { value?: unknown }).value : rule
    query.filters = filters
    if (typeof userId === 'string' && userId.trim()) query.userId = userId.trim()

    return this.notificationService.notifications(query).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
