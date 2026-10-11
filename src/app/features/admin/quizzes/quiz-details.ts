import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  QuizForEdit,
  QuizQuestionDraft,
  QuizRecord,
  QuizService,
} from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-details',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <main class="page">
      <header class="header">
        <div>
          <h1>Quiz Details</h1>
          <p class="subtitle">View quiz information and questions.</p>
        </div>

        <a routerLink="/admin/quizzes" class="btn btn-secondary">
          ← Back to Quizzes
        </a>
      </header>

      @if (loading()) {
        <section class="card state">
          <p>Loading quiz details...</p>
        </section>
      } @else if (error()) {
        <section class="card state error">
          <h2>Unable to load quiz</h2>
          <p>{{ error() }}</p>
          <button class="btn btn-primary" (click)="loadQuiz()">
            Try Again
          </button>
        </section>
      } @else if (quiz(); as q) {
        <section class="card">
          <div class="quiz-header">
            <div>
              <span class="badge" [attr.data-status]="q.status">
                {{ q.status }}
              </span>
              <h2>{{ q.title }}</h2>
              <p class="description">
                {{ q.description || 'No description provided.' }}
              </p>
            </div>

            <a
              class="btn btn-primary"
              [routerLink]="['/admin/quizzes', q.id, 'edit']"
            >
              Edit Quiz
            </a>
          </div>

          <div class="details-grid">
            <article class="detail">
              <span>Quiz ID</span>
              <strong>{{ q.id }}</strong>
            </article>

            <article class="detail">
              <span>Course ID</span>
              <strong>{{ q.course_id }}</strong>
            </article>

            <article class="detail">
              <span>Batch ID</span>
              <strong>{{ q.batch_id ?? 'All batches' }}</strong>
            </article>

            <article class="detail">
              <span>Duration</span>
              <strong>{{ q.duration_minutes }} minutes</strong>
            </article>

            <article class="detail">
              <span>Total Marks</span>
              <strong>{{ q.total_marks }}</strong>
            </article>

            <article class="detail">
              <span>Passing Marks</span>
              <strong>{{ q.passing_marks }}</strong>
            </article>

            <article class="detail">
              <span>Deadline</span>
              <strong>
                {{ q.deadline ? (q.deadline | date: 'medium') : 'No deadline' }}
              </strong>
            </article>

            <article class="detail">
              <span>Created At</span>
              <strong>
                {{ q.created_at ? (q.created_at | date: 'medium') : '—' }}
              </strong>
            </article>

            <article class="detail">
              <span>Total Questions</span>
              <strong>{{ questions().length }}</strong>
            </article>
          </div>
        </section>

        <section class="card questions-card">
          <div class="section-heading">
            <div>
              <h2>Questions</h2>
              <p>Questions and answer options for this quiz.</p>
            </div>
            <span class="question-count">
              {{ questions().length }} questions
            </span>
          </div>

          @if (!questions().length) {
            <div class="empty">
              No questions have been added to this quiz yet.
            </div>
          } @else {
            <div class="question-list">
              @for (question of questions(); track $index; let i = $index) {
                <article class="question">
                  <div class="question-top">
                    <div class="question-title">
                      <span class="number">{{ i + 1 }}</span>
                      <h3>{{ question.question_text }}</h3>
                    </div>

                    <span class="marks">
                      {{ question.marks }}
                      {{ question.marks === 1 ? 'mark' : 'marks' }}
                    </span>
                  </div>

                  <p class="question-type">
                    Type: {{ question.type }}
                  </p>

                  <div class="options">
                    @for (option of question.options; track $index; let j = $index) {
                      <div
                        class="option"
                        [class.correct]="question.correct_options.includes(j)"
                      >
                        <span class="option-letter">
                          {{ optionLetters[j] ?? (j + 1) }}
                        </span>

                        <span class="option-text">{{ option }}</span>

                        @if (question.correct_options.includes(j)) {
                          <span class="correct-label">Correct answer</span>
                        }
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          }
        </section>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
      color: #0f172a;
    }

    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px 56px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0;
      font-size: 27px;
      font-weight: 750;
      letter-spacing: -.5px;
    }

    .subtitle {
      margin: 6px 0 0;
      color: #64748b;
      font-size: 14px;
    }

    .card {
      margin-bottom: 22px;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 2px 5px #0f172a08;
    }

    .quiz-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 20px;
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .quiz-header h2 {
      margin: 12px 0 6px;
      font-size: 23px;
      overflow-wrap: anywhere;
    }

    .description {
      margin: 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.6;
    }

    .badge {
      display: inline-flex;
      padding: 5px 11px;
      border-radius: 999px;
      background: #fffbeb;
      color: #b45309;
      font-size: 12px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .badge[data-status='published'] {
      color: #047857;
      background: #ecfdf5;
    }

    .badge[data-status='closed'] {
      color: #b91c1c;
      background: #fef2f2;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      padding: 24px;
    }

    .detail {
      min-width: 0;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .detail span {
      display: block;
      margin-bottom: 7px;
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
    }

    .detail strong {
      display: block;
      overflow-wrap: anywhere;
      font-size: 15px;
    }

    .questions-card {
      padding: 24px;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 22px;
    }

    .section-heading h2 {
      margin: 0;
      font-size: 20px;
    }

    .section-heading p {
      margin: 5px 0 0;
      color: #64748b;
      font-size: 13px;
    }

    .question-count {
      padding: 6px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      font-size: 12px;
      font-weight: 600;
    }

    .question-list {
      display: grid;
      gap: 18px;
    }

    .question {
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .question-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .question-title {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .question-title h3 {
      margin: 2px 0 0;
      font-size: 15px;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .number {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 9px;
      background: #0f172a;
      color: white;
      font-size: 13px;
      font-weight: 700;
    }

    .marks {
      flex-shrink: 0;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
    }

    .question-type {
      margin: 12px 0;
      color: #64748b;
      font-size: 12px;
      text-transform: capitalize;
    }

    .options {
      display: grid;
      gap: 9px;
      margin-top: 14px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 11px 13px;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      background: #fff;
    }

    .option.correct {
      border-color: #86efac;
      background: #f0fdf4;
    }

    .option-letter {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 700;
    }

    .option.correct .option-letter {
      color: #047857;
      background: #dcfce7;
    }

    .option-text {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: 13px;
    }

    .correct-label {
      color: #047857;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 15px;
      border: 1px solid transparent;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-primary {
      background: #0f172a;
      color: #fff;
    }

    .btn-primary:hover {
      background: #1e293b;
    }

    .btn-secondary {
      background: #fff;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover {
      background: #f8fafc;
    }

    .state,
    .empty {
      padding: 40px 24px;
      text-align: center;
      color: #64748b;
    }

    .state h2 {
      color: #0f172a;
    }

    .error {
      color: #b91c1c;
    }

    @media (max-width: 760px) {
      .page {
        padding: 22px 16px 40px;
      }

      .details-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 16px;
      }

      .quiz-header,
      .questions-card {
        padding: 18px;
      }
    }

    @media (max-width: 480px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .question {
        padding: 14px;
      }

      .question-top {
        flex-direction: column;
      }

      .correct-label {
        white-space: normal;
      }
    }
  `,
})
export class QuizDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(QuizService);

  readonly quiz = signal<QuizRecord | null>(null);
  readonly questions = signal<QuizQuestionDraft[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  constructor() {
    void this.loadQuiz();
  }

  async loadQuiz(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Invalid quiz ID.');
      }

      const result: QuizForEdit = await this.service.getQuizForEdit(id);

      this.quiz.set(result.quiz);
      this.questions.set(result.questions ?? []);
    } catch (error: unknown) {
      this.quiz.set(null);
      this.questions.set([]);
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading quiz details.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}