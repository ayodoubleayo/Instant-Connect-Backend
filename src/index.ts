import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import crypto from "crypto";

// 🔗 ROUTES
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import matchRoutes from "./routes/match.routes";
import uploadRoutes from "./routes/upload.routes";
import feedbackRoutes from "./routes/feedback.routes"
import { initSocket } from "./socket";
// src/index.ts
import authRoutes from "./routes/auth.routes";  // <-- note .js

const app = express();

/**
 * 🧭 REQUEST TRACE MIDDLEWARE (GLOBAL)
 * - continues frontend x-request-id
 * - generates one if missing
 * - logs start & end
 */
app.use((req, res, next) => {
  const requestId =
    (req.headers["x-request-id"] as string) ||
    crypto.randomUUID();

  (req as any).requestId = requestId;

  console.log(
    `🧭 [REQ START] ${requestId} → ${req.method} ${req.originalUrl}`
  );

  res.on("finish", () => {
    console.log(
      `🧭 [REQ END] ${requestId} → ${res.statusCode} ${req.method} ${req.originalUrl}`
    );
  });

  next();
});

/**
 * 🌍 CORS CONFIG (LOCAL + PRODUCTION)
 */
/**
 * 🌍 CORS CONFIG (LOCAL + PRODUCTION)
 */
const allowedOrigins = [
  "http://localhost:3000",
  "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
  "https://instant-connect-frontend-git-main-ayodoubleayos-projects.vercel.app",
  "https://instant-connect-frontend.vercel.app",  // <-- newly added
  process.env.FRONTEND_URL,                        // optional env override
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server requests

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  })
);

// Optional: handle all OPTIONS preflight requests explicitly
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"]
}));


app.use(express.json());
app.use(cookieParser());

/**
 * 🔗 API ROUTES
 */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/chat", chatRoutes);
app.use("/matches", matchRoutes);
app.use("/upload", uploadRoutes);
app.use("/uploads", express.static("uploads")); // local only
app.use("/feedback", feedbackRoutes);

// 🎡 SPIN (NOW LIVE)

/**
 * 🚀 SERVER + SOCKET
 */
const server = http.createServer(app);
initSocket(server);

/**
 * 🔌 PORT
 */
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
