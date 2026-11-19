import { CookieOptions, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";
import { SESSION_COOKIE_NAME } from "../middlewares/authMiddleware";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const TOKEN_EXPIRY = "24h";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Secure cookies only when the browser connection is HTTPS.
 * Do NOT key off NODE_ENV alone — stage runs NODE_ENV=production over plain HTTP
 * (:8080/:8081); browsers drop Secure cookies on http:// and /auth/me 401s forever.
 *
 * Resolution order:
 * 1. COOKIE_SECURE=true|false (explicit ops override)
 * 2. X-Forwarded-Proto / req.secure (needs trust proxy)
 * 3. false (safe default so HTTP stage/prod keep working)
 */
export function shouldUseSecureCookie(req?: Request): boolean {
  const override = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true" || override === "1") return true;
  if (override === "false" || override === "0") return false;

  if (req) {
    const xfProto =
      typeof req.get === "function" ? req.get("x-forwarded-proto") : undefined;
    if (xfProto) {
      return xfProto.split(",")[0].trim().toLowerCase() === "https";
    }
    return Boolean(req.secure);
  }

  return false;
}

export function getSessionCookieOptions(req?: Request): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(req),
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Checking required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Searching user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Checking password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRY,
    });

    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions(req));

    // Returning user data only (JWT lives in HttpOnly cookie)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // req.user setting middleware authMiddleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req: Request, res: Response) => {
  const { maxAge: _maxAge, ...clearOptions } = getSessionCookieOptions(req);
  res.clearCookie(SESSION_COOKIE_NAME, clearOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
