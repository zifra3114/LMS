
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  QuizService,
  QuizQuestionDraft,
} from '../../../core/services/quiz.service';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="header">
        <div>
          <a routerLink="/admin/quizzes" class="back">← Back to quizzes</a>
          <h1>Create Quiz</h1>
          <p>Create questions and choose the correct answers.</p>
        </div>
      </header>

      <div *ngIf="message" class="message" [class.error]="isError">
        {{ message }}
      </div>

      <form (ngSubmit)="saveQuiz()" #quizForm="ngForm">
        <section class="panel">
          <h2>Quiz details</h2>

          <label>Quiz title *</label>
          <input name="title" [(ngModel)]="title"
            required placeholder="e.g. JavaScript Fundamentals" />

          <label>Course *</label>
          <select name="course" [(ngModel)]="courseId" required>
            <option [ngValue]="null">Select a course</option>
            <option *ngFor="let course of courses" [ngValue]="course.id">
              {{ course.title }}
            </option>
          </select>

          <label>Description</label>
          <textarea name="description" [(ngModel)]="description"
            rows="3" placeholder="Quiz instructions..."></textarea>

          <div class="two">
            <div>
              <label>Duration (minutes)</label>
              <input type="number" name="duration"
                [(ngModel)]="duration" min="1" required />
            </div>
            <div>
              <label>Passing marks</label>
              <input type="number" name="passing"
                [(ngModel)]="passingMarks" min="0" required />
            </div>
          </div>

          <label>Deadline (optional)</label>
          <input type="datetime-local" name="deadline"
            [(ngModel)]="deadline" />
        </section>

        <section class="panel">
          <div class="question-heading">
            <h2>Questions</h2>
            <button type="button" class="secondary"
              (click)="addQuestion()">+ Add question</button>
          </div>

          <article class="question"
            *ngFor="let question of questions; let i = index">
            <div class="question-heading">
              <h3>Question {{ i + 1 }}</h3>
              <button type="button" class="remove"
                (click)="removeQuestion(i)"
                [disabled]="questions.length === 1">Remove</button>
            </div>

            <label>Question text *</label>
            <textarea [(ngModel)]="question.question_text"
              [name]="'question_' + i" required rows="2"
              placeholder="Write your question..."></textarea>

            <label>Answer options</label>
            <div class="option"
              *ngFor="let option of question.options; let j = index">
              <input type="radio"
                [name]="'correct_' + i"
                [value]="j"
                [(ngModel)]="question.correct_option"
                [attr.aria-label]="'Mark option ' + (j + 1) + ' correct'" />
              <input [(ngModel)]="question.options[j]"
                [name]="'option_' + i + '_' + j"
                required [placeholder]="'Option ' + (j + 1)" />
              <button type="button" class="remove"
                (click)="removeOption(question, j)"
                [disabled]="question.options.length <= 2">×</button>
            </div>

            <button type="button" class="secondary small"
              (click)="addOption(question)">+ Add option</button>

            <p class="hint">Select the radio button beside the correct answer.</p>

            <label>Marks</label>
            <input type="number" [(ngModel)]="question.marks"
              [name]="'marks_' + i" min="1" required />
          </article>

          <div class="total">
            Total marks: <strong>{{ totalMarks }}</strong>
          </div>
        </section>

        <footer class="actions">
          <a routerLink="/admin/quizzes" class="cancel">Cancel</a>
          <button type="submit" [disabled]="saving || quizForm.invalid">
            {{ saving ? 'Saving...' : 'Save quiz as draft' }}
          </button>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    :host{display:block;color:#172033}
    .page{max-width:1000px;margin:auto;padding:28px}
    .header{margin-bottom:24px}
    h1{font-size:30px;margin:12px 0 6px;font-weight:750}
    h2{font-size:19px;margin:0 0 20px}
    h3{font-size:16px;margin:0}
    p{color:#718096}
    .back{color:#4f46e5;text-decoration:none}
    .panel{background:#fff;border:1px solid #e4e8f0;border-radius:16px;padding:24px;margin-bottom:20px}
    label{display:block;font-size:13px;font-weight:650;margin:17px 0 7px}
    input:not([type=radio]),select,textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #dce1eb;border-radius:9px;background:#fff;font:inherit}
    textarea{resize:vertical}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .question{border:1px solid #e4e8f0;border-radius:12px;padding:18px;margin-top:16px}
    .question-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .option{display:flex;align-items:center;gap:10px;margin:10px 0}
    .option input[type=radio]{width:17px;height:17px;accent-color:#4f46e5;flex-shrink:0}
    .option input:not([type=radio]){flex:1;min-width:0}
    button{border:0;border-radius:9px;padding:12px 18px;background:#4f46e5;color:#fff;font-weight:650;cursor:pointer}
    button:disabled{opacity:.5;cursor:not-allowed}
    .secondary,.cancel{background:#eef0ff;color:#4338ca;padding:10px 14px;border-radius:9px;text-decoration:none;border:0;cursor:pointer}
    .small{font-size:12px;margin-top:6px}
    .remove{background:#fff0f0;color:#b91c1c;padding:8px 10px}
    .hint{font-size:12px;margin:10px 0}
    .total{text-align:right;padding-top:20px}
    .actions{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-bottom:30px}
    .message{padding:13px;background:#dcfce7;color:#166534;border-radius:9px;margin-bottom:18px}
    .message.error{background:#fee2e2;color:#991b1b}
    @media(max-width:600px){.page{padding:15px}.panel{padding:16px}.two{grid-template-columns:1fr}.option{gap:6px}}
  `],
})
export class QuizFormComponent {
  private readonly quizService = inject(QuizService);
  private readonly router = inject(Router);

  courses: { id: number; title: string }[] = [];
  courseId: number | null = null;
  title = '';
  description = '';
  duration = 30;
  passingMarks = 0;
  deadline = '';
  saving = false;
  message = '';
  isError = false;

  questions: QuizQuestionDraft[] = [this.newQuestion()];

  constructor() {
    this.loadCourses();
  }

  get totalMarks(): number {
    return this.questions.reduce(
      (sum, question) => sum + (Number(question.marks) || 0), 0
    );
  }

  private newQuestion(): QuizQuestionDraft {
    return {
      question_text: '',
      options: ['', '', '', ''],
      correct_option: 0,
      marks: 1,
    };
  }

  async loadCourses(): Promise<void> {
    try {
      this.courses = await this.quizService.getCourses();
    } catch (error) {
      this.showError(error);
    }
  }

  addQuestion(): void {
    this.questions.push(this.newQuestion());
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) this.questions.splice(index, 1);
  }

  addOption(question: QuizQuestionDraft): void {
    question.options.push('');
  }

  removeOption(question: QuizQuestionDraft, index: number): void {
    if (question.options.length <= 2) return;

    question.options.splice(index, 1);

    if (question.correct_option === index) {
      question.correct_option = 0;
    } else if (question.correct_option > index) {
      question.correct_option--;
    }
  }

  async saveQuiz(): Promise<void> {
    if (this.saving) return;

    if (this.courseId === null) {
      this.showError('Please select a course.');
      return;
    }

    if (this.passingMarks > this.totalMarks) {
      this.showError('Passing marks cannot exceed total marks.');
      return;
    }

    this.saving = true;
    this.message = '';

    try {
      const quiz = await this.quizService.createQuiz({
        course_id: Number(this.courseId),
        title: this.title,
        description: this.description,
        duration_minutes: Number(this.duration),
        passing_marks: Number(this.passingMarks),
        deadline: this.deadline
          ? new Date(this.deadline).toISOString()
          : null,
        questions: this.questions.map(q => ({
          ...q,
          marks: Number(q.marks),
          correct_option: Number(q.correct_option),
          options: q.options.map(option => option.trim()),
        })),
      });

      await this.router.navigate(['/admin/quizzes'], {
        queryParams: { created: quiz.id },
      });
    } catch (error) {
      this.showError(error);
    } finally {
      this.saving = false;
    }
  }

  private showError(error: unknown): void {
    this.isError = true;
    this.message = error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
  }
}