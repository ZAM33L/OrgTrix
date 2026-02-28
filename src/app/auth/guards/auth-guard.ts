import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  console.log('[AuthGuard] Checking Login Status...');

  if (authService.isLoggedIn()) {
    console.log('[AuthGuard] Access Granted');
    return true;
  }
  else {
    console.warn('[AuthGuard] Access Denied - Redirecting to Signin');
    router.navigate(['/signin']);
    return false;
  }
};
