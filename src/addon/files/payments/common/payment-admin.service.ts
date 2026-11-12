import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { CsvDownload, CsvDownloadService, toExportParams } from 'app/shared/utils/csv-download'
import { Observable } from 'rxjs'
import {
  IPaymentCancel,
  IPaymentInvoice,
  IPaymentInvoiceDetail,
  IPaymentSummary,
  IPaymentSummaryQuery,
  IPaymentTransaction,
  IWallet,
  IWalletAdjust,
  IWalletReverse,
  IWalletTransaction,
  IWalletTransactionPage,
  PaymentStatus,
} from './payment.model'

/** Typed parameters of `GET admin/payments/export`, next to the table query. */
export interface IPaymentExportQuery extends IPaymentSummaryQuery {
  status?: PaymentStatus
}

/** Payment transactions, invoices and wallets of the back-end `payment` add-on (providers payme, click, uzum, paynet, inpay; optional wallet). */
@Injectable({ providedIn: 'root' })
export class PaymentAdminService {
  private readonly baseApi = inject(BaseApiService)
  private readonly csv = inject(CsvDownloadService)

  transactions(params: TableQueryDTO): Observable<IPagination<IPaymentTransaction[]>> {
    return this.baseApi.post<IPagination<IPaymentTransaction[]>>('admin/payments/pagination', { ...params })
  }

  transaction(id: string): Observable<IPaymentTransaction> {
    return this.baseApi.get<IPaymentTransaction>(`admin/payments/${id}`)
  }

  cancel(id: string, body: IPaymentCancel): Observable<IPaymentTransaction> {
    return this.baseApi.post<IPaymentTransaction>(`admin/payments/${id}/cancel`, body)
  }

  /** Newest first by default. Searches `number`, `provider`, `targetType` and `targetId`. */
  invoices(params: TableQueryDTO): Observable<IPagination<IPaymentInvoice[]>> {
    return this.baseApi.post<IPagination<IPaymentInvoice[]>>('admin/payments/invoices/pagination', { ...params })
  }

  /** The invoice with its transactions (oldest first); 404 when unknown. */
  invoice(id: string): Observable<IPaymentInvoiceDetail> {
    return this.baseApi.get<IPaymentInvoiceDetail>(`admin/payments/invoices/${id}`)
  }

  /** Revenue and counts by status and provider. `from >= to` is a 400, so check it before calling. */
  summary(query: IPaymentSummaryQuery = {}): Observable<IPaymentSummary> {
    const queryParams: Record<string, string> = {}
    if (query.from) queryParams['from'] = query.from
    if (query.to) queryParams['to'] = query.to
    if (query.provider) queryParams['provider'] = query.provider
    return this.baseApi.get<IPaymentSummary>('admin/payments/summary', { queryParams })
  }

  /**
   * Downloads `payments-YYYY-MM-DD-HH-mm-ss.csv` (UTF-8, no BOM, `amount` in tiyin) and saves it.
   * The result has `X-Total-Count` and `X-Export-Truncated`; the file holds at most 50000 rows.
   */
  exportCsv(query: TableQueryDTO, extra: IPaymentExportQuery = {}): Observable<CsvDownload> {
    return this.csv.download('admin/payments/export', 'payments', toExportParams(query, { ...extra }))
  }

  wallets(params: TableQueryDTO): Observable<IPagination<IWallet[]>> {
    return this.baseApi.post<IPagination<IWallet[]>>('admin/wallets/pagination', { ...params })
  }

  wallet(id: string): Observable<IWallet> {
    return this.baseApi.get<IWallet>(`admin/wallets/${id}`)
  }

  /** Newest first, paged with `page` (from 1) and `limit` (1 to 100). */
  walletTransactions(id: string, page: number, limit: number): Observable<IWalletTransactionPage> {
    return this.baseApi.get<IWalletTransactionPage>(`admin/wallets/${id}/transactions`, {
      queryParams: { page, limit },
    })
  }

  /** Credits or debits a wallet by hand; creates the wallet on first use. */
  adjust(body: IWalletAdjust): Observable<IWalletTransaction> {
    return this.baseApi.post<IWalletTransaction>('admin/wallets/adjust', body)
  }

  /**
   * Reverses one ledger row (adjust, purchase or refund) with a new `reversal` row of the opposite
   * amount. 409: `already_reversed`, `insufficient_funds` or `not_reversible`.
   */
  reverse(transactionId: string, body: IWalletReverse): Observable<IWalletTransaction> {
    return this.baseApi.post<IWalletTransaction>(`admin/wallets/transactions/${transactionId}/reverse`, body)
  }
}
