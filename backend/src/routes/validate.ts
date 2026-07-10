import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { mapHeaders } from "../ai";
import multer from "multer";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

export const validateRouter = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// Set up multer upload destination
const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /api/validate
 * Upload CSV and validate it before import.
 * Returns validation stats, a preview list of rows, mappings, and a sessionId.
 */
validateRouter.post("/", upload.single("file"), async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded",
    });
  }

  try {
    const csvContent = fs.readFileSync(file.path, "utf8");

    // Parse CSV content using papaparse
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
    });

    if (parsed.errors && parsed.errors.length > 0) {
      const parseError = parsed.errors[0]?.message || "CSV parse error";
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: `Failed to parse CSV file: ${parseError}`,
      });
    }

    const rawHeaders = parsed.meta.fields || [];
    const headers = rawHeaders.map((h: string) => h.trim().toLowerCase());
    const rawRows = parsed.data as any[];

    if (headers.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: "CSV file has no headers",
      });
    }

    if (rawRows.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: "CSV file has no data rows",
      });
    }

    // Normalize keys of all rows to lowercase
    const rows = rawRows.map((row) => {
      const normalized: any = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim().toLowerCase()] = row[key];
      }
      return normalized;
    });

    // Run AI-powered CRM field mapping
    const mappings = await mapHeaders(headers);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if required columns could be mapped
    if (!mappings.name) {
      errors.push("Missing required columns: name (could not be mapped to any CSV columns)");
    }
    if (!mappings.email) {
      errors.push("Missing required columns: email (could not be mapped to any CSV columns)");
    }

    // Check individual rows for name, email, and email format using the mapped keys
    rows.forEach((row, index) => {
      const nameVal = mappings.name ? row[mappings.name] : null;
      const emailVal = mappings.email ? row[mappings.email] : null;

      if (mappings.name && (nameVal == null || String(nameVal).trim() === "")) {
        errors.push(`Row ${index + 1}: Missing name (under column "${mappings.name}")`);
      }
      if (mappings.email && (emailVal == null || String(emailVal).trim() === "")) {
        errors.push(`Row ${index + 1}: Missing email (under column "${mappings.email}")`);
      }

      // Email format validation
      if (
        emailVal &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emailVal).trim())
      ) {
        warnings.push(`Row ${index + 1}: Invalid email format (under column "${mappings.email}")`);
      }
    });

    // Create session in "pending" status
    const sessionId = await storage.createSession(rows.length);

    // Save mapping settings in database session
    await storage.updateSession(sessionId, { mappings: mappings as unknown as Record<string, string | null> });

    // Save CSV content to uploads/{sessionId}.csv
    const finalPath = path.join(UPLOADS_DIR, `${sessionId}.csv`);
    fs.renameSync(file.path, finalPath);

    // Retrieve preview of first 100 rows
    const previewRows = rows.slice(0, 100);

    return res.json({
      success: true,
      valid: errors.length === 0,
      sessionId,
      totalRows: rows.length,
      headers,
      previewRows,
      mappings,
      errors,
      warnings,
    });
  } catch (error) {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    });
  }
});
