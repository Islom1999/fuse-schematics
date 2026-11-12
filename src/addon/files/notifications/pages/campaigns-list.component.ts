import { ChangeDetectionStrategy, Component, Type, computed, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { CampaignGridService } from '../common/campaign-grid.service'
import { CAMPAIGN_STATUS_SEVERITY } from '../common/campaign-status'
import { CampaignStatus, ICampaign } from '../common/campaign.model'
import { NotificationsTabsComponent } from './notifications-tabs.component'

/** Notification campaigns: list, filter, open the detail page, send or schedule a new one. Needs `notification.read`. */
@Component({
  selector: 'app-campaigns-list',
  imports: [
    RouterLink,
    GridComponent,
    TableFilterComponent,
    NotificationsTabsComponent,
    ButtonModule,
    MessageModule,
    TagModule,
    TranslocoPipe,
  ],
  providers: [CampaignGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaigns-list.component.html',
})
export class CampaignsListComponent extends BaseTableComponent<ICampaign> {
  private readonly users = inject(UserService)
  private readonly router = inject(Router)

  gridService = inject(CampaignGridService)
  // Rows open the detail page (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('notification.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('notification.write'))
  protected readonly statusSeverity = CAMPAIGN_STATUS_SEVERITY

  filterConfig: ITableFilterConfig = {
    columns: 3,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.notifications.search',
        placeholder: 'admin.notifications.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'target',
        type: 'select',
        label: 'admin.notifications.fields.target',
        options: [
          { label: 'admin.notifications.targets.all', value: 'all' },
          { label: 'admin.notifications.targets.users', value: 'users' },
          { label: 'admin.notifications.targets.platform', value: 'platform' },
          { label: 'admin.notifications.targets.topic', value: 'topic' },
        ],
        props: { translate: true, translateSelectOptions: true },
      },
      {
        key: 'status',
        type: 'select',
        label: 'admin.notifications.fields.status',
        options: (Object.keys(CAMPAIGN_STATUS_SEVERITY) as CampaignStatus[]).map((value) => ({
          label: `admin.notifications.statuses.${value}`,
          value,
        })),
        props: { translate: true, translateSelectOptions: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'createdAt', header: 'admin.notifications.fields.createdAt', template: 'date' },
    { field: 'title', header: 'admin.notifications.fields.title' },
    { field: 'type', header: 'admin.notifications.fields.type' },
    { field: 'target', header: 'admin.notifications.fields.target', template: 'custom' },
    { field: 'status', header: 'admin.notifications.fields.status', template: 'custom' },
    { field: 'sendAt', header: 'admin.notifications.fields.sendAt', template: 'date' },
    { field: 'sentCount', header: 'admin.notifications.fields.sentCount' },
    { field: 'failedCount', header: 'admin.notifications.fields.failedCount' },
  ]

  protected getItemId(item: ICampaign): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return 'admin.notifications.details'
  }

  protected getCreateHeaderKey(): string {
    return 'admin.notifications.send'
  }

  protected override openFormDialog(id?: string): void {
    if (id) void this.router.navigate(['/notifications', id])
  }
}
