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
import { AdminGridService } from '../common/admin-grid.service'
import { IAdmin } from '../common/admin.model'
import { AdminFormComponent } from './admin-form.component'

/** Admin accounts: list, search, create/edit dialog. Needs `admin.read`; changes need `admin.write`. */
@Component({
  selector: 'app-admins-list',
  imports: [GridComponent, TableFilterComponent, ButtonModule, MessageModule, TagModule, TranslocoPipe],
  providers: [AdminGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admins-list.component.html',
})
export class AdminsListComponent extends BaseTableComponent<IAdmin> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)

  gridService = inject(AdminGridService)
  formComponent = AdminFormComponent

  protected readonly canRead = computed(() => this.users.hasPermission('admin.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('admin.write'))

  filterConfig: ITableFilterConfig = {
    columns: 3,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.system.admins.search',
        placeholder: 'admin.system.admins.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'isBlocked',
        type: 'select',
        label: 'admin.system.admins.fields.isBlocked',
        options: [
          { label: 'admin.grid.filter.yes', value: true },
          { label: 'admin.grid.filter.no', value: false },
        ],
        props: { translate: true, translateSelectOptions: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'email', header: 'admin.system.admins.fields.email' },
    { field: 'name', header: 'admin.system.admins.fields.name' },
    { field: 'role.name', header: 'admin.system.admins.fields.role', template: 'custom' },
    { field: 'isBlocked', header: 'admin.system.admins.fields.isBlocked', template: 'custom' },
    { field: 'lastLoginAt', header: 'admin.system.admins.fields.lastLoginAt', template: 'date' },
    { field: 'createdAt', header: 'admin.system.admins.fields.createdAt', template: 'date' },
  ]

  protected getItemId(item: IAdmin): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.system.admins.edit')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.system.admins.create')
  }
}
