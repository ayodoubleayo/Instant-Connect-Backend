import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export class AuthService {

  /* =========================
     LOGIN (UNCHANGED)
  ========================== */
  static async login(data: { email: string; password: string }) {
    if (!data?.email || !data?.password) {
      throw new Error("Email and password required");
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("Server misconfiguration");
    }

    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  /* =========================
     REGISTER (UNCHANGED)
  ========================== */
  static async register(data: any) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  /* =========================
     FORGOT PASSWORD (SUPABASE)
  ========================== */
  static async forgotPassword(email: string) {
    if (!email) return;

    // Anti-enumeration: always succeed
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
  }
}
