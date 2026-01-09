import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

/* =========================
   REGISTER
========================= */
export const register = async (req: Request, res: Response) => {
  console.log("🟢 [REGISTER][CONTROLLER] Request received");
  console.log("🟢 [REGISTER][CONTROLLER] Payload email:", req.body?.email);

  try {
    console.log("🟡 [REGISTER][CONTROLLER] Calling AuthService.register");
    const user = await AuthService.register(req.body);

    console.log("✅ [REGISTER][CONTROLLER] User created successfully");
    res.status(201).json(user);
  } catch (err: any) {
    console.log("🔴 [REGISTER][CONTROLLER] Error caught");
    console.log("🔴 [REGISTER][CONTROLLER] Error message:", err.message);

    res.status(400).json({ message: err.message });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req: Request, res: Response) => {
  console.log("🟢 [LOGIN][CONTROLLER] Request received");
  console.log("🟢 [LOGIN][CONTROLLER] Payload email:", req.body?.email);

  try {
    console.log("🟡 [LOGIN][CONTROLLER] Calling AuthService.login");
    const token = await AuthService.login(req.body);

    console.log("✅ [LOGIN][CONTROLLER] Token generated, setting cookie");
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.log("🔴 [LOGIN][CONTROLLER] Error caught");
    console.log("🔴 [LOGIN][CONTROLLER] Error message:", err.message);

    res.status(401).json({ message: err.message });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (_req: Request, res: Response) => {
  console.log("🟢 [LOGOUT][CONTROLLER] Request received");

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  console.log("✅ [LOGOUT][CONTROLLER] Token cleared");
  res.json({ ok: true });
};

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.forgotPassword(req.body.email);

    res.json({
      message: "If the email exists, a reset link has been sent",
    });
  } catch {
    res.json({
      message: "If the email exists, a reset link has been sent",
    });
  }
};


