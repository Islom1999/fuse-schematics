# Reja: starter'dagi Fuse kodini o'zimizniki bilan almashtirish

**Maqsad:** `src/fuse-starter/files` dagi Fuse'dan olingan kodni to'liq o'zimiz yozgan kod bilan almashtirish. Shundan keyin paketni yana ommaviy `fuse-schematics` (MIT) sifatida chiqarish mumkin bo'ladi.

**Hozirgi holat:**
- 25 ta ishlatilmagan Fuse fayli o'chirilgan.
- `card`, `scroll-reset` va `find-by-key` o'zimiz yozib `app/shared` ga qo'shilgan.
- Qolgan Fuse kodi taxminan **10 500 qator** `@fuse` ichida, **~6 000 qator** layout, widget va auth sahifalarida, **~4 500 qator** mock-api'da (asosan demo ma'lumot).

---

## 0. Qabul qilingan qarorlar

| # | Savol | Qaror |
|---|---|---|
| Q1 | Layout'lar | **11 tasi ham qoladi** (empty, classic, classy, compact, dense, futuristic, thin, centered, enterprise, material, modern) |
| Q2 | Header widget'lari | languages, fullscreen, search, notifications, user va sozlamalar paneli qoladi. **quick-chat, messages, shortcuts olib tashlanadi** |
| Q3 | Mock API | **O'chiriladi.** Haqiqiy backend (`environment.apiUrl`) va kichik, yoqib-o'chiriladigan dev-mock (login, user, navigation) |
| Q4 | Auth sahifalari | sign-in, sign-out, forgot-password, reset-password qoladi. sign-up, unlock-session, confirmation-required olib tashlanadi |
| Q5 | Dizayn | **Imkon qadar hozirgidek qoladi.** Subagentlar `ref/` dagi 26 ta skrinshot va o'lchangan qiymatlar bo'yicha ishlaydi. Fuse logotipi, demo rasmlar va reklama matnlari neytral matn va rasmlar bilan almashtiriladi |
| Q6 | Commit | `a13afb3` commit qilingan, ish `refactor/own-ui` branch'ida |

## 1. Ish qoidalari (barcha subagentlar uchun)

1. **"Toza xona" (clean-room) usuli.** Subagentlar `src/@fuse/**` va almashtirilayotgan eski Fuse fayllarini **ochmaydi va o'qimaydi**. Ular faqat 0-bosqichda men yozgan funksional spetsifikatsiya (`SPEC.md`) va kontraktlar (TypeScript interfeyslari) bo'yicha yozadi. Bu kod haqiqatan yangi yozilganini kafolatlaydi.
2. **Yangi kod joyi:** `src/@ui/` (komponentlar, servislar, stillar). `@fuse` papkasi oxirida butunlay o'chiriladi.
3. **Prefiks:** selectorlar `ui-` (masalan `ui-icon`, `ui-vertical-navigation`), klasslar `Ui...` (masalan `UiConfigService`).
4. **Uslub:** standalone, `OnPush`, signal API (`input`, `output`, `model`, `computed`), zoneless, nuqta-vergulsiz, bitta qo'shtirnoq.
5. **Imkon bo'lsa PrimeNG ishlatiladi:** drawer → `p-drawer`, confirmation → `p-confirmdialog`, dropdown menyu → `p-menu` va `p-tieredmenu`, alert → `p-message`. O'zimiz faqat PrimeNG'da yo'q narsani yozamiz.
6. **Fayl egaligi:** har bir vazifa faqat o'ziga berilgan papkalarga yozadi. Bir faylni ikki agent o'zgartirmaydi.
7. **Har bir vazifa oxirida:** `tsc` toza o'tishi va o'z qismining namunaviy ishlatilishi build bo'lishi kerak.

---

## 2. Bosqichlar

### 0-bosqich: poydevor (men va 4 ta spetsifikatsiya agenti)

