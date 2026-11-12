# UI spec: Authentication, user state, dev mock, auth pages

Status: clean-room functional spec. It covers behaviour, contracts, metrics and colours only.

Target stack: Angular 20 (standalone, OnPush, zoneless, signal APIs, functional guards and interceptors), PrimeNG 20, Tailwind 3, Transloco.

Screenshots are in `/private/tmp/claude-501/-Users-macbookm3pro--claude-spares-spare-ga0vel/e6e173af-1f6a-4c59-8de9-f74b6683b26a/scratchpad/ref/` (shortened below to `ref/`):

| Screenshot | Shows |
|---|---|
| `ref/auth-sign-in.png` | Sign-in page, desktop |
| `ref/auth-sign-in-error.png` | Sign-in page after a failed attempt |
| `ref/tablet-auth-sign-in.png` | Sign-in page at 800 px |
| `ref/mobile-auth-sign-in.png` | Sign-in page at 390 px |
| `ref/auth-forgot-password.png` | Forgot-password page |
| `ref/auth-forgot-password-invalid.png` | Forgot-password validation errors |
| `ref/auth-forgot-password-sent.png` | Forgot-password success alert |
| `ref/auth-reset-password.png` | Reset-password page |

The screenshots still show elements this spec removes: the sign-up link, the "Fuse Demo" info alert, the "Or continue with" social buttons, the Fuse logo and the community marketing panel content.

---

## 1. Scope and decisions

- **Real backend.** Authentication talks to the real backend at `environment.apiUrl` (default `http://localhost:3000/api`; the backend is nest-schematics, global prefix `/api`). The legacy in-browser mock API is removed entirely.
- **Dev mock.** An opt-in dev-mock HTTP interceptor (§7) can answer login, current-user and navigation requests when there is no backend.
- **Pages kept:**
  - sign-in
  - sign-out
  - forgot-password
  - reset-password
- **Pages removed:**
  - sign-up
  - unlock-session
  - confirmation-required
  - every link that pointed to them, such as "Don't have an account? Sign up"
- **Branding.** Neutral placeholders only. The logo is `assets/images/logo/logo.svg` and the product name is "Admin".

---

## 2. Backend contracts

All paths are relative to `apiUrl`.

Error body for every non-2xx response:

```
{ statusCode: number, error: string, message: string | string[], path: string, timestamp: string }
```

### 2.1 Implemented in nest-schematics today

**`POST /auth/sign-in`**

| | |
|---|---|
| Request | `{ "email": string (valid email), "password": string (non-empty, ≤ 200 chars) }` |
| 200 | `{ "accessToken": string, "user": { "id": string, "email": string, "name": string, "permissions": string[] } }` |
| 400 | Validation failed. `message` is a string array. |
| 401 | `message` = "Invalid email or password" |

**`POST /auth/sign-in-with-token`**

| | |
|---|---|
| Request | `{ "accessToken": string }` |
| 200 | Same shape as sign-in. Contains a **fresh** `accessToken`. |
| 401 | `message` = "Invalid or expired token" |

**`GET /auth/me`**

| | |
|---|---|
| Header | `Authorization: Bearer <token>` |
| 200 | `{ "id", "email", "name", "permissions": string[] }` |
| 401 | Missing or invalid token. |

**JWT payload:**
- Claims: `sub`, `email`, `name`, `permissions`, `typ: "admin"`, `iat`, `exp`.
- Lifetime is set by the backend env var `ADMIN_JWT_EXPIRES_IN` (default 1 day).
- The client reads only `exp`. It never verifies the signature.

**Admin routes:**
- Resource routes under `/admin/...` answer 403 "Not enough permissions" when a permission is missing.
- The UI should show a toast for 403 (see §5) and must not sign out.

### 2.2 Password reset and navigation (implemented in nest-schematics)

These routes exist in the backend starter (admin OpenAPI document).

**`POST /auth/forgot-password`** (public)

