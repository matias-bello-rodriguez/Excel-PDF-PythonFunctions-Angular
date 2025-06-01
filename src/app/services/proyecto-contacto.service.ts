import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorService } from './error.service';
import { ProyectoContacto } from '../interfaces/entities';

@Injectable({
  providedIn: 'root'
})
export class ProyectoContactoService {
  public readonly TABLE_NAME = 'proyecto_contactos';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<ProyectoContacto[]> {
    try {
      return await this.supabase.getAll<ProyectoContacto>(this.TABLE_NAME);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los contactos');
      return [];
    }
  }

  async getById(id: string): Promise<ProyectoContacto | null> {
    try {
      return await this.supabase.getById<ProyectoContacto>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo contacto por ID');
      return null;
    }
  }

  async create(contacto: Partial<ProyectoContacto>): Promise<ProyectoContacto | null> {
    try {
      return await this.supabase.create<ProyectoContacto>(this.TABLE_NAME, contacto);
    } catch (error) {
      this.errorService.handle(error, 'Creando contacto de proyecto');
      return null;
    }
  }

  async update(id: string, contacto: Partial<ProyectoContacto>): Promise<ProyectoContacto | null> {
    try {
      return await this.supabase.update<ProyectoContacto>(this.TABLE_NAME, id, contacto);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando contacto de proyecto');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando contacto de proyecto');
      return false;
    }
  }

  async getByProyectoId(proyectoId: string): Promise<ProyectoContacto[]> {
    try {
      return await this.supabase.customQuery<ProyectoContacto>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('proyecto_id', proyectoId)
          .order('es_principal', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo contactos por proyecto');
      return [];
    }
  }

  async setPrincipal(id: string, proyectoId: string): Promise<boolean> {
    try {
      // Primero, quitamos el es_principal de todos los contactos del proyecto
      await this.supabase.customQuery(this.TABLE_NAME,
        (query) => query
          .update({ es_principal: false })
          .eq('proyecto_id', proyectoId)
      );

      // Luego, establecemos el nuevo contacto principal
      await this.supabase.update(this.TABLE_NAME, id, { es_principal: true });
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Estableciendo contacto principal');
      return false;
    }
  }
}
