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
     *    (routing layer during migration)
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
     * 5️⃣ Save Supabase ID + remove legacy password
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
     REGISTER (BEST PRACTICE)
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
    /**
     * 1️⃣ Basic validation
     */
    if (!data.email || !data.password || !data.username || !data.realName) {
      throw new Error("Missing required fields");
    }

    /**
     * 2️⃣ Check Prisma duplicates
     *    (business rules only)
     */
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      throw new Error("User already exists");
    }

    /**
     * 3️⃣ Create Supabase auth user
     *    (PASSWORD SOURCE OF TRUTH)
     */
    const { data: supaRes, error: supaError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });

    if (supaError || !supaRes.user) {
      throw new Error("Failed to create authentication account");
    }

    /**
     * 4️⃣ Create Prisma profile
     *    (NO PASSWORD STORED)
     */
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
        supabaseUserId: supaRes.user.id,
      },
    });

    return user;
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
      { expiresIn: "15m" }
    );
  }
}
