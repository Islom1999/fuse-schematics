import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { ToastModule } from 'primeng/toast'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-auto w-full h-full' },
  template: `
    <router-outlet />
    <p-toast [breakpoints]="{ '640px': { width: 'calc(100vw - 2rem)', right: '1rem', left: '1rem' } }" />
  `,
})
export class AppComponent {}
