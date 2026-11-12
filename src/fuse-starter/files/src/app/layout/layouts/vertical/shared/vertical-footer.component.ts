import { ChangeDetectionStrategy, Component } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

/** Bottom bar of the vertical layouts with the copyright line. */
@Component({
  selector: 'app-vertical-footer',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <footer
      class="relative z-49 flex h-14 w-full flex-0 items-center border-t bg-card px-4 md:px-6 dark:bg-transparent print:hidden"
    >
      <span class="font-medium text-secondary">{{
        'layout.footer.copyright' | transloco: params
      }}</span>
    </footer>
  `,
})
export class VerticalFooterComponent {
  protected readonly params = { year: new Date().getFullYear() }
}
