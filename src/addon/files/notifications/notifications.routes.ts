import { Routes } from '@angular/router'
import { CampaignDetailComponent } from './pages/campaign-detail.component'
import { CampaignSendComponent } from './pages/campaign-send.component'
import { CampaignsListComponent } from './pages/campaigns-list.component'
import { MessagesListComponent } from './pages/messages-list.component'

export default [
  { path: '', component: CampaignsListComponent },
  { path: 'send', component: CampaignSendComponent },
  { path: 'messages', component: MessagesListComponent },
  { path: ':id', component: CampaignDetailComponent },
] satisfies Routes
