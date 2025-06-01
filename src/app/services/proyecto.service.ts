import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorService } from './error.service';
import { Proyecto } from '../interfaces/entities';
import { ProjectStatus } from '../interfaces/types';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  public readonly TABLE_NAME = 'proyectos';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<Proyecto[]> {
    try {
      return await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            cliente:clientes(*),
            casas(*),
            contactos:proyecto_contactos(*),
            cubicaciones(*)
          `)
          .order('fecha_creacion', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los proyectos');
      return [];
    }
  }

  async getById(id: string): Promise<Proyecto | null> {
    try {
      const result = await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            cliente:clientes(*),
            casas(*),
            contactos:proyecto_contactos(*),
            cubicaciones(*)
          `)
          .eq('id', id)
          .single()
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo proyecto por ID');
      return null;
    }
  }

  async create(proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
    try {
      return await this.supabase.create<Proyecto>(this.TABLE_NAME, proyecto);
    } catch (error) {
      this.errorService.handle(error, 'Creando proyecto');
      return null;
    }
  }

  async update(id: string, proyecto: Partial<Proyecto>): Promise<Proyecto | null> {
    try {
      return await this.supabase.update<Proyecto>(this.TABLE_NAME, id, proyecto);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando proyecto');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando proyecto');
      return false;
    }
  }

  async getByClienteId(clienteId: string): Promise<Proyecto[]> {
    try {
      return await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            casas(*),
            contactos:proyecto_contactos(*),
            cubicaciones(*)
          `)
          .eq('cliente_id', clienteId)
          .order('fecha_creacion', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo proyectos por cliente');
      return [];
    }
  }

  async getByEstado(estado: ProjectStatus): Promise<Proyecto[]> {
    try {
      return await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            cliente:clientes(*),
            casas(*),
            contactos:proyecto_contactos(*),
            cubicaciones(*)
          `)
          .eq('estado', estado)
          .order('fecha_creacion', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo proyectos por estado');
      return [];
    }
  }

  async search(term: string): Promise<Proyecto[]> {
    try {
      return await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            cliente:clientes(*),
            casas(*),
            contactos:proyecto_contactos(*)
          `)
          .or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%,ubicacion.ilike.%${term}%`)
          .order('fecha_creacion', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Buscando proyectos');
      return [];
    }
  }

  async getProyectosActivos(): Promise<Proyecto[]> {
    try {
      return await this.supabase.customQuery<Proyecto>(this.TABLE_NAME,
        (query) => query
          .select(`
            *,
            cliente:clientes(*),
            casas(*),
            contactos:proyecto_contactos(*)
          `)
          .in('estado', ['planificacion', 'en_curso', 'revision'])
          .order('fecha_creacion', { ascending: false })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo proyectos activos');
      return [];
    }
  }

  async actualizarEstado(id: string, estado: ProjectStatus): Promise<Proyecto | null> {
    try {
      return await this.supabase.update<Proyecto>(this.TABLE_NAME, id, { 
        estado,
        fecha_actualizacion: new Date()
      });
    } catch (error) {
      this.errorService.handle(error, 'Actualizando estado del proyecto');
      return null;
    }
  }
}
