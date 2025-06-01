import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ErrorService } from './error.service';
import { Usuario } from '../interfaces/entities';
import { UserRole } from '../interfaces/types';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  public readonly TABLE_NAME = 'usuarios';

  constructor(
    public supabase: SupabaseService,
    public errorService: ErrorService
  ) {}

  async getAll(): Promise<Usuario[]> {
    try {
      return await this.supabase.getAll<Usuario>(this.TABLE_NAME);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo todos los usuarios');
      return [];
    }
  }

  async getById(id: string): Promise<Usuario | null> {
    try {
      return await this.supabase.getById<Usuario>(this.TABLE_NAME, id);
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo usuario por ID');
      return null;
    }
  }

  async create(usuario: Partial<Usuario>): Promise<Usuario | null> {
    try {
      return await this.supabase.create<Usuario>(this.TABLE_NAME, usuario);
    } catch (error) {
      this.errorService.handle(error, 'Creando usuario');
      return null;
    }
  }

  async update(id: string, usuario: Partial<Usuario>): Promise<Usuario | null> {
    try {
      return await this.supabase.update<Usuario>(this.TABLE_NAME, id, usuario);
    } catch (error) {
      this.errorService.handle(error, 'Actualizando usuario');
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.supabase.delete(this.TABLE_NAME, id);
      return true;
    } catch (error) {
      this.errorService.handle(error, 'Eliminando usuario');
      return false;
    }
  }

  async getByRol(rol: UserRole): Promise<Usuario[]> {
    try {
      return await this.supabase.customQuery<Usuario>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('rol', rol)
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo usuarios por rol');
      return [];
    }
  }

  async updateUltimoAcceso(id: string): Promise<Usuario | null> {
    try {
      return await this.supabase.update<Usuario>(this.TABLE_NAME, id, {
        ultimo_login: new Date()
      });
    } catch (error) {
      this.errorService.handle(error, 'Actualizando último acceso');
      return null;
    }
  }

  async getActivos(): Promise<Usuario[]> {
    try {
      return await this.supabase.customQuery<Usuario>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Obteniendo usuarios activos');
      return [];
    }
  }

  async cambiarEstado(id: string, activo: boolean): Promise<Usuario | null> {
    try {
      return await this.supabase.update<Usuario>(this.TABLE_NAME, id, { activo });
    } catch (error) {
      this.errorService.handle(error, `${activo ? 'Activando' : 'Desactivando'} usuario`);
      return null;
    }
  }

  async buscar(termino: string): Promise<Usuario[]> {
    try {
      return await this.supabase.customQuery<Usuario>(this.TABLE_NAME,
        (query) => query
          .select('*')
          .or(`nombre.ilike.%${termino}%,email.ilike.%${termino}%`)
          .order('nombre', { ascending: true })
      );
    } catch (error) {
      this.errorService.handle(error, 'Buscando usuarios');
      return [];
    }
  }
}
