import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CubicacionDetalle } from '../interfaces/entities';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class CubicacionDetalleService {
  public readonly TABLE_NAME = 'cubicacion_detalles';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getByCubicacion(cubicacionId: string): Promise<CubicacionDetalle[]> {
    try {
      return await this.supabase.customQuery<CubicacionDetalle>(this.TABLE_NAME,
        (query) => query
          .select('*, productos(*)')
          .eq('cubicacion_id', cubicacionId)
          .order('item_numero', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo detalles de cubicación');
      return [];
    }
  }

  async getById(id: string): Promise<CubicacionDetalle | null> {
    try {
      return await this.supabase.getById<CubicacionDetalle>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo detalle por ID');
      return null;
    }
  }

  async create(data: Partial<CubicacionDetalle>): Promise<CubicacionDetalle | null> {
    try {
      // Obtener el último número de item para esta cubicación
      const lastItem = await this.supabase.customQuery<CubicacionDetalle>(this.TABLE_NAME,
        (query) => query
          .select('item_numero')
          .eq('cubicacion_id', data.cubicacion_id!)
          .order('item_numero', { ascending: false })
          .limit(1)
      );

      // Asignar el siguiente número de item
      data.item_numero = lastItem.length > 0 ? lastItem[0].item_numero + 1 : 1;

      return await this.supabase.create<CubicacionDetalle>(this.TABLE_NAME, data);
    } catch (error) {
      this.errorService.handle(error, 'Creando detalle de cubicación');
      return null;
    }
  }

  async update(id: string, data: Partial<CubicacionDetalle>): Promise<CubicacionDetalle | null> {
    try {
      return await this.supabase.update<CubicacionDetalle>(this.TABLE_NAME, id, data);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando detalle de cubicación');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando detalle de cubicación');
      return false;
    }
  }

  async reordenarItems(cubicacionId: string): Promise<boolean> {
    try {
      // Obtener todos los items ordenados
      const items = await this.supabase.customQuery<CubicacionDetalle>(this.TABLE_NAME,
        (query) => query
          .select('id')
          .eq('cubicacion_id', cubicacionId)
          .order('item_numero', { ascending: true })
      );

      // Actualizar los números de item
      for (let i = 0; i < items.length; i++) {
        await this.supabase.update(this.TABLE_NAME, items[i].id, {
          item_numero: i + 1
        });
      }
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Reordenando items de cubicación');
      return false;
    }
  }

  async getByCasa(casaId: string): Promise<CubicacionDetalle[]> {
    try {
      return await this.supabase.customQuery<CubicacionDetalle>(this.TABLE_NAME,
        (query) => query
          .select('*, productos(*), cubicaciones(*)')
          .eq('casa_id', casaId)
          .order('item_numero', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo detalles por casa');
      return [];
    }
  }
}
