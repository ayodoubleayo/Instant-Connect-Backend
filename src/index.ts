import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import crypto from "crypto";

import matchRoutes from "./routes/match.routes";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import uploadRoutes from "./routes/upload.routes";
import feedbackRoutes from "./routes/feedback.routes";

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

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// 🔗 ROUTES
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/chat", chatRoutes);
app.use("/matches", matchRoutes);
app.use("/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/feedback", feedbackRoutes);

const server = http.createServer(app);
initSocket(server);

server.listen(4000, () => {
  console.log("🚀 Backend running on port 4000");
});
