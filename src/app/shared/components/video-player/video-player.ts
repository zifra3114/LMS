import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import Hls from 'hls.js';
import type { ErrorData } from 'hls.js';
import { LectureService } from '../../../core/services/lecture.service';

const POSITION_KEY = 'lms-lecture-position:';
const MAX_MEDIA_RECOVERIES = 3;

/**
 * Apna video player (YouTube ka koi logo nahi). Server se chhota token leta hai,
 * phir hls.js se video chalata hai. Dobara kholne par wahin se shuru hoti hai jahan chhodi thi.
 */
@Component({
  selector: 'app-video-player',
  standalone: true,
  template: `
    <div class="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        #video
        class="h-full w-full"
        controls
        playsinline
        controlsList="nodownload"
        (contextmenu)="$event.preventDefault()"
      ></video>

      @if (loading() && !error()) {
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/80">
          Loading video…
        </div>
      }

      @if (error(); as message) {
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-sm text-white">
          <p>{{ message }}</p>
          <button
            type="button"
            (click)="retry()"
            class="rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      }
    </div>
  `,
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) lectureId!: number;

  @ViewChild('video', { static: true }) private readonly videoRef!: ElementRef<HTMLVideoElement>;

  private readonly lectureService = inject(LectureService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private hls?: Hls;
  private tokenRetried = false;
  private mediaRecoveries = 0;
  private lastSavedAt = 0;

  private readonly onTimeUpdate = () => {
    const now = Date.now();
    if (now - this.lastSavedAt < 5000) return;

    this.lastSavedAt = now;
    this.savePosition();
  };

  private readonly onEnded = () => this.storage('remove');

  ngOnInit(): void {
    const video = this.videoRef.nativeElement;
    video.addEventListener('timeupdate', this.onTimeUpdate);
    video.addEventListener('ended', this.onEnded);

    void this.start();
  }

  ngOnDestroy(): void {
    this.savePosition();

    const video = this.videoRef.nativeElement;
    video.removeEventListener('timeupdate', this.onTimeUpdate);
    video.removeEventListener('ended', this.onEnded);

    this.destroyHls();
    video.removeAttribute('src');
    video.load();
  }

  retry(): void {
    this.tokenRetried = false;
    this.mediaRecoveries = 0;
    void this.start();
  }

  private async start(): Promise<void> {
    this.destroyHls();
    this.loading.set(true);
    this.error.set(null);

    try {
      const url = await this.lectureService.getPlaybackUrl(this.lectureId);
      const video = this.videoRef.nativeElement;

      video.addEventListener('loadedmetadata', () => this.restorePosition(), { once: true });

      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 60 });
        this.hls = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => this.loading.set(false));
        hls.on(Hls.Events.FRAG_LOADED, () => {
          this.tokenRetried = false;
        });
        hls.on(Hls.Events.ERROR, (_event, data) => this.onHlsError(data));

        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / iPhone: apna HLS player
        video.src = url;
        this.loading.set(false);
      } else {
        this.fail('Your browser cannot play this video. Please use Chrome, Edge, Firefox or Safari.');
      }
    } catch (error) {
      this.fail((error as Error).message || 'Unable to load the video.');
    }
  }

  private onHlsError(data: ErrorData): void {
    if (!data.fatal) return;

    const code = data.response?.code;

    // Token expire ho gaya (bohat lambi baithak): naya token le kar wahin se dobara
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR && (code === 401 || code === 403)) {
      if (!this.tokenRetried) {
        this.tokenRetried = true;
        this.savePosition();
        void this.start();
        return;
      }

      this.fail('You do not have access to this video, or your session has expired. Please sign in again.');
      return;
    }

    if (data.type === Hls.ErrorTypes.MEDIA_ERROR && this.mediaRecoveries < MAX_MEDIA_RECOVERIES) {
      this.mediaRecoveries++;
      this.hls?.recoverMediaError();
      return;
    }

    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      this.fail('The connection to the video server was lost. Check your internet connection and try again.');
      return;
    }

    this.fail('The video could not be played.');
  }

  private fail(message: string): void {
    this.destroyHls();
    this.loading.set(false);
    this.error.set(message);
  }

  private destroyHls(): void {
    this.hls?.destroy();
    this.hls = undefined;
  }

  // ---------- "Jahan chhoda wahin se" ----------

  private savePosition(): void {
    const video = this.videoRef.nativeElement;

    if (video.currentTime > 5 && Number.isFinite(video.duration)) {
      this.storage('set', String(Math.floor(video.currentTime)));
    }
  }

  private restorePosition(): void {
    const video = this.videoRef.nativeElement;
    const saved = Number(this.storage('get'));

    if (saved > 5 && saved < video.duration - 10) {
      video.currentTime = saved;
    }
  }

  /** localStorage kabhi band / khali ho sakta hai, isliye har jagah try/catch. */
  private storage(action: 'get' | 'set' | 'remove', value = ''): string | null {
    try {
      const key = POSITION_KEY + this.lectureId;

      if (action === 'set') localStorage.setItem(key, value);
      else if (action === 'remove') localStorage.removeItem(key);
      else return localStorage.getItem(key);
    } catch {
      // ignore
    }

    return null;
  }
}