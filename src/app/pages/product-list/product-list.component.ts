import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { TablePaginationComponent } from '../../components/table-pagination/table-pagination.component';
import { ColumnDialogComponent } from '../../components/column-dialog/column-dialog.component';
import { FilterDialogComponent } from '../../components/filter-dialog/filter-dialog.component';
import { ExcelImportService } from '../../services/excel-import.service';
import { PdfService } from '../../services/pdf.service';
import { TableColumn } from '../../types/table.types';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    AddButtonComponent,
    SearchBarComponent,
    DataTableComponent,
    TablePaginationComponent,
    ColumnDialogComponent,
    FormsModule,
    FilterDialogComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  pageTitle: string = 'Gestión de Productos';
  searchTerm: string = '';
  
  columns: TableColumn[] = [
    { key: 'houseTowerCode', label: 'HOUSE/TOWER (CODE)', type: 'text', sortable: true, draggable: false, visible: true },
    { key: 'units', label: 'UNITS', type: 'number', sortable: true, draggable: true, visible: true },
    // { key: 'location', label: 'Location', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'windowCode', label: 'WINDOW CODE', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'width', label: 'Width (m)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'height', label: 'Height (m)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'surface', label: 'Surface (m2)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'quantityPerUnit', label: 'Quantity PER UNIT', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'totalSurface', label: 'Total surface (m2)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'manufacturingWidth', label: 'MANUFACTURING WIDTH', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'manufacturingHeight', label: 'MANUFACTURING HEIGHT', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'design1', label: 'DESIGN 1', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'design2', label: 'DESIGN 2', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'comment1', label: 'COMMENT 1', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'comment2', label: 'COMMENT 2', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'material', label: 'Material', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'profileSection', label: 'Profile section', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'bodyColor', label: 'Body color', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'glassThickness', label: 'Glass thikness', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'glassProtection', label: 'glass protection', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'filmColor', label: 'Film color', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'opaqueClearGlass', label: 'Opaque/Clear glass', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'windowType', label: 'Window Type', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'glassType', label: 'Glass type', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'opening', label: 'OPENING', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'lock', label: 'Lock', type: 'text', sortable: true, draggable: true, visible: true },
    { key: 'unitPriceUsdSqm', label: 'UNIT PRICE USD/SQM', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'pieceBasePrice', label: 'PIECE BASE PRICE (USD)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'pieceTotal', label: 'piece Total (USD)', type: 'number', sortable: true, draggable: true, visible: true },
    { key: 'actions', label: 'Acciones', type: 'actions', sortable: false, draggable: false, visible: true }
  ];

  defaultColumns: TableColumn[] = [...this.columns];
  productos: any[] = [
    {
      houseTowerCode: 'H001',
      units: 1,
      location: 'Living Room',
      windowCode: 'WC001', 
      width: 1.2,
      height: 1.5,
      surface: 1.8,
      quantityPerUnit: 2,
      totalSurface: 3.6,
      manufacturingWidth: 1.25,
      manufacturingHeight: 1.55,
      design1: 'Modern',
      design2: 'Minimalist',
      comment1: 'Special installation',
      comment2: 'Premium quality',
      material: 'Aluminum',
      profileSection: 'Standard',
      bodyColor: 'White',
      glassThickness: '6mm',
      glassProtection: 'Tempered',
      filmColor: 'Clear',
      opaqueClearGlass: 'Clear',
      windowType: 'Sliding',
      glassType: 'Double',
      opening: 'Horizontal',
      lock: 'Standard',
      unitPriceUsdSqm: 150.00,
      pieceBasePrice: 270.00,
      pieceTotal: 540.00
    }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  originalProductos = [...this.productos];
  hasActiveFilters = false;
  pinnedItems: Set<string> = new Set();
  cubicacionId: string | null = null;
  showFilterMenu = false;
  showColumnMenu = false;
  uniqueValues: { [key: string]: string[]; } | undefined;
  filters: any = {};
  // Excel modal properties
  activeTab: 'upload' | 'preview' = 'upload';
  showExcelModal = false;
  showExportModal = false;
  selectedFileName = '';
  selectedFile: File | null = null;
  excelHeaders: string[] = [];
  excelPreviewData: any[][] = [];
  isLoadingPreview = false;
  exportPreviewUrl: string = '';
  safeExportUrl: SafeResourceUrl = '';
  // Translation feature
  isTranslated: boolean = false;
  originalLanguageColumns: TableColumn[] = [];  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private excelService: ExcelImportService,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.route.paramMap.subscribe((params: any) => {
      this.cubicacionId = params.get('cubicacionId');
    });

    this.totalItems = this.productos.length;
  }  ngOnInit(): void {
    // La inicialización de pdfMake se maneja en el PdfService
    
    // Guardar copia de las columnas originales para la funcionalidad de traducción
    this.originalLanguageColumns = JSON.parse(JSON.stringify(this.columns));
  }

  // Método para navegar al formulario de agregar producto
  nuevoProducto(): void {
    this.router.navigate(['/productos/agregar-producto']);
  }// Métodos para diálogos
  toggleFilterDialog(): void {
    this.showFilterMenu = !this.showFilterMenu;
  }

  toggleColumnDialog(): void {
    this.showColumnMenu = !this.showColumnMenu;
  }

  /**
   * Alternar entre el idioma original y el español para las etiquetas de columnas
   */
  toggleTranslation(): void {
    if (!this.isTranslated) {
      // Guardar las columnas originales si es la primera vez
      if (this.originalLanguageColumns.length === 0) {
        this.originalLanguageColumns = JSON.parse(JSON.stringify(this.columns));
      }
      
      // Traducir las etiquetas de columnas al español
      this.columns = this.columns.map(column => {
        const translatedColumn = { ...column };
        
        // Mapeo de traducciones
        const translations: { [key: string]: string } = {
          'HOUSE/TOWER (CODE)': 'CASA/TORRE (CÓDIGO)',
          'UNITS': 'UNIDADES',
          'WINDOW CODE': 'CÓDIGO DE VENTANA',
          'Width (m)': 'Ancho (m)',
          'Height (m)': 'Alto (m)',
          'Surface (m2)': 'Superficie (m2)',
          'Quantity PER UNIT': 'Cantidad POR UNIDAD',
          'Total surface (m2)': 'Superficie total (m2)',
          'MANUFACTURING WIDTH': 'ANCHO DE FABRICACIÓN',
          'MANUFACTURING HEIGHT': 'ALTO DE FABRICACIÓN',
          'DESIGN 1': 'DISEÑO 1',
          'DESIGN 2': 'DISEÑO 2',
          'COMMENT 1': 'COMENTARIO 1',
          'COMMENT 2': 'COMENTARIO 2',
          'Material': 'Material',
          'Profile section': 'Sección de perfil',
          'Body color': 'Color de cuerpo',
          'Glass thikness': 'Espesor del vidrio',
          'glass protection': 'Protección del vidrio',
          'Film color': 'Color de película',
          'Opaque/Clear glass': 'Vidrio opaco/transparente',
          'Window Type': 'Tipo de ventana',
          'Glass type': 'Tipo de vidrio',
          'OPENING': 'APERTURA',
          'Lock': 'Cerradura',
          'UNIT PRICE USD/SQM': 'PRECIO UNITARIO USD/m²',
          'PIECE BASE PRICE (USD)': 'PRECIO BASE POR PIEZA (USD)',
          'piece Total (USD)': 'Total por pieza (USD)',
          'Actions': 'Acciones'
        };
        
        // Asignar traducción si existe, sino mantener la etiqueta original
        translatedColumn.label = translations[column.label] || column.label;
        
        return translatedColumn;
      });
      
      this.isTranslated = true;
    } else {
      // Volver a las etiquetas originales
      this.columns = JSON.parse(JSON.stringify(this.originalLanguageColumns));
      this.isTranslated = false;
    }
  }  /**
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
  }  private calculateTotal(): number {
    return this.originalProductos.reduce((total, producto) => 
      total + (producto.pieceTotal || 0), 0);
  }private getDocDefinition(): TDocumentDefinitions {
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
              text: `Total de productos: ${this.originalProductos.length}`,
              style: 'summaryInfo'
            },
            {
              text: `Total superficie: ${this.originalProductos.reduce((sum, p) => sum + (p.totalSurface || 0), 0).toFixed(2)} m²`,
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
              ],              // Filas de datos
              ...this.originalProductos.map((producto, index) => [
                { text: producto.windowCode || '', style: 'tableCell' },
                { text: producto.location || '', style: 'tableCell' },
                { text: producto.windowType || '', style: 'tableCell' },
                { text: `${producto.width?.toFixed(2) || '0.00'}m`, style: 'tableCellCenter' },
                { text: `${producto.height?.toFixed(2) || '0.00'}m`, style: 'tableCellCenter' },
                { text: producto.quantityPerUnit || '0', style: 'tableCellCenter' },
                { text: producto.material || '', style: 'tableCell' },
                { text: `${producto.totalSurface?.toFixed(2) || '0.00'} m²`, style: 'tableCellRight' },
                { text: `$${producto.unitPriceUsdSqm?.toFixed(2) || '0.00'}`, style: 'tableCellRight' },
                { text: `$${producto.pieceTotal?.toFixed(2) || '0.00'}`, style: 'tableCellRightBold' }
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
                body: [                  [
                    { text: 'Superficie Total:', style: 'summaryLabel' },
                    { text: `${this.originalProductos.reduce((sum, p) => sum + (p.totalSurface || 0), 0).toFixed(2)} m²`, style: 'summaryValue' }
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

  applyFilters(appliedFilters: any): void {
    this.filters = appliedFilters;
    this.hasActiveFilters = Object.keys(appliedFilters).length > 0;
    this.showFilterMenu = false;
  }

  clearFilters(): void {
    this.filters = {};
    this.hasActiveFilters = false;
    this.showFilterMenu = false;
  }

  applyColumnChanges(newColumns?: TableColumn[]): void {
    if (newColumns) {
      this.columns = newColumns;
    }
    this.showColumnMenu = false;
  }

  cancelColumnChanges(): void {
    this.columns = JSON.parse(JSON.stringify(this.defaultColumns));
    this.showColumnMenu = false;
  }

  togglePin(id: string): void {
    if (this.pinnedItems.has(id)) {
      this.pinnedItems.delete(id);
    } else {
      this.pinnedItems.add(id);
    }
  }

  onColumnReorder(columns: TableColumn[]): void {
    this.columns = columns;
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
  }  async importExcel(): Promise<void> {
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
      
      // Añadir identificador para cada producto si no existe
      const productsWithIds = importedData.map((product, index) => {
        if (!product.codigo) {
          product.codigo = `PROD-${Date.now()}-${index}`;
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
      
      // Agregar los nuevos productos a la tabla
      this.productos = [...this.productos, ...validProducts];
      
      // Actualizar el conteo total de items para la paginación
      this.totalItems = this.productos.length;
      
      // Guardar copia de los productos originales
      this.originalProductos = [...this.productos];
      
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
    
    // Crear un mapa de los labels de las columnas del sistema para comparación
    const systemLabels = new Map(
      this.columns
        .filter(col => col.key !== 'actions')
        .map(col => [col.label.toLowerCase().trim(), col.key])
    );
    
    // Objeto para rastrear qué columnas del sistema ya están mapeadas
    const mappedSystemKeys = new Set();

    // 1. Buscar coincidencias exactas primero
    this.excelHeaders.forEach(header => {
      if (!header) return; // Ignorar encabezados vacíos
      
      const normalizedHeader = header.toLowerCase().trim();
      const systemKey = systemLabels.get(normalizedHeader);
      
      if (systemKey && !mappedSystemKeys.has(systemKey)) {
        mapping[systemKey] = header;
        mappedSystemKeys.add(systemKey);
      }
    });
    
    // 2. Buscar coincidencias parciales para las columnas restantes
    if (mappedSystemKeys.size < systemLabels.size) {
      this.excelHeaders.forEach(header => {
        if (!header) return; // Ignorar encabezados vacíos
        
        const normalizedHeader = header.toLowerCase().trim();
        
        // Buscar coincidencias parciales para columnas no mapeadas
        systemLabels.forEach((key, label) => {
          // Solo considerar columnas que aún no están mapeadas
          if (!mappedSystemKeys.has(key)) {
            // Verificar si el encabezado del Excel contiene la etiqueta del sistema
            // o viceversa
            if (normalizedHeader.includes(label) || label.includes(normalizedHeader)) {
              mapping[key] = header;
              mappedSystemKeys.add(key);
            }
          }
        });
      });
    }
    
    // Diagnóstico: Ver qué columnas no se pudieron mapear
    if (mappedSystemKeys.size < systemLabels.size) {
      const unmappedColumns = Array.from(systemLabels.entries())
        .filter(([_, key]) => !mappedSystemKeys.has(key))
        .map(([label, key]) => ({ label, key }));
      
      console.warn('Columnas no mapeadas:', unmappedColumns);
    }

    console.log('Mapeo automático creado:', mapping);
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

  // Manejo de paginación
  onPageChange(page: number): void {
    this.currentPage = page;
    // Aquí podrías implementar lógica adicional como cargar datos de una API
    console.log(`Página cambiada a: ${page}`);
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    // Resetear a la primera página cuando se cambia el tamaño
    this.currentPage = 1;
    console.log(`Tamaño de página cambiado a: ${size}`);
  }

  // Helper methods for Excel-like display
  getLetter(index: number): string {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode((index % 26) + 65) + result;
      index = Math.floor(index / 26) - 1;
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
}