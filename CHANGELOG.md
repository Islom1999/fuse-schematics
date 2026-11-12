# Changelog

Barcha muhim o'zgarishlar ushbu faylda hujjatlashtiriladi.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) ga asoslangan,
va bu loyiha [Semantic Versioning](https://semver.org/spec/v2.0.0.html) dan foydalanadi.

## [Unreleased]

### O'zgardi

- `fuse-starter`: `src/@fuse` kutubxonasi o'chirildi, o'rniga yangidan yozilgan `src/@ui` (navigatsiya, komponentlar, servislar, Tailwind plaginlari). 11 ta layout, header widget'lari (languages, search, notifications, user, settings) va auth qatlami yangidan yozildi; ko'rinish avvalgidek
- PrimeNG endi tanlangan mavzu (theme) va dark rejimga ergashadi
- Auth: access + refresh token, `authGuard`/`noAuthGuard`, sign-in, sign-out, forgot-password, reset-password sahifalari
- Neytral "A" logotipi, initsiallar bilan avatarlar

### Olib tashlandi

- `mock-api` (o'rniga development uchun kichik dev-mock), quick-chat, messages, shortcuts, landing sahifasi, sign-up/unlock-session/confirmation-required sahifalari
- Ishlatilmagan paketlar: `crypto-js`, `lodash-es`, `lodash`, `luxon`, `perfect-scrollbar`, `chroma-js` (va ularning `@types`)
- Ishlatilmagan rasmlar va ikonka to'plamlari (avatars, material-*, feather)

## [2.0.0] - 2026-11-12

### Qo'shildi

- `fuse-feature --fields "name:string,price:number,active:boolean,note:text?,status:enum(a|b)"` — model interfeyslari, formly maydonlari, grid ustunlari va filtrlar maydonlar ta'rifidan generatsiya qilinadi (parser: `src/utils/fields.ts`)
- `fuse-feature` route'ni `app.routes.ts` ga, menyu bandini `navigation.ts` ga va tarjima kalitlarini `assets/i18n/*.json` ga avtomatik qo'shadi (idempotent; `--skipRoute`, `--skipNav`, `--skipI18n`)
- `fuse-feature --project`; `sourceRoot` endi `angular.json` dan o'qiladi
- `fuse-schematics.json` konfiguratsiya fayli (`fuse-feature.path`, `fuse-feature.prefix`)
- `ng-add` schematic (`ng add @islom1999/fuse-schematics`)
- `fuse-starter --skipInstall` (default: `npm install` ishga tushadi) va `--skipGit` (default: `git init` + boshlang'ich commit)
- Unit testlar (`SchematicTestRunner`) va GitHub Actions CI (unit testlar + loyiha yaratib `ng build` smoke test)
- Inglizcha README bo'limi
- `fuse-openapi` (alias `openapi`) schematic: OpenAPI 3 / Swagger 2 hujjatidagi (JSON/YAML, fayl yoki URL) har bir `admin/<nom>` resursi uchun CRUD modul (`--include`, `--exclude`, `--force`)
- `fuse-feature --openapi <fayl|url> [--schema <Nom>]`: maydonlar OpenAPI sxemasidan olinadi
- Starter shabloni **zoneless**: `provideZonelessChangeDetection()`, `zone.js` olib tashlandi, zone'ga bog'liq joylar `markForCheck`/signallar bilan tuzatildi; karma testlari zoneless TestBed bilan
- Starter shabloni signal API'lariga o'tkazildi (`input()`, `output()`, `viewChild()`/`contentChild()`, `computed`, `linkedSignal`) va yangi control flow (`@if`/`@for`); `<app-grid>`, `<app-table-filter>`, `<form-action-buttons>` binding nomlari o'zgarmadi

### O'zgartirildi

- **Private paket**: nomi `fuse-schematics` → `@islom1999/fuse-schematics`, endi faqat GitHub Packages (`npm.pkg.github.com`) orqali tarqatiladi; o'rnatish uchun `.npmrc` va `read:packages` token kerak (README → O'rnatish)
- Litsenziya MIT'dan proprietary'ga o'zgartirildi; Fuse Admin shabloni uchun uchinchi tomon eslatmasi qo'shildi (har bir foydalanuvchida o'z Fuse litsenziyasi bo'lishi shart)
- CI: `v*` tegi push qilinganda testlar va smoke build'dan keyin GitHub Packages'ga avtomatik publish
- Angular 20 ga o'tkazildi: `peerDependencies` endi `@angular/core ^20.0.0`
- Node.js talabi `>=20.19.0` ga ko'tarildi (Angular 20 talabi)
- `fuse-starter` shabloni Angular 20.3 bog'liqliklari bilan
- Shablon: `@ngneat/transloco` → `@jsverse/transloco` 8, `@primeng/themes` → `@primeuix/themes`
- Shablon: ESLint 9 flat config (`eslint.config.js`, `angular-eslint` 20.7), `.eslintrc.json`/`.eslintignore` olib tashlandi
- Shablon: ishlatilmaydigan `@angular/platform-browser-dynamic`, `apexcharts`, `ng-apexcharts`, `@types/highlight.js` olib tashlandi; takroriy `provideAnimations()` olib tashlandi
- Shablon: barcha lint xatolari tuzatildi (`any` o'rniga aniq turlar, a11y), yaratilgan loyiha `ng lint` dan toza o'tadi
- Formada `templateOptions` o'rniga `props` ishlatiladi
- Yaratilgan loyihaning `package.json` nomi endi loyiha nomiga teng (avval doim `fuse-angular` edi)

### Tuzatildi

- `fuse-starter`: `app.routes.ts` dagi mavjud bo'lmagan `foydalanuvchi-boshqaruvi` moduliga ishora qiluvchi `test` route olib tashlandi (yaratilgan loyiha build bo'lmas edi)
- `fuse-starter`: yaratilgan loyihada `.gitignore` bo'lmas edi (npm nashrda `.gitignore` fayllarini olib tashlaydi). Endi shablon `gitignore` nomi bilan saqlanadi va generatsiyada `.gitignore` ga qayta nomlanadi
- `fuse-feature`: `--skipForm` parametri e'tiborga olinmas edi. Endi form komponenti yaratilmaydi, `routes.ts`, `pages/index.ts` va list komponenti unga ishora qilmaydi (qo'shish tugmasi yashiriladi)
- `fuse-feature`: `--prefix` parametri e'tiborga olinmas edi — list va form komponentlari selectorlari endi `<prefix>-` bilan boshlanadi
- `fuse-starter`: `tailwind.config.js` va `src/@fuse/tailwind/*` plaginlari paketga tushmagan edi (root `.gitignore` dagi `*.js` sabab) — Tailwind utility klasslari generatsiya bo'lmas edi
- `fuse-starter`: `angular.json` da muallifning analytics ID si har bir yaratilgan loyihaga o'tib ketardi — endi `analytics: false`
- `fuse-starter`: `inter.css` va `splash-screen.css` uchun "Unable to locate stylesheet" build ogohlantirishlari
- `fuse-starter`: `StorageService` va `find-by-key` dagi mavjud bo'lmagan importlar (to'liq `tsc` tekshiruvini buzardi)
- `fuse-feature`: yo'lni normallashtirish Node `path` o'rniga `@angular-devkit/core` `normalize` bilan (Windows'dagi teskari slash muammosi)

## [1.0.2] - 2025-11-10

### O'zgartirildi

- `fuse-feature` yangi modulli tuzilishga o'tkazildi
- `common` papka `models` va `services` ga ajratildi
- `pages` papka `list` va `form` ga ajratildi
- `components` papka tayyor shaklda qo'shildi
- Barrel exports (`index.ts`) qo'shildi
- Routes yangi pages/index imports ishlatadi
- `quill` versiyasi 1.3.7 dan 2.0.2 ga yangilandi
- `karma-jasmine-html-reporter` versiyasi 2.0.0 dan 2.1.0 ga yangilandi

### Tuzatildi

- `quill` versiya nomuvofiqligini hal qildi (ngx-quill@28.0.1 uchun)
- `karma-jasmine-html-reporter` versiya nomuvofiqligini tuzatdi

### Yangi tuzilish

```
feature-module/
├── common/
│   ├── index.ts
│   ├── models/
│   │   └── feature.model.ts
│   └── services/
│       ├── feature.service.ts
│       └── feature-grid.service.ts
├── components/
│   └── index.ts
├── pages/
│   ├── index.ts
│   ├── feature-list/
│   │   ├── feature-list.component.ts
│   │   ├── feature-list.component.html
│   │   └── feature-list.component.scss
│   └── feature-form/
│       ├── feature-form.component.ts
│       ├── feature-form.component.html
│       └── feature-form.component.scss
└── feature.routes.ts
```

## [1.0.1] - 2025-11-10

### Tuzatildi

- `API_BASE_URL` provider xatosi tuzatildi
- app.config.ts da DITokens.API_BASE_URL ishlatildi

## [1.0.0] - 2025-11-10

### Qo'shildi

- `fuse-starter` schematic - To'liq Fuse Admin Angular v19.0.0 loyiha generatori
- `fuse-feature` schematic - CRUD feature modul generatori
- 300+ fayl bilan to'liq Fuse Admin starter shablon
- BaseTableComponent pattern bilan grid komponent
- BaseFormComponent pattern bilan form komponent
- BaseCrudService pattern bilan CRUD servis
- GridService bilan ma'lumot boshqaruvi
- PrimeNG komponentlari integratsiyasi
- Tailwind CSS 3.x qo'llab-quvvatlash
- Transloco i18n freymvorki
- TypeScript strict mode
- Responsive layout tizimi
- Dark/Light tema qo'llab-quvvatlash

### Xususiyatlar

- Pozitsion argumentlar qo'llab-quvvatlash
- Maxsus yo'l opsiyasi (`--path`)
- Maxsus prefiks opsiyasi (`--prefix`)
- Form komponentini o'tkazib yuborish (`--skipForm`)
- Alias qo'llab-quvvatlash (`crud`, `feature`, `starter`, `new`)

### Schematicslar

#### fuse-starter

- To'liq loyiha strukturasini yaratadi
- @fuse kutubxonasini o'rnatadi
- Admin modul strukturasini sozlaydi
- Autentifikatsiya guardlarini qo'shadi

#### fuse-feature

- Grid komponenti (BaseTableComponent)
- Form komponenti (BaseFormComponent)
- CRUD servisi (BaseCrudService)
- Grid servisi (GridService)
- Model interfeyslari (IModel, IModelCreate, IModelUpdate)
- Marshrutlar (list, create, edit)

### Texnik Stack

- Angular 19.0.0
- TypeScript 5.9.2
- @angular-devkit/schematics 20.3.9
- PrimeNG (latest)
- Tailwind CSS 3.x
- Transloco (latest)

### Hujjatlar

- To'liq o'zbekcha README.md
- Batafsil ishlatish ko'rsatmalari
- Misollar va variantlar
- API ma'lumotlari
- Muammolarni hal qilish bo'limi

---

## Kelajakda Rejalashtirilgan

### [1.1.0] - Rejada

- Unit testlar qo'shish
- E2E testlar
- Maxsus shablon qo'llab-quvvatlash
- Nx workspace integratsiyasi

### [1.2.0] - Rejada

- GraphQL servis generatori
- Mock ma'lumot generatori
- API client generator
- WebSocket servis generatori

### [1.3.0] - Rejada

- State management (NgRx/Akita) integratsiyasi
- PWA qo'llab-quvvatlash
- Docker konfiguratsiya generatori
- CI/CD pipeline shablonlari

---

## Versiyalash Qoidalari

- **MAJOR** (1.x.x): Orqaga mos kelmaydigan o'zgarishlar
- **MINOR** (x.1.x): Yangi funksiyalar (orqaga mos)
- **PATCH** (x.x.1): Bug fix va kichik yaxshilanishlar

---

## [Unreleased]

### Ishlanmoqda

- Jest test environment
- Storybook integratsiyasi
- Form field generator
- i18n key generator
