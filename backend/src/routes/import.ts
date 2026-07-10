import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { validateBody, validateParams, importSchema, idParamSchema } from "../middleware/validation";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { dbManager } from "../database";

export const importRouter = Router();
const emailPattern = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

/**
 * POST /api/import
 * Submit CSV data for import (starts async job by sessionId)
 */
importRouter.post("/", validateBody(importSchema), async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  try {
    const session = await storage.getSession(sessionId);

    if (session == null) {
      return res.status(404).json({
        success: false,
        error: "Import session not found",
      });
    }

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    const csvPath = path.join(uploadsDir, `${sessionId}.csv`);
    if (!fs.existsSync(csvPath)) {
      return res.status(400).json({
        success: false,
        error: "Source CSV file has expired or was not found on server",
      });
    }

    setImmediate(async () => {
      await processImport(sessionId);
    });

    return res.json({
      success: true,
      sessionId,
      message: "Import started",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    });
  }
});

/**
 * GET /api/import
 * List all import sessions metadata
 */
importRouter.get("/", async (req: Request, res: Response) => {
  try {
    const sessions = await dbManager.all(
      "SELECT id, createdAt, rowCount, processedCount, importedCount, failedCount, skippedCount, status, error, mappings FROM sessions ORDER BY createdAt DESC"
    );
    const parsedSessions = sessions.map((s) => ({
      ...s,
      mappings: s.mappings ? JSON.parse(s.mappings) : {},
    }));
    return res.json({ success: true, sessions: parsedSessions });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to list sessions" });
  }
});

/**
 * GET /api/import/:id
 * Get import results for a completed session
 */
importRouter.get("/:id", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await storage.getSession(id);

  if (session == null) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  if (session.status === "pending" || session.status === "processing") {
    return res.json({
      success: true,
      status: session.status,
      progress: (session.processedCount / session.rowCount) * 100,
    });
  }

  return res.json({
    success: true,
    status: session.status,
    stats: {
      total: session.rowCount,
      imported: session.importedCount,
      failed: session.failedCount,
      skipped: session.skippedCount,
      processingTime: Math.round(
        (new Date().getTime() - session.createdAt.getTime()) / 1000
      ),
    },
    records: session.records,
  });
});

/**
 * DELETE /api/import/:id
 * Delete an import session log
 */
importRouter.delete("/:id", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const session = await storage.getSession(id);
    if (session == null) {
      return res.status(404).json({
        success: false,
        error: "Import session not found",
      });
    }

    await storage.deleteSession(id);
    return res.json({
      success: true,
      message: "Import log deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete session log",
    });
  }
});

/**
 * POST /api/import/:id/sync
 * Sync successfully imported contacts to a mock external CRM
 */
importRouter.post("/:id/sync", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await storage.getSession(id);
  
  if (session == null) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  // Get successfully imported contacts only
  const successRecords = session.records.filter((r) => r.status === "imported");

  if (successRecords.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No successfully imported records found in this session to sync.",
    });
  }

  try {
    // Simulate API request delay to mock CRM endpoint
    await new Promise((resolve) => setTimeout(resolve, 800));

    return res.json({
      success: true,
      syncedCount: successRecords.length,
      message: `Successfully synced ${successRecords.length} contacts to CRM!`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "CRM synchronization failed",
    });
  }
});

/**
 * POST /api/import/:id/cancel
 * Cancel a running import session
 */
importRouter.post("/:id/cancel", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await storage.getSession(id);

  if (session == null) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  if (session.status !== "processing" && session.status !== "pending") {
    return res.status(400).json({
      success: false,
      error: `Cannot cancel an import that is already ${session.status}`,
    });
  }

  // Update session to failed with cancelled message
  await storage.updateSession(id, {
    status: "failed",
    error: "Import cancelled by user",
  });

  return res.json({
    success: true,
    message: "Import cancelled successfully",
  });
});

/**
 * POST /api/import/:id/mappings
 * Update mapping settings for a session
 */
importRouter.post("/:id/mappings", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mappings } = req.body;

  if (!mappings || typeof mappings !== "object") {
    return res.status(400).json({
      success: false,
      error: "Invalid request: mappings object is required",
    });
  }

  const session = await storage.getSession(id);
  if (session == null) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  // Update session mappings
  await storage.updateSession(id, {
    mappings: mappings as Record<string, string | null>,
  });

  return res.json({
    success: true,
    message: "Mappings updated successfully",
  });
});

/**
 * POST /api/import/:id/retry
 * Retry importing the failed records for a completed/failed session
 */
importRouter.post("/:id/retry", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await storage.getSession(id);

  if (session == null) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  if (session.status !== "completed" && session.status !== "failed") {
    return res.status(400).json({
      success: false,
      error: "Only completed or failed imports can be retried",
    });
  }

  const failedRecords = session.records.filter((r) => r.status === "failed");

  if (failedRecords.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No failed records to retry",
    });
  }

  // Reset status and start retry worker in background
  const keptImportedCount = session.importedCount;
  const keptSkippedCount = session.skippedCount;

  await storage.updateSession(id, {
    status: "processing",
    processedCount: keptImportedCount + keptSkippedCount,
    failedCount: 0,
    error: undefined,
  });

  setImmediate(async () => {
    await processRetry(id, failedRecords, keptImportedCount, keptSkippedCount);
  });

  return res.json({
    success: true,
    message: `Retry started for ${failedRecords.length} failed records`,
  });
});

/**
 * Process import in batches from stored CSV file
 */
