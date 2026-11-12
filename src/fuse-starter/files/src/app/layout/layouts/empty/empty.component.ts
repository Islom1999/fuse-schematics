import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { UiLoadingBarComponent } from '@ui/components/loading-bar'

/** Chrome-less layout (auth and landing pages): loading bar and router outlet only. */
@Component({
  selector: 'app-empty-layout',
  standalone: true,
  imports: [RouterOutlet, UiLoadingBarComponent],
  templateUrl: './empty.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-auto w-full' },
})
export class EmptyLayoutComponent {}
