/** `GET admin/ai/stats` */
export interface IAiStats {
  since: string
  /** `YYYY-MM-DD` (UTC), first day of the window. */
  from: string
  /** `YYYY-MM-DD` (UTC), last day of the window. */
  to: string
  totals: {
    requests: number
    errors: number
    promptTokens: number
    completionTokens: number
    costUsd: number
    avgLatencyMs: number | null
    cacheHits: number
  }
  /** Oldest day first; only days with requests. */
  byDay: { day: string; requests: number; errors: number; tokens: number; costUsd: number }[]
  /** Every day from `from` to `to`, `0` when idle, oldest first. */
  costByDay: { day: string; costUsd: number }[]
  /** Costliest first. */
  byModel: {
    provider: string
    model: string
    requests: number
    tokens: number
    costUsd: number
    avgLatencyMs: number | null
  }[]
  /** Admin test calls show up as `admin:<uuid>`. */
  topUsers: { userId: string; requests: number; tokens: number; costUsd: number }[]
}

/** Query of `GET admin/ai/stats`: `days` is ignored when `from` is set; `from` and `to` are `YYYY-MM-DD` (at most 366 days apart). */
export interface IAiStatsQuery {
  days?: number
  from?: string
  to?: string
  top?: number
}

/** The quota usage of one user, with the limits (`0` means no limit). Same shape as `GET client/ai/usage`. */
export interface IAiClientUsage {
  day: string
  dailyMessages: number
  dailyMessageLimit: number
  dailyResetAt: string
  month: string
  monthlyTokens: number
  monthlyTokenLimit: number
  monthlyResetAt: string
}

/** Query of `GET admin/ai/usage` (exists only when the back-end has the `--quota` option). */
export interface IAiUsageQuery {
  /** The user uuid, at most 64 characters. */
  userId?: string
  /** `YYYY-MM-DD` (UTC); default is 30 days before `to`. */
  from?: string
  /** `YYYY-MM-DD` (UTC); default is today. At most 366 days after `from`. */
  to?: string
  /** 1 to 1000 (default 100): rows in `daily` and in `monthly`. */
  limit?: number
}

/** `GET admin/ai/usage` */
export interface IAiUsage {
  userId: string | null
  from: string
  to: string
  /** Newest day first, then most tokens. */
  daily: { userId: string; day: string; messages: number; tokens: number }[]
  monthly: { userId: string; month: string; messages: number; tokens: number }[]
  /** Over all rows, not only the returned ones. */
  totals: {
    dailyMessages: number
    dailyTokens: number
    dailyUsers: number
    monthlyMessages: number
    monthlyTokens: number
    monthlyUsers: number
  }
  /** Only with `userId`: that user's usage today and this month, with the limits. */
  current: IAiClientUsage | null
}
