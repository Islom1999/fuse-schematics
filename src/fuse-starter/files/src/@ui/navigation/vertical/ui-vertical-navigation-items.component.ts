import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { UiIconComponent } from '@ui/components/icon/ui-icon.component'
import { UiNavigationItem } from '@ui/navigation/navigation.types'
import { Tooltip } from 'primeng/tooltip'
import { UI_VERTICAL_NAVIGATION } from './ui-vertical-navigation.context'

/** Left padding of a row by nesting depth inside collapsables (index 0 = top level). */
const INDENT = [null, 56, 72, 88, 104] as const

const FOCUSABLE = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'

/** Internal: one level of vertical navigation items. Renders itself for nested levels. */
@Component({
  selector: 'ui-vertical-navigation-items',
  imports: [NgTemplateOutlet, RouterLink, Tooltip, UiIconComponent],
  templateUrl: './ui-vertical-navigation-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-vnav-items' },
})
export class UiVerticalNavigationItemsComponent {
  protected readonly nav = inject(UI_VERTICAL_NAVIGATION)

  /** Items of this level. */
  readonly items = input<UiNavigationItem[]>([])
  /** Nesting depth inside collapsables. */
  readonly depth = input(0)
  /** True only for the top level of the main list (appearance rules apply there). */
  readonly root = input(false)

  protected readonly indent = computed(() => INDENT[Math.min(this.depth(), INDENT.length - 1)])
  protected readonly iconOnly = computed(() => this.root() && this.nav.appearance() === 'thin')

  protected tooltip(item: UiNavigationItem): string {
    return item.tooltip || (this.iconOnly() ? (item.title ?? '') : '')
  }

  protected onAsideClick(item: UiNavigationItem, event: MouseEvent): void {
    // `detail` is 0 when a button is activated from the keyboard.
    this.nav.toggleAside(item, event.currentTarget as HTMLElement, event.detail === 0)
  }

  protected onCollapsableClick(item: UiNavigationItem): void {
    if (!item.disabled) this.nav.toggleCollapsable(item)
  }

  protected onCollapsableKeydown(item: UiNavigationItem, event: KeyboardEvent): void {
    if (item.disabled) return
    const expanded = this.nav.isExpanded(item)
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (!expanded) this.nav.toggleCollapsable(item)
      else (document.getElementById(this.nav.domId(item))?.querySelector(FOCUSABLE) as HTMLElement | null)?.focus()
    } else if (event.key === 'ArrowLeft' && expanded) {
      event.preventDefault()
      this.nav.toggleCollapsable(item)
    }
  }
}
