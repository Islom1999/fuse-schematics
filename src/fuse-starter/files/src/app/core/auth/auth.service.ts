import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http'
import { computed, inject, Injectable, signal } from '@angular/core'
import { joinApiUrl } from 'app/core/http/api-url'
import { SKIP_AUTH, SKIP_ERROR_TOAST } from 'app/core/http/http-context'
import { NavigationService } from 'app/core/navigation/navigation.service'
import { UserService } from 'app/core/user/user.service'
import { User } from 'app/core/user/user.types'
import { DITokens } from 'app/core/utils/di-tokens'
import { catchError, defer, finalize, map, Observable, of, shareReplay, throwError } from 'rxjs'
import { AuthTokenStorage } from './auth.storage'
import { AuthResponse, SignInCredentials } from './auth.types'
import { isTokenExpired } from './auth.utils'

/** Requests whose errors the auth pages show themselves. */
const QUIET = (): HttpContext => new HttpContext().set(SKIP_ERROR_TOAST, true)
/** Requests that `authInterceptor` must not touch (no token, no refresh on 401). */
const PUBLIC = (): HttpContext => QUIET().set(SKIP_AUTH, true)

/**
 * Session state for the admin API: an access token plus a single-use refresh token.
 * Tokens live in `localStorage` (remember me) or `sessionStorage`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly apiUrl = inject(DITokens.API_BASE_URL)
  private readonly users = inject(UserService)
  private readonly navigation = inject(NavigationService)

  private readonly initial = AuthTokenStorage.read()
  private readonly accessTokenState = signal<string | null>(this.initial.accessToken)
  private readonly authenticatedState = signal(false)
  private refreshToken: string | null = this.initial.refreshToken
  private persistent = this.initial.persistent

  private pendingCheck: Observable<boolean> | null = null
  private pendingRefresh: Observable<string> | null = null

  /** The current access token, or `null`. */
  readonly accessToken = this.accessTokenState.asReadonly()
  /** True once a sign-in, refresh or session restore succeeded, until sign-out. */
  readonly authenticated = this.authenticatedState.asReadonly()
  /** Authenticated and holding an unexpired access token. */
  readonly isAuthenticated = computed(
    () => this.authenticatedState() && !isTokenExpired(this.accessTokenState()),
  )

  /** True while a refresh token is stored. */
  get canRefresh(): boolean {
    return !!this.refreshToken
  }

  /** `POST auth/sign-in`. Stores the session (per `rememberMe`) and the user. */
  signIn({ email, password, rememberMe }: SignInCredentials): Observable<User> {
    if (this.authenticatedState()) return throwError(() => new Error('Already signed in'))
    return this.http
      .post<AuthResponse>(this.url('auth/sign-in'), { email, password }, { context: PUBLIC() })
      .pipe(map((response) => this.startSession(response, rememberMe)))
  }

  /**
   * Ends the session. Local state is cleared at once; the backend `POST auth/sign-out` call is
   * best effort and its errors are ignored.
   */
  signOut(): Observable<void> {
    const token = this.accessTokenState()
    this.clearSession()
    if (!token || isTokenExpired(token)) return of(undefined)
    return this.http
      .post(this.url('auth/sign-out'), null, {
        context: PUBLIC(),
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
      )
  }

  /**
   * Resolves whether there is a usable session, restoring it after a reload. Used by the guards.
   * Parallel calls share one request.
   */
  check(): Observable<boolean> {
    if (this.authenticatedState() && !isTokenExpired(this.accessTokenState())) return of(true)
    if (this.pendingCheck) return this.pendingCheck

    const token = this.accessTokenState()
    let source: Observable<boolean>
    if (token && !isTokenExpired(token)) {
      source = this.signInUsingToken(token)
    } else if (this.refreshToken) {
      source = this.refresh().pipe(
        map(() => true),
        catchError(() => of(false)),
      )
    } else {
      if (token) this.clearSession()
      return of(false)
    }

    this.pendingCheck = source.pipe(
      finalize(() => (this.pendingCheck = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    )
    return this.pendingCheck
  }

  /**
   * `POST auth/refresh` with the stored refresh token and stores the new pair. The refresh token is
   * single use, so parallel callers share the one in-flight request. On failure the session is
   * cleared locally and the error is re-thrown.
   */
  refresh(): Observable<string> {
    if (this.pendingRefresh) return this.pendingRefresh
    const refreshToken = this.refreshToken
    if (!refreshToken) {
      this.clearSession()
      return throwError(() => new Error('No refresh token'))
    }

    this.pendingRefresh = defer(() =>
      this.http.post<AuthResponse>(this.url('auth/refresh'), { refreshToken }, { context: PUBLIC() }),
    ).pipe(
      map((response) => {
        this.startSession(response, this.persistent)
        return response.accessToken
      }),
      catchError((error: unknown) => {
        this.clearSession()
        return throwError(() => error)
      }),
      finalize(() => (this.pendingRefresh = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    )
    return this.pendingRefresh
  }

  /** `POST auth/forgot-password`. Succeeds whether or not the email is registered. */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post(this.url('auth/forgot-password'), { email }, { context: PUBLIC() })
      .pipe(map(() => undefined))
  }

  /** `POST auth/reset-password` with the token from the reset link. */
  resetPassword(token: string, password: string): Observable<void> {
    return this.http
      .post(this.url('auth/reset-password'), { token, password }, { context: PUBLIC() })
      .pipe(map(() => undefined))
  }

  /** Clears tokens, user and navigation without calling the backend. */
  clearSession(): void {
    AuthTokenStorage.clear()
    this.refreshToken = null
    this.accessTokenState.set(null)
    this.authenticatedState.set(false)
    this.users.reset()
    this.navigation.reset()
  }

  /** `POST auth/sign-in-with-token`: restores the session after a reload. Never errors. */
  private signInUsingToken(accessToken: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(this.url('auth/sign-in-with-token'), { accessToken }, { context: PUBLIC() })
      .pipe(
        map((response) => {
          this.startSession(response, this.persistent)
          return true
        }),
        catchError((error: { status?: number }) => {
          // A rejected access token may still have a valid refresh token behind it.
          if (error?.status === 401 && this.refreshToken) {
            return this.refresh().pipe(
              map(() => true),
              catchError(() => of(false)),
            )
          }
          this.clearSession()
          return of(false)
        }),
      )
  }

  private startSession(response: AuthResponse, persistent: boolean): User {
    this.persistent = persistent
    this.refreshToken = response.refreshToken ?? null
    AuthTokenStorage.write(response.accessToken, this.refreshToken, persistent)
    this.accessTokenState.set(response.accessToken)
    this.authenticatedState.set(true)
    this.users.set(response.user)
    return response.user
  }

  private url(path: string): string {
    return joinApiUrl(this.apiUrl, path)
  }
}
