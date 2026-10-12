import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Student,
  StudentBatchOption,
  StudentInput,
  StudentResult,
  StudentService,
  StudentStatus,
} from '../../core/services/student.service';
import { Toast } from '../../core/services/toast.service';
import { ActionButtonsComponent } from '../../shared/components/action-buttons/action-buttons';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, ActionButtonsComponent],
  template: `
    <section class="space-y-6">
      <!-- Header Section -->
      <header class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600">Student Directory</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 mt-1">Students</h1>
          <p class="text-sm text-slate-500">
            Manage enrolled students and track their overall academic results.
          </p>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Student
        </button>
      </header>

      <!-- Stats Cards (Matching EduCore Dashboard UI) -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Total Students</p>
            <p class="text-2xl font-bold text-slate-900">{{ stats().total }}</p>
            <p class="text-[11px] text-slate-400">All registered students</p>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Passed</p>
            <p class="text-2xl font-bold text-emerald-600">{{ stats().passed }}</p>
            <p class="text-[11px] text-slate-400">Successfully completed</p>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25V12.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Failed</p>
            <p class="text-2xl font-bold text-rose-600">{{ stats().failed }}</p>
            <p class="text-[11px] text-slate-400">Needs improvement</p>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-medium text-slate-500">Pending</p>
            <p class="text-2xl font-bold text-amber-600">{{ stats().pending }}</p>
            <p class="text-[11px] text-slate-400">Evaluation pending</p>
          </div>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search by name, email..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          [value]="batchFilter()"
          (change)="batchFilter.set($any($event.target).value)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All batches</option>
          @for (batch of batches(); track batch.id) {
            <option [value]="batch.id">{{ batch.name }}</option>
          }
        </select>

        <select
          [value]="resultFilter()"
          (change)="resultFilter.set($any($event.target).value)"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All results</option>
          <option value="pass">Passed</option>
          <option value="fail">Failed</option>
          <option value="pending">Pending</option>
        </select>

        <button
          type="button"
          (click)="clearFilters()"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      </div>

      <!-- Table Section -->
      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        @if (loading()) {
          <div class="p-8 text-center text-sm text-slate-500">Loading students...</div>
        } @else if (filtered().length === 0) {
          <div class="p-8 text-center text-sm text-slate-500">
            {{
              students().length === 0
                ? 'No students have been added yet.'
                : 'No students match the selected filters.'
            }}
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50/75 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3.5 font-semibold">Student</th>
                  <th class="px-5 py-3.5 font-semibold">Batch</th>
                  <th class="px-5 py-3.5 font-semibold">Status</th>
                  <th class="px-5 py-3.5 font-semibold">Result</th>
                  <th class="px-5 py-3.5 font-semibold">Joined</th>
                  <th class="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of filtered(); track item.id) {
                  <tr class="transition-colors hover:bg-slate-50/60">
                    <td class="px-5 py-3.5">
                      <p class="font-semibold text-slate-900">{{ item.full_name }}</p>
                      <p class="text-xs text-slate-500">{{ item.email }}</p>
                    </td>
                    <td class="px-5 py-3.5 text-slate-600 font-medium text-xs">{{ batchLabel(item) }}</td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        "
                      >
                        @if (item.status === 'active') {
                          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        }
                        {{ item.status === 'active' ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="resultClass(item.result)"
                      >
                        {{ resultLabel(item.result) }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-slate-500 text-xs">
                      {{ item.created_at | date: 'mediumDate' }}
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <div class="flex items-center justify-end">
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
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        (click)="closeForm()"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 class="text-lg font-bold text-slate-900">
              {{ editingId() ? 'Edit Student' : 'Add Student' }}
            </h2>
            <button (click)="closeForm()" class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700" for="full_name">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                formControlName="full_name"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              @if (form.controls.full_name.touched && form.controls.full_name.invalid) {
                <p class="mt-1 text-xs text-rose-600">Full name is required.</p>
              }
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700" for="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                @if (form.controls.email.touched && form.controls.email.invalid) {
                  <p class="mt-1 text-xs text-rose-600">Valid email address required.</p>
                }
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700" for="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-700" for="batch">
                Batch
              </label>
              <select
                id="batch"
                formControlName="batch_id"
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">No batch</option>
                @for (batch of batches(); track batch.id) {
                  <option [value]="batch.id">{{ batch.name }}</option>
                }
              </select>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700" for="status">
                  Status
                </label>
                <select
                  id="status"
                  formControlName="status"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-700" for="result">
                  Result
                </label>
                <select
                  id="result"
                  formControlName="result"
                  class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="pending">Pending</option>
                  <option value="pass">Passed</option>
                  <option value="fail">Failed</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                (click)="closeForm()"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {{ saving() ? 'Saving...' : editingId() ? 'Save Changes' : 'Add Student' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- View Modal -->
    @if (viewing(); as item) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        (click)="viewing.set(null)"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-bold text-slate-900">{{ item.full_name }}</h2>

          <dl class="mt-4 space-y-3 text-sm border-t border-b border-slate-100 py-3">
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Email</dt>
              <dd class="text-slate-900 font-medium">{{ item.email }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Phone</dt>
              <dd class="text-slate-900 font-medium">{{ item.phone || 'Not provided' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Batch</dt>
              <dd class="text-slate-900 font-medium">{{ batchLabel(item) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Status</dt>
              <dd class="text-slate-900 font-medium">
                {{ item.status === 'active' ? 'Active' : 'Inactive' }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Result</dt>
              <dd>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  [class]="resultClass(item.result)"
                >
                  {{ resultLabel(item.result) }}
                </span>
              </dd>
            </div>
          </dl>

          <div class="mt-5 flex justify-end">
            <button
              type="button"
              (click)="viewing.set(null)"
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class StudentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StudentService);
  private readonly toast = inject(Toast);

  readonly students = signal<Student[]>([]);
  readonly batches = signal<StudentBatchOption[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly viewing = signal<Student | null>(null);

  readonly searchTerm = signal('');
  readonly batchFilter = signal<string>('all');
  readonly resultFilter = signal<'all' | StudentResult>('all');

  readonly stats = computed(() => {
    const list = this.students();
    return {
      total: list.length,
      passed: list.filter((s) => s.result === 'pass').length,
      failed: list.filter((s) => s.result === 'fail').length,
      pending: list.filter((s) => s.result === 'pending').length,
    };
  });

  readonly filtered = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const batch = this.batchFilter();
    const result = this.resultFilter();

    return this.students().filter((student) => {
      if (batch !== 'all' && String(student.batch_id) !== batch) return false;
      if (result !== 'all' && student.result !== result) return false;

      if (term) {
        const haystack =
          `${student.full_name} ${student.email} ${student.phone ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  });

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    batch_id: [''],
    status: ['active' as StudentStatus],
    result: ['pending' as StudentResult],
  });

  ngOnInit(): void {
    void this.load();
  }

  private describe(error: unknown): string {
    const e = error as { message?: string; code?: string } | null;
    if (e?.code === '23505') {
      return 'A student with this email address already exists.';
    }
    return [e?.message ?? 'Unknown error', e?.code ? `(code: ${e.code})` : '']
      .filter(Boolean)
      .join(' ');
  }

  batchLabel(student: Student): string {
    const batch = student.course_batches;
    if (!batch) return 'No batch';
    return batch.batch_code ? `${batch.batch_name} (${batch.batch_code})` : batch.batch_name;
  }

  resultLabel(result: StudentResult): string {
    const labels: Record<StudentResult, string> = {
      pending: 'Pending',
      pass: 'Passed',
      fail: 'Failed',
    };
    return labels[result] ?? 'Pending';
  }

  resultClass(result: StudentResult): string {
    const classes: Record<StudentResult, string> = {
      pending: 'bg-amber-50 text-amber-700',
      pass: 'bg-emerald-50 text-emerald-700',
      fail: 'bg-rose-50 text-rose-700',
    };
    return classes[result] ?? classes.pending;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.batchFilter.set('all');
    this.resultFilter.set('all');
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      this.students.set(await this.service.list());
    } catch (error) {
      this.toast.error(this.describe(error), 'Unable to load students');
    }

    try {
      this.batches.set(await this.service.listBatches());
    } catch (error) {
      console.error('[StudentsComponent] batches failed:', error);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      full_name: '',
      email: '',
      phone: '',
      batch_id: '',
      status: 'active',
      result: 'pending',
    });
    this.formOpen.set(true);
  }

  openEdit(student: Student): void {
    this.editingId.set(student.id);
    this.form.reset({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone ?? '',
      batch_id: student.batch_id !== null ? String(student.batch_id) : '',
      status: student.status,
      result: student.result,
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
    const input: StudentInput = {
      full_name: value.full_name.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim() || null,
      batch_id: value.batch_id ? Number(value.batch_id) : null,
      status: value.status,
      result: value.result,
    };

    this.saving.set(true);
    try {
      const id = this.editingId();

      if (id !== null) {
        const updated = await this.service.update(id, input);
        this.students.update((list) => list.map((s) => (s.id === id ? updated : s)));
        this.toast.success('Student updated successfully.', 'Updated');
      } else {
        const created = await this.service.create(input);
        this.students.update((list) => [created, ...list]);
        this.toast.success('Student added successfully.', 'Added');
      }

      this.closeForm();
    } catch (error) {
      this.toast.error(this.describe(error), 'Unable to save student');
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(student: Student): Promise<void> {
    const confirmed = window.confirm(`Delete ${student.full_name}?`);
    if (!confirmed) return;

    this.deletingId.set(student.id);
    try {
      await this.service.remove(student.id);
      this.students.update((list) => list.filter((s) => s.id !== student.id));
      this.toast.success('Student deleted successfully.', 'Deleted');
    } catch (error) {
      this.toast.error(this.describe(error), 'Unable to delete student');
    } finally {
      this.deletingId.set(null);
    }
  }
}