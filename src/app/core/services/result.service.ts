import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ResultKind = 'quiz' | 'assignment';
export type ResultStatus = 'pass' | 'fail' | 'pending';

/** Assignments have no passing marks column, so this percentage is used. */
export const ASSIGNMENT_PASS_PERCENT = 50;

export interface ResultRow {
  key: string;
  kind: ResultKind;
  /** quiz_attempts.id or assignment_submissions.id */
  recordId: number;
  workId: number;
  title: string;
  studentId: string;
  studentName: string;
  batchId: number | null;
  batchName: string;
  marks: number | null;
  totalMarks: number;
  passingMarks: number;
  percentage: number | null;
  status: ResultStatus;
  date: string | null;
  feedback: string | null;
  submissionText: string | null;
  filePath: string | null;
}

export interface ResultBatch {
  id: number;
  name: string;
}

export interface ResultData {
  rows: ResultRow[];
  batches: ResultBatch[];
}

export interface StudentOption {
  id: string;
  name: string;
}

export interface WorkOption {
  id: number;
  title: string;
  totalMarks: number;
  batchId: number | null;
}

export interface ResultOptions {
  students: StudentOption[];
  quizzes: WorkOption[];
  assignments: WorkOption[];
}

export interface NewResultInput {
  kind: ResultKind;
  workId: number;
  studentId: string;
  marks: number;
  feedback: string | null;
}

export interface UpdateResultInput {
  marks: number;
  feedback: string | null;
}

interface QuizRow {
  id: number;
  title: string;
  total_marks: number | null;
  passing_marks: number | null;
  batch_id: number | null;
}

interface AssignmentRow {
  id: number;
  title: string;
  total_marks: number | null;
  batch_id: number | null;
}

interface AttemptRow {
  id: number;
  quiz_id: number;
  student_id: string;
  submitted_at: string | null;
  score: number | null;
  status: string | null;
}

