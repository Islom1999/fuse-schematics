# Fuse Schematics

Angular schematics for generating Fuse Admin projects and CRUD feature modules.

## Installation

```bash
npm install -g fuse-schematics
```

Or for local development:

```bash
npm link
```

## Available Schematics

### 1. Fuse Starter (fuse-starter)

Generate a complete Fuse Admin Angular v19.0.0 starter project.

**Usage:**

```bash
schematics fuse-schematics:fuse-starter <project-name>
# or
schematics fuse-schematics:starter <project-name>
# or
schematics fuse-schematics:new <project-name>
```

**Example:**

```bash
schematics fuse-schematics:fuse-starter my-admin-app
cd my-admin-app
npm install
npm start
```

This will create a complete Fuse Admin project with:
- Angular 19.0.0
- PrimeNG components
- Tailwind CSS
- Transloco i18n
- Complete @fuse library
- Admin modules structure

### 2. Fuse Feature (fuse-feature)

Generate a CRUD feature module with grid, form, services, and routes.

**Usage:**

```bash
schematics fuse-schematics:fuse-feature <feature-name> [--path=path] [--prefix=prefix]
# or
schematics fuse-schematics:feature <feature-name>
# or
schematics fuse-schematics:crud <feature-name>
```

**Options:**
- `name` (required): Feature module name (e.g., product-category, user-management)
- `--path` (optional): Path where the feature will be created (default: `src/app/modules/admin`)
- `--prefix` (optional): Component selector prefix (default: `app`)
- `--skipForm` (optional): Skip form component generation (default: `false`)

**Example:**

```bash
# Generate product-category feature in default location
schematics fuse-schematics:fuse-feature product-category

# Generate user-management in custom path
schematics fuse-schematics:fuse-feature user-management --path=src/app/features

# Generate with custom prefix
schematics fuse-schematics:fuse-feature company --prefix=my-app
```

**Generated Structure:**

```
src/app/modules/admin/<feature-name>/
├── <feature-name>.component.ts
├── <feature-name>.component.html
├── <feature-name>.component.scss
├── <feature-name>.routes.ts
├── <feature-name>-form/
│   ├── <feature-name>-form.component.ts
│   ├── <feature-name>-form.component.html
│   └── <feature-name>-form.component.scss
└── common/
    ├── <feature-name>.model.ts
    ├── <feature-name>.service.ts
    └── <feature-name>-grid.service.ts
```

**Generated Files Include:**
- Main grid component extending `BaseTableComponent`
- Form component extending `BaseFormComponent` with create/edit/delete
- Routes with `''`, `'create'`, and `'edit/:id'` paths
- Service extending `BaseCrudService`
- Grid service for table display
- Model interfaces: `IFeature`, `IFeatureCreate`, `IFeatureUpdate`

## Development

### Building

```bash
npm run build
```

### Testing Locally

```bash
# Link for local testing
npm link

# Test fuse-starter
schematics fuse-schematics:fuse-starter test-app

# Test fuse-feature
cd test-app
schematics fuse-schematics:fuse-feature product
```

### Publishing

```bash
npm run build
npm publish
```

## Requirements

- Node.js 18+
- Angular CLI 19+
- @angular-devkit/schematics-cli

## License

MIT
