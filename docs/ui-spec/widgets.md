# UI spec: Header widgets and the settings panel

Status: clean-room functional spec. Behaviour, metrics, colours and data contracts only.

Target stack: Angular 20 (standalone, OnPush, zoneless, signal APIs), PrimeNG 20, Tailwind 3, Transloco.

Screenshots folder `ref/` = `/private/tmp/claude-501/-Users-macbookm3pro--claude-spares-spare-ga0vel/e6e173af-1f6a-4c59-8de9-f74b6683b26a/scratchpad/ref/`. The screenshots still show the removed quick-chat bar, shortcuts and messages buttons, and Fuse branding; ignore those.

Placement of each widget per layout is defined in `layouts.md` §1.4 B and §3.

| Widget | Selector | Section |
|---|---|---|
| Languages | `app-languages` | §1 |
| Fullscreen | `ui-fullscreen` (library, see `core.md`) | §2 |
| Search | `app-search` | §3 |
| Notifications | `app-notifications` | §4 |
| User menu | `app-user` | §5 |
| Settings panel | `app-settings` | §6 |
| Quick chat, messages, shortcuts | removed | §7 |

## Common rules

- **Trigger buttons.**
  - 40×40, fully round, PrimeNG text button style (transparent until hover).
  - 24 px icon in primary colour (`#4f46e5` for the default theme). Hover shows a light primary-tinted round background.
  - Each trigger has an `aria-label` from i18n.
- **API base.** Every endpoint below is relative to `environment.apiUrl`, e.g. `http://localhost:3000/api`. Callers prepend it, or an injected `API_BASE_URL` token does. The JWT is attached by the auth interceptor (`auth.md`).
- **Error responses** follow the backend shape `{ statusCode, error, message: string | string[], path, timestamp }`.
- **Popovers** use PrimeNG `p-popover`:
  - Light: white background, 1 px gray-200 border, radius 6 px, `shadow-md`, content padding 12 px unless stated.
  - Dark: gray-800 background.
  - Popovers append to `body`. Escape and outside clicks close them.
- Every widget is OnPush and keeps its state in signals.

---

## 1. `app-languages`

Screenshot: `ref/widget-languages-open.png`.

### Behaviour

- **Available languages** come from Transloco's configured langs: `en` "English", `tr` "Turkish".
- **Active language** is a signal mirroring Transloco's active lang (subscribe to `langChanges$`).
- **Flag map:** `en` → `US`, `tr` → `TR`. The image path is `assets/images/flags/{CODE}.svg`. Make the map a constant so it is easy to extend.
- **Trigger:** shows the active language's flag.
  - Flag image 24 px wide (height auto, about 16 px), small radius (2 px), a small shadow, and an inset ring of black at 10% opacity.
  - Wrap it in a relative box with `overflow-hidden`.
- **Selecting a language:**
  1. Set the Transloco active lang.
  2. Persist the choice to `localStorage` key `currentLanguage`, so the app can restore it on bootstrap.
  3. Close the popover.
- Do NOT rename navigation items on language change. The legacy app did that for demo purposes. Navigation titles are translated by the navigation component itself, see `navigation.md`.

### Popover metrics (measured)

- Popover about 142×116, border gray-200, radius 6 px, `shadow-md`, inner padding 12 px.
- The list has 8 px vertical padding.
- **Row:**
  - Flex, items centred, padding 8 px 16 px, measured height 37 px, cursor pointer.
  - Hover background gray-100 (dark: white at 5%).
  - Contents: flag image (24 px, same styling as the trigger), then the language label with a 12 px left margin, 14 px, weight 500 (`font-medium`).
  - Mark the active language with weight 600, or with a primary-coloured label. This is optional; the legacy app had no marker.

### i18n

| Key | English |
|---|---|
| `languages.menu` | Language |
| `languages.en` | English |
| `languages.tr` | Turkish |

---

## 2. Fullscreen (placement only)

