import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

export const SESSION_COOKIE_NAME = "crm_session";

// Expand the Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return undefined;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token required.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.user = decoded;
    next();
  } catch (_error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware for role-based access control
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not allowed to access this resource`,
      });
    }

    next();
  };
};
