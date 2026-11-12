import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, effect, inject, signal, untracked } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { getFilterValue } from 'app/shared/components/grid/common/grid.service'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { DatePickerModule } from 'primeng/datepicker'
import { DialogModule } from 'primeng/dialog'
import { DrawerModule } from 'primeng/drawer'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { TextareaModule } from 'primeng/textarea'
import { PaymentGridService } from '../common/payment-grid.service'
import { PaymentAdminService } from '../common/payment-admin.service'
import { formatTiyin } from '../common/money'
import {
  IPaymentSummary,
  IPaymentSummaryQuery,
  IPaymentTransaction,
  PAYMENT_EXPORT_MAX_ROWS,
  PAYMENT_PROVIDERS,
  PaymentStatus,
} from '../common/payment.model'
import { PaymentsTabsComponent } from './payments-tabs.component'

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary'

const STATUS_SEVERITY: Record<PaymentStatus, TagSeverity> = {
  pending: 'warn',
  paid: 'success',
  cancelled: 'secondary',
  failed: 'danger',
}

/** Start of the local day. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Takes a filter out of the grid filters and returns its text value. */
function takeFilter(filters: Record<string, unknown>, key: string): string | undefined {
  const value = getFilterValue(filters[key])
  delete filters[key]
  return typeof value === 'string' && value ? value : undefined
}

/**
 * Payment transactions: summary cards for a period, filters, CSV export, a detail drawer with the
 * provider requests, and cancel. Needs `payment.read`; cancel needs `payment.write`.
 */