The component lives in the library: `ui-fullscreen`, see `core.md`.

- In layouts it sits right after `app-languages` and is hidden below `md` (960 px).
- The trigger is a 40×40 round text button. Measured: font 16/24, primary colour, radius 50%.
- Icon:
  - `arrows-pointing-out` (heroicons outline) when not full screen; `arrows-pointing-in` while full screen.
  - The dev build used `pi pi-expand`; either icon family is acceptable as long as `ui-icon` supports it.
- Tooltip "Toggle Fullscreen" (i18n `layout.fullscreen`).
- Toggles `document.fullscreenElement` via the Fullscreen API on `document.documentElement`. Listen to `fullscreenchange` to update the icon.

---

## 3. `app-search`

Screenshots: `ref/widget-search-open.png`, `ref/widget-search-results.png`, `ref/widget-search-noresults.png`.

### API (proposed)

| Member | Type | Default | Meaning |
|---|---|---|---|
| `appearance` | input `'basic' \| 'bar'` | `'basic'` | `'bar'` = icon button that expands over the header; `'basic'` = always-visible input |
| `debounce` | input `number` (ms) | 300 | Delay after typing before searching |
| `minLength` | input `number` | 2 | Minimum characters before searching |
| `search` | output `SearchResultSet[]` | | Emitted each time results arrive |
| `opened` | signal `boolean` | false | Bar mode only |

Layouts always use `appearance="bar"`.

### Behaviour

- **Input pipeline:** value changes are debounced by `debounce` ms; consecutive duplicate values are dropped.
  - If the trimmed value is shorter than `minLength`, clear the results (set them to `null`) and do not call the API.
  - Otherwise call `POST /search` with `{ query }`. Cancel any in-flight request when a new query starts. Store the response in a `results` signal and emit `search`.
- **Bar mode open:**
  - Clicking the trigger sets `opened` = true. The bar overlay appears and the input is focused automatically after render.
  - The overlay slides in from the top: about 150–200 ms, translateY(-100%) → 0.
- **Bar mode close:**
  - Triggers: the X button, Escape inside the input, or navigating via a result.
  - Closing sets `opened` = false, clears the input value and sets the results to `null`.
- **Result rows** are router links. Clicking a row navigates and, in bar mode, closes the search.
- **Keyboard:** Arrow Up/Down move an active option; Enter opens it. This is recommended; the legacy app used autocomplete and supported it.
- **Errors:** an HTTP error results in an empty array, so "No results found!" shows. Do not toast.

### Bar mode metrics

**Overlay**
- Absolutely positioned over the whole header (`inset-0`), so it covers the header row of the host layout.
- `bg-card`, z-index 99, flex row, items centred.
- Measured in classic: 1096×64 starting at the header's left edge. It is bordered by a 1 px primary focus ring in the screenshot because the input has focus.

**Inside the overlay**
- Magnifier icon (`magnifying-glass`): 20 px, `text-secondary`, absolutely positioned, left margin 24 px (32 px from `sm`).
- Input:
  - Full width and height, transparent, no border.
  - Horizontal padding 64 px (72 px from `sm`). 14 px text.
  - Placeholder "Search..." (i18n `search.placeholder`).
- Close button: 40×40 round text button with the `x-mark` icon (24 px, primary), absolutely positioned 20 px from the right (28 px from `sm`), vertically centred.

**Results panel (bar mode)**
- Absolute, top 100% of the overlay, margin-top 8 px in basic mode / flush in bar mode, left 0, right 0.
- `bg-card`, `shadow-md`, 1 px top border, bottom radius 6 px, max height 512 px (`max-h-128`), vertical scroll. Horizontal padding 8 px from `sm`.
- In the screenshot the panel spans the full content width under the header.

### Basic mode metrics

- Wrapper: relative, full width, min width 320 px from `sm`.
- Input:
  - Left padding 48 px with the magnifier at the left (20 px, secondary, at about 16 px).
  - 12 px vertical padding, radius 8 px (`rounded-lg`), 1 px border (border token), `bg-card`.
