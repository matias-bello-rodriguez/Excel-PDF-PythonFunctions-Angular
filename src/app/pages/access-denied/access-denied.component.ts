import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="access-denied-container">
      <div class="access-denied-content">
        <i class="fas fa-lock fa-5x"></i>
        <h1>Acceso Denegado</h1>
        <p>Lo sentimos, no tienes permisos para acceder a esta página.</p>
        <p>Tu rol actual es: <strong>{{ userRole }}</strong></p>
        <div class="buttons">
          <a routerLink="/inicio" class="btn-primary">Ir al Inicio</a>
          <button (click)="logout()" class="btn-secondary">Cerrar Sesión</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
    }
    
    .access-denied-content {
      text-align: center;
      max-width: 600px;
      padding: 3rem;
      border-radius: 8px;
      background-color: #fff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    i {
      color: #d32f2f;
      margin-bottom: 1.5rem;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #333;
    }
    
    p {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 1.5rem;
    }
    
    .buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }
    
    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background-color: #1976d2;
      color: white;
      border: none;
      text-decoration: none;
    }
    
    .btn-primary:hover {
      background-color: #1565c0;
      transform: translateY(-2px);
    }
    
    .btn-secondary {
      background-color: transparent;
      color: #d32f2f;
      border: 1px solid #d32f2f;
    }
    
    .btn-secondary:hover {
      background-color: rgba(211, 47, 47, 0.1);
    }
  `]
})
export class AccessDeniedComponent {
  userRole: string = 'No disponible';

  constructor(private authService: AuthService) {
    this.userRole = this.authService.currentUserValue?.rol || 'No disponible';
  }

  logout(): void {
    this.authService.logout();
  }
}
