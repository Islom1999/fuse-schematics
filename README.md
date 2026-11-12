# Fuse Schematics

[![CI](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml/badge.svg)](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fuse-schematics.svg)](https://www.npmjs.com/package/fuse-schematics)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Angular 20 + PrimeNG + Tailwind admin starter loyihalarini va CRUD feature modullarini avtomatik generatsiya qiluvchi Angular schematics to'plami.

> English version: [see below](#english)

## Xususiyatlari

- **Tez loyiha yaratish** — to'liq sozlangan Angular 20 + PrimeNG + Tailwind admin starter loyihasi bitta buyruq bilan (`npm install` va `git init` ham avtomatik)
- **CRUD generatori** — grid, forma, model va servislar bilan feature modul
- **`--fields` bilan maydonlardan generatsiya** — model, formly maydonlari, grid ustunlari va filtrlar bitta ta'rifdan
- **OpenAPI/Swagger'dan generatsiya** — backend Swagger hujjatidagi barcha resurslar uchun CRUD modullar bitta buyruq bilan
- **Zoneless va signallar** — zone.js'siz change detection, `input()`/`output()`/`viewChild()` signal API'lari
- **Avtomatik ro'yxatdan o'tkazish** — route `app.routes.ts` ga, menyu bandi `navigation.ts` ga, tarjima kalitlari `i18n/*.json` ga qo'shiladi (qayta ishga tushirilganda takrorlanmaydi)
- **PrimeNG 20, Tailwind 3, Transloco, ngx-formly** — oldindan sozlangan
- **Enterprise patternlar** — `BaseTableComponent`, `BaseFormComponent`, `BaseCrudService`, `GridService`
- **ESLint 9 (flat config) va Prettier** — yaratilgan loyiha lint'dan toza o'tadi

## Mundarija

- [O'rnatish](#ornatish)
- [Tezkor boshlash](#tezkor-boshlash)
- [Schematicslar](#schematicslar)
  - [fuse-starter](#1-fuse-starter)
  - [fuse-feature (crud)](#2-fuse-feature-crud)
  - [fuse-openapi (openapi)](#3-fuse-openapi-openapi)
  - [ng-add](#4-ng-add)
- [`--fields` sintaksisi](#--fields-sintaksisi)
- [OpenAPI tur moslamalari](#openapi-tur-moslamalari)
- [Konfiguratsiya fayli](#konfiguratsiya-fayli)
- [API ma'lumotlari](#api-malumotlari)
- [Rivojlantirish](#rivojlantirish)
- [Talablar va moslik](#talablar-va-moslik)
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

# 3. Ishga tushirish
npm start
```

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
- ✅ Dev-mock (`environment.devMock`, faqat development): login, user, navigation va bo'sh notifications. Test login: `admin@example.com` / `admin`
- ✅ Qorong'u/yorug' tema
- ✅ ESLint 9 (flat config), Prettier, Husky + lint-staged

#### Loyiha strukturasi

```
mening-admin-loyiham/
├── src/
│   ├── @ui/                      # UI kutubxonasi (+ tailwind plaginlari)
│   ├── app/
│   │   ├── core/                 # Auth, navigatsiya, servislar
│   │   ├── layout/               # Layout komponentlari
│   │   ├── modules/admin/        # Feature modullari
│   │   └── shared/               # Grid, table-filter, base klasslar
│   ├── assets/                   # Fontlar, rasmlar, i18n
│   └── styles/                   # Global stillar
├── angular.json
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
| `--fields` | `string` | `name:string` | Maydonlar ro'yxati, [sintaksisi pastda](#--fields-sintaksisi) |
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
# fuse-nest-schematics backend uchun
schematics fuse-schematics:openapi --openapi http://localhost:3000/docs-json

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
| `--force` | `boolean` | `false` | Mavjud feature papkasini qayta yaratish (default: o'tkazib yuboriladi) |
| `--path`, `--project`, `--prefix`, `--skipForm`, `--skipRoute`, `--skipNav`, `--skipI18n` | | | `fuse-feature` dagi kabi |

Resurslar yo'llardan topiladi: `/admin/<nom>` va `/admin/<nom>/{id}` (global prefiks, masalan `/api`, e'tiborga olinmaydi). Sxema tartibi: POST so'rov tanasi (Create DTO) → GET-by-id javobi → nomi mos sxema. `$ref` va `allOf` hal qilinadi; tashqi (boshqa fayldagi) `$ref` qo'llab-quvvatlanmaydi.

### 4. ng-add

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
  }
}
```

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

Paket npmjs.org'ga muallif tomonidan nashr qilinadi: `npm test && npm publish`.

## Talablar va moslik

- **Node.js**: 20.19.0 yoki undan yuqori
- **npm**: 9.0.0 yoki undan yuqori
- **Angular**: 20.x

| Fuse Schematics | Angular |
|----------------|---------|
| 2.x.x          | 20.x    |
| 1.x.x          | 19.x    |

## Muammolarni hal qilish

**Buyruq topilmadi**
```bash
npm install -g @angular-devkit/schematics-cli fuse-schematics
```

**Ruxsat rad etildi (Linux/Mac)**
```bash
sudo npm install -g fuse-schematics
```

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
- [ ] Maxsus shablonlarni qo'llab-quvvatlash
- [ ] Nx workspace bilan integratsiya
- [ ] E2E test shablonlari

## Litsenziya

MIT © Islom Karimov. Batafsil: [LICENSE](LICENSE).

Uchinchi tomon resurslari (Heroicons, Flagpack, Inter) `src/fuse-starter/files/THIRD-PARTY-NOTICES.md` faylida keltirilgan.

Starter'ning layout ko'rinishi keng tarqalgan admin dashboardlardan ilhomlangan, barcha kod original. Paket nomidagi "Fuse" tarixiy bo'lib, loyiha Fuse shabloni yoki uning muallifi bilan bog'liq emas.

## Minnatdorchilik

- [Angular Schematics](https://angular.dev/tools/cli/schematics)
- [Heroicons](https://heroicons.com/), [Flagpack](https://flagpack.xyz/), [Inter](https://rsms.me/inter/)
- [PrimeNG](https://primeng.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## English

Angular schematics that scaffold **Angular 20 + PrimeNG + Tailwind admin starter** projects and full **CRUD feature modules**.

Install and use:

```bash
npm install -g @angular-devkit/schematics-cli fuse-schematics

# New project (runs npm install and git init; use --skip-install / --skip-git to opt out)
schematics fuse-schematics:new my-admin

# CRUD feature — also registers the route, the menu item and i18n keys (idempotent)
cd my-admin
schematics fuse-schematics:crud product --fields "name:string,price:number,active:boolean,status:enum(active|blocked)"

# All CRUD resources from an OpenAPI/Swagger document (file or URL, JSON or YAML)
schematics fuse-schematics:openapi --openapi http://localhost:3000/docs-json

# Existing Angular workspace
ng add fuse-schematics
ng g fuse-schematics:crud product
```

**Schematics**

- `fuse-starter` (`starter`, `new`): options `--directory`, `--skipInstall`, `--skipGit`.
- `fuse-feature` (`feature`, `crud`): options `--fields`, `--openapi`, `--schema`, `--path`, `--project`, `--prefix`, `--skipForm`, `--skipRoute`, `--skipNav`, `--skipI18n`.
- `fuse-openapi` (`openapi`): one CRUD feature per `/admin/<name>` resource of an OpenAPI 3 / Swagger 2 document; options `--openapi`, `--include`, `--exclude`, `--force` plus the `fuse-feature` path/registration options.
- `ng-add`: validates the workspace and prints usage; changes no files.

The generated app is **zoneless** (`provideZonelessChangeDetection()`, no zone.js) and uses signal inputs/outputs/queries and the new control flow.

**`--fields`**: comma-separated `name:type`, types `string | int | number | decimal(p,s) | boolean | date | text | json | enum(a|b) | relation(Entity) | relation(Entity[]) | file(kind) | file(kind)[]`, modifiers `unique | index | default(x) | min(n) | max(n) | label(f) | cascade | set-null`, trailing `?` = optional (same syntax as nest-schematics). Generates model interfaces, formly fields (`relation-select` / `upload` / `json` types), grid columns and table filters. OpenAPI `x-relation` / `x-file` give the same result.

**Config file**: `fuse-schematics.json` at the workspace root, `{ "fuse-feature": { "path": "...", "prefix": "..." } }`; CLI flags win.

**Requirements**: Node.js ≥ 20.19, Angular 20.

**License**: MIT (see [LICENSE](LICENSE)). Third-party assets (Heroicons, Flagpack, Inter) are listed in `src/fuse-starter/files/THIRD-PARTY-NOTICES.md`. The starter's layout look is inspired by common admin dashboards; all code is original. "Fuse" in the package name is historical, and the project is not affiliated with the Fuse template or its author.

**Publishing**: done by the package owner with `npm publish` (public on npmjs.org).
