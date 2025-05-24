import { Component, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormFieldComponent } from '../form-field/form-field.component';
import { TextInputComponent } from '../text-input/text-input.component';
import { SelectInputComponent } from '../select-input/select-input.component';

export interface Contact {
  nombre: string;
  email: string;
  telefono?: string;
}

@Component({
  selector: 'app-contacts-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    TextInputComponent
  ],
  templateUrl: './contacts-manager.component.html',
  styleUrl: './contacts-manager.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContactsManagerComponent),
      multi: true
    }
  ]
})
export class ContactsManagerComponent implements OnInit, ControlValueAccessor {
  contactsForm!: FormGroup;

  private onChange = (value: Contact[]) => {};
  private onTouched = () => {};

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }
  initForm(): void {
    this.contactsForm = this.fb.group({
      contacts: this.fb.array([]),
      newContact: this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        telefono: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]]
      })
    });
  }

  get contactsArray(): FormArray {
    return this.contactsForm.get('contacts') as FormArray;
  }

  get newContactForm(): FormGroup {
    return this.contactsForm.get('newContact') as FormGroup;
  }

  get contacts(): Contact[] {
    return this.contactsArray.value;
  }  addContact(): void {
    if (this.newContactForm.valid) {
      const newContact = this.newContactForm.value;

      const contactFormGroup = this.fb.group({
        nombre: [newContact.nombre, [Validators.required, Validators.maxLength(100)]],
        email: [newContact.email, [Validators.required, Validators.email, Validators.maxLength(100)]],
        telefono: [newContact.telefono || '', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]]
      });

      this.contactsArray.push(contactFormGroup);
      this.resetNewContactForm();
      this.emitChange();
    }
  }

  private resetNewContactForm(): void {
    this.newContactForm.reset({
      nombre: '',
      email: '',
      telefono: ''
    });
  }

  private emitChange(): void {
    this.onChange(this.contacts);
    this.onTouched();
  }
  // ControlValueAccessor implementation
  writeValue(value: Contact[]): void {
    if (value && Array.isArray(value)) {
      // Limpiar el FormArray actual
      while (this.contactsArray.length !== 0) {
        this.contactsArray.removeAt(0);
      }
      
      // Agregar los contactos existentes
      value.forEach(contact => {
        const contactFormGroup = this.fb.group({
          nombre: [contact.nombre, [Validators.required, Validators.maxLength(100)]],
          email: [contact.email, [Validators.required, Validators.email, Validators.maxLength(100)]],
          telefono: [contact.telefono || '', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]]
        });
        this.contactsArray.push(contactFormGroup);
      });
    }
  }

  registerOnChange(fn: (value: Contact[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }  getErrorMessage(controlName: string, formGroup?: FormGroup): string {
    const form = formGroup || this.newContactForm;
    const control = form.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `No debe exceder los ${maxLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Debe ingresar un email válido';
    }
    if (control?.hasError('pattern')) {
      return 'Formato de teléfono inválido';
    }
    return '';
  }
}
