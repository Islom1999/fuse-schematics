import { Route } from '@angular/router'
import { initialDataResolver } from 'app/app.resolvers'
import { authGuard } from 'app/core/auth/guards/auth.guard'
import { noAuthGuard } from 'app/core/auth/guards/no-auth.guard'
import { LayoutComponent } from 'app/layout/layout.component'

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'example' },
  // The sign-in page goes here after a successful sign-in without a redirectURL.
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'example' },

  // Guests only
  {
    path: '',
    canActivate: [noAuthGuard],
    canActivateChild: [noAuthGuard],
    component: LayoutComponent,
    data: { layout: 'empty' },
    children: [
      { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },
      { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes') },
      { path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes') },
    ],
  },

  // Signed-in users, empty layout
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: LayoutComponent,
    data: { layout: 'empty' },
    children: [{ path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') }],
  },

  // Admin
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'example', loadChildren: () => import('app/modules/admin/example/example.routes') },
    ],
  },

  { path: '**', redirectTo: 'example' },
]
