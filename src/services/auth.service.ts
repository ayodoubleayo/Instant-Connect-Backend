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
      throw new Error("Invalid credentials");
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    /* ==========================================
       🔴 OLD PROBLEM:
       Migrated users were getting JWT
       WITHOUT password verification
    ========================================== */

    /* ==========================================
       🟢 UPDATE #1 — AUTHENTICATE MIGRATED USERS
       WHY:
       Supabase is now the auth authority.
       Passwords must be verified there.
    ========================================== */
    if (user.supabaseUserId) {
      const { data: authData, error } =
        await supabaseAdmin.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error || !authData.user) {
        throw new Error("Invalid credentials");
      }

      return AuthService.issueToken({
        id: user.id,
        role: user.role,
      });
    }

    /* ==========================================
       LEGACY USERS (PRE-SUPABASE)
    ========================================== */

    if (!user.password) {
      throw new Error("Invalid credentials");
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    /* ==========================================
       🟢 UPDATE #2 — MIGRATION HAPPENS ONLY AFTER
       LEGACY PASSWORD IS VERIFIED
       WHY:
       Prevents unauthorized migration
    ========================================== */

    let supabaseUserId: string;

    const { data: created } =
      await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: data.password,
        email_confirm: true,
      });

    if (created?.user) {
      supabaseUserId = created.user.id;
    } else {
      const { data: list } =
        await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      const existingUser = list?.users.find(
        (u) => u.email === user.email
      );

      if (!existingUser) {
        throw new Error("Account migration failed");
      }

      supabaseUserId = existingUser.id;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        supabaseUserId,
        password: null, // 🔐 password is permanently removed
      },
    });

    return AuthService.issueToken({
      id: user.id,
      role: user.role,
    });
  }

  /* =========================
     REGISTER (CORRECT)
  ========================== */
  static async register(data: {
    realName: string;
    username: string;
    email: string;
    password: string;
    gender: "MALE" | "FEMALE";
    age?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (
      !data.realName ||
      !data.username ||
      !data.email ||
      !data.password
    ) {
      throw new Error("Missing required fields");
    }

    if (data.age === undefined) {
      throw new Error("Age is required");
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (exists) {
      throw new Error("User already exists");
    }

    /* ==========================================
       Supabase = AUTH AUTHORITY
    ========================================== */
    const { data: auth, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

    if (error || !auth.user) {
      throw new Error("Authentication setup failed");
    }

    /* ==========================================
       Prisma = PROFILE AUTHORITY
    ========================================== */
    const user = await prisma.user.create({
      data: {
        realName: data.realName,
        username: data.username,
        email: data.email,
        gender: data.gender,
        age: data.age,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        supabaseUserId: auth.user.id,
        role: "USER",
      },
    });

    return AuthService.issueToken({
      id: user.id,
      role: user.role,
    });
  }

  /* =========================
     FORGOT PASSWORD
  ========================== */
  static async forgotPassword(email: string) {
    if (!email) return;

    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
    } catch {
      // anti-enumeration
    }
  }

  /* =========================
     APP TOKEN (SESSION ONLY)
  ========================== */
  private static issueToken(payload: { id: string; role: string }) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret missing");
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
  }
}
