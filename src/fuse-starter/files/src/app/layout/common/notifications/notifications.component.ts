import { DatePipe, NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, signal, viewChild, ViewEncapsulation } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent, UiMediaWatcherService } from '@ui'
import { ButtonDirective } from 'primeng/button'
import { Drawer } from 'primeng/drawer'
import { Popover } from 'primeng/popover'
import { Tooltip } from 'primeng/tooltip'
import { NotificationsService } from './notifications.service'
import { AppNotification } from './notifications.types'

const noop = (): void => undefined

/**
 * Header bell with the unread count. Opens the notification list in a popover (a full-screen drawer
 * below `sm`). Hidden while `NotificationsService.available()` is false.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ButtonDirective, DatePipe, Drawer, NgTemplateOutlet, Popover, RouterLink, Tooltip, TranslocoPipe, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './notifications.component.html',
  styles: `
    .app-notifications-panel.p-popover {
      margin-top: 0;
      width: 22.5rem;
      border: 0;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow:
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    .app-notifications-panel.p-popover::before,
    .app-notifications-panel.p-popover::after {
      display: none;
    }

    .app-notifications-panel .p-popover-content {
      padding: 0;
    }
  `,
})
export class NotificationsComponent {
  private readonly popover = viewChild<Popover>('popover')
  private readonly media = inject(UiMediaWatcherService)

  protected readonly service = inject(NotificationsService)
  protected readonly notifications = this.service.notifications
  protected readonly unreadCount = this.service.unreadCount
  /** Below `sm` the list opens as a full-screen drawer. */
  protected readonly mobile = this.media.is('lt-sm')
  protected readonly drawerOpen = signal(false)

  /** Opens or closes the list. */
  toggle(event: Event): void {
    if (this.mobile()) this.drawerOpen.update((open) => !open)
    else this.popover()?.toggle(event)
  }

  /** Closes the list. */
  close(): void {
    this.drawerOpen.set(false)
    this.popover()?.hide()
  }

  /** Marks the notification read; a no-op when it already is. */
  protected markRead(notification: AppNotification): void {
    if (notification.read) return
    this.service.markRead(notification.id).subscribe({ error: noop })
  }
}
