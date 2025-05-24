import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Importación de componentes de formulario
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { FormSectionComponent } from '../../components/forms/form-section/form-section.component';
import { TextInputComponent } from '../../components/forms/text-input/text-input.component';
import { TextareaInputComponent } from '../../components/forms/textarea-input/textarea-input.component';
import { SelectInputComponent } from '../../components/forms/select-input/select-input.component';
import { DateInputComponent } from '../../components/forms/date-input/date-input.component';
import { FormButtonsComponent } from '../../components/forms/form-buttons/form-buttons.component';
import { CheckboxGroupComponent } from '../../components/forms/checkbox-group/checkbox-group.component';
import { ContactsManagerComponent, Contact } from '../../components/forms/contacts-manager/contacts-manager.component';

// Importación del servicio de proyectos
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-add',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    FormSectionComponent,
    TextInputComponent,
    TextareaInputComponent,
    SelectInputComponent,
    DateInputComponent,
    FormButtonsComponent,
    CheckboxGroupComponent,
    ContactsManagerComponent
  ],
  templateUrl: './project-add.component.html',
  styleUrl: './project-add.component.scss'
})
export class ProjectAddComponent implements OnInit {  projectForm!: FormGroup;
  isSubmitting = false;
  successMessage: string = '';
  errorMessage: string = '';
  tipoMercadoOptions = [
    { value: 'publico', label: 'Público' },
    { value: 'privado', label: 'Privado' },
    { value: 'mixto', label: 'Mixto' }
  ];

  tiposObraOptions = [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'infraestructura', label: 'Infraestructura' },
    { value: 'institucional', label: 'Institucional' },
    { value: 'otro', label: 'Otro' }
  ];

  clienteOptions: Array<{value: string, label: string}> = [];
  ubicacionOptions: Array<{value: string, label: string}> = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSelectOptions();
    
    // Observar cambios en tipos de obra para mostrar/ocultar el campo "otro"
    this.projectForm.get('tiposObra')?.valueChanges.subscribe(values => {
      const control = this.projectForm.get('tipoObraOtro');
      if (values && values.includes('otro')) {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue('');
      }
      control?.updateValueAndValidity();
    });
  }  initForm(): void {
    this.projectForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      cliente: ['', [Validators.required, Validators.maxLength(100)]],
      ubicacion: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', [Validators.maxLength(500)]],
      fechaInicio: ['', [Validators.required]],
      fechaEntrega: ['', [Validators.required]],
      tiposObra: [[], [Validators.required, Validators.minLength(1)]],
      tipoObraOtro: [''],
      tipoMercado: ['', [Validators.required]],
      contactos: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  loadSelectOptions(): void {
    // Cargar opciones de clientes
    this.projectService.getClientOptions().subscribe({
      next: (options) => {
        this.clienteOptions = [
          ...options,
          { value: 'nuevo', label: '+ Agregar nuevo cliente' }
        ];
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
      }
    });

    // Cargar opciones de ubicaciones
    this.projectService.getLocationOptions().subscribe({
      next: (options) => {
        this.ubicacionOptions = [
          ...options,
          { value: 'nueva', label: '+ Agregar nueva ubicación' }
        ];
      },
      error: (error) => {
        console.error('Error cargando ubicaciones:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.isSubmitting = true;
      this.successMessage = '';
      this.errorMessage = '';      // Formateamos los datos para enviar al servicio
      const formData = {
        nombre: this.projectForm.get('nombre')?.value,
        cliente: this.projectForm.get('cliente')?.value,
        ubicacion: this.projectForm.get('ubicacion')?.value,
        descripcion: this.projectForm.get('descripcion')?.value || '',
        fechaInicio: this.projectForm.get('fechaInicio')?.value,
        fechaEntrega: this.projectForm.get('fechaEntrega')?.value,
        tiposObra: this.projectForm.get('tiposObra')?.value,
        tipoObraOtro: this.projectForm.get('tipoObraOtro')?.value || '',
        tipoMercado: this.projectForm.get('tipoMercado')?.value,
        contactos: this.projectForm.get('contactos')?.value || []
      };
      
      // Enviamos los datos al servicio
      this.projectService.createProject(formData).subscribe({
        next: (result) => {
          console.log('Proyecto creado:', result);
          this.isSubmitting = false;
          this.successMessage = 'Proyecto creado correctamente';
          
          // Redirigir después de un breve delay para mostrar el mensaje
          setTimeout(() => {
            this.router.navigate(['/proyectos']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al crear proyecto:', error);
          this.isSubmitting = false;
          this.errorMessage = 'Ha ocurrido un error al crear el proyecto';
        }
      });
    } else {
      this.markFormGroupTouched(this.projectForm);
    }
  }

  onCancel(): void {
    this.router.navigate(['/proyectos']);
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
  
  // Método para verificar si "otro" está seleccionado
  get isOtroSelected(): boolean {
    const tiposObra = this.projectForm.get('tiposObra')?.value || [];
    return tiposObra.includes('otro');
  }
  // Método para obtener mensajes de error
  getErrorMessage(controlName: string): string {
    const control = this.projectForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      if (controlName === 'tiposObra') {
        return 'Debe seleccionar al menos un tipo de obra';
      }
      if (controlName === 'contactos') {
        return 'Debe agregar al menos un contacto';
      }
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `No debe exceder los ${maxLength} caracteres`;
    }
    if (control?.hasError('pattern')) {
      if (controlName === 'telefono') {
        return 'Formato de teléfono inválido';
      }
      return 'Formato inválido';
    }
    if (control?.hasError('email')) {
      return 'Debe ingresar un email válido';
    }
    return '';
  }
}
