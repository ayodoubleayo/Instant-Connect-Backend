import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

interface JwtPayload {
  id: string;
  role: "USER" | "ADMIN";
}

/**
 * Auth middleware
 * - Reads JWT from httpOnly cookie
 * - Falls back to Authorization header (Bearer token)
 * - Attaches decoded user to req.user
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🟡 authMiddleware HIT");

  // 1️⃣ Try cookie first (web apps)
  let token = req.cookies?.token;

  // 2️⃣ Fallback to Authorization header (Postman / mobile apps)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  console.log("🟡 Token exists:", !!token);

  if (!token) {
    console.log("🔴 NO TOKEN PROVIDED");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    console.log("🟢 TOKEN VALID:", decoded.id, decoded.role);

    // Attach user to request (used by admin middleware)
    (req as any).user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.log("🔴 TOKEN INVALID OR EXPIRED", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requestIdMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const incoming =
    req.headers["x-request-id"] as string | undefined;

  const requestId = incoming ?? crypto.randomUUID();

  (req as any).requestId = requestId;

  console.log("🧭 [RequestID] ATTACHED", {
    requestId,
    path: req.originalUrl,
    method: req.method,
  });

  next();
};
