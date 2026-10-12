
import { Injectable, inject } from '@angular/core';
import {
  FunctionsHttpError,
} from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

export type InvitationRole = 'teacher' | 'student';

export interface InvitationPayload {
  fullName: string;
  email: string;
  role: InvitationRole;
}

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private readonly supabase = inject(SupabaseService);

  async inviteUser(payload: InvitationPayload): Promise<string> {
    const { data, error } =
      await this.supabase.client.functions.invoke('invite-user', {
        body: {
          fullName: payload.fullName.trim(),
          email: payload.email.trim().toLowerCase(),
          role: payload.role,
        },
      });

    if (error instanceof FunctionsHttpError) {
      const responseBody = await error.context
        .json()
        .catch(() => null) as {
          error?: string;
          message?: string;
        } | null;

      throw new Error(
        responseBody?.error ??
        responseBody?.message ??
        error.message,
      );
    }

    if (error) {
      throw new Error(error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.message ?? 'Invitation request completed.';
  }
}