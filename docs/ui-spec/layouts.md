# UI spec: Layouts

Status: clean-room functional spec. It describes behaviour, metrics and colours only. Implement from this document; do not consult the legacy `@fuse` sources.

Target stack: Angular 20 (standalone, `ChangeDetectionStrategy.OnPush`, zoneless, signal inputs/outputs/queries), PrimeNG 20, Tailwind 3. Prefixes: `ui-` for reusable library pieces under `src/@ui/`, `app-` for app-shell pieces in the starter.

Related specs:
- `navigation.md`: `ui-vertical-navigation`, `ui-horizontal-navigation`, `UiNavigationService`.
- `core.md`: `UiConfigService`, `UiMediaWatcherService`, `ui-loading-bar`, `ui-fullscreen`, `ui-icon`.
- `theming.md`: tokens and themes.
- `widgets.md`: header widgets and the settings panel.
- `auth.md`: auth.

## Reference screenshots

All screenshots are 1440×900 unless noted. Folder: `/private/tmp/claude-501/-Users-macbookm3pro--claude-spares-spare-ga0vel/e6e173af-1f6a-4c59-8de9-f74b6683b26a/scratchpad/ref/` (shortened below to `ref/`).

| Screenshot | What it shows |
|---|---|
| `ref/layout-<name>.png` | One per layout: empty, classic, classy, compact, dense, futuristic, thin, centered, enterprise, material, modern. Light scheme. |
| `ref/dark-classic.png`, `ref/dark-classy.png`, `ref/dark-modern.png` | Dark scheme. |
| `ref/mobile-classic.png`, `ref/mobile-classic-nav-open.png`, `ref/mobile-classy.png`, `ref/mobile-enterprise.png`, `ref/mobile-modern.png` | 390 px wide. |

The reference screenshots still contain things this spec removes:
- the quick-chat bar (the 64 px column on the far right);
- the shortcuts and messages header buttons;
- the "FUSE" logo and "Fuse ©" footer text.

Ignore those parts when comparing.

---

## 1. Global facts used by every layout

### 1.1 Breakpoints

These are the Tailwind screens.

| Name | Min width |
|---|---|
| `sm` | 600 px |
| `md` | 960 px |
| `lg` | 1280 px |
| `xl` | 1440 px |

A screen is **small** when `md` does NOT match, i.e. the viewport is below 960 px. Each layout reads this from `UiMediaWatcherService` (see `core.md`) as a signal, e.g. `isScreenSmall = computed(() => !media.matches('md'))`.

### 1.2 Colour tokens

`theming.md` is authoritative for tokens. Summary:

| Token | Light | Dark |
|---|---|---|
| page background (`bg-default`) | gray-100 `#f1f5f9` | gray-900 `#0f172a` |
| card / bar background (`bg-card`) | white | gray-800 `#1e293b` |
| default text | `#1e293b` | white |
| secondary text (`text-secondary`) | `#64748b` | `#94a3b8` |
| border (`border` token) | gray-200 `#e2e8f0` | white at about 12% opacity (`rgba(241,245,249,0.12)`), see open question Q1 |
| primary (default theme) | indigo-600 `#4f46e5` | same |

"gray" is the Tailwind `slate` palette. Font: "Inter var", base 14 px / 21 px.

### 1.3 Brand placeholders (replaces Fuse branding)

| Asset | Path | Notes |
|---|---|---|
| Icon logo | `assets/images/logo/logo.svg` | Square placeholder mark. |
| Text logo, light background | `assets/images/logo/logo-text.svg` | Placeholder mark plus the word "Admin" in dark text. Aspect ratio about 3:1. |
| Text logo, dark background | `assets/images/logo/logo-text-on-dark.svg` | Same as above, with light text. |

- `alt` text: "Logo" (i18n `layout.logoAlt`).
- Footer copyright: "Admin © {year}", where year is the current year (i18n `layout.footer.copyright` with param `year`).

