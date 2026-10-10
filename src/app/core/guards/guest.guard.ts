import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const session = await auth.getSession();
  if (session && (await auth.isAdmin(session.user.id))) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return true;
};