interface SubmissionRow {
  id: number;
  assignment_id: number;
  student_id: string;
  submission_text: string | null;
  file_path: string | null;
  submitted_at: string | null;
  marks_obtained: number | null;
  feedback: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

interface BatchRow {
  id: number;
  batch_name: string;
  batch_code: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ResultService {
  private readonly supabase = inject(SupabaseService);

  private get db() {
    return this.supabase.client;
  }

  private fail(action: string, error: unknown): never {
    console.error(`[ResultService] ${action} failed:`, error);
    throw error;
  }

  async loadResults(): Promise<ResultData> {
    const [attemptsRes, submissionsRes, quizzesRes, assignmentsRes, batchesRes] =
      await Promise.all([
        this.db
          .from('quiz_attempts')
          .select('id, quiz_id, student_id, submitted_at, score, status'),
        this.db
          .from('assignment_submissions')
          .select(
            'id, assignment_id, student_id, submission_text, file_path, submitted_at, marks_obtained, feedback',
          ),
        this.db.from('quizzes').select('id, title, total_marks, passing_marks, batch_id'),
        this.db.from('assignments').select('id, title, total_marks, batch_id'),
        this.db.from('course_batches').select('id, batch_name, batch_code'),
      ]);

    if (attemptsRes.error) this.fail('quiz_attempts', attemptsRes.error);
    if (submissionsRes.error) this.fail('assignment_submissions', submissionsRes.error);
    if (quizzesRes.error) this.fail('quizzes', quizzesRes.error);
    if (assignmentsRes.error) this.fail('assignments', assignmentsRes.error);
    if (batchesRes.error) this.fail('course_batches', batchesRes.error);

    const attempts = (attemptsRes.data ?? []) as AttemptRow[];
    const submissions = (submissionsRes.data ?? []) as SubmissionRow[];
    const quizzes = (quizzesRes.data ?? []) as QuizRow[];
    const assignments = (assignmentsRes.data ?? []) as AssignmentRow[];
    const batchRows = (batchesRes.data ?? []) as BatchRow[];

    // Student names
    const studentIds = Array.from(
      new Set([...attempts.map((a) => a.student_id), ...submissions.map((s) => s.student_id)]),
    );

    const nameMap = new Map<string, string>();
    if (studentIds.length > 0) {
      const { data, error } = await this.db
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      if (error) this.fail('profiles', error);
      for (const profile of (data ?? []) as ProfileRow[]) {
        nameMap.set(profile.id, profile.full_name ?? 'Unnamed student');
      }
    }

    const batches: ResultBatch[] = batchRows.map((b) => ({
      id: b.id,
      name: b.batch_code ? `${b.batch_name} (${b.batch_code})` : b.batch_name,
    }));
    const batchMap = new Map(batches.map((b) => [b.id, b.name]));
    const quizMap = new Map(quizzes.map((q) => [q.id, q]));
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

    const rows: ResultRow[] = [];

    for (const attempt of attempts) {
      const quiz = quizMap.get(attempt.quiz_id);
      const total = quiz?.total_marks ?? 0;
      const passing = quiz?.passing_marks ?? Math.ceil(total / 2);
      const completed = attempt.submitted_at !== null && attempt.score !== null;
      const marks = completed ? attempt.score : null;

      rows.push({
        key: `quiz-${attempt.id}`,
        kind: 'quiz',
        recordId: attempt.id,
        workId: attempt.quiz_id,
        title: quiz?.title ?? 'Deleted quiz',
        studentId: attempt.student_id,
        studentName: nameMap.get(attempt.student_id) ?? 'Unknown student',
        batchId: quiz?.batch_id ?? null,
        batchName: quiz?.batch_id != null ? (batchMap.get(quiz.batch_id) ?? 'Batch') : 'No batch',
        marks,
        totalMarks: total,
        passingMarks: passing,
        percentage: this.percent(marks, total),
        status: marks === null ? 'pending' : marks >= passing ? 'pass' : 'fail',
        date: attempt.submitted_at,
        feedback: null,
        submissionText: null,
        filePath: null,
      });
    }

    for (const submission of submissions) {
      const assignment = assignmentMap.get(submission.assignment_id);
      const total = assignment?.total_marks ?? 0;
      const passing = Math.ceil((total * ASSIGNMENT_PASS_PERCENT) / 100);
      const marks = submission.marks_obtained;

      rows.push({
        key: `assignment-${submission.id}`,
        kind: 'assignment',
        recordId: submission.id,
        workId: submission.assignment_id,
        title: assignment?.title ?? 'Deleted assignment',
        studentId: submission.student_id,
        studentName: nameMap.get(submission.student_id) ?? 'Unknown student',
        batchId: assignment?.batch_id ?? null,
        batchName:
          assignment?.batch_id != null ? (batchMap.get(assignment.batch_id) ?? 'Batch') : 'No batch',
        marks,
        totalMarks: total,
        passingMarks: passing,
        percentage: this.percent(marks, total),
        status: marks === null ? 'pending' : marks >= passing ? 'pass' : 'fail',
        date: submission.submitted_at,
        feedback: submission.feedback,
        submissionText: submission.submission_text,
        filePath: submission.file_path,
      });
    }

    rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

    return { rows, batches };
  }

  /** Students, quizzes and assignments used by the "New Result" form. */
  async loadOptions(): Promise<ResultOptions> {
    const [quizzesRes, assignmentsRes] = await Promise.all([
      this.db.from('quizzes').select('id, title, total_marks, batch_id').order('title'),
      this.db.from('assignments').select('id, title, total_marks, batch_id').order('title'),
    ]);

    if (quizzesRes.error) this.fail('options.quizzes', quizzesRes.error);
    if (assignmentsRes.error) this.fail('options.assignments', assignmentsRes.error);

    let profilesRes = await this.db
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .order('full_name');

    if (profilesRes.error) this.fail('options.students', profilesRes.error);

    // If no profile is tagged as a student yet, fall back to all profiles.
    if ((profilesRes.data ?? []).length === 0) {
      profilesRes = await this.db.from('profiles').select('id, full_name').order('full_name');
      if (profilesRes.error) this.fail('options.students (fallback)', profilesRes.error);
    }

    const toWork = (row: {
      id: number;
      title: string;
      total_marks: number | null;
      batch_id: number | null;
    }): WorkOption => ({
      id: row.id,
      title: row.title,
      totalMarks: row.total_marks ?? 0,
      batchId: row.batch_id,
    });

    return {
      students: ((profilesRes.data ?? []) as ProfileRow[]).map((p) => ({
        id: p.id,
        name: p.full_name ?? 'Unnamed student',
      })),
      quizzes: ((quizzesRes.data ?? []) as QuizRow[]).map(toWork),
      assignments: ((assignmentsRes.data ?? []) as AssignmentRow[]).map(toWork),
    };
  }

  async createResult(input: NewResultInput): Promise<void> {
    const now = new Date().toISOString();

    if (input.kind === 'quiz') {
      const { error } = await this.db.from('quiz_attempts').insert({
        quiz_id: input.workId,
        student_id: input.studentId,
        started_at: now,
        submitted_at: now,
        score: Math.round(input.marks),
        status: 'submitted',
      });
      if (error) this.fail('createResult(quiz)', error);
      return;
    }

    const { data: userData } = await this.db.auth.getUser();

    const { error } = await this.db.from('assignment_submissions').insert({
      assignment_id: input.workId,
      student_id: input.studentId,
      submission_text: 'Result added manually by an administrator.',
      submitted_at: now,
      marks_obtained: input.marks,
      feedback: input.feedback,
      graded_by: userData.user?.id ?? null,
      graded_at: now,
    });
    if (error) this.fail('createResult(assignment)', error);
  }

  async updateResult(row: ResultRow, input: UpdateResultInput): Promise<void> {
    if (row.kind === 'quiz') {
      const changes: Record<string, unknown> = {
        score: Math.round(input.marks),
        submitted_at: row.date ?? new Date().toISOString(),
      };
      // An unfinished attempt becomes a finished one once marks are entered.
      if (row.status === 'pending') changes['status'] = 'submitted';

      const { error } = await this.db.from('quiz_attempts').update(changes).eq('id', row.recordId);
      if (error) this.fail('updateResult(quiz)', error);
      return;
    }

    const { data: userData } = await this.db.auth.getUser();

    const { error } = await this.db
      .from('assignment_submissions')
      .update({
        marks_obtained: input.marks,
        feedback: input.feedback,
        graded_by: userData.user?.id ?? null,
        graded_at: new Date().toISOString(),
      })
      .eq('id', row.recordId);
    if (error) this.fail('updateResult(assignment)', error);
  }

  async deleteResult(row: ResultRow): Promise<void> {
    const table = row.kind === 'quiz' ? 'quiz_attempts' : 'assignment_submissions';
    const { error } = await this.db.from(table).delete().eq('id', row.recordId);
    if (error) this.fail('deleteResult', error);
  }

  private percent(marks: number | null, total: number): number | null {
    if (marks === null || total <= 0) return null;
    return Math.round((marks / total) * 1000) / 10;
  }
}