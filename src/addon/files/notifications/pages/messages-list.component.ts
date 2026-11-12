import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { DrawerModule } from 'primeng/drawer'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { PUSH_STATUS_SEVERITY } from '../common/campaign-status'
import { INotification, PushStatus } from '../common/campaign.model'
import { NotificationAdminService } from '../common/notification-admin.service'
import { NotificationGridService } from '../common/notification-grid.service'
import { NotificationsTabsComponent } from './notifications-tabs.component'

/**
 * Notifications delivered to users (all users, or one user by id): a drawer shows the message, its
 * push result, and resend and delete (`notification.write`). Needs `notification.read`.
 */
@Component({
  selector: 'app-messages-list',
  imports: [
    DatePipe,
    RouterLink,
    GridComponent,
    TableFilterComponent,
    NotificationsTabsComponent,
    ButtonModule,
    DrawerModule,
    MessageModule,
    TagModule,
    TranslocoPipe,
  ],
  providers: [NotificationGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messages-list.component.html',
})
export class MessagesListComponent extends BaseTableComponent<INotification> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly service = inject(NotificationAdminService)
  private readonly feedback = inject(AdminFeedbackService)

  gridService = inject(NotificationGridService)
  // Rows open a drawer (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('notification.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('notification.write'))
  protected readonly pushSeverity = PUSH_STATUS_SEVERITY

  protected readonly drawerOpen = signal(false)
  protected readonly selected = signal<INotification | null>(null)
  protected readonly working = signal(false)

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
      { key: 'userId', type: 'input', label: 'admin.notifications.fields.userId', props: { translate: true } },
      {
        key: 'pushStatus',
        type: 'select',
        label: 'admin.notifications.fields.pushStatus',
        options: (Object.keys(PUSH_STATUS_SEVERITY) as PushStatus[]).map((value) => ({
          label: `admin.notifications.pushStatuses.${value}`,
          value,
        })),
        props: { translate: true, translateSelectOptions: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'createdAt', header: 'admin.notifications.fields.createdAt', template: 'date' },
    { field: 'userId', header: 'admin.notifications.fields.userId' },
    { field: 'type', header: 'admin.notifications.fields.type' },
    { field: 'title', header: 'admin.notifications.fields.title' },
    { field: 'pushStatus', header: 'admin.notifications.fields.pushStatus', template: 'custom' },
    { field: 'readAt', header: 'admin.notifications.fields.readAt', template: 'date' },
  ]

  protected getItemId(item: INotification): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.notifications.messages.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.notifications.messages.details')
  }

  /** Opens the drawer with the clicked row (the list already holds the whole notification). */
  protected override openFormDialog(id?: string): void {
    const item = this.gridService.data().find((row) => row.id === id)
    if (!item) return
    this.selected.set(item)
    this.drawerOpen.set(true)
  }

  protected json(value: unknown): string {
    return value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  }

  /** Delivers the notification again: it becomes unread and the push is sent again. */
  protected resend(): void {
    const item = this.selected()
    if (!item) return
    this.working.set(true)
    this.service.resend(item.id).subscribe({
      next: (updated) => {
        this.working.set(false)
        this.selected.set({ ...item, ...updated })
        this.feedback.success('admin.notifications.messages.resent')
        this.reload()
      },
      error: (error: unknown) => {
        this.working.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  /** Soft delete: the user no longer sees the notification. */
  protected remove(): void {
    const item = this.selected()
    if (!item) return
    this.feedback
      .confirm('admin.notifications.messages.deleteConfirm.title', 'admin.notifications.messages.deleteConfirm.message')
      .subscribe(() => {
        this.working.set(true)
        this.service.remove(item.id).subscribe({
          next: () => {
            this.working.set(false)
            this.drawerOpen.set(false)
            this.feedback.success('admin.common.deleted')
            this.reload()
          },
          error: (error: unknown) => {
            this.working.set(false)
            this.feedback.httpError(error)
          },
        })
      })
  }

  private reload(): void {
    const { pageIndex, pageSize } = this.gridService.pageEvent
    this.gridService.onLoadPage({ pageIndex, pageSize })
  }
}
