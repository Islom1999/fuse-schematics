export type CampaignTarget = 'all' | 'users' | 'platform' | 'topic'
export type CampaignPlatform = 'ios' | 'android' | 'web'
/** `scheduled` until `sendAt`; `failed` means the scheduled send threw (rows saved before that are kept, no retry). */
export type CampaignStatus = 'scheduled' | 'sending' | 'sent' | 'failed'
export type PushStatus = 'pending' | 'sent' | 'failed' | 'skipped'

/** `admin/notifications/campaigns`: one broadcast. */
export interface ICampaign {
  id: string
  target: CampaignTarget
  filters: { userIds?: string[]; platform?: CampaignPlatform; topic?: string } | null
  type: string
  title: string
  body: string | null
  link: string | null
  image: string | null
  status: CampaignStatus
  /** When a scheduled campaign goes out; `null` for an immediate one. */
  sendAt: string | null
  sentCount: number
  failedCount: number
  createdById: string | null
  createdAt: string
}

/** `GET admin/notifications/campaigns/:id`. With the back-end `queue` add-on the counts grow after the send. */
export interface ICampaignDetail {
  campaign: ICampaign
  stats: {
    total: number
    read: number
    pushPending: number
    pushSent: number
    pushFailed: number
    pushSkipped: number
  }
}

/** Topic names: letters, digits and `_ . ~ % -`, 1 to 100 characters. */
export const TOPIC_PATTERN = /^[A-Za-z0-9_.~%-]{1,100}$/

/** Body of `POST admin/notifications/broadcast`. */
export interface IBroadcast {
  target: CampaignTarget
  /** 1 to 1000 user ids; required when `target` is `users`. */
  userIds?: string[]
  /** Required when `target` is `platform`. */
  platform?: CampaignPlatform
  /** Required when `target` is `topic`: the users who subscribed to it (per-user subscriptions, not FCM topics). */
  topic?: string
  /** Default `general`; letters, digits, `_`, `.`, `-`, at most 50. */
  type?: string
  /** At most 200 characters. */
  title: string
  /** At most 4000 characters. */
  body?: string
  /** A path or a URL, at most 1000 characters. */
  link?: string
  /** An http(s) URL. */
  image?: string
  meta?: Record<string, unknown>
  /** ISO date-time in the future (400 otherwise); the campaign then has `status: 'scheduled'`. */
  sendAt?: string
}

/** `admin/notifications`: one message delivered to one user. */
export interface INotification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  link: string | null
  image: string | null
  meta: Record<string, unknown> | null
  readAt: string | null
  campaignId: string | null
  pushStatus: PushStatus
  pushAttempts: number
  pushError: string | null
  createdAt: string
}
