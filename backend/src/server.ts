import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { importRouter } from "./routes/import";
import { validateRouter } from "./routes/validate";
import { progressRouter } from "./routes/progress";

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists on startup
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the AI CRM Importer API",
    healthCheck: `http://localhost:${PORT}/health`,
    status: "ok",
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/import", importRouter);
app.use("/api/validate", validateRouter);
app.use("/api/progress", progressRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err instanceof Error ? err.message : "Internal server error",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for frontend`);
  console.log(`✓ Health check: GET http://localhost:${PORT}/health`);
});