### 1.4 Shared building blocks

The layouts are composed from the blocks below. The implementer may extract them as small internal components, e.g. `app-layout-header-actions`. Per-layout differences are listed in section 3.

**A. Vertical-layout header ("top bar")**
- Height 64 px (`h-16`). Horizontal padding 16 px, 24 px from `md` (`px-4 md:px-6`).
- Full width of the content column. Sits above content: z-index 49, `relative`. Flex row, items centred.
- Light: `bg-card` with a normal shadow (`shadow`).
- Dark: no shadow, transparent background, 1 px bottom border (border token).
- Left: **hamburger** button.
  - 40×40, round, text/plain style (no background until hover).
  - Icon `bars-3` (heroicons outline), 24 px, primary-coloured.
  - Toggles the main vertical navigation (see `navigation.md`, nav name `mainNavigation`).
- Right: the **actions group**.
  - `ml-auto`, `pl-2`, flex, items centred.
  - Gap between items: 2 px below `sm`, 8 px from `sm` (`space-x-0.5 sm:space-x-2`). Measured: the 40 px buttons sit 48 px apart on desktop.
  - All icon buttons are 40×40 round text buttons with 24 px primary-coloured icons.

**B. Actions group, standard order** (left to right). Each layout lists which items it shows.
1. `app-languages`
2. `ui-fullscreen` (hidden below `md`: `hidden md:block`)
3. `app-search` with `appearance="bar"`
4. `app-notifications`
5. `app-user` (avatar, `showAvatar` = true)

REMOVED (do not implement): shortcuts, messages, and the quick-chat toggle button.

**C. Vertical-layout footer**
- Height 56 px (`h-14`). Padding 16 px, 24 px from `md`. Full width. Flex row, items centred.
- 1 px top border. `bg-card`; transparent in dark. z-index 49, relative. Never shrinks (`flex-0`).
- Text: copyright string, 14 px, weight 500, `text-secondary`.
- Print: hidden (`print:hidden`). The header is hidden in print too.

**D. Content area**
- Flex column, `flex-auto`, full width.
- Holds the router outlet. The routed page decides its own padding and scrolling.
- The layouts emit no extra wrapper margins unless stated.

**E. Loading bar**
- `ui-loading-bar` is the first child of every layout, including empty. Fixed at the top of the viewport (see `core.md`).

**F. Main vertical navigation instance**

| Property | Value |
|---|---|
| name | `mainNavigation` |
| mode | `over` when small, otherwise `side` |
| opened | `false` when small, otherwise `true` |
| navigation | `navigation().default`, unless the layout says otherwise |
| print | hidden |

The scheme-forcing wrapper class `dark` lives on the navigation element, so that its contents use dark tokens even in light mode.

**G. Horizontal-layout "small-screen" fallback**
When the screen is small, horizontal layouts:
- do not render the horizontal nav;
- render a hamburger button in its place;
- render an `over`-mode vertical navigation (dark, gray-900, `opened` false) with a text logo in its content header (logo area 80 px tall, padding-top 24 px, horizontal padding 32 px, logo width 120 px).

### 1.5 Data the layouts consume

- `UiNavigationService` / app `NavigationService` provide a `navigation` signal of shape `{ default, compact, futuristic, horizontal }`. Each is an array of nav items (`navigation.md`). Fetched by the admin route resolver (see `auth.md` §9).
- `UserService.user` signal (`auth.md`) is used by classy and futuristic for the user block.
- `UiMediaWatcherService` provides `isScreenSmall`.
- A full-screen toggle is provided by `ui-fullscreen` (`core.md`).

---

## 2. `app-layout` (layout host)

Selector `app-layout`. Standalone, OnPush. Used as the `component` of every top-level route group (see `auth.md` §9). It owns scheme, theme and layout resolution and renders exactly one layout component plus the settings panel.

### 2.1 Host

