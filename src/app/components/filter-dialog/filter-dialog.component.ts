import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TableColumn, TableFilter } from '../../types/table.types';

@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.scss'
})
export class FilterDialogComponent {
  @Input() show: boolean = false;
  @Input() columns: TableColumn[] = [];
  @Input() filters: { [key: string]: TableFilter } = {};
  @Input() uniqueValues: { [key: string]: string[] } = {};
  
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<{ [key: string]: TableFilter }>();
  @Output() clear = new EventEmitter<void>();
  
  tempFilters: { [key: string]: TableFilter } = {};
  
  ngOnChanges(): void {
    if (this.show) {
      // Clonar los filtros actuales para trabajar con una copia
      this.tempFilters = JSON.parse(JSON.stringify(this.filters));
    }
  }
  
  closeDialog(): void {
    this.close.emit();
  }
  
  applyFilters(): void {
    this.apply.emit(this.tempFilters);
    this.close.emit(); // Cierra el diálogo al aplicar
  }
  
  clearFilters(): void {
    for (const key in this.tempFilters) {
      if (this.tempFilters[key]) {
        this.tempFilters[key].value = '';
        if (this.tempFilters[key].type === 'date' || this.tempFilters[key].type === 'number') {
          this.tempFilters[key].from = null;
          this.tempFilters[key].to = null;
        }
      }
    }
    
    this.clear.emit();
  }
  
  getFilterableColumns(): TableColumn[] {
    return this.columns.filter(col => col.key !== 'actions');
  }
}
