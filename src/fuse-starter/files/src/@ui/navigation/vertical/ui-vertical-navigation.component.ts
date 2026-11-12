import { DOCUMENT } from '@angular/common'
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  Renderer2,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { NavigationEnd, Router } from '@angular/router'
import { UiNavigationService } from '@ui/navigation/navigation.service'
import {
  UiNavigationComponentRef,
  UiNavigationItem,
  UiVerticalNavigationAppearance,
  UiVerticalNavigationMode,
  UiVerticalNavigationPosition,
} from '@ui/navigation/navigation.types'
import { uiMatchOptions, uiRandomId, uiScrollIntoView } from '@ui/services/utils/ui-utils'
import { filter } from 'rxjs'
import { UiVerticalNavigationItemsComponent } from './ui-vertical-navigation-items.component'
import { UI_VERTICAL_NAVIGATION, UiVerticalNavigationContext } from './ui-vertical-navigation.context'

const EASING = 'cubic-bezier(0.25, 0.8, 0.25, 1)'
const BACKDROP_MS = 300
const TABBABLE = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]'

interface Backdrop {
  element: HTMLElement
  unlisten: () => void
}

/**
 * Vertical navigation drawer: side or over mode, four appearances (default, compact, dense, thin),
 * collapsable and aside items. Register it by `name` to control it through `UiNavigationService`.
 */
