import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import crypto frozm "crypto";

// 🔗 ROUTES
// src/index.ts
import authRoutes from "./routes/auth.routes.js";  // <-- note .js

import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import matchRoutes from "./routes/match.routes";
import uploadRoutes from "./routes/upload.routes";
import feedbackRoutes from "./routes/feedback.routes"
import { initSocket } from "./socket";

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
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

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
