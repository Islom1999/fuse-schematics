import { IsActiveMatchOptions, Params, QueryParamsHandling } from '@angular/router'

export type UiNavigationItemType =
  | 'aside'
  | 'basic'
  | 'collapsable'
  | 'divider'
  | 'group'
  | 'spacer'

export interface UiNavigationItem {
  /** Unique id. Required for 'aside' items to open, and used by getItem/trackBy. */
  id?: string
  /** Visible label. */
  title?: string
  /** Second, smaller line under the title. */
  subtitle?: string
  /** Item kind, see 1.2. */
  type: UiNavigationItemType
  /** Free data for the app (for example role filtering). The navigation ignores it. */
  permissions?: string[]
  /** Predicate. When it returns true, the item and its subtree are not rendered. */
  hidden?: (item: UiNavigationItem) => boolean
  /** Forces the "active" look regardless of the router. */
  active?: boolean
  /** Renders the item dimmed and non-interactive. */
  disabled?: boolean
  /** Tooltip text (PrimeNG pTooltip). Empty or undefined means no tooltip. */
  tooltip?: string
  /** Router path (internal) or URL (when externalLink is true). */
  link?: string
  /** Router fragment for internal links. */
  fragment?: string
  /** Keep the current fragment on internal navigation. Default false. */
  preserveFragment?: boolean
  /** Query params for internal links. */
  queryParams?: Params | null
  /** Query params handling for internal links ('merge' | 'preserve' | ''). */
  queryParamsHandling?: QueryParamsHandling | null
  /** When true, `link` is a plain href rather than a router link. */
  externalLink?: boolean
  /** Anchor target for external links. Default '_self'. */
  target?: '_blank' | '_self' | '_parent' | '_top' | string
  /** Exact route matching for the active state. Default false (subset matching). */
  exactMatch?: boolean
  /** Full control over active-route matching. Takes priority over exactMatch. */
  isActiveMatchOptions?: IsActiveMatchOptions
  /** Click handler. It is called with the item, in addition to any navigation. */
  function?: (item: UiNavigationItem) => void
  /** Extra CSS classes added to parts of the rendered item. */
  classes?: {
    title?: string
    subtitle?: string
    icon?: string
    wrapper?: string
  }
  /** Icon name in "namespace:name" form, for example 'heroicons_outline:chart-pie'. */
  icon?: string
  /** Small pill on the trailing side of the item. */
  badge?: {
    title?: string
    /** Classes for the pill, for example 'px-2 bg-pink-600 text-white rounded-full'. */
    classes?: string
  }
  /** Child items, used by aside, collapsable and group. */
  children?: UiNavigationItem[]
  /** Free data for the app. */
  meta?: Record<string, unknown>
}

export type UiVerticalNavigationAppearance = 'default' | 'compact' | 'dense' | 'thin'
export type UiVerticalNavigationMode = 'over' | 'side'
export type UiVerticalNavigationPosition = 'left' | 'right'

/**
 * What the navigation service needs from a navigation component. Implemented by
 * `UiVerticalNavigationComponent` and `UiHorizontalNavigationComponent`.
 */
export interface UiNavigationComponentRef {
  /** Current items. */
  navigation(): UiNavigationItem[]
  /** Re-render after items were mutated in place. */
  refresh(): void
  /** Vertical navigation only. */
  toggle?(): void
  open?(): void
  close?(): void
}
