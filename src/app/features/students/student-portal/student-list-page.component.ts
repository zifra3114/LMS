import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PAGE_STYLES } from './student-portal.styles';
import { Row, StudentDataService, fmtDate, pick } from './student-data.service';

interface ViewItem {
  title: string;
  body: string;
  date: string;
  chips: { label: string; value: string }[];
  link: string;
}

const TITLE_KEYS = ['title', 'name', 'quiz_title', 'assignment_title', 'lecture_title', 'topic', 'subject'];
const BODY_KEYS = ['description', 'message', 'content', 'body', 'instructions', 'details'];
const DATE_KEYS = ['created_at', 'published_at', 'date'];
const LINK_KEYS = ['meeting_link', 'join_url', 'zoom_link', 'video_url', 'link', 'url'];

const CHIPS: { label: string; keys: string[]; date?: boolean }[] = [
  { label: 'Score', keys: ['score', 'obtained_marks', 'marks_obtained'] },
  { label: 'Total Marks', keys: ['total_marks', 'max_marks', 'marks'] },
  { label: 'Percentage', keys: ['percentage'] },
  { label: 'Status', keys: ['status'] },
  { label: 'Duration', keys: ['duration', 'duration_minutes'] },
  { label: 'Due', keys: ['due_date', 'deadline'], date: true },
  { label: 'Starts', keys: ['start_time', 'scheduled_at', 'start_date', 'class_date'], date: true },
];

/**
 * Ek hi page jo announcements, lectures, live classes, quizzes,
 * assignments aur results sab dikhata hai. Route ke `data` se pata chalta hai
 * ke kaunsa table aur kaunsa title dikhana hai.
 */
@Component({
  selector: 'app-student-list-page',
  standalone: true,
  template: `
    <div class="page-head">
      <span class="kicker">{{ kicker }}</span>
      <h1>{{ heading }}</h1>
      <p>{{ subtitle }}</p>
    </div>

    @if (loading()) {
      <div class="state"><span class="spinner"></span>Loading...</div>
    } @else if (error()) {
      <div class="state error">
        <strong>Could not load {{ heading.toLowerCase() }}</strong>
        {{ error() }}
      </div>
    } @else if (items().length === 0) {
      <div class="state"><strong>Nothing here yet</strong>{{ emptyText }}</div>
    } @else {
      <div class="cards">
        @for (item of items(); track $index) {
          <article class="item">
            <h3>{{ item.title }}</h3>
            @if (item.body) { <p class="body">{{ item.body }}</p> }
            @if (item.chips.length > 0) {
              <div class="chips">
                @for (c of item.chips; track c.label) {
                  <span class="chip"><b>{{ c.label }}</b> {{ c.value }}</span>
                }
              </div>
            }
            @if (item.link) {
              <a class="open-btn" [href]="item.link" target="_blank" rel="noopener noreferrer">Open →</a>
            }
            @if (item.date) { <span class="date">{{ item.date }}</span> }
          </article>
        }
      </div>
    }
  `,
  styles: [PAGE_STYLES],
})
export class StudentListPageComponent implements OnInit {
  private readonly data = inject(StudentDataService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly items = signal<ViewItem[]>([]);

  heading = '';
  kicker = '';
  subtitle = '';
  emptyText = '';

  async ngOnInit(): Promise<void> {
    const cfg = this.route.snapshot.data as {
      heading: string;
      kicker?: string;
      subtitle?: string;
      empty?: string;
      table: string;
      own?: boolean;
    };

    this.heading = cfg.heading;
    this.kicker = cfg.kicker ?? 'My Learning';
    this.subtitle = cfg.subtitle ?? '';
    this.emptyText = cfg.empty ?? 'Check back later.';

    try {
      await this.data.load();
      const rows = await this.data.list(cfg.table, { own: cfg.own });
      this.items.set(rows.map(row => this.toView(row, cfg.heading)));
    } catch (e) {
      this.error.set(
        `${e instanceof Error ? e.message : 'Unknown error'}. Table name ya access policy check karein (student-data.service.ts).`,
      );
    } finally {
      this.loading.set(false);
    }
  }

  private toView(row: Row, fallbackTitle: string): ViewItem {
    const chips: { label: string; value: string }[] = [];
    for (const chip of CHIPS) {
      const raw = pick(row, chip.keys);
      if (raw) {
        chips.push({ label: chip.label, value: chip.date ? fmtDate(raw) : raw });
      }
    }
    return {
      title: pick(row, TITLE_KEYS) || fallbackTitle,
      body: pick(row, BODY_KEYS),
      date: fmtDate(pick(row, DATE_KEYS)),
      chips,
      link: pick(row, LINK_KEYS),
    };
  }
}