@Component({
  selector: 'app-transactions-list',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    GridComponent,
    TableFilterComponent,
    PaymentsTabsComponent,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    DialogModule,
    DrawerModule,
    MessageModule,
    TagModule,
    TextareaModule,
    TranslocoPipe,
  ],
  providers: [PaymentGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions-list.component.html',
})
export class TransactionsListComponent extends BaseTableComponent<IPaymentTransaction> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly paymentService = inject(PaymentAdminService)
  private readonly feedback = inject(AdminFeedbackService)

  gridService = inject(PaymentGridService)
  // Rows open a drawer (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('payment.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('payment.write'))

  protected readonly drawerOpen = signal(false)
  protected readonly selected = signal<IPaymentTransaction | null>(null)
  protected readonly cancelOpen = signal(false)
  protected readonly cancelling = signal(false)

  /** Report period (days, local time): `from` is the first day, `to` the last day, both included. */
  protected readonly from = signal<Date | null>(null)
  protected readonly to = signal<Date | null>(null)
  protected readonly summary = signal<IPaymentSummary | null>(null)
  protected readonly summaryLoading = signal(false)
  protected readonly exporting = signal(false)
  /** Result of the last export: `X-Total-Count` and whether `X-Export-Truncated` was `true`. */
  protected readonly exportInfo = signal<{ count: number | null; truncated: boolean } | null>(null)
  protected readonly exportMaxRows = PAYMENT_EXPORT_MAX_ROWS
  protected readonly periodInvalid = computed(() => {
    const from = this.from()
    const to = this.to()
    return !!from && !!to && startOfDay(from).getTime() > startOfDay(to).getTime()
  })

  protected readonly cancelForm = new FormGroup({
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(255)],
    }),
    refundedExternally: new FormControl(false, { nonNullable: true }),
  })

  protected readonly formatTiyin = formatTiyin

  filterConfig: ITableFilterConfig = {
    columns: 4,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.payments.search',
        placeholder: 'admin.payments.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'status',
        type: 'select',
        label: 'admin.payments.fields.status',
        options: (Object.keys(STATUS_SEVERITY) as PaymentStatus[]).map((value) => ({
          label: `admin.payments.statuses.${value}`,
          value,
        })),
        props: { translate: true, translateSelectOptions: true },
      },
      {
        key: 'provider',
        type: 'select',
        label: 'admin.payments.fields.provider',
        options: PAYMENT_PROVIDERS.map((value) => ({ label: value, value })),
        props: { translate: true },
      },
      {
        key: 'purpose',
        type: 'select',
        label: 'admin.payments.fields.purpose',
        options: ['topup', 'order'].map((value) => ({ label: value, value })),
        props: { translate: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'createdAt', header: 'admin.payments.fields.createdAt', template: 'date' },
    { field: 'number', header: 'admin.payments.fields.number' },
    { field: 'provider', header: 'admin.payments.fields.provider' },
    { field: 'purpose', header: 'admin.payments.fields.purpose' },
    { field: 'amount', header: 'admin.payments.fields.amount', template: 'custom' },
    { field: 'status', header: 'admin.payments.fields.status', template: 'custom' },
    { field: 'account', header: 'admin.payments.fields.account' },
    { field: 'userId', header: 'admin.payments.fields.userId' },
  ]

  constructor() {
    super()
    effect(() => {
      // Reload the cards when the period changes (the dates are signals, the rest is read untracked).
      this.from()
      this.to()
      if (this.canRead()) untracked(() => this.loadSummary())
    })
  }

  /** The summary follows the provider filter, so reload it with the table. */
  override onFilterChange(filters: Record<string, unknown>): void {
    super.onFilterChange(filters)
    this.loadSummary()
  }

  protected getItemId(item: IPaymentTransaction): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.payments.transactions.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.payments.transactions.details')
  }

  /** Opens the drawer instead of a dialog: loads the transaction with the raw provider requests. */
  protected override openFormDialog(id?: string): void {
    if (!id) return
    this.selected.set(null)
    this.drawerOpen.set(true)
    this.loadSelected(id)
  }

  protected severity(status: PaymentStatus): TagSeverity {
    return STATUS_SEVERITY[status] ?? 'secondary'
  }

  protected json(value: unknown): string {
    return value === null || value === undefined ? '' : JSON.stringify(value, null, 2)
  }

  protected refreshSummary(): void {
    this.loadSummary()
  }

  /** ISO range for the summary and the export: `to` is exclusive, so it is the start of the day after the last day. */
  private range(): IPaymentSummaryQuery {
    const from = this.from()
    const to = this.to()
    const result: IPaymentSummaryQuery = {}
    if (from) result.from = startOfDay(from).toISOString()
    if (to) {
      const next = startOfDay(to)
      next.setDate(next.getDate() + 1)
      result.to = next.toISOString()
    }
    return result
  }

  private loadSummary(): void {
    if (!this.canRead()) return
    if (this.periodInvalid()) {
      this.summary.set(null)
      return
    }
    const provider = getFilterValue(this.gridService.filterSort.filters['provider'])
    this.summaryLoading.set(true)
    this.paymentService
      .summary({ ...this.range(), ...(typeof provider === 'string' && provider ? { provider } : {}) })
      .subscribe({
        next: (summary) => {
          this.summary.set(summary)
          this.summaryLoading.set(false)
        },
        error: (error: unknown) => {
          this.summaryLoading.set(false)
          this.feedback.httpError(error)
        },
      })
  }

  /**
   * Downloads the CSV with the filters, search and sort of the table and the report period. The
   * file holds at most 50000 rows: when `X-Export-Truncated` is `true` a warning asks to narrow the filters.
   */
  protected exportCsv(): void {
    if (this.periodInvalid()) return
    const { filters, sortField, sortOrder } = this.gridService.filterSort
    const query = toTableQuery({ filters, sortField, sortOrder }, ['purpose'])
    const rest = { ...(query.filters ?? {}) }
    // `status` and `provider` are typed parameters of the export route, not column filters.
    const status = takeFilter(rest, 'status') as PaymentStatus | undefined
    const provider = takeFilter(rest, 'provider')
    this.exporting.set(true)
    this.exportInfo.set(null)
    this.paymentService.exportCsv({ ...query, filters: rest }, { ...this.range(), provider, status }).subscribe({
      next: (file) => {
        this.exporting.set(false)
        this.exportInfo.set({ count: file.totalCount, truncated: file.truncated })
        this.feedback.success('admin.payments.export.done', { name: file.filename })
      },
      error: (error: unknown) => {
        this.exporting.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  protected openCancel(): void {
    this.cancelForm.reset({ comment: '', refundedExternally: false })
    this.cancelOpen.set(true)
  }

  /** A paid payment can only be cancelled when the money was returned in the provider cabinet. */
  protected canSubmitCancel(): boolean {
    const paid = this.selected()?.status === 'paid'
    return this.cancelForm.valid && (!paid || this.cancelForm.controls.refundedExternally.value)
  }

  protected submitCancel(): void {
    const transaction = this.selected()
    if (!transaction || !this.canSubmitCancel()) return
    const { comment, refundedExternally } = this.cancelForm.getRawValue()
    this.cancelling.set(true)
    this.paymentService
      .cancel(transaction.id, {
        comment: comment.trim(),
        ...(transaction.status === 'paid' ? { refundedExternally } : {}),
      })
      .subscribe({
        next: (updated) => {
          this.cancelling.set(false)
          this.cancelOpen.set(false)
          this.selected.update((current) => (current ? { ...current, ...updated } : updated))
          this.feedback.success('admin.payments.transactions.cancelled')
          const { pageIndex, pageSize } = this.gridService.pageEvent
          this.gridService.onLoadPage({ pageIndex, pageSize })
          this.loadSummary()
        },
        error: (error: unknown) => {
          this.cancelling.set(false)
          this.feedback.httpError(error)
        },
      })
  }

  private loadSelected(id: string): void {
    this.paymentService.transaction(id).subscribe({
      next: (transaction) => this.selected.set(transaction),
      error: (error: unknown) => {
        this.drawerOpen.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