@Component({
  selector: 'ui-vertical-navigation',
  exportAs: 'uiVerticalNavigation',
  imports: [UiVerticalNavigationItemsComponent],
  templateUrl: './ui-vertical-navigation.component.html',
  styleUrl: './ui-vertical-navigation.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_VERTICAL_NAVIGATION, useExisting: forwardRef(() => UiVerticalNavigationComponent) }],
  host: {
    class: 'ui-vertical-navigation',
    role: 'navigation',
    tabindex: '-1',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.ui-vnav-appearance-default]': 'appearance() === "default"',
    '[class.ui-vnav-appearance-compact]': 'appearance() === "compact"',
    '[class.ui-vnav-appearance-dense]': 'appearance() === "dense"',
    '[class.ui-vnav-appearance-thin]': 'appearance() === "thin"',
    '[class.ui-vnav-mode-side]': 'mode() === "side"',
    '[class.ui-vnav-mode-over]': 'mode() === "over"',
    '[class.ui-vnav-position-left]': 'position() === "left"',
    '[class.ui-vnav-position-right]': 'position() === "right"',
    '[class.ui-vnav-opened]': 'opened()',
    '[class.ui-vnav-inner]': 'inner()',
    '[class.ui-vnav-hover]': 'hovered()',
    '[class.ui-vnav-dense-collapsed]': 'denseRail() && !denseExpanded()',
    '[class.ui-vnav-dense-expanded]': 'denseRail() && denseExpanded()',
    '[class.ui-vnav-animations-enabled]': 'animationsEnabled()',
    '(mouseenter)': 'onPointer(true)',
    '(mouseleave)': 'onPointer(false)',
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiVerticalNavigationComponent implements UiNavigationComponentRef, UiVerticalNavigationContext {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
  private readonly document = inject(DOCUMENT)
  private readonly renderer = inject(Renderer2)
  private readonly router = inject(Router)
  private readonly injector = inject(Injector)
  private readonly service = inject(UiNavigationService)

  /** Items to render. */
  readonly navigation = input<UiNavigationItem[]>([])
  /** Registry name in `UiNavigationService`; empty means a random id. */
  readonly name = input('')
  readonly appearance = input<UiVerticalNavigationAppearance>('default')
  readonly mode = input<UiVerticalNavigationMode>('side')
  readonly position = input<UiVerticalNavigationPosition>('left')
  /** Open state; supports `[(opened)]`. */
  readonly opened = model(true)
  /** Collapse other collapsables when one expands, and on navigation. */
  readonly autoCollapse = input(true)
  /** Embedded in page content: no fixed size, no own scrolling. */
  readonly inner = input(false)
  /** Over mode: invisible (but clickable) backdrop. */
  readonly transparentOverlay = input(false)
  /** Accessible name of the navigation landmark. */
  readonly ariaLabel = input('Main navigation')

  readonly appearanceChanged = output<UiVerticalNavigationAppearance>()
  readonly modeChanged = output<UiVerticalNavigationMode>()
  readonly positionChanged = output<UiVerticalNavigationPosition>()
  readonly openedChanged = output<boolean>()

  private readonly asideId = signal<string | null>(null)
  private readonly hoveredState = signal(false)
  private readonly keyboardFocusWithin = signal(false)
  private readonly version = signal(0)
  private readonly routerTick = signal(0)

  /** Id of the aside item whose panel is open. */
  readonly activeAsideItemId = this.asideId.asReadonly()
  /** Mouse is over the navigation. */
  readonly hovered = this.hoveredState.asReadonly()

  readonly asidePanelId = `ui-vnav-aside-${uiRandomId(8)}`

  /** Off on first render and after every mode change; on with the first interaction. */
  protected readonly animationsEnabled = linkedSignal({ source: this.mode, computation: () => false })
  protected readonly denseRail = computed(() => this.appearance() === 'dense' && this.mode() === 'side' && !this.inner())
  protected readonly denseExpanded = computed(() => this.hoveredState() || this.keyboardFocusWithin())

  protected readonly activeAsideItem = computed(() => {
    this.version()
    const id = this.asideId()
    return id ? this.service.getItem(id, this.navigation()) : null
  })

  /** Expanded collapsables; re-synced with the route on navigation input changes and on NavigationEnd. */
  private readonly expanded = linkedSignal<{ nav: UiNavigationItem[]; tick: number }, ReadonlySet<UiNavigationItem>>({
    source: () => ({ nav: this.navigation(), tick: this.routerTick() }),
    computation: (source, previous) => this.syncExpanded(source.nav, previous?.value),
  })

  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content')
  private readonly asidePanel = viewChild<ElementRef<HTMLElement>>('asidePanel')

  private readonly fallbackName = uiRandomId()
  private readonly ids = new WeakMap<UiNavigationItem, string>()
  private overlay: Backdrop | null = null
  private asideBackdrop: Backdrop | null = null
  private asideTrigger: HTMLElement | null = null
  private returnFocus: HTMLElement | null = null
  private scrollLocked = false
  private previousOverflow = ''
  private previousMode: UiVerticalNavigationMode | null = null
  private initialScrollDone = false

  constructor() {
    effect((onCleanup) => {
      const name = this.name() || this.fallbackName
      this.service.registerComponent(name, this)
      onCleanup(() => this.service.deregisterComponent(name, this))
    })

    effect(() => this.emitLater(this.appearanceChanged, this.appearance()))
    effect(() => this.emitLater(this.modeChanged, this.mode()))
    effect(() => this.emitLater(this.positionChanged, this.position()))

    // Mode transitions.
    effect(() => {
      const mode = this.mode()
      untracked(() => {
        if (this.previousMode === 'side' && mode === 'over') this.closeAside()
        this.previousMode = mode
      })
    })

    // Over-mode backdrop, scroll lock and focus handling follow `mode` and `opened`.
    effect(() => {
      const drawer = this.mode() === 'over' && this.opened() && !this.inner()
      untracked(() => (drawer ? this.showOverlay() : this.hideOverlay()))
    })

    effect(() => {
      if (!this.opened()) untracked(() => this.closeAside())
    })

    // Aside backdrop; transparent while the over-mode backdrop is present.
    effect(() => {
      const open = this.asideId() !== null
      const stacked = this.mode() === 'over' && this.opened()
      untracked(() => {
        if (!open) return this.removeBackdrop('aside')
        if (!this.asideBackdrop) this.asideBackdrop = this.createBackdrop(169, () => this.closeAside())
        this.asideBackdrop.element.style.backgroundColor = stacked ? 'transparent' : 'rgba(0, 0, 0, 0.3)'
      })
    })

    effect(() => {
      const transparent = this.transparentOverlay()
      if (this.overlay) this.overlay.element.style.backgroundColor = transparent ? 'transparent' : 'rgba(0, 0, 0, 0.6)'
    })

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.routerTick.update((tick) => tick + 1)
        if (this.mode() === 'over') this.close()
        else this.closeAside()
        this.scheduleInitialScroll()
      })

    this.scheduleInitialScroll()

    inject(DestroyRef).onDestroy(() => {
      this.asideId.set(null)
      this.removeBackdrop('aside', true)
      this.removeBackdrop('overlay', true)
      this.unlockScroll()
    })
  }

  // ----- public API -----

  /** Opens the navigation. */
  open(): void {
    if (this.opened()) return
    this.animationsEnabled.set(true)
    this.opened.set(true)
    this.openedChanged.emit(true)
  }

  /** Closes the navigation (and its aside panel). */
  close(): void {
    if (!this.opened()) return
    this.closeAside()
    this.animationsEnabled.set(true)
    this.opened.set(false)
    this.openedChanged.emit(false)
  }

  toggle(): void {
    if (this.opened()) this.close()
    else this.open()
  }

  /** Opens the aside panel of `item`. Needs an id; disabled items are ignored. */
  openAside(item: UiNavigationItem): void {
    if (item.disabled || !item.id) return
    this.asideId.set(item.id)
  }

  closeAside(): void {
    this.asideId.set(null)
  }

  toggleAside(item: UiNavigationItem, trigger?: HTMLElement | null, fromKeyboard = false): void {
    if (item.id && this.asideId() === item.id) return this.closeAside()
    this.openAside(item)
    if (this.asideId() !== item.id) return
    this.asideTrigger = trigger ?? null
    if (fromKeyboard) {
      afterNextRender(() => this.focusFirst(this.asidePanel()?.nativeElement), { injector: this.injector })
    }
  }

  /** Re-renders every item, for items mutated in place. */
  refresh(): void {
    this.version.update((v) => v + 1)
  }

  // ----- context for the item lists -----

  isHidden(item: UiNavigationItem): boolean {
    this.version()
    return !!item.hidden?.(item)
  }

  isRouteActive(item: UiNavigationItem): boolean {
    this.routerTick()
    if (!item.link || item.externalLink || item.disabled) return false
    const tree = this.router.createUrlTree([item.link], {
      queryParams: item.queryParams ?? undefined,
      fragment: item.fragment,
    })
    return this.router.isActive(tree, item.isActiveMatchOptions ?? uiMatchOptions(item.exactMatch))
  }

  isActive(item: UiNavigationItem): boolean {
    if (item.disabled) return false
    if (item.type === 'aside') {
      return (!!item.id && item.id === this.asideId()) || this.hasActiveDescendant(item, true)
    }
    return item.type === 'basic' && (!!item.active || this.isRouteActive(item))
  }

  isExpanded(item: UiNavigationItem): boolean {
    return this.expanded().has(item)
  }

  toggleCollapsable(item: UiNavigationItem): void {
    if (item.disabled) return
    const current = this.expanded()
    if (current.has(item)) {
      const next = new Set(current)
      for (const collapsable of this.collapsables([item])) next.delete(collapsable)
      this.expanded.set(next)
      return
    }
    const ancestors = this.ancestors(item, this.navigation()) ?? []
    const next = this.autoCollapse()
      ? new Set([...current].filter((c) => ancestors.includes(c) || this.hasActiveDescendant(c, false)))
      : new Set(current)
    next.add(item)
    this.expanded.set(next)
  }

  activate(item: UiNavigationItem): void {
    if (!item.disabled) item.function?.(item)
  }

  domId(item: UiNavigationItem): string {
    let id = this.ids.get(item)
    if (!id) this.ids.set(item, (id = `ui-vnav-${uiRandomId(8)}`))
    return id
  }

  // ----- host events -----

  protected onPointer(inside: boolean): void {
    this.animationsEnabled.set(true)
    this.hoveredState.set(inside)
  }

  protected onFocusIn(event: FocusEvent): void {
    this.keyboardFocusWithin.set((event.target as HTMLElement).matches?.(':focus-visible') ?? false)
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null
    if (!next || !this.host.contains(next)) this.keyboardFocusWithin.set(false)
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    if (event.key === 'Escape') {
      if (this.asideId() !== null) {
        event.preventDefault()
        const trigger = this.asideTrigger
        this.closeAside()
        trigger?.focus()
      } else if (this.mode() === 'over' && this.opened()) {
        event.preventDefault()
        this.close()
      }
    } else if (event.key === 'Tab' && this.mode() === 'over' && this.opened()) {
      this.trapTab(event)
    } else if (event.key === 'ArrowLeft') {
      // From inside a collapsable, move to its header.
      const target = event.target as HTMLElement
      const header = target.closest('.ui-vnav-children')?.closest('.ui-vnav-collapsable')?.querySelector('.ui-vnav-row')
      if (header instanceof HTMLElement && header !== target) {
        event.preventDefault()
        header.focus()
      }
    }
  }

  // ----- internals -----

  private emitLater<T>(emitter: { emit(value: T): void }, value: T): void {
    untracked(() => emitter.emit(value))
  }

  private syncExpanded(nav: UiNavigationItem[], previous?: ReadonlySet<UiNavigationItem>): ReadonlySet<UiNavigationItem> {
    const next = new Set<UiNavigationItem>()
    for (const item of this.collapsables(nav)) {
      if (this.hasActiveDescendant(item, false)) next.add(item)
      else if (!this.autoCollapse() && previous?.has(item)) next.add(item)
    }
    return next
  }

  /** Every collapsable in the given trees, the roots included. */
  private collapsables(items: UiNavigationItem[], out: UiNavigationItem[] = []): UiNavigationItem[] {
    for (const item of items) {
      if (item.type === 'collapsable') out.push(item)
      if (item.children) this.collapsables(item.children, out)
    }
    return out
  }

  private hasActiveDescendant(item: UiNavigationItem, basicOnly: boolean): boolean {
    return (item.children ?? []).some(
      (child) =>
        ((!basicOnly || child.type === 'basic') && this.isRouteActive(child)) ||
        this.hasActiveDescendant(child, basicOnly),
    )
  }

  private ancestors(target: UiNavigationItem, items: UiNavigationItem[]): UiNavigationItem[] | null {
    for (const item of items) {
      if (item === target) return []
      const path = item.children ? this.ancestors(target, item.children) : null
      if (path) return [item, ...path]
    }
    return null
  }

  private scheduleInitialScroll(): void {
    if (this.initialScrollDone) return
    afterNextRender(
      () => {
        if (this.initialScrollDone || this.inner()) return
        const container = this.content().nativeElement
        const active = container.querySelector('.ui-vnav-item-active')
        if (!active) return
        this.initialScrollDone = true
        uiScrollIntoView(container, active, { offsetTop: 120 })
      },
      { injector: this.injector },
    )
  }

  private showOverlay(): void {
    if (!this.overlay) {
      this.overlay = this.createBackdrop(170, () => this.close())
      this.overlay.element.style.backgroundColor = this.transparentOverlay() ? 'transparent' : 'rgba(0, 0, 0, 0.6)'
    }
    this.lockScroll()
    this.returnFocus = this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null
    afterNextRender(
      () => {
        if (!this.host.contains(this.document.activeElement)) {
          if (!this.focusFirst(this.content().nativeElement)) this.host.focus()
        }
      },
      { injector: this.injector },
    )
  }

  private hideOverlay(): void {
    if (!this.overlay) return
    this.removeBackdrop('overlay')
    const focusInside = this.host.contains(this.document.activeElement)
    if (focusInside && this.returnFocus?.isConnected) this.returnFocus.focus()
    this.returnFocus = null
  }

  private createBackdrop(zIndex: number, onClick: () => void): Backdrop {
    const element: HTMLElement = this.renderer.createElement('div')
    element.className = 'ui-vnav-backdrop'
    element.setAttribute('aria-hidden', 'true')
    Object.assign(element.style, { position: 'fixed', inset: '0', zIndex: String(zIndex) })
    const unlisten = this.renderer.listen(element, 'click', onClick)
    const parent = this.host.parentNode ?? this.document.body
    this.renderer.insertBefore(parent, element, this.host.nextSibling)
    element.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: this.motion(BACKDROP_MS), easing: EASING })
    return { element, unlisten }
  }

  private removeBackdrop(kind: 'overlay' | 'aside', immediate = false): void {
    const backdrop = kind === 'overlay' ? this.overlay : this.asideBackdrop
    if (!backdrop) return
    if (kind === 'overlay') this.overlay = null
    else this.asideBackdrop = null
    backdrop.unlisten()
    const done = () => {
      backdrop.element.remove()
      if (kind === 'overlay' && !this.overlay) this.unlockScroll()
    }
    const animation = immediate
      ? null
      : backdrop.element.animate?.([{ opacity: 1 }, { opacity: 0 }], {
          duration: this.motion(BACKDROP_MS),
          easing: EASING,
          fill: 'forwards',
        })
    if (animation) animation.finished.then(done, done)
    else done()
  }

  private lockScroll(): void {
    if (this.scrollLocked) return
    this.scrollLocked = true
    const root = this.document.documentElement
    this.previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
  }

  private unlockScroll(): void {
    if (!this.scrollLocked) return
    this.scrollLocked = false
    this.document.documentElement.style.overflow = this.previousOverflow
  }

  private tabbables(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter(
      (el) => !el.closest('[aria-hidden="true"]') && (el.checkVisibility?.({ visibilityProperty: true }) ?? true),
    )
  }

  private focusFirst(container: HTMLElement | undefined): boolean {
    const first = container ? this.tabbables(container)[0] : undefined
    first?.focus()
    return !!first
  }

  private trapTab(event: KeyboardEvent): void {
    const items = this.tabbables(this.host)
    if (!items.length) return event.preventDefault()
    const first = items[0]
    const last = items[items.length - 1]
    const active = this.document.activeElement
    if (event.shiftKey && (active === first || active === this.host)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  private motion(ms: number): number {
    return this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : ms
  }
}
