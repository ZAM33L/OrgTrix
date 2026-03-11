import { Component, HostListener, OnInit, ChangeDetectorRef ,OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { AuthService } from '../../auth/services/auth.service';
import { BoardService } from '../../services/board.service';

import { User } from '../../models/user.model';

import { FormsModule } from '@angular/forms';

import { PopupService } from '../../services/popup.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit,OnDestroy {

  currentUser: User | null = null;
  popupSub!: Subscription; 

  // =============================
  // POPUPS & MODALS
  // =============================

  showProfilePopup = false;
  showEditProfileModal = false;
  showDeleteProfileConfirm = false;
  showPasswordConfirm = false;

  // =============================
  // PROFILE FIELDS
  // =============================

  name = '';
  email = '';
  officeId = '';
  password = '';
  confirmPassword = '';

  attemptedProfileSubmit = false;
  isProcessing = false;

  // =============================
  // DELETE PROFILE STATE
  // =============================

  deletePassword = '';
  attemptedDeleteProfile = false;

  constructor(
    private authService: AuthService,
    private boardService: BoardService,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private popupService: PopupService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.popupSub = this.popupService.closeAllPopups$.subscribe(() => {
      this.showProfilePopup = false;
    });
  }

  ngOnDestroy() {
    if (this.popupSub) this.popupSub.unsubscribe();
  }

  // =============================
  // HEADER NAVIGATION
  // =============================

  goBack() {
    this.location.back();
  }

  showBackButton(): boolean {
    return this.router.url !== '/board';
  }



  // =============================
  // PROFILE POPUP
  // =============================

  toggleProfilePopup(event: MouseEvent) {
    event.stopPropagation();
    // Close all other popups globally
    this.popupService.closeAllPopups();
    this.showProfilePopup = !this.showProfilePopup;
  }

  closeProfilePopup() {
    this.showProfilePopup = false;
  }

  @HostListener('document:click')
  closePopupOnOutsideClick() {
    this.showProfilePopup = false;
  }

  // =============================
  // OPEN EDIT PROFILE
  // =============================

  goToEditProfile() {

    this.closeProfilePopup();

    const user = this.authService.getCurrentUser();

    if (!user) {
      console.log('No user found');
      return;
    }

    this.name = user.name;
    this.email = user.email;
    this.officeId = user.officeId;

    this.password = '';
    this.confirmPassword = '';

    this.showEditProfileModal = true;
  }

  closeEditProfile() {
    this.showEditProfileModal = false;
    this.attemptedProfileSubmit = false;
  }

  // =============================
  // VALIDATIONS
  // =============================

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

  // =============================
  // UPDATE PROFILE
  // =============================

  updateProfile() {

    this.attemptedProfileSubmit = true;

    this.name = this.name.trim();
    this.email = this.email.trim();
    this.officeId = this.officeId.trim().toUpperCase();

    if (!this.name || !this.email || !this.officeId) return;
    if (!this.isValidEmail()) return;
    if (this.password && !this.isValidPassword()) return;
    if (this.password && !this.passwordsMatch()) return;
    if (!this.isValidOfficeId()) return;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      alert('User not found. Please login again.');
      return;
    }

    if (this.password && this.password === currentUser.password) {
      alert('New password cannot be same as current password');
      return;
    }

    if (
      this.password &&
      currentUser.passwordHistory &&
      currentUser.passwordHistory.includes(this.password)
    ) {
      alert('You cannot reuse your previous password');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: this.name,
      email: this.email,
      officeId: this.officeId,
      password: this.password ? this.password : currentUser.password,
      passwordHistory: this.password
        ? [currentUser.password, ...(currentUser.passwordHistory || [])]
        : currentUser.passwordHistory
    };

    this.isProcessing = true;

    this.authService.updateProfile(updatedUser).subscribe({

      next: (result) => {

        this.isProcessing = false;

        if (result?.success) {

          this.currentUser = this.authService.getCurrentUser();

          // alert('Profile updated successfully');

          this.closeEditProfile();

          this.cdr.detectChanges();

        } else {
          alert(result?.message || 'Update failed');
        }

      },

      error: () => {

        this.isProcessing = false;
        alert('Something went wrong');

      }

    });

  }

  // =============================
  // DELETE PROFILE
  // =============================

  openDeleteProfileConfirm() {
    this.closeProfilePopup();
    this.showDeleteProfileConfirm = true;
  }

  closeDeleteProfileConfirm() {
    this.showDeleteProfileConfirm = false;
  }

  proceedToPasswordConfirm() {

    this.showDeleteProfileConfirm = false;

    this.showPasswordConfirm = true;

    this.deletePassword = '';
    this.attemptedDeleteProfile = false;
  }

  closePasswordConfirm() {

    this.showPasswordConfirm = false;

    this.deletePassword = '';
    this.attemptedDeleteProfile = false;
  }

  // =============================
  // CONFIRM DELETE
  // =============================

  confirmDeleteWithPassword() {

    this.attemptedDeleteProfile = true;

    if (!this.deletePassword) return;

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      alert('User not found. Please login again.');
      return;
    }

    if (this.deletePassword !== currentUser.password) {
      alert('Incorrect password. Deletion cancelled.');
      return;
    }

    this.boardService.deleteBoardsByUser(currentUser.id).subscribe({

      next: () => {

        this.authService.deleteProfile(currentUser.id).subscribe({

          next: (result) => {

            if (result.success) {

              this.showPasswordConfirm = false;

              // alert('Your profile and all boards have been deleted.');

              this.router.navigate(['/signin']);

            }

          },

          error: () => {
            alert('Failed to delete profile');
          }

        });

      },

      error: () => {
        alert('Failed to delete user boards');
      }

    });

  }

}