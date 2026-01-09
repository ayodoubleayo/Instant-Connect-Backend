"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = exports.logout = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const csrf_1 = require("../security/csrf");
const origin_1 = require("../security/origin");
/* =========================
   REGISTER
========================= */
const register = async (req, res) => {
    console.log("🟢 [REGISTER][CONTROLLER] Request received");
    try {
        (0, origin_1.verifyOrigin)(req);
        await auth_service_1.AuthService.register(req.body);
        return res.status(201).json({ ok: true });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
exports.register = register;
/* =========================
   LOGIN
========================= */
const login = async (req, res) => {
    console.log("🟢 [LOGIN][CONTROLLER] Request received");
    try {
        (0, origin_1.verifyOrigin)(req);
        const token = await auth_service_1.AuthService.login(req.body);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        // 🔐 issue CSRF token after login
        (0, csrf_1.setCsrfToken)(res);
        return res.json({ ok: true });
    }
    catch (err) {
        return res.status(401).json({ message: err.message });
    }
};
exports.login = login;
/* =========================
   LOGOUT
========================= */
const logout = async (req, res) => {
    console.log("🟢 [LOGOUT][CONTROLLER] Request received");
    try {
        (0, origin_1.verifyOrigin)(req);
        (0, csrf_1.verifyCsrf)(req);
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        res.clearCookie("csrf_token");
        return res.json({ ok: true });
    }
    catch (err) {
        return res.status(403).json({ message: err.message });
    }
};
exports.logout = logout;
/* =========================
   FORGOT PASSWORD
========================= */
const forgotPassword = async (req, res) => {
    try {
        (0, origin_1.verifyOrigin)(req);
        const { email } = req.body;
        await auth_service_1.AuthService.forgotPassword(email);
        return res.json({
            message: "If an account exists, a reset link has been sent",
        });
    }
    catch {
        // anti-enumeration preserved
        return res.json({
            message: "If an account exists, a reset link has been sent",
        });
    }
};
exports.forgotPassword = forgotPassword;