- The results panel sits under the input with an 8 px gap, the same panel styling as bar mode, and fully rounded corners.

### Results content

**Group header**
- One per result set, in API order.
- Text = `label`, 12 px, weight 600, uppercase, letter spacing wider, `text-secondary`.
- Margin-top 8 px, padding 0 16 px. Measured: "PAGES" at 12 px semibold.

**Row (common)**
- Padding 12 px 24 px, 13 px text, radius 6 px, cursor pointer.
- Hover / active option: background gray-100 (dark: white at 5%).

**Row templates by result set `id`**

| id | Row layout |
|---|---|
| `contacts` | 32 px round avatar; if no avatar, a 32 px circle with primary-100 background, primary-800 text, showing the first letter of `name`. Then `name` with a 12 px left margin. |
| `pages` | Two lines: `title` (13 px, default colour), then `link` (12 px, `text-secondary`). |
| `tasks` | `check-circle` icon (20 px; primary when `completed`, `text-hint` otherwise), then `title` with a 12 px left margin. Completed tasks are line-through and secondary. |
| any other id | Generic: `title` (or `name`) as one line. |

**Empty state**
- Shown when results is an empty array, i.e. a query was made.
- Padding 12 px 24 px, `text-secondary`. Text "No results found!" (i18n `search.noResults`).

### Endpoint contract

`POST {apiUrl}/search` (requires Bearer; implemented in nest-schematics, used when `features.search === 'backend'`).

- Request: `{ "query": string }`, trimmed and cut to 100 characters. Fewer than 2 characters after trimming returns `[]`.
- Response `200`: `SearchResultSet[]`. An empty array means no results. Groups are `admins` (needs `admin.read`) and `roles` (needs `role.read`), at most 5 hits per group, empty groups left out. A hit is `{ id, link, value, title }` with `link` such as `/admins/<id>`.
- Errors: `401` is handled by the auth interceptor.

`SearchResultSet`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Template key: `contacts`, `pages`, `tasks`, or other. |
| `label` | string | Group header text, e.g. "Pages". |
| `results` | `SearchResult[]` | |

`SearchResult`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `link` | string | Router URL to navigate to. |
| `value` | string | Text placed in the input on selection. |
| `title` | string? | For pages and tasks. |
| `name` | string? | For contacts. |
| `avatar` | string? | For contacts. |
| `completed` | boolean? | For tasks. |

**Client-side navigation search (the default).** The backend searches only admins and roles, so the app ships `SearchService.search(query)` locally:
- Flatten `navigation().default` and match `title` case-insensitively.
- Return one set: `{ id: 'pages', label: 'Pages', results: [{ id, title, link, value: title }] }`.
- Return `[]` when nothing matches.

The backend is opt-in through `environment.features.search`. Choose the backend or the fallback via the service, not the component. See open question W1.

### i18n

| Key | English |
|---|---|
| `search.open` | Search |
| `search.placeholder` | Search... |
| `search.close` | Close search |
| `search.noResults` | No results found! |
| `search.groups.pages` | Pages |
| `search.groups.contacts` | Contacts |
| `search.groups.tasks` | Tasks |

---

## 4. `app-notifications`

Screenshots: `ref/widget-notifications-open.png`, `ref/widget-notifications-open-classic.png`, `ref/widget-notifications-hover.png`.

### Data model

`AppNotification`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `icon` | string? | `ui-icon` name, e.g. `heroicons_mini:star`. |
| `image` | string? | URL; shown instead of the icon when present. |
| `title` | string? | |
| `description` | string? | May contain simple HTML (bold, links). Render with Angular's sanitized `[innerHTML]`. |
| `time` | string | ISO 8601. |
| `link` | string? | |
| `useRouter` | boolean? | true → router link; false or absent → plain `href` (external). |
| `read` | boolean | |

