import { z } from "zod";
import { Request, Response, NextFunction, RequestHandler } from "express";

// Schema for validating the import payload
export const importSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

// Schema for validating session ID path params
export const idParamSchema = z.object({
  id: z.string().min(1, "Session ID param is required"),
});

/**
 * Middleware wrapper to validate request body using Zod schema
 */
export const validateBody = (schema: z.ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Request body validation failed",
        details: result.error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    next();
  };
};

/**
 * Middleware wrapper to validate request params using Zod schema
 */
export const validateParams = (schema: z.ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Request parameters validation failed",
        details: result.error.issues.map((e: z.ZodIssue) => ({
          param: e.path.join("."),
          message: e.message,
        })),
      });
    }
    next();
  };
};
