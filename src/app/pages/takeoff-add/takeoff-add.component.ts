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

// Importación del servicio de cubicaciones
import { TakeoffService } from '../../services/takeoff.service';

@Component({
  selector: 'app-takeoff-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  // Añadir propiedades para mensajes
  successMessage: string = '';
  errorMessage: string = '';
  estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
  ];
  proyectoOptions = [
    { value: 'proyecto1', label: 'Proyecto 1' },
    { value: 'proyecto2', label: 'Proyecto 2' },
    { value: 'proyecto3', label: 'Proyecto 3' }
  ];
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private takeoffService: TakeoffService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.takeoffForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      proyecto: ['', [Validators.required]],
      descripcion: ['', [Validators.maxLength(500)]],
      fecha: ['', [Validators.required]],
      estado: ['activo', [Validators.required]],
      monto: ['', [Validators.required, Validators.pattern(/^\$?[\d,.]+$/)]]
    });
  }
  onSubmit(): void {
    if (this.takeoffForm.valid) {
      this.isSubmitting = true;
      this.successMessage = '';
      this.errorMessage = '';
      
      // Formateamos los datos para enviar al servicio
      const formData = {
        nombre: this.takeoffForm.get('nombre')?.value,
        descripcion: this.takeoffForm.get('descripcion')?.value,
        fecha: this.takeoffForm.get('fecha')?.value,
        estado: this.takeoffForm.get('estado')?.value,
        monto: this.takeoffForm.get('monto')?.value
      };
      
      // Enviamos los datos al servicio
      this.takeoffService.createTakeoff(formData).subscribe({
        next: (result) => {
          console.log('Cubicación creada:', result);
          this.isSubmitting = false;
          this.successMessage = 'Cubicación creada correctamente';
          
          // Redirigir después de un breve delay para mostrar el mensaje
          setTimeout(() => {
            this.router.navigate(['/cubicaciones']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al crear cubicación:', error);
          this.isSubmitting = false;
          this.errorMessage = 'Ha ocurrido un error al crear la cubicación';
        }
      });
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
      if (controlName === 'monto') {
        return 'Debe ingresar un valor monetario válido';
      }
      return 'Formato inválido';
    }
    return '';
  }
}
