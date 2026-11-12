import { TableQueryDTO } from 'app/shared/services/base-crud.service'

/**
 * Prepares the query built by `GridService` for the backend `pagination` routes:
 * - the `search` filter becomes `globalFilter` (the backend searches several columns with it)
 * - the filters named in `exact` use `matchMode: 'equals'` (enums such as status or type)
 */
export function toTableQuery(params: TableQueryDTO, exact: readonly string[] = []): TableQueryDTO {
  const filters: Record<string, unknown> = { ...(params.filters ?? {}) }
  const search = filters['search']
  delete filters['search']

  for (const key of exact) {
    const rule = filters[key]
    if (rule && typeof rule === 'object') {
      filters[key] = { ...rule, matchMode: 'equals' }
    }
  }

  const value = search && typeof search === 'object' ? (search as { value?: unknown }).value : search
  const globalFilter = value === undefined || value === null || value === '' ? (params.globalFilter ?? null) : String(value)
  return { ...params, filters, globalFilter }
}
