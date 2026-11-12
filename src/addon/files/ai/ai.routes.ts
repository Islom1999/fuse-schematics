import { Routes } from '@angular/router'
import { AiStatsComponent } from './pages/ai-stats.component'
import { AiUsageComponent } from './pages/ai-usage.component'

export default [
  { path: '', component: AiStatsComponent },
  { path: 'usage', component: AiUsageComponent },
] satisfies Routes
