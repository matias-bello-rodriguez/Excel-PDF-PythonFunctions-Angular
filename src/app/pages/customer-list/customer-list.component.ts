import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Añade esto
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { CustomerDialogComponent } from '../../components/customer-dialog/customer-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { TableColumn, TableData, SortConfig, TableFilter } from '../../types/table.types';
import { ClienteService } from '../../services/cliente.service';
import { ErrorService } from '../../services/error.service';
import { Cliente } from '../../interfaces/entities';
import { ClientStatus } from '../../interfaces/types';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, // Añade esto
    MatProgressSpinnerModule, // Añade esto
    MatIconModule, // Añade esto para mat-icon
    MatButtonModule, // Añade esto para mat-raised-button
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    FilterDialogComponent,
    ColumnDialogComponent,
    CustomerDialogComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
onEditCustomer($event: string) {
    this.editar($event);

}

  onDeleteCustomer($event: string) {
    this.eliminar($event);
  }

  onPinCustomer($event: string) {
    this.togglePin($event);
  }
  
  pageTitle: string = 'Gestión de Clientes';
  searchTerm: string = '';
  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text', sortable: true, draggable: false, visible: true },
    { key: 'nombre_empresa', label: 'Nombre', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'rut', label: 'RUT', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'email_contacto', label: 'Email', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'telefono_contacto', label: 'Teléfono', type: 'text', sortable: true, draggable: true, visible: true },
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
    codigo: 'text',
    nombre_empresa: 'text',
    rut: 'text',
    email_contacto: 'text',
    telefono_contacto: 'text',
    direccion: 'text',
    estado: 'text',
    actions: 'text'
  };
  uniqueValues: { [key: string]: string[] } = {};
  columnLabels: { [key: string]: string } = {
    codigo: 'Código',
    nombre_empresa: 'Nombre',
    rut: 'RUT',
    email_contacto: 'Email',
    telefono_contacto: 'Teléfono',
    direccion: 'Dirección',
    estado: 'Estado',
    actions: 'Acciones'
  };
