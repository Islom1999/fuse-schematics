import { Directive } from '@angular/core'

/** Marks the title slot of a `ui-alert`. */
@Directive({ selector: '[uiAlertTitle]', standalone: true, host: { class: 'ui-alert-title-content' } })
export class UiAlertTitleDirective {}

/** Marks a custom icon for a `ui-alert`; it replaces the default icon of the type. */
@Directive({ selector: '[uiAlertIcon]', standalone: true, host: { class: 'ui-alert-icon-content' } })
export class UiAlertIconDirective {}