async function processImport(sessionId: string): Promise<void> {
  const session = await storage.getSession(sessionId);
  if (session == null) return;

  const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
  const csvPath = path.join(uploadsDir, `${sessionId}.csv`);
  if (!fs.existsSync(csvPath)) {
    await storage.updateSession(sessionId, {
      status: "failed",
      error: "CSV source file not found on server",
    });
    return;
  }

  await storage.updateSession(sessionId, { status: "processing" });

  const batchSize = 100;
  let importedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const records: any[] = [];

  try {
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const rawRows = parsed.data as any[];
    
    // Normalize keys of all rows to lowercase
    const rows = rawRows.map((row) => {
      const normalized: any = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim().toLowerCase()] = row[key];
      }
      return normalized;
    });

    const mappings = session.mappings || { name: "name", email: "email", phone: "phone", company: "company" };
    const nameKey = mappings.name || "name";
    const emailKey = mappings.email || "email";
    const phoneKey = mappings.phone;
    const companyKey = mappings.company;

    for (let i = 0; i < rows.length; i++) {
      // Check if import was cancelled before processing next batch item
      if (i % batchSize === 0) {
        const currentSession = await storage.getSession(sessionId);
        if (currentSession?.status === "failed" && currentSession.error === "Import cancelled by user") {
          console.log(`[Import] ${sessionId}: Halting loop. Cancelled by user.`);
          return;
        }
      }

      const row = rows[i];
      let status: "imported" | "failed" | "skipped" = "imported";
      let error: string | undefined;

      const nameVal = row[nameKey];
      const emailVal = row[emailKey];
      const phoneVal = phoneKey ? row[phoneKey] : undefined;
      const companyVal = companyKey ? row[companyKey] : undefined;

      if (nameVal == null || String(nameVal).trim() === "") {
        status = "failed";
        error = "Missing name";
        failedCount++;
      } else if (emailVal == null || String(emailVal).trim() === "") {
        status = "failed";
        error = "Missing email";
        failedCount++;
      } else if (emailPattern.test(String(emailVal).trim()) === false) {
        status = "failed";
        error = "Invalid email format";
        failedCount++;
      } else {
        importedCount++;
      }

      if (i % batchSize === 0) {
        await delay(100);
      }

      records.push({
        id: sessionId + "_" + i,
        name: nameVal ? String(nameVal).trim() : "",
        email: emailVal ? String(emailVal).trim() : "",
        phone: phoneVal ? String(phoneVal).trim() : undefined,
        company: companyVal ? String(companyVal).trim() : undefined,
        status,
        error,
      });

      const processedCount = i + 1;

      if (i % batchSize === 0 || i === rows.length - 1) {
        await storage.updateSession(sessionId, {
          processedCount,
          importedCount,
          failedCount,
          skippedCount,
          records: [...records]
        });
      }
    }

    await storage.updateSession(sessionId, {
      status: "completed",
      importedCount,
      failedCount,
      skippedCount,
      records
    });

    console.log(
      `[Import] ${sessionId}: Completed - ${importedCount} imported, ${failedCount} failed, ${skippedCount} skipped`
    );
  } catch (error) {
    await storage.updateSession(sessionId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    console.error(`[Import] ${sessionId}: Failed -`, error);
  } finally {
    // Delete temporary CSV file upon completion
    if (fs.existsSync(csvPath)) {
      try {
        fs.unlinkSync(csvPath);
      } catch (err) {
        console.error(`[Import] Failed to delete temp file ${csvPath}:`, err);
      }
    }
  }
}

/**
 * Retry importing the filtered failed records in the background
 */
async function processRetry(
  sessionId: string,
  failedRecords: any[],
  alreadyImported: number,
  alreadySkipped: number
): Promise<void> {
  const batchSize = 100;
  let importedCount = alreadyImported;
  let failedCount = 0;
  let skippedCount = alreadySkipped;

  // Load the current session records to merge updates
  const session = await storage.getSession(sessionId);
  if (session == null) return;

  const recordsMap = new Map(session.records.map((r) => [r.id, r]));

  try {
    for (let i = 0; i < failedRecords.length; i++) {
      // Check if import was cancelled before next batch item
      if (i % batchSize === 0) {
        const currentSession = await storage.getSession(sessionId);
        if (currentSession?.status === "failed" && currentSession.error === "Import cancelled by user") {
          console.log(`[Import Retry] ${sessionId}: Halting retry loop. Cancelled by user.`);
          return;
        }
      }

      const record = failedRecords[i];
      let status: "imported" | "failed" | "skipped" = "imported";
      let error: string | undefined;

      // Re-run validation checks on the record fields
      const nameVal = record.name;
      const emailVal = record.email;

      if (nameVal == null || String(nameVal).trim() === "") {
        status = "failed";
        error = "Missing name";
        failedCount++;
      } else if (emailVal == null || String(emailVal).trim() === "") {
        status = "failed";
        error = "Missing email";
        failedCount++;
      } else if (emailPattern.test(String(emailVal).trim()) === false) {
        status = "failed";
        error = "Invalid email format";
        failedCount++;
      } else {
        importedCount++;
      }

      if (i % batchSize === 0) {
        await delay(100);
      }

      // Update in recordsMap
      recordsMap.set(record.id, {
        ...record,
        status,
        error,
      });

      const processedCount = alreadyImported + alreadySkipped + i + 1;

      if (i % batchSize === 0 || i === failedRecords.length - 1) {
        await storage.updateSession(sessionId, {
          processedCount,
          importedCount,
          failedCount,
          skippedCount,
          records: Array.from(recordsMap.values()),
        });
      }
    }

    await storage.updateSession(sessionId, {
      status: "completed",
      importedCount,
      failedCount,
      skippedCount,
      records: Array.from(recordsMap.values()),
    });

    console.log(
      `[Import Retry] ${sessionId}: Completed retry - ${importedCount} total imported, ${failedCount} failed`
    );
  } catch (error) {
    await storage.updateSession(sessionId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Retry failed",
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
