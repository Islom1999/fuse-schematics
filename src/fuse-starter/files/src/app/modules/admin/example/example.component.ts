import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'

/** Placeholder page shown after sign-in. Replace it with your first feature. */
@Component({
  selector: 'app-example',
  imports: [ButtonModule, InputTextModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <section class="mx-auto flex max-w-screen-xl flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <h1 class="text-2xl font-bold sm:text-3xl">Example</h1>
        <p class="text-secondary mt-1">This page is a placeholder. Generate a feature with the crud schematic.</p>
      </div>

      <div class="bg-card flex flex-wrap items-center gap-4 rounded-xl p-6 shadow">
        <button pButton type="button">Click</button>
        <input pInputText type="text" placeholder="Enter text here" aria-label="Sample text" />
        <p-select [options]="options" placeholder="Select an option" ariaLabel="Sample select" />
      </div>
    </section>
  `,
})
export class ExampleComponent {
  protected readonly options = [1, 2, 3].map((value) => ({ label: `Option ${value}`, value }))
}
