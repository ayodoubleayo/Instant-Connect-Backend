"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const crypto_1 = __importDefault(require("crypto"));
// 🔗 ROUTES
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const socket_1 = require("./socket");
// src/index.ts
const auth_routes_1 = __importDefault(require("./routes/auth.routes")); // <-- note .js
const app = (0, express_1.default)();
/**
 * 🧭 REQUEST TRACE MIDDLEWARE (GLOBAL)
 * - continues frontend x-request-id
 * - generates one if missing
 * - logs start & end
 */
app.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] ||
        crypto_1.default.randomUUID();
    req.requestId = requestId;
    console.log(`🧭 [REQ START] ${requestId} → ${req.method} ${req.originalUrl}`);
    res.on("finish", () => {
        console.log(`🧭 [REQ END] ${requestId} → ${res.statusCode} ${req.method} ${req.originalUrl}`);
    });
    next();
});
/**
 * 🌍 CORS CONFIG (LOCAL + PRODUCTION)
 */
const allowedOrigins = [
    "http://localhost:3000",
    "https://instant-connect-frontend-hnh01yaf4-ayodoubleayos-projects.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id",
    ],
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
/**
 * 🔗 API ROUTES
 */
app.use("/auth", auth_routes_1.default);
app.use("/users", user_routes_1.default);
app.use("/payments", payment_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/chat", chat_routes_1.default);
app.use("/matches", match_routes_1.default);
app.use("/upload", upload_routes_1.default);
app.use("/uploads", express_1.default.static("uploads")); // local only
app.use("/feedback", feedback_routes_1.default);
// 🎡 SPIN (NOW LIVE)
/**
 * 🚀 SERVER + SOCKET
 */
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
/**
 * 🔌 PORT
 */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});
