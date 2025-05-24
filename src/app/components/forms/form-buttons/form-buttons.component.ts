import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-buttons.component.html',
  styleUrl: './form-buttons.component.scss'
})
export class FormButtonsComponent {
  @Input() submitText: string = 'Guardar';
  @Input() cancelText: string = 'Cancelar';
  @Input() showCancel: boolean = true;
  @Input() isSubmitting: boolean = false;
  @Input() isSubmitDisabled: boolean = false;
  @Input() alignment: 'left' | 'center' | 'right' = 'right';

  @Output() submitClick = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();

  onSubmit(): void {
    if (!this.isSubmitting && !this.isSubmitDisabled) {
      this.submitClick.emit();
    }
  }

  onCancel(): void {
    this.cancelClick.emit();
  }
}
