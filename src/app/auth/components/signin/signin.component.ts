import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})

export class SigninComponent {
  identifier = '';
  password = '';
  attemptedSubmitSignin = false;

  isProcessing = false; // new flag

  showPassword = false;

  toastMessage = '';
  toastType: 'success' | 'info' = 'success';
  showToast = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  showNotification(message: string, type: 'success' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  onSignin() {
    this.attemptedSubmitSignin = true;

    if (!this.identifier || !this.password) {
      this.showNotification('Please fill all required fields !!', 'info');
      return;
    }

    if (this.isProcessing) return; // prevent multiple clicks
    this.isProcessing = true;

    // Normalize identifier here
    const normalizedIdentifier = this.identifier.includes('@')
      ? this.identifier.toLowerCase().trim()
      : this.identifier.toUpperCase().trim();

    const result = this.authService.signin(
      normalizedIdentifier,
      this.password
    );

    if (result.success) {
      this.showNotification(result.message, 'success');
      setTimeout(() => {
        this.router.navigate(['/board']);
        this.isProcessing = false; // reset flag
      }, 1000);
    } else {
      this.showNotification(result.message, 'info');
      this.isProcessing = false; // reset flag
    }
  }
}