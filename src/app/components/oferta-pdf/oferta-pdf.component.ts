import { Component, Input, ViewChild, ElementRef, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PdfService } from '../../services/pdf.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-oferta-pdf',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './oferta-pdf.component.html',
  styleUrls: ['./oferta-pdf.component.scss']
})
export class OfertaPdfComponent implements OnInit {
  @Input() productos: any[] = [];
  @Input() cubicacion: any = null;
  @Input() cliente: any = null;
  @Input() showModal: boolean = false;
  @ViewChild('pdfContent') pdfContent!: ElementRef;
  
  @Output() closeModal = new EventEmitter<void>();

  currentDate = new Date().toLocaleDateString('es-ES');
  
  constructor(private pdfService: PdfService) {}
  
  ngOnInit() {
    console.log('Productos para oferta:', this.productos);
    console.log('Cubicación:', this.cubicacion);
  }
  
  generatePdf() {
    if (!this.pdfContent) {
      console.error('No se puede encontrar el contenido del PDF');
      return;
    }
    
    const fileName = `Oferta_${this.cliente?.nombre || 'Cliente'}_${this.cubicacion?.codigo || 'Proyecto'}`;
    this.pdfService.generatePdf(this.pdfContent.nativeElement, fileName);
  }
  
  getProductTitle(producto: any): string {
    // Generar un título para cada producto
    return producto.codigo || `Producto ${producto.id}`;
  }

  getVidrioDetails(producto: any): string {
    const detalles = [
      producto.material,
      producto.espesor_vidrio,
      producto.color_estructura,
      producto.tipo_vidrio,
      producto.tipo_apertura
    ].filter(Boolean);
    
    return detalles.join('; ').toUpperCase();
  }

 
  getTotalPieces(): number {
    return this.productos.reduce((sum, p) => 
      sum + (p.cantidad || 0), 0);
  }
  
  getDimensionDetails(producto: any): string
     {
     if (!producto.ancho && !producto.alto) return 'N/A';
     
     const ancho = producto.ancho ? parseFloat(producto.ancho) : undefined;
     const alto = producto.alto ? parseFloat(producto.alto) : undefined;
     
     return this.formatDimension(ancho, alto);
     }
  
  formatDimension(ancho?: number, alto?: number): string {
    if (!ancho && !alto) return 'N/A';
    const anchoStr = ancho ? ancho.toFixed(2) + 'm' : '';
    const altoStr = alto ? alto.toFixed(2) + 'm' : '';
    return `${anchoStr} x ${altoStr}`;
  }
  
  formatNumber(value: number): string {
    return value?.toLocaleString('es-CL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  }
  
  calculateTotal(): number {
    return this.productos.reduce((total, producto) => 
      total + (producto.precio_total || 0), 0);
  }

  getTotalSurface(): string {
    const total = this.productos.reduce((sum, p) => 
      sum + (p.superficie_total || 0), 0);
    return this.formatNumber(total);
  }

  getTotalAmount(): string {
    const total = this.productos.reduce((sum, p) => 
      sum + (p.precio_total || 0), 0);
    return this.formatNumber(total);
  }
  async downloadPdf() {
    if (!this.pdfContent) {
      console.error('No se encuentra el contenido para generar el PDF');
      return;
    }

    try {
      // Generar nombre del archivo con datos relevantes
      const clienteName = this.cliente?.nombre?.replace(/\s+/g, '_') || 'Cliente';
      const projectCode = this.cubicacion?.codigo || new Date().getTime();
      const fileName = `Oferta_${clienteName}_${projectCode}`;

      // Generar el PDF
      const success = await this.pdfService.generatePdf(
        this.pdfContent.nativeElement, 
        fileName
      );
      
      if (success) {
        console.log('PDF generado y descargado correctamente');
      } else {
        throw new Error('Error al generar el PDF');
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  }

  onClose() {
    this.closeModal.emit();
  }
}
