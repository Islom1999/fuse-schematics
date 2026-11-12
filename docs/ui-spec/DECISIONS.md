# Decisions for the open questions in the UI specs

These resolve the "Open questions" sections in `navigation.md`, `core.md`, `theming.md`, `layouts.md`, `widgets.md` and `auth.md`. Where a spec and this file disagree, **this file wins**.

The general rule from the owner: **the look should stay as close to the current starter as possible.** Fix a legacy behavior only when it is a real bug or an accessibility problem.

All owner questions were answered on 2026-11-12.

---

## Navigation (`navigation.md`)

| # | Question | Decision |
|---|---|---|
| N1 | `isActiveMatchOptions` precedence quirk | Use the intended behavior: `isActiveMatchOptions`, when given, wins over `exactMatch`. Otherwise use `uiMatchOptions(exactMatch)` from `@ui/services/utils/ui-utils`. |
| N2 | Horizontal branch menus are broken in the reference (NG0301) | Fix them. Build branch menus on PrimeNG `p-tieredmenu` (popup mode), using the proposed metrics in section 4.4. |
| N3 | Compact: top-level groups and collapsables are squeezed | Hide them, the same as thin (section 3.2). |
| N4 | Badge colors purged at build time | Badge classes come from data. Theming adds a Tailwind `safelist` for the common badge color classes (`bg-{color}-{500,600}`, `text-white`, `text-on-primary`). Navigation code does nothing special. |
| N5 | `deregisterComponent` race | Already implemented in `navigation.service.ts`: with an instance argument, the entry is removed only while it still points to that instance. Navigation components must always pass `this`. |
| N6 | Component contract for the service | Components implement `UiNavigationComponentRef` from `navigation.types.ts`. The vertical navigation also implements `toggle`, `open` and `close`. |
| N7 | `FuseNavigationItem` compatibility alias | Not needed. The app is switched to `UiNavigationItem` in phase 3. |

## Core (`core.md`)

| # | Question | Decision |
|---|---|---|
| C1 | Loading bar height | The intended **6 px** bar with no percentage label. |
| C2 | Fullscreen icon | Switch it: `pi-window-maximize` when not fullscreen, `pi-window-minimize` in fullscreen. |
| C3 | Confirm button color for `warn` | Map `warn` to PrimeNG severity `danger` (red). A destructive action should look destructive. |
| C4 | `?layout=` query parameter | Apply it through `set()`, which persists it (the current behavior). Also see L3. |
| C5 | `provideAnimationsAsync()` | Keep it in `app.config.ts`. PrimeNG 20 overlays still use it. `@ui` itself uses CSS transitions only. |
| C6 | `fuse-version` attribute | Drop it. There is no `UI_VERSION`. |
| C7 | Alert dismissal persistence | In scope, kept simple: when `ui-alert` has a `name` and `persistDismissal`, the dismissed state is stored in `localStorage` under `ui-alert:<name>`. |
| C8 | Owner of the scheme/theme/body classes | `provideUi()` owns the document class sync. Layouts must not repeat it. |

## Theming (`theming.md`)

