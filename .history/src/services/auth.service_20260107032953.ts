import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export class AuthService {

  /* =========================
     LOGIN (MIGRATION-SAFE)
  ========================== */
  static async login(data: { email: string; password: string }) {
    if (!data?.email || !data?.password) {
      throw new Error("Email and password required");
    }

    /**
     * 1️⃣ Find user in Prisma
     */
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    /**
     * 2️⃣ NEW USERS → Supabase auth
     */
    if (user.supabaseUserId) {
      const { data: authData, error } =
        await supabaseAdmin.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error || !authData.user) {
        throw new Error("Invalid credentials");
      }

      return AuthService.issueToken(user);
    }

    /**
     * 3️⃣ OLD USERS → bcrypt auth
     */
    if (!user.password) {
      throw new Error("Account requires password reset");
    }

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      throw new Error("Invalid credentials");
    }

    /**
     * 4️⃣ MIGRATE USER TO SUPABASE
     */
    const { data: supaUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: data.password,
        email_confirm: true,
      });

    if (error || !supaUser.user) {
      throw new Error("Migration failed");
    }

    /**
     * 5️⃣ Save Supabase ID + remove password
     */
    await prisma.user.update({
      where: { id: user.id },
      data: {
        supabaseUserId: supaUser.user.id,
        password: null,
      },
    });

    return AuthService.issueToken(user);
  }

  /* =========================
     TOKEN ISSUER
  ========================== */
  private static issueToken(user: any) {
    if (!process.env.JWT_SECRET) {
      throw new Error("Server misconfiguration");
    }

    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }
}
