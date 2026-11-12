export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'
export type PaymentPurpose = 'topup' | 'order'
export type WalletTransactionType = 'topup' | 'purchase' | 'refund' | 'reversal' | 'adjust'

/**
 * `admin/payments`. Amounts are in tiyin (1 sum = 100). In the list `user` and `invoice` are not
 * loaded, only their ids. `raw` (the provider requests) comes with `GET :id`.
 */
export interface IPaymentTransaction {
  id: string
  number: string | number
  provider: string
  externalId: string | null
  amount: number
  state: number | null
  status: PaymentStatus
  purpose: PaymentPurpose
  targetType: string | null
  targetId: string | null
  userId: string | null
  invoiceId: string | null
  account: string | null
  providerTime: string | null
  performedAt: string | null
  cancelledAt: string | null
  reason: number | null
  raw?: unknown
  createdAt: string
}

/** Body of `POST admin/payments/:id/cancel`. */
export interface IPaymentCancel {
  /** 3 to 255 characters. */
  comment: string
  /** Must be true to cancel a paid payment: the money was already returned in the provider cabinet. */
  refundedExternally?: boolean
}

/** `admin/wallets`: the balance of one user, in tiyin. */
export interface IWallet {
  id: string
  userId: string
  user?: { id: string; name: string | null; accountNo?: string } | null
  balance: number
  createdAt: string
  updatedAt: string
}

export interface IWalletTransaction {
  id: string
  walletId: string
  /** Signed: negative for debits. */
  amount: number
  type: WalletTransactionType
  paymentTransactionId: string | null
  reference: string | null
  note: string | null
  balanceAfter: number
  createdAt: string
}

/** Body of `POST admin/wallets/adjust`; a debit that would overdraw the wallet is refused with 409. */
export interface IWalletAdjust {
  userId: string
  /** A non-zero integer in tiyin. */
  amount: number
  /** 3 to 200 characters. */
  note: string
}

/** Wallet transactions use `page` and `limit` (not `first` and `rows`). */
export interface IWalletTransactionPage {
  count: number
  data: IWalletTransaction[]
}
