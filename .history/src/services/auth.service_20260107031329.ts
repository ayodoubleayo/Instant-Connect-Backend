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
  // 1️⃣ Check Prisma for duplicates (business rule)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existing) throw new Error("User already exists");

  // 2️⃣ Create user in Supabase Auth (PASSWORD LIVES HERE)
  const { data: supaUser, error } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // optional but recommended
    });

  if (error || !supaUser.user) {
    throw new Error("Failed to create auth user");
  }

  // 3️⃣ Create Prisma profile (NO PASSWORD)
  const user = await prisma.user.create({
    data: {
      realName: data.realName,
      username: data.username,
      email: data.email,
      gender: data.gender,
      age: data.age,
      location: data.location,
      supabaseUserId: supaUser.user.id,
    },
  });

  return user;
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
