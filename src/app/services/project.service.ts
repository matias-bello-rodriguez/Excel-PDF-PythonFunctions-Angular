import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface Contact {
  nombre: string;
  email: string;
  telefono?: string;
}

export interface Project {
  id: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  fechaInicio: string;
  fechaEntrega: string;
  tiposObra: string[];
  tipoObraOtro?: string;
  descripcion?: string;
  tipoMercado?: string;
  contactos: Contact[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {  private projects: Project[] = [
    {
      id: 'PRJ-2024-001',
      nombre: 'Edificio Central',
      cliente: 'Constructora Andes',
      ubicacion: 'Santiago',
      fechaInicio: '01/03/2024',
      fechaEntrega: '15/12/2024',
      tiposObra: ['comercial', 'institucional'],
      descripcion: 'Proyecto de construcción de edificio de oficinas',
      tipoMercado: 'privado',      contactos: [
        {
          nombre: 'Juan Pérez',
          email: 'juan.perez@constructoraandes.cl',
          telefono: '+56912345678'
        },
        {
          nombre: 'Ana Martínez',
          email: 'ana.martinez@constructoraandes.cl',
          telefono: '+56912345679'
        }
      ]
    },
    {
      id: 'PRJ-2024-002',
      nombre: 'Parque Industrial',
      cliente: 'Inmobiliaria Sur',
      ubicacion: 'Concepción',
      fechaInicio: '10/04/2024',
      fechaEntrega: '30/11/2024',
      tiposObra: ['industrial', 'infraestructura'],
      descripcion: 'Desarrollo de parque industrial logístico',
      tipoMercado: 'mixto',      contactos: [
        {
          nombre: 'María González',
          email: 'maria.gonzalez@inmosur.cl',
          telefono: '+56987654321'
        }
      ]
    },
    {
      id: 'PRJ-2024-003',
      nombre: 'Torre Norte',
      cliente: 'Grupo Norte',
      ubicacion: 'Antofagasta',
      fechaInicio: '20/02/2024',
      fechaEntrega: '10/10/2024',
      tiposObra: ['residencial'],
      descripcion: 'Torre residencial de alta gama',
      tipoMercado: 'privado',      contactos: [
        {
          nombre: 'Carlos Ruiz',
          email: 'carlos.ruiz@gruponorte.cl',
          telefono: '+56911122334'
        },
        {
          nombre: 'Pedro Silva',
          email: 'pedro.silva@gruponorte.cl'
        }
      ]
    }
  ];

  constructor() { }

  // Obtener todos los proyectos
  getProjects(): Observable<Project[]> {
    return of(this.projects).pipe(delay(300));
  }

  // Obtener un proyecto por ID
  getProjectById(id: string): Observable<Project | undefined> {
    const project = this.projects.find(p => p.id === id);
    return of(project).pipe(delay(300));
  }

  // Crear un nuevo proyecto
  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    // Generar un ID único
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const sequential = String(this.projects.length + 1).padStart(3, '0');
    const id = `PRJ-${year}-${sequential}`;
    
    const newProject: Project = {
      ...project,
      id
    };
    
    // En una aplicación real, aquí harías una petición HTTP al backend
    this.projects.push(newProject);
    return of(newProject).pipe(delay(500));
  }

  // Actualizar un proyecto
  updateProject(id: string, project: Partial<Project>): Observable<Project | null> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], ...project };
      return of(this.projects[index]).pipe(delay(500));
    }
    return of(null).pipe(delay(500));
  }

  // Eliminar un proyecto
  deleteProject(id: string): Observable<boolean> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects.splice(index, 1);
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  // Obtener lista de clientes para el select
  getClientOptions(): Observable<Array<{value: string, label: string}>> {
    const clients = [...new Set(this.projects.map(p => p.cliente))];
    const options = clients.map(client => ({
      value: client,
      label: client
    }));
    return of(options).pipe(delay(200));
  }

  // Obtener lista de ubicaciones para el select
  getLocationOptions(): Observable<Array<{value: string, label: string}>> {
    const locations = [...new Set(this.projects.map(p => p.ubicacion))];
    const options = locations.map(location => ({
      value: location,
      label: location
    }));
    return of(options).pipe(delay(200));
  }
}
