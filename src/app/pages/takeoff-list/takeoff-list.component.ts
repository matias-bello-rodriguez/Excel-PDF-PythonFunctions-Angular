import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip'; // Añadir esta importación
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { TableColumn, TableData, SortConfig, TableFilter } from '../../types/table.types';
import { CubicacionService } from '../../services/cubicacion.service';
import { ErrorService } from '../../services/error.service';
import { Cubicacion } from '../../interfaces/entities';
import { CacheService } from '@app/services/cache.service';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-takeoff-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule, // Añadir esta línea
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    FilterDialogComponent,
    ColumnDialogComponent,
  ],
  providers: [NavigationService], // Añadir el servicio aquí
  templateUrl: './takeoff-list.component.html',
  styleUrl: './takeoff-list.component.scss'
})
export class TakeoffListComponent implements OnInit, OnDestroy {
  // Propiedades de la página
  pageTitle: string = 'Gestión de Cubicaciones';
  
  // Propiedades de búsqueda
  searchTerm: string = '';
  
  // Propiedades de columnas y tabla
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
      key: 'proyecto',
      label: 'Proyecto',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'fecha',
      label: 'Fecha',
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
      key: 'monto_total',
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
  columnOrder: string[] = this.columns.map(col => col.key);
  defaultColumnOrder: string[] = [...this.columnOrder];
  tempColumnState: Set<string> = new Set();
  draggedColumn: string | null = null;
  
