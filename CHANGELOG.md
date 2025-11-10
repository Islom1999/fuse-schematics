# Changelog

Barcha muhim o'zgarishlar ushbu faylda hujjatlashtiriladi.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) ga asoslangan,
va bu loyiha [Semantic Versioning](https://semver.org/spec/v2.0.0.html) dan foydalanadi.

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
