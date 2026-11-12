export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'
/** An invoice has no `failed` state. */
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled'
/** Providers of the back-end add-on (the ones installed answer; the others have no rows). */
export const PAYMENT_PROVIDERS = ['payme', 'click', 'uzum', 'paynet', 'inpay'] as const
/** `GET admin/payments/export` holds at most this many rows; `X-Export-Truncated` says when more matched. */
export const PAYMENT_EXPORT_MAX_ROWS = 50000
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

/**
 * `admin/payments/invoices`: what a user was asked to pay. The `user` relation is not loaded in the
 * list, only `userId`.
 */
export interface IPaymentInvoice {
  id: string
  /** A bigint kept as a string; starts at 1000000000. */
  number: string
  userId: string
  /** Tiyin. */
  amount: number
  purpose: PaymentPurpose
  targetType: string | null
  targetId: string | null
  status: InvoiceStatus
  provider: string
  expiresAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

/** `GET admin/payments/invoices/:id`: the invoice with its transactions, oldest first. */
export interface IPaymentInvoiceDetail extends IPaymentInvoice {
  transactions: IPaymentTransaction[]
}

/** Query of `GET admin/payments/summary`; `from` is inclusive, `to` exclusive (ISO date-times, `from < to`). */
export interface IPaymentSummaryQuery {
  from?: string
  to?: string
  /** `^[a-z0-9_-]{1,20}$`. */
  provider?: string
}

/** `GET admin/payments/summary`. All money is in tiyin. */
export interface IPaymentSummary {
  from: string | null
  to: string | null
  provider: string | null
  /** The sum of the `paid` amounts; cancelled payments are not revenue. */
  revenue: number
  paidCount: number
  count: number
  /** Every status, zeros included. */
  byStatus: { status: PaymentStatus; count: number; amount: number }[]
  /** Only providers with rows, by `paidAmount` descending. */
  byProvider: { provider: string; count: number; amount: number; paidCount: number; paidAmount: number }[]
}

/** Body of `POST admin/wallets/transactions/:id/reverse`. */
export interface IWalletReverse {
  /** 3 to 200 characters; kept in the ledger note. */
  comment: string
}

/** 409 codes of the wallet reverse route. */
export type WalletReverseError = 'already_reversed' | 'insufficient_funds' | 'not_reversible'
export const WALLET_REVERSE_ERRORS: readonly WalletReverseError[] = ['already_reversed', 'insufficient_funds', 'not_reversible']
/** Ledger rows that can be reversed (a reversal row, or a row of a provider payment, cannot). */
export const WALLET_REVERSIBLE_TYPES: readonly WalletTransactionType[] = ['adjust', 'purchase', 'refund']
