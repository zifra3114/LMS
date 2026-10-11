import { DatePipe, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { TabsComponent, type TabItem } from '../../../shared/components/tabs/tabs';
import { BadgeComponent, type BadgeVariant } from '../../../shared/components/badge/badge';
import { IconComponent } from '../../../shared/components/icon/icon';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';
import { Toast } from '../../../core/services/toast.service';
import {
  CourseInput,
  CourseService,
} from '../../../core/services/course.service';

import {
  Course,
  CourseLevel,
  CourseStatus,
  CourseBatch,
  CourseBatchInput,
} from './courses.models';

import {
  CourseFormComponent,
  CourseFormSavePayload,
} from './course-form';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    NgTemplateOutlet,
    PageHeaderComponent,
    TabsComponent,
    BadgeComponent,
    IconComponent,
    ActionButtonsComponent,
    CourseFormComponent,
  ],
  template: `
    <div class="pb-8">
      <app-page-header title="My Courses" />

      <!-- Course Form -->
      @if (formOpen()) {
        <app-course-form
          [course]="editingCourse()"
          [existingBatches]="existingBatches()"
          [saving]="saving()"
          (save)="saveCourse($event)"
          (cancel)="closeForm()"
        />
      }

      <!-- List stays visible behind the form modal -->
        <!-- Tabs and Filters -->
        <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <app-tabs [tabs]="tabs()" [(active)]="activeTab" />

            <div class="flex flex-wrap items-center gap-3">
              @if (searchOpen()) {
                <input
                  type="text"
                  placeholder="Search courses..."
                  [value]="search()"
                  (input)="search.set($any($event.target).value)"
                  class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                />
              }

              <button
                type="button"
                (click)="toggleSearch()"
                class="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <app-icon name="search" />
                Search
              </button>

              <div class="relative">
                <select
                  [value]="statusFilter()"
                  (change)="statusFilter.set($any($event.target).value)"
                  aria-label="Filter by status"
                  class="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="All">All Status</option>
                  <option value="Published">Published</option>
                  <option value="Drafted">Drafted</option>
                </select>

                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <app-icon name="chevron-down" [size]="16" />
                </span>
              </div>

              <div class="flex items-center rounded-xl border border-slate-200 p-1">
                <button
                  type="button"
                  (click)="view.set('grid')"
                  [class]="view() === 'grid'
                    ? 'rounded-lg bg-blue-600 p-2 text-white'
                    : 'rounded-lg p-2 text-slate-500 hover:bg-slate-100'"
                  aria-label="Grid view"
                >
                  <app-icon name="layout-grid" />
                </button>

                <button
                  type="button"
                  (click)="view.set('list')"
                  [class]="view() === 'list'
                    ? 'rounded-lg bg-blue-600 p-2 text-white'
                    : 'rounded-lg p-2 text-slate-500 hover:bg-slate-100'"
                  aria-label="List view"
                >
                  <app-icon name="list" />
                </button>
              </div>

              <button
                type="button"
                (click)="onNew()"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <app-icon name="plus" />
                New Course
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex min-h-64 items-center justify-center">
            <div class="flex flex-col items-center gap-3">
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p class="text-sm text-slate-500">Loading courses...</p>
            </div>
          </div>
        } @else {
          <!-- Empty State -->
          @if (filtered().length === 0) {
            <div class="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <app-icon name="book-open" />
              </div>

              <h3 class="text-lg font-semibold text-slate-800">No courses found</h3>

              <p class="mt-2 max-w-sm text-sm text-slate-500">
                No courses match your current search or filter. Add a new course or change your filters.
              </p>

              <button
                type="button"
                (click)="onNew()"
                class="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Course
              </button>
            </div>
          } @else {
            <!-- Grid View -->
            @if (view() === 'grid') {
              <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                @for (c of filtered(); track c.id) {
                  <article class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                    @if (isImageUrl(c.thumbnail)) {
                      <div class="h-64 w-full overflow-hidden bg-slate-900">
                        <img
                          class="h-full w-full object-cover"
                          [src]="c.thumbnail"
                          [alt]="c.title"
                        />
                      </div>
                    } @else {
                      <div
                        [class]="'flex h-64 w-full items-center justify-center text-white bg-gradient-to-br ' + (c.thumbnail || 'from-blue-600 to-indigo-500')"
                      >
                        <app-icon name="book-open" [size]="32" />
                      </div>
                    }

                    <div class="flex flex-1 flex-col p-4">
                      <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span>{{ c.type === 'single' ? 'Single course' : 'Bundle course' }}</span>
                        <span aria-hidden="true">•</span>
                        <span>{{ c.duration || 'Duration not set' }}</span>
                      </div>

                      <div class="mt-1.5 flex items-start justify-between gap-2">
                        <h3 class="line-clamp-1 text-base font-semibold leading-snug text-slate-900">
                          {{ c.title }}
                        </h3>
                        <div class="shrink-0">
                          <app-badge [variant]="statusVariant(c.status)">
                            {{ c.status }}
                          </app-badge>
                        </div>
                      </div>

                      <p class="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                        {{ c.description || 'No description available.' }}
                      </p>

                      <div class="mt-3 flex items-center gap-2">
                        <ng-container
                          *ngTemplateOutlet="levelBars; context: { $implicit: c.level }"
                        />
                        <span class="text-xs font-medium text-slate-600">{{ c.level }}</span>

                        @if (batchInfo(c.id); as info) {
                          <span [class]="batchBadgeClass(info.status)">{{ info.status }}</span>
                          @if (info.extra > 0) {
                            <span class="text-xs text-slate-400">+{{ info.extra }} more</span>
                          }
                        }
                      </div>

                      <div class="mt-auto pt-3">
                        <div class="flex items-center justify-between border-t border-slate-100 pt-3">
                          <p class="text-base font-bold text-slate-900">
                            {{ c.price | currency: 'USD' : 'symbol' : '1.0-2' }}
                          </p>

                          <app-action-buttons
                            [showView]="true"
                            [showEdit]="true"
                            [showDelete]="true"
                            [deleteDisabled]="deletingId() === c.id"
                            [deleteLoading]="deletingId() === c.id"
                            (viewClick)="showDetails(c)"
                            (editClick)="onEdit(c)"
                            (deleteClick)="promptDelete(c)"
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                }
              </div>
            } @else {
              <!-- List View -->
              <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[950px] text-left">
                    <thead class="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Duration</th>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Price</th>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Level</th>
                        <th class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>

                    <tbody class="divide-y divide-slate-100">
                      @for (c of filtered(); track c.id) {
                        <tr class="transition hover:bg-slate-50">
                          <td class="px-6 py-5">
                            <div class="flex items-center gap-5">
                              @if (isImageUrl(c.thumbnail)) {
                                <div class="h-28 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-900 shadow-sm">
                                  <img
                                    class="h-full w-full object-cover"
                                    [src]="c.thumbnail"
                                    [alt]="c.title"
                                  />
                                </div>
                              } @else {
                                <div
                                  [class]="'h-28 w-36 shrink-0 rounded-xl bg-gradient-to-br ' + (c.thumbnail || 'from-blue-600 to-indigo-500')"
                                ></div>
                              }

                              <div class="max-w-xs sm:max-w-sm">
                                <p class="text-lg font-bold text-slate-900">{{ c.title }}</p>
                                <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                  {{ c.description || 'No description' }}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td class="px-6 py-5 text-sm font-semibold capitalize text-slate-700">
                            {{ c.type }}
                          </td>
                          <td class="px-6 py-5 text-sm font-medium text-slate-600">
                            {{ c.duration || '—' }}
                          </td>
                          <td class="px-6 py-5 text-base font-bold text-slate-900">
                            {{ c.price | currency: 'USD' : 'symbol' : '1.0-2' }}
                          </td>
                          <td class="px-6 py-5 text-sm font-medium text-slate-600">
                            {{ c.level }}

                            @if (batchInfo(c.id); as info) {
                              <span class="ml-2" [class]="batchBadgeClass(info.status)">{{ info.status }}</span>
                              @if (info.extra > 0) {
                                <span class="ml-1 text-xs text-slate-400">+{{ info.extra }} more</span>
                              }
                            }
                          </td>
                          <td class="px-6 py-5">
                            <app-badge [variant]="statusVariant(c.status)">
                              {{ c.status }}
                            </app-badge>
                          </td>

                          <td class="px-6 py-5">
                            <div class="flex justify-end">
                              <app-action-buttons
                                [showView]="true"
                                [showEdit]="true"
                                [showDelete]="true"
                                [deleteDisabled]="deletingId() === c.id"
                                [deleteLoading]="deletingId() === c.id"
                                (viewClick)="showDetails(c)"
                                (editClick)="onEdit(c)"
                                (deleteClick)="promptDelete(c)"
                              />
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }
        }

      <!-- Course Details Modal -->
      @if (selectedCourse(); as course) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          (click)="closeDetails()"
        >
          <div
            class="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Course details"
            (click)="$event.stopPropagation()"
          >
            <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 class="text-lg font-bold text-slate-900">Course Details</h2>

              <button
                type="button"
                (click)="closeDetails()"
                class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close details"
              >
                <app-icon name="x" />
              </button>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto">
              @if (isImageUrl(course.thumbnail)) {
                <div class="h-80 w-full overflow-hidden bg-slate-900">
                  <img
                    class="h-full w-full object-cover"
                    [src]="course.thumbnail"
                    [alt]="course.title"
                  />
                </div>
              } @else {
                <div
                  [class]="'h-32 w-full bg-gradient-to-br ' + (course.thumbnail || 'from-blue-600 to-indigo-500')"
                ></div>
              }

              <div class="space-y-4 p-6">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <h3 class="text-xl font-bold text-slate-900">{{ course.title }}</h3>
                  <app-badge [variant]="statusVariant(course.status)">
                    {{ course.status }}
                  </app-badge>
                </div>

                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                  <p class="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {{ course.description || 'No description available.' }}
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Price</p>
                    <p class="mt-0.5 font-bold text-slate-900">
                      {{ course.price | currency: 'USD' : 'symbol' : '1.0-2' }}
                    </p>
                  </div>

                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Duration</p>
                    <p class="mt-0.5 font-bold text-slate-900">
                      {{ course.duration || 'Not specified' }}
                    </p>
                  </div>

                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Level</p>
                    <p class="mt-0.5 font-semibold text-slate-900">{{ course.level }}</p>
                  </div>

                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Type</p>
                    <p class="mt-0.5 font-semibold capitalize text-slate-900">{{ course.type }}</p>
                  </div>
                </div>

                <!-- Batch Details -->
                <div class="border-t border-slate-200 pt-4">
                  <div class="mb-3 flex items-center justify-between">
                    <h3 class="font-semibold text-slate-900">Course Batches</h3>
                    <button
                      type="button"
                      (click)="editFromDetails(course)"
                      class="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Manage batches
                    </button>
                  </div>

                  @if (detailsBatchesLoading()) {
                    <p class="text-sm text-slate-500">Loading batches...</p>
                  } @else if (detailsBatches().length === 0) {
                    <p class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No batches have been added to this course yet.
                    </p>
                  } @else {
                    <div class="space-y-3">
                      @for (batch of detailsBatches(); track batch.id) {
                        <div class="rounded-xl border border-slate-200 p-4">
                          <div class="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p class="font-semibold text-slate-900">{{ batch.batch_name }}</p>
                              <p class="mt-1 text-xs text-slate-500">Code: {{ batch.batch_code }}</p>
                            </div>
                            <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                              {{ batch.status }}
                            </span>
                          </div>

                          <p class="mt-3 text-sm text-slate-600">
                            {{ batch.start_date | date: 'mediumDate' }}
                            –
                            {{ batch.end_date | date: 'mediumDate' }}
                          </p>
                        </div>
                      }
                    </div>
                  }
                </div>

                <p class="text-xs text-slate-400">
                  Created: {{ course.created_at | date: 'MMMM d, y, h:mm a' }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                (click)="closeDetails()"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                (click)="editFromDetails(course)"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <app-icon name="pencil" />
                Edit Course
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (courseToDelete(); as course) {
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          (click)="cancelDelete()"
        >
          <div
            class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            (click)="$event.stopPropagation()"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <app-icon name="trash-2" [size]="22" />
            </div>

            <h2 class="mt-4 text-lg font-bold text-slate-900">Delete Course?</h2>

            <p class="mt-1.5 text-sm leading-5 text-slate-500">
              Are you sure you want to delete
              <span class="font-semibold text-slate-800">{{ course.title }}</span>?
              This action cannot be undone.
            </p>

            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="cancelDelete()"
                [disabled]="deletingId() !== null"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="confirmDelete()"
                [disabled]="deletingId() !== null"
                class="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (deletingId() !== null) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                  Deleting...
                } @else {
                  <app-icon name="trash-2" />
                  Delete Course
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Course Level Indicator -->
      <ng-template #levelBars let-level>
        <div class="flex items-end gap-1" aria-hidden="true">
          @for (bar of [1, 2, 3]; track bar) {
            <span
              [class]="bar <= rank(level)
                ? 'w-1.5 rounded-full bg-blue-600'
                : 'w-1.5 rounded-full bg-slate-200'"
              [style.height.px]="4 + bar * 3"
            ></span>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export class CoursesComponent implements OnInit {
  private readonly toast = inject(Toast);
  private readonly courseService = inject(CourseService);

  activeTab = signal('single');
  statusFilter = signal('All');
  view = signal<'list' | 'grid'>('grid');

  search = signal('');
  searchOpen = signal(false);

  courses = signal<Course[]>([]);
  loading = signal(false);
  saving = signal(false);

  formOpen = signal(false);
  editingCourse = signal<CourseInput | null>(null);
  editingId = signal<number | null>(null);
  existingBatches = signal<CourseBatch[]>([]);

  selectedCourse = signal<Course | null>(null);
  detailsBatches = signal<CourseBatch[]>([]);
  detailsBatchesLoading = signal(false);

  deletingId = signal<number | null>(null);
  courseToDelete = signal<Course | null>(null);

  // All batches, used to show the batch status on every course card
  allBatches = signal<CourseBatch[]>([]);

  private readonly batchPriority: Record<string, number> = {
    Ongoing: 0,
    Upcoming: 1,
    Completed: 2,
    Cancelled: 3,
  };

  // course id -> most relevant batch status + how many other batches exist
  private batchSummary = computed(() => {
    const grouped = new Map<number, CourseBatch[]>();

    for (const batch of this.allBatches()) {
      const list = grouped.get(batch.course_id) ?? [];
      list.push(batch);
      grouped.set(batch.course_id, list);
    }

    const summary = new Map<number, { status: string; extra: number }>();

    grouped.forEach((list, courseId) => {
      const sorted = [...list].sort(
        (a, b) =>
          (this.batchPriority[a.status] ?? 9) - (this.batchPriority[b.status] ?? 9),
      );

      summary.set(courseId, {
        status: sorted[0].status,
        extra: list.length - 1,
      });
    });

    return summary;
  });

  batchInfo(courseId: number): { status: string; extra: number } | null {
    return this.batchSummary().get(courseId) ?? null;
  }

  batchBadgeClass(status: string): string {
    const base = 'rounded-full px-2 py-0.5 text-xs font-medium ';

    switch (status) {
      case 'Ongoing':
        return base + 'bg-emerald-50 text-emerald-700';
      case 'Upcoming':
        return base + 'bg-blue-50 text-blue-700';
      case 'Completed':
        return base + 'bg-slate-100 text-slate-600';
      default:
        return base + 'bg-red-50 text-red-600';
    }
  }

  tabs = computed<TabItem[]>(() => [
    {
      key: 'single',
      label: 'My Course',
      count: this.courses().filter((c) => c.type === 'single').length,
    },
    {
      key: 'bundle',
      label: 'Bundle Course',
      count: this.courses().filter((c) => c.type === 'bundle').length,
    },
  ]);

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();

    return this.courses().filter((c) => {
      const matchesType = c.type === this.activeTab();
      const matchesStatus =
        this.statusFilter() === 'All' || c.status === this.statusFilter();
      const matchesSearch =
        !term ||
        (c.title ?? '').toLowerCase().includes(term) ||
        (c.description ?? '').toLowerCase().includes(term);

      return matchesType && matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    void this.loadCourses();
  }

  statusVariant(status: CourseStatus): BadgeVariant {
    return status === 'Published' ? 'success' : 'warning';
  }

  isImageUrl(value: string | null | undefined): boolean {
    if (!value) return false;

    return (
      value.startsWith('https://') ||
      value.startsWith('http://') ||
      value.startsWith('data:image/')
    );
  }

  rank(level: CourseLevel): number {
    return { Basic: 1, Intermediate: 2, Expert: 3 }[level] ?? 1;
  }

  toggleSearch(): void {
    this.searchOpen.set(!this.searchOpen());

    if (!this.searchOpen()) {
      this.search.set('');
    }
  }

  onNew(): void {
    this.editingId.set(null);
    this.editingCourse.set(null);
    this.existingBatches.set([]);
    this.formOpen.set(true);
  }

  async onEdit(course: Course): Promise<void> {
    this.editingId.set(course.id);

    this.editingCourse.set({
      title: course.title,
      description: course.description || '',
      duration: course.duration || '',
      price: Number(course.price),
      level: course.level,
      type: course.type,
      thumbnail: course.thumbnail || '',
      status: course.status,
    });

    this.selectedCourse.set(null);
    this.existingBatches.set([]);

    try {
      const batches = await this.courseService.getBatches(course.id);
      this.existingBatches.set(batches);
      this.formOpen.set(true);
    } catch (error) {
      console.error('Failed to load course batches:', error);

      this.toast.error(
        'Course batches could not load. Check your Supabase table and policies.',
      );
    }
  }

  editFromDetails(course: Course): void {
    void this.onEdit(course);
  }

  async showDetails(course: Course): Promise<void> {
    this.selectedCourse.set(course);
    this.detailsBatches.set([]);
    this.detailsBatchesLoading.set(true);

    try {
      const batches = await this.courseService.getBatches(course.id);

      if (this.selectedCourse()?.id === course.id) {
        this.detailsBatches.set(batches);
      }
    } catch (error) {
      console.error('Failed to load course batches:', error);

      this.toast.error(
        'Batch details could not load. Please check Supabase access policies.',
      );
    } finally {
      if (this.selectedCourse()?.id === course.id) {
        this.detailsBatchesLoading.set(false);
      }
    }
  }

  closeDetails(): void {
    this.selectedCourse.set(null);
    this.detailsBatches.set([]);
    this.detailsBatchesLoading.set(false);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingCourse.set(null);
    this.editingId.set(null);
    this.existingBatches.set([]);
  }

  async loadCourses(): Promise<void> {
    this.loading.set(true);

    try {
      const [courses, batches] = await Promise.all([
        this.courseService.getCourses(),
        // A batch loading problem must not hide the courses themselves
        this.courseService.getAllBatches().catch((batchError) => {
          console.error('Failed to load batches:', batchError);
          return [] as CourseBatch[];
        }),
      ]);

      this.courses.set(courses);
      this.allBatches.set(batches);
    } catch (error) {
      console.error('Failed to load courses:', error);

      this.toast.error(
        'Courses could not load. Please check your Supabase access policies.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async saveCourse(payload: CourseFormSavePayload): Promise<void> {
    if (this.saving()) return;

    this.saving.set(true);

    const courseId = this.editingId();
    let createdNewId: number | null = null;

    try {
      let savedCourseId: number;

      // 1. Save course first
      if (courseId !== null) {
        await this.courseService.updateCourse(courseId, payload.course);
        savedCourseId = courseId;
      } else {
        const created = await this.courseService.createCourse(payload.course);
        savedCourseId = created.id;
        createdNewId = created.id;
      }

      // 2. Fetch existing batches
      const oldBatches = await this.courseService.getBatches(savedCourseId);
      const oldBatchIds = new Set(oldBatches.map((batch) => batch.id));

      const incomingExistingIds = new Set(
        payload.batches
          .map((batch) => batch.id)
          .filter((id): id is number => id !== undefined),
      );

      // 3. Make sure existing batch IDs belong to this course
      for (const id of incomingExistingIds) {
        if (!oldBatchIds.has(id)) {
          throw new Error('Invalid batch ID received for this course.');
        }
      }

      // 4. Create or update batches
      for (const batch of payload.batches) {
        const batchInput: CourseBatchInput = {
          course_id: savedCourseId,
          batch_name: batch.batch_name.trim(),
          batch_code: batch.batch_code.trim().toUpperCase(),
          start_date: batch.start_date,
          end_date: batch.end_date,
          status: batch.status,
        };

        if (batch.id !== undefined) {
          await this.courseService.updateBatch(batch.id, batchInput);
        } else {
          await this.courseService.createBatch(batchInput);
        }
      }

      // 5. Delete batches removed from the form
      for (const oldBatch of oldBatches) {
        if (!incomingExistingIds.has(oldBatch.id)) {
          await this.courseService.deleteBatch(oldBatch.id);
        }
      }

      this.toast.success(
        courseId !== null
          ? 'Course and batches updated successfully.'
          : 'Course and batches created successfully.',
      );

      this.closeForm();
      await this.loadCourses();
    } catch (error) {
      console.error('Failed to save course and batches:', error);

      // Roll back a half-created course so no orphan is left behind
      if (createdNewId !== null) {
        try {
          await this.courseService.deleteCourse(createdNewId);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      // Supabase errors are plain objects (not Error instances), so read .message directly
      const message = (error as { message?: string } | null)?.message;

      this.toast.error(
        message || 'Course or batch could not be saved. Check Supabase policies.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  promptDelete(course: Course): void {
    this.courseToDelete.set(course);
  }

  cancelDelete(): void {
    if (this.deletingId() !== null) return;

    this.courseToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const course = this.courseToDelete();

    if (!course || this.deletingId() !== null) return;

    this.deletingId.set(course.id);

    try {
      await this.courseService.deleteCourse(course.id);

      if (this.selectedCourse()?.id === course.id) {
        this.closeDetails();
      }

      this.toast.success('Course deleted successfully.');
      this.courseToDelete.set(null);

      await this.loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);

      this.toast.error(
        'Course could not be deleted. Please check your Supabase access policies.',
      );
    } finally {
      this.deletingId.set(null);
    }
  }
}