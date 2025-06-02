import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CubicacionService } from '../../services/cubicacion.service';
import { ErrorService } from '../../services/error.service';
import { ProyectoService } from '../../services/proyecto.service';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cubicacion-selection-container">
      <h2>Seleccione una cubicación</h2>
      <p>Para crear un producto, primero debe seleccionar una cubicación.</p>
      
      <div *ngIf="loading" class="loading-container">
        <span class="loading-spinner"></span>
        <p>Cargando cubicaciones...</p>
      </div>
      
      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
      
      <div *ngIf="!loading && cubicaciones.length === 0" class="no-results">
        <p>No se encontraron cubicaciones disponibles.</p>
        <button (click)="navigateToCreateCubicacion()" class="btn-primary">
          Crear nueva cubicación
        </button>
      </div>
      
      <div *ngIf="!loading && cubicaciones.length > 0" class="cubicacion-list">
        <div *ngFor="let cubicacion of cubicaciones" 
             class="cubicacion-item" 
             (click)="selectCubicacion(cubicacion.id)">
          <div class="cubicacion-info">
            <h3>{{ cubicacion.codigo || 'Sin código' }}</h3>
            <p>{{ cubicacion.nombre || 'Sin nombre' }}</p>
            <p *ngIf="cubicacion.proyecto_codigo">Proyecto: {{ cubicacion.proyecto_codigo }}</p>
          </div>
          <div class="cubicacion-action">
            <button class="btn-select">Seleccionar</button>
          </div>
        </div>
      </div>
      
      <div class="actions-container">
        <button (click)="goBack()" class="btn-secondary">Volver</button>
      </div>
    </div>
  `,
  styles: [`
    .cubicacion-selection-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1.5rem;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
      margin-top: 0;
      color: var(--primary-color);
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    
    .loading-spinner {
      display: inline-block;
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-color);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      background-color: rgba(220, 53, 69, 0.1);
      border-left: 3px solid #dc3545;
      padding: 1rem;
      margin: 1rem 0;
      color: #dc3545;
    }
    
    .no-results {
      text-align: center;
      padding: 2rem;
    }
    
    .cubicacion-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 1.5rem 0;
    }
    
    .cubicacion-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-rgb), 0.05);
      }
    }
    
    .cubicacion-info h3 {
      margin: 0 0 0.5rem 0;
    }
    
    .cubicacion-info p {
      margin: 0 0 0.25rem 0;
      color: #666;
    }
    
    .btn-primary, .btn-secondary, .btn-select {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
      
      &:hover {
        background-color: var(--primary-color-dark);
      }
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      
      &:hover {
        background-color: #5a6268;
      }
    }
    
    .btn-select {
      background-color: var(--primary-color);
      color: white;
      
      &:hover {
        background-color: var(--primary-color-dark);
      }
    }
    
    .actions-container {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
    }
  `]
})
export class ProductAddComponent implements OnInit {
  cubicaciones: any[] = [];
  loading = false;
  error = '';

  constructor(
    private cubicacionService: CubicacionService,
    private errorService: ErrorService,
    private router: Router,
    private proyectoService: ProyectoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const cubicaciones = await this.cubicacionService.getAll();
      
      // Mejoramos los datos para mostrar más información
      this.cubicaciones = await Promise.all(cubicaciones.map(async (cub) => {
        let proyectoCodigo = '';
        if (cub.proyecto_id) {
          try {
            const proyecto = await this.proyectoService.getById(cub.proyecto_id);
            proyectoCodigo = proyecto?.codigo || '';
          } catch {
            // Ignorar errores al obtener el proyecto
          }
        }
        return {
          ...cub,
          proyecto_codigo: proyectoCodigo
        };
      }));
      
    } catch (err) {
      this.errorService.handle(err, 'Cargando cubicaciones');
      this.error = 'Error al cargar las cubicaciones. Por favor, intente nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  selectCubicacion(cubicacionId: string): void {
    // Verificar que el ID de cubicación sea válido
    if (!cubicacionId) {
      this.error = 'ID de cubicación inválido';
      return;
    }
    
    // Navegar a la página de agregar producto con el ID de cubicación
    this.router.navigate(['/productos/agregar-ventana', cubicacionId]);
  }

  navigateToCreateCubicacion(): void {
    this.router.navigate(['/cubicaciones/agregar']);
  }

  goBack(): void {
    this.router.navigate(['/productos']);
  }
}
