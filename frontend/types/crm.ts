export interface CRMRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "pending" | "imported" | "failed" | "skipped";
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  processingTime?: number;
}
