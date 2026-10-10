
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizRecord, QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page">
      <header class="header">
        <div>
          <h1>Quizzes</h1>
          <p>Create quizzes, publish them and manage their status.</p>
        </div>
        <a routerLink="/admin/quizzes/new" class="create">+ Create quiz</a>
      </header>

      <div *ngIf="message" class="notice">{{ message }}</div>

      <section class="stats">
        <article><span>Total quizzes</span><strong>{{ quizzes.length }}</strong></article>
        <article><span>Published</span><strong>{{ count('published') }}</strong></article>
        <article><span>Drafts</span><strong>{{ count('draft') }}</strong></article>
      </section>

      <section class="panel">
        <p *ngIf="loading">Loading quizzes...</p>
        <p *ngIf="!loading && !quizzes.length">No quizzes yet. Create your first quiz.</p>

        <div class="table-wrap" *ngIf="quizzes.length">
          <table>
            <thead>
              <tr>
                <th>Quiz</th><th>Duration</th><th>Marks</th>
                <th>Status</th><th>Deadline</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let quiz of quizzes">
                <td>
                  <strong>{{ quiz.title }}</strong>
                  <small>{{ quiz.description || 'No description' }}</small>
                </td>
                <td>{{ quiz.duration_minutes }} min</td>
                <td>{{ quiz.total_marks }}</td>
                <td><span class="status" [attr.data-status]="quiz.status">
                  {{ quiz.status }}
                </span></td>
                <td>{{ quiz.deadline ? (quiz.deadline | date:'medium') : 'No deadline' }}</td>
                <td class="actions">
                  <button *ngIf="quiz.status === 'draft'"
                    (click)="publish(quiz)" [disabled]="busyId === quiz.id">
                    Publish
                  </button>
                  <button class="delete" (click)="remove(quiz)"
                    [disabled]="busyId === quiz.id">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;color:#172033}
    .page{max-width:1200px;margin:auto;padding:28px}
    .header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:25px}
    h1{font-size:30px;margin:0 0 7px;font-weight:750}
    p{color:#718096}
    .create,button{background:#4f46e5;color:white;border:0;padding:11px 15px;border-radius:9px;text-decoration:none;font-weight:650;cursor:pointer;white-space:nowrap}
    button:disabled{opacity:.5}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:22px}
    .stats article,.panel{background:white;border:1px solid #e4e8f0;border-radius:14px;padding:20px}
    .stats span,.stats strong{display:block}
    .stats span{color:#718096;font-size:13px}
    .stats strong{font-size:27px;margin-top:10px}
    .table-wrap{overflow-x:auto}
    table{width:100%;border-collapse:collapse;text-align:left}
    th,td{padding:14px 12px;border-bottom:1px solid #edf0f5;font-size:13px}
    th{color:#718096;font-weight:650}
    td small{display:block;color:#718096;margin-top:5px}
    .status{padding:5px 9px;border-radius:20px;background:#f1f5f9;text-transform:capitalize}
    .status[data-status="published"]{background:#dcfce7;color:#166534}
    .status[data-status="closed"]{background:#fee2e2;color:#991b1b}
    .actions{display:flex;gap:8px}
    .actions button{font-size:12px;padding:8px 10px}
    .actions .delete{background:#fff0f0;color:#b91c1c}
    .notice{background:#dcfce7;color:#166534;padding:12px;border-radius:9px;margin-bottom:15px}
    @media(max-width:650px){.page{padding:15px}.header{align-items:flex-start;flex-direction:column}.stats{grid-template-columns:1fr}.panel{padding:12px}}
  `],
})
export class QuizzesComponent {
  private readonly service = inject(QuizService);

  quizzes: QuizRecord[] = [];
  loading = true;
  busyId: number | null = null;
  message = '';

  constructor() {
    void this.load();
  }

  count(status: QuizRecord['status']): number {
    return this.quizzes.filter(quiz => quiz.status === status).length;
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.quizzes = await this.service.getQuizzes();
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Unable to load quizzes.';
    } finally {
      this.loading = false;
    }
  }

  async publish(quiz: QuizRecord): Promise<void> {
    if (!confirm(`Publish "${quiz.title}"?`)) return;

    this.busyId = quiz.id;
    this.message = '';

    try {
      await this.service.publishQuiz(quiz.id);
      this.message = 'Quiz published successfully.';
      await this.load();
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not publish quiz.';
    } finally {
      this.busyId = null;
    }
  }

  async remove(quiz: QuizRecord): Promise<void> {
    if (!confirm(`Delete "${quiz.title}" and its related data? This cannot be undone.`)) return;

    this.busyId = quiz.id;
    this.message = '';

    try {
      await this.service.deleteQuiz(quiz.id);
      this.message = 'Quiz deleted.';
      await this.load();
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not delete quiz.';
    } finally {
      this.busyId = null;
    }
  }
}