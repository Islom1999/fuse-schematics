import { Injectable, inject } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { Observable, map } from 'rxjs'
import { IUser } from './user.model'
import { UserAdminService } from './user-admin.service'

@Injectable()
export class UserGridService extends GridService<IUser> {
  private readonly userService = inject(UserAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<IUser>> {
    return this.userService.getAllPagination(toTableQuery(params, ['isBlocked', 'language'])).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
