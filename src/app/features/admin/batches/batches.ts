
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BatchStatus,
  Course,
  CourseBatch,
  CourseBatchInput,
  CourseService,
} from '../../../core/services/course.service';
import { Toast } from '../../../core/services/toast.service';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

type StatusFilter = 'All' | BatchStatus;

@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [FormsModule, ActionButtonsComponent],
  template: `
    <div class="min-h-full bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div class="mx-auto max-w-[1600px] space-y-6">

        <!-- Page Header -->
        <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <path stroke-linecap="round" d="M8 2v4M16 2v4M3 9h18M8 13h3M8 16h6" />
              </svg>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Batch Management
                </h1>
                <span class="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  LMS Admin
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-500">
                Manage your course batches, schedules and statuses.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="load()"
              [disabled]="loading()"
              title="Refresh batches"
              aria-label="Refresh batches"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg class="h-4 w-4" [class.animate-spin]="loading()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7v5h-5M4 17v-5h5" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.6 9A7 7 0 0 1 17.3 5.7L20 8M4 16l2.7 2.3A7 7 0 0 0 18.4 15" />
              </svg>
              <span>Refresh</span>
            </button>

            <button
              type="button"
              (click)="openCreate()"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M12 5v14M5 12h14" />
              </svg>
              New Batch
            </button>
          </div>
        </header>

        <!-- Stats -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500">Total Batches</p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {{ stats().total }}
                </h2>
                <p class="mt-2 text-xs text-slate-500">All registered batches</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path stroke-linecap="round" d="M8 2v4M16 2v4M3 9h18M8 13h3M8 16h6" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full w-full rounded-full bg-blue-500"></div>
            </div>
          </div>

          <div class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500">Ongoing Batches</p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-green-700">
                  {{ stats().ongoing }}
                </h2>
                <p class="mt-2 text-xs text-slate-500">Currently in progress</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition group-hover:bg-green-100">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="m10 8 6 4-6 4V8Z" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-1 overflow-hidden rounded-full bg-green-50">
              <div
                class="h-full rounded-full bg-green-500 transition-all"
                [style.width.%]="stats().total ? (stats().ongoing / stats().total) * 100 : 0"
              ></div>
            </div>
          </div>

          <div class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500">Upcoming Batches</p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-indigo-700">
                  {{ stats().upcoming }}
                </h2>
                <p class="mt-2 text-xs text-slate-500">Scheduled to begin</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path stroke-linecap="round" d="M16 3v4M8 3v4M3 10h18M12 13v4M9 16h3" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-1 overflow-hidden rounded-full bg-indigo-50">
              <div
                class="h-full rounded-full bg-indigo-500 transition-all"
                [style.width.%]="stats().total ? (stats().upcoming / stats().total) * 100 : 0"
              ></div>
            </div>
          </div>

          <div class="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-slate-500">Completed Batches</p>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-700">
                  {{ stats().completed }}
                </h2>
                <p class="mt-2 text-xs text-slate-500">Successfully completed</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8 12 2.5 2.5L16 9" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-slate-500 transition-all"
                [style.width.%]="stats().total ? (stats().completed / stats().total) * 100 : 0"
              ></div>
            </div>
          </div>
        </section>

        <!-- Course-wise Summary -->
        <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div class="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                  <path stroke-linecap="round" d="M4 17a2.5 2.5 0 0 1 2.5-2H20M8 7h7M8 10h5" />
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-slate-800">Course-wise Overview</h2>
                <p class="mt-0.5 text-xs text-slate-500">Batch distribution across courses</p>
              </div>
            </div>

            <span class="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {{ courseSummary().length }} courses with batches
            </span>
          </div>

          <div class="p-5">
            @if (loading() && courses().length === 0) {
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @for (item of [1, 2, 3]; track item) {
                  <div class="animate-pulse rounded-xl border border-slate-100 p-4">
                    <div class="h-4 w-2/3 rounded bg-slate-100"></div>
                    <div class="mt-3 h-3 w-full rounded bg-slate-100"></div>
                  </div>
                }
              </div>
            } @else if (courseSummary().length === 0) {
              <div class="py-8 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5ZM4 17a2.5 2.5 0 0 1 2.5-2H20" />
                  </svg>
                </div>
                <p class="mt-3 text-sm font-semibold text-slate-700">No course batches yet</p>
                <p class="mt-1 text-xs text-slate-500">Create a batch to see the course overview here.</p>
              </div>
            } @else {
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @for (c of courseSummary(); track c.id) {
                  <button
                    type="button"
                    (click)="courseFilter.set(courseFilter() === c.id ? 0 : c.id)"
                    class="rounded-xl border p-4 text-left transition duration-200"
                    [class.border-blue-300]="courseFilter() === c.id"
                    [class.bg-blue-50]="courseFilter() === c.id"
                    [class.ring-2]="courseFilter() === c.id"
                    [class.ring-blue-100]="courseFilter() === c.id"
                    [class.border-slate-200]="courseFilter() !== c.id"
                    [class.bg-white]="courseFilter() !== c.id"
                    [class.hover:border-blue-200]="courseFilter() !== c.id"
                    [class.hover:bg-slate-50]="courseFilter() !== c.id"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex min-w-0 items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                            <path stroke-linecap="round" d="M4 17a2.5 2.5 0 0 1 2.5-2H20" />
                          </svg>
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-bold text-slate-800">{{ c.title }}</p>
                          <p class="mt-1 text-xs text-slate-500">{{ c.total }} total batches</p>
                        </div>
                      </div>
                      <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
                      </svg>
                    </div>

                    <div class="mt-4 flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        {{ c.ongoing }} Ongoing
                      </span>
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        {{ c.upcoming }} Upcoming
                      </span>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        </section>

        <!-- Batch List -->
        <section class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div class="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" d="M8 6h13M8 12h13M8 18h13" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-slate-800">All Batches</h2>
                <p class="mt-0.5 text-xs text-slate-500">View and manage your batches</p>
              </div>
            </div>

            <span class="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {{ filtered().length }} of {{ batches().length }} batches
            </span>
          </div>

          <!-- Search and Filters -->
          <div class="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <div class="relative w-full sm:max-w-sm sm:flex-1">
              <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <circle cx="11" cy="11" r="7" />
                <path stroke-linecap="round" d="m16 16 4 4" />
              </svg>
              <input
                type="text"
                placeholder="Search batch name or code..."
                [ngModel]="search()"
                (ngModelChange)="search.set($event)"
                class="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div class="flex flex-wrap gap-3">
              <select
                aria-label="Filter by status"
                [ngModel]="statusFilter()"
                (ngModelChange)="statusFilter.set($event)"
                class="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="All">All Statuses</option>
                @for (s of statuses; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>

              <select
                aria-label="Filter by course"
                [ngModel]="courseFilter()"
                (ngModelChange)="courseFilter.set(+$event)"
                class="h-11 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option [ngValue]="0">All Courses</option>
                @for (c of courses(); track c.id) {
                  <option [ngValue]="c.id">{{ c.title }}</option>
                }
              </select>

              @if (hasFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-blue-700"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" />
                  </svg>
                  Clear
                </button>
              }
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full min-w-[850px] text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-4">Batch Details</th>
                  <th class="px-4 py-4">Batch Code</th>
                  <th class="px-4 py-4">Course</th>
                  <th class="px-4 py-4">Start Date</th>
                  <th class="px-4 py-4">End Date</th>
                  <th class="px-4 py-4">Status</th>
                  <th class="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                @if (loading()) {
                  <tr>
                    <td colspan="7" class="px-5 py-16 text-center">
                      <div class="flex flex-col items-center">
                        <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600"></div>
                        <p class="mt-3 text-sm font-semibold text-slate-600">Loading batches...</p>
                        <p class="mt-1 text-xs text-slate-400">Fetching the latest available data</p>
                      </div>
                    </td>
                  </tr>
                } @else if (filtered().length === 0) {
                  <tr>
                    <td colspan="7" class="px-5 py-16 text-center">
                      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path stroke-linecap="round" d="M8 2v4M16 2v4M3 9h18M8 13h8" />
                        </svg>
                      </div>
                      <p class="mt-3 font-semibold text-slate-700">No batches found</p>
                      <p class="mt-1 text-sm text-slate-500">
                        @if (hasFilters()) {
                          Try changing your search or filters.
                        } @else {
                          Create your first batch to get started.
                        }
                      </p>
                      @if (hasFilters()) {
                        <button
                          type="button"
                          (click)="clearFilters()"
                          class="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Clear all filters
                        </button>
                      }
                    </td>
                  </tr>
                } @else {
                  @for (b of filtered(); track b.id) {
                    <tr class="group transition hover:bg-blue-50/30">
                      <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                            {{ b.batch_name.charAt(0).toUpperCase() }}
                          </div>
                          <div class="min-w-0">
                            <p class="max-w-48 truncate font-semibold text-slate-800">
                              {{ b.batch_name }}
                            </p>
                            <p class="mt-1 text-xs text-slate-400">ID: {{ b.id }}</p>
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-4">
                        <span class="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                          {{ b.batch_code }}
                        </span>
                      </td>

                      <td class="px-4 py-4">
                        <div class="flex max-w-48 items-center gap-2">
                          <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                            <path stroke-linecap="round" d="M4 17a2.5 2.5 0 0 1 2.5-2H20" />
                          </svg>
                          <span class="truncate text-slate-600">{{ courseTitle(b.course_id) }}</span>
                        </div>
                      </td>

                      <td class="whitespace-nowrap px-4 py-4 text-slate-600">
                        {{ b.start_date }}
                      </td>

                      <td class="whitespace-nowrap px-4 py-4 text-slate-600">
                        {{ b.end_date }}
                      </td>

                      <td class="px-4 py-4">
                        <span
                          class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold"
                          [class]="statusClass(b.status)"
                        >
                          <span
                            class="h-1.5 w-1.5 rounded-full"
                            [class.bg-green-500]="b.status === 'Ongoing'"
                            [class.bg-blue-500]="b.status === 'Upcoming'"
                            [class.bg-slate-500]="b.status === 'Completed'"
                            [class.bg-red-500]="b.status === 'Cancelled'"
                          ></span>
                          {{ b.status }}
                        </span>
                      </td>

                      <td class="px-5 py-4 text-right">
                        <app-action-buttons
                          [deleteLoading]="deletingId() === b.id"
                          (viewClick)="openView(b)"
                          (editClick)="openEdit(b)"
                          (deleteClick)="remove(b)"
                        />
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <div class="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>Showing {{ filtered().length }} batch(es)</p>
            <p>Manage your batches and course schedules</p>
          </div>
        </section>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
        <div class="flex min-h-full items-center justify-center">
          <form
            #f="ngForm"
            (ngSubmit)="save()"
            class="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border border-white/60 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7"
          >
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    @if (editingId()) {
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.5 3.5 4 4L10 18H6v-4L16.5 3.5Z" />
                      <path stroke-linecap="round" d="M14.5 5.5 18.5 9.5M4 21h16" />
                    } @else {
                      <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                    }
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-900">
                    {{ editingId() ? 'Edit Batch' : 'Create New Batch' }}
                  </h2>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ editingId() ? 'Update your batch information.' : 'Add a new batch to a course.' }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                (click)="closeModal()"
                aria-label="Close modal"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div class="space-y-1.5">
              <label for="batch-course" class="block text-sm font-semibold text-slate-700">
                Course <span class="text-red-500">*</span>
              </label>
              <select
                id="batch-course"
                name="course_id"
                [(ngModel)]="form.course_id"
                required
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option [ngValue]="0" disabled>Choose a course</option>
                @for (c of courses(); track c.id) {
                  <option [ngValue]="c.id">{{ c.title }}</option>
                }
              </select>
              @if (courses().length === 0) {
                <p class="text-xs text-amber-600">No courses are available. Please add a course first.</p>
              }
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label for="batch-name" class="block text-sm font-semibold text-slate-700">
                  Batch Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="batch-name"
                  name="batch_name"
                  [(ngModel)]="form.batch_name"
                  required
                  maxlength="100"
                  placeholder="e.g. Morning Batch"
                  class="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div class="space-y-1.5">
                <label for="batch-code" class="block text-sm font-semibold text-slate-700">
                  Batch Code <span class="text-red-500">*</span>
                </label>
                <input
                  id="batch-code"
                  name="batch_code"
                  [(ngModel)]="form.batch_code"
                  required
                  maxlength="50"
                  placeholder="e.g. WD-01"
                  class="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div class="space-y-1.5">
                <label for="batch-start" class="block text-sm font-semibold text-slate-700">
                  Start Date <span class="text-red-500">*</span>
                </label>
                <input
                  id="batch-start"
                  type="date"
                  name="start_date"
                  [(ngModel)]="form.start_date"
                  [max]="form.end_date || null"
                  required
                  class="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div class="space-y-1.5">
                <label for="batch-end" class="block text-sm font-semibold text-slate-700">
                  End Date <span class="text-red-500">*</span>
                </label>
                <input
                  id="batch-end"
                  type="date"
                  name="end_date"
                  [(ngModel)]="form.end_date"
                  [min]="form.start_date || null"
                  required
                  class="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="batch-status" class="block text-sm font-semibold text-slate-700">
                Batch Status
              </label>
              <select
                id="batch-status"
                name="status"
                [(ngModel)]="form.status"
                required
                class="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                @for (s of statuses; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
              <p class="text-xs text-slate-400">
                Select the current stage of this batch.
              </p>
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                (click)="closeModal()"
                class="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                [disabled]="saving() || f.invalid || !form.course_id || !courses().length"
                class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                @if (saving()) {
                  <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" class="opacity-25" />
                    <path stroke-linecap="round" d="M21 12a9 9 0 0 1-9 9" />
                  </svg>
                  Saving...
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                  {{ editingId() ? 'Save Changes' : 'Create Batch' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- View Modal -->
    @if (viewing(); as v) {
      <div class="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
        <div class="flex min-h-full items-center justify-center">
          <div class="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-white/60 bg-white p-5 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7">
            <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <h2 class="truncate text-xl font-bold text-slate-900">{{ v.batch_name }}</h2>
                  <p class="mt-1 font-mono text-xs text-slate-500">{{ v.batch_code }}</p>
                </div>
              </div>

              <button
                type="button"
                (click)="viewing.set(null)"
                aria-label="Close details"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div class="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p class="text-xs font-medium text-slate-500">Current Status</p>
                <p class="mt-1 text-sm font-semibold text-slate-800">{{ v.status }}</p>
              </div>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                [class]="statusClass(v.status)"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  [class.bg-green-500]="v.status === 'Ongoing'"
                  [class.bg-blue-500]="v.status === 'Upcoming'"
                  [class.bg-slate-500]="v.status === 'Completed'"
                  [class.bg-red-500]="v.status === 'Cancelled'"
                ></span>
                {{ v.status }}
              </span>
            </div>

            <div class="space-y-4">
              <div class="rounded-xl border border-slate-100 p-4">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                    <path stroke-linecap="round" d="M4 17a2.5 2.5 0 0 1 2.5-2H20" />
                  </svg>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Course</p>
                </div>
                <p class="mt-2 font-semibold text-slate-800">{{ courseTitle(v.course_id) }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path stroke-linecap="round" d="M8 3v4M16 3v4M3 10h18" />
                    </svg>
                    <p class="text-xs font-medium text-slate-500">Start Date</p>
                  </div>
                  <p class="mt-2 break-words text-sm font-semibold text-slate-800">{{ v.start_date }}</p>
                </div>

                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path stroke-linecap="round" d="M8 3v4M16 3v4M3 10h18" />
                    </svg>
                    <p class="text-xs font-medium text-slate-500">End Date</p>
                  </div>
                  <p class="mt-2 break-words text-sm font-semibold text-slate-800">{{ v.end_date }}</p>
                </div>

                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <circle cx="12" cy="12" r="9" />
                      <path stroke-linecap="round" d="M12 7v5l3 2" />
                    </svg>
                    <p class="text-xs font-medium text-slate-500">Duration</p>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-slate-800">
                    {{ durationDays(v) }} days
                  </p>
                </div>

                <div class="rounded-xl border border-slate-100 p-4">
                  <div class="flex items-center gap-2">
                    <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <circle cx="12" cy="8" r="4" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 21v-2a7 7 0 0 1 14 0v2" />
                    </svg>
                    <p class="text-xs font-medium text-slate-500">Batch ID</p>
                  </div>
                  <p class="mt-2 text-sm font-semibold text-slate-800">{{ v.id }}</p>
                </div>
              </div>

              <div class="rounded-xl border border-slate-100 p-4">
                <p class="text-xs font-medium text-slate-500">Created On</p>
                <p class="mt-1 text-sm font-semibold text-slate-800">
                  {{ v.created_at ? v.created_at.slice(0, 10) : 'Not available' }}
                </p>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                (click)="viewing.set(null)"
                class="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                (click)="editFromView(v)"
                class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.5 3.5 4 4L10 18H6v-4L16.5 3.5Z" />
                  <path stroke-linecap="round" d="M14.5 5.5 18.5 9.5" />
                </svg>
                Edit Batch
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class Batches implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly toast = inject(Toast);

  readonly statuses: BatchStatus[] = [
    'Upcoming',
    'Ongoing',
    'Completed',
    'Cancelled',
  ];

  readonly courses = signal<Course[]>([]);
  readonly batches = signal<CourseBatch[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('All');
  readonly courseFilter = signal(0);

  readonly modalOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly viewing = signal<CourseBatch | null>(null);

  form: CourseBatchInput = this.emptyForm();

  readonly stats = computed(() => {
    const list = this.batches();

    return {
      total: list.length,
      ongoing: list.filter((b) => b.status === 'Ongoing').length,
      upcoming: list.filter((b) => b.status === 'Upcoming').length,
      completed: list.filter((b) => b.status === 'Completed').length,
    };
  });

  readonly courseSummary = computed(() => {
    const list = this.batches();

    return this.courses()
      .map((c) => {
        const mine = list.filter((b) => b.course_id === c.id);

        return {
          id: c.id,
          title: c.title,
          total: mine.length,
          ongoing: mine.filter((b) => b.status === 'Ongoing').length,
          upcoming: mine.filter((b) => b.status === 'Upcoming').length,
        };
      })
      .filter((c) => c.total > 0)
      .sort((a, b) => b.ongoing - a.ongoing);
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const courseId = this.courseFilter();

    return this.batches().filter((b) => {
      if (status !== 'All' && b.status !== status) return false;
      if (courseId && b.course_id !== courseId) return false;

      const searchableText = `${b.batch_name} ${b.batch_code}`.toLowerCase();
      if (q && !searchableText.includes(q)) return false;

      return true;
    });
  });

  readonly hasFilters = computed(
    () =>
      !!this.search().trim() ||
      this.statusFilter() !== 'All' ||
      this.courseFilter() !== 0,
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const [courses, batches] = await Promise.all([
        this.courseService.getCourses(),
        this.courseService.getAllBatches(),
      ]);

      this.courses.set(courses);
      this.batches.set(batches);
    } catch (e) {
      this.toast.error(this.message(e, 'Batches load nahi ho sakay.'));
    } finally {
      this.loading.set(false);
    }
  }

  courseTitle(courseId: number): string {
    return (
      this.courses().find((c) => c.id === courseId)?.title ??
      'Unknown course'
    );
  }

  statusClass(status: BatchStatus): string {
    const map: Record<BatchStatus, string> = {
      Ongoing: 'bg-green-50 text-green-700',
      Upcoming: 'bg-blue-50 text-blue-700',
      Completed: 'bg-slate-100 text-slate-600',
      Cancelled: 'bg-red-50 text-red-700',
    };

    return map[status];
  }

  durationDays(batch: CourseBatch): number {
    const start = new Date(`${batch.start_date}T00:00:00`).getTime();
    const end = new Date(`${batch.end_date}T00:00:00`).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return 0;
    }

    return Math.round((end - start) / 86_400_000) + 1;
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('All');
    this.courseFilter.set(0);
  }

  openView(batch: CourseBatch): void {
    this.viewing.set(batch);
  }

  editFromView(batch: CourseBatch): void {
    this.viewing.set(null);
    this.openEdit(batch);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.modalOpen.set(true);
  }

  openEdit(batch: CourseBatch): void {
    this.editingId.set(batch.id);

    this.form = {
      course_id: batch.course_id,
      batch_name: batch.batch_name,
      batch_code: batch.batch_code,
      start_date: batch.start_date,
      end_date: batch.end_date,
      status: batch.status,
    };

    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    if (!this.form.course_id) {
      this.toast.error('Please select a course.');
      return;
    }

    if (
      !this.form.start_date ||
      !this.form.end_date ||
      this.form.end_date < this.form.start_date
    ) {
      this.toast.error('End date, start date se pehle nahi ho sakti.');
      return;
    }

    const payload: CourseBatchInput = {
      ...this.form,
      batch_name: this.form.batch_name.trim(),
      batch_code: this.form.batch_code.trim(),
    };

    if (!payload.batch_name || !payload.batch_code) {
      this.toast.error('Batch name aur code required hain.');
      return;
    }

    this.saving.set(true);

    try {
      const id = this.editingId();

      if (id !== null) {
        await this.courseService.updateBatch(id, payload);
        this.toast.success('Batch successfully update ho gaya.');
      } else {
        await this.courseService.createBatch(payload);
        this.toast.success('Naya batch successfully create ho gaya.');
      }

      this.closeModal();
      await this.load();
    } catch (e) {
      this.toast.error(this.message(e, 'Batch save nahi ho saka.'));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(batch: CourseBatch): Promise<void> {
    if (this.deletingId() !== null) return;

    if (!confirm(`"${batch.batch_name}" ko delete karna hai?`)) return;

    this.deletingId.set(batch.id);

    try {
      await this.courseService.deleteBatch(batch.id);
      this.toast.success('Batch delete ho gaya.');
      await this.load();
    } catch (e) {
      this.toast.error(this.message(e, 'Batch delete nahi ho saka.'));
    } finally {
      this.deletingId.set(null);
    }
  }

  private emptyForm(): CourseBatchInput {
    return {
      course_id: 0,
      batch_name: '',
      batch_code: '',
      start_date: '',
      end_date: '',
      status: 'Upcoming',
    };
  }

  private message(e: unknown, fallback: string): string {
    return (e as { message?: string })?.message || fallback;
  }
}