import { CampaignStatus, PushStatus } from './campaign.model'

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary'

/** Tag colour of a campaign status. */
export const CAMPAIGN_STATUS_SEVERITY: Record<CampaignStatus, TagSeverity> = {
  scheduled: 'info',
  sending: 'warn',
  sent: 'success',
  failed: 'danger',
}

/** Tag colour of the push status of one notification. */
export const PUSH_STATUS_SEVERITY: Record<PushStatus, TagSeverity> = {
  pending: 'warn',
  sent: 'success',
  failed: 'danger',
  skipped: 'secondary',
}
