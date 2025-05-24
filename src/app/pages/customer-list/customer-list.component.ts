import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { TableColumn, TableData, SortConfig, TableFilter } from '../../types/table.types';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    FilterDialogComponent,
    ColumnDialogComponent
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent {
  pageTitle: string = 'Gestión de Clientes';
  searchTerm: string = '';
  columns: TableColumn[] = [
    { key: 'id', label: 'Código', type: 'text', sortable: true, draggable: false, visible: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'rut', label: 'RUT', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'email', label: 'Email', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'telefono', label: 'Teléfono', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'direccion', label: 'Dirección', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'estado', label: 'Estado', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'actions', label: 'Acciones', type: 'actions', sortable: false, draggable: false, visible: true }
  ];
  defaultColumns: TableColumn[] = JSON.parse(JSON.stringify(this.columns));
  columnOrder: string[] = this.columns.map(col => col.key);
  defaultColumnOrder: string[] = [...this.columnOrder];
  tempColumnState: Set<string> = new Set();
  draggedColumn: string | null = null;
  sortConfig: SortConfig = { column: null, direction: 'asc' };
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  paginationConfig = { currentPage: 1, itemsPerPage: 10, totalItems: 0 };
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  columnTypes: { [key: string]: 'text' | 'date' | 'number' } = {
    id: 'text',
    nombre: 'text',
    rut: 'text',
    email: 'text',
    telefono: 'text',
    direccion: 'text',
    estado: 'text',
    actions: 'text'
  };
  uniqueValues: { [key: string]: string[] } = {};
  columnLabels: { [key: string]: string } = {
    id: 'Código',
    nombre: 'Nombre',
    rut: 'RUT',
    email: 'Email',
    telefono: 'Teléfono',
    direccion: 'Dirección',
    estado: 'Estado',
    actions: 'Acciones'
  };
  filters: { [key: string]: { type: 'text' | 'date' | 'number'; value?: string; from?: string | number | null; to?: string | number | null; }; } = {};
  clientes: Array<{
    id: string;
    nombre: string;
    rut: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: string;
    [key: string]: string;
  }> = [
    {
      id: 'CLI-2024-001',
      nombre: 'Constructora Andes',
      rut: '76.123.456-7',
      email: 'contacto@andes.cl',
      telefono: '+56 9 1234 5678',
      direccion: 'Av. Providencia 1234, Santiago',
      estado: 'activo'
    },
    {
      id: 'CLI-2024-002',
      nombre: 'Inmobiliaria Sur',
      rut: '77.987.654-3',
      email: 'info@sur.cl',
      telefono: '+56 9 8765 4321',
      direccion: 'Calle O’Higgins 456, Concepción',
      estado: 'activo'
    },
    {
      id: 'CLI-2024-003',
      nombre: 'Grupo Norte',
      rut: '78.456.789-0',
      email: 'ventas@norte.cl',
      telefono: '+56 9 1122 3344',
      direccion: 'Av. Brasil 789, Antofagasta',
      estado: 'inactivo'
    }
  ];
  originalData: any[] = [];
  data: any[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  originalClientes = [...this.clientes];
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();

  // --- PINNING Y ORDEN ORIGINAL ---
  // Guarda la posición original de cada cliente por id
  private originalIndexMap: { [id: string]: number } = {};

  constructor() {
    this.totalItems = this.clientes.length;
    this.paginationConfig.totalItems = this.totalItems;
    this.initializeFilters();
    this.updateUniqueValues();
    // Guardar el índice original de cada cliente
    this.clientes.forEach((c, i) => this.originalIndexMap[c.id] = i);
  }

  ngOnInit() {
    this.originalData = [...this.data];
  }

  getColumnLabel(colId: string): string {
    return this.columnLabels[colId] || colId;
  }

  // Métodos para Search Bar
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applySearch();
  }

  onSearchSubmit(value: string): void {
    this.searchTerm = value;
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchTerm.trim()) {
      this.resetSearch();
      return;
    }
    const searchTerm = this.searchTerm.toLowerCase().trim();
    // Solo buscar en no fijados
    const filtered = this.originalClientes.filter(item => {
      if (this.pinnedItems.has(item.id)) return false;
      return Object.keys(item).some(key => {
        if (key !== 'actions') {
          const value = String(item[key]).toLowerCase();
          return value.includes(searchTerm);
        }
        return false;
      });
    });
    // Los fijados siempre arriba
    const pinned = this.originalClientes.filter(item => this.pinnedItems.has(item.id));
    this.clientes = [...pinned, ...filtered];
    this.currentPage = 1;
    this.paginationConfig.currentPage = 1;
    this.totalItems = this.clientes.length;
    this.paginationConfig.totalItems = this.totalItems;
  }

  resetSearch(): void {
    this.clientes = [...this.originalClientes];
    this.applyFilters();
  }

  // Métodos para diálogos
  toggleFilterDialog(): void {
    this.showFilterMenu = !this.showFilterMenu;
  }

  toggleColumnDialog(): void {
    this.showColumnMenu = !this.showColumnMenu;
  }

  private initializeFilters() {
    for (const column of this.columnOrder) {
      if (column !== 'actions') {
        this.filters[column] = {
          type: this.columnTypes[column],
          value: '',
        };
        if (this.columnTypes[column] === 'date' || this.columnTypes[column] === 'number') {
          this.filters[column].from = null;
          this.filters[column].to = null;
        }
      }
    }
  }

  private updateUniqueValues() {
    this.columnOrder.forEach(column => {
      if (this.columnTypes[column] === 'text' && column !== 'actions') {
        const values = new Set(this.clientes.map(item => item[column]));
        this.uniqueValues[column] = Array.from(values).sort();
      }
    });
  }

  resetFilters() {
    this.initializeFilters();
    this.hasActiveFilters = false;
    this.clientes = [...this.originalClientes];
    this.showFilterMenu = false;
  }

  closeFilterMenu(): void {
    this.showFilterMenu = false;
  }

  clearFilters(): void {
    Object.keys(this.filters).forEach(column => {
      if (this.filters[column]) {
        this.filters[column].value = '';
        if (this.columnTypes[column] === 'date' || this.columnTypes[column] === 'number') {
          this.filters[column].from = null;
          this.filters[column].to = null;
        }
      }
    });
    this.hasActiveFilters = false;
    // Los fijados siempre arriba, el resto en orden original
    const pinned = this.originalClientes.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.originalClientes.filter(item => !this.pinnedItems.has(item.id));
    this.clientes = [...pinned, ...unpinned];
    this.totalItems = this.clientes.length;
    this.paginationConfig.totalItems = this.totalItems;
    this.currentPage = 1;
    this.paginationConfig.currentPage = 1;
  }

  // --- FILTROS: filas fijadas son inmunes ---
  applyFilters(newFilters?: { [key: string]: TableFilter }): void {
    if (newFilters) {
      this.filters = newFilters;
    }
    // Filtrar solo los no fijados
    let filteredData = this.originalClientes.filter(item => !this.pinnedItems.has(item.id));
    for (const col in this.filters) {
      const filter = this.filters[col];
      if (filter.type === 'text' && (!filter.value || filter.value === '')) continue;
      if ((filter.type === 'date' || filter.type === 'number') && filter.from == null && filter.to == null) continue;
      switch (filter.type) {
        case 'text':
          filteredData = filteredData.filter(item =>
            filter.value ? String(item[col]).toLowerCase().includes(filter.value.toLowerCase()) : true
          );
          break;
        case 'date':
          break;
        case 'number':
          break;
      }
    }
    // Los fijados siempre arriba, en orden original
    const pinned = this.originalClientes.filter(item => this.pinnedItems.has(item.id));
    this.clientes = [...pinned, ...filteredData];
    this.totalItems = this.clientes.length;
    this.currentPage = 1;
  }

  nuevoCliente() {
    console.log('Creando nuevo cliente desde CustomerListComponent');
  }
  editar(id: string) {
    console.log(`Editando cliente ${id} desde CustomerListComponent`);
  }
  eliminar(id: string) {
    console.log(`Eliminando cliente ${id} desde CustomerListComponent`);
  }

  onRowClick(item: any): void {
    console.log('Fila seleccionada:', item);
  }

  onSortChange(sortConfig: SortConfig): void {
    this.sortConfig = sortConfig;
    this.sortColumn = sortConfig.column;
    this.sortDirection = sortConfig.direction;
    this.applySort();
  }

  applySort(): void {
    // La ordenación se hace dentro del DataTable
  }

  onColumnReorder(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map(col => col.key);
  }

  sortTable(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    const pinnedItems = this.clientes.filter(item => this.pinnedItems.has(item.id));
    const unpinnedItems = this.clientes.filter(item => !this.pinnedItems.has(item.id));
    const sortFn = (a: any, b: any) => {
      const valA = a[column];
      const valB = b[column];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.sortDirection === 'asc' ? comparison : comparison * -1;
    };
    pinnedItems.sort(sortFn);
    unpinnedItems.sort(sortFn);
    this.clientes = [...pinnedItems, ...unpinnedItems];
  }

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.paginationConfig.itemsPerPage = size;
    const totalPages = this.getTotalPages();
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages || 1;
      this.paginationConfig.currentPage = this.currentPage;
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  onDragStart(event: DragEvent, columnId: string) {
    if (columnId === 'id' || columnId === 'actions') return;
    this.draggedColumn = columnId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', columnId);
    }
  }

  onDragOver(event: DragEvent, columnId: string) {
    if (columnId === 'id' || columnId === 'actions' || !this.draggedColumn) return;
    event.preventDefault();
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }
  }

  onDrop(event: DragEvent, targetColumnId: string) {
    event.preventDefault();
    if (targetColumnId === 'id' || targetColumnId === 'actions' || !this.draggedColumn) return;
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }
    const fromIndex = this.columnOrder.indexOf(this.draggedColumn);
    const toIndex = this.columnOrder.indexOf(targetColumnId);
    if (fromIndex !== -1 && toIndex !== -1) {
      this.columnOrder = Array.from(this.columnOrder);
      this.columnOrder.splice(fromIndex, 1);
      this.columnOrder.splice(toIndex, 0, this.draggedColumn);
    }
    this.draggedColumn = null;
  }

  onDragEnd() {
    this.draggedColumn = null;
    document.querySelectorAll('th.drag-over').forEach(th => {
      th.classList.remove('drag-over');
    });
  }

  toggleFilterMenu() {
    this.showFilterMenu = !this.showFilterMenu;
  }

  toggleColumnMenu() {
    if (!this.showColumnMenu) {
      this.tempColumnState = new Set(this.columnOrder);
    }
    this.showColumnMenu = !this.showColumnMenu;
  }

  closeColumnMenu(): void {
    this.showColumnMenu = false;
  }

  applyColumnChanges(newColumns?: TableColumn[]): void {
    if (newColumns) {
      this.columns = newColumns;
      this.columnOrder = newColumns.filter(col => col.visible !== false).map(col => col.key);
    }
    this.closeColumnMenu();
  }

  cancelColumnChanges(): void {
    this.resetColumns();
    this.closeColumnMenu();
  }

  isColumnSelected(columnId: string): boolean {
    return this.tempColumnState.has(columnId);
  }

  toggleColumnSelection(columnId: string): void {
    if (columnId === 'id') return;
    if (this.tempColumnState.has(columnId)) {
      this.tempColumnState.delete(columnId);
    } else {
      this.tempColumnState.add(columnId);
    }
  }

  isPinned(id: string): boolean {
    return this.pinnedItems.has(id);
  }

  togglePin(id: string) {
    const updated = new Set(this.pinnedItems);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    this.pinnedItems = updated;
    this.reorderClientes();
  }

  // Reordena: fijados arriba (en orden original), luego no fijados (en orden original)
  private reorderClientes() {
    // Siempre usar el array originalClientes para el orden base
    const pinned = this.originalClientes.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.originalClientes.filter(item => !this.pinnedItems.has(item.id));
    this.clientes = [...pinned, ...unpinned];
  }

  isColumnVisible(columnId: string): boolean {
    return this.columnOrder.includes(columnId);
  }

  toggleColumn(columnId: string) {
    if (columnId === 'id') return;
    const index = this.columnOrder.indexOf(columnId);
    if (index === -1) {
      this.columnOrder.push(columnId);
    } else {
      this.columnOrder.splice(index, 1);
    }
  }

  resetColumns() {
    this.columnOrder = [...this.defaultColumnOrder];
  }
}
