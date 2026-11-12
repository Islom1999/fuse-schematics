import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewContainerRef, ViewEncapsulation, viewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessagesService } from 'app/layout/common/messages/messages.service';
import { Message } from 'app/layout/common/messages/messages.types';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FuseIconComponent } from '@fuse/components/icon';
import { ElementRef } from '@angular/core';

@Component({
    selector: 'messages',
    templateUrl: './messages.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'messages',
    imports: [ButtonModule, TooltipModule, NgClass, NgTemplateOutlet, RouterLink, DatePipe, FuseIconComponent]
})
export class MessagesComponent implements OnInit, OnDestroy
{
    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _messagesService = inject(MessagesService);
    private _overlay = inject(Overlay);
    private _viewContainerRef = inject(ViewContainerRef);

    private readonly _messagesOrigin = viewChild('messagesOrigin', { read: ElementRef });
    private readonly _messagesPanel = viewChild<TemplateRef<any>>('messagesPanel');

    messages: Message[];
    unreadCount: number = 0;
    private _overlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to message changes
        this._messagesService.messages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((messages: Message[]) =>
            {
                // Load the messages
                this.messages = messages;

                // Calculate the unread count
                this._calculateUnreadCount();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Dispose the overlay
        if ( this._overlayRef )
        {
            this._overlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Open the messages panel
     */
    openPanel(): void
    {
        // Return if the messages panel or its origin is not defined
        const _messagesPanel = this._messagesPanel();
        if ( !_messagesPanel || !this._messagesOrigin() )
        {
            return;
        }

        // Create the overlay if it doesn't exist
        if ( !this._overlayRef )
        {
            this._createOverlay();
        }

        // Attach the portal to the overlay
        this._overlayRef.attach(new TemplatePortal(_messagesPanel, this._viewContainerRef));
    }

    /**
     * Close the messages panel
     */
    closePanel(): void
    {
        this._overlayRef.detach();
    }

    /**
     * Mark all messages as read
     */
    markAllAsRead(): void
    {
        // Mark all as read
        this._messagesService.markAllAsRead().subscribe();
    }

    /**
     * Toggle read status of the given message
     */
    toggleRead(message: Message): void
    {
        // Toggle the read status
        message.read = !message.read;

        // Update the message
        this._messagesService.update(message.id, message).subscribe();
    }

    /**
     * Delete the given message
     */
    delete(message: Message): void
    {
        // Delete the message
        this._messagesService.delete(message.id).subscribe();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create the overlay
     */
    private _createOverlay(): void
    {
        // Create the overlay
        this._overlayRef = this._overlay.create({
            hasBackdrop     : true,
            backdropClass   : 'fuse-backdrop-on-mobile',
            scrollStrategy  : this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay.position()
                .flexibleConnectedTo(this._messagesOrigin().nativeElement)
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    {
                        originX : 'start',
                        originY : 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                    {
                        originX : 'start',
                        originY : 'top',
                        overlayX: 'start',
                        overlayY: 'bottom',
                    },
                    {
                        originX : 'end',
                        originY : 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                    },
                    {
                        originX : 'end',
                        originY : 'top',
                        overlayX: 'end',
                        overlayY: 'bottom',
                    },
                ]),
        });

        // Detach the overlay from the portal on backdrop click
        this._overlayRef.backdropClick().subscribe(() =>
        {
            this._overlayRef.detach();
        });
    }

    /**
     * Calculate the unread count
     *
     * @private
     */
    private _calculateUnreadCount(): void
    {
        let count = 0;

        if ( this.messages && this.messages.length )
        {
            count = this.messages.filter(message => !message.read).length;
        }

        this.unreadCount = count;
    }
}
