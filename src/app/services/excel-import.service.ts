// src/app/services/excel-import.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { ExcelCellInfo } from '@app/interfaces/entities';

// Interfaces para la respuesta del servidor Python
export interface ExtractedImage {
  filename: string;
  data: string; // base64
  mimeType: string;
  size: number;
  extension: string;
  sheet?: string;
  cellAddress?: string;
  row?: number;
  column?: number;
  columnLetter?: string;
  anchorType?: string;
}

export interface ImageExtractionResponse {
  success: boolean;
  message: string;
  images: ExtractedImage[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelImportService {
  private readonly SHEET_NAME = 'DETALLE'; // Cambiado a mayúsculas
  private readonly START_ROW = 5; // Índice 5 corresponde a la fila 6 (0-based)
  private readonly START_COLUMN = 'A'; // Comenzar desde la columna A
  private readonly PYTHON_API_URL = 'http://localhost:8000'; // URL del servidor Python

  constructor(private http: HttpClient) {}
  
  async generatePreview(file: File): Promise<{ headers: string[], data: any[][] }> {
    try {
      const allData = await this.parseFile(file);
      
      // Verificar que tengamos datos válidos
      if (!allData || !Array.isArray(allData) || allData.length === 0) {
        throw new Error('No se pudieron extraer datos válidos del archivo Excel');
      }
      
      // Extraer encabezados (primera fila) y filtrar valores undefined o null
      const headers = allData[0] || [];
      
      // Verificar que tengamos encabezados válidos
      if (headers.length === 0) {
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

  async generatePreviewWithColors(file: File): Promise<{ 
    headers: string[], 
    data: ExcelCellInfo[][], 
    columnColors: { [key: string]: { backgroundColor: string; fontColor: string } } 
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      // Verificar que el libro tenga hojas
      if (!workbook.worksheets || workbook.worksheets.length === 0) {
        throw new Error('El archivo Excel no contiene hojas');
      }
      
      // Buscar la hoja "DETALLE" (insensible a mayúsculas/minúsculas)
      let targetWorksheet = null;
      
      // Buscar por nombre exacto primero
      targetWorksheet = workbook.getWorksheet(this.SHEET_NAME);
      
      // Si no se encuentra, buscar insensible a mayúsculas/minúsculas
      if (!targetWorksheet) {
        const worksheetNames = workbook.worksheets.map(ws => ws.name);
        console.log('Hojas disponibles:', worksheetNames);
        
        const foundWorksheet = workbook.worksheets.find(ws => 
          ws.name.toUpperCase() === this.SHEET_NAME.toUpperCase()
        );
        
        if (foundWorksheet) {
          targetWorksheet = foundWorksheet;
          console.log(`Encontrada hoja "${foundWorksheet.name}" (buscando "${this.SHEET_NAME}")`);
        }
      }
      
      // Si aún no se encuentra, usar la primera hoja disponible
      if (!targetWorksheet) {
        targetWorksheet = workbook.getWorksheet(1);
        console.warn(`No se encontró la hoja "${this.SHEET_NAME}". Se utilizará la primera hoja: "${targetWorksheet?.name}"`);
      }

      if (!targetWorksheet) {
        throw new Error('No se encontró ninguna hoja de trabajo válida');
      }

      console.log(`Procesando hoja: "${targetWorksheet.name}"`);

      const headers: string[] = [];
      const data: ExcelCellInfo[][] = [];
      const columnColors: { [key: string]: { backgroundColor: string; fontColor: string } } = {};
      
      // Obtener rango de datos - comenzar desde la fila configurada
      const startRow = this.START_ROW + 1; // Empezar desde la fila 6 (1-based)
      const maxPreviewRows = 100; // Límite para preview
      const endRow = Math.min(targetWorksheet.rowCount, startRow + maxPreviewRows);
      
      // Validar que hay datos en el rango especificado
      if (startRow > targetWorksheet.rowCount) {
        throw new Error(`No hay datos a partir de la fila ${startRow}. El archivo tiene ${targetWorksheet.rowCount} filas.`);
      }
      
      // Extraer headers con colores desde la columna configurada
      const headerRow = targetWorksheet.getRow(startRow);
      let hasValidHeaders = false;
      const startColNumber = this.getColumnNumber(this.START_COLUMN);
      
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber >= startColNumber) {
          const cellValue = cell.value;
          let header = '';
          
          // Procesar diferentes tipos de valores de celda
          if (cellValue !== null && cellValue !== undefined) {
            header = this.cleanCellValue(cellValue);
          }
          
          // MODIFICACIÓN: Agregar ALL headers, incluso los vacíos
          // Asignar un nombre por defecto a columnas vacías
          if (!header || header === '') {
            header = `Columna_${colNumber}`; // Crear nombre genérico para columnas vacías
          }
          
          headers.push(header);
          hasValidHeaders = true;
          
          // Extraer color de fondo y fuente del header
          const bgColor = this.extractBackgroundColor(cell);
          const fontColor = this.extractFontColor(cell);
          
          columnColors[header] = {
            backgroundColor: bgColor,
            fontColor: fontColor
          };
          
          // CONTINUAR PROCESANDO TODAS LAS COLUMNAS hasta un límite
          // En lugar de parar en la primera columna vacía, continuar hasta un número máximo de columnas
          if (headers.length >= 50) { // Límite máximo de 50 columnas
            return false;
          }
        }
        return true;
      });
      
      // Verificar que se encontraron encabezados válidos
      if (!hasValidHeaders || headers.length === 0) {
        throw new Error('No se encontraron encabezados válidos en el archivo Excel');
      }
      
      console.log(`Headers extraídos desde fila ${startRow}, columna ${this.START_COLUMN}:`, headers);
      
      // Extraer datos con colores
      let validRowsCount = 0;
      
      for (let rowNumber = startRow + 1; rowNumber <= endRow; rowNumber++) {
        const row = targetWorksheet.getRow(rowNumber);
        const rowData: ExcelCellInfo[] = [];
        let hasValidData = false;
        
        // Iterar por cada header para obtener las celdas correspondientes
        headers.forEach((_, colIndex) => {
          const actualCol = colIndex + startColNumber;
          const cell = row.getCell(actualCol);
          
          // Procesar el valor de la celda usando el método mejorado
          const cellValue = this.cleanCellValue(cell.value);
          
          // MODIFICACIÓN: Verificar datos válidos de manera más permisiva
          if (cellValue && cellValue !== '' && cellValue !== null && cellValue !== undefined) {
            hasValidData = true;
          }
          
          const cellInfo: ExcelCellInfo = {
            value: cellValue || '', // Asegurar que siempre haya un valor (aunque sea vacío)
            backgroundColor: this.extractBackgroundColor(cell),
            fontColor: this.extractFontColor(cell)
          };
          
          rowData.push(cellInfo);
        });
        
        // MODIFICACIÓN: Ser más permisivo con filas que tienen pocos datos
        // Agregar fila si tiene al menos un dato válido O si es una de las primeras 50 filas
        if (hasValidData || validRowsCount < 50) {
          data.push(rowData);
          validRowsCount++;
        }
      }
      
      // Verificar que se encontraron datos válidos
      if (data.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo Excel');
      }
      
      // Contar celdas coloreadas para estadísticas
      const coloredCellsStats = this.countColoredCells(data);
      
      // Logging detallado
      console.log('Excel preview with colors generated:', { 
        sheet: targetWorksheet.name,
        targetSheetName: this.SHEET_NAME,
        headers, 
        rowCount: data.length,
        validRowsProcessed: validRowsCount,
        totalRowsInSheet: targetWorksheet.rowCount,
        startRow: startRow,
        startColumn: this.START_COLUMN,
        sampleRow: data.length > 0 ? data[0].map(cell => cell.value) : 'No data rows',
        coloredCells: coloredCellsStats,
        headerColors: Object.keys(columnColors).length
      });
      
      return { headers, data, columnColors };
    } catch (error) {
      console.error('Error parsing Excel with colors:', error);
      throw error;
    }
  }

  // MÉTODO AUXILIAR MEJORADO para limpiar valores de celda
  private cleanCellValue(cellValue: any): string {
    // Manejar valores nulos o undefined
    if (cellValue === null || cellValue === undefined) {
      return '';
    }
    
    // Si ya es un string, devolverlo limpio
    if (typeof cellValue === 'string') {
      return cellValue.trim();
    }
    
    // Si es un número, formatear según sea necesario
    if (typeof cellValue === 'number') {
      // Verificar si es un número entero o tiene decimales
      if (Number.isInteger(cellValue)) {
        return String(cellValue);
      } else {
        return cellValue.toFixed(2);
      }
    }
    
    // Si es un boolean, convertir a string
    if (typeof cellValue === 'boolean') {
      return String(cellValue);
    }
    
    // Si es una fecha, formatearla
    if (cellValue instanceof Date) {
      return cellValue.toLocaleDateString();
    }
    
    // Manejar objetos específicos de ExcelJS
    if (typeof cellValue === 'object') {
      // PRIORIDAD 1: Si es una fórmula compartida con resultado
      if (cellValue.result !== undefined && cellValue.result !== null) {
        // Procesar recursivamente el resultado
        return this.cleanCellValue(cellValue.result);
      }
      
      // PRIORIDAD 2: Si es una fórmula compartida SIN resultado, devolver vacío
      if (cellValue.sharedFormula !== undefined && cellValue.result === undefined) {
        return '';
      }
      
      // PRIORIDAD 3: Texto con hipervínculo
      if (cellValue.text !== undefined) {
        return String(cellValue.text).trim();
      }
      
      // PRIORIDAD 4: Texto enriquecido (rich text)
      if (cellValue.richText && Array.isArray(cellValue.richText)) {
        return cellValue.richText.map((rt: any) => {
          if (typeof rt === 'string') return rt;
          if (rt.text) return rt.text;
          return '';
        }).join('').trim();
      }
      
      // PRIORIDAD 5: Fórmula regular
      if (cellValue.formula !== undefined) {
        // Si tiene resultado, usar el resultado; si no, devolver vacío
        if (cellValue.result !== undefined) {
          return this.cleanCellValue(cellValue.result);
        }
        return '';
      }
      
      // PRIORIDAD 6: Valor de error
      if (cellValue.error !== undefined) {
        return `#${cellValue.error}`;
      }
      
      // PRIORIDAD 7: Valor compartido (shared string)
      if (cellValue.sharedString !== undefined) {
        return String(cellValue.sharedString).trim();
      }
      
      // PRIORIDAD 8: Si tiene una propiedad 'value', usarla recursivamente
      if (cellValue.value !== undefined) {
        return this.cleanCellValue(cellValue.value);
      }
      
      // NO MOSTRAR OBJETOS COMPLEJOS - devolver vacío
      return '';
    }
    
    // Para cualquier otro tipo, convertir a string y verificar si es numérico
    const stringValue = String(cellValue).trim();
    
    // Intentar convertir a número si parece ser un número
    if (/^-?\d*\.?\d+$/.test(stringValue)) {
      const numValue = parseFloat(stringValue);
      if (!isNaN(numValue)) {
        if (Number.isInteger(numValue)) {
          return String(numValue);
        } else {
          return numValue.toFixed(2);
        }
      }
    }
    
    return stringValue;
  }

  /**
   * Cuenta las celdas coloreadas en los datos
   */
  private countColoredCells(data: ExcelCellInfo[][]): { yellow: number; cyan: number; total: number } {
    let yellow = 0;
    let cyan = 0;
    let total = 0;
    
    if (!data || !Array.isArray(data)) {
      return { yellow: 0, cyan: 0, total: 0 };
    }
    
    data.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(cell => {
          if (cell && cell.backgroundColor && cell.backgroundColor !== 'transparent') {
            const bgColor = cell.backgroundColor.replace('#', '').toUpperCase();
            total++;
            
            // Detectar color amarillo #FFFF00
            if (bgColor === 'FFFF00') {
              yellow++;
            }
            // Detectar color cian #66FFFF
            else if (bgColor === '66FFFF') {
              cyan++;
            }
          }
        });
      }
    });
    
    return { yellow, cyan, total };
  }

  /**
   * Verifica si una celda tiene un color específico
   */
  private isCellColorMatch(cell: ExcelCellInfo, targetColor: string): boolean {
    if (!cell || !cell.backgroundColor || cell.backgroundColor === 'transparent') {
      return false;
    }
    
    const cellColor = cell.backgroundColor.replace('#', '').toUpperCase();
    const target = targetColor.replace('#', '').toUpperCase();
    
    return cellColor === target;
  }

  /**
   * Obtiene estadísticas detalladas de colores en el archivo
   */
  private getColorStatistics(data: ExcelCellInfo[][]): {
    totalCells: number;
    coloredCells: number;
    colors: { [color: string]: number };
    yellow: number;
    cyan: number;
  } {
    let totalCells = 0;
    let coloredCells = 0;
    const colors: { [color: string]: number } = {};
    let yellow = 0;
    let cyan = 0;
    
    data.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        
        if (cell && cell.backgroundColor && cell.backgroundColor !== 'transparent') {
          coloredCells++;
          const bgColor = cell.backgroundColor.toUpperCase();
          
          // Contar por color específico
          colors[bgColor] = (colors[bgColor] || 0) + 1;
          
          // Contar colores específicos que nos interesan
          const cleanColor = bgColor.replace('#', '');
          if (cleanColor === 'FFFF00') {
            yellow++;
          } else if (cleanColor === '66FFFF') {
            cyan++;
          }
        }
      });
    });
    
    return {
      totalCells,
      coloredCells,
      colors,
      yellow,
      cyan
    };
  }
  
  private extractBackgroundColor(cell: ExcelJS.Cell): string {
    try {
      const fill = cell.fill;
      if (fill && fill.type === 'pattern') {
        const patternFill = fill as ExcelJS.FillPattern;
        if (patternFill.fgColor) {
          if (typeof patternFill.fgColor === 'object' && 'argb' in patternFill.fgColor && patternFill.fgColor.argb) {
            return `#${patternFill.fgColor.argb.slice(2)}`; // Remover alpha
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting background color:', error);
    }
    return 'transparent';
  }
  
  private extractFontColor(cell: ExcelJS.Cell): string {
    try {
      const font = cell.font;
      if (font && font.color) {
        if (typeof font.color === 'object' && 'argb' in font.color && font.color.argb) {
          return `#${font.color.argb.slice(2)}`; // Remover alpha
        }
      }
    } catch (error) {
      console.warn('Error extracting font color:', error);
    }
    return '#000000';
  }
  
  private getColumnNumber(columnLetter: string): number {
    let result = 0;
    for (let i = 0; i < columnLetter.length; i++) {
      result = result * 26 + (columnLetter.charCodeAt(i) - 64);
    }
    return result;
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
          
          // Buscar la hoja "DETALLE" (insensible a mayúsculas/minúsculas)
          let sheetName = wb.SheetNames.find(name => 
            name.toUpperCase() === this.SHEET_NAME.toUpperCase()
          );
          
          // Si no se encuentra la hoja 'DETALLE', usar la primera hoja disponible
          if (!sheetName) {
            console.warn(`No se encontró la hoja "${this.SHEET_NAME}". Hojas disponibles: ${wb.SheetNames.join(', ')}. Se utilizará la primera hoja: "${wb.SheetNames[0]}"`);
            sheetName = wb.SheetNames[0];
          } else {
            console.log(`Encontrada hoja "${sheetName}" (buscando "${this.SHEET_NAME}")`);
          }

          const ws: XLSX.WorkSheet = wb.Sheets[sheetName];
          
          if (!ws) {
            throw new Error(`No se pudo acceder a la hoja "${sheetName}"`);
          }
          
          // Configurar el rango para comenzar desde A6 (columna A, fila 6)
          const range = `${this.START_COLUMN}${this.START_ROW + 1}:AD1000`; // A6:AD1000
          
          // Leer datos desde el rango especificado
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { 
            header: 1,        // Usar índices numéricos para las columnas
            range: range      // Comenzar desde A6
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

          console.log(`Excel file parsed successfully. Sheet: "${sheetName}", Rows: ${filteredData.length}, Range: ${range}`);
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
  /**
   * Extrae imágenes de un archivo Excel usando el servidor Python
   */
  extractImagesFromExcel(file: File): Observable<ImageExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    return this.http.post<ImageExtractionResponse>(
      `${this.PYTHON_API_URL}/extract-images`,
      formData
    );
  }

  /**
   * Verifica si el servidor Python está disponible
   */
  checkPythonServerHealth(): Observable<any> {
    return this.http.get(`${this.PYTHON_API_URL}/health`);
  }

  /**
   * Convierte datos base64 a Blob para descargar o mostrar imágenes
   */
  base64ToBlob(base64Data: string, mimeType: string): Blob {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Crea una URL objeto para mostrar una imagen
   */
  createImageUrl(base64Data: string, mimeType: string): string {
    const blob = this.base64ToBlob(base64Data, mimeType);
    return URL.createObjectURL(blob);
  }

  /**
   * Descarga una imagen extraída
   */
  downloadImage(image: ExtractedImage): void {
    const blob = this.base64ToBlob(image.data, image.mimeType);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL objeto
    URL.revokeObjectURL(url);
  }
}
