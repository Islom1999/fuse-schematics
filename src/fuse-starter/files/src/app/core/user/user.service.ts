import { HttpClient } from '@angular/common/http'
import { inject, Injectable, signal } from '@angular/core'
import { joinApiUrl } from 'app/core/http/api-url'
import { DITokens } from 'app/core/utils/di-tokens'
import { Observable, tap } from 'rxjs'
import { User } from './user.types'

/** Holds the signed-in user. Filled by `AuthService` on sign-in and session restore. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = inject(DITokens.API_BASE_URL)
  private readonly state = signal<User | null>(null)

  /** The current user, or `null` when signed out. */
  readonly user = this.state.asReadonly()

  set(user: User): void {
    this.state.set(user)
  }

  reset(): void {
    this.state.set(null)
  }

  /** `GET auth/me`, then stores the result. */
  load(): Observable<User> {
    return this.http.get<User>(joinApiUrl(this.apiUrl, 'auth/me')).pipe(tap((user) => this.set(user)))
  }

  /** `PATCH auth/me`, then stores the user from the response. */
  update(patch: Partial<Omit<User, 'id' | 'permissions'>>): Observable<User> {
    return this.http.patch<User>(joinApiUrl(this.apiUrl, 'auth/me'), patch).pipe(tap((user) => this.set(user)))
  }

  /** True when the user has `permission` or the wildcard `'*'`. */
  hasPermission(permission: string): boolean {
    const permissions = this.state()?.permissions ?? []
    return permissions.includes('*') || permissions.includes(permission)
  }
}
