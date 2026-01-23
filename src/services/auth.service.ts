import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { RelationshipIntent } from "@prisma/client";

export class AuthService {
  /* =========================
     LOGIN (MIGRATION-SAFE, CASE-INSENSITIVE)
  ========================== */
  static async login(data: { email: string; password: string }) {
    if (!data?.email || !data?.password) {
      throw new Error("Invalid credentials");
    }

    const email = data.email.trim().toLowerCase(); // 🔴 normalize email

    // Prisma query now uses lowercase email for consistency
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    /* ==========================================
       MIGRATED USERS — SUPABASE AUTH
    ========================================== */
    if (user.supabaseUserId) {
      const { data: authData, error } =
        await supabaseAdmin.auth.signInWithPassword({
          email, // normalized lowercase
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
       MIGRATE LEGACY PASSWORD AFTER VERIFICATION
    ========================================== */
    let supabaseUserId: string;

    const { data: created } =
      await supabaseAdmin.auth.admin.createUser({
        email, // normalized email
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
  (u) => u.email && u.email.toLowerCase() === email
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
        password: null, // 🔐 remove legacy password
      },
    });

    return AuthService.issueToken({
      id: user.id,
      role: user.role,
    });
  }

  /* =========================
     REGISTER (CASE-INSENSITIVE EMAIL)
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
    relationshipIntent?: RelationshipIntent;
    phone?: string;
  }) {
    if (!data.realName || !data.username || !data.email || !data.password) {
      throw new Error("Missing required fields");
    }

    if (!data.phone) throw new Error("Phone number is required");
    if (!data.relationshipIntent) throw new Error("Relationship intent is required");
    if (data.age === undefined) throw new Error("Age is required");

    const email = data.email.trim().toLowerCase(); // 🔴 normalize email

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: data.username }],
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
        email,
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
        email, // normalized
        gender: data.gender,
        age: data.age,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        relationshipIntent: data.relationshipIntent || null,
        phone: data.phone || null,
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
     FORGOT PASSWORD (CASE-INSENSITIVE)
  ========================== */
  static async forgotPassword(email: string) {
    if (!email) return;
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
    } catch {
      // anti-enumeration
    }
  }

  /* =========================
     JWT ISSUER
  ========================== */
  private static issueToken(payload: { id: string; role: string }) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret missing");
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  }
}
