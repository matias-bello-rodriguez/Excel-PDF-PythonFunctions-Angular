import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CacheService } from './cache.service';
import { filter } from 'rxjs/operators';
import { CubicacionService } from './cubicacion.service';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private lastNavigation: string | null = null;
  
  constructor(
    private router: Router,
    private cacheService: CacheService
  ) {
    // Escuchar eventos de navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si volvemos a una lista después de editar o crear
      if (this.isListRoute(event.url) && this.isListRoute(this.lastNavigation) === false) {
        console.log(`Navegando de vuelta a ${event.url}, invalidando caché`);
        // Determinar qué caché invalidar
        if (event.url.includes('/cubicaciones')) {
          this.cacheService.invalidateCache('cubicaciones');
        } else if (event.url.includes('/proyectos')) {
          this.cacheService.invalidateCache('proyectos');
        } else if (event.url.includes('/clientes')) {
          this.cacheService.invalidateCache('clientes');
        }
      }
      
      this.lastNavigation = event.url;
    });
  }
  
  private isListRoute(url: string | null): boolean {
    if (!url) return false;
    
    // Rutas principales que son listas
    return url === '/cubicaciones' || 
           url === '/proyectos' || 
           url === '/clientes' ||
           url === '/cubicaciones/' || 
           url === '/proyectos/' || 
           url === '/clientes/';
  }
  
  // Navegar y forzar refresco al volver
  navigateWithRefresh(route: string[]): void {
    // Establecer flag para refresco
    localStorage.setItem('need_refresh_on_return', 'true');
    localStorage.setItem('refresh_entity', route[0]);
    
    this.router.navigate(route);
  }
  
  // Verificar si necesitamos refrescar al cargar una lista
  checkIfRefreshNeeded(entity: string): boolean {
    const needsRefresh = localStorage.getItem('need_refresh_on_return') === 'true';
    const entityToRefresh = localStorage.getItem('refresh_entity');
    
    if (needsRefresh && entityToRefresh === entity) {
      // Limpiar flags
      localStorage.removeItem('need_refresh_on_return');
      localStorage.removeItem('refresh_entity');
      return true;
    }
    
    return false;
  }
}


