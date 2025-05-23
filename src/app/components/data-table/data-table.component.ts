import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableData, SortConfig } from '../../types/table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableData[] = [];
  @Input() sortConfig: SortConfig = { column: null, direction: 'asc' };
  @Input() loading: boolean = false;
  @Input() summary: string = '';
  @Input() pinnedItems: Set<string> = new Set();
  @Input() idField: string = 'id';
  @Input() activeFilters: boolean = false;

  @Output() rowClick = new EventEmitter<TableData>();
  @Output() sortChange = new EventEmitter<SortConfig>();
  @Output() editItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<string>();
  @Output() pinItem = new EventEmitter<string>();
  @Output() columnReorder = new EventEmitter<TableColumn[]>();

  // Drag and drop variables
  draggedColumn: string | null = null;
  
  getVisibleColumns(): TableColumn[] {
    return this.columns.filter(col => col.visible !== false);
  }
  
  getColumnKeys(): string[] {
    return this.getVisibleColumns().map(col => col.key);
  }
  
  onSort(column: TableColumn): void {
    if (!column.sortable) return;
    
    const newDirection = this.sortConfig.column === column.key && this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    this.sortConfig = {
      column: column.key,
      direction: newDirection
    };
    
    this.sortChange.emit(this.sortConfig);
  }
  
  isPinned(id: string): boolean {
    return this.pinnedItems.has(id);
  }
  
  onEdit(id: string, event: Event): void {
    event.stopPropagation();
    this.editItem.emit(id);
  }
  
  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteItem.emit(id);
  }
  
  onTogglePin(id: string, event: Event): void {
    event.stopPropagation();
    this.pinItem.emit(id);
  }
  
  onRowClick(item: TableData): void {
    this.rowClick.emit(item);
  }
  
  // Drag and drop methods for column reordering
  onDragStart(event: DragEvent, columnKey: string): void {
    if (!this.columns.find(col => col.key === columnKey)?.draggable) return;
    
    this.draggedColumn = columnKey;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnKey);
    }
  }
  
  onDragOver(event: DragEvent, columnKey: string): void {
    if (!this.draggedColumn || !this.columns.find(col => col.key === columnKey)?.draggable) return;
    
    event.preventDefault();
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.add('drag-over');
    }
  }
  
  onDragLeave(event: DragEvent): void {
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }
  }
  
  onDrop(event: DragEvent, targetColumnKey: string): void {
    event.preventDefault();
    
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }
    
    if (!this.draggedColumn || !this.columns.find(col => col.key === targetColumnKey)?.draggable) return;
    
    const sourceIndex = this.columns.findIndex(col => col.key === this.draggedColumn);
    const targetIndex = this.columns.findIndex(col => col.key === targetColumnKey);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newColumns = [...this.columns];
      const [removed] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(targetIndex, 0, removed);
      
      this.columnReorder.emit(newColumns);
    }
  }
  
  onDragEnd(): void {
    this.draggedColumn = null;
    document.querySelectorAll('th.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }
}
