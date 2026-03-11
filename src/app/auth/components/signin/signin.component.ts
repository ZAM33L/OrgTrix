import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, throwError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})

export class SigninComponent implements AfterViewInit {
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

  ngAfterViewInit() {
    // Wait until window.google exists
    const interval = setInterval(() => {
      if (window.google && window.google.accounts?.id) {
        clearInterval(interval);

        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleResponse(response)
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn')!,
          { theme: 'outline', size: 'large', width: 250 }
        );
      }
    }, 100);
  }

    handleGoogleResponse(response: any) {
    this.isProcessing = true;
    this.authService.verifyGoogleToken(response.credential).subscribe(result => {
      this.isProcessing = false;
      if (result?.success) {
        this.showNotification('Logged in with Google!', 'success');
        setTimeout(() => this.router.navigate(['/board']), 500);
      } else {
        this.showNotification(result?.message || 'Google login failed', 'info');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    this.cdr.detectChanges();

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

    //OLD - LOCAL STORAGE BASED

    // const result = this.authService.signin(
    //   normalizedIdentifier,
    //   this.password
    // );

    // if (result.success) {
    //   this.showNotification(result.message, 'success');
    //   setTimeout(() => {
    //     this.router.navigate(['/board']);
    //     this.isProcessing = false; // reset flag
    //   }, 1000);
    // } else {
    //   this.showNotification(result.message, 'info');
    //   this.isProcessing = false; // reset flag
    // }

    //NEW - API BASED

    this.authService.signin(normalizedIdentifier, this.password)
      .subscribe(result => {

        this.isProcessing = false;

        if (!result) return;

        if (result.success) {
          this.showNotification(result.message, 'success');

          setTimeout(() => {
            this.router.navigate(['/board']);
          }, 1000);

        } else {
          // 👈 IMPORTANT FIX
          this.showNotification(result.message, 'info');
        }
      });

  }
}