The backend's `AdminNotification` is `{ id, title, description | null, icon | null, link | null, time, read }`; the service maps it to `AppNotification` (nulls become absent, `useRouter` is always `true` because `link` is a router link of the admin app).

`NotificationsService` holds a `notifications` signal of `AppNotification[]`, plus a computed `unreadCount`. Every mutation updates the signal from the server response. Methods:
- `getAll()`
- `markRead(id)` (one way only: the backend has no mark-unread, remove, mark-all-read or create route)

### Trigger

- 40×40 round text button with the `bell` icon (24 px, primary). `aria-label` `notifications.open`.
- **Unread badge** (only when `unreadCount > 0`):
  - Positioned at the button's top-left plus a 16 px left offset and a 10 px top offset, so it sits on the bell's upper right.
  - Circle, minimum 16×16, horizontal padding 4 px.
  - Background teal-600 (`#0d9488`), text indigo-50, 10 px, weight 500, line height 16 px.
  - Content: the count; the screenshot shows "3".

### Panel

**Container**
- Opens on trigger click.
- Implementation: PrimeNG `p-popover` (desktop) or `p-drawer` (mobile); a CDK overlay is also acceptable.
- Desktop (≥ 600 px):
  - Anchored below the trigger, right-aligned to it; measured at x 944, y 52 for a trigger at about x 1260.
  - Width 360 px (`w-90`), measured height 552 px with 5 items. Radius 16 px (`rounded-2xl`), `shadow-lg`, overflow hidden.
  - Transparent backdrop; an outside click closes the panel.
- Mobile (< 600 px):
  - Full screen (`fixed inset-0`), no radius, with a dimmed backdrop.

**Header**
- Flex row, items centred, flex-shrink 0.
- Padding 16 px top/bottom, 16 px right, 24 px left. Measured height 72 px.
- Background primary (`bg-primary`), text `on-primary` (white).
- Contents, left to right:
  - Close button: 40 px round, `x-mark` icon, white. Only below `sm`.
  - Title "Notifications" (i18n `notifications.title`): 16 px, weight 500, line height 40 px. Left margin 12 px when the close button shows.
  - The legacy mark-all-read button is not shown: the backend has no such route.

**List**
- Flex column, flex auto, vertical scroll.
- Desktop maximum height 480 px (`max-h-120`). `bg-card`. 1 px dividers (`divide-y`, border token).

**Row**
- Flex, relative, `group` for hover effects.
- Hover background gray-50 (dark: black at 5%).
- Unread rows get a light primary tint (primary at about 3–5%). Optional; the legacy app used a subtle `unread` class.
- **Content area**
  - Flex, flex auto, padding 20 px top/bottom, 24 px left.
  - If `link` is set, the whole content area is a link: `routerLink` when `useRouter`, otherwise `href` with `target="_blank"` and `rel="noopener"`.
  - Media (32 px, flex-shrink 0, right margin 16 px):
    - `image` → 32 px round image, `object-cover`.
    - Otherwise, if `icon`: a 32 px circle with gray-100 background (dark gray-700) containing the icon at 20 px.
  - Text column:
    - `title`: weight 600, single line (`line-clamp-1`).
    - `description`: two lines max (`line-clamp-2`), HTML allowed.
    - `time`: formatted `MMM dd, h:mm a` (Angular `DatePipe`, current locale), 12 px, line height 1, `text-secondary`, margin-top 8 px.
- **Actions column**
  - Relative, flex column, margins 20 px top/bottom, 24 px right, 8 px left.
  - Mark-as-read button (unread rows only):
    - A 24×24 button containing a primary dot 8 px in diameter.
    - Tooltip "Mark as read" (i18n `notifications.markAsRead`).
    - Click calls `markRead(id)`.
    - Opening the row's link also marks it read.
  - The legacy mark-as-unread and remove buttons are not shown: the backend has no such routes.
  - Clicks on the action buttons must not trigger the row link.

