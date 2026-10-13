import { Routes } from '@angular/router';

// Main Landing Page
import { HomeComponent } from './features/home/home';

// Admin Auth
import { AdminLoginComponent } from './features/admin/auth/login/login';

// Student Registration
import { StudentRegisterComponent } from './features/students/student-register';

// Auth Pages
import { SetPasswordComponent } from './features/auth/set-password/set-password';

// Admin Layout & Dashboard
import { AdminLayoutComponent } from './features/admin/layout/admin-layout';
import { AdminDashboardComponent } from './features/admin/dashboard/dashboard';

// Courses & Students
import { CoursesComponent } from './features/admin/courses/courses';
import { StudentsComponent } from './features/students/students';
import { SettingsComponent } from './features/admin/settings/settings';

// Batches & Live Classes
import { Batches } from './features/admin/batches/batches';
import { LiveClasses } from './features/admin/liveclasses/live-classes';

// Lectures
import { Lectures } from './features/admin/lectures/lectures';
import { StudentLectures } from './features/students/lectures';

// Quizzes
import { QuizFormComponent } from './features/admin/quizzes/quiz-form';
import { QuizzesComponent } from './features/admin/quizzes/quizzes.component';
import { QuizDetailsComponent } from './features/admin/quizzes/quiz-details';

// Assignments
import { AssignmentsComponent } from './features/admin/assignments/assignments';
import { AssignmentFormComponent } from './features/admin/assignments/assignment-form';
import { AssignmentDetailsComponent } from './features/admin/assignments/assignment-details';

// Announcements
import { AdminAnnouncements } from './features/admin/announcements/announcements';

// Results
import { AdminResults } from './features/admin/results/results';

// Coming Soon
import { ComingSoonComponent } from './features/admin/coming-soon/coming-soon';

// Student Portal
import { StudentLayoutComponent } from './features/students/student-portal/student-layout.component';
import { StudentDashboardComponent } from './features/students/student-portal/student-dashboard.component';
import { StudentProfileComponent } from './features/students/student-portal/student-profile.component';
import { StudentListPageComponent } from './features/students/student-portal/student-list-page.component';
import { STUDENT_TABLES } from './features/students/student-portal/student-data.service';

// Guards
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { studentGuard } from './core/guards/student.guard';

const upcoming: string[] = [];

export const routes: Routes = [

  // Main Landing Page
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'Welcome | EduCore',
  },

  // Student Registration
  // URL: /student/register
  // (Is route ko 'student' portal wale route se UPAR hi rakhein)
  {
    path: 'student/register',
    component: StudentRegisterComponent,
    title: 'Student Registration | EduCore',
  },

  // Student Login (public, NOT inside the admin panel)
  // URL: /student-login
  {
    path: 'student-login',
    loadComponent: () =>
      import('./features/students/student-login.component').then(
        (m) => m.StudentLoginComponent,
      ),
    title: 'Student Login | EduCore',
  },

  // Student Portal (login ke baad)
  // URL: /student/dashboard, /student/profile, ...
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [studentGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: StudentDashboardComponent,
        title: 'Dashboard | EduCore',
      },
      {
        path: 'profile',
        component: StudentProfileComponent,
        title: 'My Profile | EduCore',
      },
      {
        path: 'announcements',
        component: StudentListPageComponent,
        title: 'Announcements | EduCore',
        data: {
          heading: 'Announcements',
          subtitle: 'Latest news and updates for your class.',
          table: STUDENT_TABLES.announcements,
          empty: 'No announcements yet.',
        },
      },
      {
        path: 'lectures',
        component: StudentLectures,
        title: 'Lectures | EduCore',
      },
      {
        path: 'live-classes',
        component: StudentListPageComponent,
        title: 'Live Classes | EduCore',
        data: {
          heading: 'Live Classes',
          subtitle: 'Join your scheduled live sessions.',
          table: STUDENT_TABLES.liveClasses,
          empty: 'No live classes scheduled.',
        },
      },
      {
        path: 'quizzes',
        component: StudentListPageComponent,
        title: 'Quizzes | EduCore',
        data: {
          heading: 'Quizzes',
          subtitle: 'Quizzes assigned to your batch.',
          table: STUDENT_TABLES.quizzes,
          empty: 'No quizzes available.',
        },
      },
      {
        path: 'assignments',
        component: StudentListPageComponent,
        title: 'Assignments | EduCore',
        data: {
          heading: 'Assignments',
          subtitle: 'Your assignments and due dates.',
          table: STUDENT_TABLES.assignments,
          empty: 'No assignments yet.',
        },
      },
      {
        path: 'results',
        component: StudentListPageComponent,
        title: 'Results | EduCore',
        data: {
          heading: 'Results',
          subtitle: 'Your quiz and assignment results.',
          table: STUDENT_TABLES.results,
          own: true,
          empty: 'No results published yet.',
        },
      },
    ],
  },

  // Set Password
  // URL: /auth/set-password
  {
    path: 'auth/set-password',
    component: SetPasswordComponent,
    title: 'Set Password | EduCore',
  },

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

      // Default Admin Route
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

      // Batches
      {
        path: 'batches',
        component: Batches,
        title: 'Batches | EduCore',
      },

      // Live Classes
      {
        path: 'live-classes',
        component: LiveClasses,
        title: 'Live Classes | EduCore',
      },

      // Lectures
      {
        path: 'lectures',
        component: Lectures,
        title: 'Lectures | EduCore',
      },

      // Students
      {
        path: 'students',
        component: StudentsComponent,
        title: 'Students | EduCore',
      },

      // Quizzes
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

      // Assignments
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

      // Settings
      {
        path: 'settings',
        component: SettingsComponent,
        title: 'Settings | EduCore',
      },

      // Announcements
      {
        path: 'announcements',
        component: AdminAnnouncements,
        title: 'Announcements | EduCore',
      },

      // Results
      {
        path: 'results',
        component: AdminResults,
        title: 'Results | EduCore',
      },

      // Upcoming Features
      ...upcoming.map((path) => ({
        path,
        component: ComingSoonComponent,
        title: 'EduCore Admin',
      })),
    ],
  },

  // Unknown Routes
  {
    path: '**',
    redirectTo: '',
  },
];