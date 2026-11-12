import { getFilterValue } from 'app/shared/components/grid/common/grid.service'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { toTableQuery } from 'app/shared/utils/table-query'
import { ApiLogType } from './api-log.model'

/**
 * Typed filters of `POST admin/server-api-logs/pagination` and `GET .../export`. They are AND-ed
 * with the table `filters`; empty ones are ignored.
 */
export interface IApiLogTypedFilters {
  type?: ApiLogType
  /** Upper case, at most 10 characters. */
  method?: string
  /** 100 to 599. */
  statusCode?: number
  /** Case-insensitive "contains" on the URL, at most 200 characters. */
  path?: string
  userId?: string
  /** ISO date-times on `createdAt`, both inclusive. */
  from?: string
  to?: string
  minDurationMs?: number
  maxDurationMs?: number
}

const TEXT_KEYS = ['type', 'method', 'path', 'userId'] as const
const NUMBER_KEYS = ['statusCode', 'minDurationMs', 'maxDurationMs'] as const

/**
 * Splits the table query of the grid into the plain table query (search as `globalFilter`, the
 * remaining column filters) and the typed filters of the route.
 */
export function splitApiLogQuery(params: TableQueryDTO): { table: TableQueryDTO; typed: IApiLogTypedFilters } {
  const table = toTableQuery(params)
  const filters: Record<string, unknown> = { ...(table.filters ?? {}) }
  const typed: IApiLogTypedFilters = {}

  for (const key of TEXT_KEYS) {
    const value = getFilterValue(filters[key])
    delete filters[key]
    if (typeof value === 'string' && value.trim()) (typed as Record<string, unknown>)[key] = value.trim()
  }
  for (const key of NUMBER_KEYS) {
    const value = getFilterValue(filters[key])
    delete filters[key]
    const number = typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN
    if (Number.isFinite(number) && number >= (key === 'statusCode' ? 100 : 0)) (typed as Record<string, unknown>)[key] = number
  }
  if (typed.method) typed.method = typed.method.toUpperCase()

  return { table: { ...table, filters }, typed }
}
