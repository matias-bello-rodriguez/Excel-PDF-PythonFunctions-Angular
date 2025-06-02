import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UsuarioService } from './usuario.service';
import { Usuario } from '../interfaces/entities';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser: Observable<Usuario | null> = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.checkInitialAuthState());

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {
    this.loadUserFromStorage();
  }

  private checkInitialAuthState(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  private async loadUserFromStorage() {
    if (this.checkInitialAuthState()) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const user = await this.usuarioService.getById(userId);
          if (user) {
            this.currentUserSubject.next(user);
          } else {
            this.logout();
          }
        } catch (error) {
          console.error('Error cargando usuario:', error);
          this.logout();
        }
      }
    }
  }

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get isAuthenticatedValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  setAuthenticatedUser(user: Usuario): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    // Guardar datos en localStorage
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userId', user.id || '');
    localStorage.setItem('userName', user.nombre || '');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userRole', user.rol || '');
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Limpiar localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Redirigir a la página de login
    this.router.navigate(['/login']);
  }

  hasRole(role: string | string[]): boolean {
    const user = this.currentUserValue;
    if (!user || !user.rol) return false;

    if (Array.isArray(role)) {
      return role.includes(user.rol);
    }
    
    return user.rol === role;
  }
}