- The host element is `display:flex; flex: 1 1 auto; width: 100%`.
- Contents: the chosen layout component, then `<app-settings>` (see `widgets.md` §6).

### 2.2 Scheme resolution

Inputs:
- `UiConfigService.config().scheme`: `'auto' | 'light' | 'dark'`.
- A signal tracking the OS media query `(prefers-color-scheme: dark)`. Keep it live: listen to `change`.

Resolved scheme:
- `scheme === 'auto'`: `'dark'` if the OS query matches, otherwise `'light'`.
- otherwise: the configured value.

Apply it in an `effect`:
1. Remove both `light` and `dark` classes from `document.body`, then add the resolved one.
2. Also toggle the `dark` class on `document.documentElement`. PrimeNG's preset uses `darkModeSelector: 'html.dark'`, see `theming.md`.

This must react to OS changes while in auto mode.

### 2.3 Theme application

`UiConfigService.config().theme` is one of:
- `theme-default`
- `theme-brand`
- `theme-teal`
- `theme-rose`
- `theme-purple`
- `theme-amber`

In an `effect`, remove every `theme-*` class from `document.body`, then add the current one.

### 2.4 Misc body decoration

- On init, add a class naming the client OS to `body`: `os-mac`, `os-windows`, `os-linux`, `os-ios`, `os-android` or `os-unknown`, detected from the user agent. Optional, cosmetic.
- Set the attribute `ui-version="<library version>"` on `<html>`. Optional.

### 2.5 Layout resolution

The effective layout is a signal named, for example, `layout`. Recompute it whenever the config changes and after every router `NavigationEnd`:
1. Start from `config().layout`. The default is `'classy'`, see §2.6.
2. Find the deepest activated route (follow `firstChild`). If its query params contain `layout`, use that value AND write it into the config (`UiConfigService.set({ layout })`), so the settings panel reflects it.
3. Walk `pathFromRoot` from root to leaf. For every route whose `routeConfig.data.layout` is defined, override the value. The deepest one wins.
   - This is how the auth pages force `'empty'`.
   - This override is NOT written into the config, so returning to an admin page restores the user's layout.

Unknown layout names fall back to `'empty'`.

### 2.6 Defaults and persistence

Config defaults:

| Key | Default |
|---|---|
| `layout` | `'classy'` |
| `scheme` | `'light'` |
| `theme` | `'theme-default'` |

- The new `UiConfigService` persists the config to `localStorage` (key e.g. `ui.config`). The legacy app did not persist; persistence is a deliberate improvement.
- A `?layout=` query param still wins on load.

### 2.7 Rendering

Use a `@switch` on the resolved layout. The cases are, in this order: `empty`, `classic`, `classy`, `compact`, `dense`, `futuristic`, `thin`, `centered`, `enterprise`, `material`, `modern`.

Each case renders `<app-<name>-layout>`. Every layout component contains its own `<router-outlet>`. Components are lazy or plain imports, the implementer's choice.

### 2.8 Removed

`app-layout` no longer renders a quick-chat bar. Nothing reserves a 64 px right-hand column.

---

## 3. Layout catalogue

Notation:
- `[VNAV]` is the main vertical navigation (§1.4 F).
- `[HDR]` is header A.
- `[ACT]` is actions group B.
- `[FTR]` is footer C.
- `[CNT]` is content D.

All layouts start with `ui-loading-bar`. Layout component names are `app-<name>-layout`. All are standalone and OnPush, with no inputs.

### 3.1 empty

```
+--------------------------------------------------+
| loading bar                                      |
| [CNT] full width & height, no chrome             |
+--------------------------------------------------+
```

- The wrapper is a flex column, `flex-auto`, full width. Only the router outlet.
- No navigation, header or footer.
- Used by auth pages and the landing page via route `data.layout = 'empty'`.

### 3.2 classic

