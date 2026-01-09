"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Auth middleware
 * - Reads JWT from httpOnly cookie
 * - Falls back to Authorization header (Bearer token)
 * - Attaches decoded user to req.user
 */
const authMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log("🟢 TOKEN VALID:", decoded.id, decoded.role);
        // Attach user to request (used by admin middleware)
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        console.log("🔴 TOKEN INVALID OR EXPIRED", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authMiddleware = authMiddleware;
const requestIdMiddleware = (req, _res, next) => {
    const incoming = req.headers["x-request-id"];
    const requestId = incoming ?? crypto_1.default.randomUUID();
    req.requestId = requestId;
    console.log("🧭 [RequestID] ATTACHED", {
        requestId,
        path: req.originalUrl,
        method: req.method,
    });
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
