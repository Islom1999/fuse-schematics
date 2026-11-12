export type ApiLogType = 'API' | 'PAYMENT' | 'CRON' | 'AUTH'

/**
 * `admin/server-api-logs`: one logged request or job. The list omits `requestBody` and
 * `responseBody`; `GET :id` returns them.
 */
export interface IApiLog {
  id: string
  type: ApiLogType
  module: string | null
  handler: string | null
  method: string | null
  url: string | null
  statusCode: number | null
  error: string | null
  durationMs: number | null
  userId: string | null
  userType: string | null
  ip: string | null
  requestId: string | null
  serverId: string | null
  requestBody?: unknown
  responseBody?: unknown
  createdAt: string
}

/** `GET admin/server-api-logs/stats/summary` */
export interface IApiLogStats {
  since: string
  total: number
  /** Status 500 and above. */
  serverErrors: number
  /** Status 400 to 499. */
  clientErrors: number
  avgDurationMs: number | null
  maxDurationMs: number | null
  byType: { type: ApiLogType; count: number }[]
  byStatus: { statusCode: number | null; count: number }[]
}
