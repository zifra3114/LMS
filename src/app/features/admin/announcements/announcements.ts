
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Announcement,
  AnnouncementAudience,
  AnnouncementPriority,
  AnnouncementService,
  AnnouncementType,
  BatchOption,
} from '../../../core/services/announcement.service';
import { Toast } from '../../../core/services/toast.service';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, ActionButtonsComponent],
  template: `
    <section class="space-y-6">
      <!-- Header -->
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p class="text-sm text-slate-500">
            Course, quiz, and assignment updates are published automatically. Manage or broadcast custom announcements below.
          </p>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-[0.98]"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Announcement
        </button>
      </header>

      <!-- Filters Bar -->
      <div class="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <!-- Search Input -->
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search announcements..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <!-- Type Filter -->
        <select
          [value]="typeFilter()"
          (change)="typeFilter.set($any($event.target).value)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="all">All Types</option>
          <option value="course">Course</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Assignment</option>
          <option value="manual">Manual</option>
        </select>

        <!-- Batch / Audience Filter -->
        <select
          [value]="batchFilter()"
          (change)="batchFilter.set($any($event.target).value)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="all">All Audiences</option>
          <option value="everyone">All Students Only</option>
          @for (batch of batches(); track batch.id) {
            <option [value]="batch.id">{{ batch.name }}</option>
          }
        </select>

        <!-- Clear Button -->
        <button
          type="button"
          (click)="clearFilters()"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Reset Filters
        </button>
      </div>

      <!-- Data Table Card -->
      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        @if (loading()) {
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
            <p class="mt-3 text-sm text-slate-500">Loading announcements...</p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.42 1.56l-1.043.75a18.75 18.75 0 0 1-5.607-5.607l.75-1.043c.35-.48.91-.667 1.56-.42.891.401 1.821.732 2.783.985m12.722-4.14a19.109 19.109 0 0 0-4.098-.795m0 0c-.394.015-.79.034-1.185.055m1.185-.055v-.75a3 3 0 0 0-3-3h-1.5a3 3 0 0 0-3 3v.75m0 0c-1.116.059-2.228.15-3.336.275" />
              </svg>
            </div>
            <p class="mt-3 text-sm font-medium text-slate-900">No announcements found</p>
            <p class="mt-1 text-xs text-slate-500">
              {{
                announcements().length === 0
                  ? 'Get started by publishing your first announcement.'
                  : 'Try adjusting your search criteria or filter options.'
              }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/75 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3.5 font-semibold">Announcement</th>
                  <th class="px-5 py-3.5 font-semibold">Type</th>
                  <th class="px-5 py-3.5 font-semibold">Audience</th>
                  <th class="px-5 py-3.5 font-semibold">Priority</th>
                  <th class="px-5 py-3.5 font-semibold">Published</th>
                  <th class="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of filtered(); track item.id) {
                  <tr class="transition-colors hover:bg-slate-50/50">
                    <td class="px-5 py-4">
                      <p class="font-semibold text-slate-900">{{ item.title }}</p>
                      <p class="line-clamp-1 max-w-md text-xs text-slate-500 mt-0.5">{{ item.message }}</p>
                    </td>
                    <td class="px-5 py-4">
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {{ typeLabel(item.type) }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-slate-600 text-xs font-medium">{{ audienceLabel(item) }}</td>
                    <td class="px-5 py-4">
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="
                          item.priority === 'important'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100/60'
                            : 'bg-slate-100 text-slate-600'
                        "
                      >
                        @if (item.priority === 'important') {
                          <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        }
                        {{ item.priority === 'important' ? 'Important' : 'Normal' }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-slate-500 text-xs font-medium">
                      {{ item.created_at | date: 'mediumDate' }}
                    </td>
                    <td class="px-5 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <app-action-buttons
                          [deleteLoading]="deletingId() === item.id"
                          (viewClick)="viewing.set(item)"
                          (editClick)="openEdit(item)"
                          (deleteClick)="onDelete(item)"
                        />
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>

    <!-- Create / Edit Modal -->
    @if (formOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-all"
        (click)="closeForm()"
      >
        <div
          class="w-full max-w-lg scale-100 rounded-2xl bg-white p-6 shadow-2xl transition-all"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 class="text-lg font-bold text-slate-900">
              {{ editingId() ? 'Edit Announcement' : 'New Announcement' }}
            </h2>
            <button
              type="button"
              (click)="closeForm()"
              class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
            <div>
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600" for="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Announcement Title"
                formControlName="title"
                maxlength="120"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              @if (form.controls.title.touched && form.controls.title.invalid) {
                <p class="mt-1 text-xs text-rose-600 font-medium">Title is required.</p>
              }
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600" for="message">
                Message Content
              </label>
              <textarea
                id="message"
                rows="4"
                placeholder="Write your announcement details here..."
                formControlName="message"
                maxlength="2000"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              ></textarea>
              @if (form.controls.message.touched && form.controls.message.invalid) {
                <p class="mt-1 text-xs text-rose-600 font-medium">Message is required.</p>
              }
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600" for="audience">
                  Target Audience
                </label>
                <select
                  id="audience"
                  formControlName="audience"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="all">All Students</option>
                  <option value="batch">Specific Batch</option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600" for="priority">
                  Priority Level
                </label>
                <select
                  id="priority"
                  formControlName="priority"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                </select>
              </div>
            </div>

            @if (form.controls.audience.value === 'batch') {
              <div>
                <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600" for="batch">
                  Select Batch
                </label>
                <select
                  id="batch"
                  formControlName="batch_id"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">-- Choose target batch --</option>
                  @for (batch of batches(); track batch.id) {
                    <option [value]="batch.id">{{ batch.name }}</option>
                  }
                </select>
                @if (batchError()) {
                  <p class="mt-1 text-xs text-rose-600 font-medium">Please select a valid batch.</p>
                }
              </div>
            }

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                (click)="closeForm()"
                class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ saving() ? 'Saving...' : editingId() ? 'Save Changes' : 'Publish Announcement' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- View Details Modal -->
    @if (viewing(); as item) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-all"
        (click)="viewing.set(null)"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span class="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mb-2">
                {{ typeLabel(item.type) }}
              </span>
              <h2 class="text-xl font-bold text-slate-900">{{ item.title }}</h2>
            </div>
            <span
              class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              [class]="
                item.priority === 'important'
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-slate-100 text-slate-600'
              "
            >
              {{ item.priority === 'important' ? 'Important' : 'Normal' }}
            </span>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
            <span class="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
              <svg class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              {{ audienceLabel(item) }}
            </span>
            <span class="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
              <svg class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Published {{ item.created_at | date: 'medium' }}
            </span>
          </div>

          <div class="mt-5 max-h-60 overflow-y-auto rounded-xl bg-slate-50 p-4 border border-slate-100">
            <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {{ item.message }}
            </p>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              (click)="viewing.set(null)"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Custom Delete Confirmation Modal -->
    @if (deleteTarget(); as item) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs transition-all"
        (click)="cancelDelete()"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-announcement-title"
          aria-describedby="delete-announcement-description"
          class="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6 sm:p-7">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"
                  />
                </svg>
              </div>

              <div class="min-w-0 flex-1">
                <h2
                  id="delete-announcement-title"
                  class="text-lg font-bold tracking-tight text-slate-900"
                >
                  Delete Announcement?
                </h2>

                <p
                  id="delete-announcement-description"
                  class="mt-2 text-sm leading-6 text-slate-500"
                >
                  Are you sure you want to delete this announcement? This action
                  cannot be undone.
                </p>
              </div>

              <button
                type="button"
                (click)="cancelDelete()"
                [disabled]="deletingId() === item.id"
                aria-label="Close confirmation"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <!-- Selected Announcement -->
            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Announcement to be deleted
              </p>

              <p class="mt-2 break-words text-sm font-bold text-slate-800">
                {{ item.title }}
              </p>

              <p class="mt-1 line-clamp-3 whitespace-pre-line break-words text-xs leading-5 text-slate-500">
                {{ item.message }}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {{ typeLabel(item.type) }}
                </span>

                <span class="rounded-full bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {{ audienceLabel(item) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Confirmation Actions -->
          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              (click)="cancelDelete()"
              [disabled]="deletingId() === item.id"
              class="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              (click)="confirmDelete()"
              [disabled]="deletingId() === item.id"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              @if (deletingId() === item.id) {
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
                Deleting...
              } @else {
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
                </svg>
                Delete Announcement
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminAnnouncements implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AnnouncementService);
  private readonly toast = inject(Toast);

  readonly announcements = signal<Announcement[]>([]);
  readonly batches = signal<BatchOption[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly viewing = signal<Announcement | null>(null);

  // New state for custom delete confirmation
  readonly deleteTarget = signal<Announcement | null>(null);

  readonly batchError = signal(false);

  readonly searchTerm = signal('');
  readonly typeFilter = signal<'all' | AnnouncementType>('all');
  readonly batchFilter = signal<string>('all');

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.typeFilter();
    const batch = this.batchFilter();

    return this.announcements().filter((item) => {
      if (type !== 'all' && item.type !== type) return false;
      if (batch === 'everyone' && item.audience !== 'all') return false;
      if (batch !== 'all' && batch !== 'everyone' && item.batch_id !== batch) return false;

      if (term) {
        const haystack = `${item.title} ${item.message}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
    priority: ['normal' as AnnouncementPriority],
    audience: ['all' as AnnouncementAudience],
    batch_id: [''],
  });

  ngOnInit(): void {
    void this.load();
  }

  private describe(error: unknown): string {
    const e = error as { message?: string; code?: string; hint?: string } | null;

    const parts = [
      e?.message ?? 'Unknown error',
      e?.code ? `(code: ${e.code})` : '',
      e?.hint ? `Hint: ${e.hint}` : '',
    ];

    return parts.filter(Boolean).join(' ');
  }

  typeLabel(type: AnnouncementType): string {
    const labels: Record<AnnouncementType, string> = {
      manual: 'Manual',
      course: 'Course',
      quiz: 'Quiz',
      assignment: 'Assignment',
    };

    return labels[type] ?? 'Manual';
  }

  audienceLabel(item: Announcement): string {
    if (item.audience === 'all') return 'All students';

    const batch = this.batches().find((b) => b.id === item.batch_id);

    return batch ? batch.name : 'Batch';
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.typeFilter.set('all');
    this.batchFilter.set('all');
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      this.announcements.set(await this.service.list());
    } catch (error) {
      this.toast.error(this.describe(error), 'Unable to load announcements');
    }

    try {
      this.batches.set(await this.service.listBatches());
    } catch (error) {
      console.error('[AdminAnnouncements] batches failed:', error);

      this.toast.warning(
        'Batch names could not be loaded, so batch filters are limited.',
        'Batches unavailable',
      );
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.batchError.set(false);

    this.form.reset({
      title: '',
      message: '',
      priority: 'normal',
      audience: 'all',
      batch_id: '',
    });

    this.formOpen.set(true);
  }

  openEdit(item: Announcement): void {
    this.editingId.set(item.id);
    this.batchError.set(false);

    this.form.reset({
      title: item.title,
      message: item.message,
      priority: item.priority,
      audience: item.audience,
      batch_id: item.batch_id ?? '',
    });

    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.audience === 'batch' && !value.batch_id) {
      this.batchError.set(true);
      return;
    }

    this.batchError.set(false);

    const input = {
      title: value.title.trim(),
      message: value.message.trim(),
      priority: value.priority,
      audience: value.audience,
      batch_id: value.audience === 'batch' ? value.batch_id : null,
    };

    this.saving.set(true);

    try {
      const id = this.editingId();

      if (id) {
        const updated = await this.service.update(id, input);

        this.announcements.update((list) =>
          list.map((item) => (item.id === id ? updated : item)),
        );

        this.toast.success('Announcement updated successfully.', 'Updated');
      } else {
        const created = await this.service.create(input);

        this.announcements.update((list) => [created, ...list]);

        this.toast.success('Announcement published successfully.', 'Published');
      }

      this.closeForm();
    } catch (error) {
      console.error('[AdminAnnouncements] save failed:', error);

      this.toast.error(this.describe(error), 'Unable to save announcement');
    } finally {
      this.saving.set(false);
    }
  }

  // Opens the custom confirmation modal instead of window.confirm().
  onDelete(item: Announcement): void {
    this.deleteTarget.set(item);
  }

  // Closes the confirmation modal without deleting anything.
  cancelDelete(): void {
    if (this.deletingId() !== null) return;

    this.deleteTarget.set(null);
  }

  // Deletes only after the admin confirms inside the custom modal.
  async confirmDelete(): Promise<void> {
    const item = this.deleteTarget();

    if (!item || this.deletingId() !== null) return;

    this.deletingId.set(item.id);

    try {
      await this.service.remove(item.id);

      this.announcements.update((list) =>
        list.filter((announcement) => announcement.id !== item.id),
      );

      if (this.viewing()?.id === item.id) {
        this.viewing.set(null);
      }

      this.deleteTarget.set(null);

      this.toast.success('Announcement deleted successfully.', 'Deleted');
    } catch (error) {
      console.error('[AdminAnnouncements] delete failed:', error);

      this.toast.error(this.describe(error), 'Unable to delete announcement');
    } finally {
      this.deletingId.set(null);
    }
  }
}