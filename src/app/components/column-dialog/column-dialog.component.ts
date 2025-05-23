import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TableColumn } from '../../types/table.types';

@Component({
  selector: 'app-column-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './column-dialog.component.html',
  styleUrl: './column-dialog.component.scss'
})
export class ColumnDialogComponent implements OnChanges {
  @Input() show: boolean = false;
  @Input() columns: TableColumn[] = [];
  @Input() defaultColumns: TableColumn[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() apply = new EventEmitter<TableColumn[]>();
  @Output() reset = new EventEmitter<void>();
  
  tempColumns: TableColumn[] = [];
  
  ngOnChanges(): void {
    if (this.show) {
      // Clonar el estado de las columnas actuales para trabajar con una copia
      this.tempColumns = JSON.parse(JSON.stringify(this.columns));
    }
  }
  
  closeDialog(): void {
    this.close.emit();
  }
  
  applyChanges(): void {
    this.apply.emit(this.tempColumns);
  }
  
  resetToDefault(): void {
    this.tempColumns = JSON.parse(JSON.stringify(this.defaultColumns));
    this.reset.emit();
  }
  
  isColumnSelected(column: TableColumn): boolean {
    return column.visible !== false;
  }
  
  toggleColumnSelection(column: TableColumn): void {
    const index = this.tempColumns.findIndex(col => col.key === column.key);
    if (index !== -1) {
      this.tempColumns[index].visible = !this.tempColumns[index].visible;
    }
  }
  
  isFixedColumn(column: TableColumn): boolean {
    return column.key === 'id' || column.key === 'actions';
  }
}
