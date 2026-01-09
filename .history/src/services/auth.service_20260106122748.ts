import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma";

export class AuthService {

  /* =========================
     LOGIN (UNCHANGED)
  ========================== */
  static async login(data: { email: string; password: string }) {
    console.log("🟡 [AuthService] login START");
    console.log("📨 [AuthService] email:", data?.email);

    if (!data?.email || !data?.password) {
      console.log("🔴 [AuthService] missing email or password");
      throw new Error("Email and password required");
    }

    // 🧪 PRISMA CONNECTION CHECK
    console.log("🧪 [AuthService] Prisma: testing connection (user.count)");

    try {
      const count = await prisma.user.count();
      console.log("🟢 [AuthService] Prisma OK, user count:", count);
    } catch (err: any) {
      console.log("❌ [AuthService] Prisma FAILED");
      throw new Error("Database connection failed");
    }

    // FIND USER
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      console.log("🔴 [AuthService] user NOT found");
      throw new Error("Invalid credentials");
    }

    // PASSWORD CHECK
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) {
      console.log("🔴 [AuthService] password mismatch");
      throw new Error("Invalid credentials");
    }

    // JWT CHECK
    if (!process.env.JWT_SECRET) {
      throw new Error("Server misconfiguration");
    }

    // SIGN TOKEN
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("🟢 [AuthService] login SUCCESS");
    return token;
  }

  /* =========================
     REGISTER (UNCHANGED)
  ========================== */
  static async register(data: {
    realName: string;
    username: string;
    email: string;
    password: string;
    gender: "MALE" | "FEMALE";
    age: number;
    location?: string;
    latitude?: number;
    longitude?: number;
  }) {
    console.log("🟡 [AuthService] register START");

    if (
      !data.realName ||
      !data.username ||
      !data.email ||
      !data.password ||
      !data.gender ||
      !data.age
    ) {
      throw new Error("Missing required fields");
    }

    try {
      await prisma.user.count();
    } catch (err) {
      throw new Error("Database connection failed");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        realName: data.realName,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        gender: data.gender,
        age: data.age,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    console.log("🟢 [AuthService] register SUCCESS");

    const { password, ...safeUser } = user;
    return safeUser;
  }

  /* =========================
     FORGOT PASSWORD
  ========================== */
  static async forgotPassword(email: string) {
    if (!email) return;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Silent exit (anti-enumeration)
    if (!user) return;

    // Generate raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // 1 hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 🔔 TEMP: log instead of email
    console.log("🔐 PASSWORD RESET LINK:");
    console.log(
      `https://your-frontend/reset-password?token=${rawToken}`
    );
  }

  /* =========================
     RESET PASSWORD
  ========================== */
  static async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new Error("Invalid request");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record) {
      throw new Error("Invalid or expired token");
    }

    if (record.expiresAt < new Date()) {
      throw new Error("Token expired");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: record.id },
      }),
    ]);
  }
}
