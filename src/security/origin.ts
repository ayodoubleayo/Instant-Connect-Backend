import { Request } from "express";

const normalize = (url: string) =>
  url.replace(/\/$/, "").toLowerCase();

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://instantconnect.jaodr.com",
  "https://instant-connect-frontend.vercel.app",
  "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
  "https://instant-connect-frontend-git-main-ayodoubleayos-projects.vercel.app",
].filter((url): url is string => typeof url === "string")
 .map(normalize);

export function verifyOrigin(req: Request) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) return;

  const normalizedOrigin = origin ? normalize(origin) : undefined;
  const normalizedReferer = referer ? normalize(referer) : undefined;

  const allowed = ALLOWED_ORIGINS.some(
    (url) =>
      normalizedOrigin?.startsWith(url) ||
      normalizedReferer?.startsWith(url)
  );

  if (!allowed) {
    throw new Error("Invalid request origin");
  }
}
