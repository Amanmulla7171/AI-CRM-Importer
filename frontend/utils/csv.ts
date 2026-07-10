import { CSVData, CSVRow } from "@/types";

export const parseCSV = (content: string): CSVData => {
  const lines = content.trim().split("\n");
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push(row);
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
  };
};

export const validateCSV = (csvData: CSVData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (csvData.headers.length === 0) {
    errors.push("CSV file has no headers");
  }

  if (csvData.rows.length === 0) {
    errors.push("CSV file has no data rows");
  }

  const requiredColumns = ["name", "email"];
  const missingColumns = requiredColumns.filter(
    (col) => !csvData.headers.map((h) => h.toLowerCase()).includes(col)
  );

  if (missingColumns.length > 0) {
    errors.push(
      `Missing required columns: ${missingColumns.join(", ")}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const formatCSVRow = (row: CSVRow): string[] => {
  return Object.values(row).map((v) => String(v || ""));
};
