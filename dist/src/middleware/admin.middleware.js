"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
