import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  // Event to notify components to close all popups
  private closeAllPopupsSubject = new Subject<void>();
  closeAllPopups$ = this.closeAllPopupsSubject.asObservable();

  // Call this to trigger closing all popups
  closeAllPopups() {
    this.closeAllPopupsSubject.next();
  }
}