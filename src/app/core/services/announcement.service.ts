import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AnnouncementPriority = 'normal' | 'important';
export type AnnouncementAudience = 'all' | 'batch';
export type AnnouncementType = 'manual' | 'course' | 'quiz' | 'assignment';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  batch_id: string | null;
  type: AnnouncementType;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  batch_id: string | null;
  type?: AnnouncementType;
  source_id?: string | null;
}

export interface BatchOption {
  id: string;
  name: string;
}

interface CourseBatchRow {
  id: number | string;
  batch_name: string;
  batch_code: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private readonly supabase = inject(SupabaseService);

  private get db() {
    return this.supabase.client;
  }

  private fail(action: string, error: unknown): never {
    console.error(`[AnnouncementService] ${action} failed:`, error);
    throw error;
  }

  async list(limit?: number): Promise<Announcement[]> {
    let query = this.db
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) this.fail('list', error);

    return (data ?? []) as Announcement[];
  }

  async listBatches(): Promise<BatchOption[]> {
    const { data, error } = await this.db
      .from('course_batches')
      .select('id, batch_name, batch_code')
      .order('batch_name', { ascending: true });

    if (error) this.fail('listBatches', error);

    return ((data ?? []) as CourseBatchRow[]).map((row) => ({
      id: String(row.id),
      name: row.batch_code ? `${row.batch_name} (${row.batch_code})` : row.batch_name,
    }));
  }

  async create(input: AnnouncementInput): Promise<Announcement> {
    const { data, error } = await this.db
      .from('announcements')
      .insert({
        ...input,
        type: input.type ?? 'manual',
        source_id: input.source_id ?? null,
        batch_id: input.audience === 'batch' ? input.batch_id : null,
      })
      .select()
      .single();

    if (error) this.fail('create', error);
    return data as Announcement;
  }

  async update(id: string, input: AnnouncementInput): Promise<Announcement> {
    const { data, error } = await this.db
      .from('announcements')
      .update({
        title: input.title,
        message: input.message,
        priority: input.priority,
        audience: input.audience,
        batch_id: input.audience === 'batch' ? input.batch_id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) this.fail('update', error);
    return data as Announcement;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('announcements').delete().eq('id', id);
    if (error) this.fail('remove', error);
  }

  // ---------------------------------------------------------------
  // Automatic announcements.
  // Call these right after a course / quiz / assignment is created.
  // ---------------------------------------------------------------

  /** New course: visible to every student. */
  announceNewCourse(courseTitle: string, courseId: string | number): Promise<Announcement> {
    return this.create({
      title: 'New course available',
      message: `A new course "${courseTitle}" has been added.`,
      priority: 'normal',
      audience: 'all',
      batch_id: null,
      type: 'course',
      source_id: String(courseId),
    });
  }

  /** New quiz or assignment: visible only to the selected batch. */
  announceBatchWork(params: {
    kind: 'quiz' | 'assignment';
    title: string;
    batchId: string | number;
    sourceId: string | number;
  }): Promise<Announcement> {
    const label = params.kind === 'quiz' ? 'quiz' : 'assignment';

    return this.create({
      title: params.kind === 'quiz' ? 'New quiz assigned' : 'New assignment assigned',
      message: `A new ${label} "${params.title}" has been assigned to your batch.`,
      priority: 'normal',
      audience: 'batch',
      batch_id: String(params.batchId),
      type: params.kind,
      source_id: String(params.sourceId),
    });
  }
}