import { Routes } from '@angular/router';
import { AdminLoginComponent } from './features/admin/auth/login/login';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';
import { CoursesComponent } from './features/admin/courses/courses';
import { StudentsComponent } from './features/students/students';
import { ComingSoonComponent } from './features/admin/coming-soon/coming-soon';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

// Sections without a page yet. Replace an entry with a real route when its page is built.
const upcoming = ['quizzes', 'assignments', 'announcements', 'earnings', 'reports', 'add-ons', 'settings'];

export const routes: Routes = [
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    canActivate: [guestGuard],
    title: 'Admin Login | EduCore',
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent, title: 'Dashboard | EduCore' },
      { path: 'courses', component: CoursesComponent, title: 'Courses | EduCore' },
      { path: 'students', component: StudentsComponent, title: 'Students | EduCore' },
      ...upcoming.map((path) => ({
        path,
        component: ComingSoonComponent,
        title: 'EduCore Admin',
      })),
    ],
  },
  { path: '', redirectTo: 'admin/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'admin/login' },
];