**Empty state**
- Flex column, centred both ways, flex auto, padding 64 px 32 px.
- 56 px circle, primary-100 background (dark primary-600), with the `bell` icon in primary-500 (dark primary-300).
- "No notifications": margin-top 20 px, 24 px (`text-2xl`), weight 600, tracking tight.
- Sub-text "When you have notifications, they will appear here.": margin-top 4 px, centred, 15 px (`text-md`), max width 240 px, `text-secondary`.

### Loading

- The admin route resolver calls `NotificationsService.getAll()` together with navigation (see `auth.md` §9).
- If the request fails, the resolver MUST NOT block the route: catch the error and set `[]`. Navigation failure, by contrast, should surface.

### Endpoint contract

All endpoints are relative to `apiUrl`, require Bearer (any signed-in admin, no extra permission) and exist in nest-schematics.

| Method & path | Request | Response 200 | Notes |
|---|---|---|---|
| `GET /admin/me/notifications` | | `AdminNotification[]` | Newest first, at most 50. |
| `POST /admin/me/notifications/:id/read` | | the updated `AdminNotification` | Calling it again is fine. 404 when the id is not one of the caller's. |

There is no delete, mark-unread, mark-all-read or create route. Notifications are created server side only (`AdminNotificationsService.notify(adminId, ...)`).

### i18n

| Key | English |
|---|---|
| `notifications.open` | Notifications |
| `notifications.title` | Notifications |
| `notifications.markAsRead` | Mark as read |
| `notifications.close` | Close |
| `notifications.empty.title` | No notifications |
| `notifications.empty.text` | When you have notifications, they will appear here. |

---

## 5. `app-user`

Screenshots: `ref/widget-user-open.png`, `ref/widget-user-status-open.png`.

### API (proposed)

| Member | Type | Default |
|---|---|---|
| `showAvatar` | input `boolean` | `true` |

Reads `UserService.user` (signal, see `auth.md` §6).

### Trigger

- 40×40 round text button. `aria-label` `user.menu`.
- Contents, inside a relative box:
  - If `showAvatar` and `user().avatar`: a 28 px round image.
  - Otherwise: the `user-circle` icon at 24 px (primary).
- **Status dot**
  - 8 px circle, absolutely positioned at the bottom-right of the box (right 0, bottom 0), with a 1–2 px ring in the background colour.
  - Colour by `user().status`:

    | Status | Colour |
    |---|---|
    | `online` | green-500 `#22c55e` |
    | `away` | amber-500 `#f59e0b` |
    | `busy` | red-500 `#ef4444` |
    | `not-visible` | gray-400 `#94a3b8` |

  - If status is undefined, which the current backend never sends, hide the dot. See open question W2.

### Popover

Measured 266×310 with the status list collapsed. Minimum width 240 px. Padding 12 px.

1. **Header block**
   - Padding 8 px 16 px, 1 px bottom border, margin-bottom 4 px.
   - "Signed in as" (i18n `user.signedInAs`): 10 px, uppercase, `text-secondary`, weight 500.
   - `user().email`: 12 px, weight 500, truncated, margin-top 4 px.
2. **Profile row**
   - Height 36 px, padding 8 px 16 px, radius 6 px, 12 px text, flex with a 12 px gap.
   - Hover background gray-100 (dark white at 5%).
   - `user-circle` icon at 20 px, then "Profile" (i18n `user.profile`).
   - Action: close the popover, then navigate to `/profile` if that route exists; otherwise just close. Provide a `profileRoute` constant.
3. **Settings row**
   - Same styling as Profile. `cog-8-tooth` icon, "Settings" (i18n `user.settings`).
   - Action: close the popover, then navigate to a settings route if one exists. Opening the theme settings drawer is NOT expected.
