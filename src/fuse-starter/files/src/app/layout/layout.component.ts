import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router'
import { UI_LAYOUT_NAMES, UiConfigService, UiLayoutName } from '@ui/services/config'
import { SettingsComponent } from 'app/layout/common/settings/settings.component'
import { EmptyLayoutComponent } from 'app/layout/layouts/empty/empty.component'
import { CenteredLayoutComponent } from 'app/layout/layouts/horizontal/centered/centered.component'
import { EnterpriseLayoutComponent } from 'app/layout/layouts/horizontal/enterprise/enterprise.component'
import { MaterialLayoutComponent } from 'app/layout/layouts/horizontal/material/material.component'
import { ModernLayoutComponent } from 'app/layout/layouts/horizontal/modern/modern.component'
import { ClassicLayoutComponent } from 'app/layout/layouts/vertical/classic/classic.component'
import { ClassyLayoutComponent } from 'app/layout/layouts/vertical/classy/classy.component'
import { CompactLayoutComponent } from 'app/layout/layouts/vertical/compact/compact.component'
import { DenseLayoutComponent } from 'app/layout/layouts/vertical/dense/dense.component'
import { FuturisticLayoutComponent } from 'app/layout/layouts/vertical/futuristic/futuristic.component'
import { ThinLayoutComponent } from 'app/layout/layouts/vertical/thin/thin.component'
import { filter } from 'rxjs'

function isLayoutName(value: unknown): value is UiLayoutName {
  return typeof value === 'string' && (UI_LAYOUT_NAMES as readonly string[]).includes(value)
}

/**
 * Layout host: renders the active layout and the settings panel.
 *
 * The layout comes from `UiConfigService`. A `?layout=` query parameter is written into the
 * config (persisted); a route `data.layout` overrides it for that route only, without persisting.
 * Scheme and theme classes are applied by `provideUi()`, not here.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    SettingsComponent,
    EmptyLayoutComponent,
    ClassicLayoutComponent,
    ClassyLayoutComponent,
    CompactLayoutComponent,
    DenseLayoutComponent,
    FuturisticLayoutComponent,
    ThinLayoutComponent,
    CenteredLayoutComponent,
    EnterpriseLayoutComponent,
    MaterialLayoutComponent,
    ModernLayoutComponent,
  ],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-auto w-full' },
})
export class LayoutComponent {
  private readonly router = inject(Router)
  private readonly config = inject(UiConfigService)

  /** Layout forced by the deepest route `data.layout`, if any. */
  private readonly routeLayout = signal<string | null>(null)

  /** The layout to render; unknown names fall back to `empty`. */
  readonly layout = computed<UiLayoutName>(() => {
    const name = this.routeLayout() ?? this.config.layout()
    return isLayoutName(name) ? name : 'empty'
  })

  constructor() {
    this.syncWithRoute()
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.syncWithRoute())
  }

  private syncWithRoute(): void {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root
    while (route.firstChild) route = route.firstChild

    const queryLayout = route.queryParamMap.get('layout')
    if (isLayoutName(queryLayout)) this.config.set({ layout: queryLayout })

    let override: string | null = null
    for (const item of route.pathFromRoot) {
      const value = item.routeConfig?.data?.['layout']
      if (value !== undefined && value !== null) override = String(value)
    }
    this.routeLayout.set(override)
  }
}
