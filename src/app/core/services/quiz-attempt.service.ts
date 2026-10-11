import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface PublishedQuiz {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  deadline: string | null;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: string;
  student_email: string | null;
  started_at: string;
  ends_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  score: number | null;
  total_marks: number | null;
  passed: boolean | null;
  answers: Record<string, number> | null;
}

export interface AttemptWithQuiz extends QuizAttempt {
  quizzes: { title: string; passing_marks: number; total_marks: number } | null;
}

export interface AttemptQuestion {
  id: number;
  question_text: string;
  options: string[];
  marks: number;
  question_order: number;
}

export function percent(score: number | null, total: number | null): number {
  if (!total || score === null) return 0;
  return Math.round((score / total) * 100);
}

export function isPastDeadline(deadline: string | null): boolean {
  return !!deadline && new Date(deadline).getTime() < Date.now();
}

@Injectable({ providedIn: 'root' })
export class QuizAttemptService {
  private readonly supabase = inject(SupabaseService);

  // ---------- Student ----------

  async getPublishedQuizzes(): Promise<PublishedQuiz[]> {
    const { data, error } = await this.supabase.client
      .from('quizzes')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as PublishedQuiz[];
  }

  async getQuiz(quizId: number): Promise<PublishedQuiz> {
    const { data, error } = await this.supabase.client
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error) throw new Error(error.message);
    return data as PublishedQuiz;
  }

  async getMyAttempts(): Promise<AttemptWithQuiz[]> {
    const { data, error } = await this.supabase.client
      .from('quiz_attempts')
      .select('*, quizzes(title, passing_marks, total_marks)')
      .order('started_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AttemptWithQuiz[];
  }

  async getAttempt(attemptId: number): Promise<AttemptWithQuiz> {
    const { data, error } = await this.supabase.client
      .from('quiz_attempts')
      .select('*, quizzes(title, passing_marks, total_marks)')
      .eq('id', attemptId)
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as AttemptWithQuiz;
  }

  async startAttempt(quizId: number): Promise<QuizAttempt> {
    const { data, error } = await this.supabase.client.rpc(
      'start_quiz_attempt',
      { p_quiz_id: quizId }
    );

    if (error) throw new Error(error.message);
    return data as QuizAttempt;
  }

  async getQuestions(quizId: number): Promise<AttemptQuestion[]> {
    const { data, error } = await this.supabase.client
      .from('quiz_questions')
      .select('id, question_text, options, marks, question_order')
      .eq('quiz_id', quizId)
      .order('question_order');

    if (error) throw new Error(error.message);
    return (data ?? []) as AttemptQuestion[];
  }

  async submitAttempt(
    attemptId: number,
    answers: Record<number, number>
  ): Promise<QuizAttempt> {
    const { data, error } = await this.supabase.client.rpc(
      'submit_quiz_attempt',
      { p_attempt_id: attemptId, p_answers: answers }
    );

    if (error) throw new Error(error.message);
    return data as QuizAttempt;
  }

  /** Difference between the server clock and this device's clock (ms). */
  async getServerOffset(): Promise<number> {
    const { data, error } = await this.supabase.client.rpc('server_now');
    if (error || !data) return 0;
    return new Date(data as string).getTime() - Date.now();
  }

  // ---------- Admin ----------

  async getSubmissions(quizId: number): Promise<QuizAttempt[]> {
    const { data, error } = await this.supabase.client
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .order('score', { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as QuizAttempt[];
  }
}