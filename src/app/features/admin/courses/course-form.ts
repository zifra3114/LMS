import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CourseInput,
  CourseService,
} from '../../../core/services/course.service';
import { IconComponent } from '../../../shared/components/icon/icon';
import { CoverImageComponent } from '../../../shared/components/cover-image/cover-image';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [FormsModule, IconComponent, CoverImageComponent],
  host: { '(document:keydown.escape)': 'cancel.emit()' },
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      (click)="onBackdropClick($event)"
    >
      <section
        class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-form-title"
      >
        <!-- Header (fixed) -->
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="course-form-title" class="text-xl font-bold text-slate-900">
              {{ course ? 'Edit Course' : 'Create New Course' }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ course ? 'Update the details of this course.' : 'Fill in the details to add a new course.' }}
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
        </header>

        <form (ngSubmit)="submit()" #courseForm="ngForm" class="flex min-h-0 flex-1 flex-col">

          <!-- Body (scrolls) -->
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div class="grid gap-8 lg:grid-cols-5">

              <!-- Left column: details -->
              <div class="space-y-8 lg:col-span-3">

                <section class="space-y-5">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Basic information
                  </h3>

                  <div>
                    <label for="title" [class]="labelClass">Course title *</label>
                    <input
                      id="title"
                      name="title"
                      [(ngModel)]="form.title"
                      required
                      maxlength="150"
                      placeholder="e.g. Full Stack Web Development"
                      [class]="fieldClass"
                    />
                  </div>

                  <div>
                    <label for="description" [class]="labelClass">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      [(ngModel)]="form.description"
                      rows="5"
                      placeholder="What will students learn in this course?"
                      [class]="fieldClass + ' resize-y'"
                    ></textarea>
                  </div>
                </section>

                <section class="space-y-5">
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Course details
                  </h3>

                  <div class="grid gap-4 sm:grid-cols-2">

                    <div>
                      <label for="duration" [class]="labelClass">Duration *</label>
                      <input
                        id="duration"
                        name="duration"
                        [(ngModel)]="form.duration"
                        required
                        placeholder="e.g. 18 months"
                        [class]="fieldClass"
                      />
                    </div>

                    <div>
                      <label for="price" [class]="labelClass">Price (USD) *</label>
                      <div class="relative">
                        <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                        <input
                          id="price"
                          name="price"
                          type="number"
                          [(ngModel)]="form.price"
                          required
                          min="0"
                          step="0.01"
                          [class]="fieldClass + ' pl-8'"
                        />
                      </div>
                    </div>

                    <div>
                      <label for="level" [class]="labelClass">Level</label>
                      <div class="relative">
                        <select id="level" name="level" [(ngModel)]="form.level" [class]="selectClass">
                          <option value="Basic">Basic</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Expert">Expert</option>
                        </select>
                        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <app-icon name="chevron-down" [size]="16" />
                        </span>
                      </div>
                    </div>

                    <div>
                      <label for="type" [class]="labelClass">Course type</label>
                      <div class="relative">
                        <select id="type" name="type" [(ngModel)]="form.type" [class]="selectClass">
                          <option value="single">Single Course</option>
                          <option value="bundle">Bundle Course</option>
                        </select>
                        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <app-icon name="chevron-down" [size]="16" />
                        </span>
                      </div>
                    </div>

                  </div>
                </section>
              </div>

              <!-- Right column: thumbnail and status -->
              <div class="space-y-8 lg:col-span-2">

                <section>
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Course thumbnail
                  </h3>

                  <div class="mt-4">
                    @if (imagePreview) {
                      <app-cover-image
                        class="block h-64 rounded-xl border border-slate-200"
                        [src]="imagePreview"
                        alt="Course thumbnail preview"
                      />

                      @if (selectedImage) {
                        <p class="mt-2 truncate text-xs text-slate-500">
                          {{ selectedImage.name }}
                        </p>
                      }

                      <div class="mt-3 flex items-center gap-2">
                        <label
                          for="thumbnailFile"
                          class="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Change image
                        </label>

                        <button
                          type="button"
                          (click)="removeImage(thumbnailInput)"
                          class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <app-icon name="trash-2" [size]="16" />
                          Remove
                        </button>
                      </div>
                    } @else {
                      <label
                        for="thumbnailFile"
                        class="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-blue-500 hover:bg-blue-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="34"
                          height="34"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.7"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="mb-3 text-slate-500"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" x2="12" y1="3" y2="15" />
                        </svg>

                        <span class="text-sm font-semibold text-slate-700">
                          Choose an image from your computer
                        </span>
                        <span class="mt-1 text-xs text-slate-500">
                          PNG, JPG or WEBP, up to 5 MB
                        </span>
                      </label>
                    }

                    <input
                      #thumbnailInput
                      id="thumbnailFile"
                      name="thumbnailFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      (change)="onImageSelected($event)"
                      class="sr-only"
                    />

                    <p class="mt-3 text-xs text-slate-400">
                      For a sharp result, use an image at least 1200 px wide.
                    </p>

                    @if (imageError) {
                      <p class="mt-2 text-sm text-red-600" role="alert">{{ imageError }}</p>
                    }
                  </div>
                </section>

                <section>
                  <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Publication status
                  </h3>

                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="status"
                        value="Drafted"
                        [(ngModel)]="form.status"
                        class="h-4 w-4 accent-blue-600"
                      />
                      <span>
                        <span class="block font-semibold text-slate-800">Drafted</span>
                        <span class="block text-xs text-slate-500">Not visible yet</span>
                      </span>
                    </label>

                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="status"
                        value="Published"
                        [(ngModel)]="form.status"
                        class="h-4 w-4 accent-blue-600"
                      />
                      <span>
                        <span class="block font-semibold text-slate-800">Published</span>
                        <span class="block text-xs text-slate-500">Live for students</span>
                      </span>
                    </label>
                  </div>
                </section>

              </div>
            </div>
          </div>

          <!-- Footer (fixed) -->
          <footer class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
            <button
              type="button"
              (click)="cancel.emit()"
              class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              [disabled]="courseForm.invalid || saving || uploadingImage"
              class="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{
                uploadingImage
                  ? 'Uploading image...'
                  : saving
                    ? 'Saving...'
                    : course
                      ? 'Save Changes'
                      : 'Create Course'
              }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  `,
})
export class CourseFormComponent implements OnChanges, OnDestroy {
  private readonly courseService = inject(CourseService);

  @Input() course: CourseInput | null = null;
  @Input() saving = false;

  @Output() save = new EventEmitter<CourseInput>();
  @Output() cancel = new EventEmitter<void>();

  readonly labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
  readonly fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  readonly selectClass = this.fieldClass + ' appearance-none pr-10';

  form: CourseInput = this.emptyForm();

  selectedImage: File | null = null;
  imagePreview = '';
  imageError = '';
  uploadingImage = false;

  private objectUrl: string | null = null;

  ngOnChanges(): void {
    this.clearObjectUrl();

    this.form = this.course ? { ...this.course } : this.emptyForm();

    this.selectedImage = null;
    this.imagePreview = this.isUrl(this.form.thumbnail) ? this.form.thumbnail : '';
    this.imageError = '';
    this.uploadingImage = false;
  }

  ngOnDestroy(): void {
    this.clearObjectUrl();
  }

  private emptyForm(): CourseInput {
    return {
      title: '',
      description: '',
      duration: '',
      price: 0,
      level: 'Basic',
      type: 'single',
      thumbnail: '',
      status: 'Drafted',
    };
  }

  private isUrl(value: string | null | undefined): boolean {
    return (
      !!value &&
      (value.startsWith('https://') ||
        value.startsWith('http://') ||
        value.startsWith('data:image/'))
    );
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.imageError = '';

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Please select a JPG, PNG or WEBP image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.clearObjectUrl();

    this.selectedImage = file;
    this.objectUrl = URL.createObjectURL(file);
    this.imagePreview = this.objectUrl;
  }

  removeImage(input: HTMLInputElement): void {
    this.clearObjectUrl();

    this.selectedImage = null;
    this.imagePreview = '';
    this.imageError = '';
    this.form.thumbnail = '';
    input.value = '';
  }

  async submit(): Promise<void> {
    if (this.uploadingImage || this.saving) {
      return;
    }

    this.imageError = '';
    this.uploadingImage = true;

    try {
      let thumbnailUrl = this.form.thumbnail.trim();

      if (this.selectedImage) {
        thumbnailUrl = await this.courseService.uploadThumbnail(
          this.selectedImage,
        );
      }

      this.save.emit({
        ...this.form,
        title: this.form.title.trim(),
        description: this.form.description.trim(),
        thumbnail: thumbnailUrl,
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      this.imageError =
        'Image upload failed. Please check your Supabase Storage bucket and policies, then try again.';
    } finally {
      this.uploadingImage = false;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }

  private clearObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}