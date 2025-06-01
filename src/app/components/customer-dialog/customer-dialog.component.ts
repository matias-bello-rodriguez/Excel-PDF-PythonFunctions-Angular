import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClientModule } from '@angular/common/http';

// Importación de componentes de formulario
import { FormSectionComponent } from '../forms/form-section/form-section.component';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { TextInputComponent } from '../forms/text-input/text-input.component';
import { FormButtonsComponent } from '../forms/form-buttons/form-buttons.component';

// Importación del servicio de validación
import { ValidationService, AddressValidationResponse, RutValidationResponse, EmailValidationResponse } from '../../services/validation.service';

@Component({
  selector: 'app-customer-dialog',
  standalone: true,  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    HttpClientModule,
    FormSectionComponent,
    FormFieldComponent,
    TextInputComponent,
    FormButtonsComponent
  ],
  templateUrl: './customer-dialog.component.html',
  styleUrl: './customer-dialog.component.scss'
})
export class CustomerDialogComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() customer: any = null; // Para editar cliente existente
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
    customerForm!: FormGroup;
  isLoading = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  // Estados de validación
  rutValid = false;
  rutExists = false;
  rutCompanyName = '';
  rutValidating = false;
  
  emailValid = false;
  emailExists = false;
  emailValidating = false;
  
  addressValid = false;
  addressFormatted = '';
  addressSuggestions: string[] = [];
  addressValidating = false;

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    if (this.show && this.customerForm) {
      if (this.customer) {
        // Modo edición
        this.customerForm.patchValue(this.customer);
        this.validateRut();
      } else {
        // Modo creación
        this.customerForm.reset();
        this.rutValid = false;
        this.resetErrorMessages();
      }
    }
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      nombre_empresa: ['', [Validators.required, Validators.minLength(2)]],
      rut: ['', [Validators.required, this.rutValidator]],
      direccion: [''],
      telefono_contacto: [''],
      email_contacto: ['', [Validators.email]]
    });

    // Listeners para validaciones en tiempo real
    this.customerForm.get('rut')?.valueChanges.subscribe(value => {
      if (value && value.length >= 8) {
        this.validateRutWithSII(value);
      } else {
        this.resetRutValidation();
      }
    });

    this.customerForm.get('email_contacto')?.valueChanges.subscribe(value => {
      if (value && this.isValidEmailFormat(value)) {
        this.validateEmailWithAPI(value);
      } else {
        this.resetEmailValidation();
      }
    });

    this.customerForm.get('direccion')?.valueChanges.subscribe(value => {
      if (value && value.length >= 5) {
        this.validateAddressWithCorreos(value);
      } else {
        this.resetAddressValidation();
      }
    });
  }

  private rutValidator(control: any) {
    if (!control.value) return null;
    return CustomerDialogComponent.isValidRut(control.value) ? null : { invalidRut: true };
  }
  private validateRut(): void {
    const rutValue = this.customerForm.get('rut')?.value;
    this.rutValid = rutValue && CustomerDialogComponent.isValidRut(rutValue);
  }

  // Nuevos métodos de validación con APIs

  private validateRutWithSII(rut: string): void {
    if (!CustomerDialogComponent.isValidRut(rut)) {
      this.resetRutValidation();
      return;
    }

    this.rutValidating = true;
    this.validationService.validateRutWithSII(rut).subscribe({
      next: (response: RutValidationResponse) => {
        this.rutValid = response.valid;
        this.rutExists = response.exists;
        this.rutCompanyName = response.companyName || '';
        this.rutValidating = false;
      },
      error: () => {
        this.rutValidating = false;
        this.rutValid = CustomerDialogComponent.isValidRut(rut);
      }
    });
  }

  private resetRutValidation(): void {
    this.rutValid = false;
    this.rutExists = false;
    this.rutCompanyName = '';
    this.rutValidating = false;
  }

  private validateEmailWithAPI(email_contacto: string): void {
    this.emailValidating = true;
    this.validationService.validateEmail(email_contacto).subscribe({
      next: (response: EmailValidationResponse) => {
        this.emailValid = response.valid;
        this.emailExists = response.exists;
        this.emailValidating = false;
      },
      error: () => {
        this.emailValidating = false;
        this.emailValid = this.isValidEmailFormat(email_contacto);
      }
    });
  }

  private resetEmailValidation(): void {
    this.emailValid = false;
    this.emailExists = false;
    this.emailValidating = false;
  }

  private validateAddressWithCorreos(address: string): void {
    this.addressValidating = true;
    this.validationService.validateAddress(address).subscribe({
      next: (response: AddressValidationResponse) => {
        this.addressValid = response.valid;
        this.addressFormatted = response.formatted || '';
        this.addressSuggestions = response.suggestions || [];
        this.addressValidating = false;
      },
      error: () => {
        this.addressValidating = false;
        this.addressValid = false;
      }
    });
  }

  private resetAddressValidation(): void {
    this.addressValid = false;
    this.addressFormatted = '';
    this.addressSuggestions = [];
    this.addressValidating = false;
  }

  private isValidEmailFormat(email_contacto: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email_contacto);
  }

  static isValidRut(rut: string): boolean {
    if (!rut || rut.length < 8) return false;
    
    // Remover puntos y guión, convertir a mayúsculas
    const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
    
    // Separar número y dígito verificador
    const rutBody = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    
    // Validar que el cuerpo sea numérico
    if (!/^\d+$/.test(rutBody)) return false;
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDv = 11 - (sum % 11);
    let expectedDv: string;
    
    if (calculatedDv === 11) expectedDv = '0';
    else if (calculatedDv === 10) expectedDv = 'K';
    else expectedDv = calculatedDv.toString();
    
    return dv === expectedDv;
  }

  formatRut(): void {
    const rutControl = this.customerForm.get('rut');
    if (!rutControl?.value) return;

    const rut = rutControl.value.replace(/[.-]/g, '');
    if (rut.length >= 2) {
      const body = rut.slice(0, -1);
      const dv = rut.slice(-1);
      const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      rutControl.setValue(`${formattedBody}-${dv}`, { emitEvent: false });
      this.validateRut();
    }
  }

  // Modificar el método formatPhone para usar el nuevo nombre del campo
  formatPhone(): void {
    const phoneControl = this.customerForm.get('telefono_contacto');
    if (!phoneControl?.value) return;

    let phone = phoneControl.value.replace(/\D/g, '');
    
    // Si no empieza con +56, agregarlo
    if (!phone.startsWith('56')) {
      phone = '56' + phone;
    }

    // Formatear como +56 9 1234 5678
    if (phone.length >= 11) {
      const formatted = `+${phone.slice(0, 2)} ${phone.slice(2, 3)} ${phone.slice(3, 7)} ${phone.slice(7, 11)}`;
      phoneControl.setValue(formatted, { emitEvent: false });
    }
  }

  // Agregar método para resetear mensajes de error
  private resetErrorMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Modificar el método getErrorMessage para usar los nuevos nombres de campos
  getErrorMessage(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (control.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Email no válido';
    }
    if (control.errors['invalidRut']) {
      return 'RUT no válido';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre_empresa: 'Nombre',
      rut: 'RUT',
      direccion: 'Dirección',
      telefono_contacto: 'Teléfono',
      email_contacto: 'Email'
    };
    return labels[fieldName] || fieldName;
  }

  closeDialog(): void {
    this.close.emit();
  }

  // Modificar el método saveCustomer para manejar errores
  saveCustomer(): void {
    if (this.customerForm.valid) {
      this.isLoading = true;
      this.resetErrorMessages();
      
      const formData = this.customerForm.value;
      
      this.save.emit(formData);
      
      // Simulamos que el guardado toma tiempo
      setTimeout(() => {
        this.isLoading = false;
        // En un caso real, este manejo se haría después de recibir la respuesta del servidor
      }, 500);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.customerForm.controls).forEach(key => {
        this.customerForm.get(key)?.markAsTouched();
      });
      
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
    }
  }

  // Método para manejar errores del servidor
  handleServerError(error: any): void {
    this.isLoading = false;
    
    if (error && error.code === 'PGRST116' && error.message.includes('rows returned')) {
      this.errorMessage = 'No se encontró ningún cliente con el RUT especificado.';
    } else {
      this.errorMessage = 'Ocurrió un error al procesar la solicitud. Por favor, inténtelo nuevamente.';
    }
    
    console.error('Error en operación de cliente:', error);
  }

  // Método para mostrar notificación de éxito
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    
    // Opcionalmente, limpiar el mensaje después de un tiempo
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  searchAddress(): void {
    const direccionControl = this.customerForm.get('direccion');
    const currentAddress = direccionControl?.value;
    
    if (!currentAddress || currentAddress.length < 3) {
      return;
    }

    this.validationService.searchAddresses(currentAddress).subscribe({
      next: (addresses: string[]) => {
        this.addressSuggestions = addresses;
        if (addresses.length > 0) {
          // Mostrar sugerencias al usuario o autocompletar
          console.log('Direcciones encontradas:', addresses);
        }
      },
      error: (error) => {
        console.warn('Error buscando direcciones:', error);
      }
    });
  }

  selectAddressSuggestion(address: string): void {
    this.customerForm.patchValue({ direccion: address });
    this.addressSuggestions = [];
    this.validateAddressWithCorreos(address);
  }
}
