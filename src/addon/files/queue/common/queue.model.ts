export type QueueDriver = 'redis' | 'memory'
/** States the job list can be asked for. */
export type QueueJobStatus = 'waiting' | 'active' | 'delayed' | 'completed' | 'failed'
/** States `clean` accepts: every one of them except `active`. */
export type QueueCleanStatus = 'completed' | 'failed' | 'delayed' | 'waiting'

export const QUEUE_JOB_STATUSES: readonly QueueJobStatus[] = ['waiting', 'active', 'delayed', 'completed', 'failed']
export const QUEUE_CLEAN_STATUSES: readonly QueueCleanStatus[] = ['completed', 'failed', 'delayed', 'waiting']

/** One row of `GET admin/queues`. */
export interface IQueueInfo {
  /** Use this value as `:queue` in the other routes. */
  name: string
  waiting: number
  active: number
  delayed: number
  completed: number
  failed: number
  paused: boolean
}

/** `GET admin/queues`. With the `memory` driver (no `REDIS_URL`) the jobs are lost on restart. */
export interface IQueueOverview {
  driver: QueueDriver
  queues: IQueueInfo[]
}

/** `GET admin/queues/:queue/jobs` item. */
export interface IQueueJob {
  id: string
  /** For example `mail.send`. */
  name: string
  queue: string
  status: QueueJobStatus
  /** The payload; values of keys like password, token, otp and code are shown as `***`. */
  data: unknown
  attemptsMade: number
  attempts: number | null
  failedReason: string | null
  createdAt: string | null
  processedAt: string | null
  finishedAt: string | null
}

/** `count` is every job in that state, not only the page. */
export interface IQueueJobPage {
  count: number
  data: IQueueJob[]
}

/** Body of `POST admin/queues/:queue/clean`. */
export interface IQueueClean {
  status: QueueCleanStatus
  /** 0 removes every job in that state. */
  olderThanMs: number
}