Subagentlar shunga tayanadi, shuning uchun buni 1-bosqich bilan parallel qilib bo'lmaydi.

- **Skrinshotlar** (bajarildi): 11 ta layout, auth sahifalari, ochilgan widget'lar, sozlamalar, dark rejim, mobil.
- **Spetsifikatsiya agentlari** eski kodni o'qib, `docs/ui-spec/` ga faqat tavsif yozadi: `navigation.md`, `core.md`, `theming.md`, `layouts.md`, `widgets.md`, `auth.md`. Ular koddan nusxa olmaydi.

- **Bajarildi:** spetsifikatsiyalar `docs/ui-spec/*.md` da, ochiq savollar bo'yicha qarorlar `docs/ui-spec/DECISIONS.md` da.
- **Bajarildi (umumiy poydevor):** `@ui/navigation/navigation.types.ts`, `@ui/navigation/navigation.service.ts`, `@ui/components/icon/ui-icon.component.ts`, `@ui/services/utils/ui-utils.ts`; ESLint'da `src/@ui` uchun `ui` prefiksi.
- `src/@ui/` tuzilmasi va `provideUi()` provider skeleti.
- **Kontraktlar (`src/@ui/types`):**
  - `NavigationItem` turi. Hozirgi `navigation.ts` formati (`id`, `title`, `type`, `icon`, `link`, `children`...) saqlanadi, chunki `crud` generatori aynan shu formatga yozadi.
  - `UiConfig` turi (layout, scheme, theme).
  - Ekran o'lchamlari (breakpoint) nomlari.
- **Tailwind utilita nomlari ro'yxati:** `bg-card`, `text-secondary`, `bg-default` va boshqalar shu nom bilan qoladi. Shunda layout'larni yozayotgan agentlar uslub agentini kutmasdan ishlay oladi.
- **`SPEC.md`:** har bir komponent nima qilishi, uning inputlari, outputlari va holatlari (kodsiz, faqat tavsif).
- Hozirgi o'zgarishlarni commit qilish (Q6).

### 1-bosqich: kutubxona (5 ta parallel subagent)

