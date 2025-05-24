import { TDocumentDefinitions, Style } from 'pdfmake/interfaces';

export type PdfDocumentDefinition = TDocumentDefinitions;

export interface PdfStyle extends Style {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  margin?: [number, number, number, number];
}
