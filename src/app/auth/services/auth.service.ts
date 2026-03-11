import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // private usersKey = 'orgtrix_users'; //old
  private apiUrl = 'http://localhost:3000/users'; //new
  private currentUserKey = 'orgtrix_current_user';

  constructor(private router: Router, private http: HttpClient) { }

  //old - localstorage

  // //get all users from localStorage
  // private getUsers(): User[] {
  //   const users = JSON.parse(localStorage.getItem(this.usersKey) || '[]')
  //   console.log('[AuthService] Loaded Users:', users);
  //   return users;
  // }

  // //save users to localstorage
  // private saveUsers(users: User[]) {
  //   console.log('[AuthService] Saving Users:', users);
  //   localStorage.setItem(this.usersKey, JSON.stringify(users))
  // }

  // //signup

  // signup(
  //   name: string,
  //   email: string,
  //   password: string,
  //   officeId: string
  // ): { success: boolean; message: string } {

  //   console.log('[AuthService] Signup Attempt:', email);

  //   const users = this.getUsers();

  //   // Check if email already exists
  //   const existingUser = users.find(u => u.email === email);
  //   if (existingUser) {
  //     console.warn('[AuthService] Signup Failed - Email exists');
  //     return { success: false, message: 'Email already exists!' };
  //   }

  //   // Check if Office ID already exists
  //   const existingOffice = users.find(u => u.officeId === officeId);
  //   if (existingOffice) {
  //     console.warn('[AuthService] Signup Failed - Office ID exists');
  //     return { success: false, message: 'Office ID already exists!' };
  //   }

  //   // Create new user
  //   const newUser: User = {
  //     id: crypto.randomUUID(),
  //     name,
  //     email,
  //     password,
  //     officeId
  //   };

  //   users.push(newUser);
  //   this.saveUsers(users);

  //   console.log('[AuthService] Signup Successful:', newUser);

  //   return { success: true, message: 'Signup successful!' };
  // }

  //OLD - LOCALSTORAGE

  // //signin

  // signin(
  //   identifier: string,
  //   password: string
  // ): { success: boolean; message: string } {

  //   console.log('[AuthService] Signin Attempt:', identifier);

  //   const users = this.getUsers();

  //   // Normalize identifier (trim spaces)
  //   identifier = identifier.trim();

  //   const user = users.find(u =>
  //     (u.email === identifier || u.officeId === identifier) &&
  //     u.password === password
  //   );

  //   if (!user) {
  //     console.warn('[AuthService] Signin Failed - Invalid credentials');
  //     return { success: false, message: 'Invalid Office ID / Email or Password!' };
  //   }

  //   localStorage.setItem(this.currentUserKey, JSON.stringify(user));

  //   console.log('[AuthService] Signin Successful:', user);

  //   return { success: true, message: 'Login successful!' };
  // }

  //NEW - API BASED

  signup(
    name: string,
    email: string,
    password: string,
    officeId: string
  ): Observable<{ success: boolean; message: string }> {

    return this.http.get<User[]>(this.apiUrl).pipe(

      switchMap(users => {

        const emailExists = users.find(u => u.email === email);
        if (emailExists) {
          return of({ success: false, message: 'Email already exists!' });
        }

        const officeExists = users.find(u => u.officeId === officeId);
        if (officeExists) {
          return of({ success: false, message: 'Office ID already exists!' });
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
          password,
          officeId
        };

        return this.http.post<User>(this.apiUrl, newUser).pipe(
          map(() => ({
            success: true,
            message: 'Signup successful!'
          }))
        );
      }),

      catchError(() =>
        of({ success: false, message: 'Server error. Please try again.' })
      )
    );
  }

  signin(
    identifier: string,
    password: string,
  ): Observable<{ success: boolean; message: string }> {

    return this.http.get<User[]>(this.apiUrl).pipe(

      map(users => {

        const user = users.find(u =>
          (u.email === identifier || u.officeId === identifier) &&
          u.password === password
        );

        if (!user) {
          return {
            success: false,
            message: 'Invalid Office ID / Email or Password!'
          };
        }

        // JSON Server doesn't handle sessions
        localStorage.setItem(this.currentUserKey, JSON.stringify(user));

        return {
          success: true,
          message: 'Login successful!'
        };
      }),

      catchError(() =>
        of({
          success: false,
          message: 'Server error. Please try again.'
        })
      )

    );
  }

  //NO CHANGES IN SESSION MANAGEMENT
  signout() {
    console.log('[AuthService] User Logged Out');
    localStorage.removeItem(this.currentUserKey);
    this.router.navigate(['/signin']);
  }

  //check login
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.currentUserKey);
  }

  //get current user
  private _cachedUser: User | null = null;

getCurrentUser(): User | null {
  const user = JSON.parse(localStorage.getItem(this.currentUserKey) || 'null');

  if (JSON.stringify(user) !== JSON.stringify(this._cachedUser)) {
    console.log('[AuthService] Current User:', user);
    this._cachedUser = user;
  }

  return user;
}

  //update profile
  updateProfile(updatedUser: User) {
    return this.http.get<User[]>(this.apiUrl).pipe(
      switchMap(users => {

        if (users.find(u => u.email === updatedUser.email && u.id !== updatedUser.id)) {
          return of({ success: false, message: 'Email already registered' });
        }

        if (users.find(u => u.officeId === updatedUser.officeId && u.id !== updatedUser.id)) {
          return of({ success: false, message: 'Office ID already registered' });
        }

        return this.http.put<User>(
          `${this.apiUrl}/${updatedUser.id}`,
          updatedUser
        ).pipe(
          map(() => {
            localStorage.setItem(this.currentUserKey, JSON.stringify(updatedUser));
            return { success: true, message: 'Profile updated successfully' };
          })
        );
      })
    );
  }
  
  //delete profile
  deleteProfile(userId: string) {
    return this.http.delete(`${this.apiUrl}/${userId}`).pipe(
      map(() => {
        localStorage.removeItem(this.currentUserKey);
        return { success: true, message: 'Profile deleted successfully' };
      })
    );
  }

  verifyGoogleToken(token: string): Observable<{ success: boolean; message: string }> {
  return this.http.post<any>('http://localhost:3000/auth/google', { token }).pipe(
    map(res => {
      if (res?.user && res?.token) {
        // save logged-in user locally
        localStorage.setItem(this.currentUserKey, JSON.stringify(res.user));
        return { success: true, message: 'Login successful!' };
      }
      return { success: false, message: 'Login failed!' };
    }),
    catchError(() => of({ success: false, message: 'Server error. Try again.' }))
  );
}
}
