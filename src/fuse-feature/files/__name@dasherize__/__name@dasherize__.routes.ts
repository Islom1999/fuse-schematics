import { Routes } from '@angular/router'
import { <%= classify(name) %>Component } from './<%= dasherize(name) %>.component'
import { <%= classify(name) %>FormComponent } from './<%= dasherize(name) %>-form/<%= dasherize(name) %>-form.component'

export const <%= camelize(name) %>Routes: Routes = [
  {
    path: '',
    component: <%= classify(name) %>Component,
  },
  {
    path: 'create',
    component: <%= classify(name) %>FormComponent,
  },
  {
    path: 'edit/:id',
    component: <%= classify(name) %>FormComponent,
  },
]
