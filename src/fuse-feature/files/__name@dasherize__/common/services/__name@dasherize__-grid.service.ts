import { inject, Injectable } from '@angular/core'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { map, Observable } from 'rxjs'
import { GridResponse } from 'app/shared'
import { I<%= classify(name) %> } from '../models/<%= dasherize(name) %>.model'
import { <%= classify(name) %>Service } from './<%= dasherize(name) %>.service'

@Injectable()
export class <%= classify(name) %>GridService extends GridService<I<%= classify(name) %>> {
  private <%= camelize(name) %>Service = inject(<%= classify(name) %>Service)

  constructor() {
    super()
  }

  override getAllData(
    params: TableQueryDTO,
    isArchiveView: boolean,
  ): Observable<GridResponse<I<%= classify(name) %>>> {
    return this.<%= camelize(name) %>Service.getAllPagination(params, isArchiveView).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
