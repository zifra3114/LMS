import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  async login(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const invalid = error.message.toLowerCase().includes('invalid login credentials');
      return {
        error: invalid
          ? 'Invalid email or password.'
          : 'Unable to sign in right now. Please try again.',
      };
    }

    if (!(await this.isAdmin(data.user.id))) {
      await this.supabase.client.auth.signOut();
      return { error: 'You do not have permission to access the admin panel.' };
    }
    return { error: null };
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return !error && data?.role === 'admin';
  }

  async getSession() {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }

  async getCurrentEmail(): Promise<string | null> {
    const session = await this.getSession();
    return session?.user.email ?? null;
  }

  logout() {
    return this.supabase.client.auth.signOut();
  }
}