Screenshot: `ref/layout-classic.png` (dark: `ref/dark-classic.png`, mobile: `ref/mobile-classic.png`, `ref/mobile-classic-nav-open.png`).

```
+------------+-------------------------------------+
| [VNAV]     | [HDR] ☰                 [ACT] ...   |  64px
| 280px      +-------------------------------------+
| logo-text  |                                     |
| items      | [CNT]                               |
|            |                                     |
|            +-------------------------------------+
|            | [FTR] Admin © 2026                  |  56px
+------------+-------------------------------------+
```

- Nav:
  - Classes `dark bg-gray-900` (`#0f172a`), width 280 px, appearance `default`.
  - Content header: text logo (on-dark variant), a block 80 px tall with 24 px padding on the top/left/right and 0 at the bottom. The logo is 120 px wide (measured 120×40 at x 24, y 32).
- Nav items: see `navigation.md`. Default appearance:
  - 256 px wide inside a 12 px gutter, 44 px tall, padding 10 px 16 px, radius 6 px.
  - Title 13 px / weight 500. Active item background is white at 12%.
- Right column: flex column, `flex-auto`, `min-w-0`, full width. Contains [HDR], [CNT] and [FTR].
- [ACT]: languages, fullscreen, search (bar), notifications, user.
- Small screen: the nav becomes `over` (slides in over a backdrop) and starts closed. The hamburger opens it.

### 3.3 classy (default layout)

Screenshot: `ref/layout-classy.png`, `ref/dark-classy.png`, `ref/mobile-classy.png`.

```
+------------------+-------------------------------+
| [VNAV] 280px     | [HDR] ☰           [ACT] ...   |
| logo   (🔔)(👤)  +-------------------------------+
|                  |                               |
|     ( avatar )   | [CNT]                         |
|     Name         |                               |
|     email        |                               |
| items...         |                               |
|                  |                               |
|   (faint logo)   |   (no footer)                 |
+------------------+-------------------------------+
```

- Nav: `dark bg-gray-900`, 280 px, `navigation().default`.
- Nav content header, top to bottom:
  1. **Top row**
     - Flex, items centred, padding 16 px with 24 px on the left; measured height 72 px.
     - Left: icon logo, 32 px wide.
     - Right (`ml-auto`, items centred): `app-notifications`, then `app-user` with `showAvatar=false`, so the trigger shows a user-circle icon, not the photo.
  2. **User block**
     - Flex column, items centred, 16 px padding.
     - Avatar: 96 px round image of `user().avatar`. If there is no avatar, show the `user-circle` icon at 96 px in `text-secondary`.
     - Name: centred, `mt-6` (24 px), full width. Single line, truncated with an ellipsis, weight 500. Default text colour on dark (white).
     - Email: centred, `mt-0.5`, full width, truncated. 14 px (`text-md`), weight 500, `text-secondary`.
- Nav content footer:
  - The on-dark text logo, centred, 64 px tall block (`h-16`), max width 144 px. Margins 8 px on top and 16 px on the bottom.
  - Opacity 12% (a faint watermark).
- Nav items: 256×44, padding 10 px 16 px, radius 6 px, 13 px / 500. Active background white at 12%. The first item starts at y ≈ 267 on desktop.
- [HDR]: hamburger, then [ACT] with languages, fullscreen and search only. Notifications and user live in the nav. Shortcuts, messages and the quick-chat button were removed.
- **No footer.**
- Small screen: the nav is `over` and closed. Notifications and user are reachable only by opening the nav with the hamburger. Keep this behaviour; see open question Q2.

### 3.4 compact

Screenshot: `ref/layout-compact.png`.

```
+------+-------------------------------------------+
|[VNAV]| [HDR] ☰                     [ACT] ...     |
|112px +-------------------------------------------+
| logo | [CNT]                                     |
| [ic] |                                           |
| text |                                           |
| [ic] +-------------------------------------------+
| text | [FTR]                                     |
+------+-------------------------------------------+
```

