
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { LiveClass, LiveClassService } from '../../core/services/liveclass.service';
import { Toast } from '../../core/services/toast.service';

type ClassState = 'live' | 'soon' | 'upcoming' | 'ended' | 'cancelled';

/** Join button class shuru hone se itne minute pehle khul jata hai. */
const JOIN_EARLY_MINUTES = 10;

@Component({
  selector: 'app-student-live-classes',
  standalone: true,
  template: `
    <div class="space-y-6 p-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Live Classes</h1>
        <p class="text-sm text-slate-500">Aapke batch ki live classes yahan nazar aayengi.</p>
      </div>

      @if (loading()) {
        <p class="text-sm text-slate-500">Loading...</p>
      } @else if (classes().length === 0) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Abhi aapke batch ki koi live class schedule nahi hai.
        </div>
      } @else {
        <!-- Live / Upcoming -->
        <section class="space-y-3">
          <h2 class="text-sm font-semibold text-slate-700">Live & Upcoming</h2>

          @if (current().length === 0) {
            <p class="text-sm text-slate-500">Koi upcoming class nahi.</p>
          }

          @for (c of current(); track c.id) {
            <div
              class="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4"
              [class]="state(c) === 'live' ? 'border-green-300' : 'border-slate-200'"
            >
              <div class="min-w-0 space-y-1">
                <div class="flex items-center gap-2">
                  <h3 class="truncate text-base font-semibold text-slate-800">{{ c.title }}</h3>
                  @if (state(c) === 'live') {
                    <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Live now
                    </span>
                  } @else if (state(c) === 'cancelled') {
                    <span class="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Cancelled
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-500">
                  {{ c.course_batches?.courses?.title }} · {{ c.course_batches?.batch_name }}
                </p>
                <p class="text-sm text-slate-600">
                  {{ formatDate(c.scheduled_at) }} · {{ c.duration_minutes }} min
                </p>
                @if (c.description) {
                  <p class="text-sm text-slate-500">{{ c.description }}</p>
                }
              </div>

              @if (state(c) === 'live' || state(c) === 'soon') {
                <a
                  [href]="c.meeting_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Join Class
                </a>
              } @else if (state(c) === 'upcoming') {
                <span class="rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-500">
                  Join {{ JOIN_EARLY_MINUTES }} min pehle khulega
                </span>
              }
            </div>
          }
        </section>

        <!-- Past -->
        @if (past().length > 0) {
          <section class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-700">Past Classes</h2>
            @for (c of past(); track c.id) {
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 class="text-sm font-semibold text-slate-700">{{ c.title }}</h3>
                <p class="text-xs text-slate-500">
                  {{ c.course_batches?.batch_name }} · {{ formatDate(c.scheduled_at) }}
                </p>
              </div>
            }
          </section>
        }
      }
    </div>
  `,
})
export class StudentLiveClasses implements OnInit, OnDestroy {
  private readonly liveService = inject(LiveClassService);
  private readonly toast = inject(Toast);

  readonly JOIN_EARLY_MINUTES = JOIN_EARLY_MINUTES;

  readonly classes = signal<LiveClass[]>([]);
  readonly loading = signal(true);

  /** Har 30 second mein update hota hai taake "Live now" / Join button khud badal jaye. */
  private readonly now = signal(Date.now());
  private timer?: ReturnType<typeof setInterval>;

  readonly current = computed(() =>
    this.classes().filter((c) => this.state(c) !== 'ended'),
  );

  readonly past = computed(() =>
    this.classes()
      .filter((c) => this.state(c) === 'ended')
      .reverse(),
  );

  ngOnInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), 30_000);
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.classes.set(await this.liveService.getForMyBatches());
    } catch (e) {
      this.toast.error(
        (e as { message?: string })?.message || 'Live classes load nahi ho sakin.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  state(c: LiveClass): ClassState {
    if (c.status === 'Cancelled') return 'cancelled';

    const now = this.now();
    const start = new Date(c.scheduled_at).getTime();
    const end = start + c.duration_minutes * 60_000;

    if (now > end) return 'ended';
    if (now >= start) return 'live';
    if (now >= start - JOIN_EARLY_MINUTES * 60_000) return 'soon';
    return 'upcoming';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString([], {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}