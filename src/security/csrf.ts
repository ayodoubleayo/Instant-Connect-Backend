import crypto from "crypto";
import { Request, Response } from "express";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/* =========================
   Generate CSRF Token
========================= */
export function setCsrfToken(res: Response) {
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable by frontend
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return token;
}

/* =========================
   Verify CSRF Token
========================= */
export function verifyCsrf(req: Request) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new Error("Invalid CSRF token");
  }
}