- Nav: `dark bg-gray-900`, appearance `compact`, width 112 px, `navigation().compact`.
- Content header: icon logo 40 px wide, centred horizontally. The block is 80 px tall with margins 12 px on top and 16 px on the bottom.
- Items: 96×72, padding 12 px. The icon is stacked above the title, both centred, and the title is small. See `navigation.md`, compact appearance.
- [HDR], [ACT] and [FTR] as in classic.

### 3.5 dense

Screenshot: `ref/layout-dense.png`.

```
+----+---------------------------------------------+
|VNAV| [HDR] ☰ ⇄                    [ACT] ...      |
|80px+---------------------------------------------+
|logo| [CNT]                                       |
| ic |                                             |
| ic +---------------------------------------------+
|    | [FTR]                                       |
+----+---------------------------------------------+
```

- Nav: `dark bg-gray-900`, width 80 px when dense, `navigation().default`.
- Appearance is a local signal: `'dense'` on desktop, `'default'` on small screens. It resets on each change of `isScreenSmall`.
- Content header: icon logo 32 px, centred, block 80 px tall.
- Items in dense mode: 56×44, icon only. The dense appearance expands on hover per `navigation.md`.
- [HDR] left group:
  - Flex, items centred, `pr-2`, gap 8 px.
  - Hamburger, then an **appearance toggle**: a 40×40 round text button with the `arrows-right-left` icon, 24 px, primary. Hidden below `md`.
  - The toggle switches the nav appearance between `dense` and `default`.
- [ACT] and [FTR] as in classic.

### 3.6 futuristic

Screenshot: `ref/layout-futuristic.png`.

```
+--------------+-----------------------------------+
| [VNAV] 280px | [HDR] ☰               [ACT] ...   |
| indigo-800   +-----------------------------------+
| logo-text    | [CNT]                             |
| items        |                                   |
|              |                                   |
|--------------|                                   |
| (👤) Name    +-----------------------------------+
|      email   | [FTR]                             |
+--------------+-----------------------------------+
```

- Nav:
  - Classes `dark bg-indigo-800` (`#3730a3`), text white, 280 px, `navigation().futuristic`.
  - Futuristic items have a full-width highlight; see `navigation.md`.
- Content header: on-dark text logo, 120 px wide, block 80 px tall, padding 24 px on the top/left/right.
- Content footer:
  - Flex row, items centred, full width. Padding 32 px vertical and 24 px horizontal (`px-6 py-8`). 1 px top border (border token).
  - Contains `app-user` (avatar trigger), then a text column with `ml-4`, `overflow-hidden`:
    - Name: truncated, line-height normal, 80% opacity.
    - Email: truncated, line-height normal, 14 px, `mt-0.5`, 50% opacity.
  - Both values come from `user()`. The legacy app hard-coded the email; do not do that.
- [HDR]: the hamburger has `mr-2`. [ACT] is languages, fullscreen, search and notifications; there is **no user** in the header because it lives in the nav footer.
- [FTR]: yes.

### 3.7 thin

Screenshot: `ref/layout-thin.png`.

```
+----+---------------------------------------------+
|VNAV| [HDR] ☰                      [ACT] ...      |
|80px+---------------------------------------------+
|logo| [CNT]                                       |
|[ic]|                                             |
|[ic]+---------------------------------------------+
|    | [FTR]                                       |
+----+---------------------------------------------+
```

- Nav:
  - `bg-card` in light (white) and gray-900 in dark. It is NOT a dark-scoped nav.
  - Appearance `thin`, width 80 px, `navigation().compact`.
  - Light mode has a 1 px gray-200 inset right border.
- Content header: icon logo 32 px, centred, block 80 px tall.
- Items:
  - 48×48, padding 12 px, radius 4 px, icon only.
  - Active background: `rgba(30,41,59,0.05)` in light; white at 12% in dark.
  - Icon colour: default text. The tooltip shows the title; see `navigation.md`.
