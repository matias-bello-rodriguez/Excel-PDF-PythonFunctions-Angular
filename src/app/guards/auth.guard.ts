import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Por ahora, simulamos que no hay usuario autenticado
  // En una implementación real, aquí verificarías el token de autenticación
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
