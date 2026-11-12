import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'

/** Links between the overview page (`admin/ai/stats`) and the quota usage page (`admin/ai/usage`). */
@Component({
  selector: 'app-ai-tabs',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex gap-2" [attr.aria-label]="'admin.ai.title' | transloco">
      <a
        routerLink="/ai"
        routerLinkActive="bg-primary text-white"
        [routerLinkActiveOptions]="{ exact: true }"
        class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium"
      >
        {{ 'admin.ai.tabs.overview' | transloco }}
      </a>
      <a
        routerLink="/ai/usage"
        routerLinkActive="bg-primary text-white"
        class="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium"
      >
        {{ 'admin.ai.tabs.usage' | transloco }}
      </a>
    </nav>
  `,
})
export class AiTabsComponent {}