- [HDR]: the hamburger has `mr-2`. [ACT] and [FTR] as in classic.

### 3.8 centered

Screenshot: `ref/layout-centered.png`.

```
viewport bg gray-200 (dark: bg-card)
  +------------------------------------------------+
  | logo  Example  Products ...       [ACT] ...    |  80px (64 <sm)
  +------------------------------------------------+
  |                                                |
  | [CNT] bg-default                               |
  |                                                |
  +------------------------------------------------+
  | [FTR] Admin © 2026                             |  80px (64 <sm)
  +------------------------------------------------+
  wrapper: max-w 1440, rounded-xl (sm+), shadow-2xl
```

- Outer:
  - Flex, `flex-auto`, full width, items-start, justify-centre.
  - Background gray-200 (`#e2e8f0`); dark: `bg-card` (gray-800).
  - Padding 0 below `sm`, 16 px from `sm`, 32 px from `md`. `print:p-0`.
- Wrapper:
  - Flex column, `flex-auto`, full width, max width 1440 px (`max-w-360`), overflow hidden.
  - From `sm`: radius 12 px (`rounded-xl`) and `shadow-2xl`. No shadow in dark.
  - Measured at 1440×900: x 32, y 32, 1376×836.
- Header:
  - Flex row, items centred, full width. Height 64 px, 80 px from `sm`. Horizontal padding 16 px, 24 px from `sm`.
  - `bg-card` (dark: `bg-default`), 1 px bottom border. `print:hidden`.
  - When not small:
    - Logo, `mx-2`, `lg:mr-8`. The text logo (96×32, `w-24`) shows from `lg`. Below `lg`, the icon logo at 32 px shows instead.
    - Horizontal navigation (`ui-horizontal-navigation`, name `mainNavigation`, `navigation().horizontal`), `mr-2`.
  - When small: the §1.4 G fallback (hamburger plus an over vertical nav).
  - [ACT] with `ml-auto`, `pl-2`. The gap is 4 px below `sm` and 8 px from `sm`. Items: languages, fullscreen, search, notifications, user.
- Content: flex column, `flex-auto`, full width, `bg-default`.
- Footer:
  - Height 64 px, 80 px from `sm`. Horizontal padding 24 px, 32 px from `sm`.
  - `bg-card` (dark: `bg-default`), 1 px top border, copyright text. `print:hidden`.
- Horizontal nav items: 48 px tall, padding 0 16 px, 13 px / 500. The active item uses primary text colour. See `navigation.md`.

### 3.9 enterprise

Screenshot: `ref/layout-enterprise.png`, `ref/mobile-enterprise.png`.

```
+--------------------------------------------------+
| (gray-800 bar, dark scope)                       |
|   logo-on-dark                       [ACT] ...   |  80px (64 <sm)
+--------------------------------------------------+
|   Example  Products  ...  (horizontal nav)       |  64px, bg-card
+--------------------------------------------------+   ^ md+: total 144px
|  bg gray-200                                     |
|   +------------------------------------------+   |
|   | [CNT] bg-default, rounded-lg, shadow-lg  |   |
|   +------------------------------------------+   |
+--------------------------------------------------+
| [FTR] Admin © 2026  (max-w 1440 inner)           |  80px (56 <sm)
+--------------------------------------------------+
```

- Outer:
  - Flex column, `flex-auto`, full width, min-width 0.
  - Background gray-200; dark `bg-card`.
