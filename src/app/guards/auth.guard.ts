import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAuth(route);
  }
  
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAuth(childRoute);
  }
  
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): boolean {
    return this.checkAuth();
  }
  
  private checkAuth(route?: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticatedValue) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // Verificar roles si están definidos en la ruta
    if (route && route.data && route.data['roles']) {
      const requiredRoles = route.data['roles'];
      if (!this.authService.hasRole(requiredRoles)) {
        // Redirigir a una página de acceso denegado o al inicio
        this.router.navigate(['/acceso-denegado']);
        return false;
      }
    }
    
    return true;
  }
}
