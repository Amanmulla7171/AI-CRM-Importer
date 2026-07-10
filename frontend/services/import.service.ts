import { CSVData, FileUpload } from "@/types";
import { parseCSV } from "@/utils/csv";

export const importService = {
  parseFile: async (file: File): Promise<CSVData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const csvData = parseCSV(content);
          resolve(csvData);
        } catch {
          reject(new Error("Failed to parse CSV file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  },

  validateFileType: (file: File): { valid: boolean; error?: string } => {
    const validTypes = ["text/csv", "application/vnd.ms-excel"];
    const validExtensions = [".csv"];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((extension) =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (hasValidType === false && hasValidExtension === false) {
      return {
        valid: false,
        error: `Invalid file format. Expected .csv file, got ${
          file.name.split(".").pop() || "unknown"
        }`,
      };
    }

    return { valid: true };
  },

  validateFileSize: (
    file: File,
    maxSizeMB: number = 10
  ): { valid: boolean; error?: string } => {
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        error: `File size (${fileSizeMB}MB) exceeds ${maxSizeMB}MB limit`,
      };
    }

    return { valid: true };
  },

  getFileInfo: (file: File): FileUpload => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type || "text/csv",
  }),

  validateCSVContent: (
    csvData: CSVData
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (csvData.headers.length === 0) {
      errors.push("CSV file has no headers");
    }

    if (csvData.rows.length === 0) {
      errors.push("CSV file has no data rows");
    }

    const requiredColumns = ["name", "email"];
    const lowerHeaders = csvData.headers.map((header) => header.toLowerCase());
    const missingColumns = requiredColumns.filter(
      (column) => lowerHeaders.includes(column) === false
    );

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    const emptyNameRows = csvData.rows.filter(
      (row) => row["name"] == null || String(row["name"]).trim() === ""
    );
    const emptyEmailRows = csvData.rows.filter(
      (row) => row["email"] == null || String(row["email"]).trim() === ""
    );

    if (emptyNameRows.length > 0) {
      errors.push(`${emptyNameRows.length} rows have empty "name" field`);
    }

    if (emptyEmailRows.length > 0) {
      errors.push(`${emptyEmailRows.length} rows have empty "email" field`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
