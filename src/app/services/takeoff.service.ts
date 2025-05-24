import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

// Definimos la interfaz para el modelo de cubicación
export interface Takeoff {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha: string;
  estado: 'activo' | 'inactivo';
  monto: string;
}

@Injectable({
  providedIn: 'root'
})
export class TakeoffService {
  // Datos de ejemplo para simular la base de datos
  private takeoffs: Takeoff[] = [
    {
      id: 'CUB-2023-001',
      nombre: 'Torre Central',
      descripcion: 'Cubicación estructura principal',
      fecha: '2023-05-15',
      estado: 'activo',
      monto: '$48.370.000'
    },
    {
      id: 'CUB-2023-002',
      nombre: 'Edificio Norte',
      descripcion: 'Cubicación terminaciones',
      fecha: '2023-05-22',
      estado: 'activo',
      monto: '$73.290.500'
    },
    {
      id: 'CUB-2023-003',
      nombre: 'Bodega Industrial',
      descripcion: 'Cubicación prefabricados',
      fecha: '2023-05-30',
      estado: 'inactivo',
      monto: '$88.560.750'
    }
  ];

  constructor() { }

  // Obtener todas las cubicaciones
  getTakeoffs(): Observable<Takeoff[]> {
    return of([...this.takeoffs]).pipe(delay(300)); // Simulamos retraso de red
  }

  // Obtener una cubicación por ID
  getTakeoff(id: string): Observable<Takeoff> {
    const takeoff = this.takeoffs.find(t => t.id === id);
    if (!takeoff) {
      return throwError(() => new Error(`Cubicación con ID ${id} no encontrada`));
    }
    return of(takeoff).pipe(delay(200));
  }

  // Crear una nueva cubicación
  createTakeoff(takeoff: Omit<Takeoff, 'id'>): Observable<Takeoff> {
    // Generar un ID único
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const sequential = String(this.takeoffs.length + 1).padStart(3, '0');
    const id = `CUB-${year}-${sequential}`;
    
    const newTakeoff: Takeoff = {
      ...takeoff,
      id
    };
    
    // En una aplicación real, aquí harías una petición HTTP al backend
    this.takeoffs.push(newTakeoff);
    return of(newTakeoff).pipe(delay(500));
  }

  // Actualizar una cubicación existente
  updateTakeoff(id: string, takeoff: Partial<Takeoff>): Observable<Takeoff> {
    const index = this.takeoffs.findIndex(t => t.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Cubicación con ID ${id} no encontrada`));
    }
    
    const updatedTakeoff = {
      ...this.takeoffs[index],
      ...takeoff
    };
    
    this.takeoffs[index] = updatedTakeoff;
    return of(updatedTakeoff).pipe(delay(500));
  }

  // Eliminar una cubicación
  deleteTakeoff(id: string): Observable<boolean> {
    const index = this.takeoffs.findIndex(t => t.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Cubicación con ID ${id} no encontrada`));
    }
    
    this.takeoffs.splice(index, 1);
    return of(true).pipe(delay(500));
  }
}
