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
            Batch ke liye recorded lectures upload karein. Sirf us batch ke students dekh payenge.
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
          placeholder="Lecture title search karein..."
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
              <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            } @else if (filtered().length === 0) {
              <tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Koi lecture nahi mila.</td></tr>
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
                          <span>Upload {{ percent(u) }}%</span>
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
                        <p class="text-xs text-slate-500">{{ bytes(u.sent) }} / {{ bytes(u.total) }}</p>
                      </div>
                    } @else {
                      @switch (l.processing_status) {
                        @case ('Ready') {
                          <span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Ready</span>
                        }
                        @case ('Processing') {
                          <div class="w-36 space-y-1">
                            <p class="text-xs font-semibold text-amber-700">Convert ho rahi hai {{ l.processing_progress }}%</p>
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
                            <button type="button" (click)="pickFile(l.id)" class="block text-xs font-semibold text-blue-600 hover:underline">
                              Dobara upload karein
                            </button>
                          </div>
                        }
                        @case ('Uploading') {
                          <div class="space-y-1">
                            <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Upload adhoora</span>
                            <button type="button" (click)="pickFile(l.id)" class="block text-xs font-semibold text-blue-600 hover:underline">
                              Wahi file chun kar jaari rakhein
                            </button>
                          </div>
                        }
                        @default {
                          <div class="space-y-1">
                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Video nahi hai</span>
                            <button type="button" (click)="pickFile(l.id)" class="block text-xs font-semibold text-blue-600 hover:underline">
                              Video upload karein
                            </button>
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
                      [deleteLoading]="deletingId() === l.id"
                      (viewClick)="viewing.set(l)"
                      (editClick)="openEdit(l)"
                      (deleteClick)="remove(l)"
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
              <option [ngValue]="0" disabled>Batch select karein</option>
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
              {{ editingId() ? 'Nayi video (sirf badalni ho to)' : 'Video file' }}
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
              2 se 4 ghante ki bhi chalegi. Upload ke dauran ye page band na karein.
              Duration video se khud nikal li jati hai.
            </p>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <select
              name="status"
              [(ngModel)]="form.status"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Published">Published (students ko nazar aayegi)</option>
              <option value="Drafted">Drafted (abhi chhupi rahegi)</option>
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
              {{ saving() ? 'Saving...' : editingId() ? 'Update' : 'Create & Upload' }}
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
              (click)="viewing.set(null)"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          @if (v.processing_status === 'Ready') {
            <app-video-player [lectureId]="v.id" />
          } @else {
            <div class="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
              Video abhi tayyar nahi hai ({{ v.processing_status }}).
            </div>
          }

          @if (v.description) {
            <p class="text-sm text-slate-600">{{ v.description }}</p>
          }
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
  readonly viewing = signal<Lecture | null>(null);
  readonly file = signal<File | null>(null);
  form: LectureInput = this.emptyForm();

  /** Is waqt jin lectures ki video upload ho rahi hai: lecture id -> kitna bhej chuke. */
  readonly uploads = signal<Record<number, UploadProgress>>({});
  private readonly controllers = new Map<number, AbortController>();
  private resumeTarget: number | null = null;
  private poll?: ReturnType<typeof setInterval>;

  @ViewChild('resumeInput') private readonly resumeInput?: ElementRef<HTMLInputElement>;

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

    // Convert hone ka percent dikhane ke liye har 5 second mein list taza karo
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
      this.batches.set(batches);
      this.courses.set(courses);
    } catch (e) {
      this.toast.error(this.message(e, 'Lectures load nahi ho sakin.'));
    } finally {
      this.loading.set(false);
    }
  }

  /** Bina "Loading..." dikhaye sirf lectures taza karta hai. */
  private async refresh(): Promise<void> {
    try {
      this.lectures.set(await this.lectureService.getAll());
    } catch {
      // agli baar phir koshish hogi
    }
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
      // Row banane se pehle file check, taake ghalat file par khali lecture na ban jaye
      if (chosen) this.lectureService.validateFile(chosen);
      if (!editing && !chosen) throw new Error('Please choose a video file.');

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
        this.toast.success('Lecture update ho gaya.');
      } else {
        lectureId = (await this.lectureService.create(input)).id;
        this.toast.success('Lecture ban gaya. Video upload shuru ho rahi hai.');
      }

      this.closeModal();
      await this.load();

      if (chosen) void this.startUpload(lectureId, chosen);
    } catch (e) {
      this.toast.error(this.message(e, 'Lecture save nahi ho saka.'));
    } finally {
      this.saving.set(false);
    }
  }

  // ---------- Upload ----------

  /** Table se "upload karein / jaari rakhein" dabane par file chooser kholta hai. */
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
      this.toast.error(this.message(e, 'Ye file theek nahi.'));
      return;
    }

    void this.startUpload(lectureId, chosen);
  }

  cancelUpload(lectureId: number): void {
    this.controllers.get(lectureId)?.abort();
  }

  private async startUpload(lectureId: number, file: File): Promise<void> {
    if (this.controllers.has(lectureId)) {
      this.toast.warning('Is lecture ki video pehle se upload ho rahi hai.');
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
      this.toast.success('Upload mukammal. Ab video convert ho rahi hai.');
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        this.toast.info('Upload rok diya. Wahi file dobara chun kar jaari rakh sakte hain.');
      } else {
        this.toast.error(this.message(e, 'Video upload nahi ho saki.'));
      }
    } finally {
      this.controllers.delete(lectureId);
      this.uploads.update((current) => {
        const next = { ...current };
        delete next[lectureId];
        return next;
      });
      await this.refresh();
    }
  }

  private setProgress(lectureId: number, progress: UploadProgress): void {
    this.uploads.update((current) => ({ ...current, [lectureId]: progress }));
  }

  // ---------- Delete ----------

  async remove(l: Lecture): Promise<void> {
    if (!confirm(`"${l.title}" ko delete karna hai? Is ki video bhi hamesha ke liye mit jayegi.`)) return;

    this.controllers.get(l.id)?.abort();

    this.deletingId.set(l.id);
    try {
      const { filesRemoved } = await this.lectureService.delete(l.id);
      if (filesRemoved) {
        this.toast.success('Lecture delete ho gaya.');
      } else {
        this.toast.warning(
          'Lecture delete ho gaya, lekin video server se rabta na hone ki wajah se uski files server par reh gayi hain.',
        );
      }
      await this.load();
    } catch (e) {
      this.toast.error(this.message(e, 'Lecture delete nahi ho saka.'));
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
