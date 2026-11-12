import * as fs from "fs";
import * as path from "path";

const starterRoot = path.join(__dirname, "files");
const read = (file: string) => fs.readFileSync(path.join(starterRoot, file), "utf-8");
const SYSTEM = "src/app/modules/admin/system";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(starterRoot, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

describe("fuse-starter system pages", () => {
  it("ships the admins and roles pages", () => {
    for (const file of [
      "system.routes.ts",
      "admins/common/admin.service.ts",
      "admins/common/admin-grid.service.ts",
      "admins/pages/admins-list.component.ts",
      "admins/pages/admin-form.component.ts",
      "admins/pages/admin-security.component.ts",
      "roles/common/role.service.ts",
      "roles/common/role-grid.service.ts",
      "roles/pages/roles-list.component.ts",
      "roles/pages/role-form.component.ts",
      "roles/pages/permission-picker.component.ts",
    ]) {
      expect(fs.existsSync(path.join(starterRoot, SYSTEM, file))).withContext(file).toBe(true);
    }
  });

  it("registers the lazy system route in app.routes.ts", () => {
    expect(read("src/app/app.routes.ts")).toContain(
      "{ path: '', loadChildren: () => import('app/modules/admin/system/system.routes') }"
    );
  });

  it("puts admins and roles in all four navigation arrays with the backend links", () => {
    const nav = read("src/app/core/navigation/navigation.ts");
    expect(nav.split("'/admins'").length - 1).toBe(4);
    expect(nav.split("'/roles'").length - 1).toBe(4);
    expect(nav).not.toContain("'system'");
  });

  it("gates the pages with permissions", () => {
    const list = read(`${SYSTEM}/admins/pages/admins-list.component.ts`);
    expect(list).toContain("hasPermission('admin.read')");
    expect(list).toContain("hasPermission('admin.write')");
    expect(read(`${SYSTEM}/roles/pages/roles-list.component.ts`)).toContain("hasPermission('role.write')");
  });

  for (const language of ["en", "tr"]) {
    it(`${language}.json has every static admin.system.* and admin.common.* key the pages use`, () => {
      const json = JSON.parse(read(`src/assets/i18n/${language}.json`));
      const lookup = (key: string) => key.split(".").reduce((acc: any, p) => (acc == null ? acc : acc[p]), json);
      const files = [...walk(SYSTEM), ...walk("src/app/shared/components/sessions-panel")];
      let checked = 0;
      for (const file of files) {
        const text = read(file);
        for (const m of text.matchAll(/['"`](admin\.(?:system|common|sessions|grid)\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*\.?)['"`]/g)) {
          expect(lookup(m[1].replace(/\.$/, "")) != null).withContext(`${language}: ${m[1]} (${file})`).toBe(true);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(20);
    });
  }
});