4. **Divider:** 1 px, margin 4 px 0.
5. **Status row**
   - Same row style. `ellipsis-horizontal-circle` icon, label "Status" (i18n `user.status`).
   - A trailing `chevron-down` icon (`chevron-up` when expanded) at `ml-auto`, 16 px.
   - Click toggles the `statusOpen` signal. It does not close the popover.
6. **Status list** (when expanded)
   - Padding 0 24 px. Four rows, each padding 4 px 0 and 12 px text.
   - Each row: a 12 px dot (`w-3 h-3`, colours as in the trigger table), then the label with a 12 px gap. Rows at 30 px pitch in the screenshot.
   - Hover: the label turns primary.
   - Labels and values:

     | Label | i18n | Value |
     |---|---|---|
     | Online | `user.statuses.online` | `online` |
     | Away | `user.statuses.away` | `away` |
     | Busy | `user.statuses.busy` | `busy` |
     | Invisible | `user.statuses.invisible` | `not-visible` |

   - Click calls `UserService.update({ status })` (PATCH, see below), then closes the popover. Update the signal from the response; on error keep the old status.
7. **Divider.**
8. **Sign out row**
   - Same row style, but text and icon are red-500.
   - `arrow-right-on-rectangle` icon, "Sign out" (i18n `user.signOut`).
   - Action: close the popover and navigate to `/sign-out`. That page performs the sign-out, see `auth.md`.

### Endpoint contract

| Method & path | Request | Response | Status |
|---|---|---|---|
| `GET /auth/me` | | `{ id, email, name, permissions[] }` plus optionally `avatar`, `status` | **Exists** in nest-schematics (without `avatar`/`status`). |
| `PATCH /auth/me` | `{ status?: 'online'\|'away'\|'busy'\|'not-visible', name?: string, avatar?: string }` | the updated user (same shape as `GET /auth/me`) | NOT yet implemented. |

Until `PATCH /auth/me` exists, the status picker updates the local signal only. Do this when the request returns 404 or 405. Show the status section only when a config flag such as `features.userStatus` is on. See open question W2.

### i18n

| Key | English |
|---|---|
| `user.menu` | User menu |
| `user.signedInAs` | Signed in as |
| `user.profile` | Profile |
| `user.settings` | Settings |
| `user.status` | Status |
| `user.statuses.online` | Online |
| `user.statuses.away` | Away |
| `user.statuses.busy` | Busy |
| `user.statuses.invisible` | Invisible |
| `user.signOut` | Sign out |

---

## 6. `app-settings` (settings cog and drawer)

Screenshots: `ref/settings-open.png` (top), `ref/settings-open-bottom.png` (scrolled), `ref/settings-open-dark.png`.

Rendered once by `app-layout`, after the layout (`layouts.md` §2.1). It is present on every layout, including empty, so it also shows on auth pages; the screenshot `ref/auth-sign-in-error.png` shows the cog there. See open question W3.

### Cog trigger

- Fixed position: right 0, top 275 px. z-index 90.
- 40×40, flex centred, radius 8 px on the left side only (`rounded-l-lg`), `shadow-lg`, cursor pointer.
- Background red-600 at 90% opacity (`rgba(220,38,38,0.9)`).
- Icon: `cog-8-tooth`, 20 px, white, rotating continuously and slowly (one turn every 3–4 s, linear, infinite).
- Always at `right: 0`. The legacy app moved it 64 px left on some layouts for the quick-chat bar; that offset no longer exists.
- `aria-label` "Settings" (i18n `settings.open`).
- Click opens the drawer.

### Drawer

**Container**
- PrimeNG `p-drawer`, position right, modal.
- Width 100vw below `sm`, 400 px from `sm`. Full height. z-index above the layout (999).
- Mask: black at 60% opacity. Clicking the mask closes the drawer; so does Escape.
- Remove PrimeNG's default header and padding; build the header below.

