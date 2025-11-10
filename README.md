# Fuse Schematics

[![npm version](https://badge.fury.io/js/fuse-schematics.svg)](https://www.npmjs.com/package/fuse-schematics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Fuse Admin v19.0.0 loyihalarini va CRUD feature modullarini avtomatik generatsiya qiluvchi Angular schematics to'plami.

## Xususiyatlari

- **Tez Loyiha Yaratish** - Fuse Admin Angular loyihalarini soniyalar ichida yarating  
- **CRUD Modul Generatori** - Grid, form va servislar bilan feature modullarni avtomatik yaratadi  
- **PrimeNG Integratsiyasi** - PrimeNG komponentlari oldindan sozlangan  
- **i18n Tayyor** - Transloco integratsiyasi tayyor holda  
⚡ **TypeScript & Tailwind** - Zamonaviy texnologiyalar va eng yaxshi amaliyotlar  
-️ **Enterprise Patternlar** - BaseTableComponent, BaseCrudService va boshqalar

## Mundarija

- [O'rnatish](#ornatish)
- [Tezkor Boshlash](#tezkor-boshlash)
- [Schematicslar](#schematicslar)
  - [Fuse Starter](#1-fuse-starter)
  - [Fuse Feature](#2-fuse-feature)
- [Misollar](#misollar)
- [API Ma'lumotlari](#api-malumotlari)
- [Rivojlantirish](#rivojlantirish)
- [Hissa Qo'shish](#hissa-qoshish)
- [Litsenziya](#litsenziya)

## O'rnatish

### Global O'rnatish (Tavsiya etiladi)

```bash
npm install -g @angular-devkit/schematics-cli
npm install -g fuse-schematics
```

### Lokal O'rnatish

```bash
npm install --save-dev fuse-schematics
```

## Tezkor Boshlash

### Yangi Loyiha Yaratish

```bash
# Yangi Fuse Admin loyiha yaratish
schematics fuse-schematics:fuse-starter mening-admin-loyiham

# Loyihaga o'tish va bog'liqliklarni o'rnatish
cd mening-admin-loyiham
npm install

# Development serverini ishga tushirish
npm start
```

### CRUD Feature Moduli Qo'shish

```bash
# Fuse loyihangiz ichida
schematics fuse-schematics:fuse-feature mahsulot-boshqaruvi

# Yoki qisqa alias orqali
schematics fuse-schematics:crud foydalanuvchi-boshqaruvi
```

## Schematicslar

### 1. Fuse Starter

300+ oldindan sozlangan fayl bilan to'liq Fuse Admin Angular v19.0.0 starter loyihasini yaratadi.

#### Buyruq

```bash
schematics fuse-schematics:fuse-starter <loyiha-nomi>
```

#### Aliaslar

- `fuse-starter`
- `starter`
- `new`

#### Misol

```bash
schematics fuse-schematics:new mening-dashboard
```

#### Nima Kiradi

Yaratilgan loyihada quyidagilar mavjud:

- ✅ Angular 19.0.0 standalone komponentlar bilan
- ✅ To'liq @fuse kutubxonasi (layoutlar, komponentlar, servislar)
- ✅ PrimeNG UI komponentlari
- ✅ Tailwind CSS 3.x
- ✅ Transloco i18n freymvorki
- ✅ Admin modul strukturasi
- ✅ Autentifikatsiya guardlari va servislari
- ✅ Responsive layoutlar (Classic, Material va boshqalar)
- ✅ Qorong'u/Yorug' tema qo'llab-quvvatlash
- ✅ TypeScript strict rejimi
- ✅ ESLint konfiguratsiyasi

#### Loyiha Strukturasi

```
mening-admin-loyiham/
├── src/
│   ├── @fuse/                    # Fuse kutubxonasi
│   │   ├── components/           # Qayta ishlatiladigan komponentlar
│   │   ├── directives/           # Maxsus direktivalar
│   │   ├── services/             # Asosiy servislar
│   │   └── tailwind/             # Tailwind plaginlari
│   ├── app/
│   │   ├── core/                 # Core modul
│   │   ├── layout/               # Layout komponentlari
│   │   ├── modules/              # Feature modullari
│   │   │   └── admin/            # Admin features
│   │   └── shared/               # Umumiy komponentlar
│   ├── assets/                   # Statik fayllar
│   └── styles/                   # Global stillar
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

### 2. Fuse Feature

Grid ko'rinishi, forma ishlov berish va API integratsiyasi bilan to'liq CRUD feature modulini enterprise patternlar asosida yaratadi.

#### Buyruq

```bash
schematics fuse-schematics:fuse-feature <feature-nomi> [opsiyalar]
```

#### Aliaslar

- `fuse-feature`
- `feature`
- `crud`

#### Opsiyalar

| Opsiya | Turi | Default | Ta'rif |
|--------|------|---------|--------|
| `name` | `string` | *majburiy* | Feature modul nomi (masalan: mahsulot-kategoriyasi) |
| `--path` | `string` | `src/app/modules/admin` | Feature yaratilish yo'li |
| `--prefix` | `string` | `app` | Komponent selector prefiksi |
| `--skipForm` | `boolean` | `false` | Form komponentini o'tkazib yuborish |

#### Misollar

```bash
# Oddiy ishlatish - default joyda yaratadi
schematics fuse-schematics:feature mahsulot

# Maxsus yo'l
schematics fuse-schematics:crud inventar --path=src/app/features

# Maxsus prefiks
schematics fuse-schematics:feature kompaniya --prefix=mening-app

# Form komponentisiz
schematics fuse-schematics:feature hisobot --skipForm
```

#### Yaratilgan Struktura

```
src/app/modules/admin/<feature-nomi>/
├── <feature-nomi>.component.ts        # Asosiy grid komponenti
├── <feature-nomi>.component.html      # Grid shabloni
├── <feature-nomi>.component.scss      # Komponent stillari
├── <feature-nomi>.routes.ts           # Feature marshrutlari
├── <feature-nomi>-form/
│   ├── <feature-nomi>-form.component.ts    # Form komponenti
│   ├── <feature-nomi>-form.component.html  # Form shabloni
│   └── <feature-nomi>-form.component.scss  # Form stillari
└── common/
    ├── <feature-nomi>.model.ts             # TypeScript interfeyslari
    ├── <feature-nomi>.service.ts           # CRUD servisi
    └── <feature-nomi>-grid.service.ts      # Grid ma'lumot servisi
```

#### Yaratilgan Fayllar Tafsiloti

##### Asosiy Komponent (`mahsulot.component.ts`)
```typescript
export class MahsulotComponent extends BaseTableComponent<IMahsulot> {
  gridService = inject(GridService<IMahsulot>)
  formComponent = MahsulotFormComponent
  
  filterConfig: ITableFilterConfig = { /* ... */ }
  columns: IColumn[] = []
}
```

##### Form Komponenti (`mahsulot-form.component.ts`)
```typescript
export class MahsulotFormComponent extends BaseFormComponent<IMahsulot> {
  // Create, update, delete operatsiyalarini amalga oshiradi
  // Forma validatsiyasi va xatolarni boshqarishni o'z ichiga oladi
}
```

##### Marshrutlar (`mahsulot.routes.ts`)
```typescript
export const mahsulotRoutes: Routes = [
  { path: '', component: MahsulotComponent },
  { path: 'create', component: MahsulotFormComponent },
  { path: 'edit/:id', component: MahsulotFormComponent }
]
```

##### Servis (`mahsulot.service.ts`)
```typescript
export class MahsulotService extends BaseCrudService<IMahsulot> {
  constructor() {
    super('admin/mahsulot') // API endpoint
  }
}
```

##### Modellar (`mahsulot.model.ts`)
```typescript
export interface IMahsulot extends IBaseModel { /* ... */ }
export interface IMahsulotCreate { /* ... */ }
export interface IMahsulotUpdate { /* ... */ }
```

## Misollar

### To'liq Ish Jarayoni

```bash
# 1. Yangi Fuse loyiha yaratish
schematics fuse-schematics:new elektron-tijorat-admin
cd elektron-tijorat-admin
npm install

# 2. Feature modullarini yaratish
schematics fuse-schematics:crud mahsulot
schematics fuse-schematics:crud kategoriya
schematics fuse-schematics:crud mijoz --path=src/app/modules/admin
schematics fuse-schematics:crud buyurtma-elementi

# 3. Rivojlantirishni boshlash
npm start
```

### Angular CLI bilan Integratsiya

Siz bu schematicslarni Angular CLI bilan ham ishlatishingiz mumkin:

```bash
ng add fuse-schematics
ng generate fuse-schematics:feature mahsulot
```

### Maxsus Konfiguratsiya

Loyihangiz root papkasida `schematics.json` yarating:

```json
{
  "fuse-feature": {
    "path": "src/app/features",
    "prefix": "meningapp"
  }
}
```

## API Ma'lumotlari

### Bazaviy Klasslar

#### BaseTableComponent
Umumiy grid/jadval funksionalligini taqdim etadi:
- Sahifalash (Pagination)
- Filtrlash (Filtering)
- Saralash (Sorting)
- Qatorni tanlash
- Formalar uchun dialog boshqaruvi

#### BaseFormComponent
Umumiy forma funksionalligini taqdim etadi:
- Yaratish/Tahrirlash rejimini aniqlash
- Forma validatsiyasi
- Submit boshqaruvi
- O'chirish tasdiqlash
- Bekor qilish navigatsiyasi

#### BaseCrudService
CRUD operatsiyalari uchun generic HTTP servisi:
- `getAll()` - Barcha yozuvlarni olish
- `getAllPagination()` - Sahifalangan yozuvlarni olish
- `getById(id)` - Bitta yozuvni olish
- `create(data)` - Yangi yozuv yaratish
- `update(id, data)` - Mavjud yozuvni yangilash
- `delete(id)` - Yozuvni o'chirish

### GridService
Grid ma'lumotlarini olish va holatni boshqarish:
- Server-side sahifalash
- Filtrlash
- Saralash
- Yuklash holatlari

## Rivojlantirish

### Talablar

- Node.js 18.x yoki undan yuqori
- npm 9.x yoki undan yuqori
- Angular CLI 19.x yoki undan yuqori

### O'rnatish

```bash
# Repositoriyani klonlash
git clone https://github.com/yourusername/fuse-schematics.git
cd fuse-schematics

# Bog'liqliklarni o'rnatish
npm install

# Schematicsni build qilish
npm run build

# Lokal test uchun link qilish
npm link
```

### Lokal Test Qilish

```bash
# Schematicsni build qilish
npm run build

# fuse-starter testlash
cd /test-qilinadigan/papka
schematics fuse-schematics:fuse-starter test-app

# fuse-feature testlash
cd test-app
schematics fuse-schematics:feature test-modul
```

### Production uchun Build Qilish

```bash
npm run build
```

### NPM ga Yuklash

```bash
# NPM ga kirish
npm login

# Yuklash
npm publish --access public
```

## Talablar

- **Node.js**: 18.19.0 yoki undan yuqori
- **npm**: 9.0.0 yoki undan yuqori
- **Angular**: 19.0.0 yoki undan yuqori
- **@angular-devkit/schematics-cli**: Eng so'ngi versiya

## Moslik

| Fuse Schematics | Angular | Fuse Admin Shablon |
|----------------|---------|---------------------|
| 1.x.x          | 19.x    | 19.0.0             |

## Muammolarni Hal Qilish

### Umumiy Muammolar

**Muammo: Buyruq topilmadi**
```bash
# Yechim: Global o'rnatish
npm install -g @angular-devkit/schematics-cli fuse-schematics
```

**Muammo: Ruxsat rad etildi**
```bash
# Yechim: Sudo ishlatish (Linux/Mac) yoki administrator sifatida ishga tushirish (Windows)
sudo npm install -g fuse-schematics
```

**Muammo: Shablon fayllari yaratilmayapti**
```bash
# Yechim: NPM keshni tozalash va qayta o'rnatish
npm cache clean --force
npm install -g fuse-schematics
```

## Hissa Qo'shish

Hissangiz xush kelibsiz! Quyidagi qadamlarni bajaring:

1. Repositoriyani fork qiling
2. Feature branch yarating (`git checkout -b feature/ajoyib-feature`)
3. O'zgarishlaringizni commit qiling (`git commit -m 'Ajoyib feature qo'shildi'`)
4. Branch ga push qiling (`git push origin feature/ajoyib-feature`)
5. Pull Request oching

## O'zgarishlar Tarixi

Batafsil o'zgarishlar ro'yxati uchun [CHANGELOG.md](CHANGELOG.md) ga qarang.

## Qo'llab-quvvatlash

- - Email: support@example.com
- - Muammolar: [GitHub Issues](https://github.com/yourusername/fuse-schematics/issues)
- - Muhokamalar: [GitHub Discussions](https://github.com/yourusername/fuse-schematics/discussions)

## Yo'l Xaritasi

- [ ] Schematics uchun unit testlar qo'shish
- [ ] Maxsus shablonlarni qo'llab-quvvatlash
- [ ] Nx workspace bilan integratsiya
- [ ] GraphQL servis generatori
- [ ] Mock ma'lumot generatori
- [ ] E2E test shablonlari

## Litsenziya

MIT © [Sizning Ismingiz]

Tafsilotlar uchun [LICENSE](LICENSE) fayliga qarang.

## Minnatdorchilik

- [Angular Schematics](https://angular.io/guide/schematics) - Rasmiy Angular schematics qo'llanmasi
- [Fuse Admin Shablon](https://themeforest.net/item/fuse-angular-angular-admin-template/9851916) - Asl Fuse shabloni
- [PrimeNG](https://primeng.org/) - UI komponentlar kutubxonasi
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS freymvorki

---

**Angular dasturchilari uchun ❤️ bilan yaratildi**
