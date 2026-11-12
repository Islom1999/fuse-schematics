import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, inject, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { BaseTableComponent } from 'app/shared/abstracts'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { ITableFilterConfig, TableFilterComponent } from 'app/shared/components/table-filter'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { DialogModule } from 'primeng/dialog'
import { DrawerModule } from 'primeng/drawer'
import { DialogService } from 'primeng/dynamicdialog'
import { MessageModule } from 'primeng/message'
import { TagModule } from 'primeng/tag'
import { TextareaModule } from 'primeng/textarea'
import { PaymentGridService } from '../common/payment-grid.service'
import { PaymentAdminService } from '../common/payment-admin.service'
import { formatTiyin } from '../common/money'
import { IPaymentTransaction, PaymentStatus } from '../common/payment.model'
import { PaymentsTabsComponent } from './payments-tabs.component'

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary'

const STATUS_SEVERITY: Record<PaymentStatus, TagSeverity> = {
  pending: 'warn',
  paid: 'success',
  cancelled: 'secondary',
  failed: 'danger',
}

/** Payment transactions: filters, a detail drawer with the provider requests, and cancel. Needs `payment.read`; cancel needs `payment.write`. */
@Component({
  selector: 'app-transactions-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    GridComponent,
    TableFilterComponent,
    PaymentsTabsComponent,
    ButtonModule,
    CheckboxModule,
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
        options: ['payme', 'click'].map((value) => ({ label: value, value })),
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
