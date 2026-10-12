
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';

import {
  DataTableComponent,
  TableColumn,
} from '../../../shared/components/data-table/data-table';

import { IconName } from '../../../shared/components/icon/icon';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CourseService, Course } from '../../../core/services/course.service';
import {
  LiveClass,
  LiveClassService,
} from '../../../core/services/liveclass.service';

import { RealtimeChannel } from '@supabase/supabase-js';

type ProfileRole = 'admin' | 'teacher' | 'student';

interface DashboardProfile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string | null;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatCardComponent,
    DataTableComponent,
  ],
  template: `
    <main class="min-h-full bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div class="mx-auto max-w-[1400px] space-y-6 pb-8">

        <!-- Page Header -->
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <app-page-header
            title="Dashboard"
            subtitle="Real-time overview of your learning management system"
          />

          <button
            type="button"
            (click)="load()"
            [disabled]="loading()"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            <svg
              class="h-4 w-4"
              [class.animate-spin]="loading()"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20 7v5h-5M4 17v-5h5"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.6 9A7 7 0 0 1 17.3 5.7L20 8M4 16l2.7 2.3A7 7 0 0 0 18.4 15"
              />
            </svg>
            {{ loading() ? 'Refreshing...' : 'Refresh Data' }}
          </button>
        </div>

        <!-- Error Message -->
        @if (errorMessage()) {
          <section
            class="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
          >
            <div class="flex items-start gap-3">
              <svg
                class="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" d="M12 8v5M12 16h.01" />
              </svg>

              <div>
                <p class="text-sm font-bold text-red-800">
                  Dashboard data could not be loaded
                </p>
                <p class="mt-1 text-sm text-red-700">
                  {{ errorMessage() }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="load()"
              class="self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:self-center"
            >
              Try Again
            </button>
          </section>
        }

        <!-- Welcome Banner: Settings Theme -->
        <section
          class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 px-5 py-7 text-white shadow-lg shadow-blue-200/40 sm:px-8 sm:py-9"
        >
          <div
            class="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10"
          ></div>

          <div
            class="pointer-events-none absolute -right-2 -top-10 h-48 w-48 rounded-full border border-white/10"
          ></div>

          <div
            class="pointer-events-none absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/5"
          ></div>

          <div class="relative z-10 max-w-2xl">
            <div
              class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 12l2-2 4 4L19 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5"
                />
              </svg>
              Admin Control Center
            </div>

            <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome to your Dashboard
            </h1>

            <p class="mt-3 max-w-xl text-sm leading-6 text-blue-100/85 sm:text-base">
              Manage students, teachers, courses and live classes from one place.
              Monitor the latest records directly from your LMS database.
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <div
                class="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
              >
                <svg
                  class="h-4 w-4 text-blue-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {{ lastUpdatedLabel() }}
              </div>

              <div
                class="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  [class.bg-emerald-400]="realtimeStatus() === 'Connected'"
                  [class.animate-pulse]="realtimeStatus() === 'Connected'"
                  [class.bg-amber-300]="realtimeStatus() === 'Connecting'"
                  [class.bg-rose-300]="realtimeStatus() === 'Unavailable'"
                ></span>

                {{
                  realtimeStatus() === 'Connected'
                    ? 'Real-time connected'
                    : realtimeStatus() === 'Connecting'
                      ? 'Connecting to updates...'
                      : 'Refresh available'
                }}
              </div>
            </div>
          </div>

          <!-- Academic Illustration -->
          <div
            class="pointer-events-none absolute bottom-5 right-8 hidden h-32 w-32 items-center justify-center rounded-3xl border border-white/15 bg-white/10 lg:flex"
          >
            <svg
              class="h-20 w-20 text-white/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.1"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m2 9 10-5 10 5-10 5L2 9Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6"
              />
            </svg>
          </div>
        </section>

        <!-- Platform Statistics -->
        <section>
          <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 class="text-lg font-extrabold tracking-tight text-slate-900">
                Platform Overview
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Current statistics from your Supabase database.
              </p>
            </div>

            <span
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500"
            >
              <span
                class="h-2 w-2 rounded-full"
                [class.bg-emerald-500]="!loading() && !errorMessage()"
                [class.animate-pulse]="loading()"
                [class.bg-amber-500]="loading()"
                [class.bg-rose-500]="!!errorMessage()"
              ></span>

              {{
                loading()
                  ? 'Loading data'
                  : errorMessage()
                    ? 'Needs attention'
                    : 'Database data'
              }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            @for (s of stats(); track s.label) {
              <app-stat-card
                [label]="s.label"
                [value]="s.value"
                [icon]="s.icon"
              />
            }
          </div>
        </section>

        <!-- Main Dashboard Grid -->
        <section class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">

          <!-- Recent Students -->
          <div
            class="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:col-span-2"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                    />
                  </svg>
                </div>

                <div>
                  <h2 class="text-base font-extrabold text-slate-900">
                    Recent Students
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    Latest student profiles registered in your LMS.
                  </p>
                </div>
              </div>

              <span
                class="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
              >
                {{ recentStudents().length }} records
              </span>
            </div>

            <div class="min-w-0 p-2 sm:p-4">
              @if (loading() && profiles().length === 0) {
                <div class="flex flex-col items-center py-12 text-center">
                  <div
                    class="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600"
                  ></div>

                  <p class="mt-3 text-sm font-semibold text-slate-600">
                    Loading student records...
                  </p>
                </div>
              } @else {
                <app-data-table
                  [columns]="columns"
                  [rows]="recentStudents()"
                  emptyMessage="No student profiles found."
                />
              }
            </div>

            <div class="border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
              <p class="text-xs text-slate-500">
                Showing the latest student profiles available to the administrator.
              </p>
            </div>
          </div>

          <!-- Right Side -->
          <aside class="space-y-5">

            <!-- Academic Summary -->
            <div
              class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
            >
              <div class="border-b border-slate-100 px-5 py-4">
                <h2 class="text-base font-extrabold text-slate-900">
                  Academic Summary
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                  Current platform counts.
                </p>
              </div>

              <div class="space-y-5 p-5">
                @for (item of stats(); track item.label; let last = $last) {
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      [class.bg-blue-50]="item.label === 'Students'"
                      [class.text-blue-600]="item.label === 'Students'"
                      [class.bg-indigo-50]="item.label === 'Teachers'"
                      [class.text-indigo-600]="item.label === 'Teachers'"
                      [class.bg-emerald-50]="item.label === 'Courses'"
                      [class.text-emerald-600]="item.label === 'Courses'"
                      [class.bg-amber-50]="item.label === 'Live Classes'"
                      [class.text-amber-600]="item.label === 'Live Classes'"
                    >
                      @if (item.label === 'Students') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a8 8 0 0 1 16 0v2" />
                        </svg>
                      } @else if (item.label === 'Teachers') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                        </svg>
                      } @else if (item.label === 'Courses') {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                        </svg>
                      } @else {
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m-4 4h7" />
                        </svg>
                      }
                    </div>

                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-slate-700">
                        {{ item.label }}
                      </p>
                      <p class="mt-0.5 text-xs text-slate-400">
                        @if (item.label === 'Students') {
                          Registered learners
                        } @else if (item.label === 'Teachers') {
                          Teaching staff
                        } @else if (item.label === 'Courses') {
                          Available courses
                        } @else {
                          Live class records
                        }
                      </p>
                    </div>

                    <span class="text-lg font-extrabold text-slate-900">
                      {{ item.value }}
                    </span>
                  </div>

                  @if (!last) {
                    <div class="h-px bg-slate-100"></div>
                  }
                }
              </div>
            </div>

            <!-- User Role Summary -->
            <div
              class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                  </svg>
                </div>

                <div>
                  <h2 class="text-base font-extrabold text-slate-900">
                    User Role Summary
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    Distribution of registered profiles.
                  </p>
                </div>
              </div>

              <div class="mt-5 space-y-4">
                @for (item of roleSummary(); track item.label) {
                  <div>
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2.5">
                        <span
                          class="h-2.5 w-2.5 rounded-full"
                          [class.bg-blue-500]="item.label === 'Students'"
                          [class.bg-indigo-500]="item.label === 'Teachers'"
                          [class.bg-emerald-500]="item.label === 'Admins'"
                        ></span>

                        <span class="text-sm font-medium text-slate-600">
                          {{ item.label }}
                        </span>
                      </div>

                      <span class="text-sm font-extrabold text-slate-900">
                        {{ item.value }}
                      </span>
                    </div>

                    <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [class.bg-blue-500]="item.label === 'Students'"
                        [class.bg-indigo-500]="item.label === 'Teachers'"
                        [class.bg-emerald-500]="item.label === 'Admins'"
                        [style.width.%]="item.percent"
                      ></div>
                    </div>
                  </div>
                }
              </div>

              <div class="mt-5 border-t border-slate-100 pt-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-semibold text-slate-600">
                    Total profiles
                  </span>
                  <span class="text-lg font-extrabold text-slate-900">
                    {{ profiles().length }}
                  </span>
                </div>
              </div>
            </div>

          </aside>
        </section>

        <!-- Footer -->
        <footer
          class="flex flex-col gap-1 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-xs text-slate-500">
            EduCore · Admin Dashboard
          </p>

          <p class="text-xs text-slate-400">
            Data source: Supabase · {{ lastUpdatedLabel() }}
          </p>
        </footer>

      </div>
    </main>
  `,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly courseService = inject(CourseService);
  private readonly liveClassService = inject(LiveClassService);

  private realtimeChannel: RealtimeChannel | null = null;

  readonly profiles = signal<DashboardProfile[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly liveClasses = signal<LiveClass[]>([]);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly lastUpdated = signal<Date | null>(null);

  readonly realtimeStatus = signal<
    'Connecting' | 'Connected' | 'Unavailable'
  >('Connecting');

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Student' },
    {
      key: 'role',
      label: 'Role',
      badge: {
        Student: 'success',
      },
    },
    { key: 'joined', label: 'Joined' },
  ];

  readonly stats = computed<
    { label: string; value: number; icon: IconName }[]
  >(() => {
    const profiles = this.profiles();

    return [
      {
        label: 'Students',
        value: profiles.filter((p) => p.role === 'student').length,
        icon: 'graduation-cap',
      },
      {
        label: 'Teachers',
        value: profiles.filter((p) => p.role === 'teacher').length,
        icon: 'user-check',
      },
      {
        label: 'Courses',
        value: this.courses().length,
        icon: 'book-open',
      },
      {
        label: 'Live Classes',
        value: this.liveClasses().length,
        icon: 'activity',
      },
    ];
  });

  readonly recentStudents = computed(() =>
    this.profiles()
      .filter((profile) => profile.role === 'student')
      .slice(0, 5)
      .map((profile) => ({
        name: profile.full_name?.trim() || 'Unnamed user',
        role: 'Student',
        joined: this.formatDate(profile.created_at),
      })),
  );

  readonly roleSummary = computed(() => {
    const allProfiles = this.profiles();
    const total = allProfiles.length;

    const counts = [
      {
        label: 'Students',
        value: allProfiles.filter((p) => p.role === 'student').length,
      },
      {
        label: 'Teachers',
        value: allProfiles.filter((p) => p.role === 'teacher').length,
      },
      {
        label: 'Admins',
        value: allProfiles.filter((p) => p.role === 'admin').length,
      },
    ];

    return counts.map((item) => ({
      ...item,
      percent: total ? (item.value / total) * 100 : 0,
    }));
  });

  ngOnInit(): void {
    this.setupRealtime();
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      void this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  async load(showLoading = true): Promise<void> {
    if (showLoading) {
      this.loading.set(true);
    }

    this.errorMessage.set('');

    try {
      const [profileResult, courses, liveClasses] = await Promise.all([
        this.supabase.client
          .from('profiles')
          .select('id, full_name, role, created_at')
          .order('created_at', {
            ascending: false,
            nullsFirst: false,
          }),

        this.courseService.getCourses(),
        this.liveClassService.getAll(),
      ]);

      if (profileResult.error) {
        throw profileResult.error;
      }

      this.profiles.set(
        (profileResult.data ?? []) as DashboardProfile[],
      );

      this.courses.set(courses);
      this.liveClasses.set(liveClasses);
      this.lastUpdated.set(new Date());
    } catch (error) {
      console.error('Dashboard load failed:', error);

      this.errorMessage.set(
        (error as { message?: string })?.message ||
          'Please check your Supabase connection and table permissions.',
      );
    } finally {
      if (showLoading) {
        this.loading.set(false);
      }
    }
  }

  private setupRealtime(): void {
    this.realtimeChannel = this.supabase.client
      .channel('admin-dashboard-realtime')

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => void this.load(false),
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        () => void this.load(false),
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_classes',
        },
        () => void this.load(false),
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.realtimeStatus.set('Connected');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          this.realtimeStatus.set('Unavailable');
        } else {
          this.realtimeStatus.set('Connecting');
        }
      });
  }

  lastUpdatedLabel(): string {
    const date = this.lastUpdated();

    if (!date) {
      return this.loading()
        ? 'Loading dashboard data...'
        : 'Not yet synced';
    }

    return `Last updated ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  private formatDate(value: string | null): string {
    if (!value) return '—';

    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}