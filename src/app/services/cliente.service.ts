import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Cliente } from '../interfaces/entities';
import { ClientStatus } from '../interfaces/types';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  public readonly TABLE_NAME = 'clientes';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<Cliente[]> {
    try {
      console.log('Llamando a getAll en ClienteService');
      const clientes = await this.supabase.getAll<Cliente>(this.TABLE_NAME);
      console.log('Resultado de getAll:', clientes);
      return clientes;
    } catch (error) {
      console.error('Error en getAll:', error);
      this.errorService.handle(error, 'Obteniendo todos los clientes');
      return [];
    }
  }

  async getById(id: string): Promise<Cliente | null> {
    try {
      return await this.supabase.getById<Cliente>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo cliente por ID');
      return null;
    }
  }

  async getByRut(rut: string): Promise<Cliente | null> {
    try {
      const result = await this.supabase.customQuery<Cliente>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('rut', rut)
          .single()
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo cliente por RUT');
      return null;
    }
  }

  async create(data: Partial<Cliente>): Promise<Cliente | null> {
    try {
      if (data.rut) {
        const existing = await this.getByRut(data.rut);
        if (existing) {
          throw new Error(`Ya existe un cliente con el RUT ${data.rut}`);
        }
      }
      return await this.supabase.create<Cliente>(this.TABLE_NAME, data);
    } catch (error) {
      this.errorService.handle(error, 'Creando cliente');
      return null;
    }
  }

  async update(id: string, data: Partial<Cliente>): Promise<Cliente | null> {
    try {
      if (data.rut) {
        const existing = await this.getByRut(data.rut);
        if (existing && existing.id !== id) {
          throw new Error(`Ya existe un cliente con el RUT ${data.rut}`);
        }
      }
      return await this.supabase.update<Cliente>(this.TABLE_NAME, id, data);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando cliente');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // En lugar de eliminar, actualizamos el estado a inactivo
      await this.supabase.update(this.TABLE_NAME, id, { estado: 'inactivo' as ClientStatus });
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Desactivando cliente');
      return false;
    }
  }

  async search(term: string, includeInactive: boolean = false): Promise<Cliente[]> {
    try {
      return await this.supabase.customQuery<Cliente>(this.TABLE_NAME,
        (query) => {
          let builder = query
            .select('*')
            .or(`nombre_empresa.ilike.%${term}%,rut.ilike.%${term}%,codigo.ilike.%${term}%`);
          
          if (!includeInactive) {
            builder = builder.eq('estado', 'activo');
          }
          
          return builder.order('nombre_empresa', { ascending: true });
        }
      );
    } catch (error) {
      this.errorService.handle(error, 'Buscando clientes');
      return [];
    }
  }

  async getActivos(): Promise<Cliente[]> {
    try {
      return await this.supabase.customQuery<Cliente>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('estado', 'activo')
          .order('nombre_empresa', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo clientes activos');
      return [];
    }
  }
}
