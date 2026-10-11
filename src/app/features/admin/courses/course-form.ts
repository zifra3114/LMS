import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../../../shared/components/icon/icon';
import { CourseInput, CourseService } from '../../../core/services/course.service';
import {
  BatchStatus,
  CourseBatch,
  CourseLevel,
  CourseStatus,
  CourseType,
} from './courses.models';

export interface CourseBatchDraft {
  id?: number;
  batch_name: string;
  batch_code: string;
  start_date: string;
  end_date: string;
  status: BatchStatus;
}

export interface CourseFormSavePayload {
  course: CourseInput;
  batches: CourseBatchDraft[];
}

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        class="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Course form"
      >

        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900">
              {{ course ? 'Edit Course' : 'Create Course' }}
            </h2>
            <p class="mt-0.5 text-sm text-slate-500">
              Manage course details and batches.
            </p>
          </div>

          <button
            type="button"
            (click)="cancel.emit()"
            class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close form"
          >
            <app-icon name="x" />
          </button>
        </div>

        <form
          class="flex min-h-0 flex-1 flex-col"
          (ngSubmit)="submit()"
          #courseForm="ngForm"
        >
          <!-- Scrollable body -->
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="space-y-5 p-6">

              <!-- Course details -->
              <section>
                <h3 class="mb-4 text-base font-semibold text-slate-900">
                  Course Details
                </h3>

                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">

                  <div class="md:col-span-2">
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      [(ngModel)]="form.title"
                      required
                      maxlength="200"
                      placeholder="Enter course title"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      [(ngModel)]="form.description"
                      rows="3"
                      placeholder="Describe this course"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    ></textarea>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Duration *
                    </label>
                    <input
                      type="text"
                      name="duration"
                      [(ngModel)]="form.duration"
                      required
                      placeholder="e.g. 3 months"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      [(ngModel)]="form.price"
                      required
                      min="0"
                      placeholder="Enter price"
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Course Level *
                    </label>
                    <select
                      name="level"
                      [(ngModel)]="form.level"
                      required
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Basic">Basic</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Course Type *
                    </label>
                    <select
                      name="type"
                      [(ngModel)]="form.type"
                      required
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="single">Single</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>

                  <!-- Thumbnail upload -->
                  <div class="md:col-span-2">
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Course Thumbnail
                    </label>

                    <input
                      #fileInput
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      class="hidden"
                      (change)="onFileSelected($event)"
                    />

                    <button
                      *ngIf="!form.thumbnail"
                      type="button"
                      (click)="fileInput.click()"
                      [disabled]="uploading"
                      class="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center transition hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span
                        *ngIf="uploading"
                        class="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
                      ></span>

                      <span class="text-sm font-semibold text-slate-700">
                        {{ uploading ? 'Uploading image...' : 'Click to upload image' }}
                      </span>
                      <span class="mt-1 text-xs text-slate-500">
                        JPG, PNG or WebP, up to 5 MB
                      </span>
                    </button>

                    <div *ngIf="form.thumbnail" class="space-y-3">
                      <div class="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          [src]="form.thumbnail"
                          alt="Course thumbnail preview"
                          class="mx-auto max-h-56 w-auto max-w-full object-contain"
                        />
                      </div>

                      <div class="flex flex-wrap gap-3">
                        <button
                          type="button"
                          (click)="fileInput.click()"
                          [disabled]="uploading"
                          class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {{ uploading ? 'Uploading...' : 'Change Image' }}
                        </button>

                        <button
                          type="button"
                          (click)="removeThumbnail()"
                          [disabled]="uploading"
                          class="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <p *ngIf="uploadError" class="mt-2 text-sm text-red-600">
                      {{ uploadError }}
                    </p>
                  </div>

                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-slate-700">
                      Publication Status *
                    </label>
                    <select
                      name="status"
                      [(ngModel)]="form.status"
                      required
                      class="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Drafted">Drafted</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Batch management -->
              <section class="border-t border-slate-200 pt-6">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-slate-900">
                      Course Batches
                    </h3>
                    <p class="mt-0.5 text-sm text-slate-500">
                      Add one or more batches for this course. Batches are optional.
                    </p>
                  </div>

                  <button
                    type="button"
                    (click)="addBatch()"
                    class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    + Add Batch
                  </button>
                </div>

                <p
                  *ngIf="batches.length === 0"
                  class="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500"
                >
                  No batches added yet. Click "Add Batch" to create one.
                </p>

                <div class="space-y-3">
                  <div
                    *ngFor="let batch of batches; let i = index; trackBy: trackBatch"
                    class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div class="mb-3 flex items-center justify-between">
                      <h4 class="text-sm font-semibold text-slate-900">
                        Batch {{ i + 1 }}
                      </h4>

                      <button
                        type="button"
                        (click)="removeBatch(i)"
                        class="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-slate-700">
                          Batch Name *
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="batch.batch_name"
                          [ngModelOptions]="{ standalone: true }"
                          placeholder="e.g. Morning Batch"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-slate-700">
                          Batch Code *
                        </label>
                        <input
                          type="text"
                          [(ngModel)]="batch.batch_code"
                          [ngModelOptions]="{ standalone: true }"
                          (ngModelChange)="batch.batch_code = $event.toUpperCase()"
                          placeholder="e.g. PY-MOR-01"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-slate-700">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          [(ngModel)]="batch.start_date"
                          [ngModelOptions]="{ standalone: true }"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-slate-700">
                          End Date *
                        </label>
                        <input
                          type="date"
                          [(ngModel)]="batch.end_date"
                          [ngModelOptions]="{ standalone: true }"
                          [min]="batch.start_date || null"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div class="md:col-span-2">
                        <label class="mb-1.5 block text-sm font-medium text-slate-700">
                          Batch Status *
                        </label>
                        <select
                          [(ngModel)]="batch.status"
                          [ngModelOptions]="{ standalone: true }"
                          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <p
                      *ngIf="batchErrors[i]"
                      class="mt-3 text-sm text-red-600"
                    >
                      {{ batchErrors[i] }}
                    </p>
                  </div>
                </div>

                <p *ngIf="generalError" class="mt-4 text-sm text-red-600">
                  {{ generalError }}
                </p>
              </section>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              (click)="cancel.emit()"
              [disabled]="saving"
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              [disabled]="saving || uploading || courseForm.invalid"
              class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (course ? 'Update Course' : 'Create Course') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CourseFormComponent implements OnChanges {
  private courseService = inject(CourseService);

  @Input() course: CourseInput | null = null;
  @Input() existingBatches: CourseBatch[] = [];
  @Input() saving = false;

  @Output() save = new EventEmitter<CourseFormSavePayload>();
  @Output() cancel = new EventEmitter<void>();

  form: CourseInput = this.emptyCourse();
  batches: CourseBatchDraft[] = [];
  batchErrors: Record<number, string> = {};
  generalError = '';

  uploading = false;
  uploadError = '';

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.uploadError = '';
    this.uploading = true;

    try {
      this.form.thumbnail = await this.courseService.uploadThumbnail(file);
    } catch (error) {
      this.uploadError =
        error instanceof Error ? error.message : 'Image could not be uploaded.';
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  removeThumbnail(): void {
    this.form.thumbnail = '';
    this.uploadError = '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['course']) {
      this.form = this.course
        ? { ...this.course }
        : this.emptyCourse();
    }

    if (changes['existingBatches']) {
      this.batches = (this.existingBatches ?? []).map((batch) => ({
        id: batch.id,
        batch_name: batch.batch_name,
        batch_code: batch.batch_code,
        start_date: batch.start_date,
        end_date: batch.end_date,
        status: batch.status,
      }));

      this.batchErrors = {};
      this.generalError = '';
    }
  }

  private emptyCourse(): CourseInput {
    return {
      title: '',
      description: '',
      duration: '',
      price: 0,
      level: 'Basic' as CourseLevel,
      type: 'single' as CourseType,
      thumbnail: '',
      status: 'Drafted' as CourseStatus,
    };
  }

  addBatch(): void {
    this.batches = [
      ...this.batches,
      {
        batch_name: '',
        batch_code: '',
        start_date: '',
        end_date: '',
        status: 'Upcoming',
      },
    ];
  }

  removeBatch(index: number): void {
    this.batches = this.batches.filter((_, i) => i !== index);

    const updatedErrors: Record<number, string> = {};
    this.batches.forEach((_, i) => {
      if (this.batchErrors[i] && i < index) {
        updatedErrors[i] = this.batchErrors[i];
      } else if (this.batchErrors[i + 1] && i >= index) {
        updatedErrors[i] = this.batchErrors[i + 1];
      }
    });

    this.batchErrors = updatedErrors;
    this.generalError = '';
  }

  trackBatch(index: number, batch: CourseBatchDraft): number | string {
    return batch.id ?? `new-${index}`;
  }

  submit(): void {
    this.generalError = '';
    this.batchErrors = {};

    if (!this.form.title.trim()) {
      this.generalError = 'Please enter a course title.';
      return;
    }

    if (!this.form.duration.trim()) {
      this.generalError = 'Please enter the course duration.';
      return;
    }

    if (Number(this.form.price) < 0 || !Number.isFinite(Number(this.form.price))) {
      this.generalError = 'Please enter a valid course price.';
      return;
    }

    const seenCodes = new Set<string>();

    this.batches.forEach((batch, index) => {
      if (
        !batch.batch_name.trim() ||
        !batch.batch_code.trim() ||
        !batch.start_date ||
        !batch.end_date
      ) {
        this.batchErrors[index] =
          'Please complete the batch name, code, start date, and end date.';
        return;
      }

      if (batch.end_date < batch.start_date) {
        this.batchErrors[index] =
          'End date must be on or after the start date.';
        return;
      }

      const code = batch.batch_code.trim().toUpperCase();

      if (seenCodes.has(code)) {
        this.batchErrors[index] =
          'This batch code is duplicated. Each batch needs a unique code.';
        return;
      }

      seenCodes.add(code);
    });

    if (Object.keys(this.batchErrors).length > 0) {
      this.generalError = 'Please correct the batch errors before saving.';
      return;
    }

    const coursePayload: CourseInput = {
      ...this.form,
      title: this.form.title.trim(),
      description: this.form.description?.trim() ?? '',
      duration: this.form.duration.trim(),
      price: Number(this.form.price),
      thumbnail: this.form.thumbnail?.trim() ?? '',
    };

    const batchPayload = this.batches.map((batch) => ({
      ...batch,
      batch_name: batch.batch_name.trim(),
      batch_code: batch.batch_code.trim().toUpperCase(),
    }));

    this.save.emit({
      course: coursePayload,
      batches: batchPayload,
    });
  }
}