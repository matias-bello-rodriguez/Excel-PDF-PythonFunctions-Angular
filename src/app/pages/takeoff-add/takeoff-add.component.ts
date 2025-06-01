import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Importación de componentes de formulario
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { FormSectionComponent } from '../../components/forms/form-section/form-section.component';
import { TextInputComponent } from '../../components/forms/text-input/text-input.component';
import { TextareaInputComponent } from '../../components/forms/textarea-input/textarea-input.component';
import { SelectInputComponent } from '../../components/forms/select-input/select-input.component';
import { DateInputComponent } from '../../components/forms/date-input/date-input.component';
import { FormButtonsComponent } from '../../components/forms/form-buttons/form-buttons.component';

// Importación de servicios
import { CubicacionService } from '../../services/cubicacion.service';
import { ProyectoService } from '../../services/proyecto.service';
import { ErrorService } from '../../services/error.service';
import { Cubicacion, Proyecto } from '../../interfaces/entities';

@Component({
  selector: 'app-takeoff-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    FormFieldComponent,
    FormSectionComponent,
    TextInputComponent,
    TextareaInputComponent,
    SelectInputComponent,
    DateInputComponent,
    FormButtonsComponent
  ],
  templateUrl: './takeoff-add.component.html',
  styleUrl: './takeoff-add.component.scss'
})
export class TakeoffAddComponent implements OnInit {
  takeoffForm!: FormGroup;
  isSubmitting = false;
  isLoading = true;
  isEditMode = false;
  cubicacionId: string | null = null;
  cubicacion: Cubicacion | null = null;
  
  // Sorting and filtering properties
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  cubicacionesFormateadas: any[] = [];
  pinnedItems: Set<string> = new Set<string>();
  
  // Mensajes
  successMessage: string = '';
  errorMessage: string = '';
  
