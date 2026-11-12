import { InjectionToken, Signal } from '@angular/core'
import { UiNavigationItem, UiVerticalNavigationAppearance } from '@ui/navigation/navigation.types'

/** What the internal item lists need from their `ui-vertical-navigation`. */
export interface UiVerticalNavigationContext {
  readonly appearance: Signal<UiVerticalNavigationAppearance>
  readonly activeAsideItemId: Signal<string | null>
  /** DOM id of the aside panel. */
  readonly asidePanelId: string
  isHidden(item: UiNavigationItem): boolean
  /** Active look: forced or router-active basic item, open aside or aside with an active descendant. */
  isActive(item: UiNavigationItem): boolean
  /** Router-active internal link (for `aria-current`). */
  isRouteActive(item: UiNavigationItem): boolean
  isExpanded(item: UiNavigationItem): boolean
  toggleCollapsable(item: UiNavigationItem): void
  toggleAside(item: UiNavigationItem, trigger?: HTMLElement | null, fromKeyboard?: boolean): void
  /** Runs the item's `function`. */
  activate(item: UiNavigationItem): void
  /** Stable DOM id for an item. */
  domId(item: UiNavigationItem): string
}

export const UI_VERTICAL_NAVIGATION = new InjectionToken<UiVerticalNavigationContext>('UI_VERTICAL_NAVIGATION')
