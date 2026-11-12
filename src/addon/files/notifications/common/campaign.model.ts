export type CampaignTarget = 'all' | 'users' | 'platform'
export type CampaignPlatform = 'ios' | 'android' | 'web'

/** `admin/notifications/campaigns`: one broadcast. */
export interface ICampaign {
  id: string
  target: CampaignTarget
  filters: { userIds?: string[]; platform?: CampaignPlatform } | null
  type: string
  title: string
  body: string | null
  link: string | null
  image: string | null
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

/** Body of `POST admin/notifications/broadcast`. */
export interface IBroadcast {
  target: CampaignTarget
  /** 1 to 1000 user ids; required when `target` is `users`. */
  userIds?: string[]
  /** Required when `target` is `platform`. */
  platform?: CampaignPlatform
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
}