| # | Question | Decision |
|---|---|---|
| T1 | PrimeNG dark mode is broken | **Fix it** (owner, 2026-11-12). PrimeNG components (inputs, cards, tables, dialogs including the confirmation dialog) follow the dark scheme. |
| T2 | PrimeNG ignores the selected theme (always indigo) | **Follow the theme** (owner, 2026-11-12). PrimeNG primary uses the active `theme-*` primary palette. Delete the current bridge, which does nothing. |
| T3 | Dark borders, hr margin, placeholder color | Use the **intended values**: borders and dividers at slate-100 / 12% in dark mode, hr margin 32 px, scheme-aware placeholder. The light slate-200 line in dark mode is a bug. Same for layouts Q1. |
| T4 | Unused fonts | Drop Material Icons and IBM Plex Mono. Keep Inter. |
| T5 | Global `outline: none !important` | Remove it. Restore `:focus-visible` rings (2 px, primary color, 2 px offset). Mouse focus stays without a ring. |
| T6 | Custom utility class names | Keep every class name listed in `theming.md` (`bg-card`, `bg-default`, `text-secondary`, `text-hint`, `text-disabled`, `border`, `divider`, `bg-primary`, `text-on-primary` and the rest), so that layout code and the generated CRUD code keep working. Exception (owner, 2026-11-12): `icon-size-*` is dropped; icons use Tailwind `size-*` (plus a `text-*` size for font icons). |
| T7 | Logo, wordmark, favicon, splash spinner color, brand base color (`#2196F3`) | Owner, 2026-11-12: a neutral placeholder mark (a rounded square with the letter "A"), the text "Admin", and keep `#2196F3` as the brand base and splash color. |
| T8 | Avatars in mock data and on the auth pages | Owner, 2026-11-12: generated initials avatars, no image files. |
| T9 | Unused material sprites, scene PNGs, Fuse marketing text | Delete them in phase 3, as `theming.md` lists. |

## Layouts (`layouts.md`)

| # | Question | Decision |
|---|---|---|
| L1 | Dark border color | See T3: white / slate-100 at about 12%. |
| L2 | Classy on small screens | Keep it as it is (notifications and user only through the hamburger). |
| L3 | `?layout=` persistence | See C4: persisted. |

## Widgets (`widgets.md`)

| # | Question | Decision |
|---|---|---|
| W1 | Search backend | Ship the client-side navigation search by default. Use `POST /search` only when `environment.features.search === 'backend'`. |
| W2 | User status and avatar | Option (a): hide the status section and the dot behind `features.userStatus` (default `false`). The avatar falls back to initials. |
| W3 | Settings cog on auth pages | Keep it, as today (visual parity). |
| W4 | Profile/Settings menu items | Keep them as placeholders that only close the menu (visual parity). |
| W5 | Notifications backend | Show the bell only when `features.notifications` is `true` (default `true`). On a 404 from `admin/me/notifications`, hide the bell for the session. The backend offers only `GET admin/me/notifications` and `POST admin/me/notifications/:id/read`, so the widget has no mark-unread, remove or mark-all-read. |
| W6 | Dropped widgets | quick-chat, messages and shortcuts are not rewritten (owner decision Q2 in the plan). |
| W7 | Settings drawer close icon (primary on primary, invisible) | Fix it: a white icon. |

## Auth (`auth.md`)

| # | Question | Decision |
|---|---|---|
| A1 | Remember-me | As specified: `localStorage` when checked, `sessionStorage` when not. Unchecked by default. |
| A2 | Forgot/reset password | Ship the pages against section 2.2. The nest-schematics backend now implements `POST auth/forgot-password` and `POST auth/reset-password` (204, body `{email}` and `{token, password}`); mail delivery needs the backend's mail add-on, otherwise the reset link only appears in the server log outside production. |
| A3 | Password policy on reset | At least 8 characters, plus a match check with `mustMatch`. |
| A4 | Landing route | Redirect `/` to `/example`. There is no `home` route. |
| A5 | Token refresh | Design `AuthService` around an access token and a refresh token. On a 401, try the refresh once, then sign out. The exact endpoint is aligned with the nest-schematics auth work in phase 2 (B3). Until then, keep it behind one method, `refresh()`. |
| A6 | Legacy bugs | Do not reproduce them. Examples: the session is marked authenticated when the token check fails, and other bugs listed in the specs. |
| A7 | Dev-mock | `environment.devMock` (default `false` in production, `true` in `environment.development.ts`). It serves login, user, navigation and an empty notifications list. Test login: `admin@example.com` / `admin`. |
| A8 | Guards and state | Functional guards (`CanActivateFn`), signals for state, no `BehaviorSubject`. |
