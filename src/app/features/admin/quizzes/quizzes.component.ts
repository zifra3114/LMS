
import { DatePipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';
import { QuizRecord, QuizService } from '../../../core/services/quiz.service';
import { Toast } from '../../../core/services/toast.service';

type StatusFilter = 'all' | QuizRecord['status'];

type DialogState = {
  type: 'publish' | 'delete' | 'close' | 'reopen';
  quiz: QuizRecord;
} | null;

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [DatePipe, RouterLink, ActionButtonsComponent],
  template: `
    <main class="page">
      <header class="head">
        <div>
          <h1>Quizzes</h1>
          <p class="sub">
            Create quizzes, publish them to students and track their status.
          </p>
        </div>

        <a routerLink="/admin/quizzes/new" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create quiz
        </a>
      </header>

      @if (message()) {
        <div class="notice" [class.error]="isError()" role="status">
          <span>{{ message() }}</span>
          <button type="button" class="notice-close"
            (click)="message.set('')" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      }

      <section class="stats">
        @for (stat of stats(); track stat.key) {
          <article class="stat">
            <div class="stat-icon" [attr.data-tone]="stat.key">
              @switch (stat.key) {
                @case ('all') {
                  <svg width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                }
                @case ('published') {
                  <svg width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                  </svg>
                }
                @case ('draft') {
                  <svg width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                }
                @default {
                  <svg width="20" height="20" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                }
              }
            </div>
            <div>
              <span class="stat-label">{{ stat.label }}</span>
              <strong class="stat-value">{{ stat.value }}</strong>
            </div>
          </article>
        }
      </section>

      <section class="card">
        <div class="toolbar">
          <div class="search">
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder="Search quizzes..."
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              aria-label="Search quizzes"
            />
          </div>

          <div class="toolbar-right">
            <div class="tabs" role="tablist" aria-label="Filter quizzes">
              @for (tab of filters; track tab.value) {
                <button
                  type="button"
                  role="tab"
                  class="tab"
                  [class.active]="filter() === tab.value"
                  [attr.aria-selected]="filter() === tab.value"
                  (click)="filter.set(tab.value)"
                >
                  {{ tab.label }}
                  <span class="count">{{ countFor(tab.value) }}</span>
                </button>
              }
            </div>

            <button type="button" class="btn btn-ghost"
              (click)="load()" [disabled]="loading()">
              {{ loading() ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        @if (loading() && !quizzes().length) {
          <div class="skeletons" aria-label="Loading quizzes">
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
          </div>
        } @else if (!filtered().length) {
          <div class="empty">
            <div class="empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 1 1 4.8 2.4c-.9.6-1.9 1.2-1.9 2.6M12 17h.01" />
              </svg>
            </div>
            <h3>
              {{ quizzes().length
                ? 'No quizzes match your filter'
                : 'No quizzes yet' }}
            </h3>
            <p>
              {{ quizzes().length
                ? 'Try another status or clear the search box.'
                : 'Create your first quiz and publish it for your students.' }}
            </p>
            @if (!quizzes().length) {
              <a routerLink="/admin/quizzes/new" class="btn btn-primary">
                Create your first quiz
              </a>
            }
          </div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Duration</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th class="right">Actions</th>
                </tr>
              </thead>

              <tbody>
                @for (quiz of filtered(); track quiz.id) {
                  <tr>
                    <td>
                      <div class="quiz-title">{{ quiz.title }}</div>
                      <div class="quiz-desc">
                        {{ quiz.description || 'No description' }}
                      </div>
                    </td>

                    <td class="nowrap">
                      {{ quiz.duration_minutes }} min
                    </td>

                    <td class="nowrap">
                      <strong>{{ quiz.total_marks }}</strong>
                      <span class="muted">
                        · pass {{ quiz.passing_marks }}
                      </span>
                    </td>

                    <td>
                      <span class="badge"
                        [attr.data-status]="effectiveStatus(quiz)">
                        {{ effectiveStatus(quiz) }}
                      </span>
                    </td>

                    <td class="nowrap">
                      {{ quiz.deadline
                        ? (quiz.deadline | date: 'mediumDate')
                        : '—' }}
                    </td>

                    <td>
                      <div class="actions">
                        @if (effectiveStatus(quiz) === 'draft') {
                          <button type="button"
                            class="btn btn-primary btn-sm"
                            (click)="askPublish(quiz)"
                            [disabled]="busyId() === quiz.id">
                            Publish
                          </button>
                        }

                        @if (effectiveStatus(quiz) === 'published') {
                          <button type="button"
                            class="btn btn-danger btn-sm"
                            (click)="askClose(quiz)"
                            [disabled]="busyId() === quiz.id">
                            {{ busyId() === quiz.id
                              && busyAction() === 'close'
                              ? 'Closing...' : 'Close' }}
                          </button>
                        }

                        @if (effectiveStatus(quiz) === 'closed') {
                          <button type="button"
                            class="btn btn-primary btn-sm"
                            (click)="askReopen(quiz)"
                            [disabled]="busyId() === quiz.id">
                            {{ busyId() === quiz.id
                              && busyAction() === 'reopen'
                              ? 'Reopening...' : 'Reopen' }}
                          </button>
                        }

                        <app-action-buttons
                          [showView]="true"
                          [showEdit]="true"
                          [showDelete]="true"
                          [deleteDisabled]="busyId() === quiz.id"
                          [deleteLoading]="busyId() === quiz.id
                            && busyAction() === 'delete'"
                          (viewClick)="viewQuiz(quiz)"
                          (editClick)="editQuiz(quiz)"
                          (deleteClick)="askDelete(quiz)"
                        />
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      @if (dialog(); as d) {
        <div class="overlay" (click)="closeDialog()">
          <div class="modal" role="alertdialog" aria-modal="true"
            aria-labelledby="dlg-title"
            (click)="$event.stopPropagation()">

            <div class="modal-icon" [attr.data-kind]="d.type">
              @if (d.type === 'delete') {
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                </svg>
              } @else {
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                </svg>
              }
            </div>

            <h3 id="dlg-title">
              {{
                d.type === 'delete' ? 'Delete quiz?' :
                d.type === 'publish' ? 'Publish quiz?' :
                d.type === 'close' ? 'Close quiz?' :
                'Reopen quiz?'
              }}
            </h3>

            <p>
              @switch (d.type) {
                @case ('delete') {
                  <strong>{{ d.quiz.title }}</strong>
                  and all its questions and related data will be permanently
                  deleted. This action cannot be undone.
                }
                @case ('publish') {
                  <strong>{{ d.quiz.title }}</strong>
                  will become visible to students, provided its deadline
                  has not expired.
                }
                @case ('close') {
                  <strong>{{ d.quiz.title }}</strong>
                  will no longer be available for new student attempts.
                }
                @case ('reopen') {
                  <strong>{{ d.quiz.title }}</strong>
                  will become available again only if its deadline is still
                  in the future. An expired quiz needs a new deadline first.
                }
              }
            </p>

            <div class="modal-actions">
              <button type="button" class="btn btn-ghost"
                (click)="closeDialog()"
                [disabled]="busyId() !== null">
                Cancel
              </button>

              <button type="button" class="btn"
                [class.btn-danger]="d.type === 'delete' || d.type === 'close'"
                [class.btn-primary]="d.type === 'publish' || d.type === 'reopen'"
                (click)="confirmDialog()"
                [disabled]="busyId() !== null">
                @if (busyId() !== null) {
                  {{
                    d.type === 'delete' ? 'Deleting...' :
                    d.type === 'publish' ? 'Publishing...' :
                    d.type === 'close' ? 'Closing...' :
                    'Reopening...'
                  }}
                } @else {
                  {{
                    d.type === 'delete' ? 'Delete' :
                    d.type === 'publish' ? 'Publish' :
                    d.type === 'close' ? 'Close quiz' :
                    'Reopen quiz'
                  }}
                }
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    :host { display:block; color:#0f172a; }
    .page { max-width:1200px; margin:0 auto; padding:32px 28px 56px; }
    .head { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:24px; }
    h1 { margin:0; font-size:26px; font-weight:700; letter-spacing:-.02em; }
    .sub { margin:6px 0 0; font-size:14px; color:#64748b; }

    .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:1px solid transparent; border-radius:10px; padding:10px 16px; font:inherit; font-size:14px; font-weight:600; line-height:1.2; text-decoration:none; white-space:nowrap; cursor:pointer; transition:background-color .15s,border-color .15s; }
    .btn:disabled { opacity:.55; cursor:not-allowed; }
    .btn-primary { background:#0f172a; color:#fff; box-shadow:0 1px 2px #0f172a22; }
    .btn-primary:hover:not(:disabled) { background:#1e293b; }
    .btn-danger { background:#dc2626; color:#fff; box-shadow:0 1px 2px #dc262633; }
    .btn-danger:hover:not(:disabled) { background:#b91c1c; }
    .btn-ghost { background:#fff; color:#334155; border-color:#cbd5e1; }
    .btn-ghost:hover:not(:disabled) { background:#f8fafc; }
    .btn-sm { padding:7px 12px; font-size:12px; border-radius:8px; }

    .notice { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:20px; padding:12px 16px; font-size:14px; color:#065f46; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; }
    .notice.error { color:#991b1b; background:#fef2f2; border-color:#fecaca; }
    .notice-close { display:grid; place-items:center; border:0; background:transparent; color:inherit; opacity:.6; cursor:pointer; padding:2px; }
    .notice-close:hover { opacity:1; }

    .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:16px; margin-bottom:24px; }
    .stat { display:flex; align-items:center; gap:14px; padding:18px 20px; background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 2px #0f172a0a; }
    .stat-icon { display:grid; place-items:center; flex-shrink:0; width:44px; height:44px; border-radius:12px; background:#f1f5f9; color:#0f172a; }
    .stat-icon[data-tone='published'] { background:#ecfdf5; color:#059669; }
    .stat-icon[data-tone='draft'] { background:#fffbeb; color:#d97706; }
    .stat-icon[data-tone='closed'] { background:#fef2f2; color:#dc2626; }
    .stat-label { display:block; font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; color:#64748b; }
    .stat-value { display:block; margin-top:2px; font-size:28px; line-height:1.1; font-weight:700; }

    .card { overflow:hidden; background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 2px #0f172a0a; }
    .toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:16px 20px; border-bottom:1px solid #e2e8f0; }
    .toolbar-right { display:flex; align-items:center; flex-wrap:wrap; gap:12px; }
    .search { position:relative; flex:1 1 220px; max-width:340px; }
    .search svg { position:absolute; top:50%; left:12px; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
    .search input { width:100%; box-sizing:border-box; padding:9px 12px 9px 36px; font:inherit; font-size:14px; color:#0f172a; background:#fff; border:1px solid #cbd5e1; border-radius:10px; outline:none; }
    .search input:focus { border-color:#0f172a; box-shadow:0 0 0 3px #0f172a14; }

    .tabs { display:inline-flex; flex-wrap:wrap; gap:2px; padding:4px; background:#f1f5f9; border-radius:10px; }
    .tab { display:inline-flex; align-items:center; gap:6px; border:0; border-radius:7px; padding:6px 10px; font:inherit; font-size:13px; font-weight:600; color:#64748b; background:transparent; cursor:pointer; }
    .tab:hover { color:#0f172a; }
    .tab.active { color:#0f172a; background:#fff; box-shadow:0 1px 2px #0f172a1f; }
    .count { min-width:18px; padding:1px 6px; font-size:11px; text-align:center; color:#475569; background:#e2e8f0; border-radius:999px; }
    .tab.active .count { background:#0f172a; color:#fff; }

    .table-wrap { overflow-x:auto; }
    table { width:100%; min-width:900px; border-collapse:collapse; text-align:left; }
    thead th { padding:12px 20px; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#64748b; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    tbody td { padding:16px 20px; font-size:14px; color:#334155; vertical-align:middle; border-bottom:1px solid #f1f5f9; }
    tbody tr:last-child td { border-bottom:0; }
    tbody tr:hover { background:#f8fafc; }
    .right { text-align:right; }
    .nowrap { white-space:nowrap; }
    .muted { color:#94a3b8; font-size:12px; }
    .quiz-title { font-weight:600; color:#0f172a; }
    .quiz-desc { max-width:360px; margin-top:2px; overflow:hidden; font-size:12px; color:#64748b; text-overflow:ellipsis; white-space:nowrap; }

    .badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; font-size:12px; font-weight:600; text-transform:capitalize; color:#b45309; background:#fffbeb; border-radius:999px; }
    .badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
    .badge[data-status='published'] { color:#047857; background:#ecfdf5; }
    .badge[data-status='closed'] { color:#b91c1c; background:#fef2f2; }

    .actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
    .empty { display:flex; flex-direction:column; align-items:center; padding:64px 24px; text-align:center; }
    .empty-icon { display:grid; place-items:center; width:56px; height:56px; color:#94a3b8; background:#f1f5f9; border-radius:50%; }
    .empty h3 { margin:16px 0 4px; font-size:16px; font-weight:600; }
    .empty p { max-width:360px; margin:0 0 20px; font-size:14px; color:#64748b; }

    .skeletons { display:grid; gap:12px; padding:20px; }
    .skeleton { height:56px; border-radius:10px; background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite linear; }
    @keyframes shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }

    .overlay { position:fixed; inset:0; z-index:9000; display:grid; place-items:center; padding:16px; background:rgba(15,23,42,.5); backdrop-filter:blur(2px); animation:fade .15s ease-out; }
    .modal { width:100%; max-width:420px; padding:24px; text-align:center; background:#fff; border-radius:16px; box-shadow:0 20px 50px rgba(15,23,42,.25); animation:pop .18s ease-out; }
    .modal-icon { display:grid; place-items:center; width:48px; height:48px; margin:0 auto 14px; border-radius:50%; }
    .modal-icon[data-kind='delete'],
    .modal-icon[data-kind='close'] { color:#dc2626; background:#fef2f2; }
    .modal-icon[data-kind='publish'],
    .modal-icon[data-kind='reopen'] { color:#059669; background:#ecfdf5; }
    .modal h3 { margin:0; font-size:18px; font-weight:700; }
    .modal p { margin:8px 0 0; font-size:14px; line-height:1.5; color:#64748b; }
    .modal p strong { color:#0f172a; }
    .modal-actions { display:flex; gap:10px; margin-top:22px; }
    .modal-actions .btn { flex:1; }
    @keyframes fade { from { opacity:0; } to { opacity:1; } }
    @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.97); } to { opacity:1; transform:none; } }

    @media (max-width:640px) {
      .page { padding:20px 16px 40px; }
      .head .btn { width:100%; }
      .search { max-width:none; }
      .actions { justify-content:flex-start; }
    }
  `,
})
export class QuizzesComponent {
  private readonly service = inject(QuizService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  readonly quizzes = signal<QuizRecord[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly busyAction = signal<
    'publish' | 'delete' | 'close' | 'reopen' | null
  >(null);

  readonly message = signal('');
  readonly isError = signal(false);
  readonly filter = signal<StatusFilter>('all');
  readonly search = signal('');
  readonly dialog = signal<DialogState>(null);

  readonly filters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Closed', value: 'closed' },
  ];

  private isExpired(quiz: QuizRecord): boolean {
    if (!quiz.deadline) return false;

    const deadline = new Date(quiz.deadline).getTime();

    return Number.isFinite(deadline) && deadline <= Date.now();
  }

  effectiveStatus(quiz: QuizRecord): QuizRecord['status'] {
    if (quiz.status === 'published' && this.isExpired(quiz)) {
      return 'closed';
    }

    return quiz.status;
  }

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.filter();

    return this.quizzes().filter((quiz) => {
      const statusOk =
        status === 'all' || this.effectiveStatus(quiz) === status;

      const textOk =
        !term ||
        quiz.title.toLowerCase().includes(term) ||
        (quiz.description ?? '').toLowerCase().includes(term);

      return statusOk && textOk;
    });
  });

  readonly stats = computed(() => {
    const list = this.quizzes();
    const n = (status: QuizRecord['status']) =>
      list.filter((quiz) => this.effectiveStatus(quiz) === status).length;

    return [
      { key: 'all', label: 'Total quizzes', value: list.length },
      { key: 'published', label: 'Published', value: n('published') },
      { key: 'draft', label: 'Drafts', value: n('draft') },
      { key: 'closed', label: 'Closed', value: n('closed') },
    ];
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;

    if (params.has('publish_failed')) {
      this.isError.set(true);
      this.message.set(
        'Quiz was saved as a draft, but publishing failed. Please publish it from the list.'
      );
    } else if (params.has('published')) {
      this.message.set('Quiz created and published. Students can now see it.');
    } else if (params.has('created')) {
      this.message.set('Quiz saved as a draft. Publish it when you are ready.');
    }

    void this.load();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDialog();
  }

  countFor(value: StatusFilter): number {
    const list = this.quizzes();

    return value === 'all'
      ? list.length
      : list.filter((quiz) => this.effectiveStatus(quiz) === value).length;
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const result = await this.service.getQuizzes();

      // Expired published quizzes appear closed in the UI.
      // Persisting this status must be handled by the backend.
      this.quizzes.set(result);
    } catch (error) {
      this.fail(error, 'Unable to load quizzes.');
      this.toast.error(this.message(), 'Quizzes');
    } finally {
      this.loading.set(false);
    }
  }

