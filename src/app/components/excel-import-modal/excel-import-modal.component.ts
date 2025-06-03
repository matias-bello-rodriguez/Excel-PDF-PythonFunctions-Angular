import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelImportService } from '../../services/excel-import.service';

@Component({
  selector: 'app-excel-import-modal',
  standalone: true,
  imports: [CommonModule],
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
  activeTab: 'upload' | 'preview' = 'upload';
  selectedFile: File | null = null;
  selectedFileName = '';
  excelHeaders: string[] = [];
  excelPreviewData: any[][] = [];
  isLoadingPreview = false;

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
      console.log('Excel data loaded:', {
        headers: this.excelHeaders,
        preview: this.excelPreviewData
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
    this.activeTab = 'upload';
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep(): void {
    if (this.activeTab === 'upload' && this.selectedFile) {
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
      // Crear mapeo automático basado en los headers del Excel
      const automaticMapping = this.createAutomaticMapping();
      
      // Verificar que se pudo crear un mapeo mínimo
      if (Object.keys(automaticMapping).length === 0) {
        throw new Error('No se pudo crear un mapeo automático de columnas. Verifica que los encabezados del Excel coincidan con los campos del sistema.');
      }

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
      'codigo': ['WINDOW CODE', 'CODE', 'CÓDIGO', 'codigo'],
      'ubicacion': ['Location', 'UBICACIÓN', 'ubicacion', 'UNITS'],
      'ancho_diseno': ['Width (m)', 'Width', 'ANCHO', 'ancho'],
      'alto_diseno': ['Height (m)', 'Height', 'ALTO', 'alto'],
      'superficie': ['Surface (m²)', 'Surface', 'SUPERFICIE', 'superficie'],
      'cantidad': ['Quantity', 'CANTIDAD', 'cantidad', 'QTY'],
      'precio_unitario_usd': ['Unit Price USD', 'Price', 'PRECIO', 'precio'],
      'costo_instalacion_clp': ['Install Cost CLP', 'Installation', 'INSTALACION', 'instalacion'],
      'precio_final_usd': ['Final Price USD', 'Final Price', 'PRECIO_FINAL', 'precio_final'],
      'total_instalacion_clp': ['Total Install CLP', 'Total Installation', 'TOTAL_INSTALACION', 'total_instalacion'],
      'total_pieza_usd': ['Piece Total USD', 'Piece Total', 'TOTAL_PIEZA', 'total_pieza'],
      'nombre': ['PRODUCT NAME', 'Name', 'NOMBRE', 'nombre'],
      'tipo_producto': ['PRODUCT TYPE', 'Type', 'TIPO', 'tipo'],
      'metodo_instalacion': ['INSTALL METHOD', 'Method', 'METODO', 'metodo'],
      'tipo_marco': ['FRAME TYPE', 'Frame', 'MARCO', 'marco'],
      'longitud_marco': ['FRAME LENGTH', 'Length', 'LONGITUD', 'longitud']
    };
    
    // Iterar sobre cada campo del sistema y buscar su correspondiente en el Excel
    Object.entries(specificMappings).forEach(([systemField, possibleHeaders]) => {
      for (const possibleHeader of possibleHeaders) {
        // Buscar coincidencia exacta (insensible a mayúsculas)
        const matchedHeader = this.excelHeaders.find(header => 
          header.toLowerCase().trim() === possibleHeader.toLowerCase().trim()
        );
        
        if (matchedHeader) {
          mapping[systemField] = matchedHeader;
          console.log(`Mapeado: ${systemField} -> ${matchedHeader}`);
          break; // Una vez que encontramos una coincidencia, salimos del bucle
        }
      }
    });
    
    console.log('Mapeo automático creado:', mapping);
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

    const mapping = this.createAutomaticMapping();
    
    return {
      fileName: this.selectedFile.name,
      fileSize: this.formatFileSize(this.selectedFile.size),
      totalRows: this.excelPreviewData.length,
      totalColumns: this.excelHeaders.length,
      mappedFields: Object.keys(mapping).length,
      unmappedHeaders: this.excelHeaders.filter(header => 
        !Object.values(mapping).includes(header)
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
}
