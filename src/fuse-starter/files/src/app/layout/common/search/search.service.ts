import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { UiNavigationService } from '@ui'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { catchError, map, Observable, of } from 'rxjs'
import { SearchResult, SearchResultSet } from './search.types'

/** The backend cuts the query to 100 characters and returns `[]` below 2; at most 5 hits per group. */
const BACKEND_MAX_QUERY = 100
const BACKEND_MIN_QUERY = 2
const BACKEND_MAX_HITS = 5

/**
 * Runs header searches. With `environment.features.search === 'backend'` it calls `POST /search` (groups `admins`, `roles`,
 * at most 5 hits each, `[]` for fewer than 2 characters); otherwise it matches the titles of the default navigation on the client.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = inject(DITokens.API_BASE_URL)
  private readonly navigation = inject(NavigationService)
  private readonly uiNavigation = inject(UiNavigationService)

  /** Result sets for `query`. Never errors: a failed request yields `[]`. */
  search(query: string): Observable<SearchResultSet[]> {
    if (environment.features.search === 'backend') {
      const text = query.trim().slice(0, BACKEND_MAX_QUERY)
      if (text.length < BACKEND_MIN_QUERY) return of<SearchResultSet[]>([])
      return this.http.post<SearchResultSet[]>(`${this.apiUrl}/search`, { query: text }).pipe(
        map((sets) =>
          sets
            .map((set) => ({ ...set, results: set.results.slice(0, BACKEND_MAX_HITS) }))
            .filter((set) => set.results.length > 0),
        ),
        catchError(() => of<SearchResultSet[]>([])),
      )
    }
    return of(this.searchNavigation(query))
  }

  private searchNavigation(query: string): SearchResultSet[] {
    const needle = query.trim().toLowerCase()
    const results: SearchResult[] = []
    for (const item of this.uiNavigation.getFlatNavigation(this.navigation.navigation().default)) {
      const { id, title, link } = item
      if (!link || item.externalLink || !title?.toLowerCase().includes(needle)) continue
      results.push({ id: id ?? link, title, link, value: title })
    }
    return results.length ? [{ id: 'pages', label: 'Pages', results }] : []
  }
}