viewQuiz(quiz: QuizRecord): void {
  void this.router.navigate([
    '/admin/quizzes',
    quiz.id,
    'view',
  ]).then((success) => {
    if (!success) {
      this.toast.error(
        'Quiz details page could not be opened.',
        'Navigation error'
      );
    }
  });
}

  editQuiz(quiz: QuizRecord): void {
    void this.router
      .navigate(['/admin/quizzes', quiz.id, 'edit'])
      .then((navigated) => {
        if (!navigated) {
          this.toast.error(
            'Could not open the quiz edit page. Check the configured route.',
            'Edit quiz'
          );
        }
      });
  }

  askPublish(quiz: QuizRecord): void {
    this.dialog.set({ type: 'publish', quiz });
  }

  askDelete(quiz: QuizRecord): void {
    this.dialog.set({ type: 'delete', quiz });
  }

  askClose(quiz: QuizRecord): void {
    this.dialog.set({ type: 'close', quiz });
  }

  askReopen(quiz: QuizRecord): void {
    this.dialog.set({ type: 'reopen', quiz });
  }

  closeDialog(): void {
    if (this.busyId() !== null) return;

    this.dialog.set(null);
  }

  async confirmDialog(): Promise<void> {
    const current = this.dialog();

    if (!current || this.busyId() !== null) return;

    switch (current.type) {
      case 'publish':
        await this.publish(current.quiz);
        break;

      case 'delete':
        await this.remove(current.quiz);
        break;

      case 'close':
        await this.changeStatus(current.quiz, 'close');
        break;

      case 'reopen':
        await this.changeStatus(current.quiz, 'reopen');
        break;
    }

    this.dialog.set(null);
  }

  private async publish(quiz: QuizRecord): Promise<void> {
    if (this.isExpired(quiz)) {
      this.isError.set(true);
      this.message.set(
        'This quiz deadline has expired. Update the deadline before publishing.'
      );
      this.toast.error(this.message(), 'Deadline expired');
      return;
    }

    this.busyId.set(quiz.id);
    this.busyAction.set('publish');
    this.message.set('');

    try {
      await this.service.publishQuiz(quiz.id);

      this.isError.set(false);
      this.toast.success(`"${quiz.title}" is now published.`, 'Quiz published');

      await this.load();
    } catch (error) {
      this.fail(error, 'Could not publish quiz.');
      this.toast.error(this.message(), 'Publish failed');
    } finally {
      this.busyId.set(null);
      this.busyAction.set(null);
    }
  }

  private async changeStatus(
    quiz: QuizRecord,
    action: 'close' | 'reopen'
  ): Promise<void> {
    if (action === 'reopen' && this.isExpired(quiz)) {
      this.isError.set(true);
      this.message.set(
        'This quiz deadline has expired. Update its deadline before reopening.'
      );
      this.toast.error(this.message(), 'Deadline expired');
      return;
    }

    this.busyId.set(quiz.id);
    this.busyAction.set(action);
    this.message.set('');

    try {
      if (action === 'close') {
        await this.service.closeQuiz(quiz.id);

        this.toast.success(
          `"${quiz.title}" has been closed.`,
          'Quiz closed'
        );
      } else {
        await this.service.reopenQuiz(quiz.id);

        this.toast.success(
          `"${quiz.title}" has been reopened.`,
          'Quiz reopened'
        );
      }

      this.isError.set(false);
      await this.load();
    } catch (error) {
      this.fail(
        error,
        action === 'close'
          ? 'Could not close quiz.'
          : 'Could not reopen quiz.'
      );

      this.toast.error(
        this.message(),
        action === 'close' ? 'Close failed' : 'Reopen failed'
      );
    } finally {
      this.busyId.set(null);
      this.busyAction.set(null);
    }
  }

  private async remove(quiz: QuizRecord): Promise<void> {
    this.busyId.set(quiz.id);
    this.busyAction.set('delete');
    this.message.set('');

    try {
      await this.service.deleteQuiz(quiz.id);

      this.isError.set(false);
      this.toast.success(`"${quiz.title}" was deleted.`, 'Quiz deleted');

      this.quizzes.update((list) =>
        list.filter((item) => item.id !== quiz.id)
      );
    } catch (error) {
      this.fail(error, 'Could not delete quiz.');
      this.toast.error(this.message(), 'Delete failed');
    } finally {
      this.busyId.set(null);
      this.busyAction.set(null);
    }
  }

  private fail(error: unknown, fallback: string): void {
    this.isError.set(true);

    this.message.set(
      error instanceof Error ? error.message : fallback
    );
  }
}