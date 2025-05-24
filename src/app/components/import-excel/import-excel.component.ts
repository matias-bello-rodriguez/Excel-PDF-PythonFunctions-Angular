// src/app/components/import-excel/import-excel.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelImportService } from '../../services/excel-import.service';

@Component({
  selector: 'app-import-excel',
  templateUrl: './import-excel.component.html',
  styleUrls: ['./import-excel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ImportExcelComponent {
  @Output() datosImportados = new EventEmitter<any[]>();

  excelData: any[][] = [];
  columnasExcel: string[] = [];
  columnasSistema: string[] = ['windowCode', 'takeoffCode', 'location', 'productName', 'productType', 'width', 'height', 'surface', 'quantity', 'installMethod', 'frameType', 'frameLength', 'unitPriceUsd', 'installCostClp', 'finalPriceUsd', 'totalInstallClp', 'pieceTotalUsd', 'design1', 'design2'];
  mapeo: { [key: string]: string } = {};
  previewData: { headers: string[]; data: any[][]; } | null = null;

  constructor(private excelImportService: ExcelImportService) {}

  getColumnLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];
    if (file) {
      try {
        this.previewData = await this.excelImportService.generatePreview(file);
        this.columnasExcel = this.previewData.headers;
        this.excelData = [this.previewData.headers, ...this.previewData.data];
        console.log('Excel data loaded:', {
          headers: this.columnasExcel,
          data: this.previewData.data,
          excelData: this.excelData
        });
      } catch (error) {
        console.error('Error al procesar el archivo Excel:', error);
      }
    }
  }

  onImportar(): void {
    const datosMapeados = this.excelData.slice(1).map((fila) => {
      const producto: any = {};
      for (const campo of this.columnasSistema) {
        const columnaExcel = this.mapeo[campo];
        const indice = this.columnasExcel.indexOf(columnaExcel);
        if (indice !== -1) {
          producto[campo] = fila[indice];
        }
      }
      return producto;
    });

    this.datosImportados.emit(datosMapeados);
  }
}
