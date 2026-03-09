export interface PDFExportOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  fontSize?: number;
  headerFontSize?: number;
  margin?: number;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}
