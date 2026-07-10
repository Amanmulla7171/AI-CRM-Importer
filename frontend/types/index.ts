export type { CSVRow, CSVData, FileUpload } from "./csv";
export type { CRMRecord, ImportStats } from "./crm";
export type { ImportRequest, ImportResponse, APIError } from "./api";

export type AppState =
  | "IDLE"
  | "FILE_SELECTED"
  | "PREVIEW_READY"
  | "IMPORTING"
  | "COMPLETED"
  | "ERROR";
