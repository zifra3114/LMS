
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

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly bucketName = 'course-images';
  private readonly maxImageSize = 5 * 1024 * 1024;

  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // Get all courses
  async getCourses(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []) as Course[];
  }

  // Get one course
  async getCourseById(id: number): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as Course;
  }

  // Upload course thumbnail to Supabase Storage
  async uploadThumbnail(file: File): Promise<string> {
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Only JPG, PNG and WebP images are allowed.');
    }

    if (file.size > this.maxImageSize) {
      throw new Error('Image size must be 5 MB or less.');
    }

    if (file.size === 0) {
      throw new Error('The selected image is empty.');
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

    if (error) {
      console.error('Supabase thumbnail upload error:', error);
      throw new Error(
        `Image upload failed: ${error.message}. Check the course-images bucket and Storage policies.`,
      );
    }

    const { data: publicData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    if (!publicData.publicUrl) {
      throw new Error('Could not generate the image URL.');
    }

    return publicData.publicUrl;
  }

  // Create course
  async createCourse(course: CourseInput): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert(course)
      .select()
      .single();

    if (error) throw error;

    return data as Course;
  }

  // Update course
  async updateCourse(
    id: number,
    course: Partial<CourseInput>,
  ): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update(course)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as Course;
  }

  // Delete course
  async deleteCourse(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}