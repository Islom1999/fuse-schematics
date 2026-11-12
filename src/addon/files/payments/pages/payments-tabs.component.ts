import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'

/** Links between the transactions, invoices and wallets pages. */
@Component({
  selector: 'app-payments-tabs',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="mb-4 flex gap-2" [attr.aria-label]="'admin.payments.title' | transloco">
      <a
        routerLink="/payments"
        routerLinkActive="bg-primary text-white"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium"
      >
        {{ 'admin.payments.transactions.title' | transloco }}
      </a>
      <a
        routerLink="/payments/invoices"
        routerLinkActive="bg-primary text-white"
        class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium"
      >
        {{ 'admin.payments.invoices.title' | transloco }}
      </a>
      <a
        routerLink="/payments/wallets"
        routerLinkActive="bg-primary text-white"
        class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium"
      >
        {{ 'admin.payments.wallets.title' | transloco }}
      </a>
    </nav>
  `,
})
export class PaymentsTabsComponent {}
