import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService, ExtractedImage, ImageExtractionResponse } from '../../services/excel-import.service';
import { ProductoService } from '../../services/producto.service';
import { FormsModule } from '@angular/forms';
import { ExcelCellInfo, Producto } from '@app/interfaces/entities';
import JSZip from 'jszip';

// Interfaces
export interface ExcelImage {
  row?: number;
  column?: number;
  filename: string;
  data: string;
  mimeType: string;
  size?: number;
  extension?: string;
  cellAddress?: string;
  sheet?: string;
  columnLetter?: string;
  anchorType?: string;
}

@Component({
  selector: 'app-excel-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-import-modal.component.html',
  styleUrls: ['./excel-import-modal.component.scss']
})
export class ExcelImportModalComponent implements OnInit {
  @Input() showModal = false;
  @Input() cubicacionId: string | null = null;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() importSuccess = new EventEmitter<any[]>();
  @Output() importError = new EventEmitter<string>();
  @Output() imagesExtracted = new EventEmitter<ExtractedImage[]>();
    // Estados del modal
  activeTab: 'upload' | 'preview' | 'images' = 'upload';
  selectedFile: File | null = null;
  selectedFileName = '';
  excelHeaders: string[] = [];
  excelPreviewDataWithColors: ExcelCellInfo[][] = [];
  columnColors: { [key: string]: { backgroundColor: string; fontColor: string } } = {};
  coloredCellsStats: { yellow: number; cyan: number } = { yellow: 0, cyan: 0 };  // Estados para extracción de imágenes
  extractedImages: ExtractedImage[] = [];
  isExtractingImages = false;
  pythonServerAvailable = false;
  imageExtractionError: string | null = null;
  selectedImage: ExtractedImage | null = null; // Agregado para el modal de vista previa
  importedProducts: any[] = []; // Almacena los productos importados para referencia
  debugMappingMessage: string = ''; // Debug message for image mapping testing

  excelPreviewData: any[][] = [];
  isLoadingPreview = false;

  // Propiedades para el mapeo de columnas
  systemFields: {id: string, name: string}[] = [
    {id: 'codigo', name: 'Código'},
    {id: 'ubicacion', name: 'Ubicación'},
    {id: 'ancho_m', name: 'Ancho (m)'},
    {id: 'alto_m', name: 'Alto (m)'},
    {id: 'superficie', name: 'Superficie'},
    {id: 'cantidad_por_unidad', name: 'Cantidad por Unidad'},
    {id: 'superficie_total', name: 'Superficie Total'},
    {id: 'ancho_fabricacion_m', name: 'Ancho Fabricación (m)'},
    {id: 'alto_fabricacion_m', name: 'Alto Fabricación (m)'},
    {id: 'diseno_1', name: 'Diseño 1'},
    {id: 'diseno_2', name: 'Diseño 2'},
    {id: 'comentario_1', name: 'Comentario 1'},
    {id: 'comentario_2', name: 'Comentario 2'},
    {id: 'material', name: 'Material'},
    {id: 'perfil_mm', name: 'Perfil (mm)'},
    {id: 'color_body', name: 'Color Body'},
    {id: 'espesor_vidrio_mm', name: 'Espesor Vidrio (mm)'},
    {id: 'proteccion_vidrio', name: 'Protección Vidrio'},
    {id: 'color_film', name: 'Color Film'},
    {id: 'opaco_o_transparente', name: 'Opaco o Transparente'},
    {id: 'tipo_ventana', name: 'Tipo Ventana'},
    {id: 'tipo_vidrio', name: 'Tipo Vidrio'},
    {id: 'apertura', name: 'Apertura'},
    {id: 'cierre', name: 'Cierre'},
    //despues 

  ];
  
  columnMapping: { [key: string]: string } = {};

  // Variables para drag and drop
  draggedColumn: string | null = null;
  dragTarget: string | null = null;
  // Filtro de imágenes
  imageFilter: 'all' | 'assigned' | 'unassigned' = 'all';
  // Propiedades para mapeo de imágenes por fila
  imagesByRow: { [rowIndex: number]: ExtractedImage } = {};
  designColumnIndex: number = -1;

  // Estados para la asignación de imágenes a productos
  showAssignModal = false;
  selectedImageForAssignment: ExtractedImage | null = null;
  productSearchTerm = '';
  filteredProducts: any[] = [];
  selectedProductId: string | null = null;
  // Constantes
  private readonly START_ROW = 5; // Fila donde comienzan los datos
  // Estados para la inserción en base de datos
  isImportingToDatabase = false;
  importToDatabaseError: string | null = null;
  importToDatabaseSuccess: string | null = null;
  importProgress = 0;
  totalItemsToImport = 0;

  // Exponer Math para uso en template
  Math = Math;

  constructor(
    private excelService: ExcelImportService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    // Inicialización del componente
    this.checkPythonServer();
  }

