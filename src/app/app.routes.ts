import { Routes } from '@angular/router';
import { SigninComponent } from './auth/components/signin/signin.component';
import { SignupComponent } from './auth/components/signup/signup.component';
import { authGuard } from './auth/guards/auth-guard';
import { BoardComponent } from '../app/components/board/board.component';

export const routes: Routes = [

    {path:'',redirectTo:'signin',pathMatch:'full'},

    {path:'signin',component:SigninComponent},
    {path:'signup',component:SignupComponent},

    {
        path:'board',
        component:BoardComponent,
        canActivate:[authGuard]
    },

    {path:'**',redirectTo:'signin'}

];
