# Phase 2 contracts (B1a, B1b, B2, B3)

The four phase-2 tasks run in parallel. This file fixes the names they share, so each task can code against the others before they exist. Paths are relative to `src/fuse-starter/files/src/`. **Do not change these names.** If a task needs another task's piece to compile, it writes a throwaway stub in its verification copy only, never in the worktree.

## Already available (phase 0/1, `@ui`)

Import from `@ui` (barrel) or deep paths:
- `UiVerticalNavigationComponent` (`ui-vertical-navigation`) and `UiHorizontalNavigationComponent` (`ui-horizontal-navigation`)
- `UiNavigationService`, `UiNavigationItem`
- `UiIconComponent` (`ui-icon`), `UiLoadingBarComponent` (`ui-loading-bar`), `UiFullscreenComponent` (`ui-fullscreen`)
- `UiAlertComponent` (`ui-alert`)
- `UiConfigService`, `UiConfig`, `UiLayoutName`, `UiScheme`
- `UiMediaWatcherService`, `UiConfirmationService`, `UiSplashScreenService`, `UiPlatformService`
- `UiValidators.mustMatch`, the CSS animation classes, and `provideUi()`

Read each component's public API from its source in `src/@ui/`. These are new files, so they are allowed reading.

## Environment (`environments/environment*.ts`, already written)

```ts
environment.apiUrl        // 'http://localhost:3000/api'
environment.devMock       // true in development, false in production
environment.features.search         // 'client' | 'backend'
environment.features.userStatus     // boolean (default false)
environment.features.notifications  // boolean (default true)
```

## B3: core (auth, user, navigation, API)

| File | Export | Shape |
|---|---|---|
| `app/core/api/api-base-url.ts` | `API_BASE_URL` | `InjectionToken<string>`, factory `() => environment.apiUrl` |
| `app/core/user/user.types.ts` | `User` | `{ id: string; email: string; name: string; permissions: string[]; avatar?: string; status?: 'online' \| 'away' \| 'busy' \| 'not-visible' }` |
| `app/core/user/user.service.ts` | `UserService` (root) | `user: Signal<User \| null>`, `set(u)`, `reset()`, `load(): Observable<User>`, `update(patch): Observable<User>`, `hasPermission(p): boolean` |
| `app/core/auth/auth.service.ts` | `AuthService` (root) | `authenticated: Signal<boolean>`, `signIn({email,password,rememberMe}): Observable<User>`, `signOut(): Observable<void>`, `check(): Observable<boolean>`, `refresh(): Observable<string>`, `forgotPassword(email)`, `resetPassword(token, password)` |
| `app/core/auth/guards/auth.guard.ts` | `authGuard` | `CanActivateFn & CanActivateChildFn` |
| `app/core/auth/guards/no-auth.guard.ts` | `noAuthGuard` | same |
| `app/core/auth/auth.interceptor.ts` | `authInterceptor` | `HttpInterceptorFn` |
| `app/core/http/error.interceptor.ts` | `errorInterceptor` | `HttpInterceptorFn` (toast via PrimeNG `MessageService`) |
| `app/core/dev-mock/dev-mock.interceptor.ts` | `devMockInterceptor` | `HttpInterceptorFn`; does nothing unless `environment.devMock` |
| `app/core/navigation/navigation.types.ts` | `Navigation` | `{ default: UiNavigationItem[]; compact: UiNavigationItem[]; futuristic: UiNavigationItem[]; horizontal: UiNavigationItem[] }` |
| `app/core/navigation/navigation.service.ts` | `NavigationService` (root) | `navigation: Signal<Navigation>`, `load(): Observable<Navigation>` |

Backend: `GET navigation` does not exist yet. `NavigationService.load()` returns the static arrays from `app/core/navigation/navigation.ts` (owner's file; its export names `defaultNavigation`, `compactNavigation`, `futuristicNavigation` and `horizontalNavigation` must not change, because the CRUD generator appends to them). Item children are filled in for compact, futuristic and horizontal by matching `id` against `defaultNavigation`. The dev-mock serves the same.

The admin auth contract is in `docs/ui-spec/backend-auth-contract.md`. It supersedes `auth.md` section 2.1.

## B2: header widgets

All are standalone and OnPush, in `app/layout/common/<name>/`.

| Selector | Class | Inputs |
|---|---|---|
| `app-languages` | `LanguagesComponent` | none |
| `app-search` | `SearchComponent` | `appearance: 'bar' \| 'basic'` (default `'basic'`) |
| `app-notifications` | `NotificationsComponent` | none |
| `app-user` | `UserComponent` | `showAvatar: boolean` (default `true`) |

`app/layout/common/notifications/notifications.service.ts` exports `NotificationsService` (root) with `notifications: Signal<Notification[]>` and `getAll(): Observable<Notification[]>`.

## B1b: layout host and settings

| File | Selector | Class |
|---|---|---|
| `app/layout/layout.component.ts` | `app-layout` | `LayoutComponent` |
| `app/layout/common/settings/settings.component.ts` | `app-settings` | `SettingsComponent` (no inputs) |
| `app/layout/layouts/empty/empty.component.ts` | `app-empty-layout` | `EmptyLayoutComponent` |
| `app/layout/layouts/horizontal/<name>/<name>.component.ts` | `app-<name>-layout` | `<Name>LayoutComponent` for centered, enterprise, material, modern |

`LayoutComponent` renders `<app-settings>` (the cog plus the drawer) once, outside the `@switch`.

## B1a: vertical layouts

`app/layout/layouts/vertical/<name>/<name>.component.ts`, selector `app-<name>-layout`, class `<Name>LayoutComponent`, for classic, classy, compact, dense, futuristic and thin.

## Not owned by phase 2 (integrator, phase 3)

`app.config.ts`, `app.routes.ts`, `app.resolvers.ts` (the `initialData` resolver), `app.component.*`, `main.ts`, `navigation.ts`, `@ui/**`, `tailwind.config.js`, `angular.json`, and `src/styles/**`.
