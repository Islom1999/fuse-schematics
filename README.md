# Fuse Schematics

[![CI](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml/badge.svg)](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fuse-schematics.svg)](https://www.npmjs.com/package/fuse-schematics)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Angular 20 + PrimeNG + Tailwind admin starter loyihalarini, CRUD feature modullarini va backend add-on admin sahifalarini avtomatik generatsiya qiluvchi Angular schematics to'plami. Backend tomoni uchun juftlik paket: [nest-schematics](https://www.npmjs.com/package/nest-schematics) (NestJS 11 + TypeORM).

> English version: [see below](#english)

## Xususiyatlari

- **Tez loyiha yaratish** — to'liq sozlangan Angular 20 + PrimeNG + Tailwind admin starter loyihasi bitta buyruq bilan (`npm install` va `git init` ham avtomatik)
- **CRUD generatori** — grid, forma, model va servislar bilan feature modul
- **`--fields` bilan maydonlardan generatsiya** — model, formly maydonlari, grid ustunlari va filtrlar bitta ta'rifdan
- **Relation va fayl maydonlari** — `relation(Kategoriya)`, `relation(Tag[])`, `file(image)` maydonlari `relation-select` va `upload` forma turlariga aylanadi
- **OpenAPI/Swagger'dan generatsiya** — backend Swagger hujjatidagi barcha resurslar uchun CRUD modullar bitta buyruq bilan (`x-relation` / `x-file` ham o'qiladi)
- **Add-on admin sahifalari** — `addon` schematic: users, queue, payments, notifications, ai, api-logs sahifalari nest-schematics backend add-on'lariga mos
- **Backend rejimi** — `environment.apiUrl`, `devMock` (backendsiz ishlash), backenddan navigatsiya/qidiruv/bildirishnomalar, `multipart` yoki `tus` yuklash
- **Tayyor autentifikatsiya** — access + refresh token, sign-in/sign-out, forgot/reset password; admin tizim sahifalari (adminlar va rollar)
- **Zoneless va signallar** — zone.js'siz change detection, `input()`/`output()`/`viewChild()` signal API'lari
- **Avtomatik ro'yxatdan o'tkazish** — route `app.routes.ts` ga, menyu bandi `navigation.ts` ga, tarjima kalitlari `i18n/*.json` ga qo'shiladi (qayta ishga tushirilganda takrorlanmaydi)
- **PrimeNG 20, Tailwind 3, Transloco, ngx-formly** — oldindan sozlangan; o'zimizning `@ui` kutubxonasi (MIT)
- **Enterprise patternlar** — `BaseTableComponent`, `BaseFormComponent`, `BaseCrudService`, `GridService`
- **ESLint 9 (flat config) va Prettier** — yaratilgan loyiha lint'dan toza o'tadi

## Mundarija

- [O'rnatish](#ornatish)
- [Tezkor boshlash](#tezkor-boshlash)
- [Schematicslar](#schematicslar)
  - [fuse-starter](#1-fuse-starter)
  - [fuse-feature (crud)](#2-fuse-feature-crud)
  - [fuse-openapi (openapi)](#3-fuse-openapi-openapi)
  - [addon (admin-addon)](#4-addon-admin-addon)
  - [ng-add](#5-ng-add)
- [`--fields` sintaksisi](#--fields-sintaksisi)
- [OpenAPI tur moslamalari](#openapi-tur-moslamalari)
- [Konfiguratsiya fayli](#konfiguratsiya-fayli)
- [Backend rejimi (environment)](#backend-rejimi-environment)
- [Fayl yuklash](#fayl-yuklash)
- [Deploy](#deploy)
- [nest-schematics bilan birga ishlash](#nest-schematics-bilan-birga-ishlash)
- [API ma'lumotlari](#api-malumotlari)
- [Rivojlantirish](#rivojlantirish)
- [Talablar va moslik](#talablar-va-moslik)
- [Litsenziya](#litsenziya)
- [Muammolarni hal qilish](#muammolarni-hal-qilish)
- [English](#english)

## O'rnatish

### 1. Global o'rnatish (tavsiya etiladi)

```bash
npm install -g @angular-devkit/schematics-cli
npm install -g fuse-schematics
```

### 2. Mavjud Angular loyihaga qo'shish

```bash
ng add fuse-schematics
```

## Tezkor boshlash

```bash
# 1. Yangi loyiha (npm install va git init avtomatik bajariladi)
schematics fuse-schematics:new elektron-tijorat-admin
cd elektron-tijorat-admin

# 2. CRUD modullar — route, menyu va tarjimalar avtomatik qo'shiladi
schematics fuse-schematics:crud mahsulot --fields "name:string,price:number,active:boolean,status:enum(active|blocked)"
schematics fuse-schematics:crud kategoriya

# 3. Backend add-on admin sahifasi (ixtiyoriy)
schematics fuse-schematics:addon users

# 4. Ishga tushirish (http://localhost:4222; devMock yoqilgan, test login: admin@example.com / admin)
npm start
```

CRUD sahifalari ma'lumotni backenddan oladi (`environment.apiUrl`); backend uchun [nest-schematics](#nest-schematics-bilan-birga-ishlash) ga qarang.

Angular CLI orqali ham ishlaydi:

```bash
ng g fuse-schematics:crud mahsulot --fields "name:string,price:number"
```

## Schematicslar

### 1. fuse-starter

To'liq Angular 20 + PrimeNG + Tailwind admin starter loyihasini yaratadi.

```bash
schematics fuse-schematics:fuse-starter <loyiha-nomi> [opsiyalar]
```

**Aliaslar:** `fuse-starter`, `starter`, `new`

| Opsiya | Turi | Default | Ta'rif |
|--------|------|---------|--------|
| `name` | `string` | *majburiy* | Loyiha nomi (papka va `package.json` nomi sifatida dasherize qilinadi) |
| `--directory`, `--dir` | `string` | — | Loyiha yaratiladigan ota papka |
| `--skipInstall` | `boolean` | `false` | `npm install` ni ishga tushirmaslik |
| `--skipGit` | `boolean` | `false` | git repozitoriy yaratmaslik (va boshlang'ich commit qilmaslik) |

#### Nima kiradi

- ✅ Angular 20.3 standalone komponentlar bilan
- ✅ **Zoneless** change detection (`provideZonelessChangeDetection()`, zone.js yo'q)
- ✅ Signal API'lari: `input()`, `output()`, `viewChild()`/`contentChild()`, `computed`, yangi control flow (`@if`, `@for`)
- ✅ O'zimizning `@ui` kutubxonasi: vertikal/gorizontal navigatsiya, 11 ta layout, loading bar, fullscreen, alert, confirmation, config/media servislari
- ✅ PrimeNG 20 + `@primeuix/themes`
- ✅ Tailwind CSS 3 (`tailwind.config.js` va `@ui/tailwind` plaginlari: palitra, mavzular, utilitalar)
- ✅ `@jsverse/transloco` i18n (en, tr)
- ✅ ngx-formly 7 + PrimeNG maxsus turlari (input-number, textarea, datepicker, select, upload, ...)
- ✅ Autentifikatsiya: access + refresh token, funksional guardlar, interceptorlar; sign-in, sign-out, forgot/reset password sahifalari
- ✅ Admin tizim sahifalari: adminlar (`/admins`) va rollar (`/roles`), nest-schematics backend bilan mos
- ✅ Dev-mock interceptor (`environment.devMock`, development'da `true`): sign-in, sessiyani yangilash, joriy user, navigatsiya, bildirishnomalar, qidiruv va multipart yuklash backendsiz ishlaydi. Test login: `admin@example.com` / `admin`. CRUD so'rovlari mock qilinmaydi va tarmoqqa ketadi
- ✅ Fayl yuklash: `UploadService` (`multipart` yoki `tus`, qayta tiklanadigan)
- ✅ Qorong'u/yorug' tema
- ✅ ESLint 9 (flat config), Prettier, Husky + lint-staged

#### Loyiha strukturasi

```
mening-admin-loyiham/
├── src/
│   ├── @ui/                      # UI kutubxonasi (+ tailwind plaginlari)
│   ├── app/
│   │   ├── core/                 # auth, http, dev-mock, navigation, upload, user, services
│   │   ├── layout/               # Layout komponentlari
│   │   ├── modules/
│   │   │   ├── admin/            # example, system (adminlar, rollar) va feature modullari
│   │   │   └── auth/             # sign-in, sign-out, forgot/reset password
│   │   └── shared/               # Grid, table-filter, ngx-formly, base klasslar
│   ├── assets/                   # Fontlar, rasmlar, i18n
│   ├── environments/             # environment.ts (production), environment.development.ts
│   └── styles/                   # Global stillar
├── angular.json
├── THIRD-PARTY-NOTICES.md
├── eslint.config.js
├── tailwind.config.js
└── package.json
```

### 2. fuse-feature (crud)

Grid, forma, model va servislar bilan to'liq CRUD feature modulini yaratadi va uni loyihaga ulaydi.

```bash
schematics fuse-schematics:crud <feature-nomi> [opsiyalar]
```

**Aliaslar:** `fuse-feature`, `feature`, `crud`

| Opsiya | Turi | Default | Ta'rif |
|--------|------|---------|--------|
| `name` | `string` | *majburiy* | Feature nomi (masalan: `mahsulot-kategoriyasi`) |
| `--fields` | `string` | `name:string` | Maydonlar ro'yxati (relation va fayl maydonlari ham), [sintaksisi pastda](#--fields-sintaksisi) |
| `--openapi` | `string` | — | OpenAPI 3 / Swagger 2 hujjati (JSON yoki YAML; fayl yo'li yoki URL). Maydonlar shu yerdan olinadi (`--fields` berilsa u ustun) |
| `--schema` | `string` | — | `--openapi` dagi sxema nomi (masalan `CreateMahsulotDto`). Berilmasa feature nomiga mos resurs topiladi |
| `--path` | `string` | `<sourceRoot>/app/modules/admin` | Feature yaratiladigan papka (`sourceRoot` `angular.json` dan o'qiladi) |
| `--project` | `string` | birinchi application | `angular.json` dagi loyiha nomi |
| `--prefix`, `-p` | `string` | `app` | Komponent selector prefiksi |
| `--skipForm` | `boolean` | `false` | Form komponentini yaratmaslik (qo'shish tugmasi ham yashiriladi) |
| `--skipRoute` | `boolean` | `false` | `app.routes.ts` ga route qo'shmaslik |
| `--skipNav` | `boolean` | `false` | `navigation.ts` ga menyu bandi qo'shmaslik |
| `--skipI18n` | `boolean` | `false` | `assets/i18n/*.json` ga tarjima kalitlarini qo'shmaslik |

#### Avtomatik ro'yxatdan o'tkazish

`crud mahsulot` quyidagilarni ham bajaradi (har biri idempotent — qayta ishga tushirilsa takrorlanmaydi):

- **Route:** admin route `children` massiviga `{ path: 'mahsulot', loadChildren: () => import('app/modules/admin/mahsulot/mahsulot.routes') }` qo'shiladi (TypeScript AST orqali)
- **Menyu:** `defaultNavigation`, `compactNavigation`, `futuristicNavigation`, `horizontalNavigation` ga `/mahsulot` bandi qo'shiladi
- **Tarjimalar:** `admin.mahsulot.*` kalitlari (`title`, `addNew`, `create`, `edit`, `fields.<maydon>` ...) har bir `assets/i18n/*.json` ga birlashtiriladi, mavjud kalitlar o'zgarmaydi

Fayl topilmasa ogohlantirish chiqariladi va generatsiya davom etadi.

#### Yaratilgan struktura

```
src/app/modules/admin/<feature-nomi>/
├── <feature-nomi>.routes.ts
├── common/
│   ├── index.ts
│   ├── models/<feature-nomi>.model.ts            # I<Nom>, I<Nom>Create, I<Nom>Update
│   └── services/
│       ├── <feature-nomi>.service.ts             # BaseCrudService ('admin/<feature-nomi>')
│       └── <feature-nomi>-grid.service.ts        # GridService
├── components/
│   └── index.ts
└── pages/
    ├── index.ts
    ├── <feature-nomi>-list/                      # BaseTableComponent: grid + filtr
    └── <feature-nomi>-form/                      # BaseFormComponent: formly forma (--skipForm bilan yo'q)
```

### 3. fuse-openapi (openapi)

OpenAPI/Swagger hujjatidagi har bir `admin/<nom>` resursi uchun CRUD modul yaratadi (har biri `fuse-feature` orqali: route, menyu va tarjimalar bilan).

```bash
# nest-schematics backend uchun (Swagger JSON: /docs/admin-json)
schematics fuse-schematics:openapi --openapi http://localhost:3000/docs/admin-json

# Fayldan, faqat tanlangan resurslar
schematics fuse-schematics:openapi --openapi ./swagger.json --include mahsulot,kategoriya

# Bitta modul, aniq sxemadan
schematics fuse-schematics:crud buyurtma --openapi ./swagger.json --schema CreateBuyurtmaDto
```

**Alias:** `openapi`

| Opsiya | Turi | Default | Ta'rif |
|--------|------|---------|--------|
| `--openapi` | `string` | *majburiy* | Hujjat yo'li yoki URL (birinchi pozitsion argument sifatida ham beriladi) |
| `--include` | `string` | — | Faqat shu resurslar (vergul bilan) |
| `--exclude` | `string` | — | Bu resurslarni o'tkazib yuborish |
| `--force` | `boolean` | `false` | Mavjud feature papkasini qayta yaratish. **Eslatma:** `schematics` CLI'ning o'z global `--force` opsiyasi shu nomni oladi va schematic'ga yetib bormaydi; mavjud papkani o'chirib, qayta ishga tushiring |
| `--path`, `--project`, `--prefix`, `--skipForm`, `--skipRoute`, `--skipNav`, `--skipI18n` | | | `fuse-feature` dagi kabi |

Resurslar yo'llardan topiladi: `/admin/<nom>` va `/admin/<nom>/{id}` (global prefiks, masalan `/api`, e'tiborga olinmaydi). Sxema tartibi: POST so'rov tanasi (Create DTO) → GET-by-id javobi → nomi mos sxema. `$ref` va `allOf` hal qilinadi; tashqi (boshqa fayldagi) `$ref` qo'llab-quvvatlanmaydi.

### 4. addon (admin-addon)

nest-schematics backend add-on'iga mos admin sahifasini loyihaga qo'shadi: lazy route (`app.routes.ts`), menyu bandi (`navigation.ts`) va tarjimalar (`assets/i18n/*.json`) bilan. Har bir qadam idempotent; mavjud fayllar saqlanadi.

```bash
schematics fuse-schematics:addon <users|queue|payments|notifications|ai|api-logs> [opsiyalar]

schematics fuse-schematics:addon users
schematics fuse-schematics:addon api-logs --skipNav
```

**Aliaslar:** `addon`, `admin-addon`. Nom `api-logs`, `apiLogs`, `api_logs` ko'rinishida ham qabul qilinadi; berilmasa ro'yxatdan tanlash so'raladi.

| Opsiya | Turi | Default | Ta'rif |
|--------|------|---------|--------|
| `name` | `string` | *majburiy* | Sahifa nomi (pastdagi jadval) |
| `--path` | `string` | `<sourceRoot>/app/modules/admin` | Sahifa papkasi yaratiladigan joy (yoki `fuse-schematics.json` dagi `addon.path`) |
| `--project` | `string` | birinchi application | `angular.json` dagi loyiha, `sourceRoot` shundan o'qiladi |
| `--force` | `boolean` | `false` | Mavjud sahifa fayllarini qayta yozish. **Eslatma:** `schematics` CLI'ning global `--force` opsiyasi bilan to'qnashadi va schematic'ga yetib bormaydi, shuning uchun `schematics` orqali ishlamaydi; sahifa papkasini (`src/app/modules/admin/<nom>`) o'chirib, schematic'ni qayta ishga tushiring |
| `--skipRoute` | `boolean` | `false` | `app.routes.ts` ga route qo'shmaslik |
| `--skipNav` | `boolean` | `false` | `navigation.ts` ga menyu bandi qo'shmaslik |
| `--skipI18n` | `boolean` | `false` | `assets/i18n/*.json` ga tarjima kalitlarini qo'shmaslik |

| Sahifa | Nima | Backend add-on (nest-schematics) | Admin permission |
|--------|------|----------------------------------|------------------|
| `users` | mijoz foydalanuvchilar, sessiyalar, push qurilmalar | `auth-client` | `user.read` / `user.write` |
| `queue` | fon navbatlari va joblar | `queue` (u `redis` ni talab qiladi) | `queue.read` / `queue.write` |
| `payments` | tranzaksiyalar, invoyslar, hamyonlar | `payment` | `payment.read` / `payment.write` |
| `notifications` | kampaniyalar va yuborish formasi | `notifications` | `notification.read` / `notification.write` |
| `ai` | foydalanish statistikasi va kvota | `ai` | `ai.read` |
| `api-logs` | server API loglari | `api-logs` | `server_api_log.read` |

Backendda add-on'ni o'rnatish: `npm run g -- auth-client --methods email` kabi (to'liq ro'yxat: [nest-schematics README](https://www.npmjs.com/package/nest-schematics)). Schematic sahifa qo'shilganda kerakli add-on va permission nomini loga chiqaradi.

### 5. ng-add

```bash
ng add fuse-schematics
```

Paketni `devDependencies` ga qo'shadi, workspace Angular loyihasi ekanini tekshiradi va foydalanish bo'yicha yo'riqnoma chiqaradi. Hech qanday faylni o'zgartirmaydi.

## `--fields` sintaksisi

Vergul bilan ajratilgan `nom:tur` juftliklari. Oxiridagi `?` maydonni ixtiyoriy qiladi.

| Tur | TypeScript | Forma (formly) | Grid / filtr |
|-----|------------|----------------|--------------|
| `string` | `string` | `input` | matn |
| `number` | `number` | `input-number` | son |
| `boolean` | `boolean` | `checkbox` | ha/yo'q select |
| `date` | `Date` | `datepicker` | sana |
| `text` | `string` | `textarea` | matn |
| `enum(a\|b)` | `'a' \| 'b'` | `select` | select |
| `int`, `decimal(p,s)` | `number` | `input-number` (kasr xonalari `decimal` ga ko'ra) | son |
| `json` | `Record<string, unknown>` | `json` (matn maydoni) | — |
| `relation(Kategoriya)` | `categoryId: string` | `relation-select` (`p-select`, `admin/kategoriya/options` dan qidiruv bilan yuklanadi) | ustun: bog'langan qator yorlig'i (`row.category.name`, bo'lmasa id), filtr yo'q |
| `relation(Tag[])` | `tagIds: string[]` | `relation-select` (`p-multiselect`) | ustun va filtr yo'q (ro'yxat endpointi ManyToMany'ni qaytarmaydi) |
| `file(image)`, `file(pdf)[]` | `imageId: string`, `docIds: string[]` | `upload` (`kind`, `multiple` propslari bilan) | ustun va filtr yo'q |

Modifikatorlar: `string(32)`, `:min(n)`, `:max(n)` (`minLength`/`maxLength`, `min`/`max`), `:default(x)` (`defaultValue`), `:label(field)` (relation yorlig'i ustuni), `:unique`, `:index`, `:cascade`, `:set-null` (faqat backend uchun, UI'ga ta'sir qilmaydi). Barcha backend sintaksisi xatosiz o'qiladi.

```bash
schematics fuse-schematics:crud mahsulot \
  --fields "name:string,price:number,active:boolean,note:text?,status:enum(active|blocked),soldAt:date?"
```

`--fields` berilmasa bitta majburiy `name:string` maydoni bilan yaratiladi.

**Relation maydonlari.** `category:relation(Kategoriya)` modelda `categoryId` bo'ladi, formada `relation-select` turi (bitta qiymat — `p-select`, `relation(Tag[])` — `p-multiselect`) yaratiladi. Variantlar `GET admin/<resurs>/options?search=&ids=&limit=&label=` dan yuklanadi (nest-schematics har bir CRUD resursda shu endpointni beradi), shuning uchun bog'langan resurs uchun ham `crud` ishga tushirilgan bo'lishi kerak.

**Fayl maydonlari.** `image:file(image)` modelda `imageId`, formada `upload` turi (`kind`: `image`, `video`, `audio`, `pdf`, `other`; `file(pdf)[]` — ko'p fayl). Fayl `UploadService` orqali backendning `upload` add-on'iga yuklanadi, [Fayl yuklash](#fayl-yuklash) ga qarang.

```bash
schematics fuse-schematics:crud mahsulot \
  --fields "name:string,price:decimal(12,2),category:relation(Kategoriya),tags:relation(Tag[])?,image:file(image)?,docs:file(pdf)[]?"
```

> Xuddi shu sintaksis backend paketida ham ishlatiladi, shuning uchun bitta ta'rif bilan front va backendni bir xil yaratish mumkin.

## OpenAPI tur moslamalari

| OpenAPI xususiyati | `--fields` turi |
|---|---|
| `enum` (string) | `enum(a\|b)` |
| `string` + `format: date` / `date-time` | `date` |
| `string` + `maxLength > 255` yoki `format: textarea` | `text` |
| boshqa `string` | `string` |
| `integer` / `number` | `number` |
| `x-relation` (`categoryId`, `tagIds`) | `relation(Entity)` / `relation(Entity[])`, `label(...)` |
| `x-file` (`imageId`, `docIds`) | `file(kind)` / `file(kind)[]` |
| `boolean` | `boolean` |
| obyekt, massiv, binary, `$ref` obyektga | o'tkazib yuboriladi (logda ko'rsatiladi) |

`id`, `createdAt`, `updatedAt`, `deletedAt` va `readOnly` maydonlar o'tkazib yuboriladi. `required` da bo'lmagan yoki `nullable` maydon ixtiyoriy (`?`) bo'ladi.

## Konfiguratsiya fayli

Workspace ildizida `fuse-schematics.json` yarating — `fuse-feature` uchun default qiymatlar shu yerdan olinadi (CLI opsiyalari ustun turadi):

```json
{
  "fuse-feature": {
    "path": "src/app/features",
    "prefix": "meningapp"
  },
  "addon": {
    "path": "src/app/modules/admin"
  }
}
```

(`fuse-feature` uchun `path` va `prefix`, `addon` uchun `path`.)

## Backend rejimi (environment)

Sozlamalar `src/environments/environment.ts` (production build) va `environment.development.ts` (`ng serve`, `ng build --configuration development`) fayllarida. Ikkalasida bir xil kalitlar:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',   // backend, global prefiks /api bilan
  devMock: true,                          // development'da true, production'da false
  upload: 'multipart' as 'multipart' | 'tus',
  tusEndpoint: '',
  features: {
    search: 'client' as 'client' | 'backend',
    navigation: 'static' as 'static' | 'backend',
    userStatus: false,
    notifications: true,
  },
}
```

| Kalit | Qiymatlar | Ta'rif |
|-------|-----------|--------|
| `apiUrl` | URL | Barcha so'rovlar (`BaseCrudService`, auth, upload) shu manzilga ketadi. nest-schematics default: `http://localhost:3000/api` |
| `devMock` | `true` / `false` | `true`: **dev-mock interceptor** sign-in, sessiyani yangilash, joriy user, navigatsiya, `admin/me/notifications`, qidiruv va multipart yuklashni backendsiz xotirada javoblaydi (test login `admin@example.com` / `admin`); qolgan so'rovlar (masalan CRUD) tarmoqqa ketadi. Haqiqiy backend bilan ishlash uchun `false` qiling. Interceptor'ni butunlay olib tashlash uchun `src/app/core/dev-mock` papkasini va `app.config.ts` dagi `withInterceptors` ro'yxatidan `devMockInterceptor` ni o'chiring |
| `features.navigation` | `'static'` / `'backend'` | `'static'`: menyu `navigation.ts` dan; `'backend'`: `GET /navigation` dan yuklanadi va backendda yo'q statik bandlar qo'shiladi |
| `features.search` | `'client'` / `'backend'` | `'client'`: qidiruv navigatsiya bandlari bo'yicha brauzerda; `'backend'`: `POST /search` |
| `features.notifications` | `true` / `false` | Headerdagi qo'ng'iroqcha (`GET admin/me/notifications`). Backendda admin bildirishnomalari bo'lmasa `false` qiling (404 kelsa qo'ng'iroqcha sessiya davomida yashirinadi) |
| `features.userStatus` | `true` / `false` | User menyusidagi online/away/busy holati (backend qo'llab-quvvatlashi kerak) |
| `upload`, `tusEndpoint` | | [Fayl yuklash](#fayl-yuklash) |

## Fayl yuklash

`UploadService` (`src/app/core/upload`) fayllarni backendning `upload` add-on'iga yuklaydi va `media_files` yozuvini qaytaradi; `upload` forma turi (`file(kind)` maydonlari) shuni ishlatadi.

| `environment.upload` | Ishlash | Backend |
|----------------------|---------|---------|
| `'multipart'` (default) | bitta `POST admin/files/upload` (maydon `files`) | `npm run g -- upload` |
| `'tus'` | qayta tiklanadigan tus 1.0 yuklash (`tus-js-client`, 5 MB bo'laklar, qayta urinishlar) | `npm run g -- upload-tus --engine tusd\|node` (avval `upload`) |

`tusEndpoint` bo'sh bo'lsa `<apiUrl>/files/tus` ishlatiladi (`node` engine). `tusd` engine uchun tusd manzilini yozing, masalan `http://localhost:8080/files/`. `devMock` tus'ni mock qilmaydi.

## Deploy

```bash
# 1. apiUrl (va kerak bo'lsa devMock: false) ni src/environments/environment.ts da sozlang
# 2. Build (default konfiguratsiya: production)
npx ng build
```

Natija `dist/fuse/browser` papkasida (`dist/fuse` — `angular.json` dagi `outputPath`; `fuse` — loyiha kaliti, generatsiyada o'zgarmaydi). Shu papkani statik hostingga yoki nginx'ga qo'ying. Ilova SPA bo'lgani uchun noma'lum yo'llar `index.html` ga qaytarilishi (SPA fallback) shart:

```nginx
server {
  listen 80;
  root /var/www/admin;        # dist/fuse/browser mazmuni
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

Starter `src/_redirects` faylini (`/*  /index.html  200`) ham build'ga qo'shadi — Netlify va Cloudflare Pages uchun fallback shu bilan tayyor. Backend CORS'i admin manzilini ruxsat etishi kerak (nest-schematics: `CORS_ORIGINS` env, `ng serve` uchun `http://localhost:4222`).

## nest-schematics bilan birga ishlash

Backend: [nest-schematics](https://www.npmjs.com/package/nest-schematics) (NestJS 11 + TypeORM + PostgreSQL), API kontrakti shu paket frontendi bilan bir xil (`POST admin/<nom>/pagination` → `{ count, data }`, arxiv, `options`). Bir xil `--fields` bilan ikkala tomonni yaratish:

```bash
# 1. Backend (CLI: nest-schematics; loyiha ichida `npm run g -- ...` ham shu CLI)
npx nest-schematics new shop-api
cd shop-api
cp .env.example .env                       # DB_* va ADMIN_* ni to'ldiring; CORS_ORIGINS=http://localhost:4222
npm run g -- upload                        # file(...) maydonlari uchun
npm run g -- crud category --fields "name:string:unique"
npm run g -- crud product --fields "name:string,price:decimal(12,2),category:relation(Category),image:file(image)?"
npm run start:dev                          # http://localhost:3000/api, Swagger: /docs
cd ..

# 2. Frontend — xuddi shu maydonlar
schematics fuse-schematics:new shop-admin
cd shop-admin
schematics fuse-schematics:crud category --fields "name:string"
schematics fuse-schematics:crud product --fields "name:string,price:decimal(12,2),category:relation(Category),image:file(image)?"
# yoki to'g'ridan-to'g'ri backend Swagger'idan:
# schematics fuse-schematics:openapi --openapi http://localhost:3000/docs/admin-json

# 3. Ulash: src/environments/environment.development.ts va environment.ts
#    apiUrl: 'http://localhost:3000/api',  devMock: false
npm start                                  # http://localhost:4222
```

Add-on'lar ham shu tartibda: backendda `npm run g -- auth-client --methods email`, frontendda `schematics fuse-schematics:addon users`. Backendda yaratilgan admin foydalanuvchi bilan kiring (`ADMIN_*` env), `devMock: false` bo'lganda `admin@example.com` / `admin` ishlamaydi.

## API ma'lumotlari

### BaseTableComponent
Sahifalash, filtrlash, saralash, qator tanlash va forma dialogini boshqarish.

### BaseFormComponent
Yaratish/tahrirlash rejimi, forma validatsiyasi, submit, o'chirishni tasdiqlash, bekor qilish.

### BaseCrudService
| Metod | Ta'rif |
|-------|--------|
| `getAll()` | Barcha yozuvlar |
| `getAllPagination(params, isArchiveView)` | Sahifalangan yozuvlar → `{ count, data }` |
| `getById(id, isArchiveView)` | Bitta yozuv |
| `create(data)` | Yangi yozuv |
| `update(id, data)` | Yozuvni yangilash |
| `delete(id)` | Yozuvni o'chirish |

### GridService
Server-side sahifalash, filtrlash, saralash va yuklanish holati.

## Rivojlantirish

```bash
git clone https://github.com/Islom1999/fuse-schematics.git
cd fuse-schematics
npm install
npm run build      # tsc
npm test           # build + jasmine unit testlar
npm link           # lokal sinov uchun
```

Lokal sinov:

```bash
schematics ./src/collection.json:fuse-starter test-app --skip-install --dry-run=false
cd test-app && npm install
schematics ../src/collection.json:crud test-modul --fields "name:string" --dry-run=false
npx ng build
```

CI (`.github/workflows/ci.yml`) har bir push va PR'da unit testlarni ishga tushiradi, so'ng loyiha yaratib, CRUD modul qo'shib `ng build` qiladi.

### Nashr qilish

Nashr CI orqali bajariladi (`.github/workflows/ci.yml`): `package.json` dagi versiyaga mos `v*` teg (masalan `v2.0.0`) push qilinganda unit testlar va smoke build'dan so'ng `npm publish --access public` ishga tushadi. Autentifikatsiya npm trusted publishing (OIDC) orqali, token (`NPM_TOKEN`) kerak emas; provenance avtomatik qo'shiladi. Teg versiyasi `package.json` bilan mos kelmasa job to'xtaydi.

```bash
npm version 2.0.1          # package.json + git tegi (v2.0.1)
git push --follow-tags
```

## Talablar va moslik

- **Node.js**: 20.19.0 yoki undan yuqori (CI Node 22 da ishlaydi)
- **npm**: 9.0.0 yoki undan yuqori
- **Angular**: 20.x (starter Angular 20.3, PrimeNG 20, Tailwind 3 bilan keladi)
- **Backend (ixtiyoriy)**: [nest-schematics](https://www.npmjs.com/package/nest-schematics) — NestJS 11, PostgreSQL

| Fuse Schematics | Angular |
|----------------|---------|
| 2.x.x          | 20.x    |
| 1.x.x          | 19.x    |

2.0.0 dan oldingi versiyalardan o'tish: [CHANGELOG](CHANGELOG.md#migrating-from-102).

## Muammolarni hal qilish

**Buyruq topilmadi**
```bash
npm install -g @angular-devkit/schematics-cli fuse-schematics
```

**Ruxsat rad etildi (Linux/Mac)**
```bash
sudo npm install -g fuse-schematics
```

**`--force` ishlamadi (`addon`, `openapi`)** — `schematics` CLI'ning global `--force` opsiyasi schematic'ning o'z `--force` iga yetkazilmaydi. Mavjud sahifa/feature papkasini o'chirib, buyruqni qayta ishga tushiring.

**Production'da noto'g'ri backendga ulanadi** — `apiUrl` ni `src/environments/environment.ts` da o'zgartiring (production build shuni oladi), `ng serve` uchun `environment.development.ts` da. Production'da `devMock: false` bo'lishi kerak.

**Sahifani yangilaganda 404 (deploy)** — serverda SPA fallback yo'q: nginx'da `try_files $uri /index.html;`, Netlify/Cloudflare Pages'da `_redirects` (build'ga qo'shiladi), [Deploy](#deploy) ga qarang.

**Brauzerda CORS xatosi** — backendda `CORS_ORIGINS` ga admin manzilini (`http://localhost:4222`) qo'shing.

**`relation-select` bo'sh / 404** — bog'langan resurs uchun backendda `crud` yaratilganini va `GET admin/<resurs>/options` mavjudligini tekshiring.

**Route/menyu qo'shilmadi** — `app.routes.ts` da `resolve: { initialData }` yoki `example` child route'li admin route, `navigation.ts` da esa `defaultNavigation` kabi eksportlar bo'lishi kerak. Aks holda ogohlantirish chiqadi; route'ni qo'lda qo'shing yoki `--skipRoute`/`--skipNav` ishlating.

## Hissa qo'shish

1. Repozitoriyani fork qiling
2. Branch yarating (`git checkout -b feature/ajoyib-feature`)
3. `npm test` o'tishiga ishonch hosil qiling
4. Commit va push qiling, Pull Request oching

## O'zgarishlar tarixi

[CHANGELOG.md](CHANGELOG.md)

## Qo'llab-quvvatlash

- Muammolar: [GitHub Issues](https://github.com/Islom1999/fuse-schematics/issues)

## Yo'l xaritasi

- [x] Schematics uchun unit testlar
- [x] Maydonlardan generatsiya (`--fields`)
- [x] Route, menyu va i18n ni avtomatik ro'yxatdan o'tkazish
- [x] `ng add` qo'llab-quvvatlash
- [x] OpenAPI/Swagger'dan generatsiya
- [x] Zoneless va signal API'lari
- [x] Fuse kodini o'zimizning `@ui` kutubxonasiga almashtirish, MIT litsenziya
- [x] Relation va fayl maydonlari, fayl yuklash (multipart / tus)
- [x] Backend rejimi (`apiUrl`, `devMock`) va nest-schematics bilan mosligi
- [x] Add-on admin sahifalari (`addon` schematic)
- [x] npm trusted publishing (OIDC) bilan CI nashr
- [ ] Maxsus shablonlarni qo'llab-quvvatlash
- [ ] Nx workspace bilan integratsiya
- [ ] E2E test shablonlari

## Litsenziya

MIT © Islom Karimov. Batafsil: [LICENSE](LICENSE).

Starter'dagi `@ui` kutubxonasi va barcha shablon kodi shu loyihada yangidan yozilgan (MIT). Uchinchi tomon resurslari (Heroicons, Flagpack, Inter) generatsiya qilingan loyihaning ildizidagi `THIRD-PARTY-NOTICES.md` faylida keltirilgan (paketda: `src/fuse-starter/files/THIRD-PARTY-NOTICES.md`).

Starter'ning layout ko'rinishi keng tarqalgan admin dashboardlardan ilhomlangan, barcha kod original. Paket nomidagi "Fuse" tarixiy bo'lib, loyiha Fuse shabloni yoki uning muallifi bilan bog'liq emas.

## Minnatdorchilik

- [Angular Schematics](https://angular.dev/tools/cli/schematics)
- [Heroicons](https://heroicons.com/), [Flagpack](https://flagpack.xyz/), [Inter](https://rsms.me/inter/)
- [PrimeNG](https://primeng.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## English

Angular schematics that scaffold **Angular 20 + PrimeNG + Tailwind admin starter** projects, full **CRUD feature modules** and **admin pages for backend add-ons**. The matching backend is [nest-schematics](https://www.npmjs.com/package/nest-schematics) (NestJS 11 + TypeORM).

Install and use:

```bash
npm install -g @angular-devkit/schematics-cli fuse-schematics

# New project (runs npm install and git init; use --skip-install / --skip-git to opt out)
schematics fuse-schematics:new my-admin

# CRUD feature: also registers the route, the menu item and i18n keys (idempotent)
cd my-admin
schematics fuse-schematics:crud product --fields "name:string,price:number,active:boolean,status:enum(active|blocked)"

# Admin page for a backend add-on
schematics fuse-schematics:addon users

# All CRUD resources from an OpenAPI/Swagger document (file or URL, JSON or YAML)
schematics fuse-schematics:openapi --openapi http://localhost:3000/docs/admin-json

# Existing Angular workspace
ng add fuse-schematics
ng g fuse-schematics:crud product
```

**Schematics**

- `fuse-starter` (`starter`, `new`): options `--directory`, `--skipInstall`, `--skipGit`.
- `fuse-feature` (`feature`, `crud`): options `--fields`, `--openapi`, `--schema`, `--path`, `--project`, `--prefix`, `--skipForm`, `--skipRoute`, `--skipNav`, `--skipI18n`.
- `addon` (`admin-addon`): `schematics fuse-schematics:addon <users|queue|payments|notifications|ai|api-logs>`; options `--path`, `--project`, `--force`, `--skipRoute`, `--skipNav`, `--skipI18n`. Adds a lazy route, a menu item and i18n keys.
- `fuse-openapi` (`openapi`): one CRUD feature per `/admin/<name>` resource of an OpenAPI 3 / Swagger 2 document; options `--openapi`, `--include`, `--exclude`, `--force` plus the `fuse-feature` path/registration options.
- `ng-add`: validates the workspace and prints usage; changes no files.

> `--force` of `addon` and `fuse-openapi` clashes with the global `--force` of the `schematics` CLI, which swallows it, so it has no effect there. To regenerate, delete the page/feature folder and run the schematic again.

| Page | Needs the nest-schematics add-on | Permission |
|---|---|---|
| `users` | `auth-client` | `user.read` / `user.write` |
| `queue` | `queue` (needs `redis`) | `queue.read` / `queue.write` |
| `payments` | `payment` | `payment.read` / `payment.write` |
| `notifications` | `notifications` | `notification.read` / `notification.write` |
| `ai` | `ai` | `ai.read` |
| `api-logs` | `api-logs` | `server_api_log.read` |

The generated app is **zoneless** (`provideZonelessChangeDetection()`, no zone.js), uses signal inputs/outputs/queries and the new control flow, and ships its own `@ui` library (`src/@ui`, MIT) instead of third-party template code.

**`--fields`**: comma-separated `name:type`, types `string | int | number | decimal(p,s) | boolean | date | text | json | enum(a|b) | relation(Entity) | relation(Entity[]) | file(kind) | file(kind)[]`, modifiers `unique | index | default(x) | min(n) | max(n) | label(f) | cascade | set-null`, trailing `?` = optional (same syntax as nest-schematics). Generates model interfaces, formly fields, grid columns and table filters. `relation(X)` becomes `xId` with a `relation-select` field (`p-select`, or `p-multiselect` for `relation(X[])`, options from `GET admin/<x>/options`); `file(kind)` becomes `<name>Id` with an `upload` field (kinds `image | video | audio | pdf | other`). OpenAPI `x-relation` / `x-file` give the same result.

**Backend mode** (`src/environments/environment.ts` for production, `environment.development.ts` for `ng serve`):

- `apiUrl`: the backend, default `http://localhost:3000/api`.
- `devMock`: `true` in development. The dev-mock interceptor answers sign-in, token refresh, current user, navigation, `admin/me/notifications`, search and multipart uploads in memory (login `admin@example.com` / `admin`); everything else, including CRUD, goes to the network. Set it to `false` to use the real backend.
- `features.navigation`: `'static'` (menu from `navigation.ts`) or `'backend'` (`GET /navigation`, missing static items are appended).
- `features.search`: `'client'` (searches the navigation) or `'backend'` (`POST /search`).
- `features.notifications`: header bell, `GET admin/me/notifications`; turn it off if the backend has no admin notifications. `features.userStatus` shows the online/away/busy status.
- `upload`: `'multipart'` (default, `POST admin/files/upload`, backend add-on `upload`) or `'tus'` (resumable, backend add-on `upload-tus`); `tusEndpoint` defaults to `<apiUrl>/files/tus`, use the tusd URL for the `tusd` engine.

**Deploy**: `npx ng build`, then serve `dist/fuse/browser` (the `outputPath` in `angular.json`) from static hosting or nginx with an SPA fallback (`try_files $uri /index.html;`). The starter also ships `src/_redirects` for Netlify / Cloudflare Pages. Set `apiUrl` in `src/environments/environment.ts` (the production build) and keep `devMock: false`. The backend must allow the admin origin in `CORS_ORIGINS`.

**Working with nest-schematics** (same `--fields` on both sides):

```bash
npx nest-schematics new shop-api && cd shop-api && cp .env.example .env   # fill in DB_* / ADMIN_*, CORS_ORIGINS=http://localhost:4222
npm run g -- upload
npm run g -- crud category --fields "name:string:unique"
npm run g -- crud product --fields "name:string,price:decimal(12,2),category:relation(Category),image:file(image)?"
npm run start:dev                                                        # http://localhost:3000/api

schematics fuse-schematics:new shop-admin && cd shop-admin
schematics fuse-schematics:crud category --fields "name:string"
schematics fuse-schematics:crud product --fields "name:string,price:decimal(12,2),category:relation(Category),image:file(image)?"
# set apiUrl: 'http://localhost:3000/api' and devMock: false in src/environments/environment*.ts
npm start                                                                # http://localhost:4222
```

**Config file**: `fuse-schematics.json` at the workspace root, `{ "fuse-feature": { "path": "...", "prefix": "..." }, "addon": { "path": "..." } }`; CLI flags win.

**Requirements**: Node.js >= 20.19, Angular 20 (the starter uses Angular 20.3, PrimeNG 20, Tailwind 3). Upgrading from 1.x: see [CHANGELOG](CHANGELOG.md#migrating-from-102).

**License**: MIT (see [LICENSE](LICENSE)). Third-party assets (Heroicons, Flagpack, Inter) are listed in `THIRD-PARTY-NOTICES.md` in the root of the generated project (`src/fuse-starter/files/THIRD-PARTY-NOTICES.md` in this package). The starter's layout look is inspired by common admin dashboards; all code is original. "Fuse" in the package name is historical, and the project is not affiliated with the Fuse template or its author.

**Publishing**: CI publishes to npmjs.org when a `v*` tag matching the `package.json` version is pushed (after tests and the smoke build), using npm trusted publishing (OIDC); no `NPM_TOKEN` is needed and provenance is added automatically.