  // Opciones para selects
  estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];
  
  proyectoOptions: { value: string, label: string }[] = [];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private cubicacionService: CubicacionService,
    private proyectoService: ProyectoService,
    private errorService: ErrorService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Inicializar el formulario
      this.initForm();
      
      // Cargar proyectos para el select
      const proyectos = await this.proyectoService.getAll();
      this.proyectoOptions = proyectos.map(p => ({
        value: p.id,
        label: p.nombre
      }));
      
      // Verificar si estamos en modo edición
      this.route.params.subscribe(async params => {
        if (params['id']) {
          this.cubicacionId = params['id'];
          this.isEditMode = true;
          
          // Cargar datos de la cubicación a editar
          this.cubicacion = await this.cubicacionService.getById(this.cubicacionId ?? '');
          
          if (this.cubicacion) {
            // Llenar el formulario con los datos de la cubicación
            this.takeoffForm.patchValue({
              codigo: this.cubicacion.codigo,
              nombre: this.cubicacion.nombre,
              proyecto_id: this.cubicacion.proyecto_id,
              descripcion: this.cubicacion.descripcion,
              fecha: this.formatDateForInput(this.cubicacion.fecha_creacion ? this.cubicacion.fecha_creacion.toString() : null),
              estado: this.cubicacion.estado,
              monto_total: this.cubicacion.monto_total
            });
          } else {
            this.errorMessage = 'No se encontró la cubicación solicitada';
          }
        }
      });
    } catch (error) {
      this.errorService.handle(error, 'Cargando datos del formulario');
      this.errorMessage = 'Error al cargar los datos. Intente nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  initForm(): void {
    this.takeoffForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      proyecto_id: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(500)]],
      fecha: ['', [Validators.required]],
      estado: ['activo', [Validators.required]],
      monto_total: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]]
    });
  }

  formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input type="date"
  }

  async onSubmit(): Promise<void> {
    if (this.takeoffForm.valid) {
      this.isSubmitting = true;
      this.successMessage = '';
      this.errorMessage = '';
      
      try {
        // Formateamos los datos para enviar al servicio
        const formData: Partial<Cubicacion> = {
          codigo: this.takeoffForm.get('codigo')?.value,
          nombre: this.takeoffForm.get('nombre')?.value,
          proyecto_id: this.takeoffForm.get('proyecto_id')?.value,
          descripcion: this.takeoffForm.get('descripcion')?.value,
          fecha_creacion: new Date(this.takeoffForm.get('fecha')?.value),
          estado: this.takeoffForm.get('estado')?.value,
          monto_total: parseFloat(this.takeoffForm.get('monto_total')?.value)
        };
        
        if (this.isEditMode && this.cubicacionId) {
          // Actualizar cubicación existente
          const updatedCubicacion = await this.cubicacionService.update(this.cubicacionId, formData);
          
          if (updatedCubicacion) {
            this.successMessage = 'Cubicación actualizada correctamente';
            setTimeout(() => {
              this.router.navigate(['/cubicaciones']);
            }, 1500);
          } else {
            this.errorMessage = 'Error al actualizar la cubicación';
          }
        } else {
          // Crear nueva cubicación
          const newCubicacion = await this.cubicacionService.create(formData);
          
          if (newCubicacion) {
            this.successMessage = 'Cubicación creada correctamente';
            setTimeout(() => {
              this.router.navigate(['/cubicaciones']);
            }, 1500);
          } else {
            this.errorMessage = 'Error al crear la cubicación';
          }
        }
      } catch (error) {
        this.errorService.handle(error, this.isEditMode ? 'Actualizando cubicación' : 'Creando cubicación');
        this.errorMessage = `Error al ${this.isEditMode ? 'actualizar' : 'crear'} la cubicación`;
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched(this.takeoffForm);
    }
  }

  onCancel(): void {
    this.router.navigate(['/cubicaciones']);
  }

  // Método para marcar todos los controles como tocados
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Método para obtener mensajes de error
  getErrorMessage(controlName: string): string {
    const control = this.takeoffForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `No debe exceder los ${maxLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      if (controlName === 'monto_total') {
        return 'Debe ingresar un valor monetario válido';
      }
      return 'Formato inválido';
    }
    return '';
  }

  // Método para aplicar filtros a la lista de cubicaciones
  applyFilters(cubicaciones: Cubicacion[], filters: any): Cubicacion[] {
    let cubicacionesFiltradas = cubicaciones;
    
    // Aplicar filtros según los criterios seleccionados
    Object.keys(filters).forEach(key => {
      const filter = filters[key];
      if (filter && filter.value) {
        switch (key) {
          case 'estado':
            cubicacionesFiltradas = cubicacionesFiltradas.filter(item => item.estado === filter.value);
            break;
          case 'fecha':
            cubicacionesFiltradas = cubicacionesFiltradas.filter(item => {
              if (!item.fecha_creacion) return false;
              const fechaItem = new Date(item.fecha_creacion);
              return fechaItem >= new Date(filter.value[0]) && fechaItem <= new Date(filter.value[1]);
            });
            break;
          case 'text':
            cubicacionesFiltradas = cubicacionesFiltradas.filter(item => {
              // Manejar diferentes campos de texto
              let itemValue = '';
              if (filter.col === 'proyecto') {
                itemValue = item.Proyecto?.nombre || '';
              } else {
                itemValue = item[filter.col as keyof typeof item] as string || '';
              }
              return itemValue.toLowerCase().includes((filter.value || '').toLowerCase());
            });
            break;
          default:
            cubicacionesFiltradas = cubicacionesFiltradas.filter(item => 
              key in item && (item as any)[key] === filter.value
            );
        }
      }
    });
    
    return cubicacionesFiltradas;
  }

  // Método para aplicar la ordenación
applySort(): void {
  if (!this.sortColumn) return;

  // Obtener elementos fijados y no fijados
  const pinnedItems = this.cubicacionesFormateadas.filter(item => this.pinnedItems.has(item.id));
  const unpinnedItems = this.cubicacionesFormateadas.filter(item => !this.pinnedItems.has(item.id));

  // Función de ordenación
  const sortFn = (a: any, b: any) => {
    const col = this.sortColumn as string;
    let valA, valB;
    
    // Manejar caso especial para proyecto
    if (col === 'proyecto') {
      valA = a[col] || '';
      valB = b[col] || '';
    } else {
      valA = a[col] ?? '';
      valB = b[col] ?? '';
    }

    let comparison = 0;
    if (valA > valB) {
      comparison = 1;
    } else if (valA < valB) {
      comparison = -1;
    }

    return this.sortDirection === 'asc' ? comparison : comparison * -1;
  };

  // Ordenar cada grupo por separado
  pinnedItems.sort(sortFn);
  unpinnedItems.sort(sortFn);

  // Combinar grupos
  this.cubicacionesFormateadas = [...pinnedItems, ...unpinnedItems];
}
}
