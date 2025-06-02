import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
async generatePdf(htmlContent: HTMLElement, fileName: string = 'oferta') {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const options = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollY: 0
  };

  const canvas = await html2canvas(htmlContent, options);
  const imgData = canvas.toDataURL('image/png');
  
  // Ajustar tamaño para mantener proporciones
  const imgWidth = 190; // ancho máximo en mm (A4)
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // En el servicio PdfService
  const remainingHeight = imgHeight - (doc.internal.pageSize.getHeight() - 20);
  if (remainingHeight > 0) {
    doc.addPage();
    doc.addImage(imgData, 'PNG', 10, 10 - remainingHeight, imgWidth, imgHeight);
  }
  
  doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    doc.save(`${fileName}.pdf`);
  }


  

}