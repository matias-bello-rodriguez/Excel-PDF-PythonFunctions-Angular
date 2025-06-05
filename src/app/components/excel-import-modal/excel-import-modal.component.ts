import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService, ExtractedImage, ImageExtractionResponse } from '../../services/excel-import.service';
import { FormsModule } from '@angular/forms';
import { ExcelCellInfo } from '@app/interfaces/entities';
import JSZip from 'jszip';

@Component({
  selector: 'app-excel-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-import-modal.component.html',
  styleUrls: ['./excel-import-modal.component.scss']
})
export class ExcelImportModalComponent {
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
  coloredCellsStats: { yellow: number; cyan: number } = { yellow: 0, cyan: 0 };

  // Estados para extracción de imágenes
  extractedImages: ExtractedImage[] = [];
  isExtractingImages = false;
  pythonServerAvailable = false;
  imageExtractionError: string | null = null;

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

  constructor(private excelService: ExcelImportService) {}

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
  }
  /**
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
      
      console.log('Excel data loaded with colors:', {
        headers: this.excelHeaders,
        preview: this.excelPreviewData,
        coloredCells: this.coloredCellsStats,
        automaticMapping: this.columnMapping
      });
      this.activeTab = 'preview';
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
   */
 resetModal(): void {
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
      });

      // Verificar que los datos importados tienen al menos algunas propiedades válidas
      const validProducts = productsWithIds.filter(product => 
        Object.keys(product).length > 1 // Al menos una propiedad además del código
      );
      
      if (validProducts.length === 0) {
        throw new Error('No se pudieron extraer productos válidos del archivo. Verifica que los encabezados del Excel coincidan con los campos esperados.');
      }

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
    return String(cell);
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
   */  async extractImages(): Promise<void> {
    if (!this.selectedFile) {
      this.imageExtractionError = 'No hay archivo seleccionado';
      return;
    }

    this.isExtractingImages = true;
    this.imageExtractionError = null;

    try {
      this.excelService.extractImagesFromExcel(this.selectedFile).subscribe({        next: (response: ImageExtractionResponse) => {
          if (response.success) {
            this.extractedImages = response.images;
            console.log(`Extracted ${this.extractedImages.length} images`);
          } else {
            this.imageExtractionError = response.message || 'Error al extraer imágenes';
          }
          this.isExtractingImages = false;
        },
        error: (error) => {
          console.error('Error extracting images:', error);
          this.imageExtractionError = 'Error de conexión con el servidor Python';
          this.isExtractingImages = false;
        }
      });
    } catch (error) {
      console.error('Error extracting images:', error);
      this.imageExtractionError = 'Error de conexión con el servidor Python';
      this.isExtractingImages = false;
    }
  }
  /**
   * Verifica si el servidor Python está disponible para la extracción de imágenes
   */
  async checkPythonServer(): Promise<void> {
    try {
      const response = await fetch('http://localhost:8000/health');
      
      if (response.ok) {
        this.pythonServerAvailable = true;
        console.log('Servidor Python disponible');
      } else {
        this.pythonServerAvailable = false;
        console.warn('Servidor Python no disponible, estado:', response.status);
      }
    } catch (error) {
      this.pythonServerAvailable = false;
      console.error('Error al verificar el servidor Python:', error);
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
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      // Crear una tabla HTML para imprimir
      let tableHTML = '<table style="width:100%; border-collapse:collapse;">';
      
      // Agregar los encabezados
      tableHTML += '<tr>';
      this.excelHeaders.forEach(header => {
        const mappedColumn = this.getMappedColumn(header);
        if (mappedColumn) {
          tableHTML += `<th style="border:1px solid #ddd; padding:8px; background-color:#f2f2f2;">${this.getColumnTitle(header)}</th>`;
        }
      });
      tableHTML += '</tr>';
      
      // Agregar las filas
      this.excelPreviewData.forEach(row => {
        tableHTML += '<tr>';
        row.forEach((cell, index) => {
          if (this.getMappedColumn(this.excelHeaders[index])) {
            tableHTML += `<td style="border:1px solid #ddd; padding:8px;">${this.formatCellValue(cell)}</td>`;
          }
        });
        tableHTML += '</tr>';
      });
      tableHTML += '</table>';
      
      // Escribir el contenido en la ventana de impresión
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Datos</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h2>Datos Importados</h2>
            ${tableHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } else {
      console.error('No se pudo abrir la ventana de impresión');
    }
  }

  /**
   * Exporta las imágenes extraídas a un archivo ZIP
   */
  async exportImagesToZIP(): Promise<void> {
    if (this.extractedImages.length === 0) {
      alert('No hay imágenes para exportar');
      return;
    }
    
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
  }

  /**
   * Abre el modal para ver la imagen en tamaño completo
   */
  openImageModal(image: ExtractedImage): void {
    // Lógica para abrir el modal de imagen
  }

  /**
   * Cierra el modal de imagen
   */
  closeImageModal(): void {
    // Lógica para cerrar el modal de imagen
  }

  /**
   * Inicializa el componente
   */
  ngOnInit(): void {
    // Lógica de inicialización si es necesaria
  }

  /**
   * Maneja el evento cuando el modal se cierra
   */
  ngOnDestroy(): void {
    // Limpiar recursos o suscripciones si es necesario
  }

  /**
   * Método de prueba para simular la extracción de imágenes
   */  testImageExtraction(): void {
    this.extractedImages = [
      {
        filename: 'imagen1.png',
        mimeType: 'image/png',
        size: 1024,
        extension: 'png',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'
      },
      {
        filename: 'imagen2.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        extension: 'jpg',
        data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoH'
      }
    ];
  }
}