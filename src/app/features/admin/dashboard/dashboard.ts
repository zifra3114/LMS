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

import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

type ProfileRole = 'admin' | 'teacher' | 'student';
type ConnectionStatus = 'Connecting' | 'Connected' | 'Unavailable';

interface DashboardProfile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string | null;
}

interface DashboardActivity {
  id: number;
  title: string;
  description: string;
  table: string;
  time: Date;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
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
    <main class="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div class="mx-auto max-w-[1500px] space-y-8 pb-10">

        <!-- HEADER -->
        <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <app-page-header
              title="Dashboard"
              subtitle="Real-time control center, metrics monitoring, and system activity."
            />
          </div>

          <button
            type="button"
            (click)="load()"
            [disabled]="loading() || refreshing()"
            class="group inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 px-5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 hover:shadow-md disabled:opacity-50"
          >
            <svg
              class="h-4 w-4 text-blue-600 transition-transform duration-500 group-hover:rotate-180"
              [class.animate-spin]="loading() || refreshing()"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20 7v5h-5M4 17v-5h5M5.6 9A7 7 0 0 1 17.3 5.7L20 8M4 16l2.7 2.3A7 7 0 0 0 18.4 15"
              />
            </svg>
            <span>{{ loading() || refreshing() ? 'Refreshing Data...' : 'Refresh Feed' }}</span>
          </button>
        </header>

        <!-- ERROR MESSAGE -->
        @if (errorMessage()) {
          <section class="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <p class="font-bold text-rose-900 text-sm">Dashboard Data Connection Issue</p>
                <p class="mt-0.5 text-xs text-rose-700/90">{{ errorMessage() }}</p>
              </div>
            </div>

            <button
              type="button"
              (click)="load()"
              class="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
            >
              Retry Connection
            </button>
          </section>
        }

        <!-- HERO WELCOME BANNER (DARK NEON GLOW ACCENT) -->
        <section class="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8 lg:p-10">
          <div class="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]"></div>
          <div class="pointer-events-none absolute -left-16 -bottom-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-[90px]"></div>

          <div class="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div class="max-w-3xl space-y-4">
              <div class="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-blue-300 backdrop-blur-md">
                <span class="relative flex h-2 w-2">
                  @if (realtimeStatus() === 'Connected') {
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  }
                  <span
                    class="relative inline-flex h-2 w-2 rounded-full"
                    [class.bg-emerald-400]="realtimeStatus() === 'Connected'"
                    [class.bg-amber-400]="realtimeStatus() === 'Connecting'"
                    [class.bg-rose-400]="realtimeStatus() === 'Unavailable'"
                  ></span>
                </span>
                EDUCORE EXECUTIVE HUB
              </div>

              <h1 class="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Welcome to the Admin Dashboard
              </h1>

              <p class="text-sm leading-relaxed text-slate-300/90 sm:text-base">
                Your centralized operational dashboard for student enrollments, instructor management, courses, and real-time database transactions.
              </p>
            </div>

