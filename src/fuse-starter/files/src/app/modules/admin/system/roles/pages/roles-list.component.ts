import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { RoleGridService } from '../common/role-grid.service'
import { IRole } from '../common/role.model'
import { RoleFormComponent } from './role-form.component'

/** Roles: list, search, create/edit dialog with the permission picker. Needs `role.read`; changes need `role.write`. */
@Component({
  selector: 'app-roles-list',
  imports: [GridComponent, TableFilterComponent, ButtonModule, MessageModule, TagModule, TranslocoPipe],
  providers: [RoleGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roles-list.component.html',
})
export class RolesListComponent extends BaseTableComponent<IRole> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)

  gridService = inject(RoleGridService)
  formComponent = RoleFormComponent

  protected readonly canRead = computed(() => this.users.hasPermission('role.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('role.write'))

  filterConfig: ITableFilterConfig = {
    columns: 3,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.system.roles.search',
        placeholder: 'admin.system.roles.searchPlaceholder',
        props: { translate: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'name', header: 'admin.system.roles.fields.name' },
    { field: 'permissions', header: 'admin.system.roles.fields.permissions', template: 'custom' },
    { field: 'createdAt', header: 'admin.system.roles.fields.createdAt', template: 'date' },
    { field: 'updatedAt', header: 'admin.system.roles.fields.updatedAt', template: 'date' },
  ]

  protected getItemId(item: IRole): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.system.roles.edit')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.system.roles.create')
  }
}
