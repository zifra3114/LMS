import { Component, OnInit, inject, signal } from '@angular/core';
import {
  Lecture,
  LectureService,
  formatDuration,
} from '../../core/services/lecture.service';
import { Toast } from '../../core/services/toast.service';
import { VideoPlayerComponent } from '../../shared/components/video-player/video-player';

@Component({
  selector: 'app-student-lectures',
  standalone: true,
  imports: [VideoPlayerComponent],
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Recorded Lectures</h1>
        <p class="text-sm text-slate-500">Recorded lectures for your batch appear here.</p>
      </div>

      @if (loading()) {
        <p class="text-sm text-slate-500">Loading lectures…</p>
      } @else if (lectures().length === 0) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No lectures have been published for your batch yet.
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (l of lectures(); track l.id) {
            <button
              type="button"
              (click)="playing.set(l)"
              class="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-blue-300 hover:shadow-md"
            >
              <div class="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-600">
                <span class="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-800">
                  <svg viewBox="0 0 24 24" class="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <div class="space-y-1 p-4">
                <h3 class="line-clamp-2 text-sm font-semibold text-slate-800">{{ l.title }}</h3>
                <p class="text-xs text-slate-500">
                  {{ l.course_batches?.courses?.title }} · {{ l.course_batches?.batch_name }}
                </p>
                <p class="text-xs text-slate-500">{{ duration(l.duration_minutes) }}</p>
              </div>
            </button>
          }
        </div>
      }
    </div>

    <!-- Player -->
    @if (playing(); as p) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div class="w-full max-w-4xl space-y-4 rounded-2xl bg-white p-5 shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-800">{{ p.title }}</h2>
              <p class="text-xs text-slate-500">
                {{ p.course_batches?.courses?.title }} · {{ p.course_batches?.batch_name }}
              </p>
            </div>
            <button
              type="button"
              (click)="playing.set(null)"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <app-video-player [lectureId]="p.id" />

          @if (p.description) {
            <p class="text-sm text-slate-600">{{ p.description }}</p>
          }
        </div>
      </div>
    }
  `,
})
export class StudentLectures implements OnInit {
  private readonly lectureService = inject(LectureService);
  private readonly toast = inject(Toast);

  readonly lectures = signal<Lecture[]>([]);
  readonly loading = signal(true);
  readonly playing = signal<Lecture | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.lectures.set(await this.lectureService.getForMyBatches());
    } catch (e) {
      this.toast.error(
        (e as { message?: string })?.message || 'Please try again in a moment.',
        'Unable to load lectures',
      );
    } finally {
      this.loading.set(false);
    }
  }

  duration(minutes: number): string {
    return formatDuration(minutes);
  }
}