**Header**
- Flex row, items centred, flex-shrink 0, height 80 px, horizontal padding 24 px.
- Background primary, text white.
- Contents:
  - `cog-8-tooth` icon, 28 px, white. Static, or the same slow spin; both are acceptable.
  - "Settings" (i18n `settings.title`): left margin 12 px, 20 px, weight 600, tracking tight.
  - Close button at `ml-auto`: 40 px round text button, `x-mark` icon at 24 px, **white**. The legacy close icon was primary on primary and invisible; that is a bug to fix. Click closes the drawer.

**Body**
- Flex column, padding 24 px, vertical scroll. `bg-card`.
- Sections are separated by a 1 px horizontal rule (border token) with 32 px vertical margins.

**Section titles**
- 13 px, weight 600, uppercase, `text-secondary`, letter spacing normal.
- "Theme", "Scheme", "Layout" (i18n `settings.theme`, `settings.scheme`, `settings.layout`).

#### 6.1 Theme

- Grid with 2 columns, 3 from `sm`. Gap 12 px, margin-top 24 px.
- One pill per theme, in this order:

  | Theme id | Name | Dot colour |
  |---|---|---|
  | `theme-default` | Default | `#4f46e5` |
  | `theme-brand` | Brand | `#2196f3` |
  | `theme-teal` | Teal | `#0d9488` |
  | `theme-rose` | Rose | `#f43f5e` |
  | `theme-purple` | Purple | `#9333ea` |
  | `theme-amber` | Amber | `#f59e0b` |

- **Pill**
  - Flex, items centred, justify-centre, padding 12 px 16 px, measured height 44 px. Fully round, cursor pointer.
  - Background `bg-hover` (slate-400 at 12%: `rgba(148,163,184,0.12)`).
  - Hover: background slightly stronger.
  - The pill element carries that theme's class (`theme-teal`, etc.). Its dot uses the scoped `primary` colour, so every pill previews its own theme.
  - Content: a 12 px round dot in that theme's primary, then the name with a 10 px left margin, 14 px, weight 500, line height 20 px.
- **Selected pill:** a 2 px inset ring in the current primary colour, and default text colour. Unselected pills use `text-secondary`.
- Click calls `UiConfigService.set({ theme })`.

#### 6.2 Scheme

- Grid with 3 columns, gap 12 px, margin-top 24 px. In the screenshot each pill is about 104×44.
- Pills: same style as Theme but with padding 12 px top/bottom, 20 px left, 24 px right. Content is an icon (20 px) and a label with an 8 px left margin.

  | Label | i18n | Icon | Value |
  |---|---|---|---|
  | Auto | `settings.schemes.auto` | `bolt` (solid) | `auto` |
  | Dark | `settings.schemes.dark` | `moon` (solid) | `dark` |
  | Light | `settings.schemes.light` | `sun` (solid) | `light` |

- Auto pill tooltip (i18n `settings.schemes.autoTooltip`): "Automatically sets the scheme based on user's operating system's color scheme preference using 'prefer-color-scheme' media query." Use the corrected wording "prefers-color-scheme".
- Selected: 2 px inset primary ring, default text colour. Others: `text-secondary`.
- Click calls `UiConfigService.set({ scheme })`.

#### 6.3 Layout

- Grid with 3 columns, gap 12 px, margin-top 24 px.
- Order:
  1. Empty, Classic, Classy
  2. Compact, Dense, Futuristic
  3. Thin, then an empty spacer spanning 2 columns
  4. Centered, Enterprise, Material
  5. Modern
- **Card**
  - Flex column, cursor pointer.
  - Thumbnail: height 80 px, full width (about 108 px wide at 400 px drawer width), radius 6 px, overflow hidden, 2 px border.
    - Border colour gray-200 (dark: the border token); primary when selected.
    - Hover: opacity 80%.
  - Label: margin-top 8 px, 13 px, weight 500, centred, `text-secondary`; primary when selected.
