import { DatePipe, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ElementRef, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  AssignmentBatchOption,
  AssignmentCourseOption,
  AssignmentRecord,
  AssignmentService,
  AssignmentSubmission,
} from '../../../core/services/assignment.service';
import { Toast } from '../../../core/services/toast.service';

interface SubmissionRow extends AssignmentSubmission {
  marksInput: number | null;
  feedbackInput: string;
  saving: boolean;
}

@Component({
  selector: 'app-assignment-details',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <!-- Modal overlay with fixed screen lock to prevent background scrolling -->
    <div
      style="position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 12px; overflow: hidden;"
      class="bg-slate-950/60 backdrop-blur-sm"
    >
      <!-- Modal container: height is always limited to the visible screen -->
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-modal-title"
        style="display: flex; flex-direction: column; width: 100%; max-width: 672px; height: min(88dvh, 900px); max-height: calc(100dvh - 24px); overflow: hidden;"
        class="relative rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <!-- Header -->
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4"
        >
          <div>
            <h1
              id="assignment-modal-title"
              class="text-xl font-bold tracking-tight text-slate-900"
            >
              Assignment Details
            </h1>

            <p class="mt-1 text-xs text-slate-500">
              View assignment details and student submissions.
            </p>
          </div>

          <a
            routerLink="/admin/assignments"
            aria-label="Close assignment details"
            title="Close"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            &times;
          </a>
        </header>

        <!-- Scrollable content -->
        <div
          style="flex: 1 1 0%; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch;"
          class="modal-scroll bg-slate-50/70 p-4 sm:p-5"
        >

          @if (loading()) {
            <div
              class="rounded-xl border border-slate-200 bg-white p-12 text-center"
            >
              <div
                class="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
              ></div>

              <p class="mt-4 text-sm text-slate-500">
                Loading assignment...
              </p>
            </div>
          } @else if (error()) {
            <div
              class="rounded-xl border border-red-200 bg-white p-8 text-center"
            >
              <div
                class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600"
              >
                !
              </div>

              <h2 class="mt-3 text-lg font-bold text-slate-900">
                Unable to load assignment
              </h2>

              <p class="mt-2 text-sm text-red-600">
                {{ error() }}
              </p>

              <button
                type="button"
                (click)="load()"
                class="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          } @else if (assignment(); as a) {

            <!-- Assignment details card -->
            <section
              class="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <!-- Full image at the top -->
              @if (a.attachment_url) {
                <a
                  [href]="a.attachment_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block w-full border-b border-slate-200 bg-slate-950 p-2 sm:p-3"
                >
                  <img
                    [src]="a.attachment_url"
                    [alt]="a.title"
                    style="max-height: 35dvh;"
                    class="mx-auto block h-auto w-auto max-w-full object-contain"
                  />
                </a>
              }

              <div class="p-4 sm:p-5">

                <!-- Title and status -->
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600"
                    >
                      Assignment
                    </p>

                    <h2 class="text-xl font-bold text-slate-900">
                      {{ a.title }}
                    </h2>
                  </div>

                  <span
                    [class]="isOpen(a)
                      ? 'rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'
                      : 'rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600'"
                  >
                    {{ isOpen(a) ? 'Open' : 'Closed' }}
                  </span>
                </div>

                <!-- Description -->
                <div class="mt-5">
                  <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    Description / Instructions
                  </h3>

                  <p
                    class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600"
                  >
                    {{ a.description || 'No description provided.' }}
                  </p>
                </div>

                <!-- Course, batch, deadline and marks -->
                <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p class="text-xs text-slate-500">Course</p>

                    <p class="mt-1 break-words text-sm font-bold text-slate-900">
                      {{ courseName(a.course_id) }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p class="text-xs text-slate-500">Batch</p>

                    <p class="mt-1 break-words text-sm font-bold text-slate-900">
                      {{ a.batch_id !== null
                        ? batchName(a.batch_id)
                        : 'All batches' }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p class="text-xs text-slate-500">Deadline</p>

                    <p class="mt-1 text-sm font-bold text-slate-900">
                      {{ a.deadline
                        ? (a.deadline | date: 'MMM d, y, h:mm a')
                        : 'No deadline' }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p class="text-xs text-slate-500">Total Marks</p>

                    <p class="mt-1 text-sm font-bold text-slate-900">
                      {{ a.total_marks }}
                    </p>
                  </div>
                </div>

                <!-- Created date and edit button -->
                <div
                  class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
                >
                  <p class="text-xs text-slate-400">
                    Created:
                    {{ a.created_at | date: 'MMM d, y, h:mm a' }}
                  </p>

                  <a
                    [routerLink]="['/admin/assignments', a.id, 'edit']"
                    class="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Edit Assignment
                  </a>
                </div>
              </div>
            </section>

            <!-- Student submissions -->
            <section
              class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5"
              >
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    Student Submissions
                  </h2>

                  <p class="mt-1 text-xs text-slate-500">
                    Review work and award marks.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    class="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                  >
                    {{ submissions().length }} Submitted
                  </span>

                  <span
                    class="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                  >
                    {{ checkedCount() }} Checked
                  </span>
                </div>
              </div>

              @if (!submissions().length) {
                <div class="px-5 py-12 text-center">
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"
                  >
                    <svg
                      class="h-6 w-6 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.7"
                    >
                      <path
                        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>

                  <h3 class="mt-3 font-semibold text-slate-800">
                    No submissions yet
                  </h3>

                  <p class="mt-1 text-sm text-slate-500">
                    Student submissions will appear here.
                  </p>
                </div>
              } @else {
                <div class="divide-y divide-slate-100">
                  @for (s of submissions(); track s.id) {
                    <article class="p-4 sm:p-5">

                      <!-- Student information -->
                      <div
                        class="flex flex-wrap items-start justify-between gap-3"
                      >
                        <div class="flex min-w-0 items-center gap-3">
                          <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700"
                          >
                            {{ (s.student_name || 'S').charAt(0).toUpperCase() }}
                          </div>

                          <div class="min-w-0">
                            <p class="break-words text-sm font-semibold text-slate-900">
                              {{ s.student_name || 'Student' }}
                            </p>

                            <p class="break-all text-xs text-slate-500">
                              {{ s.student_email || '—' }}
                            </p>
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-2">
                          @if (isLate(s, a)) {
                            <span
                              class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            >
                              Late
                            </span>
                          }

                          <span
                            [class]="s.status === 'checked'
                              ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                              : 'rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700'"
                          >
                            {{ s.status === 'checked' ? 'Checked' : 'Pending' }}
                          </span>
                        </div>
                      </div>

                      <p class="mt-3 text-xs text-slate-400">
                        Submitted:
                        {{ s.submitted_at | date: 'MMM d, y, h:mm a' }}
                      </p>

                      <!-- Text answer -->
                      @if (s.content) {
                        <div class="mt-4">
                          <p
                            class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                          >
                            Student's Answer
                          </p>

                          <p
                            class="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                          >
                            {{ s.content }}
                          </p>
                        </div>
                      }

                      <!-- Student attachment -->
                      @if (s.file_url) {
                        <div class="mt-4">
                          <p
                            class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
                          >
                            Attached File
                          </p>

                          <a
                            [href]="s.file_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block w-full rounded-xl border border-slate-200 bg-slate-950 p-2"
                          >
                            <img
                              [src]="s.file_url"
                              alt="Student submission"
                              class="mx-auto max-h-64 w-auto max-w-full object-contain"
                            />
                          </a>

                          <a
                            [href]="s.file_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="mt-2 inline-block text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Open attachment ↗
                          </a>
                        </div>
                      }

                      <!-- Grading section -->
                      <div
                        class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <h3 class="mb-4 text-sm font-bold text-slate-800">
                          Evaluate Submission
                        </h3>

                        <div class="grid gap-4 sm:grid-cols-[120px_1fr]">
                          <div>
                            <label
                              [for]="'marks_' + s.id"
                              class="mb-2 block text-xs font-semibold text-slate-600"
                            >
                              Marks (out of {{ a.total_marks }})
                            </label>

                            <input
                              [id]="'marks_' + s.id"
                              type="number"
                              min="0"
                              [max]="a.total_marks"
                              step="any"
                              [(ngModel)]="s.marksInput"
                              [name]="'marks_' + s.id"
                              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label
                              [for]="'feedback_' + s.id"
                              class="mb-2 block text-xs font-semibold text-slate-600"
                            >
                              Feedback
                            </label>

                            <input
                              [id]="'feedback_' + s.id"
                              type="text"
                              [(ngModel)]="s.feedbackInput"
                              [name]="'feedback_' + s.id"
                              placeholder="Write feedback for the student..."
                              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            />
                          </div>
                        </div>

                        <div
                          class="mt-4 flex flex-wrap items-center justify-between gap-3"
                        >
                          @if (s.status === 'checked') {
                            <p class="text-xs font-medium text-emerald-700">
                              Marks have been saved.
                            </p>
                          } @else {
                            <p class="text-xs text-slate-400">
                              Review the answer before saving.
                            </p>
                          }

                          <button
                            type="button"
                            (click)="grade(s, a)"
                            [disabled]="s.saving"
                            class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            @if (s.saving) {
                              <span
                                class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                              ></span>
                              Saving...
                            } @else {
                              {{ s.status === 'checked'
                                ? 'Update Marks'
                                : 'Save Marks' }}
                            }
                          </button>
                        </div>
                      </div>
                    </article>
                  }
                </div>
              }
            </section>
          }
        </div>

        <!-- Footer -->
        <footer
          class="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3"
        >
          <p class="text-xs text-slate-400">
            Assignment Management
          </p>

          <a
            routerLink="/admin/assignments"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </a>
        </footer>
      </section>
    </div>
  `,
  styles: [
    `
      /* Modal ke andar right side par apna scrollbar (UI same rahega) */
      .modal-scroll {
        scrollbar-gutter: stable;
      }

      .modal-scroll::-webkit-scrollbar {
        display: block;
        width: 10px;
      }

      .modal-scroll::-webkit-scrollbar-track {
        background: #e2e8f0;
        border-radius: 9999px;
      }

      .modal-scroll::-webkit-scrollbar-thumb {
        background: #94a3b8;
        border: 2px solid #e2e8f0;
        border-radius: 9999px;
      }

      .modal-scroll::-webkit-scrollbar-thumb:hover {
        background: #64748b;
      }
    `,
  ],
})
export class AssignmentDetailsComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(AssignmentService);
  private readonly toast = inject(Toast);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  private prevBodyOverflow = '';
  private prevHtmlOverflow = '';

  readonly assignment = signal<AssignmentRecord | null>(null);
  readonly submissions = signal<SubmissionRow[]>([]);
  readonly courses = signal<AssignmentCourseOption[]>([]);
  readonly batches = signal<AssignmentBatchOption[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    // Modal ko body mein move karein taake parent ka transform/overflow asar na kare
    this.document.body.appendChild(this.host.nativeElement);

    // Background page scroll lock
    this.prevBodyOverflow = this.document.body.style.overflow;
    this.prevHtmlOverflow = this.document.documentElement.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.document.documentElement.style.overflow = 'hidden';

    void this.load();
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.prevBodyOverflow;
    this.document.documentElement.style.overflow = this.prevHtmlOverflow;
    this.host.nativeElement.remove();
  }

  checkedCount(): number {
    return this.submissions().filter(
      (s) => s.status === 'checked',
    ).length;
  }

  isOpen(a: AssignmentRecord): boolean {
    if (a.status !== 'open') return false;

    return !a.deadline ||
      new Date(a.deadline).getTime() > Date.now();
  }

  isLate(s: AssignmentSubmission, a: AssignmentRecord): boolean {
    if (!a.deadline) return false;

    return new Date(s.submitted_at).getTime() >
      new Date(a.deadline).getTime();
  }

  courseName(id: number): string {
    return this.courses().find((c) => c.id === id)?.title
      ?? `Course #${id}`;
  }

  batchName(id: number): string {
    const batch = this.batches().find((b) => b.id === id);

    return batch
      ? `${batch.batch_name} (${batch.batch_code})`
      : `Batch #${id}`;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Invalid assignment ID.');
      }

      const [
        assignment,
        submissions,
        courses,
        batches,
      ] = await Promise.all([
        this.service.getAssignment(id),
        this.service.getSubmissions(id),
        this.service.getCourses().catch(
          () => [] as AssignmentCourseOption[],
        ),
        this.service.getAllBatches().catch(
          () => [] as AssignmentBatchOption[],
        ),
      ]);

      this.assignment.set(assignment);
      this.courses.set(courses);
      this.batches.set(batches);

      this.submissions.set(
        submissions.map((s) => ({
          ...s,
          marksInput: s.marks,
          feedbackInput: s.feedback ?? '',
          saving: false,
        })),
      );
    } catch (error) {
      this.assignment.set(null);
      this.submissions.set([]);

      this.error.set(
        (error as { message?: string } | null)?.message ||
          'Something went wrong while loading the assignment.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async grade(
    s: SubmissionRow,
    a: AssignmentRecord,
  ): Promise<void> {
    if (s.saving) return;

    if (
      s.marksInput === null ||
      s.marksInput === undefined ||
      `${s.marksInput}`.trim() === ''
    ) {
      this.toast.error(
        'Please enter marks before saving.',
        'Marks',
      );
      return;
    }

    const marks = Number(s.marksInput);

    if (
      !Number.isFinite(marks) ||
      marks < 0 ||
      marks > a.total_marks
    ) {
      this.toast.error(
        `Marks must be between 0 and ${a.total_marks}.`,
        'Invalid marks',
      );
      return;
    }

    s.saving = true;

    try {
      await this.service.gradeSubmission(
        s.id,
        marks,
        s.feedbackInput,
        a.total_marks,
      );

      s.marks = marks;
      s.feedback = s.feedbackInput.trim() || null;
      s.status = 'checked';

      this.toast.success(
        `Marks saved for ${s.student_name || 'student'}.`,
        'Submission checked',
      );
    } catch (error) {
      this.toast.error(
        (error as { message?: string } | null)?.message ||
          'Could not save marks.',
        'Marks',
      );
    } finally {
      s.saving = false;
    }
  }
}