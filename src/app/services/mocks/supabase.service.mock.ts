import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  data: {
    user: User | null;
  };
  error: any;
}

export class MockSupabaseService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  signIn(email: string, password: string): Observable<AuthResponse> {
    const mockUser = { id: '1', email: email };
    this.userSubject.next(mockUser);
    return of({ data: { user: mockUser }, error: null });
  }

  signOut(): Observable<any> {
    this.userSubject.next(null);
    return of({ error: null });
  }

  getAll<T>(table: string): Promise<T[]> {
    return Promise.resolve([]);
  }

  getById<T>(table: string, id: string | number): Promise<T | null> {
    return Promise.resolve(null);
  }

  create<T>(table: string, data: Partial<T>): Promise<T> {
    return Promise.resolve(data as T);
  }

  update<T>(table: string, id: string | number, data: Partial<T>): Promise<T> {
    return Promise.resolve(data as T);
  }

  delete(table: string, id: string | number): Promise<void> {
    return Promise.resolve();
  }

  uploadFile(bucket: string, path: string, file: File): Promise<string> {
    return Promise.resolve('https://example.com/file.txt');
  }

  deleteFile(bucket: string, path: string): Promise<void> {
    return Promise.resolve();
  }

  subscribeToChanges<T>(table: string, callback: (payload: any) => void) {
    return {
      subscribe: () => {}
    };
  }

  customQuery<T>(table: string, queryBuilder: (query: any) => any): Promise<T[]> {
    console.log(`MockSupabaseService: Ejecutando consulta personalizada en tabla ${table}`);
    
    // Simular datos según la tabla
    if (table === 'productos') {
      console.log('MockSupabaseService: Devolviendo productos de prueba');
      
      // Crear datos de prueba para productos
      const mockProductos = [
        {
          id: '1',
          cubicacion_id: '1',
          codigo: 'P001',
          nombre: 'Ventana Aluminio',
          tipo_producto: 'ventana',
          cantidad: 5,
          precio_unitario: 150000,
          precio_total: 750000,
          superficie_total: 12.5
        },
        {
          id: '2',
          cubicacion_id: '1',
          codigo: 'P002',
          nombre: 'Puerta Principal',
          tipo_producto: 'puerta',
          cantidad: 1,
          precio_unitario: 250000,
          precio_total: 250000,
          superficie_total: 2.1
        },
        {
          id: '3',
          cubicacion_id: '1',
          codigo: 'P003',
          nombre: 'Mampara Baño',
          tipo_producto: 'mampara',
          cantidad: 2,
          precio_unitario: 120000,
          precio_total: 240000,
          superficie_total: 3.8
        }
      ];
      
      return Promise.resolve(mockProductos as unknown as T[]);
    }
    
    // Por defecto, devolver array vacío
    return Promise.resolve([] as T[]);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }
}
