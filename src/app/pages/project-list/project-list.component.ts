import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { TableColumn, TableData, SortConfig, TableFilter } from '../../types/table.types';

@Component({
  selector: 'app-project-list',
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
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent {
  pageTitle: string = 'Gestión de Proyectos';
  searchTerm: string = '';
  columns: TableColumn[] = [
    { key: 'id', label: 'Código', type: 'text', sortable: true, draggable: false, visible: true },
    { key: 'nombre', label: 'Nombre', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'cliente', label: 'Cliente', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'ubicacion', label: 'Ubicación', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'fechaInicio', label: 'Fecha Inicio', type: 'date', sortable: true, draggable: true, visible: true },
    { key: 'fechaEntrega', label: 'Fecha Entrega', type: 'date', sortable: true, draggable: true, visible: true },
    { key: 'estado', label: 'Estado', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'monto', label: 'Monto', type: 'number', sortable: true, draggable: true, visible: true },
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
    cliente: 'text',
    ubicacion: 'text',
    fechaInicio: 'date',
    fechaEntrega: 'date',
    estado: 'text',
    monto: 'number',
    actions: 'text'
  };
  uniqueValues: { [key: string]: string[] } = {};
  columnLabels: { [key: string]: string } = {
    id: 'Código',
    nombre: 'Nombre',
    cliente: 'Cliente',
    ubicacion: 'Ubicación',
    fechaInicio: 'Fecha Inicio',
    fechaEntrega: 'Fecha Entrega',
    estado: 'Estado',
    monto: 'Monto',
    actions: 'Acciones'
  };
  filters: { [key: string]: { type: 'text' | 'date' | 'number'; value?: string; from?: string | number | null; to?: string | number | null; }; } = {};
  proyectos: Array<{
    id: string;
    nombre: string;
    cliente: string;
    ubicacion: string;
    fechaInicio: string;
    fechaEntrega: string;
    estado: string;
    monto: string;
    [key: string]: string;
  }> = [
    {
      id: 'PRJ-2024-001',
      nombre: 'Edificio Central',
      cliente: 'Constructora Andes',
      ubicacion: 'Santiago',
      fechaInicio: '01/03/2024',
      fechaEntrega: '15/12/2024',
      estado: 'activo',
      monto: '$1.200.000.000'
    },
    {
      id: 'PRJ-2024-002',
      nombre: 'Parque Industrial',
      cliente: 'Inmobiliaria Sur',
      ubicacion: 'Concepción',
      fechaInicio: '10/04/2024',
      fechaEntrega: '30/11/2024',
      estado: 'activo',
      monto: '$850.000.000'
    },
    {
      id: 'PRJ-2024-003',
      nombre: 'Torre Norte',
      cliente: 'Grupo Norte',
      ubicacion: 'Antofagasta',
      fechaInicio: '20/02/2024',
      fechaEntrega: '10/10/2024',
      estado: 'inactivo',
      monto: '$950.000.000'
    }
  ];
  originalData: any[] = [];
  data: any[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  originalProyectos = [...this.proyectos];
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();

  // --- PINNING Y ORDEN ORIGINAL ---
  private originalIndexMap: { [id: string]: number } = {};
  constructor(private router: Router) {
    this.totalItems = this.proyectos.length;
    this.paginationConfig.totalItems = this.totalItems;
    this.initializeFilters();
    this.updateUniqueValues();
    this.proyectos.forEach((p, i) => this.originalIndexMap[p.id] = i);
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
    const filtered = this.originalProyectos.filter(item => {
      if (this.pinnedItems.has(item.id)) return false;
      return Object.keys(item).some(key => {
        if (key !== 'actions') {
          const value = String(item[key]).toLowerCase();
          return value.includes(searchTerm);
        }
        return false;
      });
    });
    const pinned = this.originalProyectos.filter(item => this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...filtered];
    this.currentPage = 1;
    this.paginationConfig.currentPage = 1;
    this.totalItems = this.proyectos.length;
    this.paginationConfig.totalItems = this.totalItems;
  }

  resetSearch(): void {
    this.proyectos = [...this.originalProyectos];
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
        const values = new Set(this.proyectos.map(item => item[column]));
        this.uniqueValues[column] = Array.from(values).sort();
      }
    });
  }

  resetFilters() {
    this.initializeFilters();
    this.hasActiveFilters = false;
    this.proyectos = [...this.originalProyectos];
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
    const pinned = this.originalProyectos.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.originalProyectos.filter(item => !this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...unpinned];
    this.totalItems = this.proyectos.length;
    this.paginationConfig.totalItems = this.totalItems;
    this.currentPage = 1;
    this.paginationConfig.currentPage = 1;
  }

  applyFilters(newFilters?: { [key: string]: TableFilter }): void {
    if (newFilters) {
      this.filters = newFilters;
    }
    let filteredData = this.originalProyectos.filter(item => !this.pinnedItems.has(item.id));
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
          if (filter.from || filter.to) {
            filteredData = filteredData.filter(item => {
              const [day, month, year] = item[col].split('/').map(Number);
              const itemDate = new Date(year, month - 1, day);
              let matchesFrom = true;
              let matchesTo = true;
              if (filter.from) {
                const filterFrom = new Date(filter.from as string);
                matchesFrom = itemDate >= filterFrom;
              }
              if (filter.to) {
                const filterTo = new Date(filter.to as string);
                matchesTo = itemDate <= filterTo;
              }
              return matchesFrom && matchesTo;
            });
          }
          break;
        case 'number':
          if (filter.from !== null || filter.to !== null) {
            filteredData = filteredData.filter(item => {
              const value = parseFloat(item[col].replace(/[^0-9.-]+/g, ""));
              let matchesFrom = true;
              let matchesTo = true;
              if (filter.from !== null) {
                matchesFrom = value >= (parseFloat(filter.from as string));
              }
              if (filter.to !== null) {
                matchesTo = value <= (parseFloat(filter.to as string));
              }
              return matchesFrom && matchesTo;
            });
          }
          break;
      }
    }
    const pinned = this.originalProyectos.filter(item => this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...filteredData];
    this.totalItems = this.proyectos.length;
    this.currentPage = 1;
  }  nuevoProyecto() {
    this.router.navigate(['/proyectos/agregar-proyecto']);
  }
  editar(id: string) {
    console.log(`Editando proyecto ${id} desde ProjectListComponent`);
  }
  eliminar(id: string) {
    console.log(`Eliminando proyecto ${id} desde ProjectListComponent`);
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
    const pinnedItems = this.proyectos.filter(item => this.pinnedItems.has(item.id));
    const unpinnedItems = this.proyectos.filter(item => !this.pinnedItems.has(item.id));
    const sortFn = (a: any, b: any) => {
      const valA = column === 'monto' ? 
        parseFloat(a[column].replace(/[^0-9.-]+/g, '')) : 
        a[column];
      const valB = column === 'monto' ? 
        parseFloat(b[column].replace(/[^0-9.-]+/g, '')) : 
        b[column];
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
    this.proyectos = [...pinnedItems, ...unpinnedItems];
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
    this.reorderProyectos();
  }

  private reorderProyectos() {
    const pinned = this.originalProyectos.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.originalProyectos.filter(item => !this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...unpinned];
  }

  resetColumns() {
    this.columnOrder = [...this.defaultColumnOrder];
  }
}
