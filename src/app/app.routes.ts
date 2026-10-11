import { Routes } from '@angular/router';

// Admin Auth
import { AdminLoginComponent } from './features/admin/auth/login/login';

// Admin Layout & Dashboard
import { AdminLayoutComponent } from './features/admin/layout/admin-layout';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';

// Courses & Students
import { CoursesComponent } from './features/admin/courses/courses';
import { StudentsComponent } from './features/students/students';

// Quizzes
import { QuizFormComponent } from './features/admin/quizzes/quiz-form';
import { QuizzesComponent } from './features/admin/quizzes/quizzes.component';
import { QuizDetailsComponent } from './features/admin/quizzes/quiz-details';

// Assignments
import { AssignmentsComponent } from './features/admin/assignments/assignments';
import { AssignmentFormComponent } from './features/admin/assignments/assignment-form';
import { AssignmentDetailsComponent } from './features/admin/assignments/assignment-details';

// Coming Soon
import { ComingSoonComponent } from './features/admin/coming-soon/coming-soon';

// Guards
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

const upcoming = [
  'announcements',
  'earnings',
  'reports',
  'add-ons',
  'settings',
];

export const routes: Routes = [
  // Admin Login
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    canActivate: [guestGuard],
    title: 'Admin Login | EduCore',
  },

  // Admin Panel
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // Dashboard
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Dashboard | EduCore',
      },

      // Courses
      {
        path: 'courses',
        component: CoursesComponent,
        title: 'Courses | EduCore',
      },

      // Students
      {
        path: 'students',
        component: StudentsComponent,
        title: 'Students | EduCore',
      },

      // Quizzes List
      {
        path: 'quizzes',
        component: QuizzesComponent,
        title: 'Quizzes | EduCore',
      },

      // Create Quiz
      {
        path: 'quizzes/new',
        component: QuizFormComponent,
        title: 'Create Quiz | EduCore',
      },

      // View Quiz Details
      {
        path: 'quizzes/:id/view',
        component: QuizDetailsComponent,
        title: 'Quiz Details | EduCore',
      },

      // Edit Quiz
      {
        path: 'quizzes/:id/edit',
        component: QuizFormComponent,
        title: 'Edit Quiz | EduCore',
      },

      // Assignments: list page stays visible behind the create / view / edit modals
      {
        path: 'assignments',
        component: AssignmentsComponent,
        title: 'Assignments | EduCore',
        children: [
          {
            path: 'new',
            component: AssignmentFormComponent,
            title: 'Create Assignment | EduCore',
          },
          {
            path: ':id/view',
            component: AssignmentDetailsComponent,
            title: 'Assignment Details | EduCore',
          },
          {
            path: ':id/edit',
            component: AssignmentFormComponent,
            title: 'Edit Assignment | EduCore',
          },
        ],
      },

      // Upcoming Features
      ...upcoming.map((path) => ({
        path,
        component: ComingSoonComponent,
        title: 'EduCore Admin',
      })),
    ],
  },

  // Default Route
  {
    path: '',
    redirectTo: 'admin/login',
    pathMatch: 'full',
  },

  // Unknown Routes
  {
    path: '**',
    redirectTo: 'admin/login',
  },
];