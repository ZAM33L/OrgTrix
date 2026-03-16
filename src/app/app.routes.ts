import { Routes } from '@angular/router';
import { SigninComponent } from './auth/components/signin/signin.component';
import { SignupComponent } from './auth/components/signup/signup.component';
import { authGuard } from './auth/guards/auth-guard';
import { BoardComponent } from '../app/components/board/board.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LandingComponent } from './pages/landing/landing.component';
import { landingRedirectGuard } from './auth/guards/landing-redirect.guard';
import { guestGuard } from './auth/guards/guest.guard';

export const routes: Routes = [

  {
    path: '',
    component: LandingComponent,
    canActivate: [landingRedirectGuard]
  },

  {
    path: 'signin',
    component: SigninComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'board',
    component: BoardComponent,
    canActivate: [authGuard]
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '' }

];