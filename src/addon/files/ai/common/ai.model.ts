/** `GET admin/ai/stats` */
export interface IAiStats {
  since: string
  totals: {
    requests: number
    errors: number
    promptTokens: number
    completionTokens: number
    costUsd: number
    avgLatencyMs: number | null
    cacheHits: number
  }
  /** Oldest day first. */
  byDay: { day: string; requests: number; errors: number; tokens: number; costUsd: number }[]
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
