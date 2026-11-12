import { DatePipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { ISession } from 'app/shared/models/session.model'
import { ButtonModule } from 'primeng/button'
import { TableModule } from 'primeng/table'
import { TagModule } from 'primeng/tag'

/** Device sessions of an admin or a client user, with revoke buttons. The parent calls the API. */
@Component({
  selector: 'app-sessions-panel',
  imports: [DatePipe, TranslocoPipe, ButtonModule, TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sessions-panel.component.html',
})
export class SessionsPanelComponent {
  readonly sessions = input<ISession[]>([])
  readonly loading = input(false)
  /** Shows the revoke buttons (the parent passes `hasPermission('<resource>.write')`). */
  readonly canRevoke = input(false)

  readonly revoke = output<ISession>()
  readonly revokeAll = output<void>()
}
