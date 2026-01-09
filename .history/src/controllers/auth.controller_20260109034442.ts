import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { setCsrfToken, verifyCsrf } from "../security/csrf";
import { verifyOrigin } from "../security/origin";

/* =========================
   REGISTER
========================= */
export const register = async (req: Request, res: Response) => {
  console.log("🟢 [REGISTER][CONTROLLER] Request received");

  try {
    verifyOrigin(req);

    await AuthService.register(req.body);

    return res.status(201).json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req: Request, res: Response) => {
  console.log("🟢 [LOGIN][CONTROLLER] Request received");

  try {
    verifyOrigin(req);

    const token = await AuthService.login(req.body);

    // ✅ UPDATED COOKIE CONFIG (CROSS-SITE SAFE)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none", // ✅ allow frontend on Vercel
      secure: true,     // ✅ required for sameSite=none
    });

    // 🔐 issue CSRF token after login
    setCsrfToken(res);

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (req: Request, res: Response) => {
  console.log("🟢 [LOGOUT][CONTROLLER] Request received");

  try {
    verifyOrigin(req);
    verifyCsrf(req);

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.clearCookie("csrf_token");

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(403).json({ message: err.message });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    verifyOrigin(req);

    const { email } = req.body;
    await AuthService.forgotPassword(email);

    return res.json({
      message: "If an account exists, a reset link has been sent",
    });
  } catch {
    // anti-enumeration preserved
    return res.json({
      message: "If an account exists, a reset link has been sent",
    });
  }
};
