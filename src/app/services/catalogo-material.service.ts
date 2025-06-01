import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CatalogoMaterial } from '../interfaces/entities';
import { CatalogMaterialType } from '../interfaces/types';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogoMaterialService {
  public readonly TABLE_NAME = 'catalogo_materiales';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<CatalogoMaterial[]> {
    try {
      return await this.supabase.getAll<CatalogoMaterial>(this.TABLE_NAME);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los materiales');
      return [];
    }
  }

  async getById(id: string): Promise<CatalogoMaterial | null> {
    try {
      return await this.supabase.getById<CatalogoMaterial>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo material por ID');
      return null;
    }
  }

  async getByTipo(tipo: CatalogMaterialType): Promise<CatalogoMaterial[]> {
    try {
      return await this.supabase.customQuery<CatalogoMaterial>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('tipo', tipo)
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo materiales por tipo');
      return [];
    }
  }

  async create(data: Partial<CatalogoMaterial>): Promise<CatalogoMaterial | null> {
    try {
      // Verificar que no exista otro material con el mismo nombre y tipo
      const existingMaterial = await this.supabase.customQuery<CatalogoMaterial>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('nombre', data.nombre!)
          .eq('tipo', data.tipo!)
          .single()
      );

      if (existingMaterial.length > 0) {
        throw new Error(`Ya existe un material con el nombre ${data.nombre} para el tipo ${data.tipo}`);
      }

      return await this.supabase.create<CatalogoMaterial>(this.TABLE_NAME, data);
    } catch (error) {
      this.errorService.handle(error, 'Creando material');
      return null;
    }
  }

  async update(id: string, data: Partial<CatalogoMaterial>): Promise<CatalogoMaterial | null> {
    try {
      if (data.nombre !== undefined || data.tipo !== undefined) {
        const currentMaterial = await this.getById(id);
        if (currentMaterial) {
          const existingMaterial = await this.supabase.customQuery<CatalogoMaterial>(this.TABLE_NAME,
            (query) => query
              .select('*')
              .eq('nombre', data.nombre || currentMaterial.nombre)
              .eq('tipo', data.tipo || currentMaterial.tipo)
              .neq('id', id)
              .single()
          );

          if (existingMaterial.length > 0) {
            throw new Error(`Ya existe un material con el nombre ${data.nombre} para el tipo ${data.tipo}`);
          }
        }
      }

      return await this.supabase.update<CatalogoMaterial>(this.TABLE_NAME, id, data);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando material');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // En lugar de eliminar, marcamos como inactivo
      await this.supabase.update(this.TABLE_NAME, id, { activo: false });
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Desactivando material');
      return false;
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      await this.supabase.update(this.TABLE_NAME, id, { activo: true });
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Reactivando material');
      return false;
    }
  }

  async search(term: string, tipo?: CatalogMaterialType): Promise<CatalogoMaterial[]> {
    try {
      let query = this.supabase.customQuery<CatalogoMaterial>(this.TABLE_NAME,
        (q) => {
          let builder = q
            .select('*')
            .eq('activo', true)
            .ilike('nombre', `%${term}%`);
          
          if (tipo) {
            builder = builder.eq('tipo', tipo);
          }
          
          return builder.order('nombre', { ascending: true });
        }
      );

      return await query;
    } catch (error) {
      this.errorService.handle(error, 'Buscando materiales');
      return [];
    }
  }
}
