"use client";

import { useState } from "react";
import { FileUpload, CSVData } from "@/types";
import { importService } from "@/services/import.service";
import { api } from "@/services/api";

interface ValidationState {
  isValid: boolean;
  errors: string[];
}

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string | null> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    errors: [],
  });

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setValidation({ isValid: false, errors: [] });
    setSessionId(null);
    setCSVData(null);
    setMappings(null);

    try {
      // Validate file type
      const typeValidation = importService.validateFileType(file);
      if (!typeValidation.valid) {
        throw new Error(typeValidation.error || "Invalid file type");
      }

      // Validate file size
      const sizeValidation = importService.validateFileSize(file);
      if (!sizeValidation.valid) {
        throw new Error(sizeValidation.error || "File size exceeds limit");
      }

      const fileInfo = importService.getFileInfo(file);
      setSelectedFile(fileInfo);

      // Validate on backend (uploads file and gets validation + preview rows)
      const result = await api.validateCSV(file);

      const parsed: CSVData = {
        headers: result.headers,
        rows: result.previewRows,
        rowCount: result.totalRows,
      };

      setCSVData(parsed);
      setSessionId(result.sessionId);
      setMappings(result.mappings);
      setValidation({
        isValid: result.valid,
        errors: result.errors,
      });

      // If there are errors, still set the file but mark as invalid
      if (!result.valid) {
        setError(result.errors[0] || "CSV validation failed");
      }
    } catch (err: any) {
      const message = err.message || "File upload failed";
      setError(message);
      setSelectedFile(null);
      setCSVData(null);
      setSessionId(null);
      setMappings(null);
      setValidation({ isValid: false, errors: [message] });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFile = () => {
    setSelectedFile(null);
    setCSVData(null);
    setSessionId(null);
    setMappings(null);
    setError(null);
    setValidation({ isValid: false, errors: [] });
  };

  return {
    selectedFile,
    csvData,
    sessionId,
    mappings,
    setMappings,
    error,
    isLoading,
    validation,
    handleFileSelect,
    resetFile,
  };
};
