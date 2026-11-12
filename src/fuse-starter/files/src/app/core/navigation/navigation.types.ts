import { UiNavigationItem } from '@ui/navigation/navigation.types'

/** The four navigation variants; each layout picks the one it renders. */
export interface Navigation {
  default: UiNavigationItem[]
  compact: UiNavigationItem[]
  futuristic: UiNavigationItem[]
  horizontal: UiNavigationItem[]
}
