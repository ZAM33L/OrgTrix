import { Injectable } from '@angular/core';
import { Column } from '../models/column.model';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  private boardsKey = 'orgtrix_boards';

  constructor(private authService: AuthService) {}

  // Get all boards object from localStorage
  private getAllBoards(): { [userId: string]: Column[] } {
    return JSON.parse(localStorage.getItem(this.boardsKey) || '{}');
  }

  // Save all boards back
  private saveAllBoards(boards: { [userId: string]: Column[] }) {
    localStorage.setItem(this.boardsKey, JSON.stringify(boards));
  }

  // Get current user's board
  getBoard(): Column[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    const boards = this.getAllBoards();

    return boards[currentUser.id] || [];
  }

  // Save current user's board
  saveBoard(columns: Column[]) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const boards = this.getAllBoards();
    boards[currentUser.id] = columns;

    this.saveAllBoards(boards);
  }

  // Clear board for current user (optional future use)
  clearBoard() {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const boards = this.getAllBoards();
    delete boards[currentUser.id];

    this.saveAllBoards(boards);
  }
}