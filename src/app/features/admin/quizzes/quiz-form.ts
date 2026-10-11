import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  QuizService,
  QuizQuestionDraft,
  QuestionType,
} from '../../../core/services/quiz.service';
import { Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto w-full max-w-4xl p-4 pb-10 sm:p-6 lg:p-8 lg:pb-12">
      <header class="mb-6">
        <a
          routerLink="/admin/quizzes"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to quizzes
        </a>
        <h1 class="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {{ isEdit() ? 'Edit quiz' : 'Create quiz' }}
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ isEdit()
            ? 'Update quiz details, questions and correct answers.'
            : 'Add quiz details, write your questions and mark the correct answers.' }}
        </p>
      </header>

      @if (message()) {
        <div
          class="mb-5 rounded-lg border px-4 py-3 text-sm"
          [class]="isError()
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'"
          role="alert"
        >
          {{ message() }}
        </div>
      }

      @if (pageLoading()) {
        <div class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading quiz...
        </div>
      } @else {
      <form (ngSubmit)="saveQuiz(false)" #quizForm="ngForm" class="space-y-6">
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 class="text-base font-semibold text-slate-900">Quiz details</h2>
          <p class="mt-0.5 text-sm text-slate-500">Basic information students will see.</p>

          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="title" class="mb-1.5 block text-sm font-medium text-slate-700">
                Quiz title <span class="text-red-500">*</span>
              </label>
              <input
                id="title" name="title" [(ngModel)]="title" required
                placeholder="e.g. JavaScript Fundamentals"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="course" class="mb-1.5 block text-sm font-medium text-slate-700">
                Course <span class="text-red-500">*</span>
              </label>
              <select
                id="course" name="course" [ngModel]="courseId" (ngModelChange)="onCourseChange($event)" required
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option [ngValue]="null">Select a course</option>
                @for (course of courses(); track course.id) {
                  <option [ngValue]="course.id">{{ course.title }}</option>
                }
              </select>
            </div>

            <div class="sm:col-span-2">
              <label for="batch" class="mb-1.5 block text-sm font-medium text-slate-700">
                Batch <span class="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                id="batch" name="batch" [ngModel]="batchId" (ngModelChange)="onBatchChange($event)"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option [ngValue]="null">
                  All batches
                </option>
                @for (batch of visibleBatches; track batch.id) {
                  <option [ngValue]="batch.id">{{ batch.batch_name }} ({{ batch.batch_code }})</option>
                }
              </select>

              @if (batchesLoading()) {
                <p class="mt-1.5 text-xs text-slate-400">Loading batches...</p>
              } @else if (courseId !== null && !visibleBatches.length) {
                <p class="mt-1.5 text-xs text-slate-400">
                  No batches found for this course. The quiz will be available to all batches.
                </p>
              }
            </div>

            <div class="sm:col-span-2">
              <label for="description" class="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                id="description" name="description" [(ngModel)]="description" rows="3"
                placeholder="Instructions for students..."
                class="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              ></textarea>
            </div>

            <div>
              <label for="duration" class="mb-1.5 block text-sm font-medium text-slate-700">Duration (minutes)</label>
              <input
                id="duration" type="number" name="duration" [(ngModel)]="duration" min="1" required
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label for="passing" class="mb-1.5 block text-sm font-medium text-slate-700">Passing marks</label>
              <input
                id="passing" type="number" name="passing" [(ngModel)]="passingMarks" min="0" required
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="deadline" class="mb-1.5 block text-sm font-medium text-slate-700">
                Deadline <span class="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="deadline" type="date" name="deadline" [(ngModel)]="deadline"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:max-w-xs"
              />
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Questions</h2>
              <p class="mt-0.5 text-sm text-slate-500">{{ questions().length }} question(s) added</p>
            </div>
            <button
              type="button" (click)="addQuestion()"
              class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add question
            </button>
          </div>

          @for (question of questions(); track question; let i = $index) {
            <article class="q-card">
              <div class="q-head">
                <div class="q-title">
                  <span class="q-num">{{ i + 1 }}</span>
                  <h3>Question {{ i + 1 }}</h3>
                </div>

                <div class="q-tools">
                  <div class="seg" role="group" aria-label="Question type">
                    <button
                      type="button"
                      [class.active]="question.type === 'single'"
                      [attr.aria-pressed]="question.type === 'single'"
                      (click)="setType(question, 'single')"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                      </svg>
                      Single choice
                    </button>
                    <button
                      type="button"
                      [class.active]="question.type === 'multiple'"
                      [attr.aria-pressed]="question.type === 'multiple'"
                      (click)="setType(question, 'multiple')"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="4" /><path d="m8 12 3 3 5-6" />
                      </svg>
                      Multiple choice
                    </button>
                  </div>

                  <button
                    type="button" class="icon-btn danger"
                    (click)="removeQuestion(i)" [disabled]="questions().length === 1"
                    aria-label="Remove question" title="Remove question"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="q-body">
                <label class="mb-1.5 block text-sm font-medium text-slate-700">
                  Question text <span class="text-red-500">*</span>
                </label>
                <textarea
                  [(ngModel)]="question.question_text" [name]="'question_' + i"
                  required rows="2" placeholder="Write your question..."
                  class="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                ></textarea>

                <div class="mt-5">
                  <div class="opt-top">
                    <label class="text-sm font-medium text-slate-700">Answer options</label>
                    <span class="opt-hint">
                      {{ question.type === 'single'
                        ? 'Tap the circle to mark the one correct answer'
                        : 'Tap the boxes to mark all correct answers' }}
                    </span>
                  </div>

                  <div class="opt-list">
                    @for (option of question.options; track $index; let j = $index) {
                      <div class="opt" [class.correct]="isCorrect(question, j)">
                        <button
                          type="button"
                          class="pick"
                          [class.radio]="question.type === 'single'"
                          [class.check]="question.type === 'multiple'"
                          [class.on]="isCorrect(question, j)"
                          (click)="toggleCorrect(question, j)"
                          [attr.role]="question.type === 'single' ? 'radio' : 'checkbox'"
                          [attr.aria-checked]="isCorrect(question, j)"
                          [attr.aria-label]="'Mark option ' + optionLetter(j) + ' as correct'"
                          [title]="isCorrect(question, j) ? 'Correct answer' : 'Mark as correct'"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        </button>

                        <span class="opt-letter">{{ optionLetter(j) }}</span>

                        <input
                          class="opt-input"
                          [(ngModel)]="question.options[j]" [name]="'option_' + i + '_' + j"
                          required [placeholder]="'Option ' + (j + 1)"
                        />

                        @if (isCorrect(question, j)) {
                          <span class="correct-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" />
                            </svg>
                            <span class="badge-text">Correct</span>
                          </span>
                        }

                        <button
                          type="button" class="icon-btn danger sm"
                          (click)="removeOption(question, j)"
                          [disabled]="question.options.length <= 2"
                          aria-label="Remove option" title="Remove option"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    }
                  </div>

                  <p class="summary" [class.bad]="!question.correct_options.length">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16 9.5" />
                    </svg>
                    {{ correctSummary(question) }}
                  </p>

                  <button
                    type="button" (click)="addOption(question)"
                    class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add option
                  </button>
                </div>

                <div class="mt-5 max-w-[10rem]">
                  <label class="mb-1.5 block text-sm font-medium text-slate-700">Marks</label>
                  <input
                    type="number" [(ngModel)]="question.marks" [name]="'marks_' + i" min="1" required
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>
            </article>
          }

          <button
            type="button" (click)="addQuestion()"
            class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add another question
          </button>
        </section>

        <footer class="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div class="text-sm text-slate-500">
              Total marks
              <strong class="ml-1 text-lg font-bold text-slate-900">{{ totalMarks }}</strong>
              @if (!isEdit()) {
                <span class="mt-0.5 block text-xs text-slate-400">
                  Drafts stay hidden from students until published.
                </span>
              }
            </div>
            <div class="flex items-center gap-3">
              <a
                routerLink="/admin/quizzes"
                class="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </a>
              @if (isEdit()) {
                <button
                  type="button" (click)="saveQuiz(false)" [disabled]="saving() || quizForm.invalid"
                  class="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ saving() ? 'Saving...' : 'Save changes' }}
                </button>
              } @else {
                <button
                  type="button" (click)="saveQuiz(false)" [disabled]="saving() || quizForm.invalid"
                  class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ savingMode() === 'draft' ? 'Saving...' : 'Save as draft' }}
                </button>
                <button
                  type="button" (click)="saveQuiz(true)" [disabled]="saving() || quizForm.invalid"
                  class="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ savingMode() === 'publish' ? 'Publishing...' : 'Create & publish' }}
                </button>
              }
            </div>
          </div>
        </footer>
      </form>
      }
    </div>
  `,
  styles: `
    :host { display:block; }
    svg { flex-shrink:0; }

    .q-card { overflow:hidden; background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 1px 2px #0f172a0a; }
    .q-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; padding:12px 20px; background:#f8fafc; border-bottom:1px solid #f1f5f9; }
    .q-title { display:flex; align-items:center; gap:12px; }
    .q-title h3 { margin:0; font-size:14px; font-weight:600; color:#0f172a; }
    .q-num { display:grid; place-items:center; width:32px; height:32px; border-radius:8px; background:#0f172a; color:#fff; font-size:14px; font-weight:700; }
    .q-tools { display:flex; align-items:center; gap:8px; }
    .q-body { padding:20px; }

    .seg { display:inline-flex; gap:2px; padding:4px; background:#e2e8f0; border-radius:10px; }
    .seg button { display:inline-flex; align-items:center; gap:6px; border:0; border-radius:7px; padding:6px 12px; font:inherit; font-size:12px; font-weight:600; color:#64748b; background:transparent; cursor:pointer; white-space:nowrap; }
    .seg button:hover { color:#0f172a; }
    .seg button.active { color:#0f172a; background:#fff; box-shadow:0 1px 2px #0f172a1f; }

    .icon-btn { display:grid; place-items:center; width:36px; height:36px; border:0; border-radius:8px; background:transparent; color:#94a3b8; cursor:pointer; transition:background-color .15s,color .15s; }
    .icon-btn.sm { width:32px; height:32px; }
    .icon-btn.danger:hover:not(:disabled) { background:#fef2f2; color:#dc2626; }
    .icon-btn:disabled { opacity:.35; cursor:not-allowed; }

    .opt-top { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:4px; margin-bottom:8px; }
    .opt-hint { font-size:12px; color:#94a3b8; }
    .opt-list { display:grid; gap:10px; }
    .opt { display:flex; align-items:center; gap:12px; padding:8px 8px 8px 12px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; transition:border-color .15s,background-color .15s; }
    .opt:hover { border-color:#cbd5e1; }
    .opt.correct { background:#ecfdf5; border-color:#6ee7b7; }
    .opt-letter { width:18px; flex-shrink:0; font-size:12px; font-weight:700; color:#94a3b8; }
    .opt-input { flex:1; min-width:0; border:0; outline:0; background:transparent; padding:6px 4px; font:inherit; font-size:14px; color:#0f172a; }
    .opt-input::placeholder { color:#94a3b8; }

    .pick { display:inline-grid; place-items:center; flex-shrink:0; width:26px; height:26px; padding:0; border:2px solid #94a3b8; background:#fff; color:transparent; cursor:pointer; transition:all .15s; }
    .pick.radio { border-radius:50%; }
    .pick.check { border-radius:7px; }
    .pick:hover { border-color:#059669; }
    .pick:focus-visible { outline:3px solid #a7f3d0; outline-offset:1px; }
    .pick.on { background:#059669; border-color:#059669; color:#fff; }

    .correct-badge { display:inline-flex; align-items:center; gap:6px; flex-shrink:0; padding:4px 10px; border-radius:999px; background:#d1fae5; color:#047857; font-size:12px; font-weight:600; }
    .summary { display:flex; align-items:center; gap:8px; margin:12px 0 0; font-size:12px; font-weight:500; color:#047857; }
    .summary.bad { color:#dc2626; }

    @media (max-width:640px) { .badge-text, .opt-hint { display:none; } }
  `,
})
export class QuizFormComponent {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(Toast);

  readonly courses = signal<{ id: number; title: string }[]>([]);
  readonly batches = signal<{ id: number; course_id: number; batch_name: string; batch_code: string }[]>([]);
  readonly batchesLoading = signal(false);
  readonly questions = signal<QuizQuestionDraft[]>([this.newQuestion()]);
  readonly saving = signal(false);
  readonly savingMode = signal<'draft' | 'publish' | null>(null);
  readonly pageLoading = signal(false);
  readonly isEdit = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);

  courseId: number | null = null;
  batchId: number | null = null;
  title = '';
  description = '';
  duration = 30;
  passingMarks = 0;
  deadline = ''; // YYYY-MM-DD

  private editId: number | null = null;

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.isEdit.set(true);
    }
    void this.init();
  }

  get totalMarks(): number {
    return this.questions().reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  }

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isCorrect(question: QuizQuestionDraft, index: number): boolean {
    return question.correct_options.includes(index);
  }

  correctSummary(question: QuizQuestionDraft): string {
    if (!question.correct_options.length) return 'No correct answer selected';
    const letters = question.correct_options.map((i) => this.optionLetter(i)).join(', ');
    return `Correct answer: ${letters}`;
  }

  private newQuestion(): QuizQuestionDraft {
    return {
      question_text: '',
      type: 'single',
      options: ['', '', '', ''],
      correct_options: [],
      marks: 1,
    };
  }

  private async init(): Promise<void> {
    this.pageLoading.set(this.isEdit());
    try {
      this.courses.set(await this.quizService.getCourses());
      await this.loadBatches();

      if (this.editId !== null) {
        const { quiz, questions } = await this.quizService.getQuizForEdit(this.editId);
        this.courseId = quiz.course_id;
        this.batchId = quiz.batch_id ?? null;
        this.title = quiz.title;
        this.description = quiz.description ?? '';
        this.duration = quiz.duration_minutes;
        this.passingMarks = quiz.passing_marks;
        this.deadline = this.toLocalInput(quiz.deadline);
        this.questions.set(questions.length ? questions : [this.newQuestion()]);
      }
    } catch (error) {
      this.showError(error);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // ISO date ko YYYY-MM-DD mein badalna (date input ke liye)
  private toLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // ---------- Batches ----------
  // Batches shown in the dropdown: all of them, or only the selected course's batches
  get visibleBatches() {
    const all = this.batches();
    return this.courseId === null
      ? all
      : all.filter((batch) => batch.course_id === this.courseId);
  }

  onCourseChange(courseId: number | null): void {
    this.courseId = courseId;

    // Drop the selected batch if it does not belong to the newly chosen course
    const stillValid = this.batches().some(
      (batch) => batch.id === this.batchId && batch.course_id === courseId,
    );

    if (!stillValid) {
      this.batchId = null;
    }
  }

  onBatchChange(batchId: number | null): void {
    this.batchId = batchId;

    // Picking a batch first also selects its course
    if (batchId !== null && this.courseId === null) {
      const batch = this.batches().find((b) => b.id === batchId);
      if (batch) {
        this.courseId = batch.course_id;
      }
    }
  }

  private async loadBatches(): Promise<void> {
    this.batchesLoading.set(true);

    try {
      this.batches.set(await this.quizService.getAllBatches());
    } catch (error) {
      this.batches.set([]);
      this.showError(error);
    } finally {
      this.batchesLoading.set(false);
    }
  }

  // ---------- Questions ----------
  addQuestion(): void {
    this.questions.update((list) => [...list, this.newQuestion()]);
  }

  removeQuestion(index: number): void {
    if (this.questions().length > 1) {
      this.questions.update((list) => list.filter((_, i) => i !== index));
    }
  }

  setType(question: QuizQuestionDraft, type: QuestionType): void {
    if (question.type === type) return;
    question.type = type;

    if (type === 'single' && question.correct_options.length > 1) {
      question.correct_options = [question.correct_options[0]];
    }
  }

  // ---------- Options ----------
  addOption(question: QuizQuestionDraft): void {
    question.options.push('');
  }

  toggleCorrect(question: QuizQuestionDraft, index: number): void {
    if (question.type === 'single') {
      question.correct_options = [index];
      return;
    }

    const selected = question.correct_options;
    question.correct_options = selected.includes(index)
      ? selected.filter((o) => o !== index)
      : [...selected, index].sort((a, b) => a - b);
  }

  removeOption(question: QuizQuestionDraft, index: number): void {
    if (question.options.length <= 2) return;

    question.options.splice(index, 1);

    question.correct_options = question.correct_options
      .filter((o) => o !== index)
      .map((o) => (o > index ? o - 1 : o));
  }

  // ---------- Save ----------
  async saveQuiz(publish = false): Promise<void> {
    if (this.saving()) return;

    if (this.courseId === null) {
      this.showError('Please select a course.');
      return;
    }

    const missing = this.questions().findIndex((q) => q.correct_options.length === 0);
    if (missing !== -1) {
      this.showError(`Select at least one correct answer for question ${missing + 1}.`);
      return;
    }

    if (Number(this.passingMarks) > this.totalMarks) {
      this.showError('Passing marks cannot exceed total marks.');
      return;
    }

    this.saving.set(true);
    this.savingMode.set(publish ? 'publish' : 'draft');
    this.message.set('');

    const draft = {
      course_id: Number(this.courseId),
      batch_id: this.batchId,
      title: this.title,
      description: this.description,
      duration_minutes: Number(this.duration),
      passing_marks: Number(this.passingMarks),
      // Deadline us din ke aakhri waqt (11:59 PM) par
      deadline: this.deadline
        ? new Date(`${this.deadline}T23:59:00`).toISOString()
        : null,
      questions: this.questions().map((q) => ({
        ...q,
        marks: Number(q.marks),
        correct_options: q.correct_options.map(Number),
        options: q.options.map((o) => o.trim()),
      })),
    };

    try {
      if (this.editId !== null) {
        await this.quizService.updateQuiz(this.editId, draft);
        this.toast.success('Quiz updated successfully.', 'Quiz');
        await this.router.navigate(['/admin/quizzes']);
        return;
      }

      const quiz = await this.quizService.createQuiz(draft);

      let publishFailed = false;
      if (publish) {
        try {
          await this.quizService.publishQuiz(quiz.id);
        } catch {
          publishFailed = true;
        }
      }

      if (publishFailed) {
        this.toast.warning('Saved as draft, but publishing failed.', 'Quiz');
      } else {
        this.toast.success(publish ? 'Quiz created and published.' : 'Quiz saved as draft.', 'Quiz');
      }

      await this.router.navigate(['/admin/quizzes'], {
        queryParams: {
          created: quiz.id,
          ...(publish && !publishFailed ? { published: 1 } : {}),
          ...(publishFailed ? { publish_failed: 1 } : {}),
        },
      });
    } catch (error) {
      this.showError(error);
    } finally {
      this.saving.set(false);
      this.savingMode.set(null);
    }
  }

  private showError(error: unknown): void {
    this.isError.set(true);
    let text = 'Something went wrong. Please try again.';
    if (typeof error === 'string') text = error;
    else if (error instanceof Error) text = error.message;
    this.message.set(text);
    this.toast.error(text, 'Quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}