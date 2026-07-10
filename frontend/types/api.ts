import { CSVData } from "./csv";
import { CRMRecord, ImportStats } from "./crm";

export interface ImportRequest {
  csvData: CSVData;
  batchSize?: number;
}

export interface ImportResponse {
  success: boolean;
  records: CRMRecord[];
  stats: ImportStats;
  errors?: string[];
}

export interface APIError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}
