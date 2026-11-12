import { DatePipe, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, effect, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { DrawerModule } from 'primeng/drawer'
import { MessageModule } from 'primeng/message'
import { SelectModule } from 'primeng/select'
import { TagModule } from 'primeng/tag'
import { ApiLogGridService } from '../common/api-log-grid.service'
import { splitApiLogQuery } from '../common/api-log-query'
import { IApiLog, IApiLogStats } from '../common/api-log.model'
import { ApiLogService } from '../common/api-log.service'

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary'

/** Read-only API log: summary cards, filters, CSV export, and a drawer with the full log. Needs `server_api_log.read`. */
@Component({
  selector: 'app-api-logs-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    GridComponent,
    TableFilterComponent,
    ButtonModule,
    DrawerModule,
    MessageModule,
    SelectModule,
    TagModule,
    TranslocoPipe,
  ],
  providers: [ApiLogGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-logs-list.component.html',
})
export class ApiLogsListComponent extends BaseTableComponent<IApiLog> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly apiLogService = inject(ApiLogService)
  private readonly feedback = inject(AdminFeedbackService)

  gridService = inject(ApiLogGridService)
  // Read-only list: rows open a drawer (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('server_api_log.read'))

  protected readonly hours = signal(24)
  protected readonly hourOptions = [1, 24, 72, 168, 720].map((value) => ({ label: `${value} h`, value }))
  protected readonly stats = signal<IApiLogStats | null>(null)

  protected readonly exporting = signal(false)

  protected readonly drawerOpen = signal(false)
  protected readonly selected = signal<IApiLog | null>(null)

  filterConfig: ITableFilterConfig = {
    columns: 4,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.apiLogs.search',
        placeholder: 'admin.apiLogs.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'type',
        type: 'select',
        label: 'admin.apiLogs.fields.type',
        options: ['API', 'PAYMENT', 'CRON', 'AUTH'].map((value) => ({ label: value, value })),
        props: { translate: true },
      },
      {
        key: 'method',
        type: 'select',
        label: 'admin.apiLogs.fields.method',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ label: value, value })),
        props: { translate: true },
      },
      { key: 'statusCode', type: 'number', label: 'admin.apiLogs.fields.statusCode', props: { translate: true } },
      { key: 'path', type: 'input', label: 'admin.apiLogs.fields.path', props: { translate: true } },
      { key: 'minDurationMs', type: 'number', label: 'admin.apiLogs.fields.minDurationMs', props: { translate: true } },
      { key: 'module', type: 'input', label: 'admin.apiLogs.fields.module', props: { translate: true } },
      { key: 'userId', type: 'input', label: 'admin.apiLogs.fields.userId', props: { translate: true } },
      { key: 'requestId', type: 'input', label: 'admin.apiLogs.fields.requestId', props: { translate: true } },
    ],
  }

  columns: IColumn[] = [
    { field: 'createdAt', header: 'admin.apiLogs.fields.createdAt', template: 'date' },
    { field: 'type', header: 'admin.apiLogs.fields.type' },
    { field: 'method', header: 'admin.apiLogs.fields.method' },
    { field: 'url', header: 'admin.apiLogs.fields.url' },
    { field: 'statusCode', header: 'admin.apiLogs.fields.statusCode', template: 'custom' },
    { field: 'durationMs', header: 'admin.apiLogs.fields.durationMs' },
    { field: 'module', header: 'admin.apiLogs.fields.module' },
    { field: 'userId', header: 'admin.apiLogs.fields.userId' },
  ]

  constructor() {
    super()
    effect(() => {
      const hours = this.hours()
      if (!this.canRead()) return
      this.apiLogService.stats(hours).subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error: unknown) => this.feedback.httpError(error),
      })
    })
  }

  /** Downloads the CSV with the search, filters and sort of the table (at most 5000 rows by default). */
  protected exportCsv(): void {
    const { filters, sortField, sortOrder } = this.gridService.filterSort
    const { table, typed } = splitApiLogQuery({ filters, sortField, sortOrder })
    this.exporting.set(true)
    this.apiLogService.exportCsv(table, typed).subscribe({
      next: (file) => {
        this.exporting.set(false)
        this.feedback.success('admin.apiLogs.exported', { name: file.filename })
      },
      error: (error: unknown) => {
        this.exporting.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  protected getItemId(item: IApiLog): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.apiLogs.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.apiLogs.details')
  }

  /** Opens the drawer instead of a dialog: loads the log with its request and response bodies. */
  protected override openFormDialog(id?: string): void {
    if (!id) return
    this.selected.set(null)
    this.drawerOpen.set(true)
    this.apiLogService.getById(id).subscribe({
      next: (log) => this.selected.set(log),
      error: (error: unknown) => {
        this.drawerOpen.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  protected severity(statusCode: number | null): TagSeverity {
    if (statusCode === null) return 'secondary'
    if (statusCode >= 500) return 'danger'
    if (statusCode >= 400) return 'warn'
    if (statusCode >= 300) return 'info'
    return 'success'
  }

  protected json(value: unknown): string {
    return value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  }
}
