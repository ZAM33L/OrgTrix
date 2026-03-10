import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../../models/user.model';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  currentUser: User | null = null;

  showProfilePopup = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }


  goBack() {
    this.location.back();
  }
  showBackButton(): boolean {
    return this.router.url !== '/board';
  }

  toggleProfilePopup(event: MouseEvent) {
    event.stopPropagation();
    this.showProfilePopup = !this.showProfilePopup;
  }

  closeProfilePopup() {
    this.showProfilePopup = false;
  }

  goToEditProfile() {
    this.closeProfilePopup();
    this.router.navigate(['/profile/edit']);
  }

  openDeleteProfileConfirm() {
    this.closeProfilePopup();
    this.router.navigate(['/profile/delete']);
  }

  @HostListener('document:click')
  closePopupOnOutsideClick() {
    this.showProfilePopup = false;
  }

}