import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class HeaderComponent {
  showUserMenu = false;

  constructor(private router: Router) {}

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    // Limpiar datos de autenticación
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    // Redirigir a login
    this.router.navigate(['/login']);
    this.showUserMenu = false;
  }

  getUserEmail(): string {
    return localStorage.getItem('userEmail') || 'usuario@ejemplo.com';
  }
}
