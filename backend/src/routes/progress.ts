import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { validateParams, idParamSchema } from "../middleware/validation";

export const progressRouter = Router();

/**
 * GET /api/progress/:id
 * Get import progress for a session
 */
progressRouter.get("/:id", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await storage.getSession(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: "Import session not found",
    });
  }

  const progressPercentage =
    session.rowCount > 0
      ? Math.round((session.processedCount / session.rowCount) * 100)
      : 0;

  return res.json({
    success: true,
    id: session.id,
    status: session.status,
    progress: progressPercentage,
    processed: session.processedCount,
    total: session.rowCount,
    imported: session.importedCount,
    failed: session.failedCount,
    skipped: session.skippedCount,
    aiProcessed: session.aiProcessed,
    aiFailed: session.aiFailed,
    processingTime: session.processingTime,
    batchCount: session.batchCount,
    batchMessage: session.batchMessage,
    error: session.error,
  });
});

/**
 * GET /api/progress/:id/stream
 * Stream import progress using Server-Sent Events (SSE)
 */
progressRouter.get("/:id/stream", validateParams(idParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  res.write(":\n\n");

  const sendUpdate = async (): Promise<boolean> => {
    const session = await storage.getSession(id);
    if (!session) {
      res.write(`data: ${JSON.stringify({ error: "Import session not found" })}\n\n`);
      return false;
    }

    const progressPercentage =
      session.rowCount > 0
        ? Math.round((session.processedCount / session.rowCount) * 100)
        : 0;

    res.write(
      `data: ${JSON.stringify({
        status: session.status,
        progress: progressPercentage,
        processed: session.processedCount,
        total: session.rowCount,
        imported: session.importedCount,
        failed: session.failedCount,
        skipped: session.skippedCount,
        aiProcessed: session.aiProcessed,
        aiFailed: session.aiFailed,
        processingTime: session.processingTime,
        batchCount: session.batchCount,
        batchMessage: session.batchMessage,
        error: session.error,
      })}\n\n`
    );

    if (session.status === "completed" || session.status === "failed") {
      return false;
    }
    return true;
  };

  const active = await sendUpdate();
  if (!active) {
    res.end();
    return;
  }

  const timer = setInterval(async () => {
    try {
      const keepGoing = await sendUpdate();
      if (!keepGoing) {
        clearInterval(timer);
        res.end();
      }
    } catch (e) {
      clearInterval(timer);
      res.end();
    }
  }, 300);

  req.on("close", () => {
    clearInterval(timer);
    res.end();
  });
});
