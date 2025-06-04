import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableData, SortConfig } from '../../types/table.types';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import matchekbox from '@fortawesome/free-solid-svg-icons/faCheckSquare';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, MatIconModule, MatCheckboxModule],
  styleUrl: './data-table.component.scss',
  templateUrl: './data-table.component.html'
})


export class DataTableComponent implements OnChanges, OnInit, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableData[] = [];
  @Input() sortConfig: SortConfig = { column: null, direction: 'asc' };
  @Input() loading: boolean = false;
  @Input() summary: string = '';
  @Input() pinnedItems: Set<string> = new Set();
  @Input() idField: string = 'id';
  @Input() activeFilters: boolean = false;
  @Input() isCubicacion: boolean = false; // Nueva propiedad

  @Output() rowClick = new EventEmitter<TableData>();
  @Output() sortChange = new EventEmitter<SortConfig>();
  @Output() editItem = new EventEmitter<string>();
  @Output() deleteItem = new EventEmitter<string>();
  @Output() pinItem = new EventEmitter<string>();
  @Output() columnReorder = new EventEmitter<TableColumn[]>();
  @Output() columnVisibilityChange = new EventEmitter<TableColumn[]>();
  @Output() viewDetail = new EventEmitter<string>();
  @Output() verProductos = new EventEmitter<string>();

  // Drag and drop variables
  draggedColumn: string | null = null;
  showColumnMenu: boolean = false;
  columnMenuAnchor: HTMLElement | null = null;

  hasProyectoColumn = false;
  private clickListener?: () => void;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Solo agregar el event listener si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.clickListener = () => {
        if (this.showColumnMenu) {
          this.closeColumnMenu();
        }
      };
      document.addEventListener('click', this.clickListener);
    }
  }

  ngOnDestroy(): void {
    // Limpiar el event listener cuando el componente se destruye
    if (isPlatformBrowser(this.platformId) && this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.hasProyectoColumn = this.columns?.some(col => col.key === 'proyecto');
    }
  }

  getVisibleColumns(): TableColumn[] {
    // Mantiene el orden original de las columnas y solo filtra las visibles
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
  
  onVerProductos(id: string): void {
    this.verProductos.emit(id);
  }
  
  // --- Column visibility menu logic ---
  toggleColumnMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showColumnMenu = !this.showColumnMenu;
    this.columnMenuAnchor = event.target as HTMLElement;
  }

  closeColumnMenu(): void {
    this.showColumnMenu = false;
    this.columnMenuAnchor = null;
  }

  onColumnVisibilityChange(column: TableColumn): void {
    if (column.key === 'id' || column.key === 'actions') return;
    const idx = this.columns.findIndex(col => col.key === column.key);
    if (idx !== -1) {
      this.columns[idx].visible = !this.columns[idx].visible;
      this.columnVisibilityChange.emit([...this.columns]);
    }
  }
  isColumnFixed(column: TableColumn): boolean {
    return column.key === 'id' || column.key === 'actions';
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

  // Devuelve true si el item pasa los filtros activos (debe implementarse según tu lógica de filtros)
  passesFilters(item: TableData): boolean {
    // Esta función debe sobrescribirse en el componente padre según la lógica de filtros real
    // Aquí solo es un placeholder que siempre devuelve true
    return true;
  }

  getFilteredData(): TableData[] {
    // Si no hay filtros activos, mostrar todos los datos
    if (!this.activeFilters) return this.data;
    
    // Obtener IDs de elementos fijados
    const pinnedIds = Array.from(this.pinnedItems);
    
    // Separar los elementos fijados - estos SIEMPRE se mostrarán
    const pinnedRows = this.data.filter(item => pinnedIds.includes(item[this.idField]));
    
    // Filtrar solo los elementos no fijados
    const filteredRows = this.data.filter(item => {
      // Si el elemento está fijado, no lo incluimos aquí (ya está en pinnedRows)
      if (pinnedIds.includes(item[this.idField])) return false;
      
      // Si no está fijado, aplicamos los filtros normalmente
      return this.passesFilters(item);
    });
    
    // Devolver primero los elementos fijados y luego los filtrados
    return [...pinnedRows, ...filteredRows];
  }  /**
   * Maneja errores al cargar imágenes
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.classList.add('image-error');
    
    try {
      // Guardar la URL original para posible diagnóstico
      const originalSrc = imgElement.src;
      
      // Establecer una imagen predeterminada
      imgElement.src = 'assets/images/no-image.png';
      imgElement.title = 'No se pudo cargar la imagen. URL original: ' + originalSrc;
    } catch (err) {
      console.error('Error al manejar imagen fallida:', err);
    }
  }

  /**
   * Maneja clics en la imagen
   */
  onImageClick(imageUrl: string, event: Event): void {
    event.stopPropagation(); // Evitar activar el evento de fila
    
    // Abre la imagen en una pestaña nueva
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }

  // Determina si un item tiene una imagen
  hasImage(item: TableData): boolean {
    // Busca una columna de tipo 'image' y verifica si el item tiene valor para esa columna
    const imageColumn = this.columns.find(col => col.type === 'image');
    if (imageColumn && item[imageColumn.key]) {
      return true;
    }
    return false;
  }
}
