import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PAGE_STYLES } from './student-portal.styles';
import { Row, STUDENT_TABLES, StudentDataService, fmtDate, pick } from './student-data.service';

interface Stat {
  key: string;
  label: string;
  path: string;
  table: string;
  own?: boolean;
  icon: string;
  count: number | null;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="hello">WELCOME BACK</span>
        <h1>{{ profile()?.fullName ?? 'Student' }}</h1>
        <p>
          @if (profile()?.courseName) {
            {{ profile()?.courseName }}@if (profile()?.batchName) { · {{ profile()?.batchName }} }
          } @else {
            You are not enrolled in a course yet.
          }
        </p>
      </div>
      <a routerLink="/student/profile" class="hero-btn">View Profile →</a>
    </section>

    <section class="stats">
      @for (s of stats(); track s.key) {
        <a [routerLink]="s.path" class="stat">
          <span class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="s.icon"/></svg>
          </span>
          <div>
            <b>{{ s.count === null ? '–' : s.count }}</b>
            <span>{{ s.label }}</span>
          </div>
        </a>
      }
    </section>

    <section class="two-col">
      <div class="panel">
        <h2>Latest Announcements</h2>
        @if (loading()) {
          <div class="state"><span class="spinner"></span></div>
        } @else if (latest().length === 0) {
          <div class="state"><strong>No announcements yet</strong>New announcements will appear here.</div>
        } @else {
          <ul class="news">
            @for (n of latest(); track $index) {
              <li>
                <strong>{{ pick(n, ['title', 'name', 'subject']) || 'Announcement' }}</strong>
                <p>{{ pick(n, ['message', 'description', 'content', 'body']) }}</p>
                <small>{{ fmt(pick(n, ['created_at', 'published_at', 'date'])) }}</small>
              </li>
            }
          </ul>
        }
      </div>

      <div class="panel">
        <h2>My Enrollment</h2>
        <dl class="info">
          <div><dt>Course</dt><dd>{{ profile()?.courseName || '—' }}</dd></div>
          <div><dt>Batch</dt><dd>{{ profile()?.batchName || '—' }}</dd></div>
          <div><dt>Email</dt><dd>{{ profile()?.email || '—' }}</dd></div>
        </dl>
        <div class="quick">
          <a routerLink="/student/quizzes">Quizzes</a>
          <a routerLink="/student/assignments">Assignments</a>
          <a routerLink="/student/results">Results</a>
          <a routerLink="/student/live-classes">Live Classes</a>
        </div>
      </div>
    </section>
  `,
  styles: [PAGE_STYLES, `
    .hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 26px 28px; border-radius: 20px; background: #020617; color: #fff; position: relative; isolation: isolate; overflow: hidden; margin-bottom: 20px; }
    .hero::after { content: ''; position: absolute; z-index: -1; top: -90px; right: -20px; width: 200px; height: 200px; border: 30px solid rgb(37 99 235 / 16%); border-radius: 50%; }
    .hello { color: #93c5fd; font-size: 9px; font-weight: 900; letter-spacing: .2em; }
    .hero h1 { margin: 9px 0 6px; font-size: clamp(22px, 3vw, 30px); font-weight: 950; letter-spacing: -.04em; }
    .hero p { margin: 0; color: #94a3b8; font-size: 12.5px; }
    .hero-btn { flex: 0 0 auto; padding: 11px 16px; border-radius: 11px; background: #1d4ed8; color: #fff; font-size: 11.5px; font-weight: 800; text-decoration: none; transition: background .2s ease; }
    .hero-btn:hover { background: #fff; color: #020617; }

    .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .stat { display: flex; align-items: center; gap: 13px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; text-decoration: none; color: #0f172a; box-shadow: 0 2px 4px rgb(15 23 42 / 4%); transition: border-color .18s ease, transform .18s ease; }
    .stat:hover { border-color: #93c5fd; transform: translateY(-1px); }
    .stat-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; flex: 0 0 auto; }
    .stat-icon svg { width: 20px; height: 20px; }
    .stat b { display: block; font-size: 22px; line-height: 1; font-weight: 950; color: #020617; }
    .stat span { color: #64748b; font-size: 11px; font-weight: 700; }

    .two-col { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 16px; align-items: start; }
    .news { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .news li { padding: 13px 0; border-bottom: 1px solid #f1f5f9; }
    .news li:last-child { border-bottom: 0; }
    .news strong { font-size: 12.5px; font-weight: 900; }
    .news p { margin: 5px 0; color: #64748b; font-size: 11.5px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .news small { color: #94a3b8; font-size: 10px; font-weight: 700; }

    .info { margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .info div { display: flex; flex-direction: column; gap: 3px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
    .info dt { color: #94a3b8; font-size: 9.5px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    .info dd { margin: 0; font-size: 12.5px; font-weight: 800; overflow-wrap: anywhere; }
    .quick { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .quick a { padding: 9px 12px; border: 1px solid #dbeafe; border-radius: 10px; background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 800; text-decoration: none; }
    .quick a:hover { background: #020617; border-color: #020617; color: #fff; }

    @media (max-width: 900px) { .two-col { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 639px) { .hero { flex-direction: column; align-items: flex-start; padding: 22px 18px; } }
  `],
})
export class StudentDashboardComponent implements OnInit {
  private readonly data = inject(StudentDataService);

  readonly profile = this.data.profile;
  readonly loading = signal(true);
  readonly latest = signal<Row[]>([]);
  readonly stats = signal<Stat[]>([
    { key: 'ann', label: 'Announcements', path: '/student/announcements', table: STUDENT_TABLES.announcements, icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4', count: null },
    { key: 'lec', label: 'Lectures', path: '/student/lectures', table: STUDENT_TABLES.lectures, icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z', count: null },
    { key: 'live', label: 'Live Classes', path: '/student/live-classes', table: STUDENT_TABLES.liveClasses, icon: 'M23 7l-7 5 7 5V7zM1 5h15v14H1z', count: null },
    { key: 'quiz', label: 'Quizzes', path: '/student/quizzes', table: STUDENT_TABLES.quizzes, icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', count: null },
    { key: 'asg', label: 'Assignments', path: '/student/assignments', table: STUDENT_TABLES.assignments, icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8', count: null },
    { key: 'res', label: 'Results', path: '/student/results', table: STUDENT_TABLES.results, own: true, icon: 'M4 19V5M4 19h17M8 15l4-4 3 3 5-7', count: null },
  ]);

  readonly pick = pick;
  readonly fmt = fmtDate;

  async ngOnInit(): Promise<void> {
    await this.data.load();

    const current = this.stats();
    const results = await Promise.allSettled(
      current.map(s => this.data.list(s.table, { own: s.own })),
    );

    this.stats.set(
      current.map((s, i) => ({
        ...s,
        count: results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<Row[]>).value.length : 0,
      })),
    );

    const announcements = results[0];
    if (announcements.status === 'fulfilled') {
      this.latest.set(announcements.value.slice(0, 4));
    }
    this.loading.set(false);
  }
}