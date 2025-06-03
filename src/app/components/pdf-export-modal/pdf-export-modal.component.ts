import { Component, EventEmitter, Input, Output, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../services/pdf.service';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-pdf-export-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-export-modal.component.html',
  styleUrls: ['./pdf-export-modal.component.scss']
})
export class PdfExportModalComponent {
  @Input() showModal = false;
  @Input() productos: any[] = [];
  @Input() cubicacionInfo: any = null;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() exportSuccess = new EventEmitter<string>();
  @Output() exportError = new EventEmitter<string>();

  exportPreviewUrl: string = '';
  safeExportUrl: SafeResourceUrl = '';
  isGeneratingPdf = false;
  
  // Propiedades para las opciones de exportación
  exportOptions = {
    includeImages: false,
    includeDescription: true,
    includePrices: true,
    includeStock: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    pageSize: 'A4' as 'A4' | 'A3' | 'LETTER' | 'LEGAL'
  };

  // Propiedades para la vista previa y estado
  showPreview = false;
  isExporting = false;
  exportProgress = 0;
  progressMessage = '';
  errorMessage = '';
  currentDate = new Date();

  // Productos para vista previa (limitados)
  get previewProducts() {
    return this.productos.slice(0, 5); // Solo mostrar 5 productos en vista previa
  }

