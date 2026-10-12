
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import {
  ASSIGNMENT_PASS_PERCENT,
  ResultBatch,
  ResultKind,
  ResultOptions,
  ResultRow,
  ResultService,
  ResultStatus,
  WorkOption,
} from '../../../core/services/result.service';

import { Toast } from '../../../core/services/toast.service';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    UpperCasePipe,
    ActionButtonsComponent,
  ],
  template: `
    <section class="min-w-0 space-y-6 pb-8">

      <!-- Page Header -->
      <header class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div class="min-w-0">
          <div class="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
            </svg>
            Academic Management
          </div>

          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Results & Grades
          </h1>

          <p class="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Track student performance, evaluate submissions and manage academic results.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreate()"
          class="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-200 active:translate-y-0"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/>
          </svg>
          Record New Result
        </button>
      </header>

      <!-- Analytics Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <!-- Pass Rate -->
        <article class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-500">Pass Rate</p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {{ stats().passRate }}<span class="ml-0.5 text-xl text-slate-400">%</span>
              </h2>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-emerald-500 transition-all duration-500" [style.width.%]="stats().passRate"></div>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            <span class="font-bold text-emerald-600">{{ stats().passed }}</span>
            students passed
          </p>
        </article>

        <!-- Average -->
        <article class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-500">Average Score</p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {{ stats().average }}<span class="ml-0.5 text-xl text-slate-400">%</span>
              </h2>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M7 14l4-4 4 4 6-7"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-indigo-600 transition-all duration-500" [style.width.%]="stats().average"></div>
          </div>
          <p class="mt-3 text-xs text-slate-500">Average across scored results</p>
        </article>

        <!-- Pending -->
        <article class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-500">Pending Evaluation</p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-amber-600">
                {{ stats().pending }}
              </h2>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-amber-500"></span>
            <p class="text-xs text-slate-500">Awaiting grading or review</p>
          </div>
        </article>

        <!-- Failed -->
        <article class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-500">Unsuccessful Results</p>
              <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-rose-600">
                {{ stats().failed }}
              </h2>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-rose-500"></span>
            <p class="text-xs text-slate-500">Students requiring support</p>
          </div>
        </article>
      </div>

      <!-- Results Workspace -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <!-- Table Header -->
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-extrabold text-slate-900">Student Results</h2>
            <p class="mt-1 text-xs text-slate-500">
              Review scores, submission details and evaluation status.
            </p>
          </div>

          <div class="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            {{ filtered().length }} records
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 xl:grid-cols-5">

          <div class="relative sm:col-span-2 xl:col-span-2">
            <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
              <circle cx="11" cy="11" r="7"/>
              <path stroke-linecap="round" d="m20 20-4-4"/>
            </svg>
            <input
              type="search"
              placeholder="Search student or assessment..."
              [value]="searchTerm()"
              (input)="searchTerm.set($any($event.target).value)"
              class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <select
            [value]="kindFilter()"
            (change)="kindFilter.set($any($event.target).value)"
            aria-label="Filter by assessment type"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="all">All Assessment Types</option>
            <option value="quiz">Quizzes</option>
            <option value="assignment">Assignments</option>
          </select>

          <select
            [value]="batchFilter()"
            (change)="batchFilter.set($any($event.target).value)"
            aria-label="Filter by batch"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="all">All Batches</option>
            @for (batch of batches(); track batch.id) {
              <option [value]="batch.id">{{ batch.name }}</option>
            }
          </select>

          <div class="flex gap-2">
            <select
              [value]="statusFilter()"
              (change)="statusFilter.set($any($event.target).value)"
              aria-label="Filter by result status"
              class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="all">All Statuses</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
              <option value="pending">Pending</option>
            </select>

            <button
              type="button"
              (click)="clearFilters()"
              title="Reset all filters"
              aria-label="Reset all filters"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0 1 18 6l2 3M18.5 15A7 7 0 0 1 6 18l-2-3"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex min-h-72 flex-col items-center justify-center px-5 py-12">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
            <p class="mt-4 text-sm font-bold text-slate-700">Loading results</p>
            <p class="mt-1 text-xs text-slate-400">Please wait while records are fetched.</p>
          </div>
        }

        <!-- Empty State -->
        @else if (filtered().length === 0) {
          <div class="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-800">No results found</h3>
            <p class="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              No records match your current search or filters. Try changing your filters or record a new result.
            </p>
            <button
              type="button"
              (click)="clearFilters()"
              class="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        }

        <!-- Results Table -->
        @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1000px] text-left">
              <thead>
                <tr class="border-b border-slate-100 bg-white">
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Student</th>
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Assessment</th>
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Batch</th>
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Score</th>
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                  <th class="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Submitted</th>
                  <th class="px-5 py-4 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-slate-100">
                @for (row of filtered(); track row.key) {
                  <tr class="group transition-colors hover:bg-indigo-50/30">

                    <!-- Student -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-extrabold text-indigo-700 ring-1 ring-indigo-100">
                          {{ row.studentName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="min-w-0">
                          <p class="max-w-[180px] truncate text-sm font-bold text-slate-800">
                            {{ row.studentName }}
                          </p>
                          <p class="mt-1 text-xs text-slate-400">Student record</p>
                        </div>
                      </div>
                    </td>

                    <!-- Assessment -->
                    <td class="px-5 py-4">
                      <p class="max-w-[220px] truncate text-sm font-bold text-slate-800">
                        {{ row.title }}
                      </p>
                      <span
                        class="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                        [class.bg-violet-50]="row.kind === 'quiz'"
                        [class.text-violet-700]="row.kind === 'quiz'"
                        [class.bg-sky-50]="row.kind === 'assignment'"
                        [class.text-sky-700]="row.kind === 'assignment'"
                      >
                        @if (row.kind === 'quiz') {
                          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
                          </svg>
                        } @else {
                          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                          </svg>
                        }
                        {{ row.kind }}
                      </span>
                    </td>

                    <!-- Batch -->
                    <td class="px-5 py-4">
                      <span class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                        </svg>
                        {{ row.batchName }}
                      </span>
                    </td>

                    <!-- Score -->
                    <td class="px-5 py-4">
                      @if (row.marks === null) {
                        <span class="text-sm font-semibold text-slate-300">Not graded</span>
                      } @else {
                        <div class="flex items-baseline gap-1">
                          <span class="text-sm font-extrabold text-slate-900">{{ row.marks }}</span>
                          <span class="text-xs font-medium text-slate-400">/ {{ row.totalMarks }}</span>
                        </div>
                        <p class="mt-1 text-xs font-bold"
                          [class.text-emerald-600]="row.status === 'pass'"
                          [class.text-rose-600]="row.status === 'fail'"
                          [class.text-slate-500]="row.status === 'pending'">
                          {{ row.percentage }}%
                        </p>
                      }
                    </td>

                    <!-- Status -->
                    <td class="px-5 py-4">
                      <span
                        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold"
                        [class]="statusClass(row.status)"
                      >
                        <span class="h-1.5 w-1.5 rounded-full"
                          [class.bg-emerald-500]="row.status === 'pass'"
                          [class.bg-rose-500]="row.status === 'fail'"
                          [class.bg-amber-500]="row.status === 'pending'">
                        </span>
                        {{ statusLabel(row) }}
                      </span>
                    </td>

                    <!-- Date -->
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-500">
                        <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <rect x="3" y="5" width="18" height="16" rx="2"/>
                          <path stroke-linecap="round" d="M16 3v4M8 3v4M3 11h18"/>
                        </svg>
                        {{ row.date ? (row.date | date: 'mediumDate') : '—' }}
                      </div>
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-4">
                      <div class="flex items-center justify-end">
                        <app-action-buttons
                          [deleteLoading]="deletingKey() === row.key"
                          (viewClick)="viewing.set(row)"
                          (editClick)="openEdit(row)"
                          (deleteClick)="askDelete(row)"
                        />
                      </div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs font-medium text-slate-500">
              Showing <span class="font-bold text-slate-800">{{ filtered().length }}</span>
              result records
            </p>
            <p class="text-xs text-slate-400">Academic Results Management</p>
          </div>
        }
      </div>
    </section>

    <!-- Create / Edit Modal -->
    @if (formOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
        (click)="closeForm()"
      >
        <div
          class="my-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl sm:rounded-3xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                @if (editing()) {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 2.651 2.651M8 16l3.5-.5L20 7a2.12 2.12 0 0 0-3-3l-8.5 8.5L8 16ZM5 20h14"/>
                  </svg>
                } @else {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14"/>
                  </svg>
                }
              </div>
              <div>
                <h2 class="text-lg font-extrabold text-slate-900">
                  {{ editing() ? 'Update Result' : 'Record New Result' }}
                </h2>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ editing() ? 'Update the student evaluation details.' : 'Enter assessment and student marks.' }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="closeForm()"
              aria-label="Close modal"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18"/>
              </svg>
            </button>
          </div>

          <!-- Independently Scrollable Form -->
          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6"
          >
            @if (editing(); as current) {
              <div class="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white font-extrabold text-indigo-600 shadow-sm">
                  {{ current.studentName.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-slate-900">{{ current.studentName }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ current.title }} · {{ current.batchName }}</p>
                </div>
              </div>
            } @else {
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="result-kind" class="mb-2 block text-xs font-bold text-slate-700">Assessment Type</label>
                  <select
                    id="result-kind"
                    formControlName="kind"
                    (change)="onSelectionChange()"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <label for="result-batch" class="mb-2 block text-xs font-bold text-slate-700">Target Batch</label>
                  <select
                    id="result-batch"
                    formControlName="batch_id"
                    (change)="onSelectionChange()"
                    class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">All batches</option>
                    @for (batch of batches(); track batch.id) {
                      <option [value]="batch.id">{{ batch.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div>
                <label for="result-work" class="mb-2 block text-xs font-bold text-slate-700">Assessment / Work</label>
                <select
                  id="result-work"
                  formControlName="work_id"
                  required
                  class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">Select an assessment</option>
                  @for (work of availableWorks(); track work.id) {
                    <option [value]="work.id">{{ work.title }} ({{ work.totalMarks }} marks)</option>
                  }
                </select>
              </div>

              <div>
                <label for="result-student" class="mb-2 block text-xs font-bold text-slate-700">Student</label>
                <select
                  id="result-student"
                  formControlName="student_id"
                  required
                  class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">Select a student</option>
                  @for (student of options().students; track student.id) {
                    <option [value]="student.id">{{ student.name }}</option>
                  }
                </select>
              </div>
            }

            <!-- Marks -->
            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label for="result-marks" class="text-xs font-bold text-slate-700">Marks Obtained</label>
                @if (formTotal() > 0) {
                  <span class="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    Maximum: {{ formTotal() }}
                  </span>
                }
              </div>

              <div class="relative">
                <input
                  id="result-marks"
                  type="number"
                  step="any"
                  min="0"
                  formControlName="marks"
                  required
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
              <p class="mt-1.5 text-xs text-slate-400">Enter the marks achieved by the student.</p>
            </div>

            <!-- Assignment Feedback -->
            @if (formKind() === 'assignment') {
              <div>
                <label for="result-feedback" class="mb-2 block text-xs font-bold text-slate-700">Feedback & Remarks</label>
                <textarea
                  id="result-feedback"
                  rows="4"
                  formControlName="feedback"
                  placeholder="Write constructive feedback for the student..."
                  class="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                ></textarea>
              </div>
            }

            @if (formError()) {
              <div class="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-sm text-rose-700">
                <svg class="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <circle cx="12" cy="12" r="9"/>
                  <path stroke-linecap="round" d="M12 8v4m0 4h.01"/>
                </svg>
                <p>{{ formError() }}</p>
              </div>
            }

            <!-- Form Actions -->
            <div class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                (click)="closeForm()"
                class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (saving()) {
                  <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity=".25"/>
                    <path d="M22 12a10 10 0 0 1-10 10"/>
                  </svg>
                  Saving...
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6"/>
                  </svg>
                  {{ editing() ? 'Update Result' : 'Save Result' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- View Result Modal -->
    @if (viewing(); as row) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
        (click)="viewing.set(null)"
      >
        <div
          class="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl sm:rounded-3xl"
          (click)="$event.stopPropagation()"
        >
          <div class="bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-7 text-white sm:px-7">
            <div class="flex items-start justify-between gap-4">
              <div class="flex min-w-0 items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7-9.75-7-9.75-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div class="min-w-0">
                  <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                    {{ row.kind }} Result
                  </span>
                  <h2 class="mt-1 break-words text-xl font-extrabold">{{ row.title }}</h2>
                  <p class="mt-1 text-sm text-indigo-100">Student performance details</p>
                </div>
              </div>

              <button
                type="button"
                (click)="viewing.set(null)"
                aria-label="Close details"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m6 6 12 12M18 6 6 18"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-5 p-5 sm:p-7">
            <!-- Student Identity -->
            <div class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg font-extrabold text-indigo-700">
                {{ row.studentName.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Name</p>
                <p class="mt-1 break-words text-sm font-extrabold text-slate-900">{{ row.studentName }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ row.batchName }}</p>
              </div>
              <span
                class="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold"
                [class]="statusClass(row.status)"
              >
                {{ statusLabel(row) }}
              </span>
            </div>

            <!-- Score Highlight -->
            <div class="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Final Score</p>
              @if (row.marks === null) {
                <p class="mt-2 text-2xl font-extrabold text-slate-400">Not graded</p>
                <p class="mt-1 text-xs text-slate-500">Marks have not been recorded yet.</p>
              } @else {
                <div class="mt-2 flex flex-wrap items-baseline gap-2">
                  <span class="text-4xl font-extrabold tracking-tight text-indigo-700">{{ row.marks }}</span>
                  <span class="text-base font-semibold text-slate-400">/ {{ row.totalMarks }} marks</span>
                  <span class="ml-auto rounded-lg bg-white px-3 py-1.5 text-sm font-extrabold text-indigo-700 shadow-sm">
                    {{ row.percentage }}%
                  </span>
                </div>
                <div class="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    class="h-full rounded-full transition-all"
                    [class.bg-emerald-500]="row.status === 'pass'"
                    [class.bg-rose-500]="row.status === 'fail'"
                    [class.bg-amber-500]="row.status === 'pending'"
                    [style.width.%]="row.percentage"
                  ></div>
                </div>
              }
            </div>

            <!-- Details -->
            <div class="divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
              <div class="flex items-center justify-between gap-4 py-3.5">
                <span class="text-sm text-slate-500">Assessment Type</span>
                <span class="text-sm font-bold capitalize text-slate-800">{{ row.kind }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 py-3.5">
                <span class="text-sm text-slate-500">Batch</span>
                <span class="text-right text-sm font-bold text-slate-800">{{ row.batchName }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 py-3.5">
                <span class="text-sm text-slate-500">Submitted Date</span>
                <span class="text-right text-sm font-semibold text-slate-800">
                  {{ row.date ? (row.date | date: 'mediumDate') : '—' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-4 py-3.5">
                <span class="text-sm text-slate-500">Evaluation Status</span>
                <span class="text-right text-sm font-bold text-slate-800">{{ statusLabel(row) }}</span>
              </div>
            </div>

            @if (row.kind === 'assignment' && row.feedback) {
              <div class="rounded-xl border border-slate-200 p-4">
                <div class="flex items-center gap-2">
                  <svg class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 7 3-3h11a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 2 2.83V21Z"/>
                  </svg>
                  <h3 class="text-sm font-bold text-slate-800">Feedback & Remarks</h3>
                </div>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{{ row.feedback }}</p>
              </div>
            }

            <div class="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                (click)="viewing.set(null)"
                class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget(); as target) {
      <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        (click)="closeDelete()"
      >
        <div
          class="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl sm:rounded-3xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6 text-center sm:p-8">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"/>
              </svg>
            </div>

            <h2 id="delete-title" class="mt-5 text-xl font-extrabold text-slate-900">
              Delete this result?
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              You are about to delete the result for
              <span class="font-bold text-slate-800">{{ target.studentName }}</span>
              in
              <span class="font-bold text-slate-800">{{ target.title }}</span>.
              This action cannot be undone.
            </p>

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                (click)="closeDelete()"
                [disabled]="deletingKey() !== null"
                class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmDelete()"
                [disabled]="deletingKey() !== null"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (deletingKey() !== null) {
                  <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity=".25"/>
                    <path d="M22 12a10 10 0 0 1-10 10"/>
                  </svg>
                  Deleting...
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>
                  </svg>
                  Delete Result
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminResults implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ResultService);
  private readonly toast = inject(Toast);

  readonly passPercent = ASSIGNMENT_PASS_PERCENT;

  readonly rows = signal<ResultRow[]>([]);
  readonly batches = signal<ResultBatch[]>([]);
  readonly options = signal<ResultOptions>({
    students: [],
    quizzes: [],
    assignments: [],
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingKey = signal<string | null>(null);

  readonly viewing = signal<ResultRow | null>(null);
  readonly deleteTarget = signal<ResultRow | null>(null);
  readonly formOpen = signal(false);
  readonly editing = signal<ResultRow | null>(null);
  readonly formError = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly kindFilter = signal<'all' | ResultKind>('all');
  readonly batchFilter = signal('all');
  readonly statusFilter = signal<'all' | ResultStatus>('all');

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const kind = this.kindFilter();
    const batch = this.batchFilter();
    const status = this.statusFilter();

    return this.rows().filter((row) => {
      if (kind !== 'all' && row.kind !== kind) return false;
      if (batch !== 'all' && String(row.batchId) !== batch) return false;
      if (status !== 'all' && row.status !== status) return false;

      if (term) {
        const haystack = `${row.studentName} ${row.title}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  readonly stats = computed(() => {
    const list = this.filtered();

    const passed = list.filter((r) => r.status === 'pass').length;
    const failed = list.filter((r) => r.status === 'fail').length;
    const pending = list.filter((r) => r.status === 'pending').length;

    const scored = list.filter((r) => r.percentage !== null);

    const average =
      scored.length === 0
        ? 0
        : scored.reduce((sum, r) => sum + (r.percentage ?? 0), 0) /
          scored.length;

    const decided = passed + failed;
    const passRate = decided === 0 ? 0 : (passed / decided) * 100;

    return {
      passed,
      failed,
      pending,
      average: Math.round(average * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
    };
  });

  readonly form = this.fb.nonNullable.group({
    kind: ['quiz' as ResultKind],
    batch_id: [''],
    work_id: [''],
    student_id: [''],
    marks: [0],
    feedback: [''],
  });

  ngOnInit(): void {
    void this.load();
  }

  private describe(error: unknown): string {
    const e = error as { message?: string; code?: string } | null;

    if (e?.code === '23505') {
      return 'This student already has a result for the selected item.';
    }

    return [e?.message ?? 'Unknown error', e?.code ? `(code: ${e.code})` : '']
      .filter(Boolean)
      .join(' ');
  }

  formKind(): ResultKind {
    return this.editing()?.kind ?? this.form.controls.kind.value;
  }

  availableWorks(): WorkOption[] {
    const kind = this.form.controls.kind.value;
    const batch = this.form.controls.batch_id.value;

    const list =
      kind === 'quiz'
        ? this.options().quizzes
        : this.options().assignments;

    return batch
      ? list.filter((w) => String(w.batchId) === batch)
      : list;
  }

  formTotal(): number {
    const current = this.editing();

    if (current) return current.totalMarks;

    const workId = this.form.controls.work_id.value;

    if (!workId) return 0;

    return (
      this.availableWorks().find((w) => String(w.id) === workId)
        ?.totalMarks ?? 0
    );
  }

  onSelectionChange(): void {
    this.form.controls.work_id.setValue('');
  }

  statusLabel(row: ResultRow): string {
    if (row.status === 'pass') return 'Passed';
    if (row.status === 'fail') return 'Failed';

    return row.kind === 'assignment' ? 'Needs grading' : 'Pending';
  }

  statusClass(status: ResultStatus): string {
    const classes: Record<ResultStatus, string> = {
      pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      fail: 'bg-rose-50 text-rose-700 border-rose-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return classes[status];
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.kindFilter.set('all');
    this.batchFilter.set('all');
    this.statusFilter.set('all');
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const data = await this.service.loadResults();

      this.rows.set(data.rows);
      this.batches.set(data.batches);
    } catch (error) {
      this.toast.error(this.describe(error), 'Unable to load results');
    }

    try {
      this.options.set(await this.service.loadOptions());
    } catch (error) {
      console.error('[AdminResults] options failed:', error);

      this.toast.warning(
        'Students and quizzes could not be loaded, so new results cannot be added right now.',
        'Form data unavailable',
      );
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);

    this.form.reset({
      kind: 'quiz',
      batch_id: '',
      work_id: '',
      student_id: '',
      marks: 0,
      feedback: '',
    });

    this.formOpen.set(true);
  }

  openEdit(row: ResultRow): void {
    this.editing.set(row);
    this.formError.set(null);

    this.form.reset({
      kind: row.kind,
      batch_id: row.batchId !== null ? String(row.batchId) : '',
      work_id: String(row.workId),
      student_id: row.studentId,
      marks: row.marks ?? 0,
      feedback: row.feedback ?? '',
    });

    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.formError.set(null);
  }

  async onSubmit(): Promise<void> {
    const value = this.form.getRawValue();
    const current = this.editing();
    const kind = current ? current.kind : value.kind;
    const marks = Number(value.marks);

    if (!current) {
      if (!value.work_id) {
        this.formError.set(`Select a ${kind}.`);
        return;
      }

      if (!value.student_id) {
        this.formError.set('Select a student.');
        return;
      }
    }

    if (!Number.isFinite(marks) || marks < 0) {
      this.formError.set('Enter valid marks.');
      return;
    }

    const total = this.formTotal();

    if (total > 0 && marks > total) {
      this.formError.set(`Marks cannot exceed ${total}.`);
      return;
    }

    if (kind === 'quiz' && !Number.isInteger(marks)) {
      this.formError.set('Quiz marks must be a whole number.');
      return;
    }

    this.formError.set(null);
    this.saving.set(true);

    try {
      const feedback = value.feedback.trim() || null;

      if (current) {
        await this.service.updateResult(current, { marks, feedback });

        this.toast.success('Result updated successfully.', 'Updated');
      } else {
        await this.service.createResult({
          kind,
          workId: Number(value.work_id),
          studentId: value.student_id,
          marks,
          feedback,
        });

        this.toast.success('Result recorded successfully.', 'Recorded');
      }

      this.closeForm();
      await this.load();
    } catch (error) {
      console.error('[AdminResults] save failed:', error);

      this.toast.error(this.describe(error), 'Unable to save result');
    } finally {
      this.saving.set(false);
    }
  }

  askDelete(row: ResultRow): void {
    this.deleteTarget.set(row);
  }

  closeDelete(): void {
    if (this.deletingKey() !== null) return;

    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const row = this.deleteTarget();

    if (!row) return;

    this.deletingKey.set(row.key);

    try {
      await this.service.deleteResult(row);

      this.rows.update((list) =>
        list.filter((r) => r.key !== row.key),
      );

      this.toast.success('Result deleted successfully.', 'Deleted');
      this.deleteTarget.set(null);
    } catch (error) {
      console.error('[AdminResults] delete failed:', error);

      this.toast.error(this.describe(error), 'Unable to delete result');
    } finally {
      this.deletingKey.set(null);
    }
  }
}