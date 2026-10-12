import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type StudentStatus = 'active' | 'inactive';
export type StudentResult = 'pending' | 'pass' | 'fail';

export interface Student {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  batch_id: number | null;
  status: StudentStatus;
  result: StudentResult;
  user_id: string | null;
  created_at: string;
  course_batches: { batch_name: string; batch_code: string | null } | null;
}

export interface StudentInput {
  full_name: string;
  email: string;
  phone: string | null;
  batch_id: number | null;
  status: StudentStatus;
  result: StudentResult;
}

export interface StudentBatchOption {
  id: number;
  name: string;
}

interface CourseBatchRow {
  id: number;
  batch_name: string;
  batch_code: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly supabase = inject(SupabaseService);

  private get db() {
    return this.supabase.client;
  }

  private fail(action: string, error: unknown): never {
    console.error(`[StudentService] ${action} failed:`, error);
    throw error;
  }

  async list(): Promise<Student[]> {
    const { data, error } = await this.db
      .from('students')
      .select('*, course_batches(batch_name, batch_code)')
      .order('created_at', { ascending: false });

    if (error) this.fail('list', error);
    return (data ?? []) as unknown as Student[];
  }

  async listBatches(): Promise<StudentBatchOption[]> {
    const { data, error } = await this.db
      .from('course_batches')
      .select('id, batch_name, batch_code')
      .order('batch_name', { ascending: true });

    if (error) this.fail('listBatches', error);

    return ((data ?? []) as CourseBatchRow[]).map((row) => ({
      id: row.id,
      name: row.batch_code ? `${row.batch_name} (${row.batch_code})` : row.batch_name,
    }));
  }

  async create(input: StudentInput): Promise<Student> {
    const { data, error } = await this.db
      .from('students')
      .insert(input)
      .select('*, course_batches(batch_name, batch_code)')
      .single();

    if (error) this.fail('create', error);
    return data as unknown as Student;
  }

  async update(id: number, input: StudentInput): Promise<Student> {
    const { data, error } = await this.db
      .from('students')
      .update(input)
      .eq('id', id)
      .select('*, course_batches(batch_name, batch_code)')
      .single();

    if (error) this.fail('update', error);
    return data as unknown as Student;
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.db.from('students').delete().eq('id', id);
    if (error) this.fail('remove', error);
  }
}