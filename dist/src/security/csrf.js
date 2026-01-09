"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCsrfToken = setCsrfToken;
exports.verifyCsrf = verifyCsrf;
const crypto_1 = __importDefault(require("crypto"));
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
/* =========================
   Generate CSRF Token
========================= */
function setCsrfToken(res) {
    const token = crypto_1.default.randomBytes(32).toString("hex");
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
function verifyCsrf(req) {
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        throw new Error("Invalid CSRF token");
    }
}
