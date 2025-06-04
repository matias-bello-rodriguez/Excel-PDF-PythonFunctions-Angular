import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorService } from './error.service';
import { CacheService } from './cache.service';
import { Producto } from '../interfaces/entities';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  public readonly TABLE_NAME = 'producto';
  private readonly CACHE_KEY = 'productos_cache';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService,
    public cacheService: CacheService
  ) {}

  // Método nuevo que usa caché y manejo mejorado de errores
  async getProductosByCubicacionId(cubicacionId: string, forceRefresh: boolean = false): Promise<Producto[]> {
    try {
      console.log(`ProductoService: Obteniendo productos para cubicación ID ${cubicacionId}, forceRefresh: ${forceRefresh}`);
      
      // Clave de caché específica para esta cubicación
      const cacheKey = `productos_cubicacion_${cubicacionId}`;
      
      // Si no forzamos refresco, intentar obtener de caché
      if (!forceRefresh) {
        const cachedData = this.cacheService.getCache<Producto>(cacheKey);
        if (cachedData) {
          console.log(`ProductoService: Devolviendo ${cachedData.length} productos desde caché`);
          return cachedData;
        }
      }
      
      // Si llegamos aquí, necesitamos cargar datos frescos
      console.log('Cargando productos desde BD');
      
      try {
        const results = await this.supabase.customQuery<Producto>(
          this.TABLE_NAME,
          (query) => query
            .select(`
              *,
              Cubicacion:cubicacion_id (
                nombre,
                codigo
              )
            `)
            .eq('cubicacion_id', cubicacionId)
            .order('codigo', { ascending: true })
        );
        
        // Guardar en caché
        this.cacheService.setCache(cacheKey, results);
        console.log(`ProductoService: Se encontraron ${results.length} productos y se guardaron en caché`);
        
        return results;
      } catch (error: any) {
        console.error('Error de BD al obtener productos:', error);
        
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
          const retryResults = await this.supabase.customQuery<Producto>(
            this.TABLE_NAME,
            (query) => query
              .select(`
                *,
                Cubicacion:cubicacion_id (
                  nombre,
                  codigo
                )
              `)
              .eq('cubicacion_id', cubicacionId)
              .order('codigo', { ascending: true })
          );
          
          // Guardar en caché
          this.cacheService.setCache(cacheKey, retryResults);
          console.log(`ProductoService (retry): Se encontraron ${retryResults.length} productos y se guardaron en caché`);
          
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

  // También vamos a invalidar la caché de productos cuando se cree, actualice o elimine un producto
  async create(producto: Partial<Producto>): Promise<Producto | null> {
    try {
      // Validar que producto tenga cubicacion_id, ya que es NOT NULL en la base de datos
      if (!producto.cubicacion_id) {
        throw new Error('No se puede crear un producto sin especificar una cubicación');
      }
      
      const result = await this.supabase.create<Producto>(this.TABLE_NAME, producto);
      // Invalidar caché después de crear
      if (producto.cubicacion_id) {
        this.cacheService.invalidateCache(`productos_cubicacion_${producto.cubicacion_id}`);
      }
      this.cacheService.invalidateCache(this.CACHE_KEY);
      return result;
    } catch (error) {
      this.errorService.handle(error, 'Creando producto');
      return null;
    }
  }

  async update(id: string, producto: Partial<Producto>): Promise<Producto | null> {
    try {
      // Primero obtenemos el producto original para conocer su cubicación_id
      const original = await this.getById(id);
      
      const result = await this.supabase.update<Producto>(this.TABLE_NAME, id, producto);
      
      // Invalidar caché después de actualizar
      if (original && original.cubicacion_id) {
        this.cacheService.invalidateCache(`productos_cubicacion_${original.cubicacion_id}`);
      }
      if (producto.cubicacion_id && producto.cubicacion_id !== original?.cubicacion_id) {
        this.cacheService.invalidateCache(`productos_cubicacion_${producto.cubicacion_id}`);
      }
      this.cacheService.invalidateCache(this.CACHE_KEY);
      
      return result;
    } catch (error) {
      this.errorService.handle(error, 'Actualizando producto');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Primero obtenemos el producto para conocer su cubicación_id
      const producto = await this.getById(id);
      
      await this.supabase.delete(this.TABLE_NAME, id);
      
      // Invalidar caché después de eliminar
      if (producto && producto.cubicacion_id) {
        this.cacheService.invalidateCache(`productos_cubicacion_${producto.cubicacion_id}`);
      }
      this.cacheService.invalidateCache(this.CACHE_KEY);
      
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando producto');
      return false;
    }
  }

  async getAll(): Promise<Producto[]> {
    try {
      // Intentar obtener de caché
      const cachedData = this.cacheService.getCache<Producto>(this.CACHE_KEY);
      if (cachedData) return cachedData;
      
      // Si no hay caché, obtener de la base de datos
      const results = await this.supabase.getAll<Producto>(this.TABLE_NAME);
      
      // Guardar en caché
      this.cacheService.setCache(this.CACHE_KEY, results);
      
      return results;
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los productos');
      return [];
    }
  }

  async getById(id: string): Promise<Producto | null> {
    try {
      return await this.supabase.getById<Producto>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo producto por ID');
      return null;
    }
  }

  // Este método ya existe, así que lo dejamos como está
  async getByCubicacion(cubicacionId: string): Promise<Producto[]> {
    try {
      return await this.supabase.customQuery<Producto>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('cubicacion_id', cubicacionId)
          .order('codigo', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo productos por cubicación');
      return [];
    }
  }

  // Dejamos el resto de los métodos sin cambios...
  async getByCategoria(categoria: string): Promise<Producto[]> {
    try {
      return await this.supabase.customQuery<Producto>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('categoria', categoria)
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo productos por categoría');
      return [];
    }
  }

  async getByTipo(tipoProducto: string): Promise<Producto[]> {
    try {
      return await this.supabase.customQuery<Producto>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('tipo_producto', tipoProducto)
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo productos por tipo');
      return [];
    }
  }

  async search(term: string): Promise<Producto[]> {
    try {
      return await this.supabase.customQuery<Producto>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%`)
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Buscando productos');
      return [];
    }
  }

  async calcularSuperficies(id: string): Promise<boolean> {
    try {
      const producto = await this.getById(id);
      if (!producto) return false;

      // Calcular superficie (m²) si hay dimensiones
      if (producto.ancho_m && producto.alto_m) {
        const superficie = producto.ancho_m * producto.alto_m;
        const superficieTotal = superficie * (producto.cantidad_por_unidad || 1);

        await this.update(id, {
          superficie: superficie,
          superficie_total: superficieTotal
        });
      }
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Calculando superficies de producto');
      return false;
    }
  }

  /**
   * Sube una imagen de producto y actualiza el producto con la URL de la imagen
   */
  async uploadProductImage(productoId: string, file: File): Promise<boolean> {
    try {
      // Primero verificar si el producto existe
      const producto = await this.getById(productoId);
      if (!producto) {
        console.error('No se encontró el producto para subir la imagen');
        return false;
      }
      
      // Carpeta específica para este producto
      const path = `productos/${productoId}`;
      
      // Intentar subir el archivo con reintentos incorporados
      const imageUrl = await this.supabase.uploadFile('imagenes', path, file);
      
      if (!imageUrl) {
        console.error('No se pudo obtener la URL de la imagen subida');
        return false;
      }
      
      // Actualizar el producto con la URL de la imagen
      const updated = await this.update(productoId, {
        diseno_1: imageUrl
      });
      
      return !!updated;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      this.errorService.handle(error, 'Subiendo imagen de producto');
      return false;
    }
  }

  // Añadir método para obtener la imagen desde localStorage si existe
  getProductImageSrc(producto: Producto): string {
    if (!producto || !producto.diseno_1) return '';
    
    // Intentar recuperar del localStorage
    const tempImage = localStorage.getItem(`temp_image_${producto.id}`);
    if (tempImage) {
      return this.formatImageUrl(tempImage);
    }
    
    // Si no hay imagen temporal, devolver la URL normal
    return this.formatImageUrl(producto.diseno_1);
  }

  /**
   * Verifica y formatea correctamente las URLs de imágenes
   */
  private formatImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return '';
    
    // Si ya es una URL completa, devolverla directamente
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    // Si es una cadena base64 sin el prefijo adecuado, añadirlo
    if (imageUrl.startsWith('iVBOR') || imageUrl.includes('base64')) {
      if (!imageUrl.startsWith('data:')) {
        return `data:image/png;base64,${imageUrl}`;
      }
    }
    
    return imageUrl;
  }

  /**
   * Importa productos desde un archivo Excel con mapeo automático
   */
  async importProductosFromExcel(
    cubicacionId: string, 
    productos: Partial<Producto>[]
  ): Promise<{ success: number; errors: string[] }> {
    const results = { success: 0, errors: [] as string[] };
    
    try {
      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        
        // Asegurar que tenga cubicacion_id
        producto.cubicacion_id = cubicacionId;
        
        // Generar código único si no existe
        if (!producto.codigo) {
          producto.codigo = `PROD-${Date.now()}-${i}`;
        }
        
        // Calcular superficies si hay dimensiones
        if (producto.ancho_m && producto.alto_m) {
          const ancho = Number(producto.ancho_m);
          const alto = Number(producto.alto_m);
          const cantidad = Number(producto.cantidad_por_unidad) || 1;
          
          if (!isNaN(ancho) && !isNaN(alto)) {
            producto.superficie = ancho * alto;
            producto.superficie_total = producto.superficie * cantidad;
          }
        }
        
        // Calcular precio total si hay precio base y superficie
        if (producto.precio_pieza_base_usd && producto.superficie) {
          const precioBase = Number(producto.precio_pieza_base_usd);
          const superficie = Number(producto.superficie);
          
          if (!isNaN(precioBase) && !isNaN(superficie)) {
            producto.precio_total_pieza_usd = precioBase * superficie;
          }
        }
        
        try {
          const created = await this.create(producto);
          if (created) {
            results.success++;
          } else {
            results.errors.push(`Fila ${i + 1}: No se pudo crear el producto`);
          }
        } catch (error: any) {
          results.errors.push(`Fila ${i + 1}: ${error.message || 'Error desconocido'}`);
        }
      }
      
      // Invalidar caché después de la importación masiva
      this.cacheService.invalidateCache(`productos_cubicacion_${cubicacionId}`);
      this.cacheService.invalidateCache(this.CACHE_KEY);
      
      return results;
    } catch (error) {
      this.errorService.handle(error, 'Importando productos desde Excel');
      results.errors.push('Error general en la importación');
      return results;
    }
  }
}
