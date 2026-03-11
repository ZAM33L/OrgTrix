import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule,HeaderComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {

  constructor(public authService: AuthService) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

}