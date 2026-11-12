import { DOCUMENT, NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router, RouterLink } from '@angular/router'
import { MenuItem } from 'primeng/api'
import { TieredMenu } from 'primeng/tieredmenu'
import { Tooltip } from 'primeng/tooltip'
import { filter, map } from 'rxjs'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiNavigationService } from '@ui/navigation/navigation.service'
import { UiNavigationComponentRef, UiNavigationItem } from '@ui/navigation/navigation.types'
import { uiMatchOptions, uiRandomId } from '@ui/services/utils/ui-utils'
import {
  UI_HNAV_ENTRY,
  UiHorizontalNavigationEntry,
  UiHorizontalNavigationEntryKind,
} from './ui-horizontal-navigation.types'

const BRANCH_TYPES = new Set<UiNavigationItem['type']>(['aside', 'collapsable', 'group'])

/** Keyboard focus ring for bar rows: inset, because the wrapper clips outlines. */
const ROW_FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50'

/** Row state classes for menu rows: hover, keyboard focus and open submenu all use the theme hover color. */
const MENU_ROW_INTERACTIVE = 'hover:bg-hover [.p-focus>*>&]:bg-hover [.p-tieredmenu-item-active>*>&]:bg-hover'

/**
 * Horizontal top-bar navigation. Basic items render as links or buttons; aside, collapsable
 * and group items open a PrimeNG TieredMenu popup with nested flyouts.
 */
@Component({
  selector: 'ui-horizontal-navigation',
  exportAs: 'uiHorizontalNavigation',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, TieredMenu, Tooltip, UiIconComponent],
  templateUrl: './ui-horizontal-navigation.component.html',
  styleUrl: './ui-horizontal-navigation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ui-horizontal-navigation',
  },
})
export class UiHorizontalNavigationComponent implements UiNavigationComponentRef {
  private readonly router = inject(Router)
  private readonly document = inject(DOCUMENT)
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly navigationService = inject(UiNavigationService)

  /** Items to render. */
  readonly navigation = input<UiNavigationItem[]>([])
  /** Registry name in `UiNavigationService`; empty means a random id. */
  readonly name = input<string>('')
  /** Accessible name of the `<nav>` landmark. */
  readonly ariaLabel = input<string>('Main navigation')

  private readonly fallbackName = uiRandomId()
  /** Effective registry name. */
  readonly resolvedName = computed(() => this.name() || this.fallbackName)

