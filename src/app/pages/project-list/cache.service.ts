import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private caches: { [key: string]: any[] } = {};
  private cacheTimestamps: { [key: string]: number } = {};
  private cacheLifetime: number = 30 * 1000; // 30 segundos (corto para pruebas)
  
  // Subjects para notificar cambios
  private refreshSubjects: { [key: string]: BehaviorSubject<boolean> } = {};
  
  constructor() {
    // Inicializar subjects para cada entidad
    ['cubicaciones', 'proyectos', 'clientes'].forEach(entity => {
      this.refreshSubjects[entity] = new BehaviorSubject<boolean>(false);
    });
  }
  
  // Obtener datos de caché o null si no existe o expiró
  getCache<T>(key: string): T[] | null {
    const now = Date.now();
    if (this.caches[key] && (now - this.cacheTimestamps[key]) < this.cacheLifetime) {
      console.log(`Devolviendo ${key} desde caché`);
      return this.caches[key] as T[];
    }
    return null;
  }
  
  // Guardar datos en caché
  setCache<T>(key: string, data: T[]): void {
    console.log(`Guardando ${key} en caché`);
    this.caches[key] = [...data];
    this.cacheTimestamps[key] = Date.now();
  }
  
  // Invalidar caché
  invalidateCache(key: string): void {
    console.log(`Invalidando caché de ${key}`);
    delete this.caches[key];
    delete this.cacheTimestamps[key];
    // Notificar a los oyentes que deben refrescar
    if (this.refreshSubjects[key]) {
      this.refreshSubjects[key].next(true);
    }
  }
  
  // Invalidar todas las cachés
  invalidateAllCaches(): void {
    console.log('Invalidando todas las cachés');
    Object.keys(this.caches).forEach(key => {
      this.invalidateCache(key);
    });
  }
  
  // Obtener observable para suscribirse a eventos de refresco
  getRefreshObservable(key: string) {
    if (!this.refreshSubjects[key]) {
      this.refreshSubjects[key] = new BehaviorSubject<boolean>(false);
    }
    return this.refreshSubjects[key].asObservable();
  }
  
  // Notificar que se debe refrescar una entidad
  notifyRefresh(key: string): void {
    if (this.refreshSubjects[key]) {
      this.refreshSubjects[key].next(true);
    }
  }
}