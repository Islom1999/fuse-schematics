import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { UiNavigationService } from '@ui'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { catchError, Observable, of } from 'rxjs'
import { SearchResult, SearchResultSet } from './search.types'

/**
 * Runs header searches. With `environment.features.search === 'backend'` it calls `POST /search`;
 * otherwise it matches the titles of the default navigation on the client.
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
      return this.http
        .post<SearchResultSet[]>(`${this.apiUrl}/search`, { query })
        .pipe(catchError(() => of<SearchResultSet[]>([])))
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
