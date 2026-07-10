import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { validateBody, validateParams, importSchema, idParamSchema } from "../middleware/validation";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { dbManager } from "../database";
import { batchService } from "../services/batch/batch.service";
import { aiService } from "../services/ai/ai.service";
import { crmTransformer } from "../transformers/crm.transformer";
import { crmValidator } from "../validators/crm.validator";

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
 * Process import in batches from stored CSV file using the sequential pipeline
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

  let importedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let aiProcessed = 0;
  let aiFailed = 0;
  let totalProcessingTime = 0;
  
  const finalRecordsList: any[] = [];

  try {
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const rawRows = parsed.data as any[];
    
    // Normalize keys of all rows to lowercase for robust header matching
    const rows = rawRows.map((row) => {
      const normalized: any = {};
      for (const key of Object.keys(row)) {
        normalized[key.trim().toLowerCase()] = row[key];
      }
      return normalized;
    });

    const mappings = session.mappings || { name: "name", email: "email", phone: "phone", company: "company" };
    const nameKey = (mappings.name || "name").toLowerCase();
    const emailKey = (mappings.email || "email").toLowerCase();
    const phoneKey = mappings.phone ? mappings.phone.toLowerCase() : null;
    const companyKey = mappings.company ? mappings.company.toLowerCase() : null;

    // Map each raw CSV row to standard CRM input properties
    const preparedInputs = rows.map((row, idx) => ({
      id: `${sessionId}_${idx}`,
      name: row[nameKey] || null,
      email: row[emailKey] || null,
      phone: phoneKey ? row[phoneKey] : null,
      company: companyKey ? row[companyKey] : null,
    }));

    // Task 2: Slice prepared inputs into batches of 20
    const batches = batchService.chunkRecords(preparedInputs, 20);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Check cancellation state
      const currentSession = await storage.getSession(sessionId);
      if (currentSession?.status === "failed" && currentSession.error === "Import cancelled by user") {
        console.log(`[Import] ${sessionId}: Halting loop. Cancelled by user.`);
        return;
      }

      const batchRows = batches[batchIndex];
      const batchStartTime = Date.now();
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      let lastErrorMsg = "";
      let cleanedBatch: any[] = [];

      // Task 7: Batch Retry logic with max 3 attempts
      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          // Task 1: Clean records in AI service
          cleanedBatch = await aiService.cleanRecordsBatch(batchRows);
          success = true;
        } catch (err: any) {
          lastErrorMsg = err.message || "Gemini API Timeout";
          console.warn(`[Import] ${sessionId}: Batch ${batchIndex + 1}/${batches.length} attempt ${attempts} failed: ${lastErrorMsg}`);
          if (attempts < maxAttempts) {
            await delay(500 * attempts); // Exponential delay
          }
        }
      }

      if (!success) {
        // Task 6: Custom error responses
        const errorDetails = {
          success: false,
          message: lastErrorMsg,
          batch: batchIndex + 1,
        };

        aiFailed += batchRows.length;

        await storage.updateSession(sessionId, {
          status: "failed",
          error: JSON.stringify(errorDetails),
          aiFailed,
          batchCount: batches.length,
        });

        console.error(`[Import] ${sessionId}: Halting import. Batch ${batchIndex + 1} failed completely.`);
        return;
      }

      // Tasks 3 & 4: CRM Transformation & Validation
      const transformedBatch = crmTransformer.transformRecords(cleanedBatch);

      for (let j = 0; j < transformedBatch.length; j++) {
        const item = transformedBatch[j];
        const validation = crmValidator.validateRecord(item);

        if (validation.status === "imported") {
          importedCount++;
        } else if (validation.status === "failed") {
          failedCount++;
        } else {
          skippedCount++;
        }

        finalRecordsList.push({
          id: batchRows[j].id,
          name: item.name,
          email: item.email,
          phone: item.phone || undefined,
          company: item.company || undefined,
          status: validation.status,
          error: validation.error,
        });
      }

      aiProcessed += batchRows.length;
      totalProcessingTime += Date.now() - batchStartTime;

      // Update statistics and process count increments on the DB
      await storage.updateSession(sessionId, {
        processedCount: finalRecordsList.length,
        importedCount,
        failedCount,
        skippedCount,
        aiProcessed,
        aiFailed,
        processingTime: totalProcessingTime,
        batchCount: batches.length,
        records: [...finalRecordsList],
      });

      // Brief throttle loop pause
      await delay(100);
    }

    // Complete session
    await storage.updateSession(sessionId, {
      status: "completed",
      importedCount,
      failedCount,
      skippedCount,
      aiProcessed,
      aiFailed,
      processingTime: totalProcessingTime,
      batchCount: batches.length,
      records: finalRecordsList,
    });

    console.log(
      `[Import] ${sessionId}: Completed pipeline - ${importedCount} imported, ${failedCount} failed, ${skippedCount} skipped`
    );
  } catch (error) {
    await storage.updateSession(sessionId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown import pipeline error",
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
 * Retry importing the filtered failed records in the background using the pipeline
 */
async function processRetry(
  sessionId: string,
  failedRecords: any[],
  alreadyImported: number,
  alreadySkipped: number
): Promise<void> {
  // Load current session
  const session = await storage.getSession(sessionId);
  if (session == null) return;

  const recordsMap = new Map(session.records.map((r) => [r.id, r]));
  
  let importedCount = alreadyImported;
  let failedCount = 0;
  let skippedCount = alreadySkipped;
  let aiProcessed = session.aiProcessed;
  let aiFailed = session.aiFailed;
  let totalProcessingTime = session.processingTime;

  // Task 2: Chunk retry records into batches of 20
  const batches = batchService.chunkRecords(failedRecords, 20);

  try {
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // Check cancellation state
      const currentSession = await storage.getSession(sessionId);
      if (currentSession?.status === "failed" && currentSession.error === "Import cancelled by user") {
        console.log(`[Import Retry] ${sessionId}: Halting retry loop. Cancelled by user.`);
        return;
      }

      const batchRows = batches[batchIndex];
      const batchStartTime = Date.now();
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      let lastErrorMsg = "";
      let cleanedBatch: any[] = [];

      // Task 7: Batch Retry logic with max 3 attempts
      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          cleanedBatch = await aiService.cleanRecordsBatch(batchRows);
          success = true;
        } catch (err: any) {
          lastErrorMsg = err.message || "Gemini API Timeout";
          console.warn(`[Import Retry] ${sessionId}: Batch ${batchIndex + 1}/${batches.length} attempt ${attempts} failed: ${lastErrorMsg}`);
          if (attempts < maxAttempts) {
            await delay(500 * attempts);
          }
        }
      }

      if (!success) {
        // Task 6: Custom error responses
        const errorDetails = {
          success: false,
          message: lastErrorMsg,
          batch: batchIndex + 1,
        };

        aiFailed += batchRows.length;

        await storage.updateSession(sessionId, {
          status: "failed",
          error: JSON.stringify(errorDetails),
          aiFailed,
        });

        console.error(`[Import Retry] ${sessionId}: Halting retry. Batch ${batchIndex + 1} failed completely.`);
        return;
      }

      // Tasks 3 & 4: CRM Transformation & Validation
      const transformedBatch = crmTransformer.transformRecords(cleanedBatch);

      for (let j = 0; j < transformedBatch.length; j++) {
        const item = transformedBatch[j];
        const validation = crmValidator.validateRecord(item);

        if (validation.status === "imported") {
          importedCount++;
        } else if (validation.status === "failed") {
          failedCount++;
        } else {
          skippedCount++;
        }

        // Update in recordsMap
        recordsMap.set(batchRows[j].id, {
          id: batchRows[j].id,
          name: item.name,
          email: item.email,
          phone: item.phone || undefined,
          company: item.company || undefined,
          status: validation.status,
          error: validation.error,
        });
      }

      aiProcessed += batchRows.length;
      totalProcessingTime += Date.now() - batchStartTime;

      const processedCount = alreadyImported + alreadySkipped + recordsMap.size - failedRecords.length;

      await storage.updateSession(sessionId, {
        processedCount: alreadyImported + alreadySkipped + recordsMap.size,
        importedCount,
        failedCount,
        skippedCount,
        aiProcessed,
        aiFailed,
        processingTime: totalProcessingTime,
        records: Array.from(recordsMap.values()),
      });

      await delay(100);
    }

    await storage.updateSession(sessionId, {
      status: "completed",
      importedCount,
      failedCount,
      skippedCount,
      aiProcessed,
      aiFailed,
      processingTime: totalProcessingTime,
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
