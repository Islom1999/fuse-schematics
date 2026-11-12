import { inject, Injectable } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { map, Observable } from 'rxjs'
import { IAdmin } from './admin.model'
import { AdminService } from './admin.service'

@Injectable()
export class AdminGridService extends GridService<IAdmin> {
  private adminService = inject(AdminService)

  override getAllData(params: TableQueryDTO, isArchiveView: boolean): Observable<GridResponse<IAdmin>> {
    return this.adminService.getAllPagination(toTableQuery(params, ['isBlocked']), isArchiveView).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
