import { Routes } from '@angular/router'
import { <%= classify(name) %>ListComponent, <%= classify(name) %>FormComponent } from './pages'

export const <%= camelize(name) %>Routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: <%= classify(name) %>ListComponent,
      },
      {
        path: 'create',
        component: <%= classify(name) %>FormComponent,
      },
      {
        path: 'edit/:id',
        component: <%= classify(name) %>FormComponent,
      },
    ],
  },
]

export default <%= camelize(name) %>Routes
