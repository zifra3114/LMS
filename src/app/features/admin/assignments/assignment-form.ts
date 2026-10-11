import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  AssignmentBatchOption,
  AssignmentCourseOption,
  AssignmentService,
} from '../../../core/services/assignment.service';
import { Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-assignment-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <!-- Modal Popup Overlay with items-start to prevent top clipping -->
    <div
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm flex justify-center items-start"
      (click)="goBack()"
    >
      <!-- Modal Box Container -->
      <div
        class="relative flex flex-col w-full max-w-2xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header (Always Fixed at Top) -->
        <div class="px-6 py-4 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div class="pr-4">
            <h2 class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {{ isEdit() ? 'Edit Assignment' : 'Create Assignment' }}
            </h2>
            <p class="mt-0.5 text-xs sm:text-sm text-slate-500">
              Configure course details, target specific batches, and assign tasks.
            </p>
          </div>

          <!-- Close Button (X) -->
          <button
            type="button"
            (click)="goBack()"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          @if (message()) {
            <div class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 shadow-xs" role="alert">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
              <div class="flex-1 font-medium">{{ message() }}</div>
            </div>
          }

          @if (pageLoading()) {
            <div class="flex flex-col items-center justify-center py-16">
              <div class="relative h-10 w-10">
                <div class="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div class="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p class="mt-4 text-sm font-medium text-slate-600 animate-pulse">Loading assignment details...</p>
            </div>
          } @else {
            <form
              (ngSubmit)="save()"
              class="space-y-6"
            >
              <!-- Target Audience -->
              <section class="space-y-3">
                <div class="border-b border-slate-100 pb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Target Audience</h3>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-1.5">
                    <label for="course" class="block text-xs font-semibold text-slate-700">
                      Course <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <select
                        id="course"
                        name="course"
                        [ngModel]="courseId"
                        (ngModelChange)="onCourseChange($event)"
                        required
                        class="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option [ngValue]="null" disabled>Select a course</option>
                        @for (course of courses(); track course.id) {
                          <option [ngValue]="course.id">{{ course.title }}</option>
                        }
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label for="batch" class="block text-xs font-semibold text-slate-700">
                      Batch <span class="font-normal text-slate-400">(optional)</span>
                    </label>
                    <div class="relative">
                      <select
                        id="batch"
                        name="batch"
                        [ngModel]="batchId"
                        (ngModelChange)="onBatchChange($event)"
                        class="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option [ngValue]="null">All batches (Entire Course)</option>
                        @for (batch of visibleBatches; track batch.id) {
                          <option [ngValue]="batch.id">{{ batch.batch_name }} ({{ batch.batch_code }})</option>
                        }
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                @if (courseId !== null && !visibleBatches.length) {
                  <p class="text-xs font-medium text-amber-600">
                    No specific batches found. It will be sent to all enrolled course students.
                  </p>
                }
              </section>

              <!-- Assignment Details -->
              <section class="space-y-3 pt-4 border-t border-slate-100">
                <div class="border-b border-slate-100 pb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Assignment Details</h3>
                </div>

                <div class="space-y-4">
                  <div class="space-y-1.5">
                    <label for="title" class="block text-xs font-semibold text-slate-700">
                      Title <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      [(ngModel)]="title"
                      required
                      maxlength="200"
                      placeholder="e.g. Build a Responsive Landing Page"
                      class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <label for="description" class="block text-xs font-semibold text-slate-700">
                      Description / Instructions
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      [(ngModel)]="description"
                      rows="3"
                      placeholder="Explain what students need to do..."
                      class="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    ></textarea>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-1.5">
                      <label for="marks" class="block text-xs font-semibold text-slate-700">
                        Total Marks <span class="text-red-500">*</span>
                      </label>
                      <input
                        id="marks"
                        name="marks"
                        type="number"
                        [(ngModel)]="totalMarks"
                        min="1"
                        required
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div class="space-y-1.5">
                      <label for="deadline" class="block text-xs font-semibold text-slate-700">
                        Deadline <span class="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        id="deadline"
                        name="deadline"
                        type="datetime-local"
                        [(ngModel)]="deadline"
                        class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition hover:bg-slate-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Image Upload -->
              <section class="space-y-3 pt-4 border-t border-slate-100">
                <div class="border-b border-slate-100 pb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900">Assignment Image</h3>
                </div>

                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  (change)="onFileSelected($event)"
                />

                <div>
                  @if (!attachmentUrl) {
                    <button
                      type="button"
                      (click)="fileInput.click()"
                      [disabled]="uploading()"
                      class="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-5 text-center transition hover:border-blue-500 hover:bg-blue-50/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      @if (uploading()) {
                        <div class="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                      }
                      <span class="text-xs font-semibold text-slate-700">
                        {{ uploading() ? 'Uploading image...' : 'Click to upload reference image' }}
                      </span>
                      <span class="mt-0.5 text-[11px] text-slate-400">JPG, PNG or WebP, up to 5 MB</span>
                    </button>
                  } @else {
                    <div class="space-y-3">
                      <div class="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 p-2 flex justify-center">
                        <img
                          [src]="attachmentUrl"
                          alt="Preview"
                          class="max-h-40 w-auto rounded-lg object-contain"
                        />
                      </div>

                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          (click)="fileInput.click()"
                          [disabled]="uploading()"
                          class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {{ uploading() ? 'Uploading...' : 'Change image' }}
                        </button>

                        <button
                          type="button"
                          (click)="removeImage()"
                          [disabled]="uploading()"
                          class="rounded-xl px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  }

                  @if (uploadError()) {
                    <p class="mt-1.5 text-xs text-red-600">{{ uploadError() }}</p>
                  }
                </div>
              </section>

              <!-- Sticky Footer Buttons inside Form -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 bg-white shrink-0 mt-6">
                <button
                  type="button"
                  (click)="goBack()"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="saving() || uploading() || !title.trim() || courseId === null"
                  class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  @if (saving()) {
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  }
                  {{ saving() ? 'Saving...' : (isEdit() ? 'Save Changes' : 'Create Assignment') }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class AssignmentFormComponent {
  private readonly service = inject(AssignmentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  readonly courses = signal<AssignmentCourseOption[]>([]);
  readonly batches = signal<AssignmentBatchOption[]>([]);

  readonly pageLoading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly isEdit = signal(false);
  readonly message = signal('');
  readonly uploadError = signal('');

  courseId: number | null = null;
  batchId: number | null = null;
  title = '';
  description = '';
  totalMarks = 100;
  deadline = ''; 
  attachmentUrl = '';

  private editId: number | null = null;

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.editId = Number(idParam);
      this.isEdit.set(true);
    }

    void this.init();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    void this.goBack();
  }

  goBack(): void {
    void this.router.navigate(['/admin/assignments']);
  }

  get visibleBatches(): AssignmentBatchOption[] {
    const all = this.batches();

    return this.courseId === null
      ? all
      : all.filter((batch) => batch.course_id === this.courseId);
  }

  onCourseChange(courseId: number | null): void {
    this.courseId = courseId;

    const stillValid = this.batches().some(
      (batch) => batch.id === this.batchId && batch.course_id === courseId,
    );

    if (!stillValid) {
      this.batchId = null;
    }
  }

  onBatchChange(batchId: number | null): void {
    this.batchId = batchId;

    if (batchId !== null && this.courseId === null) {
      const batch = this.batches().find((b) => b.id === batchId);

      if (batch) {
        this.courseId = batch.course_id;
      }
    }
  }

  private async init(): Promise<void> {
    this.pageLoading.set(this.isEdit());

    try {
      const [courses, batches] = await Promise.all([
        this.service.getCourses(),
        this.service.getAllBatches(),
      ]);

      this.courses.set(courses);
      this.batches.set(batches);

      if (this.editId !== null) {
        const a = await this.service.getAssignment(this.editId);

        this.courseId = a.course_id;
        this.batchId = a.batch_id;
        this.title = a.title;
        this.description = a.description ?? '';
        this.totalMarks = a.total_marks;
        this.deadline = this.toLocalInput(a.deadline);
        this.attachmentUrl = a.attachment_url ?? '';
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.pageLoading.set(false);
    }
  }

  private toLocalInput(iso: string | null): string {
    if (!iso) return '';

    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.uploadError.set('');
    this.uploading.set(true);

    try {
      this.attachmentUrl = await this.service.uploadImage(file);
    } catch (error) {
      this.uploadError.set(
        (error as { message?: string } | null)?.message || 'Image could not be uploaded.',
      );
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  removeImage(): void {
    this.attachmentUrl = '';
    this.uploadError.set('');
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    if (this.courseId === null) {
      this.showError('Please select a course.');
      return;
    }

    this.saving.set(true);
    this.message.set('');

    const draft = {
      course_id: Number(this.courseId),
      batch_id: this.batchId,
      title: this.title,
      description: this.description,
      attachment_url: this.attachmentUrl || null,
      total_marks: Number(this.totalMarks),
      deadline: this.deadline ? new Date(this.deadline).toISOString() : null,
    };

    try {
      if (this.editId !== null) {
        this.service.updateAssignment ? await this.service.updateAssignment(this.editId, draft) : null;
        this.toast.success('Assignment updated successfully.', 'Assignment');
      } else {
        await this.service.createAssignment(draft);
        this.toast.success('Assignment created and sent to the batch.', 'Assignment');
      }

      await this.router.navigate(['/admin/assignments']);
    } catch (error) {
      this.showError(error);
    } finally {
      this.saving.set(false);
    }
  }

  private showError(error: unknown): void {
    const text =
      typeof error === 'string'
        ? error
        : (error as { message?: string } | null)?.message ||
          'Something went wrong. Please try again.';

    this.message.set(text);
    this.toast.error(text, 'Assignment');
  }
}