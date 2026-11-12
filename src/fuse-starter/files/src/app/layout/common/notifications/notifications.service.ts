import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core'
import { UserService } from 'app/core/user/user.service'
import { DITokens } from 'app/core/utils/di-tokens'
import { environment } from 'environments/environment'
import { catchError, map, Observable, of, tap, throwError } from 'rxjs'
import { AdminNotificationDto, AppNotification } from './notifications.types'

function toNotification(dto: AdminNotificationDto): AppNotification {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? undefined,
    icon: dto.icon ?? undefined,
    link: dto.link ?? undefined,
    useRouter: true,
    time: dto.time,
    read: dto.read,
  }
}

/**
 * The signed-in admin's notifications: `GET admin/me/notifications` (newest first, at most 50) and
 * `POST admin/me/notifications/:id/read`. The backend has no delete, mark-unread, mark-all-read or
 * create route, so the service offers none of them. Every method updates `notifications`.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient)
  private readonly url = `${inject(DITokens.API_BASE_URL)}/admin/me/notifications`
  private readonly _notifications = signal<AppNotification[]>([])
  private readonly _available = signal(environment.features.notifications)

  /** Current list, newest first. */
  readonly notifications = this._notifications.asReadonly()
  readonly unreadCount = computed(() => this._notifications().filter((item) => !item.read).length)
  /**
   * False when `features.notifications` is off, or after `admin/me/notifications` answered 404 in
   * this session. The bell hides itself then.
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
    return this.http.get<AdminNotificationDto[]>(this.url).pipe(
      map((list) => list.map(toNotification)),
      tap((list) => this._notifications.set(list)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) this._available.set(false)
        return throwError(() => error)
      }),
    )
  }

  /** Marks one notification as read (`POST :id/read`); calling it again is harmless. */
  markRead(id: string): Observable<AppNotification> {
    return this.http.post<AdminNotificationDto>(`${this.url}/${encodeURIComponent(id)}/read`, {}).pipe(
      map(toNotification),
      tap((updated) => this._notifications.update((list) => list.map((item) => (item.id === updated.id ? updated : item)))),
    )
  }
}