filters: {
  [key: string]: {
    type: 'text' | 'date' | 'number' | 'boolean' | 'enum'; // Quitar 'currency'
    label: string; // Añadir esta propiedad obligatoria
    value?: string;
    from?: string | number | null;
    to?: string | number | null;
  };
} = {};  clientes: Cliente[] = [];  
  originalData: Cliente[] = [];
  data: Cliente[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  showCustomerDialog = false;
  editingCustomer: Cliente | null = null;
  originalClientes: Cliente[] = [];
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  isLoading = true;
  connectionError = false; // Asegúrate de añadir esta propiedad
  loadingMessage: string = '';

  constructor(
    public clienteService: ClienteService,
    public errorService: ErrorService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  async retryConnection() {
    this.connectionError = false;
    await this.ngOnInit();
  }

  async ngOnInit() {
  this.isLoading = true;
  this.connectionError = false;
  try {
    // Obtiene todos los clientes de la base de datos
    this.clientes = await this.clienteService.getAll();
    this.originalClientes = [...this.clientes];
    this.originalData = [...this.clientes];
    
    // Actualiza la configuración de paginación
    this.totalItems = this.clientes.length;
    this.paginationConfig.totalItems = this.totalItems;
    
    // Inicializa filtros y valores únicos basados en los datos reales
    this.initializeFilters();
    this.updateUniqueValues();
  } catch (error) {
    this.connectionError = true;
    this.errorService.handle(error, 'Cargando lista de clientes');
  } finally {
    this.isLoading = false;
  }
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

  async applySearch(): Promise<void> {
    this.isLoading = true;
    try {
      if (!this.searchTerm.trim()) {
        await this.resetSearch();
        return;
      }
      
      // Usa el servicio de cliente para búsquedas en la base de datos
      this.clientes = await this.clienteService.search(this.searchTerm, false);
      
      // Aplica ordenamiento de filas fijadas
      this.reorderClientes();
      
      // Actualiza paginación
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
      this.totalItems = this.clientes.length;
      this.paginationConfig.totalItems = this.totalItems;
    } catch (error) {
      this.errorService.handle(error, 'Buscando clientes');
    } finally {
      this.isLoading = false;
    }
  }

  async resetSearch(): Promise<void> {
  if (this.searchTerm.trim() === '' && !this.hasActiveFilters) {
    // No hay nada que resetear
    return;
  }
  
  this.isLoading = true;
  this.loadingMessage = 'Cargando proyectos...';
  
  try {
    this.searchTerm = '';
    
    // Si no tenemos los datos originales, cargarlos
    if (!this.originalClientes || this.originalClientes.length === 0) {
      this.originalClientes = await this.clienteService.getAll();
    }
    
    // Restaurar desde los datos originales
    this.clientes = [...this.originalClientes];
    this.data = [...this.originalClientes];
    
    // Aplica cualquier filtro activo
    await this.applyFilters();
  } catch (error) {
    this.errorService.handle(error, 'Cargando lista de clientes');
  } finally {
    this.isLoading = false;
    this.loadingMessage = '';
  }
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
        label: this.columnLabels[column] || column, // Usar la etiqueta de columna o el ID
        value: '',
      };
      if (
        this.columnTypes[column] === 'date' ||
        this.columnTypes[column] === 'number'
      ) {
        this.filters[column].from = null;
        this.filters[column].to = null;
      }
    }
  }
}

  private updateUniqueValues() {
    this.columnOrder.forEach(column => {
      if (this.columnTypes[column] === 'text' && column !== 'actions') {
        // Extrae valores únicos de los datos reales
        const values = new Set(
          this.clientes
            .map(item => item[column as keyof Cliente] as string)
            .filter(val => val !== null && val !== undefined)
        );
        this.uniqueValues[column] = Array.from(values).sort();
      }
    });
  }

  async resetFilters() {
    this.initializeFilters();
    this.hasActiveFilters = false;
    await this.resetSearch();
    this.showFilterMenu = false;
  }

  closeFilterMenu(): void {
    this.showFilterMenu = false;
  }

  async clearFilters(): Promise<void> {
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
    await this.resetSearch();
  }

  // --- FILTROS: filas fijadas son inmunes ---
  async applyFilters(newFilters?: { [key: string]: TableFilter }): Promise<void> {
    this.isLoading = true;
    try {
      if (newFilters) {
        this.filters = newFilters;
      }
      
      // Obtener todos los clientes de nuevo para filtrar
      let clientes = await this.clienteService.getAll();
      
      // Filtrar según los criterios
      for (const col in this.filters) {
        const filter = this.filters[col];
        if (filter.type === 'text' && (!filter.value || filter.value === '')) continue;
        if ((filter.type === 'date' || filter.type === 'number') && filter.from == null && filter.to == null) continue;
        
        switch (filter.type) {
          case 'text':
            clientes = clientes.filter(item =>
              filter.value ? String(item[col as keyof Cliente]).toLowerCase().includes(filter.value.toLowerCase()) : true
            );
            break;
          case 'date':
            // Implementar filtro de fechas si es necesario
            break;
          case 'number':
            // Implementar filtro numérico si es necesario
            break;
        }
      }
      
      // Mantener elementos fijados arriba
      const pinned = this.originalClientes.filter(item => this.pinnedItems.has(item.id));
      const unpinned = clientes.filter(item => !this.pinnedItems.has(item.id));
      this.clientes = [...pinned, ...unpinned];
      
      this.totalItems = this.clientes.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Aplicando filtros');
    } finally {
      this.isLoading = false;
    }
  }

  nuevoCliente() {
    this.editingCustomer = null;
    this.showCustomerDialog = true;
  }
  
  editar(id: string) {
    const cliente = this.clientes.find(c => c.id === id);
    if (cliente) {
      this.editingCustomer = { ...cliente };
      this.showCustomerDialog = true;
    }
  }
  
  async eliminar(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar desactivación',
        message: '¿Está seguro que desea desactivar este cliente?',
        confirmText: 'Desactivar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.isLoading = true;
        try {
          const success = await this.clienteService.delete(id);
          if (success) {
            this.errorService.showSuccess('Cliente desactivado correctamente');
            await this.resetSearch();
          }
        } catch (error) {
          this.errorService.handle(error, 'Desactivando cliente');
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  onRowClick(item: any): void {
    // Navegar a la vista detallada del cliente
    this.router.navigate(['/clientes', item.id]);
  }

  onSortChange(sortConfig: SortConfig): void {
    this.sortConfig = sortConfig;
    this.sortColumn = sortConfig.column;
    this.sortDirection = sortConfig.direction;
    
    // Aplicar ordenamiento sin volver a cargar datos
    this.isLoading = true;
    this.loadingMessage = 'Ordenando datos...';
    
    setTimeout(() => {
      this.applySort();
      this.isLoading = false;
    }, 0);
  }

  applySort(): void {
    if (!this.sortColumn) return;
    
    // Obtener elementos fijados y no fijados
    const pinnedItems = this.clientes.filter(item => this.pinnedItems.has(item.id));
    const unpinnedItems = this.clientes.filter(item => !this.pinnedItems.has(item.id));
    
    // Función de ordenación
    const sortFn = (a: Cliente, b: Cliente) => {
      const col = this.sortColumn as keyof Cliente;
      const valA = a[col] ?? '';
      const valB = b[col] ?? '';
      
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      
      return this.sortDirection === 'asc' ? comparison : comparison * -1;
    };
    
    // Ordenar cada grupo por separado
    pinnedItems.sort(sortFn);
    unpinnedItems.sort(sortFn);
    
    // Combinar grupos
    this.clientes = [...pinnedItems, ...unpinnedItems];
  }

  onColumnReorder(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map(col => col.key);
  }

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.paginationConfig.currentPage = page;
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
    const pinned = this.clientes.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.clientes.filter(item => !this.pinnedItems.has(item.id));
    this.clientes = [...pinned, ...unpinned];
  }

  closeCustomerDialog(): void {
    this.showCustomerDialog = false;
    this.editingCustomer = null;
  }

  async saveCustomer(customerData: Partial<Cliente>): Promise<void> {
    this.isLoading = true;
    try {
      if (this.editingCustomer) {
        // Actualizar cliente existente
        const updatedCliente = await this.clienteService.update(this.editingCustomer.id, customerData);
        if (updatedCliente) {
          this.errorService.showSuccess('Cliente actualizado correctamente');
          await this.resetSearch();
        }
      } else {
        // Crear nuevo cliente
        const newCliente = await this.clienteService.create(customerData);
        if (newCliente) {
          this.errorService.showSuccess('Cliente creado correctamente');
          await this.resetSearch();
        }
      }
      this.closeCustomerDialog();
    } catch (error) {
      this.errorService.handle(error, this.editingCustomer ? 'Actualizando cliente' : 'Creando cliente');
    } finally {
      this.isLoading = false;
    }
  }

  // Add this method to handle customer addition
  onAddCustomer() {
    this.editingCustomer = null;
    this.showCustomerDialog = true;
  }

  closeColumnMenu(): void {
    this.showColumnMenu = false;
  }

  applyColumnChanges(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map(col => col.key);
    this.defaultColumnOrder = [...this.columnOrder];
    this.tempColumnState.clear();
    this.showColumnMenu = false;
  } 

  cancelColumnChanges() {
    this.columns = JSON.parse(JSON.stringify(this.defaultColumns));
    this.columnOrder = this.columns.map(col => col.key);
    this.showColumnMenu = false;
  }

  onColumnVisibilityChange(column: TableColumn): void {
    if (column.visible) {
      this.tempColumnState.delete(column.key);
    } else {
      this.tempColumnState.add(column.key);
    }
  }


  onEditColumn(column: TableColumn): void {
    const dialogRef = this.dialog.open(ColumnDialogComponent, {
      width: '400px',
      data: { column }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedColumn = result as TableColumn;
        const index = this.columns.findIndex(col => col.key === updatedColumn.key);
        if (index !== -1) {
          this.columns[index] = updatedColumn;
          this.onColumnVisibilityChange(updatedColumn);
        }
      }
    });
  }


}


