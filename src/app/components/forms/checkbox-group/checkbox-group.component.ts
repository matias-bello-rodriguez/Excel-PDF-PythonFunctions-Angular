import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface CheckboxOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-checkbox-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkbox-group.component.html',
  styleUrl: './checkbox-group.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxGroupComponent),
      multi: true
    }
  ]
})
export class CheckboxGroupComponent implements ControlValueAccessor {
  @Input() options: CheckboxOption[] = [];
  @Input() disabled: boolean = false;
  @Input() showOtherInput: boolean = false;
  @Input() otherInputPlaceholder: string = 'Especificar...';
  selectedValues: string[] = [];
  otherValue: string = '';
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string[]): void {
    this.selectedValues = value || [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onCheckboxChange(optionValue: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentValues = [...this.selectedValues];
    
    if (checkbox.checked) {
      if (!currentValues.includes(optionValue)) {
        currentValues.push(optionValue);
      }
    } else {
      const index = currentValues.indexOf(optionValue);
      if (index > -1) {
        currentValues.splice(index, 1);
      }
      
      // Si se deselecciona "otro", limpiar el campo de texto
      if (optionValue === 'otro') {
        this.otherValue = '';
      }
    }
    
    this.selectedValues = currentValues;
    this.onChange(this.selectedValues);
    this.onTouched();
  }

  onOtherInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.otherValue = input.value;
    // Emitir el evento para que el padre pueda manejar la validación
    this.onTouched();
  }

  isChecked(value: string): boolean {
    return this.selectedValues.includes(value);
  }

  isOtherSelected(): boolean {
    return this.selectedValues.includes('otro');
  }
}
