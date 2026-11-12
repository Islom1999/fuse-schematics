import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import { computed, DestroyRef, inject, Injectable, Injector, PLATFORM_ID, Signal, untracked } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { UiConfigService } from '@ui/services/config/ui-config.service'
import { defer, distinctUntilChanged, Observable, startWith } from 'rxjs'
import { uiMediaQuerySignal } from './ui-media-query'

export interface UiMediaChange {
  matchingAliases: string[]
  matchingQueries: Record<string, string>
}

export interface UiMediaQueryState {
  /** True when at least one of the queries matches. */
  matches: boolean
  breakpoints: Record<string, boolean>
}

/** Reactive breakpoint matching for the config `screens`, plus arbitrary media queries. */
@Injectable({ providedIn: 'root' })
export class UiMediaWatcherService {
  private readonly config = inject(UiConfigService)
  private readonly injector = inject(Injector)
  private readonly destroyRef = inject(DestroyRef)
  private readonly window = isPlatformBrowser(inject(PLATFORM_ID)) ? inject(DOCUMENT).defaultView : null
  private readonly queries = new Map<string, Signal<boolean>>()
  private readonly aliases = new Map<string, Signal<boolean>>()

  private readonly change = computed<UiMediaChange>(
    () => {
      const matchingAliases: string[] = []
      const matchingQueries: Record<string, string> = {}
      for (const [alias, width] of Object.entries(this.config.screens())) {
        const mediaQuery = minWidth(width)
        if (this.query(mediaQuery)()) {
          matchingAliases.push(alias)
          matchingQueries[alias] = mediaQuery
        }
      }
      return { matchingAliases, matchingQueries }
    },
    { equal: (a, b) => a.matchingAliases.join() === b.matchingAliases.join() && sameQueries(a, b) },
  )

  /** Aliases whose min-width currently matches, in `screens` order, e.g. `['sm', 'md']`. */
  readonly matchingAliases: Signal<readonly string[]> = computed(() => this.change().matchingAliases)
  /** alias -> the `(min-width: …)` query that matched. */
  readonly matchingQueries: Signal<Readonly<Record<string, string>>> = computed(() => this.change().matchingQueries)
  /** The viewport is narrower than `md`. */
  readonly isLtMd = this.is('lt-md')
  readonly prefersDark = this.query('(prefers-color-scheme: dark)')

  /** Compatibility stream: the current value on subscribe, then every change. */
  readonly onMediaChange$: Observable<UiMediaChange> = this.stream(this.change)

  /** `'md'`: width >= md; `'lt-md'`: width < md. Unknown alias: `false`. Cached per key. */
  is(alias: string): Signal<boolean> {
    let result = this.aliases.get(alias)
    if (!result) {
      const below = alias.startsWith('lt-')
      const name = below ? alias.slice(3) : alias
      result = computed(() => {
        const width = this.config.screens()[name]
        if (!width) return false
        const matches = this.query(minWidth(width))()
        return below ? !matches : matches
      })
      this.aliases.set(alias, result)
    }
    return result
  }

  /** Any CSS media query, e.g. `'(prefers-color-scheme: dark)'`. Cached per query. */
  query(mediaQuery: string): Signal<boolean> {
    let result = this.queries.get(mediaQuery)
    if (!result) {
      result = untracked(() => uiMediaQuerySignal(this.window, mediaQuery, this.destroyRef))
      this.queries.set(mediaQuery, result)
    }
    return result
  }

  /** Compatibility stream for one or more queries: the current state on subscribe, then every change. */
  onMediaQueryChange$(query: string | string[]): Observable<UiMediaQueryState> {
    const list = Array.isArray(query) ? query : [query]
    const state = computed<UiMediaQueryState>(
      () => {
        const breakpoints: Record<string, boolean> = {}
        for (const item of list) breakpoints[item] = this.query(item)()
        return { matches: Object.values(breakpoints).some(Boolean), breakpoints }
      },
      { equal: (a, b) => list.every((item) => a.breakpoints[item] === b.breakpoints[item]) },
    )
    return this.stream(state)
  }

  private stream<T>(source: Signal<T>): Observable<T> {
    return defer(() =>
      toObservable(source, { injector: this.injector }).pipe(startWith(untracked(source)), distinctUntilChanged()),
    )
  }
}

function minWidth(width: string): string {
  return `(min-width: ${width})`
}

function sameQueries(a: UiMediaChange, b: UiMediaChange): boolean {
  return a.matchingAliases.every((alias) => a.matchingQueries[alias] === b.matchingQueries[alias])
}
