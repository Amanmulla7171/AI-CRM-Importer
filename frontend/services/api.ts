import axios, { AxiosInstance } from "axios";
import { APIError, CSVData, ImportResponse } from "@/types";

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  /**
   * Submit CSV data for import
   * Returns a session ID to track progress
   */
  importCSV: async (sessionId: string): Promise<{ sessionId: string }> => {
    try {
      const response = await apiClient.post("/api/import", {
        sessionId,
      });
      return {
        sessionId: response.data.sessionId,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
          details: error.response?.data,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Import failed",
      } as APIError;
    }
  },

  /**
   * Validate CSV data by uploading raw file
   */
  validateCSV: async (
    file: File
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    sessionId: string;
    totalRows: number;
    headers: string[];
    previewRows: any[];
    mappings: Record<string, string | null>;
  }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/api/validate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Validation failed",
      } as APIError;
    }
  },

  /**
   * Get import progress for a session
   */
  getImportProgress: async (
    sessionId: string
  ): Promise<{
    progress: number;
    status: string;
    processed: number;
    total: number;
  }> => {
    try {
      const response = await apiClient.get(`/api/progress/${sessionId}`);
      return {
        progress: response.data.progress,
        status: response.data.status,
        processed: response.data.processed,
        total: response.data.total,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to fetch progress",
      } as APIError;
    }
  },

  /**
   * Get import results (final response)
   */
  getImportResults: async (sessionId: string): Promise<ImportResponse> => {
    try {
      const response = await apiClient.get(`/api/import/${sessionId}`);

      if (
        response.data.status === "processing" ||
        response.data.status === "pending"
      ) {
        throw new Error("Import still processing");
      }

      return {
        success: response.data.status === "completed",
        records: response.data.records || [],
        stats: response.data.stats || {
          total: 0,
          imported: 0,
          failed: 0,
          skipped: 0,
          processingTime: 0,
        },
        errors: [],
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to fetch results",
      } as APIError;
    }
  },

  /**
   * Cancel a running import session
   */
  cancelImport: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/import/${sessionId}/cancel`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to cancel import",
      } as APIError;
    }
  },

  /**
   * Retry importing failed records for a session
   */
  retryImport: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.post(`/api/import/${sessionId}/retry`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to retry import",
      } as APIError;
    }
  },

  /**
   * Get all past import sessions (metadata only)
   */
  getImports: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get("/api/import");
      return response.data.sessions || [];
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to fetch import history",
      } as APIError;
    }
  },

  /**
   * Update column mappings for a session
   */
  updateMappings: async (
    sessionId: string,
    mappings: Record<string, string | null>
  ): Promise<void> => {
    try {
      await apiClient.post(`/api/import/${sessionId}/mappings`, { mappings });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to update mappings",
      } as APIError;
    }
  },
  /**
   * Delete a past import session
   */
  deleteImport: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/import/${sessionId}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to delete import session",
      } as APIError;
    }
  },
  /**
   * Sync successfully imported contacts to external CRM
   */
  syncToCRM: async (sessionId: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/api/import/${sessionId}/sync`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw {
          status: error.response?.status || 500,
          message: error.response?.data?.error || error.message,
        } as APIError;
      }
      throw {
        status: 500,
        message: "Failed to synchronize contacts with CRM",
      } as APIError;
    }
  },
};
