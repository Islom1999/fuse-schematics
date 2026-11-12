import { Component, ChangeDetectionStrategy, input } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

export interface IBreadcrumb {
  label: string
  routerLink: string
  queryParams?: { [key: string]: string | number }
  url?: string //for href (NOT IMPLEMENTED YET)
}

@Component({
  selector: 'app-wrapper-basic',
  standalone: true,
  imports: [TranslocoPipe],
  template: `
    <div class="wrapper-container">
      <!-- Header section -->
      <div class="toolbar-left">
        @if (showBc()) {
          <app-breadcrumb></app-breadcrumb>
        } @else {
          @if (breadcrumbs(); as breadcrumbs) {
            <breadcrumb-basic [bc]="breadcrumbs"></breadcrumb-basic>
          }
        }
      </div>

      <!-- Title and actions -->
      <div class="wrapper-title px-6 py-4 flex justify-between items-center">
        <div class="title-left flex items-center gap-4">
          @if (title(); as title) {
            <h1 class="text-3xl font-bold">{{ title | transloco }}</h1>
          }
          <ng-content select="[titleLeft]"></ng-content>
        </div>
        <div class="title-right flex gap-2 items-center">
          <ng-content select="[titleRight]"></ng-content>
        </div>
      </div>

      <!-- Body -->
      <div class="wrapper-body p-6">
        <ng-content select="[body]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .wrapper-container {
        width: 100%;
        height: 100%;
        display: block;
        background: #fafafa;
      }

      .wrapper-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperBasicComponent {
  readonly title = input<string>()
  readonly showBc = input(false)
  readonly breadcrumbs = input<IBreadcrumb[]>()
}
