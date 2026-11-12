import { Routes } from '@angular/router'
import { InvoicesListComponent } from './pages/invoices-list.component'
import { TransactionsListComponent } from './pages/transactions-list.component'
import { WalletsListComponent } from './pages/wallets-list.component'

export default [
  { path: '', component: TransactionsListComponent },
  { path: 'invoices', component: InvoicesListComponent },
  { path: 'wallets', component: WalletsListComponent },
] satisfies Routes
