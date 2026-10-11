import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type CourseStatus = 'Published' | 'Drafted';
export type CourseLevel = 'Basic' | 'Intermediate' | 'Expert';
export type CourseType = 'single' | 'bundle';

export interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: number;
  level: CourseLevel;
  type: CourseType;
  thumbnail: string;
  status: CourseStatus;
  created_at: string;
}

export type CourseInput = Omit<Course, 'id' | 'created_at'>;

export type BatchStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface CourseBatch {
  id: number;
  course_id: number;
  batch_name: string;
  batch_code: string;
  start_date: string;
  end_date: string;
  status: BatchStatus;
  created_at: string;
}

export type CourseBatchInput = Omit<CourseBatch, 'id' | 'created_at'>;

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly bucketName = 'course-images';
  private readonly maxImageSize = 5 * 1024 * 1024;

  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  async getCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as Course[];
  }

  async getCourseById(id: number): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as Course;
  }

  async uploadThumbnail(file: File): Promise<string> {
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG and WebP images are allowed.');
    }

    if (file.size > this.maxImageSize || file.size === 0) {
      throw new Error('Image must be greater than 0 bytes and 5 MB or less.');
    }

    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const extension = extensionByType[file.type];
    const filePath = `courses/${crypto.randomUUID()}.${extension}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data: publicData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    if (!publicData.publicUrl) {
      throw new Error('Could not generate the image URL.');
    }

    return publicData.publicUrl;
  }

  async createCourse(course: CourseInput): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert(course)
      .select()
      .single();

    if (error) throw error;

    return data as Course;
  }

  async updateCourse(id: number, course: Partial<CourseInput>): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update(course)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as Course;
  }

  async deleteCourse(id: number): Promise<void> {
    const { error } = await this.supabase.from('courses').delete().eq('id', id);

    if (error) throw error;
  }

  // =========================
  // BATCH METHODS
  // =========================

  async getBatches(courseId: number): Promise<CourseBatch[]> {
    const { data, error } = await this.supabase
      .from('course_batches')
      .select('*')
      .eq('course_id', courseId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (data ?? []) as CourseBatch[];
  }

  async getAllBatches(): Promise<CourseBatch[]> {
    const { data, error } = await this.supabase
      .from('course_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as CourseBatch[];
  }

  async createBatch(batch: CourseBatchInput): Promise<CourseBatch> {
    this.validateBatch(batch);

    const { data, error } = await this.supabase
      .from('course_batches')
      .insert(batch)
      .select()
      .single();

    if (error) throw error;

    return data as CourseBatch;
  }

  async updateBatch(
    id: number,
    batch: Partial<CourseBatchInput>,
  ): Promise<CourseBatch> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('course_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const updated = { ...existing, ...batch } as CourseBatchInput;

    this.validateBatch(updated);

    const { data, error } = await this.supabase
      .from('course_batches')
      .update(batch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as CourseBatch;
  }

  async deleteBatch(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('course_batches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private validateBatch(batch: CourseBatchInput): void {
    if (!batch.batch_name.trim()) {
      throw new Error('Batch name is required.');
    }

    if (!batch.batch_code.trim()) {
      throw new Error('Batch code is required.');
    }

    if (!batch.start_date || !batch.end_date) {
      throw new Error('Batch start date and end date are required.');
    }

    if (batch.end_date < batch.start_date) {
      throw new Error('Batch end date cannot be before start date.');
    }
  }
}