  constructor(
    private pdfService: PdfService,
    private errorService: ErrorService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Genera la vista previa del PDF
   */
  async generatePreview(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('La exportación no está disponible en el servidor.');
      return;
    }

    try {
      this.isGeneratingPdf = true;
      
      // Generar el nombre del archivo
      const fileName = this.cubicacionInfo 
        ? `Listado_Productos_${this.cubicacionInfo.codigo}_${new Date().getTime()}`
        : `Listado_Productos_${new Date().getTime()}`;
        
      // Obtener definición del documento
      const docDefinition = this.getDocDefinition();
      
      // Aquí podrías generar una URL de vista previa si el servicio lo soporta
      // Por ahora, simplemente marcamos como listo para descargar
      this.exportPreviewUrl = 'ready';
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      this.errorService.handle(error, 'Generando vista previa de PDF');
      this.exportError.emit('Error al generar la vista previa del PDF');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  /**
   * Descarga el PDF generado
   */
  async downloadPdf(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.isGeneratingPdf = true;
      
      // Obtener el elemento HTML que contiene la tabla de productos
      const element = document.querySelector('.productos-table');
      if (!element) {
        throw new Error('No se encontró el contenido para generar el PDF');
      }

      // Generar el nombre del archivo
      const fileName = this.cubicacionInfo 
        ? `Listado_Productos_${this.cubicacionInfo.codigo}_${new Date().getTime()}`
        : `Listado_Productos_${new Date().getTime()}`;

      // Llamar al método actualizado del servicio PDF
      const success = await this.pdfService.generatePdf(element as HTMLElement, fileName);
      
      if (!success) {
        throw new Error('Error al generar el PDF');
      }

      this.exportSuccess.emit(fileName);
      this.closeModal.emit();

    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.errorService.handle(error, 'Generando PDF');
      this.exportError.emit('Error al generar el PDF');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  /**
   * Abre la vista previa del PDF en una nueva pestaña
   */
  openPdfPreview(): void {
    if (this.exportPreviewUrl && isPlatformBrowser(this.platformId)) {
      window.open(this.exportPreviewUrl, '_blank');
    }
  }

  /**
   * Obtiene la definición del documento PDF
   */
  private getDocDefinition(): any {
    // Información básica del documento
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      info: {
        title: `Listado de Productos - ${this.cubicacionInfo?.codigo || 'Proyecto'}`,
        author: 'Kinetta',
        subject: 'Lista de productos',
        creator: 'Sistema Kinetta'
      },
      content: [
        // Encabezado
        {
          text: 'LISTADO DE PRODUCTOS',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        
        // Información del proyecto
        {
          columns: [
            {
              text: [
                { text: 'Proyecto: ', bold: true },
                this.cubicacionInfo?.nombre || 'Sin nombre'
              ]
            },
            {
              text: [
                { text: 'Código: ', bold: true },
                this.cubicacionInfo?.codigo || 'Sin código'
              ],
              alignment: 'right'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        
        // Fecha de generación
        {
          text: [
            { text: 'Fecha de generación: ', bold: true },
            new Date().toLocaleDateString('es-ES')
          ],
          alignment: 'right',
          margin: [0, 0, 0, 20]
        },
        
        // Tabla de productos
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              // Encabezados
              [
                { text: 'Código', style: 'tableHeader' },
                { text: 'Nombre', style: 'tableHeader' },
                { text: 'Tipo', style: 'tableHeader' },
                { text: 'Ubicación', style: 'tableHeader' },
                { text: 'Cantidad', style: 'tableHeader' },
                { text: 'Dimensiones', style: 'tableHeader' },
                { text: 'Superficie', style: 'tableHeader' }
              ],
              // Datos
              ...this.productos.map(producto => [
                producto.codigo || '',
                producto.nombre || '',
                producto.tipo_producto || '',
                producto.ubicacion || '',
                producto.cantidad?.toString() || '0',
                this.formatDimensions(producto.ancho_diseno, producto.alto_diseno),
                this.formatSurface(producto.superficie)
              ])
            ]
          },
          layout: {
            fillColor: function(rowIndex: number) {
              return (rowIndex === 0) ? '#f8f9fa' : (rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa');
            },
            hLineWidth: function() { return 0.5; },
            vLineWidth: function() { return 0.5; },
            hLineColor: function() { return '#dee2e6'; },
            vLineColor: function() { return '#dee2e6'; }
          }
        },
        
        // Resumen
        {
          text: [
            { text: 'Total de productos: ', bold: true },
            this.productos.length.toString()
          ],
          margin: [0, 20, 0, 0],
          alignment: 'right'
        }
      ],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#198038'
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f8f9fa'
        },
        tableCell: {
          fontSize: 9
        }
      },
      
      defaultStyle: {
        fontSize: 10,
        font: 'Helvetica'
      }
    };

    return docDefinition;
  }

  /**
   * Formatea las dimensiones
   */
  private formatDimensions(ancho?: number, alto?: number): string {
    if (!ancho && !alto) return '-';
    if (ancho && alto) return `${ancho.toFixed(2)} x ${alto.toFixed(2)} m`;
    if (ancho) return `${ancho.toFixed(2)} m (ancho)`;
    if (alto) return `${alto.toFixed(2)} m (alto)`;
    return '-';
  }

  /**
   * Formatea la superficie
   */
  private formatSurface(superficie?: number): string {
    if (!superficie) return '-';
    return `${superficie.toFixed(2)} m²`;
  }

  /**
   * Cierra el modal
   */
  onCloseModal(): void {
    this.closeModal.emit();
    this.exportPreviewUrl = '';
    this.safeExportUrl = '';
  }
  /**
   * Obtiene estadísticas de la exportación
   */
  getExportStats() {
    return {
      totalProducts: this.productos.length,
      filteredProducts: this.productos.length, // Por ahora igual al total
      estimatedPages: Math.ceil(this.productos.length / 25), // Estimación de 25 productos por página
      estimatedSize: `${Math.round(this.productos.length * 0.1)} KB`, // Estimación aproximada
      projectName: this.cubicacionInfo?.nombre || 'Sin nombre',
      projectCode: this.cubicacionInfo?.codigo || 'Sin código',
      totalSurface: this.productos.reduce((sum, p) => sum + (p.superficie || 0), 0),
      totalQuantity: this.productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
    };
  }

  /**
   * Maneja el clic en el overlay del modal
   */
  onOverlayClick(event: Event): void {
    this.onClose();
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    this.closeModal.emit();
    this.exportPreviewUrl = '';
    this.safeExportUrl = '';
    this.showPreview = false;
    this.isExporting = false;
    this.errorMessage = '';
  }

  /**
   * Alterna la vista previa
   */
  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  /**
   * Inicia la exportación del PDF
   */
  async onExport(): Promise<void> {
    if (this.isExporting) return;

    try {
      this.isExporting = true;
      this.exportProgress = 0;
      this.progressMessage = 'Preparando exportación...';
      this.errorMessage = '';

      // Simular progreso
      for (let i = 0; i <= 100; i += 20) {
        this.exportProgress = i;
        this.progressMessage = `Generando PDF... ${i}%`;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Llamar al método de descarga
      await this.downloadPdf();

    } catch (error) {
      console.error('Error durante la exportación:', error);
      this.errorMessage = 'Error al exportar el PDF';
      this.exportError.emit('Error al exportar el PDF');
    } finally {
      this.isExporting = false;
      this.exportProgress = 0;
      this.progressMessage = '';
    }
  }
}
