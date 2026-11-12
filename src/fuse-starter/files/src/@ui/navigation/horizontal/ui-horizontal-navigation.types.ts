import { MenuItem } from 'primeng/api'
import { UiNavigationItem } from '@ui/navigation/navigation.types'

/** How an entry renders: the element kind of its row. */
export type UiHorizontalNavigationEntryKind =
  | 'link'
  | 'external'
  | 'button'
  | 'static'
  | 'branch'
  | 'divider'
  | 'spacer'

/** Render model of one navigation item (top level or inside a menu). */
export interface UiHorizontalNavigationEntry {
  /** Stable key for `track` and menu ids. */
  key: string
  item: UiNavigationItem
  kind: UiHorizontalNavigationEntryKind
  disabled: boolean
  /** Router-matched, forced with `active: true`, or (branches) any descendant active. */
  active: boolean
  /** Sprite icon name, when `item.icon` is a sprite reference. */
  svgIcon: string | null
  /** Font icon classes, when `item.icon` contains spaces (for example `pi pi-home`). */
  fontIcon: string | null
  /** Visible children (branches only). */
  children: UiHorizontalNavigationEntry[]
  /** PrimeNG TieredMenu model built from the children (branches only). */
  menu: MenuItem[]
}

/** Key on `MenuItem` that holds the entry, so the item template can render it. */
export const UI_HNAV_ENTRY = 'uiEntry'
