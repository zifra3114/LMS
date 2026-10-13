import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-[#f7f9fc] text-slate-800">

      <!-- Navigation -->
      <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav class="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-10">

          <a routerLink="/" class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-950 text-white shadow-md shadow-slate-300">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/>
                <path d="M6.5 11v5c3.3 2.6 7.7 2.6 11 0v-5"/>
                <path d="M21.5 9v6"/>
              </svg>
            </div>
            <div>
              <span class="block text-xl font-black tracking-tight text-slate-950">EduCore</span>
              <span class="mt-0.5 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                Learning Management System
              </span>
            </div>
          </a>

          <div class="hidden items-center gap-8 md:flex">
            <a href="#features" class="text-sm font-semibold text-slate-600 transition hover:text-blue-700">
              Features
            </a>
            <a href="#portals" class="text-sm font-semibold text-slate-600 transition hover:text-blue-700">
              Portals
            </a>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <a routerLink="/student-login"
              class="inline-flex h-10 items-center gap-2 rounded-[11px] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white sm:px-4">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5 21v-2a7 7 0 0 1 14 0v2"/>
              </svg>
              Student Login
            </a>

            <a routerLink="/admin/login"
              class="inline-flex h-10 items-center gap-2 rounded-[11px] bg-blue-700 px-3 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-slate-950 sm:px-4">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <path d="m10 17 5-5-5-5M15 12H3"/>
              </svg>
              <span class="hidden sm:inline">Admin Login</span>
              <span class="sm:hidden">Admin</span>
            </a>
          </div>
        </nav>
      </header>

      <!-- Hero Section -->
      <section class="relative isolate overflow-hidden bg-[#f7f9fc]">
        <div class="pointer-events-none absolute -right-24 -top-28 -z-10 h-[340px] w-[340px] rounded-full bg-blue-100 opacity-60 blur-[70px]"></div>
        <div class="pointer-events-none absolute -bottom-28 -left-24 -z-10 h-[340px] w-[340px] rounded-full bg-indigo-100 opacity-60 blur-[70px]"></div>

        <div class="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24">

          <!-- Hero Content -->
          <div class="max-w-xl">
            <span class="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.19em] text-blue-700 shadow-sm shadow-slate-200">
              <i class="h-1.5 w-1.5 rounded-full bg-blue-600"></i>
              A smarter way to learn
            </span>

            <h1 class="mt-6 text-4xl font-black leading-[1.12] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[58px]">
              Everything for learning.
              <span class="mt-2 block text-blue-700">All in one place.</span>
            </h1>

            <p class="mt-6 max-w-lg text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Manage courses, attend classes, take assessments and
              track academic progress through one organized learning platform.
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a routerLink="/student/register"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-blue-700 px-6 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-slate-950">
                Student Registration
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>

              <a routerLink="/student-login"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2"/>
                </svg>
                Student Login
              </a>

              <a href="#portals"
                class="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] px-4 text-sm font-bold text-slate-600 transition hover:text-blue-700">
                Explore EduCore
              </a>
            </div>

            <div class="mt-10 grid max-w-md grid-cols-2 gap-5 border-t border-slate-200 pt-6">
              <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-blue-700 ring-1 ring-slate-200">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-extrabold text-slate-900">Structured Learning</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Courses and classes in one place</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-blue-700 ring-1 ring-slate-200">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6"/>
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-extrabold text-slate-900">Academic Progress</p>
                  <p class="mt-1 text-xs leading-5 text-slate-500">Assessments and results</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Dashboard Preview -->
          <div class="mx-auto w-full max-w-[540px] lg:ml-auto">
            <div class="overflow-hidden rounded-[21px] border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.08]">

              <!-- Browser Header -->
              <div class="flex h-12 items-center justify-between bg-slate-950 px-4">
                <div class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
                </div>
                <span class="text-xs font-bold text-slate-400">EduCore Portal</span>
                <svg class="h-4 w-4 text-blue-300" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </div>

              <div class="flex min-h-[360px]">
                <!-- Preview Sidebar -->
                <aside class="hidden w-14 shrink-0 flex-col items-center gap-5 border-r border-slate-200 bg-slate-50 py-5 sm:flex">
                  <div class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-blue-700 text-white">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <svg class="h-5 w-5 text-blue-700" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 10.5 12 3l9 7.5"/>
                    <path d="M5 9v11h14V9M9 20v-7h6v7"/>
                  </svg>
                  <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 5h16v14H4zM8 9h8M8 13h5"/>
                  </svg>
                  <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="4" y="3" width="16" height="18" rx="2"/>
                    <path d="M8 8h8M8 12h8M8 16h4"/>
                  </svg>
                  <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 7v5l3 2"/>
                  </svg>
                </aside>

                <!-- Preview Content -->
                <div class="min-w-0 flex-1 p-4 sm:p-6">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.17em] text-blue-700">Learning overview</p>
                      <h2 class="mt-1 text-xl font-black tracking-tight text-slate-950">
                        Your learning space
                      </h2>
                    </div>
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                      EC
                    </div>
                  </div>

                  <!-- Preview Stats -->
                  <div class="mt-6 grid grid-cols-2 gap-3">
                    <div class="rounded-[14px] border border-slate-200 bg-slate-50/60 p-4">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold text-slate-500">My Courses</span>
                        <svg class="h-4 w-4 text-blue-700" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="1.7"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
                        </svg>
                      </div>
                      <p class="mt-3 text-lg font-black text-slate-950">Learning</p>
                      <p class="mt-1 text-xs text-slate-500">Your enrolled courses</p>
                    </div>

                    <div class="rounded-[14px] border border-slate-200 bg-slate-50/60 p-4">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold text-slate-500">Assessments</span>
                        <svg class="h-4 w-4 text-indigo-700" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="1.7"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <rect x="4" y="3" width="16" height="18" rx="2"/>
                          <path d="M8 8h8M8 12h5M8 16h8"/>
                        </svg>
                      </div>
                      <p class="mt-3 text-lg font-black text-slate-950">Quizzes</p>
                      <p class="mt-1 text-xs text-slate-500">Practice and evaluate</p>
                    </div>
                  </div>

                  <!-- Preview Activity -->
                  <div class="mt-5">
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm font-black text-slate-950">Learning activities</h3>
                      <span class="text-xs text-slate-400">Portal preview</span>
                    </div>

                    <div class="mt-3 divide-y divide-slate-100 rounded-[14px] border border-slate-200 px-4">
                      <div class="flex items-center gap-3 py-3.5">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-700">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 5h16v14H4zM8 9h8M8 13h5"/>
                          </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-extrabold text-slate-800">Course materials</p>
                          <p class="mt-1 text-xs text-slate-500">Lessons and learning resources</p>
                        </div>
                        <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>

                      <div class="flex items-center gap-3 py-3.5">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-indigo-50 text-indigo-700">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
                          </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-extrabold text-slate-800">Announcements</p>
                          <p class="mt-1 text-xs text-slate-500">Class news and updates</p>
                        </div>
                        <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>

                      <div class="flex items-center gap-3 py-3.5">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 19V5M4 19h17m-13-4 4-4 3 3 5-7"/>
                          </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm font-extrabold text-slate-800">Academic progress</p>
                          <p class="mt-1 text-xs text-slate-500">Results and performance</p>
                        </div>
                        <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 flex items-center gap-2 rounded-[11px] bg-slate-50 px-3 py-3 text-xs text-slate-500">
                    <svg class="h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="m5 12 4 4L19 6"/>
                    </svg>
                    A central place for your learning activities
                  </div>
                </div>
              </div>
            </div>

            <p class="mt-3 text-center text-xs text-slate-400">
              Illustrative dashboard preview — not live student data
            </p>
          </div>
        </div>
      </section>

      <!-- Portal Selection -->
      <section id="portals" class="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div class="mx-auto max-w-2xl text-center">
            <p class="text-[10px] font-black uppercase tracking-[0.19em] text-blue-700">
              Get started
            </p>
            <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Choose your portal
            </h2>
            <p class="mt-4 text-base leading-7 text-slate-500">
              Select your role to access the right learning environment.
            </p>
          </div>

          <div class="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2 lg:mt-12">

            <!-- Admin Portal (dark card, like the registration guide card) -->
            <article class="group flex flex-col rounded-[17px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 sm:p-8">
              <div class="flex items-start justify-between">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-blue-300 transition group-hover:bg-blue-600 group-hover:text-white">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3 20 7v5c0 4.5-3.2 7.5-8 9-4.8-1.5-8-4.5-8-9V7l8-4Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <span class="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-slate-300">
                  Administration
                </span>
              </div>

              <h3 class="mt-6 text-xl font-black">Admin Portal</h3>
              <p class="mt-3 flex-1 text-sm leading-6 text-slate-400">
                Manage courses, batches, students, quizzes, announcements
                and settings through your administration dashboard.
              </p>

              <div class="mt-6 space-y-3 border-t border-white/10 pt-5">
                <p class="flex items-center gap-2.5 text-sm text-slate-300">
                  <svg class="h-4 w-4 shrink-0 text-blue-400" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6"/>
                  </svg>
                  Manage courses and batches
                </p>
                <p class="flex items-center gap-2.5 text-sm text-slate-300">
                  <svg class="h-4 w-4 shrink-0 text-blue-400" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6"/>
                  </svg>
                  Manage learning content and users
                </p>
              </div>

              <a routerLink="/admin/login"
                class="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950">
                Continue as Admin
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6"/>
                </svg>
              </a>
            </article>

            <!-- Student Portal -->
            <article class="group flex flex-col rounded-[17px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-900/[0.06] sm:p-8">
              <div class="flex items-start justify-between">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/>
                    <path d="M6.5 11v5c3.3 2.6 7.7 2.6 11 0v-5"/>
                    <path d="M21.5 9v6"/>
                  </svg>
                </div>
                <span class="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Learning
                </span>
              </div>

              <h3 class="mt-6 text-xl font-black text-slate-950">Student Portal</h3>
              <p class="mt-3 flex-1 text-sm leading-6 text-slate-500">
                Access your enrolled courses, assigned quizzes, class
                announcements, results and academic progress.
              </p>

              <div class="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <p class="flex items-center gap-2.5 text-sm text-slate-600">
                  <svg class="h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6"/>
                  </svg>
                  Access your courses and classes
                </p>
                <p class="flex items-center gap-2.5 text-sm text-slate-600">
                  <svg class="h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4L19 6"/>
                  </svg>
                  Take quizzes and view results
                </p>
              </div>

              <div class="mt-7 grid gap-3 sm:grid-cols-2">
                <a routerLink="/student-login"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] bg-blue-700 px-4 text-sm font-bold text-white shadow-md shadow-blue-700/20 transition hover:bg-slate-950">
                  Student Login
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6"/>
                  </svg>
                </a>

                <a routerLink="/student/register"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white">
                  Register
                </a>
              </div>

              <p class="mt-4 text-center text-sm text-slate-500">
                New student?
                <a routerLink="/student/register"
                  class="font-black text-blue-700 hover:text-slate-950">
                  Register here
                </a>
              </p>
            </article>

          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="relative isolate scroll-mt-24 overflow-hidden border-y border-slate-200 bg-[#f7f9fc] py-16 sm:py-20">
        <div class="pointer-events-none absolute -right-24 -top-24 -z-10 h-[300px] w-[300px] rounded-full bg-blue-100 opacity-50 blur-[70px]"></div>
        <div class="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div class="max-w-xl">
            <p class="text-[10px] font-black uppercase tracking-[0.19em] text-blue-700">
              Platform capabilities
            </p>
            <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to learn.
            </h2>
            <p class="mt-4 text-base leading-7 text-slate-500">
              A streamlined platform for everyday academic activities.
            </p>
          </div>

          <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
              <div class="flex h-10 w-10 items-center justify-center rounded-[11px] bg-blue-50 text-blue-700">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-black text-slate-950">Course Management</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Keep course materials and lessons organized.
              </p>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300">
              <div class="flex h-10 w-10 items-center justify-center rounded-[11px] bg-indigo-50 text-indigo-700">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="4" y="3" width="16" height="18" rx="2"/>
                  <path d="M8 8h8M8 12h8M8 16h5"/>
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-black text-slate-950">Assessments</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Access quizzes and review your results.
              </p>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300">
              <div class="flex h-10 w-10 items-center justify-center rounded-[11px] bg-sky-50 text-sky-700">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
                  <path d="M10 21h4"/>
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-black text-slate-950">Announcements</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Keep track of important academic updates.
              </p>
            </article>

            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
              <div class="flex h-10 w-10 items-center justify-center rounded-[11px] bg-slate-950 text-blue-300">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 19V5M4 19h17"/>
                  <path d="m8 15 4-4 3 3 5-7"/>
                </svg>
              </div>
              <h3 class="mt-4 text-sm font-black text-slate-950">Progress Tracking</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Follow your academic performance over time.
              </p>
            </article>

          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-950 text-white">
        <div class="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">

          <a routerLink="/" class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/10 bg-white/10 text-blue-300">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z"/>
                <path d="M6.5 11v5c3.3 2.6 7.7 2.6 11 0v-5"/>
                <path d="M21.5 9v6"/>
              </svg>
            </div>
            <div>
              <p class="font-black">EduCore</p>
              <p class="mt-0.5 text-xs text-slate-400">Learning Management System</p>
            </div>
          </a>

          <p class="text-xs font-bold tracking-wide text-slate-400">
            © EduCore. All rights reserved.
          </p>

          <div class="flex items-center gap-5">
            <a routerLink="/student-login"
              class="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
              Student Login
            </a>
            <a routerLink="/admin/login"
              class="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
              Admin Login
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

    </main>
  `,
})
export class HomeComponent {}