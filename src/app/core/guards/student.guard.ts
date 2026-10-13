import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/** Sirf logged-in student dashboard khol sakta hai, warna /student-login. */
export const studentGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  const { data } = await supabase.client.auth.getSession();
  return data.session ? true : router.createUrlTree(['/student-login']);
};