import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Casa } from '../interfaces/entities';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class CasaService {
  public readonly TABLE_NAME = 'casas';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<Casa[]> {
    try {
      return await this.supabase.getAll<Casa>(this.TABLE_NAME);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todas las casas');
      return [];
    }
  }

  async getById(id: string): Promise<Casa | null> {
    try {
      return await this.supabase.getById<Casa>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo casa por ID');
      return null;
    }
  }

  async getByProyecto(proyectoId: string): Promise<Casa[]> {
    try {
      return await this.supabase.customQuery<Casa>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('proyecto_id', proyectoId)
          .order('numero', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo casas por proyecto');
      return [];
    }
  }

  async create(data: Partial<Casa>): Promise<Casa | null> {
    try {
      // Verificar que no exista otra casa con el mismo número en el proyecto
      const existingCasa = await this.supabase.customQuery<Casa>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('proyecto_id', data.proyecto_id!)
          .eq('numero', data.numero!)
          .single()
      );

      if (existingCasa.length > 0) {
        throw new Error(`Ya existe una casa con el número ${data.numero} en este proyecto`);
      }

      return await this.supabase.create<Casa>(this.TABLE_NAME, data);
    } catch (error) {
      this.errorService.handle(error, 'Creando casa');
      return null;
    }
  }

  async update(id: string, data: Partial<Casa>): Promise<Casa | null> {
    try {
      if (data.numero !== undefined) {
        // Verificar que no exista otra casa con el mismo número en el proyecto
        const currentCasa = await this.getById(id);
        if (currentCasa) {
          const existingCasa = await this.supabase.customQuery<Casa>(this.TABLE_NAME,
            (query) => query
              .select('*')
              .eq('proyecto_id', currentCasa.proyecto_id)
              .eq('numero', data.numero)
              .neq('id', id)
              .single()
          );

          if (existingCasa.length > 0) {
            throw new Error(`Ya existe una casa con el número ${data.numero} en este proyecto`);
          }
        }
      }

      return await this.supabase.update<Casa>(this.TABLE_NAME, id, data);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando casa');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando casa');
      return false;
    }
  }

  async getNextNumero(proyectoId: string): Promise<number> {
    try {
      const casas = await this.supabase.customQuery<Casa>(this.TABLE_NAME,
        (query) => query
          .select('numero')
          .eq('proyecto_id', proyectoId)
          .order('numero', { ascending: false })
          .limit(1)
      );

      if (casas.length === 0) return 1;
      return (casas[0].numero || 0) + 1;
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo siguiente número de casa');
      return 1;
    }
  }
}
