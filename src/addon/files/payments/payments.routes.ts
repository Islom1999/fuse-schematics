import { Routes } from '@angular/router'
import { TransactionsListComponent } from './pages/transactions-list.component'
import { WalletsListComponent } from './pages/wallets-list.component'

export default [
  { path: '', component: TransactionsListComponent },
  { path: 'wallets', component: WalletsListComponent },
] satisfies Routes
