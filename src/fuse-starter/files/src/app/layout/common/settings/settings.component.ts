import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core'
import { Router } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiConfigService, UiLayoutName, UiScheme } from '@ui/services/config'
import { ButtonDirective } from 'primeng/button'
import { Drawer } from 'primeng/drawer'
import { Tooltip } from 'primeng/tooltip'

interface SchemeOption {
  value: UiScheme
  icon: string
}

/** Layout picker cells in display order; `null` is the spacer after Thin. */
const LAYOUT_GRID: ReadonlyArray<UiLayoutName | null> = [
  'empty',
  'classic',
  'classy',
  'compact',
  'dense',
  'futuristic',
  'thin',
  null,
  'centered',
  'enterprise',
  'material',
  'modern',
]

const SCHEMES: readonly SchemeOption[] = [
  { value: 'auto', icon: 'heroicons_solid:bolt' },
  { value: 'dark', icon: 'heroicons_solid:moon' },
  { value: 'light', icon: 'heroicons_solid:sun' },
]

/**
 * Settings cog (fixed at the right edge) and the drawer it opens: theme, scheme and layout
 * pickers, all driven by `UiConfigService`.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ButtonDirective, Drawer, Tooltip, TranslocoPipe, UiIconComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The drawer is moved to <body>: its styles must be global (scoped by the `settings-*` classes).
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponent {
  private readonly router = inject(Router)
  private readonly config = inject(UiConfigService)

  protected readonly opened = signal(false)
  protected readonly layout = this.config.layout
  protected readonly scheme = this.config.scheme
  protected readonly theme = this.config.theme
  protected readonly themes = computed(() =>
    this.config.themes().map((theme) => ({ ...theme, key: theme.id.replace(/^theme-/, '') })),
  )
  protected readonly schemes = SCHEMES
  protected readonly layoutGrid = LAYOUT_GRID

  open(): void {
    this.opened.set(true)
  }

  close(): void {
    this.opened.set(false)
  }

  setTheme(theme: string): void {
    this.config.set({ theme })
  }

  setScheme(scheme: UiScheme): void {
    this.config.set({ scheme })
  }

  /** Drops a `?layout=` override from the URL, then stores the choice. */
  setLayout(layout: UiLayoutName): void {
    void this.router.navigate([], { queryParams: { layout: null }, queryParamsHandling: 'merge' })
    this.config.set({ layout })
  }
}
