
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CourseBatch,
  CourseService,
  Course,
} from '../../../core/services/course.service';

import {
  LiveClass,
  LiveClassInput,
  LiveClassService,
  LiveClassStatus,
} from '../../../core/services/liveclass.service';

import { Toast } from '../../../core/services/toast.service';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

interface LiveClassForm {
  batch_id: number;
  title: string;
  description: string;
  meeting_link: string;
  scheduled_local: string;
  duration_minutes: number;
  status: LiveClassStatus;
}

type DisplayStatus = 'Upcoming' | 'Live now' | 'Completed' | 'Cancelled';
type StatusFilter = 'All' | DisplayStatus;

@Component({
  selector: 'app-live-classes',
  standalone: true,
  imports: [FormsModule, ActionButtonsComponent],
  template: `
    <section class="space-y-6">

      <!-- Header -->
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Live Classes
          </h1>
          <p class="text-sm text-slate-500">
            Schedule, view and manage your course live classes.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreate()"
          [disabled]="batches().length === 0"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Live Class
        </button>
      </header>

      <!-- Filters Bar -->
      <div class="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">

        <!-- Search -->
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="m16 16 4 4" />
            </svg>
          </span>

          <input
            type="search"
            placeholder="Search live classes..."
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Batch Filter -->
        <select
          aria-label="Filter by batch"
          [ngModel]="batchFilter()"
          (ngModelChange)="batchFilter.set(+$event)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option [ngValue]="0">All Batches</option>
          @for (b of batches(); track b.id) {
            <option [ngValue]="b.id">{{ batchLabel(b.id) }}</option>
          }
        </select>

        <!-- Status Filter -->
        <select
          aria-label="Filter by status"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="All">All Statuses</option>
          @for (s of displayStatuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>

        <!-- Reset Filters -->
        <button
          type="button"
          (click)="clearFilters()"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Reset Filters
        </button>
      </div>

      <!-- Table Card -->
      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

        @if (loading()) {
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p class="mt-3 text-sm text-slate-500">
              Loading live classes...
            </p>
          </div>
        } @else if (filtered().length === 0) {
          <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path stroke-linecap="round" stroke-linejoin="round" d="m10 9 5 3-5 3V9Z" />
              </svg>
            </div>

            <p class="mt-3 text-sm font-medium text-slate-900">
              No live classes found
            </p>

            <p class="mt-1 text-xs text-slate-500">
              @if (hasFilters()) {
                Try adjusting your search or filter options.
              } @else if (batches().length === 0) {
                Create a course batch before scheduling a live class.
              } @else {
                Get started by scheduling your first live class.
              }
            </p>

            @if (hasFilters()) {
              <button
                type="button"
                (click)="clearFilters()"
                class="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Reset Filters
              </button>
            } @else if (batches().length > 0) {
              <button
                type="button"
                (click)="openCreate()"
                class="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" d="M12 5v14M5 12h14" />
                </svg>
                New Live Class
              </button>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[850px] text-left text-sm">
              <thead class="border-b border-slate-100 bg-slate-50/75 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th class="px-5 py-3.5 font-semibold">Live Class</th>
                  <th class="px-5 py-3.5 font-semibold">Batch</th>
                  <th class="px-5 py-3.5 font-semibold">Date & Time</th>
                  <th class="px-5 py-3.5 font-semibold">Duration</th>
                  <th class="px-5 py-3.5 font-semibold">Status</th>
                  <th class="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                @for (item of filtered(); track item.id) {
                  <tr class="transition-colors hover:bg-slate-50/50">

                    <!-- Class -->
                    <td class="px-5 py-4">
                      <p class="font-semibold text-slate-900">
                        {{ item.title }}
                      </p>
                      <p class="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500">
                        {{ item.description || 'No description' }}
                      </p>
                    </td>

                    <!-- Batch and Course -->
                    <td class="px-5 py-4">
                      <p class="font-medium text-slate-700">
                        {{ batchName(item.batch_id) }}
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500">
                        {{ courseTitle(item.batch_id) }}
                      </p>
                    </td>

                    <!-- Date -->
                    <td class="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600">
                      {{ formatDate(item.scheduled_at) }}
                    </td>

                    <!-- Duration -->
                    <td class="whitespace-nowrap px-5 py-4 text-slate-600">
                      {{ item.duration_minutes }} min
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-4">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="stateClass(item)"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [class.bg-blue-500]="stateLabel(item) === 'Upcoming'"
                          [class.bg-green-500]="stateLabel(item) === 'Live now'"
                          [class.bg-slate-500]="stateLabel(item) === 'Completed'"
                          [class.bg-rose-500]="stateLabel(item) === 'Cancelled'"
                        ></span>
                        {{ stateLabel(item) }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-4 text-right">
                      <app-action-buttons
                        [showView]="true"
                        [deleteLoading]="deletingId() === item.id"
                        (viewClick)="openView(item)"
                        (editClick)="openEdit(item)"
                        (deleteClick)="onDelete(item)"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Table Footer -->
        @if (!loading() && filtered().length > 0) {
          <div class="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>
              Showing {{ filtered().length }} of {{ classes().length }} live classes
            </p>
            <p>Manage your class schedules and meeting links.</p>
          </div>
        }
      </div>
    </section>

    <!-- Create / Edit Modal -->
    @if (modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs"
        (click)="closeModal()"
      >
        <div
          class="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 class="text-lg font-bold text-slate-900">
                {{ editingId() !== null ? 'Edit Live Class' : 'New Live Class' }}
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                Enter the live class details below.
              </p>
            </div>

            <button
              type="button"
              (click)="closeModal()"
              aria-label="Close modal"
              class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form #f="ngForm" (ngSubmit)="save()" class="mt-4 space-y-4">

            <div>
              <label for="live-batch" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Course Batch
              </label>
              <select
                id="live-batch"
                name="batch_id"
                [(ngModel)]="form.batch_id"
                required
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option [ngValue]="0" disabled>Select a batch</option>
                @for (batch of batches(); track batch.id) {
                  <option [ngValue]="batch.id">{{ batchLabel(batch.id) }}</option>
                }
              </select>
            </div>

            <div>
              <label for="live-title" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Title
              </label>
              <input
                id="live-title"
                type="text"
                name="title"
                [(ngModel)]="form.title"
                required
                maxlength="150"
                placeholder="e.g. Lecture 5 - Angular Signals"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label for="live-description" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Description
              </label>
              <textarea
                id="live-description"
                name="description"
                [(ngModel)]="form.description"
                rows="3"
                maxlength="2000"
                placeholder="Write class details here..."
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              ></textarea>
            </div>

            <div>
              <label for="live-link" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Meeting Link
              </label>
              <input
                id="live-link"
                type="url"
                name="meeting_link"
                [(ngModel)]="form.meeting_link"
                required
                placeholder="https://meet.google.com/..."
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="live-datetime" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Date & Time
                </label>
                <input
                  id="live-datetime"
                  type="datetime-local"
                  name="scheduled_local"
                  [(ngModel)]="form.scheduled_local"
                  required
                  class="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label for="live-duration" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Duration (minutes)
                </label>
                <input
                  id="live-duration"
                  type="number"
                  name="duration_minutes"
                  [(ngModel)]="form.duration_minutes"
                  min="1"
                  max="1440"
                  step="1"
                  required
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label for="live-status" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Status
              </label>
              <select
                id="live-status"
                name="status"
                [(ngModel)]="form.status"
                required
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                (click)="closeModal()"
                class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                [disabled]="saving() || f.invalid || !form.batch_id || batches().length === 0"
                class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ saving() ? 'Saving...' : editingId() !== null ? 'Save Changes' : 'Schedule Class' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- View Details Modal -->
    @if (viewing(); as item) {
      <div
        class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs"
        (click)="viewing.set(null)"
      >
        <div
          class="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div class="min-w-0">
              <span class="mb-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Live Class
              </span>
              <h2 class="break-words text-xl font-bold text-slate-900">
                {{ item.title }}
              </h2>
            </div>

            <span
              class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
              [class]="stateClass(item)"
            >
              {{ stateLabel(item) }}
            </span>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <span class="rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-1.5">
              {{ courseTitle(item.batch_id) }}
            </span>
            <span class="rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-1.5">
              {{ batchName(item.batch_id) }}
            </span>
          </div>

          <div class="mt-5 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-slate-100 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Date & Time
                </p>
                <p class="mt-2 break-words text-sm font-semibold text-slate-800">
                  {{ formatDate(item.scheduled_at) }}
                </p>
              </div>

              <div class="rounded-xl border border-slate-100 p-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Duration
                </p>
                <p class="mt-2 text-sm font-semibold text-slate-800">
                  {{ item.duration_minutes }} minutes
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-slate-100 p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </p>
              <p class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                {{ item.description || 'No description provided.' }}
              </p>
            </div>

            <div class="rounded-xl border border-slate-100 p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Meeting Link
              </p>

              @if (safeMeetingLink(item.meeting_link); as url) {
                <a
                  [href]="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-2 inline-flex items-center gap-2 break-all text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M14 3h7v7M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                  Open Meeting Link
                </a>
                <p class="mt-2 break-all text-xs leading-5 text-slate-500">{{ url }}</p>
              } @else {
                <p class="mt-2 text-sm text-slate-500">
                  No valid meeting link available.
                </p>
              }
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              (click)="viewing.set(null)"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="button"
              (click)="editFromView(item)"
              class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Edit Class
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Custom Delete Confirmation -->
    @if (deleteTarget(); as item) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-xs"
        (click)="cancelDelete()"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-live-class-title"
          aria-describedby="delete-live-class-description"
          class="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" />
                </svg>
              </div>

              <div class="min-w-0 flex-1">
                <h2 id="delete-live-class-title" class="text-lg font-bold text-slate-900">
                  Delete Live Class?
                </h2>
                <p id="delete-live-class-description" class="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete this live class? This action cannot be undone.
                </p>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Live class to be deleted
              </p>
              <p class="mt-2 break-words text-sm font-bold text-slate-800">
                {{ item.title }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                {{ courseTitle(item.batch_id) }} · {{ batchName(item.batch_id) }}
              </p>
            </div>
          </div>

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
                Delete Live Class
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LiveClasses implements OnInit {
  private readonly liveService = inject(LiveClassService);
  private readonly courseService = inject(CourseService);
  private readonly toast = inject(Toast);

  readonly displayStatuses: DisplayStatus[] = [
    'Upcoming',
    'Live now',
    'Completed',
    'Cancelled',
  ];

  readonly classes = signal<LiveClass[]>([]);
  readonly batches = signal<CourseBatch[]>([]);
  readonly courses = signal<Course[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly search = signal('');
  readonly batchFilter = signal(0);
  readonly statusFilter = signal<StatusFilter>('All');

  readonly modalOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly viewing = signal<LiveClass | null>(null);
  readonly deleteTarget = signal<LiveClass | null>(null);

  form: LiveClassForm = this.emptyForm();

  readonly filtered = computed(() => {
    const batchId = this.batchFilter();
    const status = this.statusFilter();
    const query = this.search().trim().toLowerCase();

    return this.classes().filter((item) => {
      if (batchId && item.batch_id !== batchId) {
        return false;
      }

      if (status !== 'All' && this.stateLabel(item) !== status) {
        return false;
      }

      const searchable = [
        item.title,
        item.description ?? '',
        this.batchLabel(item.batch_id),
        this.courseTitle(item.batch_id),
        this.batchName(item.batch_id),
      ]
        .join(' ')
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  });

  readonly hasFilters = computed(
    () =>
      !!this.search().trim() ||
      this.batchFilter() !== 0 ||
      this.statusFilter() !== 'All',
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const [classes, batches, courses] = await Promise.all([
        this.liveService.getAll(),
        this.courseService.getAllBatches(),
        this.courseService.getCourses(),
      ]);

      this.classes.set(classes);
      this.batches.set(batches);
      this.courses.set(courses);
    } catch (error) {
      this.toast.error(
        this.message(error, 'Live classes load nahi ho sakin.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  batchLabel(batchId: number): string {
    const batch = this.batches().find((b) => b.id === batchId);

    if (!batch) return 'Unknown batch';

    const course = this.courses().find((c) => c.id === batch.course_id);

    return `${course?.title ?? 'Course'} · ${batch.batch_name} (${batch.batch_code})`;
  }

  batchName(batchId: number): string {
    const batch = this.batches().find((b) => b.id === batchId);

    return batch
      ? `${batch.batch_name} (${batch.batch_code})`
      : 'Unknown batch';
  }

  courseTitle(batchId: number): string {
    const batch = this.batches().find((b) => b.id === batchId);

    if (!batch) return 'Unknown course';

    return (
      this.courses().find((c) => c.id === batch.course_id)?.title ??
      'Unknown course'
    );
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  stateLabel(item: LiveClass): DisplayStatus {
    if (item.status === 'Cancelled') {
      return 'Cancelled';
    }

    const start = new Date(item.scheduled_at).getTime();

    if (!Number.isFinite(start)) {
      return 'Upcoming';
    }

    const now = Date.now();
    const end = start + item.duration_minutes * 60_000;

    if (now < start) return 'Upcoming';
    if (now <= end) return 'Live now';

    return 'Completed';
  }

  stateClass(item: LiveClass): string {
    const map: Record<DisplayStatus, string> = {
      Upcoming: 'bg-blue-50 text-blue-700',
      'Live now': 'bg-green-50 text-green-700',
      Completed: 'bg-slate-100 text-slate-600',
      Cancelled: 'bg-rose-50 text-rose-600 border border-rose-100/60',
    };

    return map[this.stateLabel(item)];
  }

  safeMeetingLink(value: string | null | undefined): string | null {
    if (!value) return null;

    try {
      const url = new URL(value);

      return url.protocol === 'https:' || url.protocol === 'http:'
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  clearFilters(): void {
    this.search.set('');
    this.batchFilter.set(0);
    this.statusFilter.set('All');
  }

  openView(item: LiveClass): void {
    this.viewing.set(item);
  }

  editFromView(item: LiveClass): void {
    this.viewing.set(null);
    this.openEdit(item);
  }

  openCreate(): void {
    if (this.batches().length === 0) {
      this.toast.error('Pehle ek batch create karein.');
      return;
    }

    this.editingId.set(null);
    this.form = this.emptyForm();

    if (this.batchFilter()) {
      this.form.batch_id = this.batchFilter();
    }

    this.modalOpen.set(true);
  }

  openEdit(item: LiveClass): void {
    this.editingId.set(item.id);

    this.form = {
      batch_id: item.batch_id,
      title: item.title,
      description: item.description ?? '',
      meeting_link: item.meeting_link,
      scheduled_local: this.toLocalInput(item.scheduled_at),
      duration_minutes: item.duration_minutes,
      status: item.status,
    };

    this.modalOpen.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;

    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    const title = this.form.title.trim();
    const meetingLink = this.form.meeting_link.trim();
    const scheduledDate = new Date(this.form.scheduled_local);
    const duration = Number(this.form.duration_minutes);

    if (!this.form.batch_id) {
      this.toast.error('Please select a batch.');
      return;
    }

    if (!title) {
      this.toast.error('Class title is required.');
      return;
    }

    if (!Number.isFinite(scheduledDate.getTime())) {
      this.toast.error('Valid date aur time select karein.');
      return;
    }

    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      this.toast.error('Duration 1 se 1440 minutes ke darmiyan honi chahiye.');
      return;
    }

    if (!this.safeMeetingLink(meetingLink)) {
      this.toast.error('Valid HTTP/HTTPS meeting link enter karein.');
      return;
    }

    const input: LiveClassInput = {
      batch_id: this.form.batch_id,
      title,
      description: this.form.description.trim(),
      meeting_link: meetingLink,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: duration,
      status: this.form.status,
    };

    this.saving.set(true);

    try {
      const id = this.editingId();

      if (id !== null) {
        await this.liveService.update(id, input);
        this.toast.success('Live class update ho gayi.');
      } else {
        await this.liveService.create(input);
        this.toast.success('Live class schedule ho gayi.');
      }

      this.modalOpen.set(false);
      await this.load();
    } catch (error) {
      this.toast.error(
        this.message(error, 'Live class save nahi ho saki.'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  // Open custom confirmation instead of a browser confirm dialog.
  onDelete(item: LiveClass): void {
    this.deleteTarget.set(item);
  }

  cancelDelete(): void {
    if (this.deletingId() !== null) return;

    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const item = this.deleteTarget();

    if (!item || this.deletingId() !== null) return;

    this.deletingId.set(item.id);

    try {
      await this.liveService.delete(item.id);

      this.classes.update((list) =>
        list.filter((current) => current.id !== item.id),
      );

      if (this.viewing()?.id === item.id) {
        this.viewing.set(null);
      }

      this.deleteTarget.set(null);
      this.toast.success('Live class delete ho gayi.');

      await this.load();
    } catch (error) {
      this.toast.error(
        this.message(error, 'Live class delete nahi ho saki.'),
      );
    } finally {
      this.deletingId.set(null);
    }
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private emptyForm(): LiveClassForm {
    return {
      batch_id: 0,
      title: '',
      description: '',
      meeting_link: '',
      scheduled_local: '',
      duration_minutes: 60,
      status: 'Scheduled',
    };
  }

  private message(error: unknown, fallback: string): string {
    return (error as { message?: string })?.message || fallback;
  }
}