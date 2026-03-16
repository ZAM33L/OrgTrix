import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const landingRedirectGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[LandingGuard] Checking login before showing landing page');

  if (authService.isLoggedIn()) {

    console.log('[LandingGuard] User logged in → redirect to board');

    router.navigate(['/board']);   // 👈 change here

    return false;
  }

  console.log('[LandingGuard] User not logged in → show landing page');

  return true;
};