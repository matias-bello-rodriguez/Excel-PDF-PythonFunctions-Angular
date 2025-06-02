import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { ExcelImportService } from '../../services/excel-import.service';
import { PdfService } from '../../services/pdf.service';
import { Cubicacion, Producto } from '../../interfaces/entities';
import { CacheService } from '../../services/cache.service';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { ProyectoService } from '../../services/proyecto.service';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

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
  editingProducto: Producto | null = null;

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
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  isLoading = true;
  loadingMessage: string = '';
  connectionError = false;



  // Suscripción para refresco de datos
  private refreshSubscription: Subscription | null = null;
  supabase: any;

  // Variables para Excel y exportación
  showExcelModal = false;
  showExportModal = false;
  selectedFileName = '';
  selectedFile: File | null = null;
  excelHeaders: string[] = [];
  excelPreviewData: any[][] = [];
  isLoadingPreview = false;
  activeTab: 'upload' | 'preview' = 'upload';
  exportPreviewUrl: string = '';
  safeExportUrl: SafeResourceUrl = '';
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
    private cdr: ChangeDetectorRef,
    private excelService: ExcelImportService,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
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

// Métodos para Excel y exportación
  /**
   * Alternar diálogo de exportación con vista previa PDF
   */
  async toggleExportDialog(): Promise<void> {
    if (!this.showExportModal) {
      if (isPlatformBrowser(this.platformId)) {
        try {
          const docDefinition = this.getDocDefinition();
          const dataUrl = await this.pdfService.generatePdfDataUrl(docDefinition);
          this.exportPreviewUrl = dataUrl;
          this.safeExportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
          this.showExportModal = true;
        } catch (error) {
          console.error('Error al generar PDF:', error);
        }
      }
    } else {
      this.showExportModal = false;
      this.exportPreviewUrl = '';
      this.safeExportUrl = '';
    }
  }

  /**
   * Descargar el PDF generado
   */
  async downloadPdf(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const docDefinition = this.getDocDefinition();
        await this.pdfService.downloadPdf(docDefinition, 'listado-productos.pdf');
      } catch (error) {
        console.error('Error al descargar PDF:', error);
      }
    }
  }

  /**
   * Abrir vista previa del PDF en una nueva pestaña
   */
  openPdfPreview(): void {
    if (this.exportPreviewUrl && isPlatformBrowser(this.platformId)) {
      window.open(this.exportPreviewUrl, '_blank');
    }
  }

  /**
   * Obtener la definición del documento PDF
   */
  private getDocDefinition(): TDocumentDefinitions {
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Encabezado con información de la empresa
        {
          columns: [
            {
              text: 'KINETTA',
              style: 'companyName'
            },
            {
              text: `Fecha: ${currentDate}\nPágina: `,
              style: 'headerRight',
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        
        // Título del documento
        {
          text: 'LISTA DE PRODUCTOS - CUBICACIÓN',
          style: 'documentTitle',
          margin: [0, 0, 0, 20]
        },
        
        // Información del resumen
        {
          columns: [
            {
              text: `Total de productos: ${this.productos.length}`,
              style: 'summaryInfo'
            },
            {
              text: `Total superficie: ${this.productos.reduce((sum, p) => sum + (p.superficie_total || 0), 0).toFixed(2)} m²`,
              style: 'summaryInfo',
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 15]
        },
        
        // Tabla principal
        {
          style: 'tableStyle',
          table: {
            headerRows: 1,
            widths: [50, 80, 60, 40, 40, 40, 80, 60, 60, 60],
            body: [
              // Encabezados de tabla
              [
                { text: 'CÓDIGO', style: 'tableHeader' },
                { text: 'UBICACIÓN', style: 'tableHeader' },
                { text: 'TIPO VENTANA', style: 'tableHeader' },
                { text: 'ANCHO', style: 'tableHeader' },
                { text: 'ALTO', style: 'tableHeader' },
                { text: 'CANT.', style: 'tableHeader' },
                { text: 'MATERIAL', style: 'tableHeader' },
                { text: 'SUP. TOTAL', style: 'tableHeader' },
                { text: 'PRECIO UNIT.', style: 'tableHeader' },
                { text: 'TOTAL', style: 'tableHeader' }
              ],
              
              // Filas de datos
              ...this.productos.map((producto) => [
                { text: producto.codigo || '', style: 'tableCell' },
                { text: producto.ubicacion || '', style: 'tableCell' },
                { text: producto.tipo_producto || '', style: 'tableCell' },
                { text: `${producto.ancho_diseno?.toFixed(2) || '0.00'}m`, style: 'tableCellCenter' },
                { text: `${producto.alto_diseno?.toFixed(2) || '0.00'}m`, style: 'tableCellCenter' },
                { text: producto.cantidad || '0', style: 'tableCellCenter' },
                { text: producto.material || '', style: 'tableCell' },
                { text: `${producto.superficie_total?.toFixed(2) || '0.00'} m²`, style: 'tableCellRight' },
                { text: `$${producto.precio_unitario?.toFixed(2) || '0.00'}`, style: 'tableCellRight' },
                { text: `$${producto.precio_total?.toFixed(2) || '0.00'}`, style: 'tableCellRightBold' }
              ])
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? 2 : 1;
            },
            vLineWidth: function(i: number, node: any) {
              return (i === 0 || i === node.table.widths.length) ? 2 : 1;
            },
            hLineColor: function(i: number, node: any) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? '#8B1C1C' : '#cccccc';
            },
            vLineColor: function(i: number, node: any) {
              return (i === 0 || i === node.table.widths.length) ? '#8B1C1C' : '#cccccc';
            },
            fillColor: function(i: number, node: any) {
              return (i === 0) ? '#f8f9fa' : (i % 2 === 0) ? '#ffffff' : '#f8f9fa';
            }
          }
        },
        
        // Separador
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 10,
              x2: 515, y2: 10,
              lineWidth: 1,
              lineColor: '#8B1C1C'
            }
          ],
          margin: [0, 20, 0, 10]
        },
        
        // Resumen final
        {
          columns: [
            {
              text: 'RESUMEN DEL PROYECTO',
              style: 'summaryTitle'
            },
            {
              table: {
                widths: [120, 80],
                body: [
                  [
                    { text: 'Superficie Total:', style: 'summaryLabel' },
                    { text: `${this.productos.reduce((sum, p) => sum + (p.superficie_total || 0), 0).toFixed(2)} m²`, style: 'summaryValue' }
                  ],
                  [
                    { text: 'Total General:', style: 'summaryLabelBold' },
                    { text: `$${this.calculateTotal().toFixed(2)}`, style: 'summaryValueBold' }
                  ]
                ]
              },
              layout: 'noBorders',
              alignment: 'right'
            }
          ],
          margin: [0, 10, 0, 0]
        }
      ],
      styles: {
        companyName: {
          fontSize: 20,
          bold: true,
          color: '#8B1C1C'
        },
        headerRight: {
          fontSize: 10,
          color: '#666666'
        },
        documentTitle: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          color: '#333333'
        },
        summaryInfo: {
          fontSize: 10,
          color: '#666666'
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: 'center',
          color: '#ffffff',
          fillColor: '#8B1C1C'
        },
        tableCell: {
          fontSize: 8,
          alignment: 'left'
        },
        tableCellCenter: {
          fontSize: 8,
          alignment: 'center'
        },
        tableCellRight: {
          fontSize: 8,
          alignment: 'right'
        },
        tableCellRightBold: {
          fontSize: 8,
          alignment: 'right',
          bold: true,
          color: '#8B1C1C'
        },
        summaryTitle: {
          fontSize: 12,
          bold: true,
          color: '#8B1C1C'
        },
        summaryLabel: {
          fontSize: 10,
          alignment: 'right'
        },
        summaryValue: {
          fontSize: 10,
          alignment: 'right',
          bold: true
        },
        summaryLabelBold: {
          fontSize: 11,
          alignment: 'right',
          bold: true
        },
        summaryValueBold: {
          fontSize: 12,
          alignment: 'right',
          bold: true,
          color: '#8B1C1C'
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 9
      }
    };
  }

  /**
   * Calcular el total de precios
   */
  private calculateTotal(): number {
    return this.productos.reduce((total, producto) => 
      total + (producto.precio_total || 0), 0);
  }

  // Excel file handling methods
  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.currentTarget as HTMLElement;
    dropArea.classList.add('drag-over');
  }

  onFileDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.currentTarget as HTMLElement;
    dropArea.classList.remove('drag-over');
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = event.currentTarget as HTMLElement;
    dropArea.classList.remove('drag-over');

    const file = event.dataTransfer?.files[0];
    if (file && this.isValidExcelFile(file)) {
      this.handleFileSelection(file);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target?.files[0];
    if (file && this.isValidExcelFile(file)) {
      this.handleFileSelection(file);
    }
  }

  private async handleFileSelection(file: File) {
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.isLoadingPreview = true;

    try {
      const preview = await this.excelService.generatePreview(file);
      this.excelHeaders = preview.headers;
      this.excelPreviewData = preview.data;
      console.log('Excel data loaded:', {
        headers: this.excelHeaders,
        preview: this.excelPreviewData
      });
      this.activeTab = 'preview';
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
    } finally {
      this.isLoadingPreview = false;
    }
  }

  isValidExcelFile(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return allowedTypes.includes(file.type);
  }

  resetExcelModal(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.excelPreviewData = [];
    this.excelHeaders = [];
    this.isLoadingPreview = false;
    this.activeTab = 'upload';
  }

  nextStep(): void {
    if (this.activeTab === 'upload' && this.selectedFile) {
      this.activeTab = 'preview';
    }
  }

  async importExcel(): Promise<void> {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo Excel');
      return;
    }

    try {
      // Crear mapeo automático basado en los headers del Excel
      const automaticMapping = this.createAutomaticMapping();
      
      // Verificar que se pudo crear un mapeo mínimo
      if (Object.keys(automaticMapping).length === 0) {
        throw new Error('No se pudo crear un mapeo automático de columnas. Verifica que los encabezados del Excel coincidan con los campos del sistema.');
      }
      
      // Mostrar el mapeo al usuario para debug
      console.log('Usando el siguiente mapeo para importar:', automaticMapping);
      
      const importedData = await this.excelService.importExcel(
        this.selectedFile,
        automaticMapping
      );
      
      // Verificar que se importaron datos
      if (!importedData || !Array.isArray(importedData) || importedData.length === 0) {
        throw new Error('No se pudieron importar datos del archivo Excel');
      }
      
      console.log('Datos importados:', importedData);
      
      // Añadir identificador y cubicacion_id para cada producto
      const productsWithIds = importedData.map((product, index) => {
        if (!product.codigo) {
          product.codigo = `PROD-${Date.now()}-${index}`;
        }
        
        // Asignar cubicacion_id desde la URL si no existe
        if (!product.cubicacion_id && this.cubicacionId) {
          product.cubicacion_id = this.cubicacionId;
        }
        
        return product;
      });
      
      // Verificar que los datos importados tienen al menos algunas propiedades válidas
      const validProducts = productsWithIds.filter(product => 
        Object.keys(product).length > 1 // Al menos una propiedad además del código
      );
      
      if (validProducts.length === 0) {
        throw new Error('No se pudieron extraer productos válidos del archivo. Verifica que los encabezados del Excel coincidan con los campos esperados.');
      }
      
      // Aquí deberías llamar a tu servicio para guardar los productos
      // Por ejemplo: await this.productoService.importarProductos(validProducts, this.cubicacionId);
      
      // Por ahora, simplemente agregar a la lista local
      this.productos = [...this.productos, ...validProducts];
      
      // Formatear los productos para la tabla
      this.productosFormateados = this.formatearProductos(this.productos);
      
      // Cerrar el modal y resetear
      this.showExcelModal = false;
      this.resetExcelModal();
      
      // Mostrar notificación visual
      this.showSuccessNotification(`Se han importado ${validProducts.length} productos correctamente.`);
    } catch (error: any) {
      console.error('Error al importar:', error);
      
      // Mostrar un mensaje de error detallado al usuario
      let errorMessage = 'Ha ocurrido un error desconocido';
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.toString) {
          errorMessage = error.toString();
        }
      }
      
      alert(`Error al importar: ${errorMessage}`);
    }
  }

  private createAutomaticMapping(): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // No hay headers para mapear
    if (!this.excelHeaders || this.excelHeaders.length === 0) {
      console.warn('No hay encabezados para mapear');
      return mapping;
    }
    
    // Mapeo específico para los campos del Excel proporcionados
    const specificMappings: { [key: string]: string[] } = {
      'codigo': ['WINDOW CODE', 'CODE', 'CÓDIGO', 'codigo'], // WINDOW CODE es prioritario para código
      'ubicacion': ['Location', 'UBICACIÓN', 'ubicacion', 'UNITS'],
      'ancho_diseno': ['Width (m)', 'Width', 'ANCHO', 'ancho'],
      'alto_diseno': ['Height (m)', 'Height', 'ALTO', 'alto'],
      'superficie_unitaria': ['Surface (m²)', 'Surface', 'SUPERFICIE', 'superficie'],
      'cantidad': ['Quantity PER UNIT', 'Quantity', 'CANTIDAD', 'cantidad'],
      'superficie_total': ['Total surface (m²)', 'Total surface', 'SUPERFICIE TOTAL', 'superficie_total'],
      'ancho_manufactura': ['MANUFACTURING WIDTH', 'Manufacturing Width', 'ANCHO MANUFACTURA', 'ancho_manufactura'],
      'alto_manufactura': ['MANUFACTURING HEIGHT', 'Manufacturing Height', 'ALTO MANUFACTURA', 'alto_manufactura'],
      'material': ['Material', 'MATERIAL', 'material'],
      'seccion_perfil': ['Profile section', 'Profile Section', 'SECCIÓN PERFIL', 'seccion_perfil'],
      'color_estructura': ['Body color', 'Body Color', 'COLOR ESTRUCTURA', 'color_estructura'],
      'espesor_vidrio': ['Glass thickness', 'Glass Thickness', 'ESPESOR VIDRIO', 'espesor_vidrio'],
      'proteccion_vidrio': ['Glass protection', 'Glass Protection', 'PROTECCIÓN VIDRIO', 'proteccion_vidrio'],
      'color_pelicula': ['Film color', 'Film Color', 'COLOR PELÍCULA', 'color_pelicula'],
      'tipo_vidrio': ['Opaque/Clear glass', 'Glass type', 'Opaque', 'Clear', 'TIPO VIDRIO', 'tipo_vidrio'],
      'tipo_producto': ['Window Type', 'TIPO PRODUCTO', 'tipo_producto'],
      'apertura_1': ['OPENING', 'Opening', 'APERTURA', 'apertura'],
      'cerradura_1': ['Lock', 'CERRADURA', 'cerradura'],
      'descripcion': ['DESIGN 1', 'Design 1', 'DESCRIPCIÓN', 'descripcion'],
      'observaciones': ['COMMENT 1', 'COMMENT 2', 'Comment', 'OBSERVACIONES', 'observaciones']
      // ELIMINADO: 'cubicacion_id': ['HOUSE/TOWER (CODE)', 'House', 'Tower', 'CUBICACIÓN', 'cubicacion']
    };
    
    // Objeto para rastrear qué columnas del sistema ya están mapeadas
    const mappedSystemKeys = new Set<string>();
    const usedExcelHeaders = new Set<string>();

    // 1. Mapeo específico basado en las coincidencias exactas
    Object.entries(specificMappings).forEach(([systemKey, possibleHeaders]) => {
      if (mappedSystemKeys.has(systemKey)) return;
      
      for (const header of this.excelHeaders) {
        if (!header || usedExcelHeaders.has(header)) continue;
        
        // Buscar coincidencia exacta o parcial
        const normalizedHeader = header.toLowerCase().trim();
        const matchFound = possibleHeaders.some(possible => 
          normalizedHeader === possible.toLowerCase() ||
          normalizedHeader.includes(possible.toLowerCase()) ||
          possible.toLowerCase().includes(normalizedHeader)
        );
        
        if (matchFound) {
          mapping[systemKey] = header;
          mappedSystemKeys.add(systemKey);
          usedExcelHeaders.add(header);
          console.log(`Mapeo específico: ${systemKey} -> ${header}`);
          break;
        }
      }
    });

    // 2. Mapeo automático para columnas restantes usando los labels del sistema
    const systemLabels = new Map(
      this.columns
        .filter(col => col.key !== 'actions' && col.key !== 'imagen' && !mappedSystemKeys.has(col.key))
        .map(col => [col.label.toLowerCase().trim(), col.key])
    );

    // Buscar coincidencias exactas en labels
    this.excelHeaders.forEach(header => {
      if (!header || usedExcelHeaders.has(header)) return;
      
      const normalizedHeader = header.toLowerCase().trim();
      const systemKey = systemLabels.get(normalizedHeader);
      
      if (systemKey && !mappedSystemKeys.has(systemKey)) {
        mapping[systemKey] = header;
        mappedSystemKeys.add(systemKey);
        usedExcelHeaders.add(header);
        console.log(`Mapeo por label: ${systemKey} -> ${header}`);
      }
    });
    
    // 3. Buscar coincidencias parciales para las columnas restantes
    this.excelHeaders.forEach(header => {
      if (!header || usedExcelHeaders.has(header)) return;
      
      const normalizedHeader = header.toLowerCase().trim();
      
      // Buscar coincidencias parciales para columnas no mapeadas
      systemLabels.forEach((key, label) => {
        if (!mappedSystemKeys.has(key) && !usedExcelHeaders.has(header)) {
          // Verificar si el encabezado del Excel contiene la etiqueta del sistema o viceversa
          if (normalizedHeader.includes(label) || label.includes(normalizedHeader)) {
            mapping[key] = header;
            mappedSystemKeys.add(key);
            usedExcelHeaders.add(header);
            console.log(`Mapeo parcial: ${key} -> ${header}`);
          }
        }
      });
    });

    // Diagnóstico: Ver qué columnas no se pudieron mapear
    const unmappedExcelHeaders = this.excelHeaders.filter(header => 
      header && !usedExcelHeaders.has(header)
    );
    
    const unmappedSystemColumns = Array.from(systemLabels.entries())
      .filter(([_, key]) => !mappedSystemKeys.has(key))
      .map(([label, key]) => ({ label, key }));
    
    if (unmappedExcelHeaders.length > 0) {
      console.warn('Encabezados del Excel no mapeados:', unmappedExcelHeaders);
    }
    
    if (unmappedSystemColumns.length > 0) {
      console.warn('Columnas del sistema no mapeadas:', unmappedSystemColumns);
    }

    console.log('Mapeo final creado:', mapping);
    console.log(`Total de mapeos: ${Object.keys(mapping).length}`);
    
    return mapping;
  }

  // Mostrar notificación de éxito
  showSuccessNotification(message: string): void {
    // Crear el elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <p>${message}</p>
      <button class="close-btn">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Manejar el cierre
    const closeBtn = notification.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(notification);
      });
    }
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }

  // Helper methods for Excel-like display
  getLetter(index: number): string {
    // Comenzar desde B (índice 1) en lugar de A (índice 0)
    let result = '';
    let adjustedIndex = index + 1; // Ajustar para comenzar desde B
    
    while (adjustedIndex >= 0) {
      result = String.fromCharCode((adjustedIndex % 26) + 65) + result;
      adjustedIndex = Math.floor(adjustedIndex / 26) - 1;
    }
    return result;
  }
  
  getCellType(value: any): 'number' | 'date' | 'text' {
    if (value === null || value === undefined || value === '') {
      return 'text';
    }
    
    // Verificar si es un número
    if (typeof value === 'number' || (!isNaN(Number(value)) && !isNaN(parseFloat(value.toString())))) {
      return 'number';
    }
    
    // Intentar detectar si es una fecha
    if (typeof value === 'string') {
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime()) && (value.includes('/') || value.includes('-') || value.includes('.'))) {
        return 'date';
      }
    }
    
    return 'text';
  }

  formatCell(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const type = this.getCellType(value);
    
    if (type === 'number') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      // Formatear números con máximo 2 decimales si es necesario
      if (num % 1 === 0) {
        return num.toString();
      } else {
        return num.toFixed(2).replace(/\.?0+$/, '');
      }
    }
    
    if (type === 'date') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return value.toString();
      }
    }
    
    return value.toString().trim();
  }

  /**
   * Obtiene el tipo de celda en español para la vista previa
   */
  getCellTypeLabel(value: any): string {
    const type = this.getCellType(value);
    switch (type) {
      case 'number': return 'Número';
      case 'date': return 'Fecha';
      case 'text': return 'Texto';
      default: return 'Texto';
    }
  }

  /**
   * Traduce los encabezados del Excel al español para la vista previa
   */
  translateExcelHeader(header: string): string {
    const translations: { [key: string]: string } = {
      // Traducciones exactas
      // 'HOUSE/TOWER (CODE)': 'CASA/TORRE (CÓDIGO)', // ELIMINADO
      'WINDOW CODE': 'CÓDIGO VENTANA',
      'UNITS': 'UNIDADES',
      'Location': 'Ubicación',
      'Width (m)': 'Ancho (m)',
      'Height (m)': 'Alto (m)',
      'Surface (m²)': 'Superficie (m²)',
      'Quantity PER UNIT': 'Cantidad POR UNIDAD',
      'Total surface (m²)': 'Superficie total (m²)',
      'MANUFACTURING WIDTH': 'ANCHO MANUFACTURA',
      'MANUFACTURING HEIGHT': 'ALTO MANUFACTURA',
      'DESIGN 1': 'DISEÑO 1',
      'DESIGN 2': 'DISEÑO 2',
      'COMMENT 1': 'COMENTARIO 1',
      'COMMENT 2': 'COMENTARIO 2',
      'Material': 'Material',
      'Profile section': 'Sección perfil',
      'Body color': 'Color estructura',
      'Glass thickness': 'Espesor vidrio',
      'Glass protection': 'Protección vidrio',
           'Film color': 'Color película',
      'Opaque/Clear glass': 'Vidrio Opaco/Transparente',
      'Window Type': 'Tipo de Ventana',
      'Glass type': 'Tipo de vidrio',
      'OPENING': 'APERTURA',
      'Lock': 'Cerradura',
      
      // Traducciones parciales (contienen palabras clave)
      'CODE': 'CÓDIGO',
      'Width': 'Ancho',
      'Height': 'Alto',
      'Surface': 'Superficie',
      'Quantity': 'Cantidad',
      'Manufacturing': 'Manufactura',
      'Design': 'Diseño',
      'Comment': 'Comentario',
      'Opening': 'Apertura',
      'Glass': 'Vidrio',
      'Color': 'Color',
      'Type': 'Tipo',
      'Protection': 'Protección',
      'Film': 'Película',
      'Body': 'Estructura',
      'Profile': 'Perfil',
      'Section': 'Sección',
      'Thickness': 'Espesor',
      'Clear': 'Transparente',
      'Opaque': 'Opaco',
      'Window': 'Ventana',
      'House': 'Casa',
      'Tower': 'Torre',
      'Units': 'Unidades',
      'Total': 'Total'
    };

    // Buscar traducción exacta primero
    if (translations[header]) {
      return translations[header];
    }

    // Si no hay traducción exacta, buscar traducciones parciales
    let translatedHeader = header;
    Object.entries(translations).forEach(([english, spanish]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedHeader = translatedHeader.replace(regex, spanish);
    });

    return translatedHeader;
  }

  /**
   * Obtiene las etiquetas de la interfaz en español
   */
  getExcelPreviewLabels() {
    return {
      fileName: 'Nombre del archivo',
      fileSize: 'Tamaño del archivo',
      headers: 'Encabezados',
      dataPreview: 'Vista previa de datos',
      row: 'Fila',
      column: 'Columna',
      value: 'Valor',
      type: 'Tipo',
      totalRows: 'Total de filas',
      totalColumns: 'Total de columnas',
      detectedHeaders: 'Encabezados detectados',
      dataTypes: 'Tipos de datos detectados',
      importReady: 'Listo para importar',
      mappingInfo: 'Información de mapeo',
      systemField: 'Campo del sistema',
      excelColumn: 'Columna Excel',
      mapping: 'Mapeo'
    };
  }

  /**
   * Formatea el tamaño del archivo en español
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene información estadística del archivo Excel en español
   */
  getExcelStats() {
    if (!this.selectedFile || !this.excelHeaders.length) {
      return null;
    }

    const labels = this.getExcelPreviewLabels();
    const mapping = this.createAutomaticMapping();
    
    return {
      fileName: this.selectedFile.name,
      fileSize: this.formatFileSize(this.selectedFile.size),
      totalRows: this.excelPreviewData.length,
      totalColumns: this.excelHeaders.length,
      headersTranslated: this.excelHeaders.map(header => ({
        original: header,
        translated: this.translateExcelHeader(header),
        mapped: !!mapping[Object.keys(mapping).find(key => mapping[key] === header) || '']
      })),
      mappedFields: Object.keys(mapping).length,
      unmappedHeaders: this.excelHeaders.filter(header => 
        !Object.values(mapping).includes(header)
      ).length
    };
  }
}
