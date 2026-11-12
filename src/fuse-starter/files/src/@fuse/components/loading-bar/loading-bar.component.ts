import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, ViewEncapsulation, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FuseLoadingService } from '@fuse/services/loading';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
    selector       : 'fuse-loading-bar',
    templateUrl    : './loading-bar.component.html',
    styleUrls      : ['./loading-bar.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'fuseLoadingBar',
    imports        : [ProgressBarModule],
})
export class FuseLoadingBarComponent implements OnChanges
{
    private _fuseLoadingService = inject(FuseLoadingService);

    readonly autoMode = input<boolean>(true);

    // Service state exposed as signals (zoneless-friendly, no manual subscriptions)
    readonly mode = toSignal(this._fuseLoadingService.mode$, {initialValue: 'indeterminate' as const});
    readonly progress = toSignal(this._fuseLoadingService.progress$, {initialValue: 0});
    readonly show = toSignal(this._fuseLoadingService.show$, {initialValue: false});

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On changes
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void
    {
        // Auto mode
        if ( 'autoMode' in changes )
        {
            // Set the auto mode in the service
            this._fuseLoadingService.setAutoMode(coerceBooleanProperty(changes.autoMode.currentValue));
        }
    }
}
