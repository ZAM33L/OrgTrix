import { Injectable } from '@angular/core';
import { Column } from '../models/column.model';
import { AuthService } from '../auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  //LOCALSTORAGE VERSION

  // private boardsKey = 'orgtrix_boards';

  // constructor(private authService: AuthService) {}

  // // Get all boards object from localStorage
  // private getAllBoards(): { [userId: string]: Column[] } {
  //   return JSON.parse(localStorage.getItem(this.boardsKey) || '{}');
  // }

  // // Save all boards back
  // private saveAllBoards(boards: { [userId: string]: Column[] }) {
  //   localStorage.setItem(this.boardsKey, JSON.stringify(boards));
  // }

  // // Get current user's board
  // getBoard(): Column[] {
  //   const currentUser = this.authService.getCurrentUser();
  //   if (!currentUser) return [];

  //   const boards = this.getAllBoards();

  //   return boards[currentUser.id] || [];
  // }

  // // Save current user's board
  // saveBoard(columns: Column[]) {
  //   const currentUser = this.authService.getCurrentUser();
  //   if (!currentUser) return;

  //   const boards = this.getAllBoards();
  //   boards[currentUser.id] = columns;

  //   this.saveAllBoards(boards);
  // }

  // // Clear board for current user (optional future use)
  // clearBoard() {
  //   const currentUser = this.authService.getCurrentUser();
  //   if (!currentUser) return;

  //   const boards = this.getAllBoards();
  //   delete boards[currentUser.id];

  //   this.saveAllBoards(boards);
  // }

  private apiUrl = 'http://localhost:3000/boards';

  constructor(
    private authService:AuthService,
    private http:HttpClient
  ){};

  //get board of current user
  getBoard(): Observable<Board[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    return this.http.get<any[]>(
      `${this.apiUrl}?userId=${currentUser.id}`
    );
  }
  // Create board 
  createBoard(columns: Column[]): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    return this.http.post(this.apiUrl, {
      userId: currentUser.id,
      columns: columns
    });
  }

  // Update board
  updateBoard(boardId: string, columns: Column[]): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    return this.http.put(`${this.apiUrl}/${boardId}`, {
      id: boardId,
      userId: currentUser.id,
      columns: columns
    });
  }

  // Delete board (reset)
  deleteBoard(boardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${boardId}`);
  }
}