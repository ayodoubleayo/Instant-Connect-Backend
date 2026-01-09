import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

/* =========================
   REGISTER
========================= */
export const register = async (req: Request, res: Response) => {
  console.log("🟢 [REGISTER][CONTROLLER] Request received");

  try {
    const user = await AuthService.register(req.body);

    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({
      message: err.message || "Registration failed",
    });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req: Request, res: Response) => {
  console.log("🟢 [LOGIN][CONTROLLER] Request received");

  try {
    const token = await AuthService.login(req.body);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(401).json({
      message: err.message || "Invalid credentials",
    });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ ok: true });
};

/* =========================
   FORGOT PASSWORD (STEP C)
========================= */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Always succeed — security best practice
  await AuthService.forgotPassword(email);

  return res.json({
    message: "If an account exists, a reset link has been sent",
  });
};