  // Propiedades de ordenamiento
  sortConfig: SortConfig = {
    column: null,
    direction: 'asc'
  };
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Propiedades de paginación
  paginationConfig = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  };
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Propiedades de filtros
  columnTypes: { [key: string]: 'text' | 'date' | 'number' | 'boolean' | 'enum' } = {
    cubicacion_id: 'text',
    codigo: 'text',
    nombre: 'text',
    tipo_producto: 'enum',
    categoria: 'text',
    ubicacion: 'text',
    cantidad: 'number',
    ancho_diseno: 'number',
    alto_diseno: 'number',
    superficie_unitaria: 'number',
    superficie_total: 'number',
    ancho_manufactura: 'number',
    alto_manufactura: 'number',
    material: 'text', 
    seccion_perfil: 'text',
    color_estructura: 'text',
    espesor_vidrio: 'text',
    proteccion_vidrio: 'text',
    color_pelicula: 'text',
    tipo_vidrio: 'enum',
    tipo_vidrio_detalle: 'text',
    aperturas: 'text',  // Nueva columna unificada
    cerraduras: 'text', // Nueva columna unificada
    precio_unitario: 'number', // Cambiado de 'currency' a 'number'
    precio_total: 'number',    // Cambiado de 'currency' a 'number'
    factor_instalacion: 'number',
    descripcion: 'text',
    observaciones: 'text',
    activo: 'boolean',
    fecha_creacion: 'date',
    fecha_actualizacion: 'date',
    actions: 'text',
  };

  uniqueValues: { [key: string]: string[] } = {};

  columnLabels: { [key: string]: string } = {
    codigo: 'Código',
    nombre: 'Nombre',
    proyecto: 'Proyecto',
    fecha: 'Fecha',
    estado: 'Estado',
    monto_total: 'Monto',
    actions: 'Acciones'
  };

  filters: {
    [key: string]: {
      type: 'text' | 'date' | 'number' | 'boolean' | 'enum';
      label: string; // Propiedad requerida
      value?: string;
      from?: string | number | null;
      to?: string | number | null;
    };
  } = {};

  // Datos
  cubicaciones: Cubicacion[] = [];
  cubicacionesFormateadas: any[] = [];
  originalCubicaciones: Cubicacion[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  isLoading = true;
  connectionError = false;
  loadingMessage: string = '';

  private refreshSubscription: Subscription | null = null;
  supabase: any;
  
  constructor(
    private cubicacionService: CubicacionService,
    private errorService: ErrorService,
    private router: Router,
    private dialog: MatDialog,
    private cacheService: CacheService,
    private navigationService: NavigationService
  ) {}
  
  ngOnInit() {
    // Verificar si necesitamos refrescar al cargar
    const needsRefresh = this.navigationService.checkIfRefreshNeeded('cubicaciones');
    
    // Cargar datos iniciales
    this.loadData(needsRefresh);
    
    // Suscribirse a eventos de refresco
    this.refreshSubscription = this.cacheService.getRefreshObservable('cubicaciones')
      .subscribe((shouldRefresh: any) => {
        if (shouldRefresh) {
          console.log('Evento de refresco recibido en TakeoffListComponent');
          this.loadData(true);
        }
      });
  }
  
  ngOnDestroy() {
    // Limpiar suscripción al destruir componente
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  // Método mejorado para cargar datos
  async loadData(forceRefresh: boolean = false) {
    console.log('INICIO loadData en TakeoffListComponent, forceRefresh:', forceRefresh);
    this.isLoading = true;
    this.loadingMessage = 'Cargando cubicaciones...';
    
    try {
      console.log('Solicitando datos al servicio...');
      // Obtener todas las cubicaciones de la base de datos
      this.cubicaciones = await this.cubicacionService.getAll(forceRefresh);
      console.log(`Cubicaciones recibidas: ${this.cubicaciones.length}`);
      
      if (this.cubicaciones.length === 0) {
        console.warn('¡Alerta! Se recibieron 0 cubicaciones');
      }
      
      this.originalCubicaciones = [...this.cubicaciones];
      console.log('Copiados datos originales');
      
      // Formatear cubicaciones para mostrar en la tabla
      this.cubicacionesFormateadas = this.formatearCubicaciones(this.cubicaciones);
      console.log(`Datos formateados: ${this.cubicacionesFormateadas.length}`);
      
      // Actualizar paginación
      this.totalItems = this.cubicacionesFormateadas.length;
      this.paginationConfig.totalItems = this.totalItems;
      console.log(`Paginación actualizada: ${this.totalItems} items`);
      
      // Inicializar filtros y valores únicos
      this.initializeFilters();
      this.updateUniqueValues();
      console.log('Filtros y valores únicos actualizados');
      
      // Reordenar las cubicaciones (si hay items fijados)
      this.reorderCubicaciones();
      console.log('Elementos reordenados');
      
      this.connectionError = false;
      console.log('FIN loadData - completado con éxito');
    } catch (error) {
      console.error('ERROR en loadData:', error);
      this.connectionError = true;
      this.errorService.handle(error, 'Cargando lista de cubicaciones');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }



  // Método para recargar manualmente
  async refreshData() {
    console.log('Forzando recarga manual de datos');
    await this.loadData(true);
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

  formatearCubicaciones(cubicaciones: Cubicacion[]): any[] {
    return cubicaciones.map(cubicacion => {
      return {
        id: cubicacion.id,
        codigo: cubicacion.codigo || '',
        nombre: cubicacion.nombre || '',
        proyecto: cubicacion.Proyecto?.nombre || 'Sin proyecto',
        fecha: this.formatearFecha(cubicacion.fecha_cubicacion || cubicacion.fecha_creacion),
        estado: cubicacion.estado || '',
        monto_total: this.formatearMonto(cubicacion.monto_total),
        cubicacion_original: cubicacion // Guardamos el original para acceder a otros datos
      };
    });
  }

  formatearFecha(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'No definida';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-CL');
  }

  formatearMonto(monto: number | null | undefined): string {
    if (monto === null || monto === undefined) return 'No definido';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);
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
    this.loadingMessage = 'Buscando...';
    
    try {
      if (!this.searchTerm.trim()) {
        await this.resetSearch();
        return;
      }
      
      const searchTerm = this.searchTerm.toLowerCase().trim();
      let filteredCubicaciones = this.originalCubicaciones.filter(item => {
        // Buscar en todos los campos de texto
        return (
          (item.nombre?.toLowerCase().includes(searchTerm)) ||
          (item.codigo?.toLowerCase().includes(searchTerm)) ||
          (item.Proyecto?.nombre?.toLowerCase().includes(searchTerm)) ||
          (item.estado?.toLowerCase().includes(searchTerm))
        );
      });
      
      this.cubicaciones = filteredCubicaciones;
      this.cubicacionesFormateadas = this.formatearCubicaciones(filteredCubicaciones);
      
      // Aplicar ordenamiento de filas fijadas
      this.reorderCubicaciones();
      
      // Actualizar paginación
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
      this.totalItems = this.cubicacionesFormateadas.length;
      this.paginationConfig.totalItems = this.totalItems;
    } catch (error) {
      this.errorService.handle(error, 'Buscando cubicaciones');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }
  
  async resetSearch(): Promise<void> {
    if (this.searchTerm.trim() === '' && !this.hasActiveFilters) {
      // No hay nada que resetear
      return;
    }
    
    this.isLoading = true;
    this.loadingMessage = 'Cargando cubicaciones...';
    
    try {
      this.searchTerm = '';
      
      // Si no tenemos los datos originales, cargarlos
      if (!this.originalCubicaciones || this.originalCubicaciones.length === 0) {
        this.originalCubicaciones = await this.cubicacionService.getAll();
      }
      
      // Restaurar desde los datos originales
      this.cubicaciones = [...this.originalCubicaciones];
      this.cubicacionesFormateadas = this.formatearCubicaciones(this.cubicaciones);
      
      // Aplicar ordenamiento de filas fijadas
      this.reorderCubicaciones();
      
      // Resetear paginación
      this.totalItems = this.cubicacionesFormateadas.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Cargando lista de cubicaciones');
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
          label: this.columnLabels[column] || column, // Propiedad requerida
          value: '',
        };
        if (
          this.columnTypes[column] === 'date' ||
          this.columnTypes[column] === 'number' // Ya no hay que verificar 'currency'
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
        const values = new Set(
          this.cubicacionesFormateadas
            .map(item => item[column])
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

  async applyFilters(newFilters?: { [key: string]: TableFilter }): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Aplicando filtros...';
    
    try {
      if (newFilters) {
        // Convert newFilters to match the expected type
        Object.keys(newFilters).forEach(key => {
          if (newFilters[key]) {
            const filter = newFilters[key];
            const type = filter.type as 'text' | 'date' | 'number';
            
            // Only assign if the type is compatible
            if (type === 'text' || type === 'date' || type === 'number') {
              this.filters[key] = {
                type,
                label: this.columnLabels[key] || key,
                value: filter.value,
                from: filter.from,
                to: filter.to
              };
            }
          }
        });
      }
      
      // Verificar si hay filtros activos
      let hasActiveFilters = false;
      for (const col in this.filters) {
        const filter = this.filters[col];
        if (filter.type === 'text' || filter.type === 'enum' || filter.type === 'boolean') {
          if (filter.value && filter.value !== '') {
            hasActiveFilters = true;
            break;
          }
        } else if ((filter.type === 'date' || filter.type === 'number') && // Ya no verificar 'currency'
                 (filter.from !== null || filter.to !== null)) {
          hasActiveFilters = true;
          break;
        }
      }
      
      this.hasActiveFilters = hasActiveFilters;
      
      // Si no tenemos los datos originales, cargarlos
      if (!this.originalCubicaciones || this.originalCubicaciones.length === 0) {
        this.originalCubicaciones = await this.cubicacionService.getAll();
      }
      
      // Filtrar desde los datos originales en memoria
      let cubicacionesFiltradas = [...this.originalCubicaciones];
      
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
              cubicacionesFiltradas = cubicacionesFiltradas.filter(item => {
                // Manejar diferentes campos de texto
                let itemValue = '';
                if (col === 'proyecto') {
                  itemValue = item.Proyecto?.nombre || '';
                } else {
                  itemValue = item[col as keyof typeof item] as string || '';
                }
                return itemValue.toLowerCase().includes((filter.value || '').toLowerCase());
              });
              break;
              
            case 'date':
              if (filter.from || filter.to) {
                cubicacionesFiltradas = cubicacionesFiltradas.filter(item => {
                  // Manejar diferentes campos de fecha
                  let dateValue: Date | null = null;
                  if (col === 'fecha') {
                    dateValue = item.fecha_creacion ? new Date(item.fecha_creacion) : null;
                  }
                  
                  if (!dateValue) return false;
                  
                  let matchesFrom = true;
                  let matchesTo = true;
                  
                  if (filter.from) {
                    const filterFrom = new Date(filter.from as string);
                    matchesFrom = dateValue >= filterFrom;
                  }
                  
                  if (filter.to) {
                    const filterTo = new Date(filter.to as string);
                    matchesTo = dateValue <= filterTo;
                  }
                  
                  return matchesFrom && matchesTo;
                });
              }
              break;
              
            case 'number': // Ya no hay caso separado para 'currency'
              if (filter.from !== null || filter.to !== null) {
                cubicacionesFiltradas = cubicacionesFiltradas.filter(item => {
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
      
      // Actualizar cubicaciones filtradas
      this.cubicaciones = cubicacionesFiltradas;
      
      // Formatear las cubicaciones para la tabla
      this.cubicacionesFormateadas = this.formatearCubicaciones(this.cubicaciones);
      
      // Reordenar las cubicaciones (filas fijadas)
      this.reorderCubicaciones();
      
      // Actualizar paginación
      this.totalItems = this.cubicacionesFormateadas.length;
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

  nuevaCubicacion() {
    this.navigationService.navigateWithRefresh(['/cubicaciones/agregar']);
  }

  editar(id: string) {
    this.navigationService.navigateWithRefresh(['/cubicaciones/editar', id]);
  }

  async eliminar(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro que desea eliminar esta cubicación? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.isLoading = true;
        this.loadingMessage = 'Eliminando cubicación...';
        try {
          const success = await this.cubicacionService.delete(id);
          if (success) {
            this.errorService.showSuccess('Cubicación eliminada correctamente');
            // Forzar recarga de datos
            await this.loadData(true);
          }
        } catch (error) {
          this.errorService.handle(error, 'Eliminando cubicación');
        } finally {
          this.isLoading = false;
          this.loadingMessage = '';
        }
      }
    });
  }  // Método auxiliar para logs en el template
  logButtonClick(id: string): void {
    console.log('Botón Ver productos clickeado para ID:', id);
  }

  // Implementación de la función verDetalleProductos
  // Implementar este método si no existe
async verDetalleProductos(id: string) {
  console.log('Navegando a detalles de productos para cubicación:', id);
  if (!id) {
    console.error('ID de cubicación inválido');
    return;
  }
  
  try {
    // Navegar a la página de detalles de productos usando el ID
    this.router.navigate(['/cubicaciones/productos', id]);
  } catch (error) {
    console.error('Error al navegar a detalles de productos:', error);
    this.errorService.handle(error, 'Navegando a detalles de productos');
  }
}

  // Añadir método adicional para gestionar la acción desde el DataTableComponent
  onVerDetalleProductos(id: string): void {
    this.verDetalleProductos(id);
  }

  onRowClick(item: any): void {
    // Navegar a la vista detallada de la cubicación
    this.router.navigate(['/cubicaciones/detalle', item.id]);
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
    const pinnedItems = this.cubicacionesFormateadas.filter(item => this.pinnedItems.has(item.id));
    const unpinnedItems = this.cubicacionesFormateadas.filter(item => !this.pinnedItems.has(item.id));

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
    this.cubicacionesFormateadas = [...pinnedItems, ...unpinnedItems];
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
    this.reorderCubicaciones();
  }

  // Reordena: fijados arriba, luego no fijados
  private reorderCubicaciones() {
    const pinned = this.cubicacionesFormateadas.filter(item => this.pinnedItems.has(item.id));
    const unpinned = this.cubicacionesFormateadas.filter(item => !this.pinnedItems.has(item.id));
    this.cubicacionesFormateadas = [...pinned, ...unpinned];
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

  // Método para reintentar la conexión cuando hay un error
  async retryConnection() {
    console.log('Intentando reconexión desde TakeoffListComponent...');
    this.isLoading = true;
    this.loadingMessage = 'Intentando reconectar...';
    this.connectionError = false;
    
    try {
      // Primero, intentar limpiar el almacenamiento de autenticación
      const supabaseService = this.supabase || (this.cubicacionService as any).supabase;
      if (supabaseService) {
        // Intentar limpiar tokens y reconectar
        if (typeof supabaseService.clearAuthStorage === 'function') {
          supabaseService.clearAuthStorage();
        }
        
        // Intentar reconectar
        if (typeof supabaseService.reconnect === 'function') {
          await supabaseService.reconnect();
        }
      }
      
      // Recargar datos después de reconectar
      await this.loadData(true);
    } catch (error) {
      console.error('Error al intentar reconectar:', error);
      this.errorService.handle(error, 'Intentando reconectar');
      this.connectionError = true;
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }
}
