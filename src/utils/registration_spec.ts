import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import {
  NAVIGATION_EXPORTS,
  addLazyRoute,
  addNavigationItem,
  mergeTranslations,
  routesImportPath,
} from "./registration";

const starterApp = path.join(__dirname, "../fuse-starter/files/src/app");
const starterRoutes = fs.readFileSync(path.join(starterApp, "app.routes.ts"), "utf-8");
const starterNavigation = fs.readFileSync(path.join(starterApp, "core/navigation/navigation.ts"), "utf-8");

function syntaxErrors(source: string): number {
  const out = ts.transpileModule(source, { reportDiagnostics: true, fileName: "x.ts" });
  return (out.diagnostics || []).length;
}

const IMPORT = "app/modules/admin/product/product.routes";

describe("addLazyRoute", () => {
  it("inserts the route into the admin children of the starter app.routes.ts", () => {
    const result = addLazyRoute(starterRoutes, "product", IMPORT);
    expect(result.changed).toBe(true);
    expect(result.warning).toBeUndefined();
    expect(syntaxErrors(result.content)).toBe(0);

    const adminBlock = result.content.slice(result.content.indexOf("initialData"));
    expect(adminBlock).toContain(
      `{ path: 'product', loadChildren: () => import('${IMPORT}') }`
    );
    // Inserted after 'example', inside the same children array.
    expect(adminBlock.indexOf("path: 'example'")).toBeLessThan(adminBlock.indexOf("path: 'product'"));
    // Other route groups are untouched.
    const beforeAdmin = result.content.slice(0, result.content.indexOf("initialData"));
    expect(beforeAdmin).not.toContain("product");
  });

  it("is idempotent", () => {
    const once = addLazyRoute(starterRoutes, "product", IMPORT).content;
    const twice = addLazyRoute(once, "product", IMPORT);
    expect(twice.changed).toBe(false);
    expect(twice.content).toBe(once);
    expect(once.split(IMPORT).length - 1).toBe(1);
  });

  it("finds the admin route by its 'example' child when there is no resolver", () => {
    const source = `export const routes = [
  { path: 'a', children: [{ path: 'x' }] },
  {
    path: '',
    children: [
      { path: 'example', loadChildren: () => import('app/example') }
    ]
  }
]`;
    const result = addLazyRoute(source, "product", IMPORT);
    expect(result.changed).toBe(true);
    expect(syntaxErrors(result.content)).toBe(0);
    expect(result.content).toContain(
      `{ path: 'example', loadChildren: () => import('app/example') },\n      { path: 'product'`
    );
    expect(result.content).toContain("{ path: 'a', children: [{ path: 'x' }] }");
  });

  it("handles an empty children array", () => {
    const source = `export const routes = [
  {
    path: '',
    resolve: { initialData: initialDataResolver },
    children: [],
  },
]`;
    const result = addLazyRoute(source, "product", IMPORT);
    expect(result.changed).toBe(true);
    expect(syntaxErrors(result.content)).toBe(0);
    expect(result.content).toContain(`children: [\n      { path: 'product', loadChildren`);
  });

  it("returns a warning and leaves the source untouched when no admin route exists", () => {
    const source = "export const routes = [{ path: 'home', children: [] }]";
    const result = addLazyRoute(source, "product", IMPORT);
    expect(result.changed).toBe(false);
    expect(result.content).toBe(source);
    expect(result.warning).toMatch(/Could not find the admin route/);
  });
});

