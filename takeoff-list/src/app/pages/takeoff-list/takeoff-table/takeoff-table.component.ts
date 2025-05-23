import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestión de Cubicaciones</h1>
      <button class="btn-add" aria-label="Agregar nueva cubicación" (click)="addNew()">
        <i class="fas fa-plus" aria-hidden="true"></i>
        AGREGAR CUBICACIÓN
      </button>
    </div>
  `,
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Output() newCubicacion = new EventEmitter<void>();

  addNew() {
    this.newCubicacion.emit();
  }
}