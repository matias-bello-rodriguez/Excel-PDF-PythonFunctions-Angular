import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private pdfMakeInitialized = false;

  constructor() {
    this.initializePdfMake();
  }  private async initializePdfMake(): Promise<void> {
    if (typeof window !== 'undefined' && !this.pdfMakeInitialized) {
      try {
        window.pdfMake = pdfMake;
        const fonts = await import('pdfmake/build/vfs_fonts');
        // Acceder correctamente al vfs desde la importación
        window.pdfMake.vfs = fonts.default.vfs || fonts.vfs;
        
        // Configurar las fuentes predeterminadas
        window.pdfMake.fonts = {
          Roboto: {
            normal: 'Roboto-Regular.ttf',
            bold: 'Roboto-Medium.ttf',
            italics: 'Roboto-Italic.ttf',
            bolditalics: 'Roboto-MediumItalic.ttf'
          }
        };
        
        this.pdfMakeInitialized = true;
      } catch (error) {
        console.error('Error loading pdfMake fonts:', error);
      }
    }
  }
  async generatePdfDataUrl(content: TDocumentDefinitions): Promise<string> {
    await this.initializePdfMake();
    return new Promise((resolve, reject) => {
      try {
        const pdf = pdfMake.createPdf(content);
        pdf.getDataUrl((dataUrl) => {
          resolve(dataUrl);
        });
      } catch (error) {
        console.error('Error generando PDF DataUrl:', error);
        reject(error);
      }
    });
  }
  async downloadPdf(content: TDocumentDefinitions, filename: string): Promise<void> {
    await this.initializePdfMake();
    try {
      const pdf = pdfMake.createPdf(content);
      pdf.download(filename);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    }
  }
}
