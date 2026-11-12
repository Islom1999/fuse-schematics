import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { UserGridService } from '../common/user-grid.service'
import { IUser } from '../common/user.model'
import { UserDetailComponent } from './user-detail.component'

/** Client users: search, filter, and a detail dialog with block and device sessions. Needs `user.read`. */
@Component({
  selector: 'app-users-list',
  imports: [GridComponent, TableFilterComponent, MessageModule, TagModule, TranslocoPipe],
  providers: [UserGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-list.component.html',
})
export class UsersListComponent extends BaseTableComponent<IUser> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)

  gridService = inject(UserGridService)
  formComponent = UserDetailComponent

  protected readonly canRead = computed(() => this.users.hasPermission('user.read'))

  filterConfig: ITableFilterConfig = {
    columns: 3,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.users.search',
        placeholder: 'admin.users.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'isBlocked',
        type: 'select',
        label: 'admin.users.fields.isBlocked',
        options: [
          { label: 'admin.users.blocked', value: true },
          { label: 'admin.users.active', value: false },
        ],
        props: { translate: true, translateSelectOptions: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'accountNo', header: 'admin.users.fields.accountNo' },
    { field: 'name', header: 'admin.users.fields.name' },
    { field: 'phone', header: 'admin.users.fields.phone' },
    { field: 'email', header: 'admin.users.fields.email' },
    { field: 'language', header: 'admin.users.fields.language' },
    { field: 'isBlocked', header: 'admin.users.fields.isBlocked', template: 'custom' },
    { field: 'lastLoginAt', header: 'admin.users.fields.lastLoginAt', template: 'date' },
    { field: 'createdAt', header: 'admin.users.fields.createdAt', template: 'date' },
  ]

  protected getItemId(item: IUser): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.users.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.users.details')
  }

  /** The dialog can block a user and revoke sessions, so the page reloads whenever it closes. */
  protected override openFormDialog(id?: string): void {
    super.openFormDialog(id)
    this.dialogRef?.onClose.subscribe(() => {
      const { pageIndex, pageSize } = this.gridService.pageEvent
      this.gridService.onLoadPage({ pageIndex, pageSize })
    })
  }
}
