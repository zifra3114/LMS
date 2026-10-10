
import { Routes } from '@angular/router';

import { QuizFormComponent } from './features/admin/quizzes/quiz-form';
import { QuizzesComponent } from './features/admin/quizzes/quizzes';

import { AdminLoginComponent } from './features/admin/auth/login/login';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';
import { CoursesComponent } from './features/admin/courses/courses';
import { StudentsComponent } from './features/students/students';
import { ComingSoonComponent } from './features/admin/coming-soon/coming-soon';

import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

const upcoming = [
  'assignments',
  'announcements',
  'earnings',
  'reports',
  'add-ons',
  'settings',
];

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

      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Dashboard | EduCore',
      },
      {
        path: 'courses',
        component: CoursesComponent,
        title: 'Courses | EduCore',
      },
      {
        path: 'students',
        component: StudentsComponent,
        title: 'Students | EduCore',
      },

      // Quiz pages
      {
        path: 'quizzes',
        component: QuizzesComponent,
        title: 'Quizzes | EduCore',
      },
      {
        path: 'quizzes/new',
        component: QuizFormComponent,
        title: 'Create Quiz | EduCore',
      },

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