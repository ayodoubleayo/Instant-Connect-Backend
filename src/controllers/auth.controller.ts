import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { setCsrfToken, verifyCsrf } from "../security/csrf";
import { verifyOrigin } from "../security/origin";

/* =========================
   REGISTER (CORRECTED)
========================= */
export const register = async (req: Request, res: Response) => {
  console.log("🟢 [REGISTER][CONTROLLER] Request received");

  try {
    verifyOrigin(req);

    // ✅ RECEIVE TOKEN
    const token = await AuthService.register(req.body);

    // ✅ SET COOKIE (SAME AS LOGIN)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    // ✅ ISSUE CSRF
    setCsrfToken(res);

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

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    setCsrfToken(res);

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(401).json({ message: err.message });
  }
};

/* =========================
   LOGOUT
========================= *//* =========================
   LOGOUT (FIXED)
========================= */
export const logout = async (req: Request, res: Response) => {
  console.log("🟢 [LOGOUT][CONTROLLER] Request received");

  try {
    verifyOrigin(req);
    verifyCsrf(req);

    // ✅ MATCH cookie options with login/register
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.clearCookie("csrf_token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

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
    return res.json({
      message: "If an account exists, a reset link has been sent",
    });
  }
};

