import { Routes } from '@angular/router'
import { AdminsListComponent } from './admins/pages/admins-list.component'
import { RolesListComponent } from './roles/pages/roles-list.component'

export default [
  { path: '', pathMatch: 'full', redirectTo: 'admins' },
  { path: 'admins', component: AdminsListComponent },
  { path: 'roles', component: RolesListComponent },
] satisfies Routes
