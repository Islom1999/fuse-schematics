import { Injectable, inject } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { Observable, map } from 'rxjs'
import { IApiLog } from './api-log.model'
import { ApiLogService } from './api-log.service'

@Injectable()
export class ApiLogGridService extends GridService<IApiLog> {
  private readonly apiLogService = inject(ApiLogService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<IApiLog>> {
    return this.apiLogService.getAllPagination(toTableQuery(params, ['type', 'method', 'statusCode'])).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
