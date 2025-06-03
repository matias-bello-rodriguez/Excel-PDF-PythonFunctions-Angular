import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService } from '../../services/excel-import.service';
import { FormsModule } from '@angular/forms';

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

  // Estados del modal
  activeTab: 'upload' | 'preview' | 'mapping' = 'upload';
  selectedFile: File | null = null;
  selectedFileName = '';
  excelHeaders: string[] = [];
  excelPreviewData: any[][] = [];
  isLoadingPreview = false;

  // Propiedades para el mapeo de columnas
  systemFields: {id: string, name: string}[] = [
    {id: 'codigo', name: 'Código'},
    {id: 'ubicacion', name: 'Ubicación'},
    {id: 'ancho_diseno', name: 'Ancho'},
    {id: 'alto_diseno', name: 'Alto'},
    {id: 'superficie', name: 'Superficie'},
    {id: 'cantidad', name: 'Cantidad'},
    {id: 'precio_unitario_usd', name: 'Precio Unitario (USD)'},
    {id: 'costo_instalacion_clp', name: 'Costo Instalación (CLP)'},
    {id: 'precio_final_usd', name: 'Precio Final (USD)'},
    {id: 'total_instalacion_clp', name: 'Total Instalación (CLP)'},
    {id: 'total_pieza_usd', name: 'Total Pieza (USD)'},
    {id: 'nombre', name: 'Nombre'},
    {id: 'tipo_producto', name: 'Tipo Producto'},
    {id: 'metodo_instalacion', name: 'Método Instalación'},
    {id: 'tipo_marco', name: 'Tipo Marco'},
    {id: 'longitud_marco', name: 'Longitud Marco'}
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
      const preview = await this.excelService.generatePreview(this.selectedFile);
      this.excelHeaders = preview.headers;
      this.excelPreviewData = preview.data;
        // Mostrar headers disponibles para debugging
      console.log('Headers encontrados en Excel:', this.excelHeaders);
      
      // Aplicar mapeo automático después de cargar los headers
      this.columnMapping = this.createAutomaticMapping();
      
      console.log('Excel data loaded:', {
        headers: this.excelHeaders,
        preview: this.excelPreviewData,
        automaticMapping: this.columnMapping
      });
      this.activeTab = 'preview';
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      this.importError.emit('Error al cargar el archivo Excel');
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
    this.excelHeaders = [];
    this.isLoadingPreview = false;
    this.columnMapping = {};
    this.activeTab = 'upload';
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep(): void {
    if (this.activeTab === 'upload' && this.selectedFile) {
      this.activeTab = 'preview';
    } else if (this.activeTab === 'preview') {
      // Inicializar el mapeo automático antes de mostrar la pantalla de mapeo
      this.columnMapping = this.createAutomaticMapping();
      this.activeTab = 'mapping';
    }
  }

  /**
   * Retrocede al paso anterior
   */
  previousStep(): void {
    if (this.activeTab === 'preview') {
      this.activeTab = 'upload';
    } else if (this.activeTab === 'mapping') {
      this.activeTab = 'preview';
    }
  }

  /**
   * Importa los datos del Excel
   */
  async importExcel(): Promise<void> {
    if (!this.selectedFile) {
      alert('Por favor, selecciona un archivo Excel');
      return;
    }

    try {
      // Usar el mapeo manual si estamos en la pestaña de mapeo
      const mappingToUse = this.activeTab === 'mapping' 
        ? this.columnMapping 
        : this.createAutomaticMapping();
      
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
      'codigo': ['WINDOW CODE', 'CODE', 'CÓDIGO', 'codigo', 'window code', 'code', 'codigo'],
      'ubicacion': ['Location', 'UBICACIÓN', 'ubicacion', 'UNITS', 'location', 'units', 'ubicación'],
      'ancho_diseno': ['Width (m)', 'Width', 'ANCHO', 'ancho', 'width (m)', 'width', 'ancho_diseno', 'ancho diseno'],
      'alto_diseno': ['Height (m)', 'Height', 'ALTO', 'alto', 'height (m)', 'height', 'alto_diseno', 'alto diseno'],
      'superficie': ['Surface (m²)', 'Surface', 'SUPERFICIE', 'superficie', 'surface (m²)', 'surface', 'area', 'AREA'],
      'cantidad': ['Quantity', 'CANTIDAD', 'cantidad', 'QTY', 'qty', 'quantity', 'CANT', 'cant'],
      'precio_unitario_usd': ['Unit Price USD', 'Price', 'PRECIO', 'precio', 'unit price usd', 'price', 'precio_unitario', 'precio unitario', 'PRECIO_UNITARIO_USD', 'UNIT_PRICE_USD'],
      'costo_instalacion_clp': ['Install Cost CLP', 'Installation', 'INSTALACION', 'instalacion', 'install cost clp', 'installation', 'costo_instalacion', 'costo instalacion', 'COSTO_INSTALACION_CLP'],
      'precio_final_usd': ['Final Price USD', 'Final Price', 'PRECIO_FINAL', 'precio_final', 'final price usd', 'final price', 'precio final', 'PRECIO_FINAL_USD'],
      'total_instalacion_clp': ['Total Install CLP', 'Total Installation', 'TOTAL_INSTALACION', 'total_instalacion', 'total install clp', 'total installation', 'total instalacion', 'TOTAL_INSTALACION_CLP'],
      'total_pieza_usd': ['Piece Total USD', 'Piece Total', 'TOTAL_PIEZA', 'total_pieza', 'piece total usd', 'piece total', 'total pieza', 'TOTAL_PIEZA_USD'],
      'nombre': ['PRODUCT NAME', 'Name', 'NOMBRE', 'nombre', 'product name', 'name', 'descripcion', 'DESCRIPCION', 'description'],
      'tipo_producto': ['PRODUCT TYPE', 'Type', 'TIPO', 'tipo', 'product type', 'type', 'tipo_producto', 'tipo producto', 'categoria', 'CATEGORIA'],
      'metodo_instalacion': ['INSTALL METHOD', 'Method', 'METODO', 'metodo', 'install method', 'method', 'metodo_instalacion', 'metodo instalacion', 'installation_method'],
      'tipo_marco': ['FRAME TYPE', 'Frame', 'MARCO', 'marco', 'frame type', 'frame', 'tipo_marco', 'tipo marco', 'TIPO_MARCO'],
      'longitud_marco': ['FRAME LENGTH', 'Length', 'LONGITUD', 'longitud', 'frame length', 'length', 'longitud_marco', 'longitud marco', 'LONGITUD_MARCO']
    };
    
    // Función auxiliar para normalizar texto (remover acentos, espacios extra, etc.)
    const normalizeText = (text: string): string => {
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
      ).length
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
}