| Vazifa | Nima yoziladi | Papka | Taxminiy hajm |
|---|---|---|---|
| **A1. Vertikal navigatsiya** | yon menyu: `side`/`over` rejimlari, yig'ish va ochish, mobil holat, item turlari (basic, collapsable, group, divider, spacer, aside), aktiv link, badge, header va footer slotlari | `src/@ui/navigation/vertical` | katta |
| **A2. Gorizontal navigatsiya va `UiNavigationService`** | tepa menyu (basic, branch, divider, spacer), ichki menyular `p-tieredmenu` orqali; komponentlarni nom bo'yicha topish, navigatsiyani flatten qilish | `src/@ui/navigation/horizontal`, `src/@ui/navigation/navigation.service.ts` | o'rta |
| **A3. Kichik komponentlar** | `ui-icon` (assets'dagi SVG sprite'lar, ular MIT litsenziyali), `ui-loading-bar` va `UiLoadingService` bilan HTTP interceptor, `ui-fullscreen`, `ui-alert` (`p-message` ustida, yopiladigan, saqlanadigan holat) | `src/@ui/components/*` | o'rta |
| **A4. Servislar** | `UiConfigService` (signal asosida, localStorage'da saqlanadi), `UiMediaWatcherService` (matchMedia, signallar), `UiPlatformService`, `UiSplashScreenService`, `UiConfirmationService` (PrimeNG ustida), `mustMatch` validator, kerakli animatsiyalar (CSS orqali) | `src/@ui/services/*`, `src/@ui/validators`, `src/@ui/animations` | o'rta |
| **A5. Mavzu va stillar** | Fuse'ning Tailwind plaginlari (palette, theming, utilities, icon-size) o'rniga o'z Tailwind konfiguratsiyasi va CSS o'zgaruvchilari; PrimeNG preset bilan ulash; light/dark rejim; yangi splash-screen | `tailwind.config.js`, `src/@ui/styles`, `src/@ui/tailwind`, `src/styles/*`, `src/assets/styles/splash-screen.css` | o'rta |

### 2-bosqich: ilova qatlami (4 ta parallel subagent, 1-bosqichdan keyin)

| Vazifa | Nima yoziladi | Papka |
|---|---|---|
| **B1a. Vertikal layout'lar** | classic, classy, compact, dense, futuristic, thin | `src/app/layout/layouts/vertical/**` |
| **B1b. Gorizontal layout'lar va karkas** | centered, enterprise, material, modern, empty; `layout.component`; sozlamalar paneli (`p-drawer` ichida) | `src/app/layout/layouts/horizontal/**`, `src/app/layout/layouts/empty`, `src/app/layout/layout.component.*`, `src/app/layout/common/settings` |
| **B2. Header widget'lari** | Q2 bo'yicha tanlangan widget'lar PrimeNG `p-popover` va `p-menu` asosida | `src/app/layout/common/*` (settings'dan tashqari) |
| **B3. Auth** | `core/auth` (servis, guard'lar, interceptor, haqiqiy API), `core/user`, Q4 bo'yicha sahifalar PrimeNG formalari bilan, kichik dev-mock | `src/app/core/auth`, `src/app/core/user`, `src/app/modules/auth/**`, `src/app/mock-api` |

### 3-bosqich: yig'ish va tekshirish (men, ketma-ket)

1. Worktree branch'larini birlashtirish.
2. `app.config.ts`, `app.routes.ts`, `core/navigation/navigation.ts`, `index.html` ni yangi `@ui` ga ulash. Bular umumiy fayllar, ularni faqat men o'zgartiraman.
3. `src/@fuse` va keraksiz eski fayllarni o'chirish, `package.json` dan keraksiz paketlarni (`perfect-scrollbar`, `chroma-js`, `lodash` va boshqalar) olib tashlash.
4. Generatorni yangilash: `src/utils/registration.ts` (navigation importi va turi), testlar va README.
5. To'liq tekshiruv:
   - `npm test`, yangi loyiha yaratish, ikkita CRUD qo'shish, `ng build`, `ng lint`;
   - brauzerda har bir layout, light/dark rejim, mobil ko'rinish va login sahifasini skrinshot bilan ko'rish.
6. **Fuse bilan qayta solishtirish:** o'xshashlik o'lchovini qayta ishga tushirish. Maqsad: biron fayl 40% dan yuqori chiqmasligi. Yuqori chiqqanlari qayta yoziladi.
7. Litsenziya: LICENSE'ni yana MIT'ga qaytarish, Fuse eslatmasini olib tashlash, paket nomini `fuse-schematics` ga qaytarish. Bu faqat 6-band toza o'tsa va siz rozi bo'lsangiz qilinadi.

---

## 3. Xavflar va eslatmalar

- **Ko'rinish o'zgaradi.** Bu Fuse'ning nusxasi emas, yangi dizayn bo'ladi. Funksiyalar (menyu, mavzular, dark mode, responsiv) saqlanadi.
- **Generatsiya qilinadigan CRUD kodi** (`fuse-feature`) `@fuse` ga bog'liq emas, u o'zgarmaydi. Faqat `navigation.ts` dagi tur importi yangilanadi.
- **Nom.** Fuse kodi to'liq chiqib ketgach, paket nomidagi "fuse" so'zi chalg'itishi mumkin, chunki bu Fuse muallifining mahsulot nomi. Keyinchalik nomni o'zgartirishni o'ylab ko'rish mumkin, lekin bu shart emas.
- **Hajm.** Bu jami 4 ta spetsifikatsiya agenti, 9 ta yozuvchi subagent va mening ikki bosqichim. Har bir subagent alohida worktree'da ishlaydi, natijalarni men birlashtiraman va tekshiraman.
