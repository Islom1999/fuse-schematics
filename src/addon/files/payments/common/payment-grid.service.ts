import { Injectable, inject } from '@angular/core'
import { GridResponse } from 'app/shared'
import { GridService } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { Observable, map } from 'rxjs'
import { PaymentAdminService } from './payment-admin.service'
import { IPaymentInvoice, IPaymentTransaction, IWallet } from './payment.model'

@Injectable()
export class PaymentGridService extends GridService<IPaymentTransaction> {
  private readonly paymentService = inject(PaymentAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<IPaymentTransaction>> {
    return this.paymentService.transactions(toTableQuery(params, ['status', 'provider', 'purpose'])).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}

@Injectable()
export class WalletGridService extends GridService<IWallet> {
  private readonly paymentService = inject(PaymentAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<IWallet>> {
    return this.paymentService.wallets(toTableQuery(params)).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}

@Injectable()
export class InvoiceGridService extends GridService<IPaymentInvoice> {
  private readonly paymentService = inject(PaymentAdminService)

  override getAllData(params: TableQueryDTO): Observable<GridResponse<IPaymentInvoice>> {
    return this.paymentService.invoices(toTableQuery(params, ['status', 'provider', 'purpose'])).pipe(
      map((response) => ({
        count: response.count,
        data: Array.isArray(response.data) ? response.data : [],
      })),
    )
  }
}
