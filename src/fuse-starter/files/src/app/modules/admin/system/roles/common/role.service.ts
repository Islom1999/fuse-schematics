import { Injectable } from '@angular/core'
import { BaseCrudService } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IPermissionGroup, IRole } from './role.model'

@Injectable({ providedIn: 'root' })
export class RoleService extends BaseCrudService<IRole> {
  constructor() {
    super('admin/roles')
  }

  /** The permission catalog; it depends on the installed back-end add-ons. Needs `role.read`. */
  permissions(): Observable<IPermissionGroup[]> {
    return this.baseApi.get<IPermissionGroup[]>('admin/permissions')
  }
}
