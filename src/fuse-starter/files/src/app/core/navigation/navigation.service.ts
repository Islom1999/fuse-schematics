import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable, signal } from '@angular/core'
import { UiNavigationItem } from '@ui/navigation/navigation.types'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { catchError, map, Observable, of, tap } from 'rxjs'
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

function collectIds(items: readonly UiNavigationItem[], into = new Set<string>()): Set<string> {
  for (const item of items) {
    if (item.id) into.add(item.id)
    if (item.children) collectIds(item.children, into)
  }
  return into
}

/** Static items whose `id` is not in `known` (children filtered the same way; emptied groups dropped). */
function missingItems(items: readonly UiNavigationItem[], known: ReadonlySet<string>): UiNavigationItem[] {
  const result: UiNavigationItem[] = []
  for (const item of items) {
    if (item.id && known.has(item.id)) continue
    const copy = cloneItem(item)
    if (item.children?.length) {
      copy.children = missingItems(item.children, known)
      if (!copy.children.length) continue
    }
    result.push(copy)
  }
  return result
}

/**
 * Appends the static items whose `id` the backend did not send (the CRUD generator adds its entries
 * to `navigation.ts` only). Items present on both sides keep the backend version; a group on both
 * sides also receives the static children it lacks.
 */
export function mergeStaticNavigation(
  backend: readonly UiNavigationItem[],
  staticItems: readonly UiNavigationItem[],
): UiNavigationItem[] {
  const known = collectIds(backend)
  const merged = backend.map((item) => {
    const match = item.id ? staticItems.find((candidate) => candidate.id === item.id) : undefined
    if (!match?.children?.length || !item.children) return cloneItem(item)
    const copy = cloneItem(item)
    copy.children = [...copy.children!, ...missingItems(match.children, known)]
    return copy
  })
  return [...merged, ...missingItems(staticItems, known)]
}

/** Navigation for the layouts. Loaded by the `initialData` resolver. */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient)
  private readonly url = `${inject(DITokens.API_BASE_URL)}/navigation`
  private readonly state = signal<Navigation>(EMPTY_NAVIGATION)

  readonly navigation = this.state.asReadonly()

  /**
   * Builds the navigation from `navigation.ts` (`features.navigation === 'static'`), or loads
   * `GET navigation` and appends the static items it lacks (`'backend'`), then stores it.
   */
  load(): Observable<Navigation> {
    const source: Observable<Navigation> =
      environment.features.navigation === 'backend' ? this.loadFromBackend() : of(buildNavigation())
    return source.pipe(tap((navigation) => this.state.set(navigation)))
  }

  reset(): void {
    this.state.set(EMPTY_NAVIGATION)
  }

  /** A 404 (a backend without `GET navigation`) falls back to the static navigation; other errors reach the caller. */
  private loadFromBackend(): Observable<Navigation> {
    const fallback = buildNavigation()
    return this.http.get<Navigation>(this.url).pipe(
      map((remote) => ({
        default: mergeStaticNavigation(remote.default ?? [], fallback.default),
        compact: mergeStaticNavigation(remote.compact ?? [], fallback.compact),
        futuristic: mergeStaticNavigation(remote.futuristic ?? [], fallback.futuristic),
        horizontal: mergeStaticNavigation(remote.horizontal ?? [], fallback.horizontal),
      })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) return of(fallback)
        throw error
      }),
    )
  }
}
