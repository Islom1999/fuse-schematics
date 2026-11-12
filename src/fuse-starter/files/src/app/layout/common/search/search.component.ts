import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, HostBinding, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild, ViewEncapsulation, input, output, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations/public-api';
import { debounceTime, filter, map, Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FuseIconComponent } from '@fuse/components/icon';

@Component({
    selector: 'search',
    templateUrl: './search.component.html',
    encapsulation: ViewEncapsulation.None,
    exportAs: 'fuseSearch',
    animations: fuseAnimations,
    imports: [ButtonModule, FuseIconComponent, FormsModule, ReactiveFormsModule, RouterLink, NgTemplateOutlet, NgClass, InputTextModule]
})
export class SearchComponent implements OnChanges, OnInit, OnDestroy
{
    private _elementRef = inject(ElementRef);
    private _httpClient = inject(HttpClient);
    private _renderer2 = inject(Renderer2);
    private _changeDetectorRef = inject(ChangeDetectorRef);

    readonly appearance = input<'basic' | 'bar'>('basic');
    readonly debounce = input<number>(300);
    readonly minLength = input<number>(2);
    readonly search = output<any>();

    opened: boolean = false;
    resultSets: any[];
    searchControl: UntypedFormControl = new UntypedFormControl();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Host binding for component classes
     */
    @HostBinding('class') get classList(): any
    {
        return {
            'search-appearance-bar'  : this.appearance() === 'bar',
            'search-appearance-basic': this.appearance() === 'basic',
            'search-opened'          : this.opened,
        };
    }

    /**
     * Setter for bar search input
     *
     * @param value
     */
    @ViewChild('barSearchInput')
    set barSearchInput(value: ElementRef)
    {
        // If the value exists, it means that the search input
        // is now in the DOM, and we can focus on the input..
        if ( value )
        {
            // Give Angular time to complete the change detection cycle
            setTimeout(() =>
            {
                // Focus to the input element
                value.nativeElement.focus();
            });
        }
    }

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
        // Appearance
        if ( 'appearance' in changes )
        {
            // To prevent any issues, close the
            // search after changing the appearance
            this.close();
        }
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to the search field value changes
        this.searchControl.valueChanges
            .pipe(
                debounceTime(this.debounce()),
                takeUntil(this._unsubscribeAll),
                map((value) =>
                {
                    // Set the resultSets to null if there is no value or
                    // the length of the value is smaller than the minLength
                    // so the autocomplete panel can be closed
                    if ( !value || value.length < this.minLength() )
                    {
                        this.resultSets = null;
                        this._changeDetectorRef.markForCheck();
                    }

                    // Continue
                    return value;
                }),
                // Filter out undefined/null/false statements and also
                // filter out the values that are smaller than minLength
                filter(value => value && value.length >= this.minLength()),
            )
            .subscribe((value) =>
            {
                this._httpClient.post('api/common/search', {query: value})
                    .subscribe((resultSets: any) =>
                    {
                        // Store the result sets
                        this.resultSets = resultSets;

                        // Mark for check (zoneless change detection)
                        this._changeDetectorRef.markForCheck();

                        // Execute the event
                        this.search.emit(resultSets);
                    });
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On keydown of the search input
     *
     * @param event
     */
    onKeydown(event: KeyboardEvent): void
    {
        if ( event.code === 'Escape' && this.appearance() === 'bar' )
        {
            this.close();
        }
    }

    /**
     * Open the search
     * Used in 'bar'
     */
    open(): void
    {
        // Return if it's already opened
        if ( this.opened )
        {
            return;
        }

        // Open the search
        this.opened = true;
    }

    /**
     * Close the search
     * * Used in 'bar'
     */
    close(): void
    {
        // Return if it's already closed
        if ( !this.opened )
        {
            return;
        }

        // Clear the search input
        this.searchControl.setValue('');
        this.resultSets = null;

        // Close the search
        this.opened = false;
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
}