| | |
|---|---|
| Request | `{ "email": string }` (valid email, at most 254 characters) |
| Response | `204` without a body, always, also for an unknown email (no account enumeration). |
| 400 | Malformed email. |
| 429 | Rate limited. |

**`POST /auth/reset-password`** (public)

| | |
|---|---|
| Request | `{ "token": string, "password": string }` (token non-empty, at most 256; password 8 to 200 characters) |
| Response | `204` without a body. Every session of that admin ends; the admin signs in again. |
| 400 | `"Invalid or expired token"` (unknown, expired or already used), or a validation error when the password breaks 8..200. |
| 429 | Rate limited. |

- The token is random, single use and valid for 30 minutes; a new request voids older ones.
- The mail link is `<ADMIN_APP_URL>/reset-password?token=<token>` (backend env `ADMIN_APP_URL`, default `http://localhost:4200`). The reset page reads `token` from the query string.
- Mail is sent only when the backend has the mail add-on. Without it the backend logs a warning, and outside production that log line holds the reset link.

**`GET /navigation`** (any signed-in admin; filtered by the admin's permissions)
- Response 200: `{ default: NavItem[], compact: NavItem[], futuristic: NavItem[], horizontal: NavItem[] }`. All four hold the same tree.
- `NavItem` is defined in `navigation.md`. The backend registry holds only `admins` (`/admins`) and `roles` (`/roles`); the starter's static navigation and routes use the same ids and links.
- The client calls it only when `environment.features.navigation === 'backend'` (default `'static'`) and appends the static items of `navigation.ts` whose `id` the backend did not send.

**Further endpoints:** `/search` and the admin notifications (`GET admin/me/notifications`, `POST admin/me/notifications/:id/read`) are specified in `widgets.md`. `PATCH /auth/me` is **not implemented** in the backend yet.

The legacy client sent the bare email string and the bare password string as request bodies. The JSON objects above replace that.

---

## 3. Token storage

Implement a small `TokenStorage` helper, or put this logic inside `AuthService`.

- **Key:** `accessToken`.
- **Location** depends on the "Remember me" choice at sign-in:
  - checked: `localStorage`
  - unchecked: `sessionStorage`
- **Reads** check `localStorage` first, then `sessionStorage`.
- **Writes** clear the other store.
- **Clearing** removes the key from both stores.
- **Remove these unused keys:** `refresh_token`. Do not add a refresh-token flow; the backend has none.
- **Other key:** `currentLanguage` belongs to the languages widget (`widgets.md` §1), not to auth.

Legacy behaviour was localStorage only, and remember-me had no effect. See open question A1.

### JWT helpers

Put these in `auth.utils`, our own implementation.

**`decodeJwtPayload(token): Record<string, unknown> | null`**
- Splits the token on `.` and base64url-decodes the second segment (handle `-`/`_` and missing padding).
- Decodes the bytes as UTF-8, then parses JSON.
- Returns `null` on any failure.

**`isTokenExpired(token, offsetSeconds = 0): boolean`**
- Returns true when there is no token, the payload has no numeric `exp`, or `exp * 1000 < Date.now() + offsetSeconds * 1000`.

---

## 4. `AuthService`

Provided in root.

**State (signals)**

| Member | Kind | Meaning |
|---|---|---|
| `accessToken` | `signal<string \| null>` | Initialised from storage. |
| `authenticated` | `signal<boolean>` | Initially `false`. |
| `isAuthenticated` | `computed` | `authenticated() && !!accessToken() && !isTokenExpired(accessToken())` |

**Methods.** These return Observables so they work with guards and resolvers; the implementer may also expose Promise variants.

**`signIn({ email, password, rememberMe })` → `Observable<SignInResponse>`**
- If the user is already `authenticated`, error immediately with an "Already signed in" error.
- POST `/auth/sign-in` with `{ email, password }`.
- On success:
  1. Store the token according to `rememberMe`.
  2. Set `accessToken`.
  3. Set `authenticated` to true.
  4. Set `UserService.user` to `response.user`.
- On failure, propagate the error unchanged; the page maps it to a message.

**`signInUsingToken()` → `Observable<boolean>`**
- POST `/auth/sign-in-with-token` with `{ accessToken }`.
- On success: store the **new** token in the same store, set `authenticated` to true, set the user, and emit `true`.
- On any error: clear the token, set `authenticated` to false, clear the user, and emit `false`.
- Legacy bug, which must NOT be reproduced: the legacy code marked the session authenticated even when this call failed.

**`signOut()` → `Observable<true>`**
- Clear the token from storage.
- Set `accessToken` to null and `authenticated` to false.
- Clear the user, notifications and navigation state. These services expose `reset()`.
- Purely client-side; there is no backend call.

**`check()` → `Observable<boolean>`**, used by the guards. In order:
1. `authenticated` is true and the token is not expired → `true`.
2. No token → `false`.
3. Token expired → clear it, then `false`.
4. Otherwise → `signInUsingToken()`.

**`forgotPassword(email)` → `Observable<void>`**
- POST `/auth/forgot-password` with `{ email }`.

**`resetPassword(token, password)` → `Observable<void>`**
- POST `/auth/reset-password` with `{ token, password }`.

**`SignInResponse`** = `{ accessToken: string; user: User }`.

**Concurrency.** If `check()` is called again while a `signInUsingToken()` is in flight, for example from parallel guards, share the same request (`shareReplay(1)` until it completes).

---

## 5. HTTP interceptors

Register both with `provideHttpClient(withInterceptors([devMockInterceptor, authInterceptor, errorInterceptor]))`, in this order. The dev mock runs first, so mocked requests never reach the network.

### 5.1 `authInterceptor` (functional)

**Adding the token**
- Add `Authorization: Bearer <token>` when:
  - a token exists and is not expired, AND
  - the request URL starts with `apiUrl`.
- Never send the token to third-party hosts.
- Skip `/auth/sign-in` and `/auth/forgot-password`. Adding it there is harmless, but unnecessary.

**On a 401 response**
- Applies to any request except `/auth/sign-in`, `/auth/sign-in-with-token`, `/auth/forgot-password` and `/auth/reset-password`.
- Steps:
  1. Call `AuthService.signOut()`.
  2. Navigate to `/sign-in?redirectURL=<current url>`, using `router.url`; omit the param when the URL is `/sign-out`.
  3. Re-throw the error.
- Do NOT reload the page. One legacy copy called `location.reload()`; drop it.
- There was a duplicate legacy interceptor; implement exactly one.

### 5.2 `errorInterceptor` (functional, optional but recommended)

- Shows a PrimeNG toast via `MessageService` for:
  - status 0 (network): "Cannot reach the server" (i18n `errors.network`)
  - 403: "You don't have permission to do that" (i18n `errors.forbidden`)
  - ≥ 500: "Something went wrong, please try again." (i18n `errors.server`)
- Never toasts:
  - 400 and 401 (pages handle them)
  - requests carrying an `HttpContext` flag `SKIP_ERROR_TOAST`

---

## 6. `UserService`

**User model**

| Field | Type | Source |
|---|---|---|
| `id` | string | Backend |
| `email` | string | Backend |
| `name` | string | Backend |
| `permissions` | string[] | Backend; `['*']` means all |
| `avatar` | string? | Optional, not sent by the backend yet |
| `status` | `'online' \| 'away' \| 'busy' \| 'not-visible'`? | Optional, not sent yet (see `widgets.md` W2) |

**API**

| Member | Behaviour |
|---|---|
| `user` | `signal<User \| null>`. Read-only to consumers; expose `asReadonly()`. |
| `set(user)` | Sets the signal. |
| `reset()` | Sets the signal to `null`. |
| `load()` → `Observable<User>` | GET `/auth/me`, then sets the signal. |
| `update(patch)` → `Observable<User>` | PATCH `/auth/me` (see `widgets.md` §5), then sets the signal from the response. |
| `hasPermission(p)` | Returns true if `permissions` includes `'*'` or `p`. |

The legacy service used a replay stream plus `GET api/common/user`. That endpoint does not exist on the backend; use `/auth/me`.

---

## 7. Dev-mock interceptor

Selector-free functional interceptor `devMockInterceptor`, stored in a separate file so it can be removed easily.

**Enablement**
- Active only when `environment.devMock?.enabled === true`.
- `environment.ts` (dev) ships with `enabled: false`; developers flip it on.
- `environment.prod.ts` must not define it, or must set it to false.
- If the app runs in production mode (`!isDevMode()`) with the flag on, the interceptor must log one `console.warn` and pass requests through unmodified.

**Config shape**

```
devMock?: {
  enabled: boolean,
  latencyMs?: number,   // default 300
  email?: string,       // default 'admin@example.com'
  password?: string     // default 'admin'
}
```

**Intercepted requests**
- Only requests whose URL starts with `apiUrl` and matches the table below.
- Every other request passes through to the real network untouched, including notifications, search and admin resources.
- Each mocked response is delayed by `latencyMs`.

| Request | Mock response |
|---|---|
| `POST /auth/sign-in` | If the email and password equal the configured ones (case-insensitive email): 200 `{ accessToken, user }`. Otherwise: 401 with the standard error body, `message` "Invalid email or password". |
| `POST /auth/sign-in-with-token` | If the body token decodes and is not expired: 200 with a fresh token and the user. Otherwise: 401 "Invalid or expired token". |
| `GET /auth/me` | If there is a valid Bearer token: 200 user. Otherwise: 401. |
| `GET /navigation` | 200 with all four variants. Each contains one item: id `example`, title "Example", type `basic`, icon `heroicons_outline:chart-pie`, link `/example`. |

**Fake token**
- A three-segment JWT-shaped string: base64url header `{"alg":"none","typ":"JWT"}`, base64url payload, and the literal signature `dev-mock`.
- Payload:

  | Claim | Value |
  |---|---|
  | `sub` | `dev-admin` |
  | `email` | configured email |
  | `name` | `Admin` |
  | `permissions` | `['*']` |
  | `typ` | `admin` |
  | `iat` | now (seconds) |
  | `exp` | now + 7 days |

- It must decode with `decodeJwtPayload`, so expiry checks work.

**Mock user:** `{ id: 'dev-admin', email: <configured>, name: 'Admin', permissions: ['*'] }`. No avatar and no status.

**Visibility:** log a single `console.info('[dev-mock] enabled')` at first use.

---

## 8. Guards

Both are functional guards and can be used as `canActivate` and `canActivateChild`. Each calls `AuthService.check()`.

**`authGuard`**
- `check()` is true → allow.
- Otherwise → return the UrlTree `/sign-in?redirectURL=<target url>`.
  - The target URL is the URL being navigated to: `state.url`.
  - Omit `redirectURL` when the target is `/sign-out`.

**`noAuthGuard`**
- `check()` is false → allow.
- Otherwise → return the UrlTree `/`, which then redirects to the signed-in landing route.
- It must not trigger a 401 redirect loop. `check()` returning false on a bad token is the normal path.

---

## 9. Routes

`app.routes.ts`, in order:

| Path | Guards | Layout (`data.layout`) | Target |
|---|---|---|---|
| `''` (pathMatch full) | | | redirect → `example` |
| `signed-in-redirect` (pathMatch full) | | | redirect → `example` |
| group (guest) | `noAuthGuard` (activate and child) | `empty` | `app-layout` with children: `sign-in`, `forgot-password`, `reset-password` (lazy `loadComponent` / `loadChildren`) |
| group (authenticated) | `authGuard` (activate and child) | `empty` | `app-layout` with child: `sign-out` |
| group (admin) | `authGuard` (activate and child) | none (user's configured layout) | `app-layout` with resolver `initialData` and child: `example` (lazy) |
| `**` | | | redirect → `example`, or a 404 page if one exists |

Removed routes: `sign-up`, `unlock-session`, `confirmation-required`, and the `home` landing route. Keep `home` only if the starter still ships a landing page; it is not part of this spec. See open question A4.

**`initialData` resolver**
- Runs in parallel:
  - `NavigationService.load()` (GET `/navigation`): its failure fails navigation and shows the error toast.
  - `NotificationsService.getAll()`: its errors are swallowed and the result becomes `[]`.
- Resolves when both settle.
- The user is already set by `check()` / `signIn()`. If `UserService.user()` is null, also call `UserService.load()`.

---

## 10. Pages

All pages:
- are standalone and OnPush;
- use Reactive Forms with typed `FormGroup`s and PrimeNG controls (`pInputText`, `p-password` or a plain input with a custom toggle, `p-checkbox`, `pButton`);
- render inside the `empty` layout;
- show errors with `ui-alert` (built on `p-message`, see `core.md`).

### 10.1 Shared page shells

**Split shell** (sign-in, forgot-password, reset-password). Screenshot: `ref/auth-sign-in.png`.

```
+--------------------------+--------------------------+
|        form card         |   decorative panel       |
|   (w-80 = 320px column)  |   (md+ only)             |
+--------------------------+--------------------------+
```

- **Root**
  - Flex, min-width 0, flex auto.
  - Below `sm`: column; items start at the top.
  - From `sm`: centred both ways.
  - From `md`: row, items stretch, justify-start.
- **Form side**
  - Below `sm`: full width, padding 32 px vertical and 16 px horizontal, transparent background on the page's `bg-default` (gray-100). See `ref/mobile-auth-sign-in.png`.
  - From `sm` (600–959 px): an auto-width card with 48 px padding, radius 16 px (`rounded-2xl`), shadow, and `bg-card`. See `ref/tablet-auth-sign-in.png`.
  - From `md`:
    - Half width, full height. Padding 64 px. `bg-card` with no radius and no shadow.
    - Content centred horizontally, justify-end; the column is centred within its half.
    - Dark: no border on this side.
- **Inner column:** width 320 px (`w-80`), max width full; from `sm`, `mx-auto` (left-aligned on mobile, `mx-0`).
- **Decorative panel**
  - Hidden below `md`. Half width, full height, relative, overflow hidden.
  - Flex, items centred, justify-centre. Padding 64 px, 112 px horizontal from `lg`.
  - Background gray-800 (`#1e293b`). Dark: 1 px left border.
  - **Background art**
    - Absolutely positioned, `pointer-events-none`, low contrast.
    - Two large concentric ring outlines in gray-700 at about 25% opacity, one bleeding off the top-left and one off the bottom-right.
    - A 220×192 dot-grid pattern at the top-right, about 4 px dots in gray-700.
    - Recreate them with our own SVG or CSS. Do not copy the legacy SVG.
  - **Copy block** (relative, z-10, full width, max width 896 px):
    - Heading: two lines, 48 px, line height 1, weight 700, gray-100. Text: "Welcome to" / "Admin" (i18n `auth.panel.title1`, `auth.panel.title2`).
    - Paragraph: margin-top 24 px, 18 px / 28 px, tracking tight, gray-400. Neutral copy: "Sign in to manage your application." (i18n `auth.panel.text`).
    - No avatars and no "17k people" line. The legacy app had a stack of 4 avatars with marketing text; it is removed.

**Card shell** (sign-out):

```
        +---------------------------+
        |   logo (centered)         |
        |   You have signed out!    |
        |   Redirecting in 5 sec... |
        |   Go to sign in           |
        +---------------------------+
```

- Root: flex, flex auto, column below `sm`, centred both ways from `sm`, min-width 0.
- Card:
  - Full width below `sm`, auto width from `sm`. Padding 32 px vertical and 16 px horizontal, 48 px from `sm`.
  - From `sm`: radius 16 px and shadow. `bg-card` (transparent below `sm`).
- Inner column: width 320 px, `mx-auto`. Contents centred.

**Shared form elements**
- **Logo:** 48 px wide icon logo, left-aligned; centred on sign-out.
- **Title:** margin-top 32 px, 32 px / 40 px, weight 800 (extrabold), tracking tight, default text colour.
- **Subtitle:** margin-top 2 px, 14 px / 500.
- **Alert:**
  - Margin-top 32 px, appearance outline, full width, padding 12 px 16 px, radius 6 px, 14 px.
  - Error variant: light red background (`#fef2f2`), red-300 border, red-700 text.
  - Success variant: green-50 background (`#f0fdf4`), green-300 border, green-700 text.
  - Not dismissible.
  - On appearance, play a short horizontal shake (about 400 ms; translateX ±6 px a few times). Play it on every new message.
- **Form:** margin-top 32 px, flex column. Gap 24 px between field blocks.
- **Label:** 12 px / 24 px, weight 500, `text-secondary`. Bound with `for`/`id`.
- **Input:**
  - Margin-top 8 px, full width, height 42 px, radius 6 px, 1 px border (gray-300 in light), `bg-card`.
  - Focus: primary border plus a ring (PrimeNG default).
  - Invalid and touched: red-500 border.
- **Password input:**
  - Same as input, with a trailing 40×40 round text icon button absolutely positioned at the right, vertically centred.
  - Icon `eye` when hidden, `eye-slash` when shown; 20 px, primary.
  - Toggles the input type between `password` and `text`. `aria-label` from `auth.showPassword` / `auth.hidePassword`. Not focusable via Tab (`tabindex=-1`) is acceptable.
- **Field error:**
  - A `small` element directly below the input, margin-top 4 px, 12 px, red-500.
  - Shown when the control is invalid and touched (or the form was submitted).
  - Only the first failing validator's message is shown.
- **Submit button:**
  - Full width, height 42 px, margin-top 24 px (sign-in) or 12 px (others).
  - Primary filled, radius 6 px, text 14–16 px / 500, white.
  - While the request runs:
    - The whole form is disabled.
    - The button shows a 24 px progress spinner (white stroke) instead of the label.
    - The button is not clickable.
- **Link:** 13–14 px, weight 500, primary-500 (`#6366f1`); hover underline. Router link.

### 10.2 Sign-in (`/sign-in`)

Screenshots: `ref/auth-sign-in.png`, `ref/auth-sign-in-error.png`, `ref/mobile-auth-sign-in.png`.

**Content, top to bottom**
1. Logo.
2. Title "Sign in".
3. Error alert: present only after a failed attempt.
4. Form:
   - **Email address**
     - Validators: `required`, `email`.
     - Messages: required → "Email address is required"; email → "Please enter a valid email address".
     - `autocomplete="username"`, type `email`.
   - **Password**
     - Validator: `required`.
     - Message: "Password is required".
     - `autocomplete="current-password"`.
   - **Row** (flex, items centred, justify-between, full width, margin-top 6 px):
     - Left: a "Remember me" checkbox. The box is 20 px, the label is 13 px with an 8 px left margin. Default **unchecked**.
     - Right: the "Forgot password?" link to `/forgot-password`, 13 px / 500, primary-500.
   - **Submit:** "Sign in".
5. Nothing else. No sign-up link, demo alert, social buttons or prefilled credentials. The legacy page prefilled the fields with demo values; the new fields start empty.

**Flow**
1. On submit, if the form is invalid: mark all fields as touched and stop.
2. Disable the form, hide the alert, and call `AuthService.signIn({ email, password, rememberMe })`.
3. **Success:**
   - Read the `redirectURL` query param.
   - If it is a relative app path (starts with `/` and not `//`), navigate there with `navigateByUrl`.
   - Otherwise navigate to `/signed-in-redirect`.
4. **Error:**
   - Re-enable the form.
   - Reset only the password field, keeping the email. The legacy page reset the whole form; keeping the email is a deliberate improvement.
   - Show the error alert:
     - 401 → "Wrong email or password"
     - 400 → the first backend message, or "Please check the form"
     - otherwise → "Something went wrong, please try again."

**Metrics (desktop 1440×900, measured)**
- The form column starts at x 336 (that is, 320 px column inside the 720 px half).
- Logo top y about 64. Title top y about 140.
- Inputs 320×42. Submit 320×42.
- Error alert 320×52 at about 32 px below the title block.

### 10.3 Forgot password (`/forgot-password`)

Screenshots: `ref/auth-forgot-password.png`, `ref/auth-forgot-password-invalid.png`, `ref/auth-forgot-password-sent.png`.

**Content**
1. Logo.
2. Title "Forgot password?".
3. Subtitle "Fill the form to reset your password".
4. Alert, after submit.
5. Form:
   - Email address: `required` and `email`, with the same messages as sign-in.
   - Submit "Send reset link", margin-top 12 px.
6. Footer line (margin-top 32 px, 15 px, weight 500, `text-secondary`): "Return to" followed by the link "sign in" to `/sign-in`.

**Flow**
1. Invalid → mark the fields touched.
2. Disable the form and call `forgotPassword(email)`.
3. Whatever the outcome, re-enable the form, reset it, and show the alert.
   - **Success:** success alert "Password reset sent! You'll receive an email if you are registered on our system."
   - **Error:**
     - 400 → error alert "Please enter a valid email address".
     - Network or 5xx → "Something went wrong, please try again."
   - Do NOT reveal whether the email exists. The legacy "Email does not found!" message is dropped, because the backend contract always returns success for unknown emails.

### 10.4 Reset password (`/reset-password?token=<token>`)

Screenshot: `ref/auth-reset-password.png`.

**Content**
1. Logo.
2. Title "Reset your password".
3. Subtitle "Create a new password for your account".
4. Alert.
5. Form:
   - **Password:** `required`, `minLength(8)`. Messages: "Password is required", "Password must be at least 8 characters". The minLength rule is new; see A3.
   - **Password (Confirm):** `required`. Message: "Password confirmation is required".
   - **Group validator** `mustMatch('password', 'passwordConfirm')`:
     - Sets an error `mustMatch` on the confirm control when the values differ.
     - Message: "Passwords must match".
     - Clears only that error when they match, preserving other errors.
     - Specified in `core.md`.
   - Both password fields have eye toggles.
   - Submit "Reset your password", margin-top 12 px.
6. Footer: "Return to sign in", as on forgot-password.

**Token handling**
- Read `token` from the query params on init.
- If it is missing: show the error alert "This reset link is invalid or has expired." and disable the form.
- The legacy page never read a token. This is new, required behaviour.

**Flow**
1. Invalid → mark the fields touched.
2. Disable the form and call `resetPassword(token, password)`.
3. **Success:**
   - Reset and disable the form. Show the success alert "Your password has been reset."
   - The "Return to sign in" link is the next step.
   - Optional: automatically navigate to `/sign-in` after 3 s.
4. **Error:**
   - Re-enable and reset the form.
   - 400 or 401 → "This reset link is invalid or has expired."
   - Otherwise → "Something went wrong, please try again."

### 10.5 Sign out (`/sign-out`)

This page has no form and uses the card shell (§10.1).

**Content**
1. Centred logo.
2. Title "You have signed out!", centred.
3. Countdown line: margin-top 2 px, centred, 14 px / 500.
   - While counting: "Redirecting in {n} second(s)". Use correct plurals via Transloco params: "1 second", "2 seconds".
   - At 0: "You are now being redirected!"
4. Margin-top 32 px, centred: the "Go to sign in" link to `/sign-in`.

**Flow**
1. On init, call `AuthService.signOut()`.
2. Start a countdown from 5, decrementing every 1 s.
3. When it reaches 0, navigate to `/sign-in`.
4. Clean up the timer on destroy, using `DestroyRef` or `takeUntilDestroyed`.

---

## 11. i18n keys

All keys go in `assets/i18n/en.json`; `tr.json` gets the same keys. Interpolations use Transloco `{{param}}`.

| Key | English |
|---|---|
| `auth.logoAlt` | Logo |
| `auth.emailLabel` | Email address |
| `auth.passwordLabel` | Password |
| `auth.passwordConfirmLabel` | Password (Confirm) |
| `auth.showPassword` | Show password |
| `auth.hidePassword` | Hide password |
| `auth.validation.emailRequired` | Email address is required |
| `auth.validation.emailInvalid` | Please enter a valid email address |
| `auth.validation.passwordRequired` | Password is required |
| `auth.validation.passwordMinLength` | Password must be at least {{min}} characters |
| `auth.validation.passwordConfirmRequired` | Password confirmation is required |
| `auth.validation.passwordsMustMatch` | Passwords must match |
| `auth.errors.generic` | Something went wrong, please try again. |
| `auth.errors.checkForm` | Please check the form |
| `auth.signIn.title` | Sign in |
| `auth.signIn.rememberMe` | Remember me |
| `auth.signIn.forgotPassword` | Forgot password? |
| `auth.signIn.submit` | Sign in |
| `auth.signIn.wrongCredentials` | Wrong email or password |
| `auth.forgotPassword.title` | Forgot password? |
| `auth.forgotPassword.subtitle` | Fill the form to reset your password |
| `auth.forgotPassword.submit` | Send reset link |
| `auth.forgotPassword.sent` | Password reset sent! You'll receive an email if you are registered on our system. |
| `auth.resetPassword.title` | Reset your password |
| `auth.resetPassword.subtitle` | Create a new password for your account |
| `auth.resetPassword.submit` | Reset your password |
| `auth.resetPassword.success` | Your password has been reset. |
| `auth.resetPassword.invalidToken` | This reset link is invalid or has expired. |
| `auth.returnTo` | Return to |
| `auth.signInLink` | sign in |
| `auth.signOut.title` | You have signed out! |
| `auth.signOut.redirectingIn` | Redirecting in {{seconds}} second(s) |
| `auth.signOut.redirecting` | You are now being redirected! |
| `auth.signOut.goToSignIn` | Go to sign in |
| `auth.panel.title1` | Welcome to |
| `auth.panel.title2` | Admin |
| `auth.panel.text` | Sign in to manage your application. |
| `errors.network` | Cannot reach the server |
| `errors.forbidden` | You don't have permission to do that |
| `errors.server` | Something went wrong, please try again. |

The legacy `en.json` only held demo keys (`welcome-back`, `Project`, `Analytics`); drop them.

---

## 12. Provider wiring (summary)

`app.config.ts` must provide:
- the router;
- `provideHttpClient(withInterceptors([devMockInterceptor, authInterceptor, errorInterceptor]))`;
- the `API_BASE_URL` token = `environment.apiUrl`;
- `MessageService` plus one `<p-toast>` in the root component, for `errorInterceptor`;
- Transloco with langs `en` and `tr`; on bootstrap, restore `currentLanguage` from storage (§3);
- PrimeNG with `darkModeSelector: 'html.dark'` (`theming.md`);
- `provideUi(...)` with the default config (`core.md`).

No mock-API providers are registered.

---

## 13. Open questions

- **A1. Remember-me semantics.** This spec uses localStorage when checked and sessionStorage when unchecked, unchecked by default. The legacy app always used localStorage. Confirm, or should it always persist?
- **A2. Forgot/reset backend.** (Resolved: nest-schematics now has `POST auth/forgot-password` and `POST auth/reset-password`; mail delivery needs its mail add-on. See §2.2 and DECISIONS A2.)
- **A3. Password policy.** Should reset require a minimum length of 8, or only `required` as in the legacy app? The backend sign-in DTO only caps length at 200.
- **A4. Landing route.** The legacy starter had a `home` landing route on the empty layout. Keep it, or redirect `/` straight to `/example`?
- **A5. Token refresh.** The backend issues 1-day tokens and has no refresh flow. Should the UI call `sign-in-with-token` proactively near expiry, for example when under 10 minutes remain on navigation, or just let the user re-login on a 401?
