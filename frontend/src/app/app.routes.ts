
import { Routes } from '@angular/router';
import { AdminLoginComponent } from './features/admin/auth/login/login';

export const routes: Routes = [
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    title: 'Admin Login | EduCore',
  },
  {
    path: '',
    redirectTo: 'admin/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'admin/login',
  },
];