- **Thumbnail art**
  - A tiny schematic mock of the layout built from divs. These are not images.
  - Bars and dots are gray-100 / gray-300 in light and gray-800 / gray-700 in dark. Content areas are gray-50 in light and gray-900 in dark.
  - Mock per layout:

    | Layout | Mock |
    |---|---|
    | empty | Plain content rectangle. |
    | classic | Left column (about 28% width) with a stack of 4 thin lines; top bar with 3 dots at the right. |
    | classy | Left column with a small circle (avatar) and a stack of lines below it; small dots at the top left; top bar with one dot at the right. |
    | compact | Narrow left column with 4 stacked squares; top bar with 3 dots. |
    | dense | Very narrow left column with 4 small squares; top bar with 3 dots. |
    | futuristic | Left column with 3 lines at the top and 1 line at the bottom; top bar with 3 dots. |
    | thin | Hair-thin left column with 6 tiny dots; top bar with 3 dots. |
    | centered | Inset rounded inner card; its top row has a dot and 3 short bars at the left and 2 dots at the right. |
    | enterprise | Top bar with a dot at the left and 3 dots at the right; a second row of 4 short bars; an inset content box. |
    | material | Top band; an inset card whose top row has a dot at the left and 3 dots at the right, plus a row of short bars. |
    | modern | Top bar with a dot, 3 short bars and 2 dots; content below. |

    Refer to `ref/settings-open-bottom.png` for the visual.
- **Click**
  1. Remove the `layout` query parameter from the current URL with `router.navigate([], { queryParams: { layout: null }, queryParamsHandling: 'merge' })`.
  2. Call `UiConfigService.set({ layout })`.

### Dark mode

The drawer body is gray-800 and the header stays primary. Pills use `bg-hover`. Thumbnail mocks switch to the dark greys. See `ref/settings-open-dark.png`, where the legacy borders were light, and open question Q1 in `layouts.md`.

### i18n

| Key | English |
|---|---|
| `settings.open` | Settings |
| `settings.title` | Settings |
| `settings.close` | Close settings |
| `settings.theme` | Theme |
| `settings.scheme` | Scheme |
| `settings.layout` | Layout |
| `settings.themes.default` | Default |
| `settings.themes.brand` | Brand |
| `settings.themes.teal` | Teal |
| `settings.themes.rose` | Rose |
| `settings.themes.purple` | Purple |
| `settings.themes.amber` | Amber |
| `settings.schemes.auto` | Auto |
| `settings.schemes.dark` | Dark |
| `settings.schemes.light` | Light |
| `settings.schemes.autoTooltip` | (text in §6.2) |
| `settings.layouts.<name>` | One per layout: Empty, Classic, Classy, Compact, Dense, Futuristic, Thin, Centered, Enterprise, Material, Modern |

---

## 7. Removed widgets

Do not implement any of these, and do not keep their services, resolvers or endpoints:
- **Quick chat.** The right-hand 64 px contact bar with its chat panel, and its header toggle.
- **Messages.** The envelope icon with its badge and popover.
- **Shortcuts.** The squares icon and its popover/editor.

The admin route resolver no longer loads messages, quick-chat or shortcuts data.

---

## 8. Open questions

- **W1. Search backend.** Should the app ship the client-side navigation search fallback (§3) by default, or require a backend `POST /search`?
- **W2. User status and avatar.** The nest-schematics admin user has neither `status` nor `avatar`. Options:
  - (a) Hide the status section and the dot until the backend supports them.
  - (b) Keep status client-side only, in `localStorage`.
  - (c) Add `PATCH /auth/me` to the backend.

  This spec defaults to (a), behind a `features.userStatus` flag.
- **W3.** Should the settings cog appear on auth pages (empty layout), as it does in the legacy app, or only in authenticated layouts?
- **W4. Profile/Settings menu items.** No routes exist for them. Keep them as placeholders that only close the menu, or hide them until routes exist?
- **W5. Notifications backend.** If `admin/me/notifications` is not available, should the bell be hidden, for example on a 404 or behind a feature flag?
