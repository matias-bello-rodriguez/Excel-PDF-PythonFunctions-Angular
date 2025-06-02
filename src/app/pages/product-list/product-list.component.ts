import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { ProductoService } from '../../services/producto.service';
import { ErrorService } from '../../services/error.service';
import { Cubicacion, Producto } from '../../interfaces/entities';
import { CacheService } from '../../services/cache.service';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { ProyectoService } from '../../services/proyecto.service';

// Definición de enumeraciones
export enum GlassType {
  TRANSPARENTE = 'transparente',
  OPACO = 'opaco',
  MIXTO = 'mixto'
}

export enum ProductType {
  VENTANA_SIMPLE = 'ventana_simple',
  VENTANA_MULTIPLE = 'ventana_multiple',
  PUERTA = 'puerta',
  MAMPARA = 'mampara'
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    FilterDialogComponent,
    ColumnDialogComponent,
  ],
  providers: [NavigationService],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit, OnDestroy {
  // Enumeraciones para usar en el componente
  glassTypes = GlassType;
  productTypes = ProductType;


  // Variables para gestionar la cubicación
  cubicacionId: string | null = null;
  cubicacionCodigo: string | null = null;


  cubicaciones: Cubicacion[] = [];


  // Propiedades de la página
  pageTitle: string = 'Cargando información de cubicación...';
  cubicacionInfo: Cubicacion | null = null;
  searchTerm: string = '';

  // Propiedades de columnas y tabla
  columns: TableColumn[] = [
    {
      key: 'cubicacion_id',
      label: 'Cubicación',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'codigo',
      label: 'Código',
      type: 'text',
      sortable: true,
      draggable: true,
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
      key: 'tipo_producto',
      label: 'Tipo',
      type: 'enum',
      sortable: true,
      draggable: true,
      visible: true,
      enumValues: Object.values(ProductType),
    },
    {
      key: 'categoria',
      label: 'Categoría',
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
      key: 'cantidad',
      label: 'Cantidad',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'ancho_diseno',
      label: 'Ancho Diseño',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'alto_diseno',
      label: 'Alto Diseño',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'superficie_unitaria',
      label: 'Superficie Unitaria (m²)',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'superficie_total',
      label: 'Superficie Total (m²)',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'ancho_manufactura',
      label: 'Ancho Manufactura',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'alto_manufactura',
      label: 'Alto Manufactura',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'material',
      label: 'Material',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'seccion_perfil',
      label: 'Sección Perfil',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'color_estructura',
      label: 'Color Estructura',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'espesor_vidrio',
      label: 'Espesor Vidrio',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'proteccion_vidrio',
      label: 'Protección Vidrio',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'color_pelicula',
      label: 'Color Película',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'tipo_vidrio',
      label: 'Tipo Vidrio',
      type: 'enum',
      sortable: true,
      draggable: true,
      visible: true,
      enumValues: Object.values(GlassType),
    },
    {
      key: 'tipo_vidrio_detalle',
      label: 'Detalle Vidrio',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'aperturas',
      label: 'Aperturas',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'cerraduras',
      label: 'Cerraduras',
      type: 'text',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'precio_unitario',
      label: 'Precio Unitario',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'precio_total',
      label: 'Precio Total',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'factor_instalacion',
      label: 'Factor Instalación',
      type: 'number',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      type: 'text',
      sortable: false,
      draggable: true,
      visible: true,
    },
    {
      key: 'observaciones',
      label: 'Observaciones',
      type: 'text',
      sortable: false,
      draggable: true,
      visible: true,
    },
    {
      key: 'activo',
      label: 'Activo',
      type: 'boolean',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'fecha_creacion',
      label: 'Fecha Creación',
      type: 'date',
      sortable: true,
      draggable: true,
      visible: true,
    },    {
      key: 'fecha_actualizacion',
      label: 'Fecha Actualización',
      type: 'date',
      sortable: true,
      draggable: true,
      visible: true,
    },
    {
      key: 'imagen',
      label: 'Img',
      type: 'image',  // Asegúrate de que este valor sea 'image'
      sortable: false,
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
  originalProductos: Producto[] = [];
  columnTypes: {
    [key: string]: 'text' | 'date' | 'number' | 'boolean' | 'enum' | 'image';
  } = {
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
    aperturas: 'text', // Nueva columna unificada
    cerraduras: 'text', // Nueva columna unificada
    precio_unitario: 'number', // Cambiado de 'currency' a 'number'
    precio_total: 'number', // Cambiado de 'currency' a 'number'
    factor_instalacion: 'number',
    descripcion: 'text',    observaciones: 'text',
    activo: 'boolean',    fecha_creacion: 'date',
    fecha_actualizacion: 'date',
    imagen: 'image',
    actions: 'text',
  };

  uniqueValues: { [key: string]: string[] } = {};

  // Definición de columnLabels basada en las columnas existentes
  columnLabels: { [key: string]: string } = {
    cubicacion_id: 'Cubicación',
    codigo: 'Código',
    nombre: 'Nombre',
    tipo_producto: 'Tipo',
    categoria: 'Categoría',
    ubicacion: 'Ubicación',
    cantidad: 'Cantidad',
    ancho_diseno: 'Ancho Diseño',
    alto_diseno: 'Alto Diseño',
    superficie_unitaria: 'Superficie Unitaria (m²)',
    superficie_total: 'Superficie Total (m²)',
    ancho_manufactura: 'Ancho Manufactura',
    alto_manufactura: 'Alto Manufactura',
    material: 'Material',
    seccion_perfil: 'Sección Perfil',
    color_estructura: 'Color Estructura',
    espesor_vidrio: 'Espesor Vidrio',
    proteccion_vidrio: 'Protección Vidrio',
    color_pelicula: 'Color Película',
    tipo_vidrio: 'Tipo Vidrio',
    tipo_vidrio_detalle: 'Detalle Vidrio',
    aperturas: 'Aperturas', // Nueva columna unificada
    cerraduras: 'Cerraduras', // Nueva columna unificada
    precio_unitario: 'Precio Unitario',
    precio_total: 'Precio Total',
    factor_instalacion: 'Factor Instalación',
    descripcion: 'Descripción',
    observaciones: 'Observaciones',    activo: 'Activo',
    fecha_creacion: 'Fecha Creación',
    fecha_actualizacion: 'Fecha Actualización',
    imagen: 'Img',
    actions: 'Acciones',
  };

  filters: { [key: string]: TableFilter } = {};

  productos: Producto[] = [];
  productosFormateados: any[] = [];
  showFilterMenu = false;
  showColumnMenu = false;
  showProductoDialog = false;
  editingProducto: Producto | null = null;
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  isLoading = true;
  loadingMessage: string = '';
  connectionError = false;



  // Suscripción para refresco de datos
  private refreshSubscription: Subscription | null = null;
  supabase: any;

  constructor(
    public productoService: ProductoService,
    public cubicacionService: CubicacionService,
    public proyectoService: ProyectoService,
    public errorService: ErrorService,
    private router: Router,
    private dialog: MatDialog,
    private cacheService: CacheService,
    private navigationService: NavigationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    // Obtener el ID de cubicación de los parámetros de la ruta
    this.route.paramMap.subscribe((params) => {
      this.cubicacionId = params.get('id'); // Usar 'id' en lugar de 'codigo'
      if (this.cubicacionId) {
        console.log('ID de cubicación obtenido de la ruta:', this.cubicacionId);
        // Cargar directamente con el ID
        this.loadData(true);
        this.loadCubicacionInfo();
      } else {
        // Si no hay ID de cubicación en la URL, verificar si está en el segmento de ruta
        const urlSegments = window.location.pathname.split('/');
        if (urlSegments.includes('cubicaciones') && urlSegments.includes('productos')) {
          const possibleId = urlSegments[urlSegments.indexOf('cubicaciones') + 2];
          if (possibleId && possibleId !== 'productos') {
            this.cubicacionId = possibleId;
            console.log('ID de cubicación recuperado de URL:', this.cubicacionId);
            this.loadData(true);
            this.loadCubicacionInfo();
          } else {
            console.log('No se encontró ID de cubicación en la URL');
            this.pageTitle = 'Lista de productos';
          }
        }
      }
    });
  }

  async buscarCubicacionPorCodigo() {
  if (!this.cubicacionCodigo) return;
  
  try {
    // Buscar la cubicación por id

    const cubicacion = await this.cubicacionService.getById(this.cubicacionCodigo);
    if (!cubicacion) {
      console.error('No se encontró la cubicación con el código:', this.cubicacionCodigo);
      return;
    }
    this.cubicacionId = cubicacion.id;
    console.log('Cubicación encontrada:', cubicacion);
    // Cargar los productos de la cubicación encontrada
    this.productos = await this.productoService.getProductosByCubicacionId(this.cubicacionId);
    this.originalProductos = [...this.productos];
    // Formatear productos para mostrar en la tabla
    this.productosFormateados = this.formatearProductos(this.productos);
    // Actualizar paginación
    this.totalItems = this.productosFormateados.length;
    this.paginationConfig.totalItems = this.totalItems;
    // Actualizar el título de la página
    this.pageTitle = `Productos de Cubicación ${cubicacion.codigo || ''}`;
  } catch (error) {
    console.error('Error al buscar cubicación por código:', error);
    this.errorService.handle(error, 'Buscando cubicación por código');
  }

}

  async loadCubicacionInfo() {
    if (!this.cubicacionId) return;

    try {
      console.log('Cargando información de cubicación:', this.cubicacionId);
      this.cubicacionInfo = await this.cubicacionService.getById(this.cubicacionId);
      
      console.log('Datos completos de cubicación:', this.cubicacionInfo);
      console.log('Código de cubicación:', this.cubicacionInfo?.codigo);
      
      if (this.cubicacionInfo) {
        // Obtener información del proyecto asociado
        if (this.cubicacionInfo.proyecto_id) {
          const proyecto = await this.proyectoService.getById(this.cubicacionInfo.proyecto_id);
          
          console.log('Datos completos de proyecto:', proyecto);
          console.log('Código de proyecto:', proyecto?.codigo);
          
          if (proyecto) {
            this.pageTitle = `Productos de Cubicación ${this.cubicacionInfo.codigo || ''} del proyecto ${proyecto.codigo || ''}`;
          } else {
            this.pageTitle = `Productos de Cubicación ${this.cubicacionInfo.codigo || ''}`;
          }
        } else {
          this.pageTitle = `Productos de Cubicación ${this.cubicacionInfo.codigo || ''}`;
        }
        
        console.log('Título actualizado a:', this.pageTitle);
      } else {
        console.log('No se encontró información de la cubicación');
        this.pageTitle = 'Productos de cubicación';
      }
    } catch (error) {
      console.error('Error al cargar información de la cubicación:', error);
      this.pageTitle = 'Productos de cubicación';
    }

    // Forzar la detección de cambios
    this.cdr.detectChanges();
  }

  async retryConnection() {
    this.connectionError = false;
    await this.ngOnInit();
  }

  async ngOnInit() {
    // Establecer título inicial
    this.pageTitle = 'Cargando información de cubicación...';
    
    this.isLoading = true;
    this.connectionError = false;
    this.loadingMessage = 'Cargando productos...';

    try {
      // Cargar primero la información de la cubicación antes de cargar los productos
      if (this.cubicacionId) {
        await this.loadCubicacionInfo();
      } else {
        this.pageTitle = 'Lista de productos';
      }

      // Verificar si necesitamos refrescar al cargar
      const needsRefresh =
        this.navigationService.checkIfRefreshNeeded('productos');

      // Cargar productos (por cubicación si hay un ID, o todos si no)
      if (this.cubicacionId) {
        this.productos = await this.productoService.getProductosByCubicacionId(
          this.cubicacionId
        );
      } else {
        this.productos = await this.productoService.getAll();
      }

      this.originalProductos = [...this.productos];

      // Formatear productos para mostrar en la tabla
      this.productosFormateados = this.formatearProductos(this.productos);

      // Actualizar paginación
      this.totalItems = this.productosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;

      // Inicializar filtros y valores únicos
      this.initializeFilters();
      this.updateUniqueValues();

      // Reordenar los productos
      this.reorderProductos();

      // Suscribirse a eventos de refresco
      this.refreshSubscription = this.cacheService
        .getRefreshObservable('productos')
        .subscribe((shouldRefresh: any) => {
          if (shouldRefresh) {
            console.log('Evento de refresco recibido en ProductListComponent');
            this.loadData(true);
          }
        });
    } catch (error) {
      this.connectionError = true;
      this.errorService.handle(error, 'Cargando lista de productos');
      console.error('Error al cargar productos:', error);
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  ngOnDestroy() {
    // Limpiar suscripción al destruir componente
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  // Método para cargar datos, similar al ngOnInit pero reutilizable
  async loadData(forceRefresh: boolean = false) {
    this.isLoading = true;
    this.loadingMessage = 'Cargando productos...';
    this.connectionError = false;

    try {
      // Verificar si tenemos un ID de cubicación válido
      if (this.cubicacionId) {
        console.log(`Cargando productos para cubicación ID: ${this.cubicacionId}`);
        // Cargar productos específicos de la cubicación
        this.productos = await this.productoService.getProductosByCubicacionId(
          this.cubicacionId,
          forceRefresh
        );
        console.log(`Se encontraron ${this.productos.length} productos para la cubicación`);
      } else {
        console.log('Cargando todos los productos (sin filtro de cubicación)');
        // Cargar todos los productos si no hay ID de cubicación
        this.productos = await this.productoService.getAll();
      }

      this.originalProductos = [...this.productos];

      // Formatear productos para mostrar en la tabla
      this.productosFormateados = this.formatearProductos(this.productos);

      // Actualizar paginación
      this.totalItems = this.productosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;

      // Inicializar filtros y valores únicos
      this.initializeFilters();
      this.updateUniqueValues();

      // Reordenar los productos
      this.reorderProductos();
    } catch (error) {
      this.connectionError = true;
      this.errorService.handle(error, 'Cargando lista de productos');
      console.error('Error al cargar productos:', error);
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  // Método para editar columnas
  onEditColumn(column: TableColumn): void {
    const dialogRef = this.dialog.open(ColumnDialogComponent, {
      width: '400px',
      data: { column },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedColumn = result as TableColumn;
        const index = this.columns.findIndex(
          (col) => col.key === updatedColumn.key
        );
        if (index !== -1) {
          this.columns[index] = updatedColumn;
          this.onColumnVisibilityChange(updatedColumn);
        }
      }
    });
  }

  // Modificar el método formatearProductos para incluir la imagen
  formatearProductos(productos: Producto[]): any[] {
    return productos.map((producto) => {
      // Obtener la URL de la imagen usando el servicio
      const imagenUrl = this.productoService.getProductImageSrc(producto);
      
      console.log('URL de imagen para producto', producto.id, ':', imagenUrl);
      
      return {
        id: producto.id,
        cubicacion_id: producto.cubicacion_id || '',
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        // Añadir la imagen del producto
        imagen: imagenUrl,
        tipo_producto: producto.tipo_producto || '',
        categoria: producto.categoria || '',
        ubicacion: producto.ubicacion || '',
        cantidad: producto.cantidad || 0,
        ancho_diseno: producto.ancho_diseno || 0,
        alto_diseno: producto.alto_diseno || 0,
        superficie_unitaria: producto.superficie_unitaria || 0,
        superficie_total: producto.superficie_total || 0,
        ancho_manufactura: producto.ancho_manufactura || 0,
        alto_manufactura: producto.alto_manufactura || 0,
        material: producto.material || '',
        seccion_perfil: producto.seccion_perfil || '',
        color_estructura: producto.color_estructura || '',
        espesor_vidrio: producto.espesor_vidrio || '',
        proteccion_vidrio: producto.proteccion_vidrio || '',
        color_pelicula: producto.color_pelicula || '',
        tipo_vidrio: producto.tipo_vidrio || '',
        tipo_vidrio_detalle: producto.tipo_vidrio_detalle || '',
        aperturas:
          [producto.apertura_1, producto.apertura_2, producto.apertura_3]
            .filter((a) => a && a.trim() !== '')
            .join(' | ') || 'No definida',
        cerraduras:
          [producto.cerradura_1, producto.cerradura_2, producto.cerradura_3]
            .filter((c) => c && c.trim() !== '')
            .join(' | ') || 'No definida',
        precio_unitario: producto.precio_unitario || 0,
        precio_total: (producto.cantidad || 0) * (producto.precio_unitario || 0),
        factor_instalacion: producto.factor_instalacion || 0,
        descripcion: producto.descripcion || '',
        observaciones: producto.observaciones || '',
        activo: producto.activo || false,
        fecha_creacion: producto.fecha_creacion
          ? new Date(producto.fecha_creacion)
          : null,
        fecha_actualizacion: producto.fecha_actualizacion
          ? new Date(producto.fecha_actualizacion)
          : null,
        producto_original: producto, // Guardamos el original para acceder a otros datos
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
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(monto);
  }

  getColumnLabel(colId: string): string {
    return this.columnLabels[colId] || colId;
  }

  /**
   * Verifica y formatea correctamente las URLs de imágenes, incluyendo datos base64
   */
  formatImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return '';
    
    // Si ya es una URL completa o una ruta de archivo, devolverla directamente
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      return imageUrl;
    }
    
    // Si es una cadena base64 sin el prefijo adecuado, añadirlo
    if (imageUrl.startsWith('iVBOR') || imageUrl.includes('base64')) {
      if (!imageUrl.startsWith('data:')) {
        return `data:image/png;base64,${imageUrl}`;
      }
    }
    
    return imageUrl;
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

      // Realizar la búsqueda con el servicio o en memoria
      const searchTerm = this.searchTerm.toLowerCase().trim();

      // Si tenemos un ID de cubicación, filtrar solo dentro de esos productos
      if (this.cubicacionId) {
        let filteredProductos = this.originalProductos.filter((item) => {
          // Buscar en todos los campos de texto relevantes
          return (
            item.nombre?.toLowerCase().includes(searchTerm) ||
            item.codigo?.toLowerCase().includes(searchTerm) ||
            item.descripcion?.toLowerCase().includes(searchTerm) ||
            item.categoria?.toLowerCase().includes(searchTerm) ||
            item.tipo_producto?.toLowerCase().includes(searchTerm)
          );
        });

        this.productos = filteredProductos;
      } else {
        // Búsqueda general de productos
        this.productos = await this.productoService.search(this.searchTerm);
      }

      // Formatear resultados
      this.productosFormateados = this.formatearProductos(this.productos);

      // Aplicar ordenamiento de filas fijadas
      this.reorderProductos();

      // Actualizar paginación
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
      this.totalItems = this.productosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
    } catch (error) {
      this.errorService.handle(error, 'Buscando productos');
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
    this.loadingMessage = 'Cargando productos...';

    try {
      this.searchTerm = '';

      // Si no tenemos los datos originales, cargarlos
      if (!this.originalProductos || this.originalProductos.length === 0) {
        if (this.cubicacionId) {
          this.originalProductos =
            await this.productoService.getProductosByCubicacionId(
              this.cubicacionId
            );
        } else {
          this.originalProductos = await this.productoService.getAll();
        }
      }

      // Restaurar desde los datos originales
      this.productos = [...this.originalProductos];
      this.productosFormateados = this.formatearProductos(this.productos);

      // Aplicar ordenamiento de filas fijadas
      this.reorderProductos();

      // Resetear paginación
      this.totalItems = this.productosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Cargando lista de productos');
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

  // Método para inicializar filtros con la propiedad 'label'
  private initializeFilters() {
    for (const column of this.columnOrder) {
      // Excluir 'actions' y columnas de tipo 'image' ya que no son filtrables
      if (column !== 'actions' && this.columnTypes[column] !== 'image') {
        this.filters[column] = {
          type: this.columnTypes[column] as 'text' | 'date' | 'number' | 'boolean' | 'enum',
          label: this.columnLabels[column] || column, // Añadir el label requerido
          value: '',
        };
        if (
          this.columnTypes[column] === 'date' ||
          this.columnTypes[column] === 'number' // Ya no verificar 'currency'
        ) {
          this.filters[column].from = null;
          this.filters[column].to = null;
        }
      }
    }
  }

  private updateUniqueValues() {
    this.columnOrder.forEach((column) => {
      if (
        (this.columnTypes[column] === 'text' ||
          this.columnTypes[column] === 'enum') &&
        column !== 'actions'
      ) {
        // Extraer valores únicos de los datos formateados
        const values = new Set(
          this.productosFormateados
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
          this.columnTypes[column] === 'number' // Ya no verificar 'currency'
        ) {
          this.filters[column].from = null;
          this.filters[column].to = null;
        }
      }
    });
    this.hasActiveFilters = false;
    await this.resetSearch();
  }

  async applyFilters(newFilters?: {
    [key: string]: TableFilter;
  }): Promise<void> {
    this.isLoading = true;
    this.loadingMessage = 'Aplicando filtros...';

    try {
      if (newFilters) {
        this.filters = newFilters;
      }

      // Verificar si hay filtros activos
      let hasActiveFilters = false;
      for (const col in this.filters) {
        const filter = this.filters[col];
        if (
          filter.type === 'text' ||
          filter.type === 'enum' ||
          filter.type === 'boolean'
        ) {
          if (filter.value && filter.value !== '') {
            hasActiveFilters = true;
            break;
          }
        } else if (
          (filter.type === 'date' || filter.type === 'number') &&
          (filter.from !== null || filter.to !== null)
        ) {
          hasActiveFilters = true;
          break;
        }
      }

      this.hasActiveFilters = hasActiveFilters;

      // Si no tenemos los datos originales o necesitamos recargar, hacerlo solo una vez
      if (!this.originalProductos || this.originalProductos.length === 0) {
        if (this.cubicacionId) {
          this.originalProductos =
            await this.productoService.getProductosByCubicacionId(
              this.cubicacionId
            );
        } else {
          this.originalProductos = await this.productoService.getAll();
        }
      }

      // Filtrar desde los datos originales en memoria
      let productosFiltrados = [...this.originalProductos];

      // Aplicar filtros si hay activos
      if (hasActiveFilters) {
        for (const col in this.filters) {
          const filter = this.filters[col];

          // Saltar si el filtro está vacío
          if (
            (filter.type === 'text' ||
              filter.type === 'enum' ||
              filter.type === 'boolean') &&
            (!filter.value || filter.value === '')
          )
            continue;

          if (
            (filter.type === 'date' || filter.type === 'number') &&
            filter.from == null &&
            filter.to == null
          )
            continue;

          switch (filter.type) {
            case 'text':
            case 'enum':
              productosFiltrados = productosFiltrados.filter((item) => {
                const itemValue = item[col as keyof typeof item];
                return (
                  itemValue &&
                  String(itemValue)
                    .toLowerCase()
                    .includes((filter.value || '').toLowerCase())
                );
              });
              break;

            case 'date':
              if (filter.from || filter.to) {
                productosFiltrados = productosFiltrados.filter((item) => {
                  const itemDate = item[col as keyof typeof item]
                    ? new Date(item[col as keyof typeof item] as string)
                    : null;

                  if (!itemDate) return false;

                  let matchesFrom = true;
                  let matchesTo = true;

                  if (filter.from) {
                    const filterFrom = new Date(filter.from as string);
                    matchesFrom = itemDate >= filterFrom;
                  }

                  if (filter.to) {
                    const filterTo = new Date(filter.to as string);
                    filterTo.setHours(23, 59, 59, 999); // Fin del día
                    matchesTo = itemDate <= filterTo;
                  }

                  return matchesFrom && matchesTo;
                });
              }
              break;

            case 'number':
              // Código para todos los valores numéricos (tanto 'number' como antes 'currency')
              if (filter.from !== null || filter.to !== null) {
                productosFiltrados = productosFiltrados.filter((item) => {
                  const itemValue = item[col as keyof typeof item] as number;

                  if (itemValue === null || itemValue === undefined)
                    return false;

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

            case 'boolean':
              if (filter.value === 'true' || filter.value === 'false') {
                const boolValue = filter.value === 'true';
                productosFiltrados = productosFiltrados.filter((item) => {
                  return item[col as keyof typeof item] === boolValue;
                });
              }
              break;
          }
        }
      }

      // Actualizar productos filtrados
      this.productos = productosFiltrados;

      // Formatear los productos para la tabla
      this.productosFormateados = this.formatearProductos(this.productos);

      // Reordenar los productos (filas fijadas)
      this.reorderProductos();

      // Actualizar paginación
      this.totalItems = this.productosFormateados.length;
      this.paginationConfig.totalItems = this.totalItems;
      this.currentPage = 1;
      this.paginationConfig.currentPage = 1;
    } catch (error) {
      this.errorService.handle(error, 'Aplicando filtros');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
      this.showFilterMenu = false;
    }
  }

  // Métodos para refrescar datos
  async refreshData() {
    console.log('Forzando recarga manual de datos');
    await this.loadData(true);
  }

  // Métodos para navegación y acciones CRUD
  nuevoProducto() {
    this.editingProducto = null;
    if (this.cubicacionId) {
      // Navegar a agregar-ventana with el ID de cubicación
      this.navigationService.navigateWithRefresh([
        '/productos/agregar-ventana',
        this.cubicacionId,
      ]);
    } else {
      // Si no hay cubicación seleccionada, mostrar mensaje de error
      this.errorService.showWarning('Debe seleccionar una cubicación antes de agregar un producto');
      
      // Opcional: redireccionar a la lista de cubicaciones para que seleccione una
      setTimeout(() => {
        this.router.navigate(['/cubicaciones']);
      }, 2000);
    }
  }

  editar(id: string) {
    this.navigationService.navigateWithRefresh(['/productos/editar', id]);
  }

  async eliminar(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message:
          '¿Está seguro que desea eliminar este producto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.isLoading = true;
        this.loadingMessage = 'Eliminando producto...';
        try {
          const success = await this.productoService.delete(id);
          if (success) {
            this.errorService.showSuccess('Producto eliminado correctamente');
            // Forzar recarga de datos
            await this.loadData(true);
          }
        } catch (error) {
          this.errorService.handle(error, 'Eliminando producto');
        } finally {
          this.isLoading = false;
          this.loadingMessage = '';
        }
      }
    });
  }

  onRowClick(item: any): void {
    // Navegar a la vista detallada del producto
    this.router.navigate(['/productos/detalle', item.id]);
  }

  // Métodos para ordenamiento
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
      this.loadingMessage = '';
    }, 0);
  }

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
    const pinnedItems = this.productosFormateados.filter((item) =>
      this.pinnedItems.has(item.id)
    );
    const unpinnedItems = this.productosFormateados.filter(
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
    this.productosFormateados = [...pinnedItems, ...unpinnedItems];
  }

  // Métodos para reordenamiento de columnas
  onColumnReorder(columns: TableColumn[]): void {
    this.columns = columns;
    this.columnOrder = columns.map((col) => col.key);
  }

  // Métodos para paginación
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

  // Métodos para fijar elementos
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
    this.reorderProductos();
  }

  // Reordena: fijados arriba, luego no fijados
  private reorderProductos() {
    // Obtener elementos fijados y no fijados de los datos formateados
    const pinned = this.productosFormateados.filter((item) =>
      this.pinnedItems.has(item.id)
    );
    const unpinned = this.productosFormateados.filter(
      (item) => !this.pinnedItems.has(item.id)
    );

    // Combinar grupos
    this.productosFormateados = [...pinned, ...unpinned];
  }

  // Métodos para gestión de columnas
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

  // Método para volver a la lista de cubicaciones
  volverACubicaciones() {
    this.router.navigate(['/cubicaciones']);
  }

  getProductImageSrc(producto: Producto): string {
  if (!producto || !producto.imagen) return '';
  
  // Intentar recuperar del localStorage
  const tempImage = localStorage.getItem(`temp_image_${producto.id}`);
  if (tempImage) {
    return this.formatImageUrl(tempImage);
  }
  
  // Si no hay imagen temporal, devolver la URL normal
  return this.formatImageUrl(producto.imagen);
}

handleImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  console.warn('Error al cargar imagen:', imgElement.src);
  
  // Reemplazar con imagen por defecto
  imgElement.src = 'assets/images/no-image.png';
  imgElement.classList.add('image-error');
  
  // Mostrar un tooltip para indicar el error
  imgElement.title = 'No se pudo cargar la imagen';
}
}