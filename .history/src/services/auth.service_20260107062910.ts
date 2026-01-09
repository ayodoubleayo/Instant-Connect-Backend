import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export class AuthService {

  /* =========================
     LOGIN (MIGRATION-SAFE)
  ========================== */
/* =========================
   LOGIN (MIGRATION-SAFE)
========================= */
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

  /**
   * CASE 1: Already migrated → Supabase owns password
   */
  if (user.supabaseUserId) {
    return AuthService.issueToken({
      id: user.id,
      role: user.role,
    });
  }

  /**
   * CASE 2: Legacy bcrypt user
   */
  if (!user.password) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  /**
   * MIGRATION (SAFE):
   * - If Supabase user already exists → link
   * - Else → create
   */
  let supabaseUserId: string;

  const { data: existing } =
    await supabaseAdmin.auth.admin.getUserByEmail(user.email);

  if (existing?.user) {
    // ✅ Already exists (e.g. password reset happened)
    supabaseUserId = existing.user.id;
  } else {
    // ✅ Create fresh Supabase auth user
    const { data: created, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: data.password,
        email_confirm: true,
      });

    if (error || !created.user) {
      throw new Error("Account migration failed");
    }

    supabaseUserId = created.user.id;
  }

  /**
   * Update local profile (finalize migration)
   */
  await prisma.user.update({
    where: { id: user.id },
    data: {
      supabaseUserId,
      password: null,
    },
  });

  return AuthService.issueToken({
    id: user.id,
    role: user.role,
  });
}

  /* =========================
     REGISTER
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
    if (!data.email || !data.password || !data.username || !data.realName) {
      throw new Error("Missing required fields");
    }

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (exists) {
      throw new Error("User already exists");
    }

    /**
     * Supabase = auth authority
     */
    const { data: auth, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

    if (error || !auth.user) {
      throw new Error("Authentication setup failed");
    }

    /**
     * Prisma = profile authority
     */
    return prisma.user.create({
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
      },
    });
  }

  /* =========================
     FORGOT PASSWORD
  ========================== */
  static async forgotPassword(email: string) {
    if (!email) return;

    // Supabase handles everything
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
    } catch {
      // anti-enumeration by design
    }
  }

  /* =========================
     APP TOKEN (NOT AUTH)
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
