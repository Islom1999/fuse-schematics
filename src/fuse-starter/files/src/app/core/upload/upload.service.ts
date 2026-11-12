import { HttpClient, HttpContext, HttpErrorResponse, HttpEventType } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { AuthService } from 'app/core/auth/auth.service'
import { isTokenExpired } from 'app/core/auth/auth.utils'
import { joinApiUrl } from 'app/core/http/api-url'
import { SKIP_AUTH, SKIP_ERROR_TOAST } from 'app/core/http/http-context'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { DetailedError, Upload } from 'tus-js-client'
import {
  catchError,
  exhaustMap,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  switchMap,
  take,
  throwError,
  timeout,
  timer,
} from 'rxjs'
import { MediaFile, MediaKind, UploadError, UploadEvent, UploadOptions } from './upload.types'

export * from './upload.types'

/**
 * `accept` filter per kind. The backend has no list of its own and checks the content, so this
 * only narrows the file dialog; a wrong pick is answered with 415. `other` accepts anything.
 */
export const UPLOAD_ACCEPT: Record<MediaKind, string> = {
  image: 'image/jpeg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif',
  video: 'video/*',
  audio: 'audio/*',
  pdf: 'application/pdf,.pdf',
  other: '',
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024
const RETRY_DELAYS = [0, 1000, 3000, 5000]
const RESULT_POLL_MS = 500
const RESULT_TIMEOUT_MS = 120_000

interface TusResult {
  status: 'pending' | 'done' | 'failed'
  file: MediaFile | null
  error: string | null
}

const QUIET = (): HttpContext => new HttpContext().set(SKIP_ERROR_TOAST, true)

/**
 * Uploads a file to the backend's `upload` add-on and returns the stored media record.
 *
 * - `environment.upload === 'multipart'` (default): `POST admin/files/upload` (field `files`).
 * - `environment.upload === 'tus'`: resumable tus 1.0 upload with `tus-js-client`. The endpoint is
 *   `environment.tusEndpoint` or, when empty, `<apiUrl>/files/tus` (the `node` engine); for the
 *   `tusd` engine set the tusd URL. The bearer token goes on the create request only; the upload
 *   resumes from the stored fingerprint after a reload; the media record comes from
 *   `GET files/tus/:id/result`, which works for both engines.
 *
 * Unsubscribing cancels the upload (the request is aborted; a tus upload is terminated).
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient)
  private readonly auth = inject(AuthService)
  private readonly apiUrl = inject(DITokens.API_BASE_URL)

  readonly mode: 'multipart' | 'tus' = environment.upload

  /** Uploads one file. Emits `progress` events, then one `done` event with the media record. */
  upload(file: File, options: UploadOptions = {}): Observable<UploadEvent> {
    return this.mode === 'tus' ? this.uploadTus(file, options) : this.uploadMultipart(file, options)
  }

  /** `GET admin/files/:id`: the media record of an id (needs `media_file.read`). */
  get(id: string): Observable<MediaFile> {
    return this.http.get<MediaFile>(this.url(`admin/files/${encodeURIComponent(id)}`), {
      context: QUIET(),
    })
  }

  /** Absolute URL of the file (or of its thumbnail, which images only have). */
  urlFor(media: Pick<MediaFile, 'url' | 'thumbnailUrl'>, thumbnail = false): string {
    const path = (thumbnail && media.thumbnailUrl) || media.url
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
    try {
      return new URL(path, new URL(this.apiUrl, globalThis.location?.href).origin).href
    } catch {
      return path
    }
  }

  // --- multipart ---------------------------------------------------------------------------

  private uploadMultipart(file: File, options: UploadOptions): Observable<UploadEvent> {
    const body = new FormData()
    body.append('files', file, file.name)
    return this.http
      .post<MediaFile[]>(this.url('admin/files/upload'), body, {
        params: { usage: options.usage ?? 'general' },
        observe: 'events',
        reportProgress: true,
        context: QUIET(),
      })
      .pipe(
        map((event): UploadEvent | null => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? file.size
            // Cap at 99: the file is only stored once the response arrives.
            const percent = total ? Math.min(99, Math.round((event.loaded / total) * 100)) : 0
            return { type: 'progress', loaded: event.loaded, total, percent }
          }
          if (event.type === HttpEventType.Response) {
            const media = event.body?.[0]
            if (!media) throw new UploadError('The server returned no file', event.status)
            return { type: 'done', media }
          }
          return null
        }),
        filter((event): event is UploadEvent => event !== null),
        catchError((error: unknown) => throwError(() => toUploadError(error))),
      )
  }

  // --- tus ---------------------------------------------------------------------------------

  private uploadTus(file: File, options: UploadOptions): Observable<UploadEvent> {
    return new Observable<UploadEvent>((subscriber) => {
      let refreshNext = false
      let finished = false

      const upload = new Upload(file, {
        endpoint: environment.tusEndpoint || this.url('files/tus'),
        chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
        retryDelays: RETRY_DELAYS,
        removeFingerprintOnSuccess: true,
        metadata: {
          filename: file.name,
          filetype: file.type || 'application/octet-stream',
          usage: options.usage ?? 'general',
        },
        // Only the create request (POST) is authenticated; the upload URL is the capability.
        onBeforeRequest: async (req) => {
          if (req.getMethod() !== 'POST') return
          const current = this.auth.accessToken()
          if ((refreshNext || !current || isTokenExpired(current)) && this.auth.canRefresh) {
            refreshNext = false
            await firstValueFrom(this.auth.refresh()).catch(() => undefined)
          }
          const token = this.auth.accessToken()
          if (token) req.setHeader('Authorization', `Bearer ${token}`)
        },
        // A 401 is retried once with a refreshed token; otherwise the default rules (network
        // errors, 5xx, 409, 423) apply.
        onShouldRetry: (error, retryAttempt) => {
          const status = statusOf(error)
          if (status === 401) {
            if (retryAttempt > 0 || !this.auth.canRefresh) return false
            refreshNext = true
            return true
          }
          return status === 0 || status >= 500 || status === 409 || status === 423
        },
        onProgress: (loaded, total) => {
          // Cap at 99: the record is only known once the result is read.
          const percent = total ? Math.min(99, Math.round((loaded / total) * 100)) : 0
          subscriber.next({ type: 'progress', loaded, total, percent })
        },
        onError: (error) => subscriber.error(toUploadError(error)),
        onSuccess: () => {
          const id = lastSegment(upload.url)
          if (!id) {
            subscriber.error(new UploadError('The server returned no upload id', 0))
            return
          }
          this.tusResult(id).subscribe({
            next: (media) => {
              finished = true
              subscriber.next({ type: 'progress', loaded: file.size, total: file.size, percent: 100 })
              subscriber.next({ type: 'done', media })
              subscriber.complete()
            },
            error: (error: unknown) => subscriber.error(toUploadError(error)),
          })
        },
      })

      // Resume the newest unfinished upload of the same file, if there is one.
      upload
        .findPreviousUploads()
        .then((previous) => {
          if (previous.length) upload.resumeFromPreviousUpload(previous[0])
        })
        .catch(() => undefined)
        .finally(() => upload.start())

      return () => {
        // Unsubscribed before the end: cancel and delete the partial upload on the server.
        if (!finished) void upload.abort(true).catch(() => undefined)
      }
    })
  }

  /** Polls `GET files/tus/:id/result` until the upload is `done` (tusd moves the file after the last byte). */
  private tusResult(uploadId: string): Observable<MediaFile> {
    const context = QUIET().set(SKIP_AUTH, true)
    return timer(0, RESULT_POLL_MS).pipe(
      exhaustMap(() =>
        this.http.get<TusResult>(this.url(`files/tus/${encodeURIComponent(uploadId)}/result`), { context }),
      ),
      filter((result) => result.status !== 'pending'),
      take(1),
      switchMap((result) =>
        result.status === 'done' && result.file
          ? of(result.file)
          : throwError(() => new UploadError(result.error ?? 'Upload failed', 422)),
      ),
      timeout({ first: RESULT_TIMEOUT_MS, with: () => throwError(() => new UploadError('Upload timed out', 0)) }),
    )
  }

  private url(path: string): string {
    return joinApiUrl(this.apiUrl, path)
  }
}

function lastSegment(url: string | null): string | null {
  const segment = url?.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop()
  return segment || null
}

function statusOf(error: unknown): number {
  if (error instanceof DetailedError) return error.originalResponse?.getStatus() ?? 0
  if (error instanceof HttpErrorResponse || error instanceof UploadError) return error.status
  return 0
}

function toUploadError(error: unknown): UploadError {
  if (error instanceof UploadError) return error
  const status = statusOf(error)
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { message?: unknown } | null)?.message
    return new UploadError(Array.isArray(message) ? message.join(', ') : String(message ?? error.message), status)
  }
  return new UploadError(error instanceof Error ? error.message : 'Upload failed', status)
}
