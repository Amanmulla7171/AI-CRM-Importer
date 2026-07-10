import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { dbManager } from "./database";

/**
 * SQLite-backed persistent storage for import sessions.
 * Manages the sessions and records relational tables.
 */

export interface ImportSession {
  id: string;
  createdAt: Date;
  rowCount: number;
  processedCount: number;
  importedCount: number;
  failedCount: number;
  skippedCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  records: any[];
  mappings?: Record<string, string | null>;
}

class Storage {
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup old sessions every 1 hour
    this.cleanupInterval = setInterval(() => {
      void this.cleanup();
    }, 60 * 60 * 1000);
  }

  async createSession(rowCount: number): Promise<string> {
    const id = "import_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    const createdAt = new Date().toISOString();
    
    await dbManager.run(
      `INSERT INTO sessions (id, createdAt, rowCount, processedCount, importedCount, failedCount, skippedCount, status, error, mappings)
       VALUES (?, ?, ?, 0, 0, 0, 0, 'pending', NULL, '{}')`,
      [id, createdAt, rowCount]
    );
    
    return id;
  }

  async getSession(id: string): Promise<ImportSession | undefined> {
    try {
      const sessionRow = await dbManager.get("SELECT * FROM sessions WHERE id = ?", [id]);
      if (!sessionRow || !sessionRow.id) return undefined;

      const recordsRows = await dbManager.all("SELECT * FROM records WHERE sessionId = ?", [id]);
      const mappings = sessionRow.mappings ? JSON.parse(sessionRow.mappings) : {};

      return {
        id: sessionRow.id,
        createdAt: new Date(sessionRow.createdAt),
        rowCount: sessionRow.rowCount,
        processedCount: sessionRow.processedCount,
        importedCount: sessionRow.importedCount,
        failedCount: sessionRow.failedCount,
        skippedCount: sessionRow.skippedCount,
        status: sessionRow.status,
        error: sessionRow.error || undefined,
        mappings,
        records: recordsRows.map((r) => ({
          id: r.id,
          name: r.name || undefined,
          email: r.email || undefined,
          phone: r.phone || undefined,
          company: r.company || undefined,
          status: r.status,
          error: r.error || undefined,
        })),
      };
    } catch (error) {
      console.error(`Failed to get session ${id}:`, error);
      return undefined;
    }
  }

  async updateSession(id: string, updates: Partial<ImportSession>): Promise<void> {
    try {
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];

      if (updates.status !== undefined) {
        fieldsToUpdate.push("status = ?");
        params.push(updates.status);
      }
      if (updates.processedCount !== undefined) {
        fieldsToUpdate.push("processedCount = ?");
        params.push(updates.processedCount);
      }
      if (updates.importedCount !== undefined) {
        fieldsToUpdate.push("importedCount = ?");
        params.push(updates.importedCount);
      }
      if (updates.failedCount !== undefined) {
        fieldsToUpdate.push("failedCount = ?");
        params.push(updates.failedCount);
      }
      if (updates.skippedCount !== undefined) {
        fieldsToUpdate.push("skippedCount = ?");
        params.push(updates.skippedCount);
      }
      if (updates.error !== undefined) {
        fieldsToUpdate.push("error = ?");
        params.push(updates.error);
      }
      if (updates.mappings !== undefined) {
        fieldsToUpdate.push("mappings = ?");
        params.push(JSON.stringify(updates.mappings));
      }

      if (fieldsToUpdate.length > 0) {
        params.push(id);
        await dbManager.run(
          `UPDATE sessions SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
          params
        );
      }

      if (updates.records !== undefined) {
        // Refresh records in database to match records array update
        await dbManager.run("DELETE FROM records WHERE sessionId = ?", [id]);
        for (const r of updates.records) {
          const recordId = r.id || "rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
          await dbManager.run(
            `INSERT INTO records (id, sessionId, name, email, phone, company, status, error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              recordId,
              id,
              r.name || null,
              r.email || null,
              r.phone || null,
              r.company || null,
              r.status,
              r.error || null,
            ]
          );
        }
      }
    } catch (error) {
      console.error(`Failed to update session ${id}:`, error);
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await dbManager.run("DELETE FROM sessions WHERE id = ?", [id]);
    } catch (error) {
      console.error(`Failed to delete session ${id}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = new Date();
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
      const cutoffDate = new Date(now.getTime() - maxAgeMs).toISOString();

      // 1. Delete expired sessions from SQLite (records will cascade delete automatically)
      await dbManager.run("DELETE FROM sessions WHERE createdAt < ?", [cutoffDate]);

      // 2. Cleanup abandoned temp CSV files
      const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
      if (existsSync(UPLOADS_DIR)) {
        const uploadFiles = await fs.readdir(UPLOADS_DIR);
        let removedUploadsCount = 0;

        for (const file of uploadFiles) {
          if (!file.endsWith(".csv")) continue;
          const filePath = path.join(UPLOADS_DIR, file);
          try {
            const stats = await fs.stat(filePath);
            const age = now.getTime() - stats.mtime.getTime();
            if (age > maxAgeMs) {
              await fs.unlink(filePath);
              removedUploadsCount++;
            }
          } catch {
            await fs.unlink(filePath).catch(() => {});
            removedUploadsCount++;
          }
        }

        if (removedUploadsCount > 0) {
          console.log(`[Storage] Cleanup: Removed ${removedUploadsCount} expired temporary CSV files.`);
        }
      }
    } catch (error) {
      console.error("[Storage] Cleanup error:", error);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

export const storage = new Storage();
