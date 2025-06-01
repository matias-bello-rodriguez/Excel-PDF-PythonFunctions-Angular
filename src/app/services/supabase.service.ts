import { Injectable } from '@angular/core';
import { 
  AuthError, 
  AuthResponse, 
  User, 
  SupabaseClient,
  PostgrestSingleResponse,
  PostgrestResponse
} from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();  constructor() {
    try {
      console.log('Inicializando cliente Supabase...');
      
      // Comprobar si hay tokens problemáticos previos
      const hasProblematicTokens = localStorage.getItem('app-kinetta-auth') || 
                                   localStorage.getItem('supabase.auth.token');
      
      // Si hay tokens que podrían ser problemáticos, limpiarlos primero
      if (hasProblematicTokens) {
        console.log('Tokens previos encontrados, limpiando antes de inicializar...');
        this.clearLocalStorageTokens();
      }
      
      // Crear un id único para el storage para evitar conflictos
      const uniqueStorageKey = 'app-kinetta-auth-' + Date.now();
      
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.key,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: uniqueStorageKey,
            flowType: 'pkce', // Usar PKCE para mayor seguridad
            storage: {
              getItem: (key) => {
                try {
                  return localStorage.getItem(key);
                } catch (error) {
                  console.error('Error al obtener item:', error);
                  return null;
                }
              },
              setItem: (key, value) => {
                try {
                  localStorage.setItem(key, value);
                } catch (error) {
                  console.error('Error al guardar item:', error);
                }
              },
              removeItem: (key) => {
                try {
                  localStorage.removeItem(key);
                } catch (error) {
                  console.error('Error al eliminar item:', error);
                }
              }
            }
          }
        }
      );

      // Escuchar cambios en la autenticación
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Evento de autenticación:', event);
        if (session?.user) {
          this.userSubject.next(session.user);
        } else {
          this.userSubject.next(null);
        }
      });

      // Verificar si hay una sesión activa
      this.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          this.userSubject.next(session.user);
        }
      }).catch(err => {
        console.error('Error al recuperar la sesión:', err);
        // Intentar limpiar el almacenamiento en caso de error
        this.clearAuthStorage();
      });
    } catch (error) {
      console.error('Error al inicializar Supabase:', error);
      this.clearAuthStorage();
    }
  }
  
  // Método auxiliar para limpiar solo tokens del localStorage
  private clearLocalStorageTokens(): void {
    try {
      localStorage.removeItem('app-kinetta-auth');
      localStorage.removeItem('supabase.auth.token');
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('-auth-token') ||
            key.includes('kinetta') ||
            key.includes('auth')
        )) {
          localStorage.removeItem(key);
          i--;
        }
      }
    } catch (error) {
      console.error('Error al limpiar tokens:', error);
    }
  }
  // Autenticación
  signIn(email: string, password: string): Observable<AuthResponse> {
    console.log('Intentando iniciar sesión para:', email);
    
    // Intentar limpiar almacenamiento primero para evitar problemas de token
    this.clearAuthStorage();
    
    return from(this.supabase.auth.signInWithPassword({ email, password }))
      .pipe(
        tap(response => {
          console.log('Respuesta de inicio de sesión:', response);
          const user = response.data.user;
          if (user) {
            console.log('Usuario autenticado:', user.email);
            this.userSubject.next(user);
          }
        }),
        catchError((error: AuthError) => {
          console.error('Error en inicio de sesión:', error);
          
          // Manejo específico de errores de navegador
          if (error.message && (
              error.message.includes('lock') || 
              error.message.includes('timeout') || 
              error.message.includes('Navigator') ||
              error.message.includes('acquire') ||
              error.message.includes('JWT')
          )) {
            console.log('Error de bloqueo/navegador detectado, limpiando almacenamiento...');
            this.clearAuthStorage();
            
            // Intentar reconectar si es un error de navegador
            if (error.message.includes('Navigator') || error.message.includes('lock')) {
              this.reconnect().then(success => {
                console.log('Reconexión después de error de navegador:', success ? 'exitosa' : 'fallida');
              });
            }
          }
          
          // Si el error es de contraseña incorrecta, no es necesario limpiar
          if (error.message && error.message.includes('Invalid login credentials')) {
            console.log('Credenciales inválidas');
          }
          
          return throwError(() => error);
        })
      );
  }
  signOut(): Observable<any> {
    console.log('Cerrando sesión...');
    return from(this.supabase.auth.signOut())
      .pipe(
        tap(() => {
          console.log('Sesión cerrada exitosamente');
          this.userSubject.next(null);
          this.clearAuthStorage();
        }),
        catchError((error: AuthError) => {
          console.error('Error al cerrar sesión:', error);
          // Incluso si hay error, limpiar el estado local
          this.userSubject.next(null);
          this.clearAuthStorage();
          return throwError(() => error);
        })
      );
  }

  // CRUD Genérico
  async getAll<T = any>(table: string): Promise<T[]> {
    console.log(`Obteniendo datos de tabla: ${table}`);
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*');
      
      if (error) {
        console.error('Error en Supabase getAll:', error);
        throw error;
      }
      console.log(`Datos obtenidos de ${table}:`, data);
      return data || [];
    } catch (err) {
      console.error('Error en getAll de SupabaseService:', err);
      throw err;
    }
  }

  async getById<T>(table: string, id: string | number): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as T;
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  async update<T>(table: string, id: string | number, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  async delete(table: string, id: string | number): Promise<void> {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
  // Consultas personalizadas
  async customQuery<T>(table: string, query: (queryBuilder: any) => any): Promise<T[]> {
    try {
      console.log(`Ejecutando consulta personalizada en tabla: ${table}`);
      const { data, error } = await query(this.supabase.from(table));

      if (error) {
        console.error(`Error en consulta personalizada (tabla ${table}):`, error);
        
        // Si es un error de autenticación o bloqueo, intentar recuperar
        if (
          error.code === 'PGRST301' || 
          error.message?.includes('JWT') || 
          error.message?.includes('lock') || 
          error.message?.includes('Navigator') ||
          error.message?.includes('timeout')
        ) {
          console.log('Error de autenticación o bloqueo detectado, intentando recuperar...');
          
          // Paso 1: Limpiar almacenamiento
          this.clearAuthStorage();
          
          // Paso 2: Esperar un momento
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Paso 3: Intentar renovar la sesión
          try {
            const { data } = await this.supabase.auth.refreshSession();
            if (data.session) {
              console.log('Sesión renovada, reintentando consulta...');
              // Reintentar la consulta
              const retryResult = await query(this.supabase.from(table));
              if (retryResult.error) {
                // Si aún hay error, intentar reconectar
                console.log('Error persistente después de renovar sesión, intentando reconectar...');
                const reconnectSuccess = await this.reconnect();
                
                if (reconnectSuccess) {
                  console.log('Reconexión exitosa, reintentando consulta...');
                  const secondRetryResult = await query(this.supabase.from(table));
                  if (secondRetryResult.error) throw secondRetryResult.error;
                  return secondRetryResult.data as T[];
                }
                
                throw retryResult.error;
              }
              return retryResult.data as T[];
            }
          } catch (refreshError) {
            console.error('Error al renovar sesión:', refreshError);
            // Intentar reconectar como último recurso
            const reconnectSuccess = await this.reconnect();
            
            if (reconnectSuccess) {
              console.log('Reconexión exitosa después de error de renovación, reintentando consulta...');
              const lastRetryResult = await query(this.supabase.from(table));
              if (lastRetryResult.error) throw lastRetryResult.error;
              return lastRetryResult.data as T[];
            }
            
            this.clearAuthStorage();
          }
        }
        
        throw error;
      }
      
      console.log(`Consulta exitosa en tabla ${table}, registros obtenidos:`, data?.length || 0);
      return data as T[];
    } catch (err) {
      console.error(`Error en customQuery (tabla ${table}):`, err);
      throw err;
    }
  }

  // Almacenamiento
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;
    if (!data) throw new Error('Error uploading file');

    return `${environment.supabase.url}/storage/v1/object/public/${bucket}/${data.path}`;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  // Suscripciones en tiempo real
  subscribeToChanges<T>(table: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        callback
      )
      .subscribe();
  }

  // Helpers
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  getClient() {
    return this.supabase;
  }
  
  // Método para limpiar el almacenamiento de autenticación en caso de error
  clearAuthStorage(): void {
    console.log('Limpiando almacenamiento de autenticación...');
    try {
      // Limpiar localStorage
      localStorage.removeItem('app-kinetta-auth');
      localStorage.removeItem('supabase.auth.token');
      
      // Limpiar todas las claves relacionadas con supabase
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('-auth-token') ||
            key.includes('kinetta') ||
            key.includes('auth')
        )) {
          console.log('Eliminando clave:', key);
          localStorage.removeItem(key);
          // Reiniciar el índice para evitar problemas al modificar la colección
          i--;
        }
      }
      
      // Intentar eliminar las cookies relacionadas con supabase
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name && (
            name.includes('supabase') || 
            name.includes('sb-') || 
            name.includes('auth') ||
            name.includes('kinetta')
        )) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Reiniciar estado de usuario
      this.userSubject.next(null);
    } catch (error) {
      console.error('Error al limpiar almacenamiento:', error);
    }
  }

  // Método para intentar reconexión en caso de error
  async reconnect(): Promise<boolean> {
    console.log('Intentando reconexión con Supabase...');
    try {
      // Limpiar almacenamiento primero
      this.clearAuthStorage();
      
      // Esperar un breve momento para asegurar que la limpieza se complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reinicializar el cliente con opciones mejoradas
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.key,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'app-kinetta-auth-' + Date.now(), // Usar un nombre de almacenamiento único
            flowType: 'pkce', // Usar PKCE para mayor seguridad
            storage: {
              getItem: (key) => {
                try {
                  return localStorage.getItem(key);
                } catch (error) {
                  console.error('Error al obtener item:', error);
                  return null;
                }
              },
              setItem: (key, value) => {
                try {
                  localStorage.setItem(key, value);
                } catch (error) {
                  console.error('Error al guardar item:', error);
                }
              },
              removeItem: (key) => {
                try {
                  localStorage.removeItem(key);
                } catch (error) {
                  console.error('Error al eliminar item:', error);
                }
              }
            }
          },
          global: {
            fetch: async (url, options) => {
              try {
                return await fetch(url, options);
              } catch (error) {
                console.error('Error en fetch:', error);
                throw error;
              }
            }
          }
        }
      );
      
      console.log('Cliente Supabase reinicializado');
      
      // Verificar conexión
      const { error } = await this.supabase.auth.getSession();
      if (error) {
        console.error('Error al verificar sesión después de reconectar:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al reconectar:', error);
      return false;
    }
  }

  // Método para renovar la sesión
  async refreshSession(): Promise<boolean> {
    console.log('Intentando renovar sesión...');
    try {
      // Primero comprobar si hay un token válido
      const { data: sessionData } = await this.supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('No hay sesión activa para renovar');
        return false;
      }
      
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error al renovar sesión:', error);
        
        // Si es un error de navegador o token, intentar limpiar el almacenamiento
        if (error.message && (
            error.message.includes('lock') || 
            error.message.includes('Navigator') || 
            error.message.includes('timeout') ||
            error.message.includes('JWT')
        )) {
          console.log('Error de bloqueo o token detectado, limpiando almacenamiento...');
          this.clearAuthStorage();
          
          // Esperar un momento antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Reintentar una vez más después de limpiar
          try {
            const retryResult = await this.supabase.auth.refreshSession();
            if (retryResult.error) {
              console.error('Error persistente al renovar sesión:', retryResult.error);
              return false;
            }
            
            if (retryResult.data.session) {
              console.log('Sesión renovada correctamente en segundo intento');
              this.userSubject.next(retryResult.data.session.user);
              return true;
            }
          } catch (retryError) {
            console.error('Error en segundo intento de renovación:', retryError);
            return false;
          }
        }
        
        return false;
      }
      
      if (data.session) {
        console.log('Sesión renovada correctamente');
        this.userSubject.next(data.session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en refreshSession:', error);
      return false;
    }
  }
}