import { Injectable } from '@angular/core'
import { UiNavigationComponentRef, UiNavigationItem } from './navigation.types'

/** Registry of named navigation components plus helpers for navigation trees. */
@Injectable({ providedIn: 'root' })
export class UiNavigationService {
  private readonly components = new Map<string, UiNavigationComponentRef>()
  private readonly store = new Map<string, UiNavigationItem[]>()

  registerComponent(name: string, component: UiNavigationComponentRef): void {
    this.components.set(name, component)
  }

  /** With `component`, the entry is removed only while it still points at that instance. */
  deregisterComponent(name: string, component?: UiNavigationComponentRef): void {
    if (component && this.components.get(name) !== component) return
    this.components.delete(name)
  }

  getComponent<T extends UiNavigationComponentRef = UiNavigationComponentRef>(name: string): T | undefined {
    return this.components.get(name) as T | undefined
  }

  storeNavigation(key: string, navigation: UiNavigationItem[]): void {
    this.store.set(key, navigation)
  }

  getNavigation(key: string): UiNavigationItem[] {
    return this.store.get(key) ?? []
  }

  deleteNavigation(key: string): void {
    if (!this.store.delete(key)) console.warn(`UiNavigationService: no navigation stored under "${key}"`)
  }

  /** Depth-first list of the `basic` items reachable through aside, collapsable and group children. */
  getFlatNavigation(navigation: UiNavigationItem[], flat: UiNavigationItem[] = []): UiNavigationItem[] {
    for (const item of navigation) {
      if (item.type === 'basic') flat.push(item)
      else if ((item.type === 'aside' || item.type === 'collapsable' || item.type === 'group') && item.children) {
        this.getFlatNavigation(item.children, flat)
      }
    }
    return flat
  }

  getItem(id: string, navigation: UiNavigationItem[]): UiNavigationItem | null {
    for (const item of navigation) {
      if (item.id === id) return item
      const found = item.children ? this.getItem(id, item.children) : null
      if (found) return found
    }
    return null
  }

  /** The item that directly contains `id`; `parent` (usually the root array) for a top-level match. */
  getItemParent(
    id: string,
    navigation: UiNavigationItem[],
    parent: UiNavigationItem[] | UiNavigationItem,
  ): UiNavigationItem[] | UiNavigationItem | null {
    for (const item of navigation) {
      if (item.id === id) return parent
      const found = item.children ? this.getItemParent(id, item.children, item) : null
      if (found) return found
    }
    return null
  }
}
