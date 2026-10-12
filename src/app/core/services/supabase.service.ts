import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const url = (environment.supabaseUrl ?? '').trim().replace(/\/+$/, '');
    const key = (environment.supabaseKey ?? '').trim();

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      console.error('Invalid supabaseUrl in environment.ts:', url);
    }
    if (!key) {
      console.error('supabaseKey is missing in environment.ts');
    }

    this.client = createClient(url, key);
  }
}