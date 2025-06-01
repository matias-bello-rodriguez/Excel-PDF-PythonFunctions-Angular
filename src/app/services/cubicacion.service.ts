import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorService } from './error.service';
import { CacheService } from './cache.service';
import { Cubicacion } from '../interfaces/entities';

@Injectable({
  providedIn: 'root'
})
export class CubicacionService {  async getProductosByCubicacionId(cubicacionId: string): Promise<any[]> {
    try {
      console.log(`CubicacionService: Obteniendo productos para cubicación ID ${cubicacionId}`);
      
      try {
        // Obtener los productos asociados a la cubicación
        const results = await this.supabase.customQuery(
          'productos',
          (query) => query
            .select(`
              *,
              Cubicacion:cubicacion_id (
                nombre
              )
            `)
            .eq('cubicacion_id', cubicacionId)
        );
        
        console.log(`CubicacionService: Se encontraron ${results.length} productos`);
        return results;
      } catch (error: any) {
        console.error('Error al obtener productos de cubicación:', error);
        
        // Si hay error de conexión/autenticación, intentar reconectar
        if (error.message && (
            error.message.includes('JWT') || 
            error.message.includes('lock') || 
            error.message.includes('timeout') || 
            error.message.includes('connection')
        )) {
          console.log('Intentando reconectar con Supabase...');
          await this.supabase.reconnect();
          
          // Reintentar después de reconectar
          const retryResults = await this.supabase.customQuery(
            'productos',
            (query) => query
              .select(`
                *,
                Cubicacion:cubicacion_id (
                  nombre
                )
              `)
              .eq('cubicacion_id', cubicacionId)
          );
          
          console.log(`CubicacionService (retry): Se encontraron ${retryResults.length} productos`);
          return retryResults;
        }
        
        // Si llegamos aquí, no pudimos recuperarnos
        throw error;
      }
    } catch (error) {
      this.errorService.handle(error, `Obteniendo productos de cubicación con ID ${cubicacionId}`);
      return [];
    }
  }
  public readonly TABLE_NAME = 'cubicaciones';
  private readonly CACHE_KEY = 'cubicaciones';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService,
    private cacheService: CacheService
  ) {}  async getAll(forceRefresh: boolean = false): Promise<Cubicacion[]> {
    try {
      console.log('GetAll en CubicacionService, forceRefresh:', forceRefresh);
      
      // Si no forzamos refresco, intentar obtener de caché
      if (!forceRefresh) {
        const cachedData = this.cacheService.getCache<Cubicacion>(this.CACHE_KEY);
        if (cachedData) return cachedData;
      }
      
      // Si llegamos aquí, necesitamos cargar datos frescos
      console.log('Cargando cubicaciones desde BD');
      
      try {
        const results = await this.supabase.customQuery<Cubicacion>(this.TABLE_NAME,
          (query) => query.select(`
            *,
            Proyecto:proyecto_id (
              nombre
            )
          `)
        );
        
        // Guardar en caché
        this.cacheService.setCache(this.CACHE_KEY, results);
        
        return results;
      } catch (error: any) {
        console.error('Error de BD al obtener cubicaciones:', error);
        
        // Si hay error de conexión/autenticación, intentar reconectar
        if (error.message && (
            error.message.includes('JWT') || 
            error.message.includes('lock') || 
            error.message.includes('timeout') || 
            error.message.includes('connection')
        )) {
          console.log('Intentando reconectar con Supabase...');
          await this.supabase.reconnect();
          
          // Reintentar después de reconectar
          const retryResults = await this.supabase.customQuery<Cubicacion>(this.TABLE_NAME,
            (query) => query.select(`
              *,
              Proyecto:proyecto_id (
                nombre
              )
            `)
          );
          
          // Guardar en caché
          this.cacheService.setCache(this.CACHE_KEY, retryResults);
          
          return retryResults;
        }
        
        // Si llegamos aquí, no pudimos recuperarnos
        throw error;
      }
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todas las cubicaciones');
      return [];
    }
  }

  async getById(id: string): Promise<Cubicacion | null> {
    try {
      const results = await this.supabase.customQuery<Cubicacion>(this.TABLE_NAME,
        (query) => query.select(`
          *,
          Proyecto:proyecto_id (
            nombre
          )
        `)
        .eq('id', id)
        .single()
      );
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.errorService.handle(error, `Obteniendo cubicación con ID ${id}`);
      return null;
    }
  }

  async create(cubicacion: Partial<Cubicacion>): Promise<Cubicacion | null> {
    try {
      const result = await this.supabase.create<Cubicacion>(this.TABLE_NAME, cubicacion);
      // Invalidar caché después de crear
      this.cacheService.invalidateCache(this.CACHE_KEY);
      return result;
    } catch (error) {
      this.errorService.handle(error);
      return null;
    }
  }

  async update(id: string, cubicacion: Partial<Cubicacion>): Promise<Cubicacion | null> {
    try {
      const result = await this.supabase.update<Cubicacion>(this.TABLE_NAME, id, cubicacion);
      // Invalidar caché después de actualizar
      this.cacheService.invalidateCache(this.CACHE_KEY);
      return result;
    } catch (error) {
      this.errorService.handle(error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      // Invalidar caché después de eliminar
      this.cacheService.invalidateCache(this.CACHE_KEY);
      return true;
    } catch (error) {
      this.errorService.handle(error);
      return false;
    }
  }

  async getByProyectoId(proyectoId: string): Promise<Cubicacion[]> {
    try {
      return await this.supabase.customQuery<Cubicacion>(this.TABLE_NAME,
        (query) => query
          .select('*, cubicacion_detalles(*)')
          .eq('proyecto_id', proyectoId)
      );
    } catch (error) {
      this.errorService.handle(error);
      return [];
    }
  }
}
