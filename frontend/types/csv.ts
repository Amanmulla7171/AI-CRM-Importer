export interface CSVRow {
  [key: string]: string | number | undefined;
}

export interface CSVData {
  headers: string[];
  rows: CSVRow[];
  rowCount: number;
}

export interface FileUpload {
  file: File;
  name: string;
  size: number;
  type: string;
}
