import * as ts from 'typescript';
import * as posixPath from 'path';

/**
 * Pure source-transformation helpers used by fuse-feature to register a
 * generated feature in the host Fuse application (routes, navigation, i18n).
 * Every function is idempotent: running it twice yields the same output as
 * running it once.
 */

export interface SourceEditResult {
  content: string;
  changed: boolean;
  /** Set when the expected anchor could not be found; content is unchanged. */
  warning?: string;
}

interface Edit {
  pos: number;
  text: string;
}

function applyEdits(source: string, edits: Edit[]): string {
  return [...edits]
    .sort((a, b) => b.pos - a.pos)
    .reduce((acc, e) => acc.slice(0, e.pos) + e.text + acc.slice(e.pos), source);
}

function propertyName(prop: ts.ObjectLiteralElementLike): string | undefined {
  if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
    return undefined;
  }
  const name = prop.name;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }
  return undefined;
}

function getProperty(
  obj: ts.ObjectLiteralExpression,
  name: string
): ts.PropertyAssignment | undefined {
  return obj.properties.find(
    (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && propertyName(p) === name
  );
}

function unwrap(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function stringPropertyEquals(
  element: ts.Expression,
  prop: string,
  value: string
): boolean {
  const el = unwrap(element);
  if (!ts.isObjectLiteralExpression(el)) {
    return false;
  }
  const p = getProperty(el, prop);
  if (!p) {
    return false;
  }
  const init = unwrap(p.initializer);
  return (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) && init.text === value;
}

function lineIndentAt(source: string, pos: number): string {
  const lineStart = source.lastIndexOf('\n', pos - 1) + 1;
  const match = /^[ \t]*/.exec(source.slice(lineStart));
  return match ? match[0] : '';
}

/**
 * Builds an edit that appends `itemText` (already indented for the first
 * line, subsequent lines indented by the caller) to `array`, preserving the
 * array's trailing-comma style.
 */
function appendToArray(
  source: string,
  array: ts.ArrayLiteralExpression,
  sf: ts.SourceFile,
  buildItem: (indent: string) => string,
  emptyIndentUnit: string
): Edit {
  const elements = array.elements;
  if (elements.length === 0) {
    const openPos = array.getStart(sf) + 1;
    const baseIndent = lineIndentAt(source, array.getStart(sf));
    const indent = baseIndent + emptyIndentUnit;
    return { pos: openPos, text: `\n${indent}${buildItem(indent)},\n${baseIndent}` };
  }

  const last = elements[elements.length - 1];
  const indent = lineIndentAt(source, last.getStart(sf));
  if (elements.hasTrailingComma) {
    const commaPos = source.indexOf(',', last.getEnd());
    return { pos: commaPos + 1, text: `\n${indent}${buildItem(indent)},` };
  }
  return { pos: last.getEnd(), text: `,\n${indent}${buildItem(indent)}` };
}

function findAll<T extends ts.Node>(root: ts.Node, predicate: (n: ts.Node) => n is T): T[] {
  const result: T[] = [];
  const visit = (node: ts.Node) => {
    if (predicate(node)) {
      result.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return result;
}

/**
 * Locates the `children` array of the admin layout route: the route object
 * whose `resolve` contains `initialData`, or else the one whose children
 * contain `path: 'example'`.
 */
export function findAdminChildrenArray(sf: ts.SourceFile): ts.ArrayLiteralExpression | undefined {
  const candidates = findAll(sf, ts.isObjectLiteralExpression)
    .map((obj) => {
      const children = getProperty(obj, 'children');
      const init = children && unwrap(children.initializer);
      return init && ts.isArrayLiteralExpression(init) ? { obj, children: init } : undefined;
    })
    .filter((c): c is { obj: ts.ObjectLiteralExpression; children: ts.ArrayLiteralExpression } => !!c);

  const byResolve = candidates.find(({ obj }) => {
    const resolve = getProperty(obj, 'resolve');
    const init = resolve && unwrap(resolve.initializer);
    return !!init && ts.isObjectLiteralExpression(init) && !!init.properties.find((p) => propertyName(p) === 'initialData');
  });
  if (byResolve) {
    return byResolve.children;
  }

  const byExample = candidates.find(({ children }) =>
    children.elements.some((el) => stringPropertyEquals(el, 'path', 'example'))
  );
  return byExample?.children;
}

const PRINT_WIDTH = 100;

/** Formats the route object like Prettier (printWidth 100) would. */
function formatRouteObject(routePath: string, importPath: string, indent: string): string {
  const oneLine = `{ path: '${routePath}', loadChildren: () => import('${importPath}') }`;
  if (indent.length + oneLine.length + 1 <= PRINT_WIDTH) {
    return oneLine;
  }
  const inner = `${indent}  `;
  const loadChildren = `loadChildren: () => import('${importPath}'),`;
  const loadLines =
    inner.length + loadChildren.length <= PRINT_WIDTH
      ? `${inner}${loadChildren}`
      : `${inner}loadChildren: () =>\n${inner}  import('${importPath}'),`;
  return `{\n${inner}path: '${routePath}',\n${loadLines}\n${indent}}`;
}

/**
 * Adds `{ path, loadChildren: () => import(importPath) }` to the admin route
 * children in an `app.routes.ts` source.
 */
export function addLazyRoute(
  source: string,
  routePath: string,
  importPath: string,
  fileName = 'app.routes.ts'
): SourceEditResult {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const children = findAdminChildrenArray(sf);
  if (!children) {
    return {
      content: source,
      changed: false,
      warning: `Could not find the admin route (with "resolve: { initialData }" or a child "example" route) in ${fileName}.`,
    };
  }

  const alreadyRegistered =
    children.elements.some((el) => stringPropertyEquals(el, 'path', routePath)) ||
    source.includes(`import('${importPath}')`) ||
    source.includes(`import("${importPath}")`);
  if (alreadyRegistered) {
    return { content: source, changed: false };
  }

  const edit = appendToArray(
    source,
    children,
    sf,
    (indent) => formatRouteObject(routePath, importPath, indent),
    '  '
  );
  return { content: applyEdits(source, [edit]), changed: true };
}

export const NAVIGATION_EXPORTS = [
  'defaultNavigation',
  'compactNavigation',
  'futuristicNavigation',
  'horizontalNavigation',
];

export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  link: string;
  type?: string;
}

/**
 * Appends a `basic` navigation item to each of the Fuse navigation arrays
 * (default, compact, futuristic, horizontal) that does not already contain an
 * item with the same id.
 */
export function addNavigationItem(
  source: string,
  item: NavigationItem,
  fileName = 'navigation.ts'
): SourceEditResult {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const arrays = new Map<string, ts.ArrayLiteralExpression>();

  for (const decl of findAll(sf, ts.isVariableDeclaration)) {
    if (ts.isIdentifier(decl.name) && NAVIGATION_EXPORTS.includes(decl.name.text) && decl.initializer) {
      const init = unwrap(decl.initializer);
      if (ts.isArrayLiteralExpression(init)) {
        arrays.set(decl.name.text, init);
      }
    }
  }

  if (arrays.size === 0) {
    return {
      content: source,
      changed: false,
      warning: `No navigation arrays (${NAVIGATION_EXPORTS.join(', ')}) found in ${fileName}.`,
    };
  }

  // The starter ships navigation.ts with aligned keys (`id   : 'x'`); mirror that.
  const aligned = /\n\s*id\s+:/.test(source);
  const quote = /\n\s*id\s*:\s*"/.test(source) ? '"' : "'";
  const entries: [string, string][] = [
    ['id', item.id],
    ['title', item.title],
    ['type', item.type || 'basic'],
    ['icon', item.icon],
    ['link', item.link],
  ];
  const width = Math.max(...entries.map(([k]) => k.length));
  const escape = (v: string) => v.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), `\\${quote}`);

  const edits: Edit[] = [];
  for (const name of NAVIGATION_EXPORTS) {
    const array = arrays.get(name);
    if (!array || array.elements.some((el) => stringPropertyEquals(el, 'id', item.id))) {
      continue;
    }
    edits.push(
      appendToArray(
        source,
        array,
        sf,
        (indent) => {
          const unit = indent || '    ';
          const lines = entries.map(([k, v], i) => {
            const key = aligned ? `${k.padEnd(width)}:` : `${k}:`;
            const comma = i < entries.length - 1 || !aligned ? ',' : '';
            return `${indent}${unit}${key} ${quote}${escape(v)}${quote}${comma}`;
          });
          return `{\n${lines.join('\n')}\n${indent}}`;
        },
        '    '
      )
    );
  }

  if (edits.length === 0) {
    return { content: source, changed: false };
  }
  return { content: applyEdits(source, edits), changed: true };
}

export type TranslationTree = { [key: string]: string | TranslationTree };

function detectIndent(text: string): string {
  const match = /\n([ \t]+)\S/.exec(text);
  return match ? match[1] : '    ';
}

/**
 * Merges `translations` into a JSON translation file, adding only missing
 * keys (existing values are never overwritten). A key counts as existing when
 * it is present either nested (`{"a":{"b":..}}`) or as a flat dotted key
 * (`{"a.b": ..}`). Keeps the file's indentation and trailing newline.
 */
export function mergeTranslations(jsonText: string, translations: TranslationTree): SourceEditResult {
  const data = jsonText.trim() === '' ? {} : JSON.parse(jsonText);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { content: jsonText, changed: false, warning: 'Translation file is not a JSON object.' };
  }

  let changed = false;
  const merge = (target: Record<string, any>, source: TranslationTree, prefix: string) => {
    for (const [key, value] of Object.entries(source)) {
      const flatKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        if (!(key in target) && !(flatKey in data)) {
          target[key] = value;
          changed = true;
        }
        continue;
      }
      if (flatKey in data && typeof data[flatKey] === 'string') {
        continue;
      }
      if (!(key in target)) {
        // Only create the branch if at least one leaf is not already flat.
        const branch: Record<string, any> = {};
        merge(branch, value, flatKey);
        if (Object.keys(branch).length > 0) {
          target[key] = branch;
        }
        continue;
      }
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        merge(target[key], value, flatKey);
      }
    }
  };
  merge(data, translations, '');

  if (!changed) {
    return { content: jsonText, changed: false };
  }
  const trailingNewline = jsonText.endsWith('\n') || jsonText.trim() === '';
  const content = JSON.stringify(data, null, detectIndent(jsonText)) + (trailingNewline ? '\n' : '');
  return { content, changed: true };
}

/**
 * Computes the module specifier used in app.routes.ts for a feature's routes
 * file. Paths under `sourceRoot` become `baseUrl`-relative (`app/...`, the
 * Fuse convention); anything else becomes relative to the routes file.
 */
export function routesImportPath(
  sourceRoot: string,
  featureRoutesFile: string,
  appRoutesFile: string
): string {
  const clean = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.ts$/, '');
  const root = clean(sourceRoot).replace(/\/+$/, '');
  const target = clean(featureRoutesFile);
  if (root && target.startsWith(`${root}/`)) {
    return target.slice(root.length + 1);
  }
  if (!root) {
    return target;
  }
  let rel = posixPath.posix.relative(posixPath.posix.dirname(clean(appRoutesFile)), target);
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  return rel;
}
