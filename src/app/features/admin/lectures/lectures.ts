import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course, CourseBatch, CourseService } from '../../../core/services/course.service';
import {
  Lecture,
  LectureInput,
  LectureService,
  LectureStatus,
  UploadProgress,
  formatBytes,
  formatDuration,
} from '../../../core/services/lecture.service';
import { Toast } from '../../../core/services/toast.service';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';
import { VideoPlayerComponent } from '../../../shared/components/video-player/video-player';

type StatusFilter = 'All' | LectureStatus;

@Component({
  selector: 'app-lectures',
  standalone: true,
  imports: [FormsModule, ActionButtonsComponent, VideoPlayerComponent],
  template: `
    <div class="space-y-6 p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Lectures</h1>
          <p class="text-sm text-slate-500">
            Upload recorded lectures for a batch. Only students of that batch can watch them.
          </p>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + New Lecture
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search lectures by title…"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <select
          [ngModel]="batchFilter()"
          (ngModelChange)="batchFilter.set(+$event)"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option [ngValue]="0">All Batches</option>
          @for (b of batches(); track b.id) {
            <option [ngValue]="b.id">{{ batchLabel(b.id) }}</option>
          }
        </select>

        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Drafted">Drafted</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">Lecture</th>
              <th class="px-4 py-3">Batch</th>
              <th class="px-4 py-3">Duration</th>
              <th class="px-4 py-3">Video</th>
              <th class="px-4 py-3">Visibility</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @if (loading()) {
              <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Loading lectures…</td></tr>
            } @else if (filtered().length === 0) {
              <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No lectures found.</td></tr>
            } @else {
              @for (l of filtered(); track l.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium text-slate-800">{{ l.title }}</td>
                  <td class="px-4 py-3 text-slate-600">
                    {{ l.course_batches?.courses?.title }} · {{ l.course_batches?.batch_name }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ duration(l.duration_minutes) }}</td>
                  <td class="px-4 py-3">
                    @if (uploads()[l.id]; as u) {
                      <div class="w-44 space-y-1">
                        <div class="flex items-center justify-between text-xs text-slate-600">
                          <span>Uploading {{ percent(u) }}%</span>
                          <button
                            type="button"
                            (click)="cancelUpload(l.id)"
                            class="font-semibold text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div class="h-full bg-blue-600 transition-all" [style.width.%]="percent(u)"></div>
                        </div>
                        <p class="text-xs text-slate-500">
                          {{ bytes(u.sent) }} / {{ bytes(u.total) }}
                          @if (speedText(l.id); as sp) { · {{ sp }} }
                        </p>
                      </div>
                    } @else {
                      @switch (l.processing_status) {
                        @case ('Ready') {
                          <span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Ready</span>
                        }
                        @case ('Processing') {
                          <div class="w-36 space-y-1">
                            <p class="text-xs font-semibold text-amber-700">Processing {{ l.processing_progress }}%</p>
                            <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                              <div class="h-full bg-amber-500 transition-all" [style.width.%]="l.processing_progress"></div>
                            </div>
                          </div>
                        }
                        @case ('Failed') {
                          <div class="space-y-1">
                            <span
                              class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                              [title]="l.processing_error ?? ''"
                            >
                              Failed
                            </span>
                            @if (l.processing_error) {
                              <p class="max-w-56 text-xs text-red-600">{{ l.processing_error }}</p>
                            }
                          </div>
                        }
                        @case ('Uploading') {
                          <div class="space-y-1">
                            <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Upload incomplete</span>
                            <p class="text-xs text-slate-500">Use the upload button to resume with the same file.</p>
                          </div>
                        }
                        @default {
                          <div class="space-y-1">
                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">No video</span>
                          </div>
                        }
                      }
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold"
                      [class]="l.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                    >
                      {{ l.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <app-action-buttons
                      [showUpload]="true"
                      [uploadLabel]="uploadLabel(l)"
                      [uploadDisabled]="!!uploads()[l.id] || l.processing_status === 'Processing'"
                      [deleteLoading]="deletingId() === l.id"
                      (uploadClick)="pickFile(l.id)"
                      (viewClick)="viewingId.set(l.id)"
                      (editClick)="openEdit(l)"
                      (deleteClick)="deleteTarget.set(l)"
                    />
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resume / dobara upload ke liye chhupa hua file chooser -->
    <input
      #resumeInput
      type="file"
      accept="video/*,.mkv"
      class="hidden"
      (change)="onResumeFile($event)"
    />

    <!-- Create / Edit Modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <form
          #f="ngForm"
          (ngSubmit)="save()"
          class="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 class="text-lg font-bold text-slate-800">
            {{ editingId() ? 'Edit Lecture' : 'New Lecture' }}
          </h2>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Batch</label>
            <select
              name="batch_id"
              [(ngModel)]="form.batch_id"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option [ngValue]="0" disabled>Select a batch</option>
              @for (b of batches(); track b.id) {
                <option [ngValue]="b.id">{{ batchLabel(b.id) }}</option>
              }
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Title</label>
            <input
              name="title"
              [(ngModel)]="form.title"
              required
              placeholder="e.g. Lecture 1 - Introduction"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Description (optional)</label>
            <textarea
              name="description"
              [(ngModel)]="form.description"
              rows="2"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            ></textarea>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">
              {{ editingId() ? 'Replace video (optional)' : 'Video file' }}
            </label>
            <input
              type="file"
              accept="video/*,.mkv"
              (change)="onFormFile($event)"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-700"
            />
            @if (file(); as chosen) {
              <p class="mt-1 text-xs text-slate-500">{{ chosen.name }} · {{ bytes(chosen.size) }}</p>
            }
            <p class="mt-1 text-xs text-slate-500">
              Videos of 2–4 hours are supported. Please keep this page open while uploading.
              The duration is detected automatically.
            </p>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <select
              name="status"
              [(ngModel)]="form.status"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Published">Published (visible to students)</option>
              <option value="Drafted">Drafted (hidden for now)</option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closeModal()"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="saving() || f.invalid || !form.batch_id || (!editingId() && !file())"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ saving() ? 'Saving…' : editingId() ? 'Update' : 'Create & Upload' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Preview Modal -->
    @if (viewing(); as v) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div class="w-full max-w-3xl space-y-4 rounded-2xl bg-white p-5 shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-800">{{ v.title }}</h2>
              <p class="text-xs text-slate-500">
                {{ v.course_batches?.courses?.title }} · {{ v.course_batches?.batch_name }}
                · {{ duration(v.duration_minutes) }}
              </p>
            </div>
            <button
              type="button"
              (click)="viewingId.set(null)"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          @if (v.processing_status === 'Ready') {
            <app-video-player [lectureId]="v.id" />
          } @else {
            <div class="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
              This video is not ready yet ({{ v.processing_status }}).
            </div>
          }

          @if (v.description) {
            <p class="text-sm text-slate-600">{{ v.description }}</p>
          }
        </div>
      </div>
    }

    <!-- Delete confirmation -->
    @if (deleteTarget(); as d) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <h2 class="text-lg font-bold text-slate-800">Delete lecture?</h2>
          <p class="text-sm text-slate-600">
            “{{ d.title }}” and its video will be permanently deleted. This cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="deleteTarget.set(null)"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmDelete()"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class Lectures implements OnInit, OnDestroy {
  private readonly lectureService = inject(LectureService);
  private readonly courseService = inject(CourseService);
  private readonly toast = inject(Toast);

  readonly lectures = signal<Lecture[]>([]);
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
  readonly viewingId = signal<number | null>(null);
  readonly deleteTarget = signal<Lecture | null>(null);
  readonly file = signal<File | null>(null);
  form: LectureInput = this.emptyForm();

  /** Lectures whose video is uploading right now: lecture id -> progress. */
  readonly uploads = signal<Record<number, UploadProgress>>({});
  private readonly speeds = signal<Record<number, { bytesPerSecond: number; at: number; sent: number }>>({});
  private readonly silentAbort = new Set<number>();
  private readonly lastStatus = new Map<number, string>();
  private readonly controllers = new Map<number, AbortController>();
  private resumeTarget: number | null = null;
  private poll?: ReturnType<typeof setInterval>;

  @ViewChild('resumeInput') private readonly resumeInput?: ElementRef<HTMLInputElement>;

  readonly viewing = computed(() => {
    const id = this.viewingId();
    return id === null ? null : (this.lectures().find((l) => l.id === id) ?? null);
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const batchId = this.batchFilter();
    const status = this.statusFilter();

    return this.lectures().filter((l) => {
      if (batchId && l.batch_id !== batchId) return false;
      if (status !== 'All' && l.status !== status) return false;
      if (q && !l.title.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  ngOnInit(): void {
    void this.load();

    // Refresh every 5 seconds while a video is being processed
    this.poll = setInterval(() => {
      if (this.lectures().some((l) => l.processing_status === 'Processing')) {
        void this.refresh();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.poll) clearInterval(this.poll);
    this.controllers.forEach((controller) => controller.abort());
  }

  /** Upload chal rahi ho aur tab band karne lagein to browser pooch le. */
  @HostListener('window:beforeunload', ['$event'])
  warnBeforeLeaving(event: BeforeUnloadEvent): void {
    if (Object.keys(this.uploads()).length > 0) event.preventDefault();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [lectures, batches, courses] = await Promise.all([
        this.lectureService.getAll(),
        this.courseService.getAllBatches(),
        this.courseService.getCourses(),
      ]);
      this.lectures.set(lectures);
      this.rememberStatuses(lectures);
      this.batches.set(batches);
      this.courses.set(courses);
    } catch (e) {
      this.toast.error(this.message(e, 'Please try again in a moment.'), 'Unable to load lectures');
    } finally {
      this.loading.set(false);
    }
  }

  /** Bina "Loading..." dikhaye sirf lectures taza karta hai. */
  private async refresh(): Promise<void> {
    try {
      const lectures = await this.lectureService.getAll();
      this.announceStatusChanges(lectures);
      this.lectures.set(lectures);
    } catch {
      // will retry on the next poll
    }
  }

  private rememberStatuses(lectures: Lecture[]): void {
    this.lastStatus.clear();
    lectures.forEach((l) => this.lastStatus.set(l.id, l.processing_status));
  }

  /** Toast when a video finishes (or fails) processing while the admin is on this page. */
  private announceStatusChanges(lectures: Lecture[]): void {
    for (const l of lectures) {
      const before = this.lastStatus.get(l.id);
      if (before === 'Processing' && l.processing_status === 'Ready') {
        this.toast.success(`“${l.title}” is ready to watch.`, 'Video ready');
      } else if (before && before !== 'Failed' && l.processing_status === 'Failed') {
        this.toast.error(l.processing_error || 'The video could not be processed.', 'Processing failed');
      }
    }
    this.rememberStatuses(lectures);
  }

  duration(minutes: number): string {
    return formatDuration(minutes);
  }

  bytes(value: number): string {
    return formatBytes(value);
  }

  percent(progress: UploadProgress): number {
    return progress.total ? Math.min(100, Math.floor((progress.sent / progress.total) * 100)) : 0;
  }

  speedText(lectureId: number): string {
    const s = this.speeds()[lectureId];
    const u = this.uploads()[lectureId];
    if (!s || !u || s.bytesPerSecond <= 0) return '';

    const remaining = Math.max(0, u.total - u.sent) / s.bytesPerSecond;
    const mins = Math.ceil(remaining / 60);
    const eta = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
    return `${formatBytes(s.bytesPerSecond)}/s · ${eta} left`;
  }

  uploadLabel(l: Lecture): string {
    if (l.processing_status === 'Ready') return 'Replace video';
    if (l.processing_status === 'Uploading') return 'Resume upload';
    if (l.processing_status === 'Failed') return 'Upload again';
    return 'Upload video';
  }

  batchLabel(batchId: number): string {
    const batch = this.batches().find((b) => b.id === batchId);
    if (!batch) return 'Unknown batch';
    const course = this.courses().find((c) => c.id === batch.course_id);
    return `${course?.title ?? 'Course'} · ${batch.batch_name} (${batch.batch_code})`;
  }

  // ---------- Form ----------

  openCreate(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.file.set(null);
    if (this.batchFilter()) this.form.batch_id = this.batchFilter();
    this.modalOpen.set(true);
  }

  openEdit(l: Lecture): void {
    this.editingId.set(l.id);
    this.form = {
      batch_id: l.batch_id,
      title: l.title,
      description: l.description,
      status: l.status,
    };
    this.file.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onFormFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  async save(): Promise<void> {
    const chosen = this.file();
    const editing = this.editingId();

    this.saving.set(true);
    try {
      // Validate the file before creating the row, so a wrong file never leaves an empty lecture
      if (chosen) this.lectureService.validateFile(chosen);
      if (!editing && !chosen) throw new Error('Please choose a video file to upload.');

      const input: LectureInput = {
        batch_id: this.form.batch_id,
        title: this.form.title.trim(),
        description: this.form.description.trim(),
        status: this.form.status,
      };

      let lectureId: number;
      if (editing) {
        await this.lectureService.update(editing, input);
        lectureId = editing;
        this.toast.success(`“${input.title}” has been updated.`, 'Lecture updated');
      } else {
        lectureId = (await this.lectureService.create(input)).id;
        this.toast.success(`“${input.title}” was created. Uploading the video now.`, 'Lecture created');
      }

      this.closeModal();
      await this.load();

      if (chosen) void this.startUpload(lectureId, chosen);
    } catch (e) {
      this.toast.error(this.message(e, 'Please try again.'), 'Unable to save lecture');
    } finally {
      this.saving.set(false);
    }
  }

  // ---------- Upload ----------

  /** Opens the file chooser from the table's upload button. */
  pickFile(lectureId: number): void {
    this.resumeTarget = lectureId;
    this.resumeInput?.nativeElement.click();
  }

  onResumeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.[0];
    const lectureId = this.resumeTarget;

    input.value = '';
    this.resumeTarget = null;

    if (!chosen || lectureId === null) return;

    try {
      this.lectureService.validateFile(chosen);
    } catch (e) {
      this.toast.error(this.message(e, 'Please choose a different file.'), 'Invalid file');
      return;
    }

    void this.startUpload(lectureId, chosen);
  }

  cancelUpload(lectureId: number): void {
    this.controllers.get(lectureId)?.abort();
  }

  private async startUpload(lectureId: number, file: File): Promise<void> {
    if (this.controllers.has(lectureId)) {
      this.toast.warning('A video is already being uploaded for this lecture.', 'Upload in progress');
      return;
    }

    const controller = new AbortController();
    this.controllers.set(lectureId, controller);
    this.setProgress(lectureId, { sent: 0, total: file.size });

    try {
      await this.lectureService.uploadVideo(
        lectureId,
        file,
        (progress) => this.setProgress(lectureId, progress),
        controller.signal,
      );
      this.toast.success(
        'Upload complete. The video is now being processed. Large videos can take a while.',
        'Upload complete',
      );
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        if (!this.silentAbort.has(lectureId)) {
          this.toast.info(
            'You can resume anytime by choosing the same file again.',
            'Upload cancelled',
          );
        }
      } else {
        this.toast.error(this.message(e, 'Please try again.'), 'Upload failed');
      }
    } finally {
      this.silentAbort.delete(lectureId);
      this.controllers.delete(lectureId);
      this.uploads.update((current) => {
        const next = { ...current };
        delete next[lectureId];
        return next;
      });
      this.speeds.update((current) => {
        const next = { ...current };
        delete next[lectureId];
        return next;
      });
      await this.refresh();
    }
  }

  private setProgress(lectureId: number, progress: UploadProgress): void {
    const now = Date.now();
    const previous = this.speeds()[lectureId];

    if (!previous) {
      this.speeds.update((c) => ({ ...c, [lectureId]: { bytesPerSecond: 0, at: now, sent: progress.sent } }));
    } else if (now - previous.at >= 1000) {
      const instant = ((progress.sent - previous.sent) / (now - previous.at)) * 1000;
      // smooth the number so it does not jump around
      const smoothed = previous.bytesPerSecond ? previous.bytesPerSecond * 0.7 + instant * 0.3 : instant;
      this.speeds.update((c) => ({
        ...c,
        [lectureId]: { bytesPerSecond: Math.max(0, smoothed), at: now, sent: progress.sent },
      }));
    }

    this.uploads.update((current) => ({ ...current, [lectureId]: progress }));
  }

  // ---------- Delete ----------

  async confirmDelete(): Promise<void> {
    const l = this.deleteTarget();
    if (!l) return;

    this.deleteTarget.set(null);

    if (this.controllers.has(l.id)) {
      this.silentAbort.add(l.id);
      this.controllers.get(l.id)?.abort();
    }

    this.deletingId.set(l.id);
    try {
      const { filesRemoved } = await this.lectureService.delete(l.id);
      if (this.viewingId() === l.id) this.viewingId.set(null);

      if (filesRemoved) {
        this.toast.success(`“${l.title}” and its video were deleted.`, 'Lecture deleted');
      } else {
        this.toast.warning(
          'The lecture was deleted, but the video server could not be reached, so its files may still be on the server.',
          'Deleted with a warning',
        );
      }
      await this.load();
    } catch (e) {
      this.toast.error(this.message(e, 'Please try again.'), 'Unable to delete lecture');
    } finally {
      this.deletingId.set(null);
    }
  }

  private emptyForm(): LectureInput {
    return {
      batch_id: 0,
      title: '',
      description: '',
      status: 'Published',
    };
  }

  private message(e: unknown, fallback: string): string {
    return (e as { message?: string })?.message || fallback;
  }
}