- Header:
  - Flex column, full width, `shadow`, `print:hidden`, z-index 49, relative. Overall height grows from 64 to 80 px at `sm` and to 144 px at `md`.
  - **Top bar**
    - Has the `dark` class, so its contents use dark tokens.
    - Background gray-800 (`#1e293b`); dark gray-900.
    - Horizontal padding 16 px, 32 px from `md`.
    - Inner row: max width 1440 px, centred, full width. Height 64 px, 80 px from `sm`. Flex, items centred.
    - Not small: the on-dark text logo, 96 px wide.
    - Small: hamburger plus the §1.4 G fallback nav.
    - [ACT] with `ml-auto`, `pl-2`. Items: languages, fullscreen, search, notifications, user.
  - **Bottom bar**
    - Not-small only.
    - `bg-card`; dark gray-700 (`#334155`).
    - Horizontal padding 32 px. Inner max width 1440 px, height 64 px. Horizontal nav (`navigation().horizontal`) with a -16 px horizontal margin so the first item's text aligns with the logo.
- Content:
  - Outer: flex, `flex-auto`, justify-centre, full width. Padding 24 px from `sm`, 32 px from `md`.
  - Inner: flex column, `flex-auto`, full width, max width 1440 px. `bg-default`. From `sm`: `shadow-lg`, radius 8 px, overflow hidden.
- Footer:
  - Full-width band: `bg-card`, 1 px top border, horizontal padding 16 px, 32 px from `md`, `print:hidden`.
  - Inner: max width 1440 px, centred. Height 56 px, 80 px from `sm`. Horizontal padding 24 px, 32 px from `md`. Copyright text.

### 3.10 material

Screenshot: `ref/layout-material.png`.

```
+--------------------------------------------------+
| primary-700 band (≈205px tall incl. card top)    |
|   +------------------------------------------+   |
|   | logo                         [ACT] ...   |   | 64px
|   | Example  Products ...  (horizontal nav)  |   | 64px
|   +------------------------------------------+   |
+---|------------------------------------------|---+
    | [CNT] bg-default, shadow-xl              |   bg gray-200
    +------------------------------------------+
    | [FTR] Admin © 2026                       |
    +------------------------------------------+
```

- Outer: flex column, `flex-auto`, full width, min-width 0. Background gray-200; dark `bg-card`.
- Header band:
  - Full width, background primary-700 (indigo-700 `#4338ca` for the default theme). It follows the theme.
  - Horizontal padding 0, 32 px from `sm`. Measured band height ≈ 205 px at 1440 wide.
- Header card (inside the band):
  - Max width 1440 px, centred, full width. `bg-card`, 1 px bottom border.
  - From `sm`: margin 32 px on the left/right/top and 0 on the bottom, padding 12 px vertical, top radius 12 px, `shadow-2xl`.
  - From `md`: margin-top 48 px, padding-top 16 px, padding-bottom 12 px.
  - **Top row**
    - Height 64 px, padding 16 px, 24 px from `md`. Flex, items centred.
    - Not small: text logo 96 px wide. Use the light variant in light scheme and the on-dark variant in dark scheme.
    - Small: hamburger plus the §1.4 G fallback.
    - [ACT] with `ml-auto`. Items: languages, fullscreen, search, notifications, user. The gap is 4 px below `sm` and 8 px from `sm`.
  - **Bottom row**
    - Not-small only. Height 64 px, padding 16 px. Horizontal nav.
- Content:
  - Outer padding 0, 32 px horizontal from `sm`.
  - Inner: max width 1440 px, centred, full width. `bg-default`, `sm:shadow-xl`, flex column, `flex-auto`.
- Footer:
  - Max width 1440 px, centred. Height 56 px, 80 px from `sm`. Padding 24 px, 32 px from `md`.
  - `sm:shadow-xl`, 1 px top border, `bg-card` (dark `bg-default`).
  - It sits inside the same horizontal padding as the content.

### 3.11 modern

Screenshot: `ref/layout-modern.png`, `ref/dark-modern.png`, `ref/mobile-modern.png`.

```
+--------------------------------------------------+
| logo  Example  Products ...          [ACT] ...   |  80px (64 <sm)
+--------------------------------------------------+
| [CNT]                                            |
|                                                  |
+--------------------------------------------------+
| [FTR] Admin © 2026                               |  80px (56 <sm)
+--------------------------------------------------+
```

