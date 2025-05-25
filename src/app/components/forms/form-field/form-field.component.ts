import { Component, Input, Optional, Self, ContentChild, AfterContentInit } from '@angular/core'; // Añadir ContentChild y AfterContentInit
import { CommonModule } from '@angular/common';
import { NgControl } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss'
})
export class FormFieldComponent implements AfterContentInit { // Implementar AfterContentInit
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() errorMessage: string = ''; // Este mensaje se mostrará si shouldShowValidationMessage es true
  @Input() helpText: string = '';
  @Input() labelWidth: string = '15%';
  @Input() fieldId: string = '';
  @Input() isFormSubmitted: boolean = false;

  // Cambiar la inyección de NgControl para buscar en el contenido
  @ContentChild(NgControl) ngControl: NgControl | null = null;

  constructor() {} // El constructor puede quedar vacío o usarse para otras inyecciones

  ngAfterContentInit(): void {
    // ngControl estará disponible aquí si se encuentra en el contenido.
    // Puedes realizar alguna lógica inicial si es necesario, aunque para
    // shouldShowValidationMessage, se evaluará cuando Angular lo necesite.
  }

  shouldShowValidationMessage(): boolean {
    if (!this.ngControl || !this.ngControl.control) {
      return false;
    }

    const control = this.ngControl.control;
    // Asegurarse de que estas propiedades se traten como booleanas,
    // usando ?? false por si alguna implementación futura de NgControl las hiciera opcionales.
    // Aunque en AbstractControl estándar, son boolean.
    const isInvalid = control.invalid ?? false;
    const isDirty = control.dirty ?? false;
    const isTouched = control.touched ?? false;

    // Si se proporciona un errorMessage explícito, se le da prioridad
    // siempre que se cumplan las condiciones de visualización.
    // Si no, se podría intentar obtener errores del control (más avanzado).
    // Por ahora, la lógica se basa en el errorMessage que se pasa como @Input.
    return !!this.errorMessage && isInvalid && (this.isFormSubmitted || isDirty || isTouched);
  }

  shouldShowValidationClass(): boolean {
    if (!this.ngControl || !this.ngControl.control) {
      return false;
    }

    const control = this.ngControl.control;
    const isInvalid = control.invalid ?? false;
    const isDirty = control.dirty ?? false;
    const isTouched = control.touched ?? false;

    return isInvalid && (this.isFormSubmitted || isDirty || isTouched);
  }
}
