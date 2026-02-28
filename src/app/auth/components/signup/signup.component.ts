import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  officeId = '';

  attemptedSubmitSignup = false;
  isProcessing = false;

  showPassword = false;          
  showConfirmPassword = false; 

  toastMessage = '';
  toastType: 'success' | 'info' = 'success';
  showToast = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ===============================
  // TOAST NOTIFICATION
  // ===============================
  showNotification(message: string, type: 'success' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // ===============================
  // SIGNUP METHOD
  // ===============================
  onSignup() {

    this.attemptedSubmitSignup = true;

    // Trim inputs
    this.name = this.name.trim();
    this.email = this.email.trim();
    this.officeId = this.officeId.trim().toUpperCase();

    if (!this.name || !this.email || !this.password || !this.confirmPassword || !this.officeId) {
      this.showNotification('Please fill all required fields!', 'info');
      return;
    }

    if (!this.isValidEmail()) {
      this.showNotification('Please enter a valid email address', 'info');
      return;
    }

    if (!this.isValidPassword()) {
      this.showNotification('Password must be at least 8 characters', 'info');
      return;
    }

    if (!this.passwordsMatch()) {
      this.showNotification('Passwords do not match', 'info');
      return;
    }

    if (!this.isValidOfficeId()) {
      this.showNotification('Office ID must be in format OTXXXXXX', 'info');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    const result = this.authService.signup(
      this.name,
      this.email,
      this.password,
      this.officeId
    );

    if (result.success) {
      this.showNotification(result.message, 'success');

      setTimeout(() => {
        this.router.navigate(['/board']);
        this.isProcessing = false;
      }, 1000);

    } else {
      this.showNotification(result.message, 'info');
      this.isProcessing = false;
    }
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isValidPassword(): boolean {
    return this.password.length >= 8;
  }

  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  isValidOfficeId(): boolean {
    const officeRegex = /^OT\d{6}$/;
    return officeRegex.test(this.officeId);
  }
}