import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { ProjectDialogComponent } from '../../components/project-dialog/project-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { TableColumn, TableData, SortConfig, TableFilter } from '../../types/table.types';
import { ProyectoService } from '../../services/proyecto.service';
import { ErrorService } from '../../services/error.service';
import { Proyecto } from '../../interfaces/entities';
import { ProjectStatus } from '../../interfaces/types';


@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    FilterDialogComponent,
    ColumnDialogComponent,
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {


  

  pageTitle: string = 'Gestión de Proyectos';
  searchTerm: string = '';
  columns: TableColumn[] = [
    {
      key: 'codigo',
      label: 'Código',
      type: 'text',
      sortable: true,
      draggable: false,
      visible: true,
    },
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'cliente',
      label: 'Cliente',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'fecha_inicio',
      label: 'Fecha Inicio',
      type: 'date',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'fecha_entrega',
      label: 'Fecha Entrega',
      type: 'date',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'monto',
      label: 'Monto',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      sortable: false,
      draggable: false,
      visible: true,
    },
  ];
  defaultColumns: TableColumn[] = JSON.parse(JSON.stringify(this.columns));
  columnOrder: string[] = this.columns.map((col) => col.key);
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
  OriginalProyectos: Proyecto[] = [];
  originalData: Proyecto[] = [];
  columnTypes: { [key: string]: 'text' | 'date' | 'number' } = {
    codigo: 'text',
    nombre: 'text',
    cliente: 'text',
    ubicacion: 'text',
    fecha_inicio: 'date',
    fecha_entrega: 'date',
    estado: 'text',
    monto: 'number',
    actions: 'text',
  };
  uniqueValues: { [key: string]: string[] } = {};
  columnLabels: { [key: string]: string } = {
    codigo: 'Código',
    nombre: 'Nombre',
    cliente: 'Cliente',
    ubicacion: 'Ubicación',
    fecha_inicio: 'Fecha Inicio',
    fecha_entrega: 'Fecha Entrega',
    estado: 'Estado',
    monto: 'Monto',
    actions: 'Acciones',
  };
  // Modificar la definición de filters para incluir la propiedad 'label'
  filters: {
    [key: string]: {
      type: 'text' | 'date' | 'number' | 'boolean' | 'enum'; // Quitar 'currency'
      label: string; // Añadir esta propiedad obligatoria
      value?: string;
      from?: string | number | null;
      to?: string | number | null;
    };
  } = {};

  proyectos: Proyecto[] = [];
  proyectosFormateados: any[] = [];
  originalProyectos: Proyecto[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  showProjectDialog = false;
  editingProject: Proyecto | null = null;
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  isLoading = true;
  loadingMessage: string = '';

  connectionError = false;

  constructor(
    public proyectoService: ProyectoService,
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
      // Obtener todos los proyectos de la base de datos
      this.proyectos = await this.proyectoService.getAll();
      this.originalProyectos = [...this.proyectos];

      // Formatear proyectos para mostrar en la tabla
      this.proyectosFormateados = this.formatearProyectos(this.proyectos);

      // Actualizar paginación
      this.totalItems = this.proyectosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;

      // Inicializar filtros y valores únicos
      this.initializeFilters();
      // Copia profunda de arrays grandes
this.OriginalProyectos = [...this.proyectos];
this.originalData = [...this.proyectos];

// Procesamiento de valores únicos en cada columna
this.updateUniqueValues();

// Reordenamiento de datos varias veces
this.reorderProyectos();
    } catch (error) {
      this.connectionError = true;
      this.errorService.handle(error, 'Cargando lista de proyectos');
    } finally {
      this.isLoading = false;
    }
  }

  // Método para editar columnas
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

  formatearProyectos(proyectos: Proyecto[]): any[] {
    return proyectos.map((proyecto) => {
      return {
        id: proyecto.id,
        codigo: proyecto.codigo,
        nombre: proyecto.nombre,
        cliente: proyecto.Cliente?.nombre || 'Sin cliente',
        ubicacion: proyecto.ubicacion,
        fecha_inicio: this.formatearFecha(proyecto.fecha_inicio),
        fecha_entrega: this.formatearFecha(proyecto.fecha_entrega),
        estado: this.formatearEstado(proyecto.estado),
        monto: this.formatearMonto(proyecto.presupuesto),
        proyecto_original: proyecto, // Guardamos el proyecto original para acceder a él cuando sea necesario
      };
    });
  }

  formatearFecha(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'No definida';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-CL');
  }

  formatearEstado(estado: ProjectStatus | undefined): string {
    if (!estado) return 'No definido';
    const estados: { [key in ProjectStatus]: string } = {
      planificacion: 'Planificación',
      en_curso: 'En curso',
      terminado: 'Finalizado',
      cancelado: 'Cancelado',
    };
    return estados[estado] || estado;
  }

  formatearMonto(monto: number | null | undefined): string {
    if (monto === null || monto === undefined) return 'No definido';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(monto);
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

      // Usar el servicio de proyecto para búsquedas en la base de datos
      const proyectos = await this.proyectoService.search(this.searchTerm);
      this.proyectos = proyectos;
      this.proyectosFormateados = this.formatearProyectos(proyectos);

      // Aplicar ordenamiento de filas fijadas
      this.reorderProyectos();

      // Actualizar paginación
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
      this.totalItems = this.proyectosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
    } catch (error) {
      this.errorService.handle(error, 'Buscando proyectos');
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
      if (!this.originalProyectos || this.originalProyectos.length === 0) {
        this.originalProyectos = await this.proyectoService.getAll();
      }
      
      // Restaurar desde los datos originales
      this.proyectos = [...this.originalProyectos];
      this.proyectosFormateados = this.formatearProyectos(this.proyectos);
      
      // Aplicar ordenamiento de filas fijadas
      this.reorderProyectos();
      
      // Resetear paginación
      this.totalItems = this.proyectosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Cargando lista de proyectos');
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
    this.columnOrder.forEach((column) => {
      if (this.columnTypes[column] === 'text' && column !== 'actions') {
        // Extraer valores únicos de los datos formateados
        const values = new Set(
          this.proyectosFormateados
            .map((item) => item[column])
            .filter((val) => val !== null && val !== undefined)
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
    Object.keys(this.filters).forEach((column) => {
      if (this.filters[column]) {
        this.filters[column].value = '';
        if (
          this.columnTypes[column] === 'date' ||
          this.columnTypes[column] === 'number'
        ) {
          this.filters[column].from = null;
          this.filters[column].to = null;
        }
      }
    });
    this.hasActiveFilters = false;
    await this.resetSearch();
  }

  async applyFilters(newFilters?: { [key: string]: TableFilter }): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Aplicando filtros...';
    
    try {
      if (newFilters) {
        // Type assertion to handle the type compatibility
        this.filters = newFilters as typeof this.filters;
      }
      
      // Verificar si hay filtros activos
      let hasActiveFilters = false;
      for (const col in this.filters) {
        const filter = this.filters[col];
        if (filter.type === 'text' && filter.value) {
          hasActiveFilters = true;
          break;
        } else if ((filter.type === 'date' || filter.type === 'number') && 
                  (filter.from !== null || filter.to !== null)) {
          hasActiveFilters = true;
          break;
        }
      }
      
      this.hasActiveFilters = hasActiveFilters;
      
      // Si no tenemos los datos originales o necesitamos recargar, hacerlo solo una vez
      if (!this.originalProyectos || this.originalProyectos.length === 0) {
        this.originalProyectos = await this.proyectoService.getAll();
      }
      
      // Filtrar desde los datos originales en memoria
      let proyectosFiltrados = [...this.originalProyectos];
      
      // Aplicar filtros si hay activos
      if (hasActiveFilters) {
        for (const col in this.filters) {
          const filter = this.filters[col];
          
          // Saltar si el filtro está vacío
          if (filter.type === 'text' && (!filter.value || filter.value === '')) continue;
          if ((filter.type === 'date' || filter.type === 'number') && 
              filter.from == null && filter.to == null) continue;
          
          switch (filter.type) {
            case 'text':
              proyectosFiltrados = proyectosFiltrados.filter(item => {
                const itemValue = item[col as keyof typeof item];
                return itemValue && String(itemValue).toLowerCase().includes(
                  (filter.value || '').toLowerCase()
                );
              });
              break;
              
            case 'date':
              if (filter.from || filter.to) {
                proyectosFiltrados = proyectosFiltrados.filter(item => {
                  const itemDate = item[col as keyof typeof item] ? 
                    new Date(item[col as keyof typeof item] as string) : null;
                  
                  if (!itemDate) return false;
                  
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
                proyectosFiltrados = proyectosFiltrados.filter(item => {
                  const itemValue = item[col as keyof typeof item] as number;
                  
                  if (itemValue === null || itemValue === undefined) return false;
                  
                  let matchesFrom = true;
                  let matchesTo = true;
                  
                  if (filter.from !== null) {
                    matchesFrom = itemValue >= Number(filter.from);
                  }
                  
                  if (filter.to !== null) {
                    matchesTo = itemValue <= Number(filter.to);
                  }
                  
                  return matchesFrom && matchesTo;
                });
              }
              break;
          }
        }
      }
      
      // Actualizar proyectos filtrados
      this.proyectos = proyectosFiltrados;
      
      // Formatear los proyectos para la tabla
      this.proyectosFormateados = this.formatearProyectos(this.proyectos);
      
      // Reordenar los proyectos (filas fijadas)
      this.reorderProyectos();
      
      // Actualizar paginación
      this.totalItems = this.proyectosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Aplicando filtros');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  nuevoProyecto() {
    this.editingProject = null;
    this.showProjectDialog = true;
  }

  editar(id: string) {
    const proyecto = this.proyectos.find((p) => p.id === id);
    if (proyecto) {
      this.editingProject = { ...proyecto };
      this.showProjectDialog = true;
    }
  }

  async eliminar(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message:
          '¿Está seguro que desea eliminar este proyecto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.isLoading = true;
        try {
          const success = await this.proyectoService.delete(id);
          if (success) {
            this.errorService.showSuccess('Proyecto eliminado correctamente');
            await this.resetSearch();
          }
        } catch (error) {
          this.errorService.handle(error, 'Eliminando proyecto');
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  onRowClick(item: any): void {
    // Navegar a la vista detallada del proyecto
    this.router.navigate(['/proyectos', item.id]);
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

  // Corregir el método sortTable
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      // Cambiar dirección si ya estaba ordenado por esta columna
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna de ordenamiento
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.sortConfig = { column, direction: this.sortDirection };
    this.applySort();
  }

  applySort(): void {
    if (!this.sortColumn) return;

    // Obtener elementos fijados y no fijados
    const pinnedItems = this.proyectosFormateados.filter((item) =>
      this.pinnedItems.has(item.id)
    );
    const unpinnedItems = this.proyectosFormateados.filter(
      (item) => !this.pinnedItems.has(item.id)
    );

    // Función de ordenación
    const sortFn = (a: any, b: any) => {
      const col = this.sortColumn as string;
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
    this.proyectosFormateados = [...pinnedItems, ...unpinnedItems];
  }

  onColumnReorder(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map((col) => col.key);
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
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
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
    this.reorderProyectos();
  }

  // Reordena: fijados arriba, luego no fijados
  private reorderProyectos() {
       // Siempre usar el array originalClientes para el orden base
    const pinned = this.proyectos.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.proyectos.filter(item => !this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...unpinned];
  }


  closeProjectDialog(): void {
    this.showProjectDialog = false;
    this.editingProject = null;
  }

  async saveProject(projectData: Partial<Proyecto>): Promise<void> {
    this.isLoading = true;
    try {
      if (this.editingProject) {
        // Actualizar proyecto existente
        const updatedProyecto = await this.proyectoService.update(
          this.editingProject.id,
          projectData
        );
        if (updatedProyecto) {
          this.errorService.showSuccess('Proyecto actualizado correctamente');
          await this.resetSearch();
        }
      } else {
        // Crear nuevo proyecto
        const newProyecto = await this.proyectoService.create(projectData);
        if (newProyecto) {
          this.errorService.showSuccess('Proyecto creado correctamente');
          await this.resetSearch();
        }
      }
      this.closeProjectDialog();
    } catch (error) {
      this.errorService.handle(
        error,
        this.editingProject ? 'Actualizando proyecto' : 'Creando proyecto'
      );
    } finally {
      this.isLoading = false;
    }
  }

  onAddProject() {
    this.editingProject = null;
    this.showProjectDialog = true;
  }

  onEditProject(id: string) {
    this.editar(id);
  }

  onDeleteProject(id: string) {
    this.eliminar(id);
  }

  onPinProject(id: string) {
    this.togglePin(id);
  }

  closeColumnMenu(): void {
    this.showColumnMenu = false;
  }

  applyColumnChanges(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map((col) => col.key);
    this.defaultColumnOrder = [...this.columnOrder];
    this.tempColumnState.clear();
    this.showColumnMenu = false;
  }

  cancelColumnChanges() {
    this.columns = JSON.parse(JSON.stringify(this.defaultColumns));
    this.columnOrder = this.columns.map((col) => col.key);
    this.showColumnMenu = false;
  }

  onColumnVisibilityChange(column: TableColumn): void {
    if (column.visible) {
      this.tempColumnState.delete(column.key);
    } else {
      this.tempColumnState.add(column.key);
    }
  }


  // Reordena: fijados arriba (en orden original), luego no fijados (en orden original)
  private reorderClientes() {
    // Siempre usar el array originalClientes para el orden base
    const pinned = this.proyectos.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.proyectos.filter(item => !this.pinnedItems.has(item.id));
    this.proyectos = [...pinned, ...unpinned];
  }

}