            <div class="flex flex-wrap gap-3 lg:flex-col lg:items-end">
              <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-lg">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Last Sync</p>
                  <p class="text-xs font-extrabold text-white">{{ lastUpdatedLabel() }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-lg">
                <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Realtime Status</p>
                  <p class="text-xs font-extrabold text-white">{{ realtimeStatus() }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SYSTEM MONITOR RIBBON -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Database Link</p>
                <h3 class="text-base font-black text-slate-900 truncate">{{ realtimeStatus() }}</h3>
                <p class="text-[11px] font-medium text-slate-500">Supabase Channel</p>
              </div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                <svg class="h-6 w-6" [class.animate-spin]="loading() || refreshing()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Sync Engine</p>
                <h3 class="text-base font-black text-slate-900 truncate">
                  {{ loading() ? 'Fetching...' : refreshing() ? 'Updating...' : 'Synchronized' }}
                </h3>
                <p class="text-[11px] font-medium text-slate-500">{{ lastUpdatedLabel() }}</p>
              </div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition-transform duration-300 group-hover:scale-110">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Events Recorded</p>
                <h3 class="text-base font-black text-slate-900 truncate">{{ activities().length }} Events</h3>
                <p class="text-[11px] font-medium text-slate-500">Live Session Feed</p>
              </div>
            </div>
          </div>
        </section>

        <!-- STATS GRID -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-black tracking-tight text-slate-900">Platform Analytics</h2>
              <p class="text-xs font-medium text-slate-500">Key performance metrics and profile totals.</p>
            </div>
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

        <!-- MODERN METRICS HIGHLIGHT CARDS (IN PLACE OF RANGE BARS) -->
        <section class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div class="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 class="text-lg font-black tracking-tight text-slate-900">Operational Health Overview</h2>
              <p class="text-xs font-medium text-slate-500">Live indicators across learning channels and system nodes.</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
              <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
            <!-- Card 1 -->
            <div class="group rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 transition-all duration-300 hover:border-blue-300 hover:shadow-md">
              <div class="flex items-center justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <span class="rounded-lg bg-blue-100/80 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">Active</span>
              </div>
              <div class="mt-4">
                <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Course Modules</h3>
                <p class="mt-1 text-2xl font-black text-slate-900">{{ courses().length }} Published</p>
                <p class="mt-1 text-xs text-slate-500">Ready for learner enrollments</p>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="group rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-5 transition-all duration-300 hover:border-emerald-300 hover:shadow-md">
              <div class="flex items-center justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/30">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span class="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">Optimal</span>
              </div>
              <div class="mt-4">
                <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Student Engagement</h3>
                <p class="mt-1 text-2xl font-black text-slate-900">High Activity</p>
                <p class="mt-1 text-xs text-slate-500">Active roster participation</p>
              </div>
            </div>

            <!-- Card 3 -->
            <div class="group rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-purple-50/30 p-5 transition-all duration-300 hover:border-purple-300 hover:shadow-md">
              <div class="flex items-center justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-500/30">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="rounded-lg bg-purple-100/80 px-2.5 py-1 text-[11px] font-extrabold text-purple-700">Scheduled</span>
              </div>
              <div class="mt-4">
                <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Streams</h3>
                <p class="mt-1 text-2xl font-black text-slate-900">{{ liveClasses().length }} Classes</p>
                <p class="mt-1 text-xs text-slate-500">Upcoming interactive sessions</p>
              </div>
            </div>
          </div>
        </section>

        <!-- MAIN LAYOUT BENTO GRID -->
        <section class="grid grid-cols-1 items-start gap-8 xl:grid-cols-3">

          <!-- RECENT STUDENTS TABLE SECTION -->
          <div class="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm xl:col-span-2">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div class="flex items-center gap-3.5">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14a4 4 0 100-8 4 4 0 000 8zm-8 7a8 8 0 0116 0H4z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-black text-slate-900">Newly Enrolled Students</h2>
                  <p class="text-xs text-slate-500">Recent student onboarding registrations.</p>
                </div>
              </div>

              <span class="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 border border-blue-100">
                {{ recentStudents().length }} Recent Profiles
              </span>
            </div>

            <div class="p-4 sm:p-6 min-w-0">
              @if (loading() && profiles().length === 0) {
                <div class="flex flex-col items-center justify-center py-14 text-center">
                  <div class="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                  <p class="mt-4 text-xs font-bold text-slate-600">Fetching latest student records...</p>
                </div>
              } @else {
                <app-data-table
                  [columns]="columns"
                  [rows]="recentStudents()"
                  emptyMessage="No student profiles found."
                />
              }
            </div>
          </div>

          <!-- SIDEBAR WIDGETS -->
          <aside class="space-y-6">

            <!-- USER ROLE DISTRIBUTION -->
            <section class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-base font-black text-slate-900">User Demographics</h2>
                  <p class="text-xs text-slate-500">System account roles breakdown.</p>
                </div>
              </div>

              <div class="space-y-4">
                @for (item of roleSummary(); track item.label) {
                  <div>
                    <div class="mb-1.5 flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-700">{{ item.label }}</span>
                      <span class="font-black text-slate-900">{{ item.value }}</span>
                    </div>
                    <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
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

              <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold">
                <span class="text-slate-500">Total System Users</span>
                <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-900 font-black text-sm">{{ profiles().length }}</span>
              </div>
            </section>

            <!-- REAL-TIME DATABASE TRANSACTION LOGS -->
            <section class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 class="text-base font-black text-slate-900">Live Activity Feed</h2>
                  <p class="text-xs text-slate-500">Captured Supabase transactions.</p>
                </div>
                <span class="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700">
                  {{ activities().length }} Logs
                </span>
              </div>

              <div class="max-h-[380px] overflow-y-auto p-6">
                @if (activities().length === 0) {
                  <div class="py-8 text-center">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                    </div>
                    <p class="mt-3 text-xs font-bold text-slate-700">No active events recorded yet</p>
                    <p class="mt-1 text-[11px] text-slate-400">Database changes will populate here live.</p>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (activity of activities(); track activity.id; let last = $last) {
                      <div class="relative flex gap-3.5">
                        <div class="flex shrink-0 flex-col items-center">
                          <span
                            class="flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-xs"
                            [class.bg-emerald-50]="activity.type === 'INSERT'"
                            [class.text-emerald-600]="activity.type === 'INSERT'"
                            [class.bg-blue-50]="activity.type === 'UPDATE'"
                            [class.text-blue-600]="activity.type === 'UPDATE'"
                            [class.bg-rose-50]="activity.type === 'DELETE'"
                            [class.text-rose-600]="activity.type === 'DELETE'"
                          >
                            @if (activity.type === 'INSERT') {
                              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                              </svg>
                            } @else if (activity.type === 'UPDATE') {
                              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/>
                              </svg>
                            } @else {
                              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            }
                          </span>
                          @if (!last) {
                            <span class="mt-1 h-full w-px bg-slate-100"></span>
                          }
                        </div>

                        <div class="min-w-0 flex-1 pb-2">
                          <p class="text-xs font-bold text-slate-900">{{ activity.title }}</p>
                          <p class="mt-0.5 break-words text-[11px] leading-relaxed text-slate-500">{{ activity.description }}</p>
                          <p class="mt-1 text-[10px] font-bold text-slate-400">
                            {{ activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>

          </aside>
        </section>

        <!-- FOOTER -->
        <footer class="flex flex-col gap-2 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between text-xs font-medium text-slate-400">
          <p>© EduCore LMS · Executive Admin Control Panel</p>
          <p class="flex items-center gap-2">
            <span>Supabase Realtime</span>
            <span>•</span>
            <span class="font-bold text-slate-600">{{ realtimeStatus() }}</span>
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
  private activityId = 0;
  private requestId = 0;
  private destroyed = false;

  readonly profiles = signal<DashboardProfile[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly liveClasses = signal<LiveClass[]>([]);

  readonly activities = signal<DashboardActivity[]>([]);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly errorMessage = signal('');
  readonly lastUpdated = signal<Date | null>(null);

  readonly realtimeStatus = signal<ConnectionStatus>('Connecting');

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Student Name' },
    {
      key: 'role',
      label: 'Role',
      badge: {
        Student: 'success',
      },
    },
    { key: 'joined', label: 'Joined Date' },
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
    this.destroyed = true;
    this.requestId++;

    if (this.realtimeChannel) {
      void this.supabase.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  async load(showLoading = true): Promise<void> {
    if (this.destroyed) return;

    const currentRequestId = ++this.requestId;

    if (showLoading) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
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

      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

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
      if (this.destroyed || currentRequestId !== this.requestId) {
        return;
      }

      console.error('Dashboard load failed:', error);

      this.errorMessage.set(
        (error as { message?: string })?.message ||
          'Please check your Supabase connection and table permissions.',
      );
    } finally {
      if (!this.destroyed && currentRequestId === this.requestId) {
        this.loading.set(false);
        this.refreshing.set(false);
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
        (payload) => {
          this.captureActivity('profiles', payload);
        },
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        (payload) => {
          this.captureActivity('courses', payload);
        },
      )

      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_classes',
        },
        (payload) => {
          this.captureActivity('live_classes', payload);
        },
      )

      .subscribe((status) => {
        if (this.destroyed) return;

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

  private captureActivity(
    table: string,
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  ): void {
    if (this.destroyed) return;

    const eventType = payload.eventType;

    const titles: Record<string, string> = {
      profiles: 'Profile Activity',
      courses: 'Course Activity',
      live_classes: 'Live Class Activity',
    };

    const descriptions: Record<string, string> = {
      INSERT: 'A new record was successfully created.',
      UPDATE: 'An existing database record was updated.',
      DELETE: 'A database entry was deleted.',
    };

    const activity: DashboardActivity = {
      id: ++this.activityId,
      title: titles[table] ?? 'Database Activity',
      description:
        `${descriptions[eventType] ?? 'Database change captured.'} ` +
        `Table: ${table.replaceAll('_', ' ')}.`,
      table,
      time: new Date(),
      type: eventType,
    };

    this.activities.update((current) =>
      [activity, ...current].slice(0, 8),
    );

    void this.load(false);
  }

  lastUpdatedLabel(): string {
    const date = this.lastUpdated();

    if (!date) {
      return this.loading()
        ? 'Loading dashboard data...'
        : 'Not yet synced';
    }

    return `Today at ${date.toLocaleTimeString([], {
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