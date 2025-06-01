import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Archivo } from '../interfaces/entities';
import { FileType, EntityType } from '../interfaces/types';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  public readonly TABLE_NAME = 'archivos';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<Archivo[]> {
    try {
      return await this.supabase.getAll<Archivo>(this.TABLE_NAME);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los archivos');
      return [];
    }
  }

  async getById(id: string): Promise<Archivo | null> {
    try {
      return await this.supabase.getById<Archivo>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo archivo por ID');
      return null;
    }
  }

  async getByEntity(tipo: EntityType, entidadId: string): Promise<Archivo[]> {
    try {
      return await this.supabase.customQuery<Archivo>(this.TABLE_NAME, 
        (query) => query
          .select('*')
          .eq('tipo_entidad', tipo)
          .eq('entidad_id', entidadId)
          .order('es_principal', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo archivos por entidad');
      return [];
    }
  }

  async create(data: Partial<Archivo>): Promise<Archivo | null> {
    try {
      return await this.supabase.create<Archivo>(this.TABLE_NAME, data);
    } catch (error) {
      this.errorService.handle(error, 'Creando archivo');
      return null;
    }
  }

  async update(id: string, data: Partial<Archivo>): Promise<Archivo | null> {
    try {
      return await this.supabase.update<Archivo>(this.TABLE_NAME, id, data);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando archivo');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando archivo');
      return false;
    }
  }

  async setPrincipal(id: string, tipo: EntityType, entidadId: string): Promise<boolean> {
    try {
      // Primero, quitamos el es_principal de todos los archivos de la entidad
      await this.supabase.customQuery(this.TABLE_NAME,
        (query) => query
          .update({ es_principal: false })
          .eq('tipo_entidad', tipo)
          .eq('entidad_id', entidadId)
      );

      // Luego, establecemos el nuevo archivo principal
      await this.supabase.update(this.TABLE_NAME, id, { es_principal: true });
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Estableciendo archivo principal');
      return false;
    }
  }

  async uploadFile(file: File, path: string, metadata: Partial<Archivo>): Promise<Archivo | null> {
    try {
      const fileUrl = await this.supabase.uploadFile('archivos', path, file);
      
      if (fileUrl) {
        const archivoData: Partial<Archivo> = {
          ...metadata,
          nombre_original: file.name,
          nombre_archivo: path.split('/').pop() || file.name,
          ruta_archivo: fileUrl,
          tipo_mime: file.type,
          tamaño: file.size
        };

        return await this.create(archivoData);
      }
      return null;
    } catch (error) {
      this.errorService.handle(error, 'Subiendo archivo');
      return null;
    }
  }

  async deleteFileWithStorage(archivo: Archivo): Promise<boolean> {
    try {
      // Primero eliminamos el archivo físico
      await this.supabase.deleteFile('archivos', archivo.ruta_archivo);
      // Luego eliminamos el registro
      await this.delete(archivo.id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando archivo y storage');
      return false;
    }
  }
}

