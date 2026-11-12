import { inject, Injectable } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { map, Observable } from 'rxjs'
import { IRole } from './role.model'
import { RoleService } from './role.service'

@Injectable()
export class RoleGridService extends GridService<IRole> {
  private roleService = inject(RoleService)

  override getAllData(params: TableQueryDTO, isArchiveView: boolean): Observable<GridResponse<IRole>> {
    return this.roleService.getAllPagination(toTableQuery(params), isArchiveView).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