- Outer: flex column, `flex-auto`, full width, min-width 0.
- Header:
  - Height 64 px, 80 px from `sm`. Horizontal padding 16 px, 24 px from `md`. Flex, items centred, full width.
  - Light: `shadow`, `bg-card`. Dark: transparent background with a 1 px bottom border.
  - z-index 49, relative, `print:hidden`.
  - Not small: logo with `mx-2` and `lg:mr-8` (text logo 96 px from `lg`, icon logo 32 px below `lg`), then the horizontal nav (`mr-2`).
  - Small: §1.4 G fallback.
  - [ACT] as classic.
- Content: [CNT].
- Footer:
  - Height 56 px, 80 px from `sm`. Padding 16 px, 24 px from `md`.
  - 1 px top border, `bg-card` (dark transparent), z-index 49, copyright.

---

## 4. Responsive summary

| Layout | < 600 (mobile) | 600–959 (small) | ≥ 960 |
|---|---|---|---|
| classic / compact / dense / futuristic / thin | Nav in `over` mode, closed; hamburger opens it. Header gap 2 px. Fullscreen hidden. | Same as mobile, gap 8 px. | Nav `side`, open. Hamburger collapses or expands it. Fullscreen visible. |
| classy | As above. Notifications and user only in the nav. | Same. | Nav `side`, open. |
| dense (extra) | Appearance `default`; toggle hidden. | Same. | Appearance `dense`; toggle visible. |
| centered / enterprise / material / modern | No horizontal nav. Hamburger opens the over vertical nav. 64 px header. | 80 px header (enterprise top bar 80 px, no bottom bar). | Horizontal nav visible. Enterprise header 144 px. Text logo from `lg`, icon logo in 960–1279 (centered, modern). |

Mobile measurements (390 px wide, classic):
- Header: 64 px, padding 16 px. Buttons 40 px with 2 px gaps.
- Footer: 56 px.
- Settings cog: still at the right edge, see `widgets.md`.

---

## 5. Removed relative to the legacy shell

- **Quick-chat bar.** It was a fixed 64 px column on the right with contact avatars and a chat drawer. It is gone, together with its header toggle button (classic and others) and the settings-cog offset that made room for it.
- Shortcuts and messages header widgets.
- Fuse logos, "Fuse ©" footer text, and the demo-only renaming of nav items when the language changes.

---

## 6. Accessibility notes

- Every icon-only button has an `aria-label` (i18n):
  - `layout.toggleNavigation`
  - `layout.toggleAppearance`
  - `layout.fullscreen`
  - `search.open`
  - `notifications.open`
  - `user.menu`
  - `languages.menu`
- The header is a `<header>` landmark, nav wrappers are `<nav>`, the content is `<main>`, and the footer is a `<footer>`.

## 7. i18n keys introduced by this spec

| Key | English |
|---|---|
| `layout.logoAlt` | Logo |
| `layout.footer.copyright` | Admin © {{year}} |
| `layout.toggleNavigation` | Toggle navigation |
| `layout.toggleAppearance` | Toggle navigation appearance |
| `layout.fullscreen` | Toggle fullscreen |

Turkish (`tr.json`) must contain the same keys; a translation or the English fallback is acceptable.

## 8. Open questions

- **Q1.** Dark-mode border colour. In the reference app, borders in dark mode compute to gray-200 (`#e2e8f0`), a hard light line visible in `ref/dark-classic.png` and `ref/settings-open-dark.png`. The nav wrapper uses white at 12%. This spec recommends white at about 12% for the border token in dark mode. Confirm, or keep the exact legacy look.
- **Q2.** In classy on small screens, notifications and user are only reachable through the hamburger. Keep this, or add them to the header below `md`?
- **Q3.** Should `?layout=` in the URL keep writing into the persisted config? Now that the config persists, a shared link would permanently change the recipient's layout.
