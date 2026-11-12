import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core'
import { UserService } from 'app/core/user/user.service'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { catchError, map, Observable, of, tap, throwError } from 'rxjs'
import { AppNotification } from './notifications.types'

/**
 * The user's notifications (`/notifications` endpoints). Every method updates `notifications`
 * from the server response.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient)
  private readonly url = `${inject(DITokens.API_BASE_URL)}/notifications`
  private readonly _notifications = signal<AppNotification[]>([])
  private readonly _available = signal(environment.features.notifications)

  /** Current list, newest first. */
  readonly notifications = this._notifications.asReadonly()
  readonly unreadCount = computed(() => this._notifications().filter((item) => !item.read).length)
  /**
   * False when `features.notifications` is off, or after `/notifications` answered 404 in this
   * session. The bell hides itself then.
   */
  readonly available = this._available.asReadonly()

  constructor() {
    // Signing out resets the user; drop the previous user's notifications with it.
    const user = inject(UserService).user
    effect(() => {
      if (!user()) untracked(() => this._notifications.set([]))
    })
  }

  /** Loads the list. A 404 marks the feature unavailable; errors still reach the caller. */
  getAll(): Observable<AppNotification[]> {
    if (!this._available()) return of(this._notifications())
    return this.http.get<AppNotification[]>(this.url).pipe(
      tap((list) => this._notifications.set(list)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) this._available.set(false)
        return throwError(() => error)
      }),
    )
  }

  /** Sets the read flag of one notification. */
  markRead(id: string, read: boolean): Observable<AppNotification> {
    return this.http
      .patch<AppNotification>(`${this.url}/${encodeURIComponent(id)}`, { read })
      .pipe(tap((updated) => this.replace(updated)))
  }

  /** Deletes one notification. */
  remove(id: string): Observable<void> {
    return this.http.delete<unknown>(`${this.url}/${encodeURIComponent(id)}`).pipe(
      tap(() => this._notifications.update((list) => list.filter((item) => item.id !== id))),
      map(() => undefined),
    )
  }

  /** Marks every notification as read. */
  markAllRead(): Observable<AppNotification[]> {
    return this.http
      .post<AppNotification[]>(`${this.url}/mark-all-read`, {})
      .pipe(tap((list) => this._notifications.set(list)))
  }

  /** Creates a notification (for other features) and puts it first. */
  create(notification: Omit<AppNotification, 'id'>): Observable<AppNotification> {
    return this.http
      .post<AppNotification>(this.url, notification)
      .pipe(tap((created) => this._notifications.update((list) => [created, ...list])))
  }

  private replace(updated: AppNotification): void {
    this._notifications.update((list) => list.map((item) => (item.id === updated.id ? updated : item)))
  }
}
