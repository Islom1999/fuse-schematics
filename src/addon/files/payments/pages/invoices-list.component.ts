import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, inject, signal } from '@angular/core'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { DrawerModule } from 'primeng/drawer'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'
import { InvoiceGridService } from '../common/payment-grid.service'
import { PaymentAdminService } from '../common/payment-admin.service'
import { formatTiyin } from '../common/money'
import {
  IPaymentInvoice,
  IPaymentInvoiceDetail,
  InvoiceStatus,
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

/** Invoices: filters, and a drawer with the invoice and its transactions. Read-only; needs `payment.read`. */
@Component({
  selector: 'app-invoices-list',
  imports: [
    DatePipe,
    GridComponent,
    TableFilterComponent,
    PaymentsTabsComponent,
    DrawerModule,
    MessageModule,
    TableModule,
    TagModule,
    TranslocoPipe,
  ],
  providers: [InvoiceGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoices-list.component.html',
})
export class InvoicesListComponent extends BaseTableComponent<IPaymentInvoice> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly paymentService = inject(PaymentAdminService)
  private readonly feedback = inject(AdminFeedbackService)

  gridService = inject(InvoiceGridService)
  // Rows open a drawer (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('payment.read'))

  protected readonly drawerOpen = signal(false)
  protected readonly selected = signal<IPaymentInvoiceDetail | null>(null)

  protected readonly formatTiyin = formatTiyin

  filterConfig: ITableFilterConfig = {
    columns: 4,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.payments.search',
        placeholder: 'admin.payments.invoices.searchPlaceholder',
        props: { translate: true },
      },
      {
        key: 'status',
        type: 'select',
        label: 'admin.payments.fields.status',
        options: (['pending', 'paid', 'cancelled'] satisfies InvoiceStatus[]).map((value) => ({
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
    { field: 'userId', header: 'admin.payments.fields.userId' },
    { field: 'expiresAt', header: 'admin.payments.invoices.expiresAt', template: 'date' },
    { field: 'paidAt', header: 'admin.payments.invoices.paidAt', template: 'date' },
  ]

  protected getItemId(item: IPaymentInvoice): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.payments.invoices.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.payments.invoices.details')
  }

  /** Opens the drawer instead of a dialog: loads the invoice with its transactions. */
  protected override openFormDialog(id?: string): void {
    if (!id) return
    this.selected.set(null)
    this.drawerOpen.set(true)
    this.paymentService.invoice(id).subscribe({
      next: (invoice) => this.selected.set(invoice),
      error: (error: unknown) => {
        this.drawerOpen.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  protected severity(status: PaymentStatus): TagSeverity {
    return STATUS_SEVERITY[status] ?? 'secondary'
  }
}
