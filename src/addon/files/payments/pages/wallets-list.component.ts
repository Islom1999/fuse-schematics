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
import { DialogModule } from 'primeng/dialog'
import { DrawerModule } from 'primeng/drawer'
import { DialogService } from 'primeng/dynamicdialog'
import { InputNumberModule } from 'primeng/inputnumber'
import { MessageModule } from 'primeng/message'
import { TableLazyLoadEvent, TableModule } from 'primeng/table'
import { TextareaModule } from 'primeng/textarea'
import { WalletGridService } from '../common/payment-grid.service'
import { PaymentAdminService } from '../common/payment-admin.service'
import { formatTiyin, sumToTiyin } from '../common/money'
import { IWallet, IWalletTransaction } from '../common/payment.model'
import { PaymentsTabsComponent } from './payments-tabs.component'

const PAGE_SIZE = 10

/** Wallets: balances, a drawer with the wallet transactions, and manual adjust. Needs `payment.read`; adjust needs `payment.write`. */
@Component({
  selector: 'app-wallets-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    GridComponent,
    TableFilterComponent,
    PaymentsTabsComponent,
    ButtonModule,
    DialogModule,
    DrawerModule,
    InputNumberModule,
    MessageModule,
    TableModule,
    TextareaModule,
    TranslocoPipe,
  ],
  providers: [WalletGridService, DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wallets-list.component.html',
})
export class WalletsListComponent extends BaseTableComponent<IWallet> {
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly paymentService = inject(PaymentAdminService)
  private readonly feedback = inject(AdminFeedbackService)

  gridService = inject(WalletGridService)
  // Rows open a drawer (see openFormDialog), so there is no form component.
  formComponent!: Type<unknown>

  protected readonly canRead = computed(() => this.users.hasPermission('payment.read'))
  protected readonly canWrite = computed(() => this.users.hasPermission('payment.write'))

  protected readonly drawerOpen = signal(false)
  protected readonly selected = signal<IWallet | null>(null)
  protected readonly transactions = signal<IWalletTransaction[]>([])
  protected readonly transactionCount = signal(0)
  protected readonly transactionsLoading = signal(false)
  protected readonly pageSize = PAGE_SIZE
  private page = 1

  protected readonly adjustOpen = signal(false)
  protected readonly adjusting = signal(false)
  protected readonly adjustForm = new FormGroup({
    /** In sum; sent as whole tiyin. Negative debits the wallet. */
    amount: new FormControl<number | null>(null, [Validators.required]),
    note: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
    }),
  })

  protected readonly formatTiyin = formatTiyin

  filterConfig: ITableFilterConfig = {
    columns: 3,
    showResetButton: true,
    fields: [
      {
        key: 'search',
        type: 'input',
        label: 'admin.payments.search',
        placeholder: 'admin.payments.wallets.searchPlaceholder',
        props: { translate: true },
      },
    ],
  }

  columns: IColumn[] = [
    { field: 'user.name', header: 'admin.payments.wallets.user', template: 'custom' },
    { field: 'balance', header: 'admin.payments.wallets.balance', template: 'custom' },
    { field: 'updatedAt', header: 'admin.common.updatedAt', template: 'date' },
    { field: 'createdAt', header: 'admin.common.createdAt', template: 'date' },
  ]

  protected getItemId(item: IWallet): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return this.transloco.translate('admin.payments.wallets.details')
  }

  protected getCreateHeaderKey(): string {
    return this.transloco.translate('admin.payments.wallets.details')
  }

  /** Opens the drawer instead of a dialog: loads the wallet and its first page of transactions. */
  protected override openFormDialog(id?: string): void {
    if (!id) return
    this.selected.set(null)
    this.transactions.set([])
    this.transactionCount.set(0)
    this.page = 1
    this.drawerOpen.set(true)
    this.paymentService.wallet(id).subscribe({
      next: (wallet) => {
        // The transactions table loads its first page itself (lazy load on init).
        this.selected.set(wallet)
      },
      error: (error: unknown) => {
        this.drawerOpen.set(false)
        this.feedback.httpError(error)
      },
    })
  }

  protected onTransactionsPage(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? PAGE_SIZE
    this.page = Math.floor((event.first ?? 0) / rows) + 1
    this.loadTransactions()
  }

  protected openAdjust(): void {
    this.adjustForm.reset({ amount: null, note: '' })
    this.adjustOpen.set(true)
  }

  protected canSubmitAdjust(): boolean {
    const amount = this.adjustForm.controls.amount.value
    return this.adjustForm.valid && amount !== null && sumToTiyin(amount) !== 0
  }

  protected submitAdjust(): void {
    const wallet = this.selected()
    const amount = this.adjustForm.controls.amount.value
    if (!wallet || amount === null || !this.canSubmitAdjust()) return
    this.adjusting.set(true)
    this.paymentService
      .adjust({ userId: wallet.userId, amount: sumToTiyin(amount), note: this.adjustForm.controls.note.value.trim() })
      .subscribe({
        next: (transaction) => {
          this.adjusting.set(false)
          this.adjustOpen.set(false)
          this.selected.set({ ...wallet, balance: transaction.balanceAfter })
          this.feedback.success('admin.payments.wallets.adjusted')
          this.loadTransactions()
          const { pageIndex, pageSize } = this.gridService.pageEvent
          this.gridService.onLoadPage({ pageIndex, pageSize })
        },
        error: (error: unknown) => {
          this.adjusting.set(false)
          this.feedback.httpError(error)
        },
      })
  }

  private loadTransactions(): void {
    const wallet = this.selected()
    if (!wallet) return
    this.transactionsLoading.set(true)
    this.paymentService.walletTransactions(wallet.id, this.page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.transactions.set(Array.isArray(result.data) ? result.data : [])
        this.transactionCount.set(Number(result.count ?? 0))
        this.transactionsLoading.set(false)
      },
      error: (error: unknown) => {
        this.transactionsLoading.set(false)
        this.feedback.httpError(error)
      },
    })
  }
}
