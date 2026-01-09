"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOrigin = verifyOrigin;
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL, // e.g. https://yourapp.com
].filter(Boolean);
function verifyOrigin(req) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    if (!origin && !referer)
        return; // same-origin navigation
    const allowed = ALLOWED_ORIGINS.some((url) => origin?.startsWith(url) || referer?.startsWith(url));
    if (!allowed) {
        throw new Error("Invalid request origin");
    }
}
