# Fuse Schematics

[![CI](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml/badge.svg)](https://github.com/Islom1999/fuse-schematics/actions/workflows/ci.yml)
![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)
![Registry: GitHub Packages](https://img.shields.io/badge/registry-GitHub%20Packages-blue.svg)

Fuse Admin (Angular 20) loyihalarini va CRUD feature modullarini avtomatik generatsiya qiluvchi Angular schematics to'plami.

> **Private paket.** Faqat GitHub Packages orqali, ruxsat berilgan foydalanuvchilar uchun tarqatiladi. Yaratilgan loyiha Fuse Admin shabloniga asoslangan, shuning uchun har bir foydalanuvchida (jamoada) o'zining amaldagi [Fuse litsenziyasi](https://themeforest.net/licenses/standard) bo'lishi shart. Batafsil: [LICENSE](LICENSE).

> English version: [see below](#english)

## Xususiyatlari

- **Tez loyiha yaratish** — to'liq sozlangan Fuse Admin Angular 20 loyihasi bitta buyruq bilan (`npm install` va `git init` ham avtomatik)
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

### 1. GitHub Packages'ga ulanish (bir marta)

Paket GitHub Packages'da turadi, shuning uchun `read:packages` huquqli GitHub token kerak ([Settings → Developer settings → Personal access tokens (classic)](https://github.com/settings/tokens)). Repozitoriyaga ham o'qish ruxsatingiz bo'lishi kerak.

`~/.npmrc` (yoki loyiha ildizidagi `.npmrc`) fayliga qo'shing:

```ini
@islom1999:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

va tokenni muhit o'zgaruvchisiga yozing (tokenni `.npmrc` ichiga to'g'ridan-to'g'ri yozib, git'ga commit qilmang):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### 2. Global o'rnatish (tavsiya etiladi)

```bash
npm install -g @angular-devkit/schematics-cli
npm install -g @islom1999/fuse-schematics
```

### 3. Mavjud Angular loyihaga qo'shish

```bash
ng add @islom1999/fuse-schematics
```

## Tezkor boshlash

```bash
# 1. Yangi loyiha (npm install va git init avtomatik bajariladi)
schematics @islom1999/fuse-schematics:new elektron-tijorat-admin
cd elektron-tijorat-admin

# 2. CRUD modullar — route, menyu va tarjimalar avtomatik qo'shiladi
schematics @islom1999/fuse-schematics:crud mahsulot --fields "name:string,price:number,active:boolean,status:enum(active|blocked)"
schematics @islom1999/fuse-schematics:crud kategoriya

# 3. Ishga tushirish
npm start
```

Angular CLI orqali ham ishlaydi:

```bash
ng g @islom1999/fuse-schematics:crud mahsulot --fields "name:string,price:number"
```

## Schematicslar

### 1. fuse-starter

To'liq Fuse Admin Angular 20 starter loyihasini yaratadi.

```bash
schematics @islom1999/fuse-schematics:fuse-starter <loyiha-nomi> [opsiyalar]
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
schematics @islom1999/fuse-schematics:crud <feature-nomi> [opsiyalar]
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
schematics @islom1999/fuse-schematics:openapi --openapi http://localhost:3000/docs-json

# Fayldan, faqat tanlangan resurslar
schematics @islom1999/fuse-schematics:openapi --openapi ./swagger.json --include mahsulot,kategoriya

# Bitta modul, aniq sxemadan
schematics @islom1999/fuse-schematics:crud buyurtma --openapi ./swagger.json --schema CreateBuyurtmaDto
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
ng add @islom1999/fuse-schematics
```

Paketni `devDependencies` ga qo'shadi, workspace Angular (va Fuse) loyihasi ekanini tekshiradi va foydalanish bo'yicha yo'riqnoma chiqaradi. Hech qanday faylni o'zgartirmaydi.

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

```bash
schematics @islom1999/fuse-schematics:crud mahsulot \
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

### GitHub Packages'ga yuklash

`write:packages` huquqli token bilan (registry `package.json` dagi `publishConfig` dan olinadi):

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx   # write:packages
npm test
npm publish
```

Paket repozitoriya bilan bog'langan: repo private bo'lsa, paket ham private bo'ladi va faqat repo'ga ruxsati borlar o'rnata oladi.

## Talablar va moslik

- **Node.js**: 20.19.0 yoki undan yuqori
- **npm**: 9.0.0 yoki undan yuqori
- **Angular**: 20.x

| Fuse Schematics | Angular | Fuse Admin shablon |
|----------------|---------|---------------------|
| 2.x.x          | 20.x    | 19.0.0 (Angular 20 ga yangilangan) |
| 1.x.x          | 19.x    | 19.0.0             |

## Muammolarni hal qilish

**`404 Not Found` yoki `401 Unauthorized` (o'rnatishda)** — `.npmrc` da `@islom1999:registry` qatori borligini, `GITHUB_TOKEN` o'rnatilganini va tokenda `read:packages` huquqi hamda repo'ga ruxsat borligini tekshiring.

**Buyruq topilmadi**
```bash
npm install -g @angular-devkit/schematics-cli @islom1999/fuse-schematics
```

**Ruxsat rad etildi (Linux/Mac)**
```bash
sudo npm install -g @islom1999/fuse-schematics
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

Proprietary © Islom Karimov. Barcha huquqlar himoyalangan; paketni faqat muallif ruxsati bilan ishlatish mumkin.

`src/fuse-starter/files/` dagi shablon Withinpixels (srcn) muallifligidagi [Fuse Angular Admin Template](https://themeforest.net/item/fuse-angular-angular-admin-template/9851916) asosida qayta ishlangan. Bu qismlar asl muallifga tegishli va [Envato litsenziyasi](https://themeforest.net/licenses/standard) bo'yicha ishlatiladi: har bir foydalanuvchida o'z Fuse litsenziyasi bo'lishi shart. Tafsilotlar: [LICENSE](LICENSE).

## Minnatdorchilik

- [Angular Schematics](https://angular.dev/tools/cli/schematics)
- [Fuse Admin shablon](https://themeforest.net/item/fuse-angular-angular-admin-template/9851916)
- [PrimeNG](https://primeng.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## English

Angular schematics that scaffold **Fuse Admin (Angular 20)** projects and full **CRUD feature modules**.

> **Private package**, distributed via GitHub Packages to authorized users only. The generated project is based on the Fuse Admin template, so every user/team needs their own valid [Fuse license](https://themeforest.net/licenses/standard). See [LICENSE](LICENSE).

Setup: add to `~/.npmrc`

```ini
@islom1999:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

and export a GitHub token with `read:packages` (and access to the repository) as `GITHUB_TOKEN`. Then:

```bash
npm install -g @angular-devkit/schematics-cli @islom1999/fuse-schematics

# New project (runs npm install and git init; use --skip-install / --skip-git to opt out)
schematics @islom1999/fuse-schematics:new my-admin

# CRUD feature — also registers the route, the menu item and i18n keys (idempotent)
cd my-admin
schematics @islom1999/fuse-schematics:crud product --fields "name:string,price:number,active:boolean,status:enum(active|blocked)"

# All CRUD resources from an OpenAPI/Swagger document (file or URL, JSON or YAML)
schematics @islom1999/fuse-schematics:openapi --openapi http://localhost:3000/docs-json

# Existing Angular workspace
ng add @islom1999/fuse-schematics
ng g @islom1999/fuse-schematics:crud product
```

**Schematics**

- `fuse-starter` (`starter`, `new`): options `--directory`, `--skipInstall`, `--skipGit`.
- `fuse-feature` (`feature`, `crud`): options `--fields`, `--openapi`, `--schema`, `--path`, `--project`, `--prefix`, `--skipForm`, `--skipRoute`, `--skipNav`, `--skipI18n`.
- `fuse-openapi` (`openapi`): one CRUD feature per `/admin/<name>` resource of an OpenAPI 3 / Swagger 2 document; options `--openapi`, `--include`, `--exclude`, `--force` plus the `fuse-feature` path/registration options.
- `ng-add`: validates the workspace and prints usage; changes no files.

The generated app is **zoneless** (`provideZonelessChangeDetection()`, no zone.js) and uses signal inputs/outputs/queries and the new control flow.

**`--fields`**: comma-separated `name:type`, types `string | number | boolean | date | text | enum(a|b)`, trailing `?` = optional. Generates model interfaces, formly fields, grid columns and table filters.

**Config file**: `fuse-schematics.json` at the workspace root, `{ "fuse-feature": { "path": "...", "prefix": "..." } }`; CLI flags win.

**Requirements**: Node.js ≥ 20.19, Angular 20. License: proprietary (see [LICENSE](LICENSE)); the Fuse-derived template requires a Fuse license.

**Publishing**: `npm publish` with a `write:packages` token (the registry comes from `publishConfig`).
