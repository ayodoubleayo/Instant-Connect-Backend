import { Request } from "express";

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL, 
  "http://localhost:3000",
  "https://instant-connect-frontend.vercel.app",
  "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
  "https://instant-connect-frontend-git-main-ayodoubleayos-projects.vercel.app",
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
