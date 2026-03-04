import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/services/auth.service';
import { Column } from '../models/column.model';
import { Board } from '../models/board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  private apiUrl = 'http://localhost:3000/boards';

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  // ================================
  // GET BOARD FOR CURRENT USER
  // ================================
  getBoard(): Observable<Board[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    return this.http.get<Board[]>(
      `${this.apiUrl}?userId=${currentUser.id}`
    );
  }

  // ================================
  // CREATE BOARD
  // ================================
  createBoard(columns: Column[]): Observable<Board> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const newBoard = {
      userId: currentUser.id,
      columns: columns
    };

    return this.http.post<Board>(this.apiUrl, newBoard);
  }

  // ================================
  // UPDATE BOARD
  // ================================
  updateBoard(boardId: string, columns: Column[]): Observable<Board> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('No user found');

    const updatedBoard: Board = {
      id: boardId,
      userId: currentUser.id,
      columns: columns
    };

    return this.http.put<Board>(
      `${this.apiUrl}/${boardId}`,
      updatedBoard
    );
  }

  // ================================
  // DELETE SINGLE BOARD
  // ================================
  deleteBoard(boardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${boardId}`);
  }

  // ================================
  // CASCADE DELETE BOARDS BY USER
  // ================================
  deleteBoardsByUser(userId: string): Observable<any> {
    return this.http.get<Board[]>(
      `${this.apiUrl}?userId=${userId}`
    ).pipe(
      switchMap(boards => {

        if (boards.length === 0) {
          return of([]);
        }

        const deleteRequests = boards.map(board =>
          this.http.delete(`${this.apiUrl}/${board.id}`)
        );

        return forkJoin(deleteRequests);
      })
    );
  }
}