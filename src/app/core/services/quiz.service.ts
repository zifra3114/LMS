
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface QuizQuestionDraft {
  question_text: string;
  options: string[];
  correct_option: number;
  marks: number;
}

export interface QuizDraft {
  course_id: number;
  title: string;
  description: string;
  duration_minutes: number;
  passing_marks: number;
  deadline: string | null;
  questions: QuizQuestionDraft[];
}

export interface QuizRecord {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  status: 'draft' | 'published' | 'closed';
  deadline: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  private readonly supabase = inject(SupabaseService);

  // Admin ke liye tamam quizzes
  async getQuizzes(): Promise<QuizRecord[]> {
    const { data, error } = await this.supabase.client
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []) as QuizRecord[];
  }

  // Course dropdown ke liye courses
  async getCourses(): Promise<{ id: number; title: string }[]> {
    const { data, error } = await this.supabase.client
      .from('courses')
      .select('id, title')
      .order('title');

    if (error) throw new Error(error.message);

    return data ?? [];
  }

  // Naya quiz aur uske questions save karna
  async createQuiz(draft: QuizDraft): Promise<QuizRecord> {
    this.validateDraft(draft);

    const { data: userData, error: userError } =
      await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw new Error('Please log in before creating a quiz.');
    }

    const totalMarks = draft.questions.reduce(
      (sum, question) => sum + question.marks,
      0
    );

    const { data: quiz, error: quizError } =
      await this.supabase.client
        .from('quizzes')
        .insert({
          course_id: draft.course_id,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          duration_minutes: draft.duration_minutes,
          total_marks: totalMarks,
          passing_marks: draft.passing_marks,
          deadline: draft.deadline || null,
          status: 'draft',
          created_by: userData.user.id,
        })
        .select('*')
        .single();

    if (quizError) throw new Error(quizError.message);

    try {
      for (let index = 0; index < draft.questions.length; index++) {
        const question = draft.questions[index];

        const { data: savedQuestion, error: questionError } =
          await this.supabase.client
            .from('quiz_questions')
            .insert({
              quiz_id: quiz.id,
              question_text: question.question_text.trim(),
              options: question.options,
              marks: question.marks,
              question_order: index + 1,
            })
            .select('id')
            .single();

        if (questionError) throw new Error(questionError.message);

        const { error: answerError } = await this.supabase.client
          .from('quiz_answer_keys')
          .insert({
            question_id: savedQuestion.id,
            correct_option: question.correct_option,
          });

        if (answerError) throw new Error(answerError.message);
      }
    } catch (error) {
      // Agar question save na ho, incomplete quiz ko remove karne ki koshish.
      // Database delete policy/permissions ki wajah se fail ho to
      // original error phir bhi report hoga.
      await this.supabase.client
        .from('quizzes')
        .delete()
        .eq('id', quiz.id);

      throw error;
    }

    return quiz as QuizRecord;
  }

  // Quiz ko students ke liye publish karna
  async publishQuiz(quizId: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('quizzes')
      .update({ status: 'published' })
      .eq('id', quizId)
      .eq('status', 'draft');

    if (error) throw new Error(error.message);
  }

  // Quiz delete karna; related records cascade se delete honge
  async deleteQuiz(quizId: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) throw new Error(error.message);
  }

  private validateDraft(draft: QuizDraft): void {
    if (!draft.title.trim()) {
      throw new Error('Quiz title is required.');
    }

    if (!Number.isInteger(draft.course_id) || draft.course_id <= 0) {
      throw new Error('Please select a valid course.');
    }

    if (
      !Number.isInteger(draft.duration_minutes) ||
      draft.duration_minutes <= 0
    ) {
      throw new Error('Duration must be greater than zero.');
    }

    if (
      !Number.isInteger(draft.passing_marks) ||
      draft.passing_marks < 0
    ) {
      throw new Error('Passing marks cannot be negative.');
    }

    if (!draft.questions.length) {
      throw new Error('Add at least one question.');
    }

    for (const [index, question] of draft.questions.entries()) {
      if (!question.question_text.trim()) {
        throw new Error(`Question ${index + 1} cannot be empty.`);
      }

      if (
        question.options.length < 2 ||
        question.options.some((option) => !option.trim())
      ) {
        throw new Error(
          `Question ${index + 1} needs at least two non-empty options.`
        );
      }

      if (
        !Number.isInteger(question.correct_option) ||
        question.correct_option < 0 ||
        question.correct_option >= question.options.length
      ) {
        throw new Error(
          `Select the correct answer for question ${index + 1}.`
        );
      }

      if (!Number.isInteger(question.marks) || question.marks <= 0) {
        throw new Error(
          `Question ${index + 1} must have positive marks.`
        );
      }
    }

    const totalMarks = draft.questions.reduce(
      (sum, question) => sum + question.marks,
      0
    );

    if (draft.passing_marks > totalMarks) {
      throw new Error('Passing marks cannot exceed total marks.');
    }
  }
}