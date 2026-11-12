import { ChangeDetectionStrategy, Component, input, model } from '@angular/core'

/**
 * Themed content card.
 *
 * Slots: `[card-header]`, default content, `[card-footer]`.
 * With `flippable`, the `[card-back]` slot is shown on the back side; flip it with
 * `[(flipped)]` or by calling `toggle()` through a template reference.
 *
 *   <app-card flippable #card>
 *     <div card-header>Title</div>
 *     Front content
 *     <div card-back>Back content</div>
 *     <button card-footer (click)="card.toggle()">Flip</button>
 *   </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-card',
    '[class.app-card-flippable]': 'flippable()',
    '[class.app-card-flipped]': 'flippable() && flipped()',
  },
})
export class CardComponent {
  readonly flippable = input(false, { transform: (v: boolean | string) => v !== false && v !== 'false' })
  readonly flipped = model(false)

  toggle(): void {
    this.flipped.update((v) => !v)
  }
}
