import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { DITokens } from 'app/core/utils/di-tokens'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { catchError, from, map, Observable, switchMap, tap, throwError } from 'rxjs'

type ExportParam = string | number | boolean | null | undefined

/** A downloaded CSV file with the numbers the back-end sends in the response headers. */
export interface CsvDownload {
  blob: Blob
  /** From `Content-Disposition`; the documented name (`<prefix>-YYYY-MM-DD-HH-mm-ss.csv`) when the header is missing. */
  filename: string
  /** `X-Total-Count`: rows that match the filters. `null` when the route does not send it. */
  totalCount: number | null
  /** `X-Export-Truncated` is `true`: the file holds only the first rows, so the filters should be narrowed. */
  truncated: boolean
}

/** `YYYY-MM-DD-HH-mm-ss` in UTC, the timestamp format of the back-end CSV file names. */
export function csvTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '-')
}

/** Reads the file name of a `Content-Disposition` header (`filename*=UTF-8''...` or `filename="..."`). */
export function filenameFromDisposition(header: string | null | undefined): string | null {
  if (!header) return null
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/i.exec(header)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i.exec(header)
  const name = plain ? (plain[1] ?? plain[2]).trim() : ''
  return name || null
}

/**
 * Turns the table query of a grid into the query string of an export route: `filters` as a JSON
 * string, `globalFilter`, `sortField` and `sortOrder`. Pass the typed params of the route in `extra`.
 */
export function toExportParams(query: TableQueryDTO, extra: Record<string, ExportParam> = {}): Record<string, ExportParam> {
  const filters = query.filters ?? {}
  return {
    filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    globalFilter: query.globalFilter || undefined,
    sortField: query.sortField || undefined,
    sortOrder: query.sortField ? query.sortOrder : undefined,
    ...extra,
  }
}

/** Saves a blob through a temporary link (the browser downloads it). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Downloads a CSV export route with `HttpClient` (`responseType: 'blob'`, `observe: 'response'`), so the
 * auth interceptor adds the Bearer token, which a plain link cannot do. The file name comes from
 * `Content-Disposition`, the counts from `X-Total-Count` and `X-Export-Truncated`. The back-end lists
 * these headers in its CORS `exposedHeaders`.
 */
@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  private readonly http = inject(HttpClient)
  private readonly apiBaseUrl = inject(DITokens.API_BASE_URL)

  /** Requests `path` (for example `admin/payments/export`) and emits the file; nothing is saved yet. */
  fetch(path: string, filenamePrefix: string, params: Record<string, ExportParam> = {}): Observable<CsvDownload> {
    const query: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query[key] = value
    }
    return this.http
      .get(`${this.apiBaseUrl}/${path}`, {
        params: new HttpParams({ fromObject: query }),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => {
          const total = response.headers.get('X-Total-Count')
          return {
            blob: response.body ?? new Blob([], { type: 'text/csv' }),
            filename:
              filenameFromDisposition(response.headers.get('Content-Disposition')) ??
              `${filenamePrefix}-${csvTimestamp()}.csv`,
            totalCount: total !== null && total !== '' && Number.isFinite(Number(total)) ? Number(total) : null,
            truncated: response.headers.get('X-Export-Truncated') === 'true',
          }
        }),
        catchError((error: unknown) => this.readBlobError(error)),
      )
  }

  /** Requests the export and saves the file. */
  download(path: string, filenamePrefix: string, params: Record<string, ExportParam> = {}): Observable<CsvDownload> {
    return this.fetch(path, filenamePrefix, params).pipe(tap((file) => saveBlob(file.blob, file.filename)))
  }

  /** An error body arrives as a blob; parse it so `error.error.message` works for the feedback service. */
  private readBlobError(error: unknown): Observable<never> {
    if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) return throwError(() => error)
    return from(error.error.text()).pipe(
      map((text) => {
        let body: unknown = text
        try {
          body = JSON.parse(text)
        } catch {
          // keep the text
        }
        return new HttpErrorResponse({
          error: body,
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
        })
      }),
      switchMap((parsed) => throwError(() => parsed)),
    )
  }
}
