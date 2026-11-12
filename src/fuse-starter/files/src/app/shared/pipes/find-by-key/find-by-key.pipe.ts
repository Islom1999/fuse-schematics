import { Pipe, type PipeTransform } from '@angular/core'

/**
 * Looks up items of `source` whose `key` property equals the given value(s).
 *
 *   {{ (product.categoryId | findByKey: 'id' : categories)?.name }}
 *   @for (tag of tagIds | findByKey: 'id' : tags; track tag.id) { ... }
 *
 * A single value returns the matching item (or `undefined`); an array returns the
 * matching items in the same order, skipping values that are not found.
 */
@Pipe({
  name: 'findByKey',
  standalone: true,
})
export class FindByKeyPipe implements PipeTransform {
  transform<T, K extends keyof T>(value: T[K][], key: K, source: readonly T[] | null | undefined): T[]
  transform<T, K extends keyof T>(value: T[K] | null | undefined, key: K, source: readonly T[] | null | undefined): T | undefined
  transform<T, K extends keyof T>(
    value: T[K] | T[K][] | null | undefined,
    key: K,
    source: readonly T[] | null | undefined,
  ): T | T[] | undefined {
    const items = source ?? []

    if (Array.isArray(value)) {
      const index = new Map(items.map((item) => [item[key], item]))
      return value.flatMap((v) => (index.has(v) ? [index.get(v) as T] : []))
    }

    return value == null ? undefined : items.find((item) => item[key] === value)
  }
}
