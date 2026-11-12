import { Injectable, signal } from '@angular/core'
import { UiNavigationItem } from '@ui/navigation/navigation.types'
import { Observable, of, tap } from 'rxjs'
import { compactNavigation, defaultNavigation, futuristicNavigation, horizontalNavigation } from './navigation'
import { Navigation } from './navigation.types'

const EMPTY_NAVIGATION: Navigation = { default: [], compact: [], futuristic: [], horizontal: [] }

function cloneItem(item: UiNavigationItem): UiNavigationItem {
  return { ...item, children: item.children?.map(cloneItem) }
}

function findById(items: readonly UiNavigationItem[], id: string): UiNavigationItem | undefined {
  for (const item of items) {
    if (item.id === id) return item
    const found = item.children ? findById(item.children, id) : undefined
    if (found) return found
  }
  return undefined
}

/**
 * Copies a variant and gives each top-level item the children of the `defaultNavigation` item
 * with the same `id`, so the short variants only list their top-level entries.
 */
function withDefaultChildren(items: readonly UiNavigationItem[], source: readonly UiNavigationItem[]): UiNavigationItem[] {
  return items.map((item) => {
    const match = item.id ? findById(source, item.id) : undefined
    const copy = cloneItem(item)
    if (match?.children?.length) copy.children = match.children.map(cloneItem)
    return copy
  })
}

/** Builds the four variants from the static arrays in `navigation.ts`. */
export function buildNavigation(): Navigation {
  const source = defaultNavigation as UiNavigationItem[]
  return {
    default: source.map(cloneItem),
    compact: withDefaultChildren(compactNavigation as UiNavigationItem[], source),
    futuristic: withDefaultChildren(futuristicNavigation as UiNavigationItem[], source),
    horizontal: withDefaultChildren(horizontalNavigation as UiNavigationItem[], source),
  }
}

/** Navigation for the layouts. Loaded by the `initialData` resolver. */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly state = signal<Navigation>(EMPTY_NAVIGATION)

  readonly navigation = this.state.asReadonly()

  /** Builds the navigation (there is no `GET navigation` on the backend yet) and stores it. */
  load(): Observable<Navigation> {
    return of(buildNavigation()).pipe(tap((navigation) => this.state.set(navigation)))
  }

  reset(): void {
    this.state.set(EMPTY_NAVIGATION)
  }
}