  private readonly version = signal(0)
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  )

  /** Key of the branch whose menu is open. */
  protected readonly openKey = signal<string | null>(null)
  /** Scheme class (`light`/`dark`) of the host context, copied onto the body-level menu panel. */
  protected readonly menuScheme = signal('')
  protected readonly menuStyleClass = computed(
    () => `ui-hnav-menu bg-card text-default [&_.p-tieredmenu-submenu]:bg-card ${this.menuScheme()}`.trim(),
  )
  private readonly reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  protected readonly showTransition = this.reducedMotion ? '0ms' : '.12s cubic-bezier(0, 0, 0.2, 1)'
  protected readonly hideTransition = this.reducedMotion ? '0ms' : '.1s linear'

  private readonly menus = viewChildren(TieredMenu)

  /** Render model; re-evaluates `hidden` and active states on input change, navigation and `refresh()`. */
  protected readonly entries = computed(() => {
    this.version()
    this.url()
    return this.buildEntries(this.navigation(), this.resolvedName())
  })

  private readonly registration = effect((onCleanup) => {
    const name = this.resolvedName()
    untracked(() => this.navigationService.registerComponent(name, this))
    onCleanup(() => this.navigationService.deregisterComponent(name, this))
  })

  private readonly closeOnNavigation = this.router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    )
    .subscribe(() => this.closeMenus())

  /** Re-renders after items were mutated in place. */
  refresh(): void {
    this.version.update((v) => v + 1)
  }

  /** Closes any open branch menu. */
  closeMenus(): void {
    for (const menu of this.menus()) if (menu.visible) menu.hide()
  }

  protected toggleMenu(entry: UiHorizontalNavigationEntry, menu: TieredMenu, event: Event): void {
    if (entry.disabled || !entry.menu.length) return
    for (const other of this.menus()) if (other !== menu && other.visible) other.hide()
    this.menuScheme.set(this.hostScheme())
    menu.toggle(event)
  }

  protected openMenuFromKeyboard(entry: UiHorizontalNavigationEntry, menu: TieredMenu, event: Event): void {
    event.preventDefault()
    if (menu.visible) return
    this.toggleMenu(entry, menu, event)
  }

  protected menuShown(entry: UiHorizontalNavigationEntry): void {
    this.openKey.set(entry.key)
  }

  protected menuHidden(entry: UiHorizontalNavigationEntry, trigger: HTMLElement): void {
    if (this.openKey() === entry.key) this.openKey.set(null)
    // Focus still inside the panel would be lost when it is removed: move it back to the trigger.
    if (this.document.activeElement?.closest('.ui-hnav-menu')) trigger.focus()
  }

  protected itemClicked(entry: UiHorizontalNavigationEntry): void {
    if (!entry.disabled) entry.item.function?.(entry.item)
  }

  protected entryOf(menuItem: MenuItem): UiHorizontalNavigationEntry {
    return menuItem[UI_HNAV_ENTRY] as UiHorizontalNavigationEntry
  }

  protected wrapperClass(entry: UiHorizontalNavigationEntry): string {
    const classes = [entry.item.classes?.wrapper ?? '']
    if (entry.disabled) classes.push('ui-hnav__wrapper--disabled')
    else classes.push('sm:hover:bg-hover')
    if (this.openKey() === entry.key) classes.push('bg-hover')
    return classes.join(' ')
  }

  protected rowClass(entry: UiHorizontalNavigationEntry): string {
    const classes = [ROW_FOCUS_RING]
    if (entry.item.subtitle) classes.push('ui-hnav__row--subtitle')
    if (entry.active) classes.push('text-primary')
    return classes.join(' ')
  }

  protected menuRowClass(entry: UiHorizontalNavigationEntry): string {
    const classes = [entry.item.classes?.wrapper ?? '']
    if (entry.item.subtitle) classes.push('ui-hnav-menu__row--subtitle')
    if (!entry.disabled) classes.push(MENU_ROW_INTERACTIVE)
    if (entry.active) classes.push('text-primary')
    return classes.join(' ')
  }

  protected subtitleClass(entry: UiHorizontalNavigationEntry): string {
    return entry.active ? 'text-primary-400 dark:text-primary-600' : 'text-hint'
  }

  protected menuId(entry: UiHorizontalNavigationEntry): string {
    return `ui-hnav-${entry.key}`
  }

  private hostScheme(): string {
    const scope = this.host.nativeElement.closest('.dark, .light')
    return scope ? (scope.classList.contains('dark') ? 'dark' : 'light') : ''
  }

  private buildEntries(items: UiNavigationItem[] | null | undefined, prefix: string): UiHorizontalNavigationEntry[] {
    const entries: UiHorizontalNavigationEntry[] = []
    ;(items ?? []).forEach((item, index) => {
      if (item.hidden?.(item)) return
      entries.push(this.buildEntry(item, `${prefix}-${item.id ?? index}`))
    })
    return entries
  }

  private buildEntry(item: UiNavigationItem, key: string): UiHorizontalNavigationEntry {
    const disabled = !!item.disabled
    const icon = item.icon || null
    const fontIcon = icon && icon.includes(' ') ? icon : null
    const kind = this.kindOf(item)
    const children = kind === 'branch' ? this.buildEntries(item.children, key) : []
    const active =
      !disabled &&
      (!!item.active ||
        (kind === 'link' && this.isRouteActive(item)) ||
        (kind === 'branch' && children.some((child) => child.active)))

    return {
      key,
      item,
      kind,
      disabled,
      active,
      svgIcon: fontIcon ? null : icon,
      fontIcon,
      children,
      menu: kind === 'branch' && !disabled ? this.buildMenu(children) : [],
    }
  }

  private kindOf(item: UiNavigationItem): UiHorizontalNavigationEntryKind {
    if (BRANCH_TYPES.has(item.type)) return 'branch'
    if (item.type === 'divider') return 'divider'
    if (item.type === 'spacer') return 'spacer'
    if (item.disabled) return 'static'
    if (item.link) return item.externalLink ? 'external' : 'link'
    return item.function ? 'button' : 'static'
  }

  private buildMenu(entries: UiHorizontalNavigationEntry[]): MenuItem[] {
    const menu: MenuItem[] = []
    for (const entry of entries) {
      if (entry.kind === 'spacer') continue
      if (entry.kind === 'divider') {
        menu.push({ separator: true, styleClass: 'ui-hnav-menu__divider divider' })
        continue
      }
      const item = entry.item
      const submenu = entry.kind === 'branch' && !entry.disabled ? this.buildMenu(entry.children) : []
      menu.push({
        label: item.title,
        disabled: entry.disabled,
        items: submenu.length ? submenu : undefined,
        styleClass: 'ui-hnav-menu__item',
        tooltipOptions: item.tooltip ? { tooltipLabel: item.tooltip, tooltipPosition: 'right' } : undefined,
        command: entry.kind === 'branch' ? undefined : () => this.itemClicked(entry),
        [UI_HNAV_ENTRY]: entry,
      })
    }
    return menu
  }

  private isRouteActive(item: UiNavigationItem): boolean {
    if (!item.link) return false
    const tree = this.router.createUrlTree([item.link], {
      queryParams: item.queryParams ?? undefined,
      fragment: item.fragment,
    })
    return this.router.isActive(tree, item.isActiveMatchOptions ?? uiMatchOptions(item.exactMatch))
  }
}