  /**
   * Maneja la selección de archivo
   */
  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file && this.isValidExcelFile(file)) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      await this.loadPreviewData();
    } else {
      this.resetModal();
      alert('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
    }
  }

  /**
   * Valida si el archivo es un Excel válido
   */
  isValidExcelFile(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return allowedTypes.includes(file.type);
  }  /**
   * Carga la vista previa de los datos del Excel
   */
  async loadPreviewData(): Promise<void> {
    if (!this.selectedFile) return;

    this.isLoadingPreview = true;
    try {
      // Cargar datos con información de colores
      const previewWithColors = await this.excelService.generatePreviewWithColors(this.selectedFile);
      this.excelHeaders = previewWithColors.headers;
      this.excelPreviewDataWithColors = previewWithColors.data;
      this.columnColors = previewWithColors.columnColors;
      
      // Convertir datos con colores a formato simple para compatibilidad
      this.excelPreviewData = previewWithColors.data.map(row => 
        row.map(cell => cell.value)
      );
      
      // Calcular estadísticas de celdas coloreadas
      this.calculateColoredCellsStats();
      
      // Mostrar headers disponibles para debugging
      console.log('Headers encontrados en Excel:', this.excelHeaders);
      console.log('Celdas coloreadas encontradas:', this.coloredCellsStats);
        // Aplicar mapeo automático después de cargar los headers
      this.columnMapping = this.createAutomaticMapping();
      
      // Buscar y establecer la columna DESIGN automáticamente
      this.findDesignColumnIndex();
      
      console.log('Excel data loaded with colors:', {
        headers: this.excelHeaders,
        preview: this.excelPreviewData,
        coloredCells: this.coloredCellsStats,
        automaticMapping: this.columnMapping,
        designColumnIndex: this.designColumnIndex
      });
      
      // Cambiar a la pestaña de vista previa
      this.activeTab = 'preview';
      
      // Intentar extraer imágenes automáticamente si el servidor está disponible
      const serverStatus = await this.checkPythonServer();
      if (serverStatus) {
        console.log('Servidor Python disponible, extrayendo imágenes automáticamente...');
        this.extractImages(true);
      }
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      // Fallback a método sin colores si falla
      try {
        const preview = await this.excelService.generatePreview(this.selectedFile);
        this.excelHeaders = preview.headers;
        this.excelPreviewData = preview.data;
        this.columnMapping = this.createAutomaticMapping();
        this.activeTab = 'preview';
      } catch (fallbackError) {
        this.importError.emit('Error al cargar el archivo Excel');
      }
    } finally {
      this.isLoadingPreview = false;
    }
  }
  /**
   * Resetea el estado del modal
   */ resetModal(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.excelPreviewData = [];
    this.excelPreviewDataWithColors = [];
    this.excelHeaders = [];
    this.columnColors = {};
    this.coloredCellsStats = { yellow: 0, cyan: 0 };
    this.isLoadingPreview = false;
    this.columnMapping = {};
    this.activeTab = 'upload';
    this.selectedImage = null;
    this.extractedImages = [];
    this.importedProducts = [];
    
    // Resetear propiedades de mapeo de imágenes
    this.imagesByRow = {};
    this.designColumnIndex = -1;
  }

  /**
   * Avanza al siguiente paso
   */  nextStep(): void {
    if (this.activeTab === 'upload' && this.selectedFile) {
      this.activeTab = 'preview';
    } else if (this.activeTab === 'preview') {
      this.importExcel();
    }
  }
  /**
   * Retrocede al paso anterior
   */
  previousStep(): void {
    if (this.activeTab === 'preview') {
      this.activeTab = 'upload';
    }
  }
  /**
   * Importa los datos del Excel
   */
  async importExcel(): Promise<void> {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo Excel');
      return;
    }    try {
      // Usar el mapeo de columnas ya configurado
      const mappingToUse = this.columnMapping;
      
      // Verificar que se pudo crear un mapeo mínimo
      if (Object.keys(mappingToUse).length === 0) {
        throw new Error('No se pudo crear un mapeo de columnas. Verifica que has mapeado al menos algunos campos esenciales.');
      }

      console.log('Usando el siguiente mapeo para importar:', mappingToUse);
      
      // Primero, extraer imágenes si no se ha hecho todavía
      if (this.extractedImages.length === 0 && this.pythonServerAvailable) {        try {
          await new Promise<void>((resolve, reject) => {
            if (!this.selectedFile) {
              resolve();
              return;
            }
            this.excelService.extractImagesFromExcel(this.selectedFile).subscribe({
              next: (response: ImageExtractionResponse) => {
                if (response.success) {
                  this.extractedImages = response.images;
                  console.log(`Extracted ${this.extractedImages.length} images for import`);
                  resolve();
                } else {
                  console.warn('No se pudieron extraer imágenes: ' + response.message);
                  resolve(); // Continuamos sin imágenes
                }
              },
              error: (error) => {
                console.warn('Error extrayendo imágenes para importación:', error);
                resolve(); // Continuamos sin imágenes
              }
            });
          });
        } catch (error) {
          console.warn('Error al extraer imágenes, continuando sin ellas:', error);
          // Continuamos sin imágenes
        }
      }

      const importedData = await this.excelService.importExcel(
        this.selectedFile,
        mappingToUse
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
      });      // Verificar que los datos importados tienen al menos algunas propiedades válidas
      const validProducts = productsWithIds.filter(product => 
        Object.keys(product).length > 1 // Al menos una propiedad además del código
      );
      
      if (validProducts.length === 0) {
        throw new Error('No se pudieron extraer productos válidos del archivo. Verifica que los encabezados del Excel coincidan con los campos esperados.');
      }      // Si hay imágenes extraídas, intentar asignarlas a productos por código
      if (this.extractedImages.length > 0) {
        this.assignImagesToProducts();
        
        // Guardar los productos importados para referencia
        this.importedProducts = [...validProducts];
        
        // Mostrar resumen de asignación
        setTimeout(() => {
          this.showImageAssignmentPreview();
        }, 500);
      } else {
        this.importedProducts = [...validProducts];
      }

      // Asignar URLs de imágenes a productos antes de insertar en base de datos
      this.assignImageUrls(validProducts);

      // Insertar productos en la base de datos
      await this.insertProductsToDatabase(validProducts);

      // Emitir el evento de éxito
      this.importSuccess.emit(validProducts);
      
      // Cerrar el modal y resetear
      this.closeModal.emit();
      this.resetModal();
      
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
      
      this.importError.emit(errorMessage);
    }
  }

  /**
   * Crea un mapeo automático entre las columnas del Excel y los campos del sistema
   */
  private createAutomaticMapping(): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // No hay headers para mapear
    if (!this.excelHeaders || this.excelHeaders.length === 0) {
      console.warn('No hay encabezados para mapear');
      return mapping;
    }
      // Mapeo específico para los campos del Excel proporcionados
    const specificMappings: { [key: string]: string[] } = {
      'ubicacion': ['Location', 'UBICACIÓN', 'ubicacion', 'UNITS', 'location', 'units', 'ubicación'],
      'codigo': ['WINDOW CODE', 'CODE', 'CÓDIGO', 'codigo', 'window code', 'code', 'codigo'],
      'ancho_m': ['Width (m)', 'Width', 'ANCHO', 'ancho', 'width (m)', 'width', 'ancho_diseno', 'ancho diseno'],
      'alto_m': ['Height (m)', 'Height', 'ALTO', 'alto', 'height (m)', 'height', 'alto_diseno', 'alto diseno'],
      'superficie': ['Surface (m²)', 'Surface', 'SUPERFICIE', 'superficie', 'surface (m²)', 'surface', 'area', 'AREA'],
      'cantidad_por_unidad': ['Quantity', 'CANTIDAD', 'cantidad', 'QTY', 'qty', 'quantity', 'CANT', 'cant', 'QUANTITY', 'CANTIDAD','Quantity Per Unity' ],
      'superficie_total': ['Total Surface (m²)', 'Total Surface', 'SUPERFICIE_TOTAL', 'superficie_total', 'total surface (m²)', 'total surface', 'total superficie', 'TOTAL_SUPERFICIE'],
      'ancho_fabricacion_m': ['Fabrication Width (m)', 'Fabrication Width', 'ANCHO_FABRICACION', 'ancho_fabricacion', 'fabrication width (m)', 'fabrication width', 'ancho_fabricacion_m'],
      'alto_fabricacion_m': ['Fabrication Height (m)', 'Fabrication Height', 'ALTO_FABRICACION', 'alto_fabricacion', 'fabrication height (m)', 'fabrication height', 'alto_fabricacion_m'],
      'diseno_1': ['Design 1', 'Design 1', 'DISEÑO_1', 'diseño_1', 'design 1', 'design_1'],
      'diseno_2': ['Design 2', 'Design 2', 'DISEÑO_2', 'diseño_2', 'design 2', 'design_2'],
      'comentario_1': ['Comment 1', 'Comment 1', 'COMENTARIO_1', 'comentario_1', 'comment 1', 'comment_1'],
      'comentario_2': ['Comment 2', 'Comment 2', 'COMENTARIO_2', 'comentario_2', 'comment 2', 'comment_2'],
      'material': ['Material', 'MATERIAL', 'material', 'MATERIAL_TYPE', 'material type'],
      'perfil_mm': ['Profile (mm)', 'Profile', 'PERFIL_MM', 'perfil_mm', 'profile (mm)', 'profile mm', 'Profile', 'Perfil', 'Profile section'],
      'color_body': ['Body Color', 'Body Color', 'COLOR_BODY', 'color_body', 'body color', 'body color'],
      'espesor_vidrio_mm': ['Glass Thickness (mm)', 'Glass Thickness', 'ESPESOR_VIDRIO_MM', 'espesor_vidrio_mm', 'glass thickness (mm)', 'glass thickness mm', 'thickness glass'],
      'proteccion_vidrio': ['Glass Protection', 'Glass Protection', 'PROTECCION_VIDRIO', 'proteccion_vidrio', 'glass protection', 'glass_protection'],
      'color_film': ['Film Color', 'Film Color', 'COLOR_FILM', 'color_film', 'film color', 'film_color'],
      'opaco_o_transparente': ['Opaque or Transparent', 'Opaque or Transparent', 'OPACO_O_TRANSPARENTE', 'opaco_o_transparente', 'opaque or transparent', 'opaque_transparent', 'Opaque/Clear Glass'],
      'precio_unitario_usd': ['Unit Price USD', 'Price', 'PRECIO', 'precio', 'unit price usd', 'price', 'precio_unitario', 'precio unitario', 'PRECIO_UNITARIO_USD', 'UNIT_PRICE_USD'],
      'tipo_ventana': ['Window Type', 'Window Type', 'TIPO_VENTANA', 'tipo_ventana', 'window type', 'window_type'],
      'tipo_vidrio': ['Glass Type', 'Glass Type', 'TIPO_VIDRIO', 'tipo_vidrio', 'glass type', 'glass_type'],
      'apertura': ['Opening', 'Opening', 'APERTURA', 'apertura', 'opening'],
      'cierre': ['Closing', 'Closing', 'CIERRE', 'cierre', 'closing', 'Lock'],
      'precio_unitario_sqm_usd': ['Unit Price per sqm USD', 'Unit Price sqm', 'PRECIO_UNITARIO_SQM_USD', 'precio_unitario_sqm_usd', 'unit price sqm usd', 'unit price sqm', 'precio unitario sqm usd', 'precio unitario sqm', 'UNIT_PRICE_SQM_USD'],
      'precio_pieza_base_usd': ['Base Piece Price USD', 'Base Piece Price', 'PRECIO_PIEZA_BASE_USD', 'precio_pieza_base_usd', 'base piece price usd', 'base piece price', 'precio pieza base usd', 'precio pieza base'],
      'precio_total_pieza_usd': ['Piece Total USD', 'Piece Total', 'TOTAL_PIEZA', 'total_pieza', 'piece total usd', 'piece total', 'total pieza', 'TOTAL_PIEZA_USD'],
      
    };
    
    // Función auxiliar para normalizar texto (remover acentos, espacios extra, etc.)
    const normalizeText = (text: string): string => {

      if (!text) return '';
      // Convertir a minúsculas, eliminar espacios al inicio y final, y reemplazar caracteres especiales
      // con sus equivalentes sin acento, y reemplazar espacios múltiples por uno solo
      // y guiones bajos o guiones por espacios
      else
      return text.toLowerCase()
        .trim()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/\s+/g, ' ')
        .replace(/[_-]/g, ' ');
    };
    
    // Iterar sobre cada campo del sistema y buscar su correspondiente en el Excel
    Object.entries(specificMappings).forEach(([systemField, possibleHeaders]) => {
      for (const possibleHeader of possibleHeaders) {
        // Buscar coincidencia exacta (insensible a mayúsculas y normalizada)
        const matchedHeader = this.excelHeaders.find(header => 
          normalizeText(header) === normalizeText(possibleHeader)
        );
        
        if (matchedHeader) {
          mapping[systemField] = matchedHeader;
          console.log(`Mapeado exacto: ${systemField} -> ${matchedHeader}`);
          return; // Una vez que encontramos una coincidencia, salimos del forEach completo
        }
      }
      
      // Si no se encontró coincidencia exacta, buscar coincidencias parciales
      if (!mapping[systemField]) {
        for (const possibleHeader of possibleHeaders) {
          const matchedHeader = this.excelHeaders.find(header => {
            const normalizedHeader = normalizeText(header);
            const normalizedPossible = normalizeText(possibleHeader);
            
            // Buscar si el header contiene la palabra clave o viceversa
            return normalizedHeader.includes(normalizedPossible) || 
                   normalizedPossible.includes(normalizedHeader);
          });
          
          if (matchedHeader) {
            mapping[systemField] = matchedHeader;
            console.log(`Mapeado parcial: ${systemField} -> ${matchedHeader}`);
            return; // Una vez que encontramos una coincidencia, salimos del forEach completo
          }
        }
      }
    });
      console.log('Mapeo automático creado:', mapping);
    console.log('Headers no mapeados:', this.excelHeaders.filter(header => 
      !Object.values(mapping).includes(header)
    ));
    console.log('Campos del sistema sin mapear:', this.systemFields.filter(field => 
      !Object.keys(mapping).includes(field.id)
    ).map(field => field.name));
    
    return mapping;
  }

  /**
   * Cierra el modal
   */
  onCloseModal(): void {
    this.closeModal.emit();
    this.resetModal();
  }

  /**
   * Obtiene el tipo de celda para mostrar
   */
  getCellType(cell: any): string {
    if (typeof cell === 'number') return 'number';
    if (typeof cell === 'boolean') return 'boolean';
    return 'text';
  }
  /**
   * Formatea el contenido de la celda
   */
  formatCell(cell: any): string {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'number') return cell.toLocaleString();
    
    // Manejar errores de Excel
    const cellString = String(cell);
    if (cellString.startsWith('#') && (cellString.includes('VALUE') || cellString.includes('ERROR') || cellString.includes('N/A') || cellString.includes('DIV'))) {
      return ''; // Mostrar celda vacía para errores de Excel
    }
    
    return cellString;
  }
  /**
   * Obtiene estadísticas del archivo Excel
   */
  getExcelStats() {
    if (!this.selectedFile || !this.excelHeaders.length) {
      return null;
    }
    
    return {
      fileName: this.selectedFile.name,
      fileSize: this.formatFileSize(this.selectedFile.size),
      totalRows: this.excelPreviewData.length,
      totalColumns: this.excelHeaders.length,
      mappedFields: this.getMappedFieldsCount(),
      unmappedHeaders: this.excelHeaders.filter(header => 
        !Object.values(this.columnMapping).includes(header)
      ).length,
      coloredCells: this.coloredCellsStats
    };
  }


  /**
   * Formatea el tamaño del archivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Inicia el arrastre de una columna
   */
  onDragStart(event: DragEvent, column: string): void {
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column);
    }
  }

  /**
   * Maneja el evento cuando un elemento arrastrable entra en una zona de destino
   */
  onDragEnter(event: DragEvent, fieldId: string): void {
    event.preventDefault();
    this.dragTarget = fieldId;
  }

  /**
   * Maneja el evento cuando un elemento arrastrable se mueve sobre una zona de destino
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Maneja el evento cuando un elemento arrastrable sale de una zona de destino
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragTarget = null;
  }

  /**
   * Maneja el evento cuando se suelta un elemento arrastrable en una zona de destino
   */
  onDrop(event: DragEvent, fieldId: string): void {
    event.preventDefault();
    
    if (this.draggedColumn && fieldId) {
      // Si el campo ya está mapeado a otra columna, eliminamos ese mapeo
      if (this.isFieldMapped(fieldId)) {
        this.removeMapping(fieldId);
      }
      
      // Creamos el nuevo mapeo
      this.addMapping(fieldId, this.draggedColumn);
      
      // Reiniciamos las variables de arrastre
      this.draggedColumn = null;
      this.dragTarget = null;
    }
  }

  /**
   * Verifica si un campo del sistema ya está mapeado
   */
  isFieldMapped(fieldId: string): boolean {
    return Object.keys(this.columnMapping).includes(fieldId);
  }

  /**
   * Obtiene la columna del Excel mapeada a un campo del sistema
   */
  getMappedColumn(fieldId: string): string | null {
    return this.columnMapping[fieldId] || null;
  }

  /**
   * Verifica si hay mapeos en el columnMapping
   */
  hasMappings(): boolean {
    return Object.keys(this.columnMapping).length > 0;
  }

  /**
   * Obtiene todos los campos de sistema que aún no están mapeados
   */
  getUnmappedSystemFields(): {id: string, name: string}[] {
    return this.systemFields.filter(field => !this.isFieldMapped(field.id));
  }

  /**
   * Obtiene las columnas del Excel que aún no están mapeadas
   */
  getUnmappedExcelColumns(): string[] {
    const mappedColumns = Object.values(this.columnMapping);
    return this.excelHeaders.filter(header => !mappedColumns.includes(header));
  }

  /**
   * Agrega un nuevo mapeo de columna
   */
  addMapping(systemField: string, excelColumn: string): void {
    this.columnMapping[systemField] = excelColumn;
  }

  /**
   * Elimina un mapeo existente
   */
  removeMapping(systemField: string): void {
    delete this.columnMapping[systemField];
  }
  /**
   * Verifica si un encabezado de Excel ya está mapeado a algún campo
   */
  isHeaderMapped(header: string): boolean {
    return Object.values(this.columnMapping).includes(header);
  }

  /**
   * Obtiene la cantidad de campos mapeados
   */
  getMappedFieldsCount(): number {
    return Object.keys(this.columnMapping).length;
  }

  /**
   * Calcula estadísticas de celdas coloreadas
   */
  private calculateColoredCellsStats(): void {
    this.coloredCellsStats = { yellow: 0, cyan: 0 };
    
    if (!this.excelPreviewDataWithColors || this.excelPreviewDataWithColors.length === 0) {
      return;
    }
    
    this.excelPreviewDataWithColors.forEach(row => {
      row.forEach(cell => {
        if (this.isCellColorMatch(cell, 'FFFF00')) {
          this.coloredCellsStats.yellow++;
        }
        if (this.isCellColorMatch(cell, '66FFFF')) {
          this.coloredCellsStats.cyan++;
        }
      });
    });
  }

  /**
   * Verifica si una celda tiene un color específico
   */
  isCellColored(cell: any, colorHex: string): boolean {
    if (this.excelPreviewDataWithColors.length === 0) {
      return false;
    }
    
    // Si cell es un valor simple, buscar en los datos con colores
    const rowIndex = this.excelPreviewData.findIndex(row => row.includes(cell));
    if (rowIndex === -1) return false;
    
    const colIndex = this.excelPreviewData[rowIndex].indexOf(cell);
    if (colIndex === -1) return false;
    
    const cellWithColor = this.excelPreviewDataWithColors[rowIndex]?.[colIndex];
    return this.isCellColorMatch(cellWithColor, colorHex);
  }

  /**
   * Verifica si el color de una celda coincide con el color especificado
   */
  private isCellColorMatch(cell: ExcelCellInfo, targetColor: string): boolean {
    if (!cell || !cell.backgroundColor) return false;
    
    const cellColor = cell.backgroundColor.replace('#', '').toUpperCase();
    const target = targetColor.replace('#', '').toUpperCase();
    
    return cellColor === target;
  }

  /**
   * Obtiene el tooltip de color para una celda
   */
  getCellColorTooltip(cell: any): string {
    if (this.isCellColored(cell, 'FFFF00')) {
      return 'Celda marcada en amarillo';
    }
    if (this.isCellColored(cell, '66FFFF')) {
      return 'Celda marcada en cian';
    }
    return '';
  }

  /**
   * Obtiene información de color de una celda específica por posición
   */
  getCellColorInfo(rowIndex: number, colIndex: number): { isYellow: boolean; isCyan: boolean } {
    if (!this.excelPreviewDataWithColors[rowIndex] || !this.excelPreviewDataWithColors[rowIndex][colIndex]) {
      return { isYellow: false, isCyan: false };
    }

    const cell = this.excelPreviewDataWithColors[rowIndex][colIndex];
    return {
      isYellow: this.isCellColorMatch(cell, 'FFFF00'),
      isCyan: this.isCellColorMatch(cell, '66FFFF')
    };
  }
  /**
   * Extrae las imágenes del archivo Excel
   * @param silent Si es true, no muestra mensajes de error ni cambia a la pestaña de imágenes
   */  async extractImages(silent: boolean = false): Promise<void> {
    if (!this.selectedFile) {
      if (!silent) this.imageExtractionError = 'No hay archivo seleccionado';
      return;
    }

    this.isExtractingImages = true;
    if (!silent) this.imageExtractionError = null;    try {
      if (!this.selectedFile) {
        if (!silent) this.imageExtractionError = 'No hay archivo seleccionado';
        this.isExtractingImages = false;
        return;
      }
      this.excelService.extractImagesFromExcel(this.selectedFile).subscribe({        next: (response: ImageExtractionResponse) => {
          if (response.success) {
            this.extractedImages = response.images;
            console.log(`Extracted ${this.extractedImages.length} images`);
            
            // Mapear imágenes por posición de fila después de extraerlas
            this.mapImagesByRowPosition();
            
            if (!silent && this.extractedImages.length > 0) {
              // Cambiar a la pestaña de imágenes solo si no es silencioso y hay imágenes
              this.activeTab = 'images';
            }
          } else {
            if (!silent) this.imageExtractionError = response.message || 'Error al extraer imágenes';
          }
          this.isExtractingImages = false;
        },
        error: (error) => {
          console.error('Error extracting images:', error);
          if (!silent) this.imageExtractionError = 'Error de conexión con el servidor Python';
          this.isExtractingImages = false;
        }
      });
    } catch (error) {
      console.error('Error extracting images:', error);
      if (!silent) this.imageExtractionError = 'Error de conexión con el servidor Python';
      this.isExtractingImages = false;
    }
  }  /**
   * Verifica si el servidor Python está disponible para la extracción de imágenes
   * @returns Una promesa que resuelve a true si el servidor está disponible, false en caso contrario
   */
  async checkPythonServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/health');
      
      if (response.ok) {
        this.pythonServerAvailable = true;
        console.log('Servidor Python disponible');
        return true;
      } else {
        this.pythonServerAvailable = false;
        console.warn('Servidor Python no disponible, estado:', response.status);
        return false;
      }
    } catch (error) {
      this.pythonServerAvailable = false;
      console.error('Error al verificar el servidor Python:', error);
      return false;
    }
  }

  /**
   * Abre la pestaña de imágenes
   */
  openImagesTab(): void {
    this.activeTab = 'images';
    
    // Verificar disponibilidad del servidor Python al abrir la pestaña de imágenes
    this.checkPythonServer();
  }

  /**
   * Regresa a la pestaña anterior (upload o preview)
   */
  goBackToPreviousTab(): void {
    if (this.activeTab === 'images') {
      this.activeTab = 'preview';
    } else {
      this.activeTab = 'upload';
    }
  }

  /**
   * Copia el texto al portapapeles
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texto copiado al portapapeles: ' + text);
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
    });
  }
  /**
   * Descarga una imagen
   */
  downloadImage(image: ExtractedImage): void {
    const blob = this.excelService.base64ToBlob(image.data, image.mimeType);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = image.filename || 'imagen_extraida';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL objeto
    URL.revokeObjectURL(url);
  }

  /**
   * Elimina una imagen extraída
   */
  removeExtractedImage(image: ExtractedImage): void {
    this.extractedImages = this.extractedImages.filter(img => img !== image);
  }

  /**
   * Elimina todas las imágenes extraídas
   */
  removeAllExtractedImages(): void {
    this.extractedImages = [];
  }

  /**
   * Obtiene el estado de extracción de imágenes
   */
  getImageExtractionStatus(): string {
    if (this.isExtractingImages) {
      return 'Extrayendo imágenes...';
    }
    if (this.imageExtractionError) {
      return 'Error: ' + this.imageExtractionError;
    }
    if (this.extractedImages.length > 0) {
      return 'Imágenes extraídas: ' + this.extractedImages.length;
    }
    return 'No se han extraído imágenes';
  }

  /**
   * Obtiene el estilo CSS para una celda basada en su contenido
   */
  getCellStyle(cell: any): { [key: string]: string } {
    const baseStyle = {
      'padding': '8px',
      'border': '1px solid #ddd',
      'vertical-align': 'middle',
      'text-align': 'left'
    };
    
    if (typeof cell === 'number') {
      return { ...baseStyle, 'text-align': 'right' };
    }
    if (typeof cell === 'boolean') {
      return { ...baseStyle, 'text-align': 'center' };
    }
    return baseStyle;
  }

  /**
   * Formatea el valor de una celda para mostrarlo en la tabla
   */
  formatCellValue(cell: any): string {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'number') return cell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return String(cell);
  }

  /**
   * Obtiene el título de la columna basado en el mapeo
   */  getColumnTitle(fieldId: string): string {
    const mappedColumn = this.getMappedColumn(fieldId);
    if (mappedColumn) {
      const columnIndex = this.excelHeaders.indexOf(mappedColumn);
      if (columnIndex !== -1) {
        return this.excelHeaders[columnIndex];
      }
    }
    return fieldId;
  }

  /**
   * Obtiene el valor de una celda en la fila y columna especificadas
   */
  getCellValue(rowIndex: number, colIndex: number): any {
    if (this.excelPreviewData && this.excelPreviewData[rowIndex]) {
      return this.excelPreviewData[rowIndex][colIndex];
    }
    return null;
  }

  /**
   * Verifica si una fila tiene celdas coloreadas
   */
  hasColoredCells(row: any[]): boolean {
    return row.some(cell => cell && cell.backgroundColor && (cell.backgroundColor === 'FFFF00' || cell.backgroundColor === '66FFFF'));
  }

  /**
   * Obtiene el estilo de fila para resaltar filas con celdas coloreadas
   */
  getRowStyle(row: any[]): { [key: string]: string } {
    if (this.hasColoredCells(row)) {
      return {
        'background-color': '#f9f9c5', // Color de fondo suave
        'font-weight': 'bold'
      };
    }
    return {};
  }

  /**
   * Exporta los datos visibles de la tabla a un archivo CSV
   */
  exportToCSV(): void {
    const csvRows: string[] = [];
    
    // Obtener los encabezados
    const headers = this.excelHeaders.filter(header => this.getMappedColumn(header)).map(header => this.getColumnTitle(header));
    csvRows.push(headers.join(','));
    
    // Obtener las filas
    this.excelPreviewData.forEach(row => {
      const rowData = row.filter((cell, index) => this.getMappedColumn(this.excelHeaders[index]));
      csvRows.push(rowData.join(','));
    });
    
    // Crear un blob con los datos CSV y descargarlo
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'datos_exportados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Imprime los datos visibles de la tabla
   */
  printTable(): void {
    window.print();
  }

  // =================== MÉTODOS DE ASIGNACIÓN DE IMÁGENES ===================

  /**
   * Obtiene las imágenes filtradas según el estado seleccionado
   */
  getFilteredImages(): ExtractedImage[] {
    switch (this.imageFilter) {
      case 'assigned':
        return this.extractedImages.filter(img => this.isImageAssigned(img));
      case 'unassigned':
        return this.extractedImages.filter(img => !this.isImageAssigned(img));
      default:
        return this.extractedImages;
    }
  }

  /**
   * Verifica si una imagen está asignada a un producto
   */
  isImageAssigned(image: ExtractedImage): boolean {
    return !!(image as any).assignedProductId;
  }

  /**
   * Obtiene el número de imágenes asignadas
   */
  getAssignedImagesCount(): number {
    return this.extractedImages.filter(img => this.isImageAssigned(img)).length;
  }

  /**
   * Obtiene el código del producto asignado a una imagen
   */
  getAssignedProductCode(image: ExtractedImage): string | null {
    const productId = (image as any).assignedProductId;
    if (!productId) return null;
    
    const product = this.importedProducts.find(p => p.id === productId);
    return product ? (product.codigo || product.code || 'Sin código') : null;
  }
  /**
   * Asigna automáticamente las imágenes a los productos basándose en coincidencias de nombres
   */
  assignImagesToProducts(): void {
    if (!this.importedProducts || this.importedProducts.length === 0) {
      console.warn('No hay productos importados para asignar imágenes');
      return;
    }

    let assignedCount = 0;
    const assignmentLog: string[] = [];

    this.extractedImages.forEach(image => {
      // Solo procesar imágenes no asignadas
      if (this.isImageAssigned(image)) return;

      const bestMatch = this.findBestProductMatch(image);
      if (bestMatch) {
        (image as any).assignedProductId = bestMatch.id;
        assignedCount++;
        assignmentLog.push(`${image.filename} → ${bestMatch.codigo || bestMatch.code || 'Sin código'}`);
      }
    });

    console.log(`Asignadas automáticamente ${assignedCount} imágenes:`, assignmentLog);
    
    if (assignedCount > 0) {
      this.showImageAssignmentPreview();
    } else {
      alert('No se pudieron asignar imágenes automáticamente. Intente con asignación manual.');
    }
  }

  /**
   * Encuentra un producto basándose en la posición de fila
   */
  private findProductByRowPosition(imageRow: number): any | null {
    if (!this.importedProducts || !this.excelPreviewData) return null;

    // Buscar en los datos de vista previa para encontrar un producto en la misma fila
    // Consideramos un rango de ±2 filas para mayor flexibilidad
    const rowRange = 2;
    
    for (let i = Math.max(0, imageRow - rowRange - 2); i < Math.min(this.excelPreviewData.length, imageRow + rowRange); i++) {
      const rowData = this.excelPreviewData[i];
      if (!rowData) continue;

      // Buscar si alguna celda de esta fila contiene un código de producto
      for (let j = 0; j < rowData.length; j++) {
        const cellValue = this.formatCell(rowData[j]);
        if (!cellValue) continue;

        // Buscar producto que coincida con este valor de celda
        const matchingProduct = this.importedProducts.find(product => {
          const productCode = product.codigo || product.code || '';
          const productLocation = product.ubicacion || '';
          
          return productCode && (
            cellValue.toString().includes(productCode) ||
            productCode.includes(cellValue.toString()) ||
            (productLocation && cellValue.toString().includes(productLocation))
          );
        });

        if (matchingProduct) {
          console.log(`Producto encontrado en fila ${i + 1}: ${matchingProduct.codigo || matchingProduct.code} para imagen en fila ${imageRow}`);
          return matchingProduct;
        }
      }
    }

    return null;
  }

  /**
   * Encuentra el mejor producto coincidente para una imagen
   */
  private findBestProductMatch(image: ExtractedImage): any | null {
    if (!image.filename || !this.importedProducts.length) return null;

    // Normalizar el nombre del archivo (remover extensión, espacios, caracteres especiales)
    const imageBaseName = this.normalizeFileName(image.filename);
    
    let bestMatch: any = null;
    let bestScore = 0;

    this.importedProducts.forEach(product => {
      const score = this.calculateMatchScore(imageBaseName, product);
      if (score > bestScore && score > 0.6) { // Umbral mínimo de coincidencia del 60%
        bestScore = score;
        bestMatch = product;
      }
    });

    return bestMatch;
  }

  /**
   * Normaliza el nombre de archivo para comparación
   */
  private normalizeFileName(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[^a-z0-9]/g, '') // Solo letras y números
      .trim();
  }

  /**
   * Calcula el puntaje de coincidencia entre un nombre de imagen y un producto
   */
  private calculateMatchScore(imageName: string, product: any): number {
    const productFields = [
      product.codigo,
      product.code,
      product.ubicacion,
      product.location,
      product.diseno_1,
      product.diseno_2,
      product.design_1,
      product.design_2
    ].filter(field => field); // Filtrar campos vacíos

    if (productFields.length === 0) return 0;

    let maxScore = 0;

    productFields.forEach(field => {
      const normalizedField = this.normalizeFileName(String(field));
      const score = this.calculateStringMatchScore(imageName, normalizedField);
      maxScore = Math.max(maxScore, score);
    });

    return maxScore;
  }

  /**
   * Calcula el puntaje de coincidencia entre dos strings
   */
  private calculateStringMatchScore(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    // Calcular coincidencia exacta como substring
    if (str1.includes(str2) || str2.includes(str1)) {
      return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
    }

    // Calcular similitud usando algoritmo de distancia de Levenshtein simplificado
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.calculateLevenshteinDistance(shorter, longer);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula la distancia de Levenshtein entre dos strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Muestra un resumen de las asignaciones de imágenes realizadas
   */
  showImageAssignmentPreview(): void {
    const assignedImages = this.extractedImages.filter(img => this.isImageAssigned(img));
    
    if (assignedImages.length === 0) {
      alert('No hay imágenes asignadas para mostrar.');
      return;
    }

    const summary = assignedImages.map(img => {
      const productCode = this.getAssignedProductCode(img);
      return `• ${img.filename} → ${productCode}`;
    }).join('\n');

    const message = `Resumen de asignaciones (${assignedImages.length} imágenes):\n\n${summary}`;
    
    if (confirm(`${message}\n\n¿Desea continuar con estas asignaciones?`)) {
      console.log('Asignaciones confirmadas por el usuario');
      // Aquí se podrían guardar las asignaciones en el backend si fuera necesario
    }
  }

  /**
   * Abre el diálogo de asignación manual de imagen a producto
   */
  showAssignImageDialog(image: ExtractedImage): void {
    this.selectedImageForAssignment = image;
    this.filteredProducts = [...this.importedProducts];
    this.productSearchTerm = '';
    this.selectedProductId = (image as any).assignedProductId || null;
    this.showAssignModal = true;
  }

  /**
   * Cierra el diálogo de asignación de imagen
   */
  closeAssignImageDialog(): void {
    this.showAssignModal = false;
    this.selectedImageForAssignment = null;
    this.productSearchTerm = '';
    this.selectedProductId = null;
    this.filteredProducts = [];
  }

  /**
   * Selecciona un producto para la asignación
   */
  selectProductForAssignment(productId: string): void {
    this.selectedProductId = productId;
  }

  /**
   * Asigna la imagen seleccionada al producto seleccionado
   */
  assignImageToProduct(): void {
    if (!this.selectedImageForAssignment || !this.selectedProductId) {
      alert('Debe seleccionar una imagen y un producto para realizar la asignación.');
      return;
    }

    // Quitar asignación previa si existe
    this.extractedImages.forEach(img => {
      if ((img as any).assignedProductId === this.selectedProductId) {
        delete (img as any).assignedProductId;
      }
    });

    // Asignar la imagen al producto
    (this.selectedImageForAssignment as any).assignedProductId = this.selectedProductId;

    const product = this.importedProducts.find(p => p.id === this.selectedProductId);
    const productCode = product ? (product.codigo || product.code || 'Sin código') : 'Producto desconocido';
    
    alert(`Imagen "${this.selectedImageForAssignment.filename}" asignada a producto "${productCode}"`);
    
    this.closeAssignImageDialog();
  }

  /**
   * Filtra los productos basándose en el término de búsqueda
   */
  filterProducts(): void {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = [...this.importedProducts];
      return;
    }

    const searchTerm = this.productSearchTerm.toLowerCase().trim();
    this.filteredProducts = this.importedProducts.filter(product => {
      const searchFields = [
        product.codigo,
        product.code,
        product.ubicacion,
        product.location,
        product.diseno_1,
        product.diseno_2,
        product.design_1,
        product.design_2,
        product.material,
        product.comentario_1,
        product.comentario_2,
        product.comment_1,
        product.comment_2
      ].filter(field => field);

      return searchFields.some(field => 
        String(field).toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Obtiene el texto del producto para mostrar en la lista
   */
  getProductDisplayText(product: any): string {
    const code = product.codigo || product.code || 'Sin código';
    const location = product.ubicacion || product.location || '';
    const dimensions = `${product.ancho_m || product.width || '?'}x${product.alto_m || product.height || '?'}m`;
    
    return `${code} - ${location} (${dimensions})`;
  }

  /**
   * Elimina la asignación de una imagen
   */
  removeImageAssignment(image: ExtractedImage): void {
    if (confirm(`¿Está seguro de que desea quitar la asignación de "${image.filename}"?`)) {
      delete (image as any).assignedProductId;
    }
  }

  /**
   * Función de prueba con datos de ejemplo
   */
  testWithSampleData(): void {
    console.log('Ejecutando prueba con datos de ejemplo...');
    
    // Simular productos importados
    this.importedProducts = [
      {
        id: 'prod1',
        codigo: 'WIN001',
        ubicacion: 'SALON',
        ancho_m: 1.5,
        alto_m: 1.2,
        material: 'Aluminio'
      },
      {
        id: 'prod2', 
        codigo: 'WIN002',
        ubicacion: 'COCINA',
        ancho_m: 0.8,
        alto_m: 1.0,
        material: 'PVC'
      },
      {
        id: 'prod3',
        codigo: 'WIN003',
        ubicacion: 'DORMITORIO',
        ancho_m: 1.2,
        alto_m: 1.5,
        material: 'Madera'
      }
    ];    // Simular imágenes extraídas
    this.extractedImages = [
      {
        filename: 'WIN001_design.jpg',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        mimeType: 'image/jpeg',
        size: 1024,
        extension: 'jpg'
      },
      {
        filename: 'cocina_window.png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        size: 2048,
        extension: 'png'
      },
      {
        filename: 'unknown_image.jpg',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        mimeType: 'image/jpeg',
        size: 1536,
        extension: 'jpg'
      }
    ];

    console.log('Datos de ejemplo cargados:');
    console.log('- Productos:', this.importedProducts.length);
    console.log('- Imágenes:', this.extractedImages.length);

    // Cambiar a la pestaña de imágenes
    this.activeTab = 'images';    // Ejecutar asignación automática después de un breve delay
    setTimeout(() => {
      this.assignImagesToProducts();
    }, 1000);
  }

  // =================== MÉTODOS PARA EXPORTAR E IMAGEN MODAL ===================

  /**
   * Exporta las imágenes extraídas a un archivo ZIP
   */  async exportImagesToZIP(): Promise<void> {
    if (this.extractedImages.length === 0) {
      alert('No hay imágenes para exportar');
      return;
    }
    
    try {
      // Crear un archivo ZIP y agregar las imágenes
      const zip = new JSZip();
      this.extractedImages.forEach(image => {
        zip.file(image.filename || 'imagen_extraida', image.data, { base64: true });
      });
      
      // Generar el archivo ZIP y descargarlo
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = 'imagenes_extraidas.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL objeto
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error('Error al exportar imágenes a ZIP:', error);
      alert('Error al crear el archivo ZIP');
    }
  }

  /**
   * Abre el modal para ver la imagen en tamaño completo
   */
  openImageModal(image: ExtractedImage): void {
    this.selectedImage = image;
    // Prevenir el scroll en el cuerpo cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cierra el modal de imagen
   */
  closeImageModal(): void {
    this.selectedImage = null;
    // Restaurar el scroll en el cuerpo
    document.body.style.overflow = 'auto';
  }
  /**
   * Obtiene la imagen correspondiente a una fila específica
   */
  public getImageForRow(rowIndex: number): ExtractedImage | undefined {
    // Solo devolver la imagen si tenemos una columna de diseño válida
    if (this.designColumnIndex === -1) {
      return undefined;
    }
    
    return this.imagesByRow[rowIndex];
  }  /**
   * Mapea las imágenes extraídas a las filas correspondientes basándose en mapeo secuencial
   * NUEVO: Las imágenes se mapean secuencialmente a filas consecutivas, no por posición original
   */
  private mapImagesByRowPosition(): void {
    // Primero, encontrar la columna de diseño
    this.findDesignColumnIndex();
    if (this.designColumnIndex === -1) {
      console.warn('No se encontró columna de diseño. No se mapearán imágenes.');
      return;
    }

    // Limpiar el mapeo anterior
    this.imagesByRow = {};

    console.log('Iniciando mapeo secuencial de imágenes...', {
      totalImagenes: this.extractedImages.length,
      columnaDiseno: this.designColumnIndex,
      headerDiseno: this.excelHeaders[this.designColumnIndex],
      filasTotales: this.excelPreviewData.length
    });

    // NUEVO ALGORITMO: Mapeo secuencial
    // Filtrar solo las imágenes que están en la columna de diseño
    const designImages = this.extractedImages.filter(image => {
      const imageColumn = image.column || 0;
      return imageColumn === this.designColumnIndex;
    });

    console.log(`Encontradas ${designImages.length} imágenes en columna de diseño de ${this.extractedImages.length} totales`);

    // Mapear las imágenes secuencialmente a filas consecutivas
    designImages.forEach((image, sequentialIndex) => {
      // Usar el índice secuencial directamente (0, 1, 2, etc.)
      const targetRowIndex = sequentialIndex;
      
      if (targetRowIndex >= 0 && targetRowIndex < this.excelPreviewData.length) {
        this.imagesByRow[targetRowIndex] = image;
        console.log(`✅ Imagen "${image.filename}" mapeada secuencialmente:`, {
          ordenExtraccion: sequentialIndex + 1,
          filaDestino: targetRowIndex,
          posicionOriginalExcel: image.row,
          cellAddress: image.cellAddress
        });
      } else {
        console.warn(`❌ Imagen "${image.filename}" no pudo mapearse:`, {
          ordenExtraccion: sequentialIndex + 1,
          filaDestino: targetRowIndex,
          maxFilasDisponibles: this.excelPreviewData.length
        });
      }
    });

    // Reportar imágenes ignoradas (fuera de columna de diseño)
    const ignoredImages = this.extractedImages.filter(image => {
      const imageColumn = image.column || 0;
      return imageColumn !== this.designColumnIndex;
    });

    if (ignoredImages.length > 0) {
      console.log(`⚠️ ${ignoredImages.length} imágenes ignoradas (no están en columna de diseño):`, 
        ignoredImages.map(img => ({
          filename: img.filename,
          columna: img.column,
          columnaEsperada: this.designColumnIndex
        }))
      );
    }

    console.log('🎯 Mapeo secuencial completado:', {
      imagenesMapeadas: Object.keys(this.imagesByRow).length,
      imagenesEnColumnaDiseno: designImages.length,
      imagenesIgnoradas: ignoredImages.length,
      filasTotales: this.excelPreviewData.length,
      algoritmo: 'SECUENCIAL (imagen 1 → fila 1, imagen 2 → fila 2, etc.)'
    });
  }

  /**
   * Determina el índice de la columna DESIGN
   */
  private findDesignColumnIndex(): void {
    this.designColumnIndex = this.excelHeaders.findIndex(header => 
      header && (
        header.toLowerCase().includes('design') ||
        header.toLowerCase().includes('diseño') ||
        header.toLowerCase().includes('diseno') ||
        header.toLowerCase().includes('image') ||
        header.toLowerCase().includes('imagen')
      )
    );
    
    console.log('Índice de columna DESIGN encontrado:', this.designColumnIndex, 'Header:', this.excelHeaders[this.designColumnIndex]);
  }
  /**
   * Método para depurar el contenido de las celdas en la columna de diseño
   */
  public debugDesignColumnContent(): void {
    if (this.designColumnIndex === -1) {
      console.log('❌ No se encontró columna de diseño para depurar');
      return;
    }

    console.log('🔍 DEPURANDO CONTENIDO DE COLUMNA DE DISEÑO');
    console.log(`Columna de diseño: ${this.designColumnIndex} (${this.excelHeaders[this.designColumnIndex]})`);
    
    // Revisar las primeras 10 filas de la columna de diseño
    for (let i = 0; i < Math.min(10, this.excelPreviewData.length); i++) {
      const cellValue = this.excelPreviewData[i][this.designColumnIndex];
      const cellType = typeof cellValue;
      const formattedValue = this.formatCell(cellValue);
      
      console.log(`Fila ${i + 1}:`, {
        rawValue: cellValue,
        type: cellType,
        formattedValue: formattedValue,
        isEmpty: cellValue === null || cellValue === undefined || cellValue === '',
        isValueError: formattedValue === '#value' || String(cellValue).includes('#')
      });
    }
    
    // Revisar si hay imágenes mapeadas
    console.log('\n🖼️ IMÁGENES MAPEADAS:');
    Object.entries(this.imagesByRow).forEach(([rowIndex, image]) => {
      console.log(`Fila ${rowIndex}: ${image.filename}`);
    });  }

  /**
   * Debug method: Simple logging of current image mapping state
   */
  logImageMappingState(): void {
    console.log('📊 Estado actual del mapeo de imágenes:');
    console.log('extractedImages:', this.extractedImages);
    console.log('imagesByRow:', this.imagesByRow);
    console.log('excelPreviewData.length:', this.excelPreviewData.length);
    console.log('designColumnIndex:', this.designColumnIndex);
    
    this.debugMappingMessage = `Información mostrada en consola. Imágenes: ${this.extractedImages.length}, Filas mapeadas: ${Object.keys(this.imagesByRow).length}`;
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      this.debugMappingMessage = '';
    }, 3000);
  }

  /**
   * Tests and verifies the current image row mapping state
   * This method checks the integrity of the image-to-row mapping system
   */
  testImageRowMapping(): void {
    console.log('🔍 Iniciando verificación del mapeo de imágenes a filas...');
    
    // Basic state verification
    const extractedCount = this.extractedImages.length;
    const mappedCount = Object.keys(this.imagesByRow).length;
    const designColumnExists = this.designColumnIndex !== -1;
    
    console.log('Estado básico:', {
      imagenesExtraidas: extractedCount,
      imagenesMapeadas: mappedCount,
      columnaDiseno: this.designColumnIndex,
      headerColumnaDiseno: designColumnExists ? this.excelHeaders[this.designColumnIndex] : 'No encontrada',
      filasDeExcel: this.excelPreviewData.length
    });
    
    // Test 1: Design column validation
    let issues = [];
    if (!designColumnExists) {
      issues.push('❌ No se encontró columna de diseño');
    } else {
      console.log(`✅ Columna de diseño encontrada: ${this.excelHeaders[this.designColumnIndex]} (índice: ${this.designColumnIndex})`);
    }
    
    // Test 2: Image position validation
    if (extractedCount > 0) {
      let validMappings = 0;
      let invalidMappings = 0;
      
      this.extractedImages.forEach((image, index) => {
        const imageRow = image.row;
        const imageColumn = image.column;
        const adjustedRow = imageRow !== undefined ? imageRow - this.START_ROW : undefined;
        
        if (imageRow !== undefined && imageColumn === this.designColumnIndex) {
          if (adjustedRow !== undefined && adjustedRow >= 0 && adjustedRow < this.excelPreviewData.length) {
            validMappings++;
            const isMapped = this.imagesByRow[adjustedRow] === image;
            console.log(`✅ Imagen "${image.filename}": fila ${imageRow} → índice ${adjustedRow} ${isMapped ? '(mapeada)' : '(NO mapeada)'}`);
          } else {
            invalidMappings++;
            console.log(`❌ Imagen "${image.filename}": fila ${imageRow} fuera de rango (ajustada: ${adjustedRow})`);
          }
        } else if (imageColumn !== this.designColumnIndex) {
          console.log(`⚠️ Imagen "${image.filename}": columna ${imageColumn} (no es diseño)`);
        } else {
          invalidMappings++;
          console.log(`❌ Imagen "${image.filename}": sin información de fila`);
        }
      });
      
      console.log(`Mapeos válidos: ${validMappings}, Mapeos inválidos: ${invalidMappings}`);
      
      if (invalidMappings > 0) {
        issues.push(`❌ ${invalidMappings} imágenes con mapeo inválido`);
      }
    }
    
    // Test 3: Row mapping consistency
    let orphanedRows = 0;
    Object.entries(this.imagesByRow).forEach(([rowIndex, image]) => {
      const rowNum = parseInt(rowIndex);
      const imageExists = this.extractedImages.includes(image);
      
      if (!imageExists) {
        orphanedRows++;
        console.log(`❌ Fila ${rowNum} mapea a imagen inexistente`);
      } else {
        console.log(`✅ Fila ${rowNum} → "${image.filename}"`);
      }
    });
    
    if (orphanedRows > 0) {
      issues.push(`❌ ${orphanedRows} filas mapean a imágenes inexistentes`);
    }
    
    // Test 4: Display integration test
    let displayErrors = 0;
    for (let i = 0; i < this.excelPreviewData.length; i++) {
      const imageForRow = this.getImageForRow(i);
      const mappedImage = this.imagesByRow[i];
      
      if (imageForRow !== mappedImage) {
        displayErrors++;
        console.log(`❌ Inconsistencia en fila ${i}: getImageForRow=${imageForRow?.filename || 'null'}, imagesByRow=${mappedImage?.filename || 'null'}`);
      }
    }
    
    if (displayErrors > 0) {
      issues.push(`❌ ${displayErrors} inconsistencias en la integración de visualización`);
    }
    
    // Final report
    const success = issues.length === 0;
    const statusIcon = success ? '✅' : '❌';
    const statusText = success ? 'EXITOSO' : 'CON PROBLEMAS';
    
    console.log(`\n${statusIcon} RESULTADO DE LA VERIFICACIÓN: ${statusText}`);
    console.log(`Resumen: ${extractedCount} imágenes extraídas, ${mappedCount} mapeadas, ${issues.length} problemas encontrados`);
    
    if (issues.length > 0) {
      console.log('\nProblemas encontrados:');
      issues.forEach(issue => console.log(issue));
    }
    
    // Update debug message
    this.debugMappingMessage = `Verificación completada: ${statusText}. ${extractedCount} imágenes, ${mappedCount} mapeadas, ${issues.length} problemas.`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      this.debugMappingMessage = '';
    }, 5000);
  }

  /**
   * Forces a complete remapping of images and runs diagnostics
   */
  forceRemapImages(): void {
    console.log('🔄 Forzando remapeo completo de imágenes...');
    
    // Clear existing mappings
    this.imagesByRow = {};
    
    // Force re-detection of design column
    this.findDesignColumnIndex();
    
    // Re-map all images
    this.mapImagesByRowPosition();
    
    // Run verification test
    this.testImageRowMapping();
    
    this.debugMappingMessage = 'Remapeo forzado completado. Verificación ejecutada.';
    
    setTimeout(() => {
      this.debugMappingMessage = '';
    }, 4000);
  }

  /**
   * Public method to map images based on their position in Excel cells
   * This method is called from the UI to manually trigger image mapping
   */
  mapImagesByPosition(): void {
    console.log('🗺️ Mapeando imágenes por posición...');
    
    if (this.extractedImages.length === 0) {
      this.debugMappingMessage = 'No hay imágenes extraídas para mapear.';
      return;
    }
    
    // Clear existing mappings
    this.imagesByRow = {};
    
    // Perform the mapping
    this.mapImagesByRowPosition();
    
    const mappedCount = Object.keys(this.imagesByRow).length;
    console.log(`✅ Mapeo completado: ${mappedCount} imágenes mapeadas de ${this.extractedImages.length} disponibles`);
    
    this.debugMappingMessage = `Mapeo por posición completado: ${mappedCount}/${this.extractedImages.length} imágenes mapeadas.`;
      setTimeout(() => {
      this.debugMappingMessage = '';
    }, 3000);
  }

  /**
   * Asigna URLs de imágenes a productos basándose en el mapeo de filas
   */
  assignImageUrls(products: any[]): void {
    console.log('🔗 Asignando URLs de imágenes a productos...');
    
    products.forEach((product, index) => {
      const rowIndex = index + this.START_ROW; // Ajustar por fila de inicio
      const mappedImage = this.imagesByRow[rowIndex];
      
      if (mappedImage) {
        // Asignar URL de imagen como base64 data URL
        product.imagen_url = `data:${mappedImage.mimeType};base64,${mappedImage.data}`;
        product.imagen_filename = mappedImage.filename;
        console.log(`✅ Imagen asignada al producto ${product.codigo}: ${mappedImage.filename}`);
      }
    });
  }

  /**
   * Inserta productos en la base de datos usando ProductoService
   */
  async insertProductsToDatabase(products: any[]): Promise<void> {
    if (!this.cubicacionId) {
      console.warn('No se puede insertar en base de datos: cubicacionId no disponible');
      return;
    }

    console.log('💾 Iniciando inserción en base de datos...');
    
    this.isImportingToDatabase = true;
    this.importToDatabaseError = null;
    this.importToDatabaseSuccess = null;
    this.totalItemsToImport = products.length;
    this.importProgress = 0;

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Convertir producto de Excel a formato Producto de la base de datos
        const productoFormatted: Partial<Producto> = {
          id: crypto.randomUUID(),
          cubicacion_id: this.cubicacionId,
          codigo: product.codigo || `PROD-${Date.now()}-${i}`,
          ubicacion: product.ubicacion,
          ancho_m: this.parseNumber(product.ancho_m),
          alto_m: this.parseNumber(product.alto_m),
          superficie: this.parseNumber(product.superficie),
          superficie_total: this.parseNumber(product.superficie_total),
          cantidad_por_unidad: this.parseNumber(product.cantidad_por_unidad),
          alto_fabricacion_m: this.parseNumber(product.alto_fabricacion_m),
          ancho_fabricacion_m: this.parseNumber(product.ancho_fabricacion_m),
          diseno_1: product.diseno_1,
          diseno_2: product.diseno_2,
          comentario_1: product.comentario_1,
          comentario_2: product.comentario_2,
          material: product.material,
          tipo_vidrio: product.tipo_vidrio || 'Standard',
          tipo_ventana: product.tipo_ventana,
          perfil_mm: product.perfil_mm,
          color_body: product.color_body,
          color_film: product.color_film,
          espesor_vidrio_mm: product.espesor_vidrio_mm,
          opaco_o_transparente: product.opaco_o_transparente,
          apertura: product.apertura,
          cierre: product.cierre,
          proteccion_vidrio: product.proteccion_vidrio,
          precio_unitario_sqm_usd: this.parseNumber(product.precio_unitario_sqm_usd),
          precio_pieza_base_usd: this.parseNumber(product.precio_pieza_base_usd),
          precio_total_pieza_usd: this.parseNumber(product.precio_total_pieza_usd)
        };

        // Insertar producto en base de datos
        await this.productoService.create(productoFormatted as Producto);
        
        // Actualizar progreso
        this.importProgress = Math.round(((i + 1) / products.length) * 100);
        
        console.log(`✅ Producto ${i + 1}/${products.length} insertado: ${productoFormatted.codigo}`);
      }

      this.importToDatabaseSuccess = `${products.length} productos insertados exitosamente en la base de datos`;
      console.log('✅ Inserción en base de datos completada exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error al insertar productos en base de datos:', error);
      this.importToDatabaseError = `Error al insertar productos: ${error.message || error}`;
      throw error; // Re-lanzar el error para que sea manejado por el caller
    } finally {
      this.isImportingToDatabase = false;
    }
  }

  /**
   * Convierte una cadena o número a número, maneja valores vacíos o inválidos
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    
    const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }
}