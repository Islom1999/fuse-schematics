import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import {
  IPaymentCancel,
  IPaymentTransaction,
  IWallet,
  IWalletAdjust,
  IWalletTransaction,
  IWalletTransactionPage,
} from './payment.model'

/** Payment transactions and wallets of the back-end `payment` add-on (providers payme and click, optional wallet). */
@Injectable({ providedIn: 'root' })
export class PaymentAdminService {
  private readonly baseApi = inject(BaseApiService)

  transactions(params: TableQueryDTO): Observable<IPagination<IPaymentTransaction[]>> {
    return this.baseApi.post<IPagination<IPaymentTransaction[]>>('admin/payments/pagination', { ...params })
  }

  transaction(id: string): Observable<IPaymentTransaction> {
    return this.baseApi.get<IPaymentTransaction>(`admin/payments/${id}`)
  }

  cancel(id: string, body: IPaymentCancel): Observable<IPaymentTransaction> {
    return this.baseApi.post<IPaymentTransaction>(`admin/payments/${id}/cancel`, body)
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
}
