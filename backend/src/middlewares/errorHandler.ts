// 📁 src/middlewares/errorHandlers.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error("❌ Error:", err);

  // Prisma errors
  if (err.code && err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  // Users errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Another errors from server
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
}