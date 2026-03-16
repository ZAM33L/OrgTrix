import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[GuestGuard] Checking if user is already logged in');

  if (authService.isLoggedIn()) {

    console.log('[GuestGuard] User logged in → redirect to board');

    router.navigate(['/board']);
    return false;
  }

  return true;
};