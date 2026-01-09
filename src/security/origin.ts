import { Request } from "express";

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL, // e.g. https://yourapp.com
].filter(Boolean);

export function verifyOrigin(req: Request) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) return; // same-origin navigation

  const allowed = ALLOWED_ORIGINS.some((url) =>
    origin?.startsWith(url!) || referer?.startsWith(url!)
  );

  if (!allowed) {
    throw new Error("Invalid request origin");
  }
}
