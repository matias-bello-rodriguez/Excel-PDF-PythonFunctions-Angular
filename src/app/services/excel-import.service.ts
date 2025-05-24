// src/app/services/excel-import.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {
  private readonly SHEET_NAME = 'detalle';
  private readonly START_ROW = 5; // Índice 5 corresponde a la fila 6 (0-based)

  constructor() {}
  async generatePreview(file: File): Promise<{ headers: string[], data: any[][] }> {
    try {
      const allData = await this.parseFile(file);
      
      // Verificar que tengamos datos válidos
      if (!allData || !Array.isArray(allData) || allData.length === 0) {
        throw new Error('No se pudieron extraer datos válidos del archivo Excel');
      }
      
      // Extraer encabezados (primera fila) y filtrar valores undefined o null
      const headers = (allData[0] || []).map(header => 
        header !== undefined && header !== null ? String(header).trim() : ''
      );
      
      // Verificar que tengamos encabezados válidos
      if (headers.every(h => h === '')) {
        throw new Error('No se encontraron encabezados válidos en el archivo Excel');
      }
      
      // Extraer datos (filas después de la primera)
      const data = allData.slice(1);
      
      console.log('Excel preview generated:', { 
        headers, 
        rowCount: data.length,
        sampleRow: data.length > 0 ? data[0] : 'No data rows'
      });
      
      return { headers, data };
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }
  async importExcel(file: File, columnMapping: { [key: string]: string }): Promise<any[]> {
    try {
      const { headers, data } = await this.generatePreview(file);
      
      // Verificar que el mapeo y los datos son válidos
      if (!columnMapping || Object.keys(columnMapping).length === 0) {
        throw new Error('No se pudo crear un mapeo de columnas válido');
      }
      
      if (!headers || headers.length === 0) {
        throw new Error('No se encontraron encabezados en el archivo Excel');
      }
      
      // Crear un mapa de índices de las columnas del Excel
      const headerIndexMap = new Map();
      headers.forEach((header, index) => {
        if (header) { // Asegurarse de que el header no sea undefined o null
          headerIndexMap.set(header, index);
        }
      });
      
      // Procesar cada fila del Excel
      return data.map((row, rowIndex) => {
        const mappedRow: { [key: string]: any } = {};
        
        // Asegurar que el columnMapping sea un objeto válido antes de iterar
        if (columnMapping && typeof columnMapping === 'object') {
          // Iterar sobre cada campo del sistema y su correspondiente columna en Excel
          Object.entries(columnMapping).forEach(([systemField, excelHeader]) => {
            if (excelHeader) {
              const columnIndex = headerIndexMap.get(excelHeader);
              if (columnIndex !== undefined && row[columnIndex] !== undefined) {
                mappedRow[systemField] = row[columnIndex];
              }
            }
          });
        }
        
        // Si la fila mapeada está vacía, agregar un mensaje de debug
        if (Object.keys(mappedRow).length === 0) {
          console.warn(`Fila ${rowIndex + 1} no pudo ser mapeada correctamente:`, row);
        }
        
        return mappedRow;
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      throw error;
    }
  }
  private parseFile(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          if (!e.target || e.target.result === null || e.target.result === undefined) {
            throw new Error('No se pudo leer el contenido del archivo');
          }
          
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
          
          // Verificar que el libro tenga hojas
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            throw new Error('El archivo Excel no contiene hojas');
          }
          
          // Buscar la hoja "detalle" o usar la primera hoja si no se encuentra
          let sheetName = wb.SheetNames.find(name => 
            name.toLowerCase() === this.SHEET_NAME.toLowerCase()
          );
          
          // Si no se encuentra la hoja 'detalle', usar la primera hoja disponible
          if (!sheetName) {
            console.warn(`No se encontró la hoja "${this.SHEET_NAME}". Se utilizará la primera hoja: "${wb.SheetNames[0]}"`);
            sheetName = wb.SheetNames[0];
          }

          const ws: XLSX.WorkSheet = wb.Sheets[sheetName];
          
          if (!ws) {
            throw new Error(`No se pudo acceder a la hoja "${sheetName}"`);
          }
          
          // Configurar para leer desde la fila especificada
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { 
            header: 1,        // Usar índices numéricos para las columnas
            range: this.START_ROW  // Comenzar desde la fila configurada (índice START_ROW)
          });

          // Verificar que se obtuvieron datos
          if (!data || !Array.isArray(data)) {
            throw new Error('No se pudieron extraer datos de la hoja de Excel');
          }
          
          // Filtrar filas vacías
          const filteredData = data.filter(row => 
            Array.isArray(row) && row.some(cell => 
              cell !== null && cell !== undefined && cell !== ''
            )
          );

          if (filteredData.length === 0) {
            throw new Error('No se encontraron datos válidos en el archivo Excel');
          }

          console.log(`Excel file parsed successfully. Sheet: "${sheetName}", Rows: ${filteredData.length}`);
          resolve(filteredData);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(error);
        }
      };

      reader.onerror = (err) => {
        console.error('Error reading file:', err);
        reject(new Error('Error al leer el archivo: ' + (err.target as any)?.error?.message || 'Error desconocido'));
      };
      
      try {
        reader.readAsBinaryString(file);
      } catch (error) {
        console.error('Error initiating file read:', error);
        reject(new Error('Error al iniciar la lectura del archivo'));
      }
    });
  }
}
