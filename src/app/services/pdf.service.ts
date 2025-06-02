import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {
    // Registrar fuente Roboto si la necesitas
    // doc.addFont('path/to/Roboto-Regular.ttf', 'Roboto', 'normal');
  }

  async generatePdf(htmlContent: HTMLElement, fileName: string = 'oferta'): Promise<boolean> {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    try {
      // Obtener dimensiones de la página A4 en mm
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10; // margen en mm
      const contentWidth = pageWidth - (2 * margin);
      
      // Configuración mejorada para capturar el HTML
      const options = {
        scale: 2, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        scrollY: 0,
        windowWidth: htmlContent.scrollWidth,
        backgroundColor: '#FFFFFF', // Fondo blanco
        logging: false, // Desactivar logs
        imageTimeout: 15000, // Timeout para imágenes
        removeContainer: true // Limpiar después de generar
      };
      
      const canvas = await html2canvas(htmlContent, options);
      const imgData = canvas.toDataURL('image/png', 1.0); // Calidad máxima
      
      // Calcular la altura proporcional
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Manejar múltiples páginas si el contenido es largo
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;
      
      // Añadir primera página
      doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 2 * margin);
      
      // Añadir páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        pageNumber++;
        doc.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 2 * margin);
        
        // Agregar número de página
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${pageNumber}`, pageWidth - 25, pageHeight - 10);
      }
      
      // Agregar número en la primera página
      doc.setPage(1);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página 1/${pageNumber}`, pageWidth - 25, pageHeight - 10);
      
      // Guardar el PDF con marca de agua
      doc.save(`${fileName}_${new Date().getTime()}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      return false;
    }
  }

  // Método helper para limpiar el nombre del archivo
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9]/gi, '_') // Reemplazar caracteres no alfanuméricos
      .toLowerCase();
  }
}