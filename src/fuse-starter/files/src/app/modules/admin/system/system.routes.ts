import { Routes } from '@angular/router'
import { AdminsListComponent } from './admins/pages/admins-list.component'
import { RolesListComponent } from './roles/pages/roles-list.component'

export default [
  { path: 'admins', component: AdminsListComponent },
  // Search hits link to '/admins/<id>' and '/roles/<id>'; the lists open records in a dialog.
  { path: 'admins/:id', redirectTo: 'admins' },
  { path: 'roles', component: RolesListComponent },
  { path: 'roles/:id', redirectTo: 'roles' },
] satisfies Routes