describe("addNavigationItem", () => {
  const item = {
    id: "product",
    title: "Product",
    icon: "heroicons_outline:rectangle-stack",
    link: "/product",
  };

  it("appends a basic item to all four Fuse navigation arrays", () => {
    const result = addNavigationItem(starterNavigation, item);
    expect(result.changed).toBe(true);
    expect(syntaxErrors(result.content)).toBe(0);
    expect(result.content.split("id   : 'product'").length - 1).toBe(NAVIGATION_EXPORTS.length);
    expect(result.content).toContain(
      [
        "    {",
        "        id   : 'product',",
        "        title: 'Product',",
        "        type : 'basic',",
        "        icon : 'heroicons_outline:rectangle-stack',",
        "        link : '/product'",
        "    }",
      ].join("\n")
    );
    // The 'example' item stays first.
    for (const name of NAVIGATION_EXPORTS) {
      const block = result.content.slice(result.content.indexOf(name));
      expect(block.indexOf("'example'")).toBeLessThan(block.indexOf("'product'"));
    }
  });

  it("is idempotent", () => {
    const once = addNavigationItem(starterNavigation, item).content;
    const twice = addNavigationItem(once, item);
    expect(twice.changed).toBe(false);
    expect(twice.content).toBe(once);
  });

  it("only fills arrays that miss the item and uses prettier style when keys are not aligned", () => {
    const source = `export const defaultNavigation = [
  {
    id: 'product',
    title: 'Product',
  },
]
export const compactNavigation = [
  {
    id: 'example',
    title: 'Example',
  },
]
`;
    const result = addNavigationItem(source, item);
    expect(syntaxErrors(result.content)).toBe(0);
    expect(result.content.split("id: 'product'").length - 1).toBe(2);
    expect(result.content).toContain("    link: '/product',\n  },\n]");
  });

  it("warns when no navigation array exists", () => {
    const result = addNavigationItem("export const x = 1", item);
    expect(result.changed).toBe(false);
    expect(result.warning).toMatch(/No navigation arrays/);
  });
});

describe("mergeTranslations", () => {
  const keys = { admin: { product: { title: "Product", fields: { price: "Price" } } } };

  it("adds missing keys, keeps existing ones and the file indentation", () => {
    const original = '{\n    "welcome-back": "Welcome back",\n    "admin": {\n        "product": {\n            "title": "Mahsulotlar"\n        }\n    }\n}\n';
    const result = mergeTranslations(original, keys);
    expect(result.changed).toBe(true);
    const parsed = JSON.parse(result.content);
    expect(parsed["welcome-back"]).toBe("Welcome back");
    expect(parsed.admin.product.title).toBe("Mahsulotlar");
    expect(parsed.admin.product.fields.price).toBe("Price");
    expect(result.content).toContain('\n    "admin": {\n        "product"');
    expect(result.content.endsWith("}\n")).toBe(true);
  });

  it("respects 2-space indentation and the absence of a trailing newline", () => {
    const result = mergeTranslations('{\n  "a": "b"\n}', keys);
    expect(result.content).toContain('\n  "admin": {\n    "product"');
    expect(result.content.endsWith("}")).toBe(true);
  });

  it("treats flat dotted keys as existing", () => {
    const original = JSON.stringify({ "admin.product.title": "Flat" }, null, 4);
    const parsed = JSON.parse(mergeTranslations(original, keys).content);
    expect(parsed["admin.product.title"]).toBe("Flat");
    expect(parsed.admin.product.title).toBeUndefined();
    expect(parsed.admin.product.fields.price).toBe("Price");
  });

  it("is idempotent", () => {
    const once = mergeTranslations('{\n    "a": "b"\n}\n', keys).content;
    const twice = mergeTranslations(once, keys);
    expect(twice.changed).toBe(false);
    expect(twice.content).toBe(once);
  });

  it("throws on invalid JSON (callers log and continue)", () => {
    expect(() => mergeTranslations("{ nope", keys)).toThrow();
  });
});

describe("routesImportPath", () => {
  it("uses baseUrl-style specifiers for files under sourceRoot", () => {
    expect(
      routesImportPath("src", "src/app/modules/admin/product/product.routes", "/src/app/app.routes.ts")
    ).toBe("app/modules/admin/product/product.routes");
    expect(
      routesImportPath("projects/shop/src", "projects/shop/src/app/x/x.routes.ts", "projects/shop/src/app/app.routes.ts")
    ).toBe("app/x/x.routes");
  });

  it("falls back to a relative specifier outside sourceRoot", () => {
    expect(routesImportPath("src", "libs/feature/x/x.routes", "src/app/app.routes.ts")).toBe(
      "../../libs/feature/x/x.routes"
    );
  });
});
