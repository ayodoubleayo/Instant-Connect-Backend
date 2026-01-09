"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProfile = exports.discoverUsers = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = require("../lib/prisma");
const user_validator_1 = require("../validators/user.validator");
const discover_service_1 = require("../services/discover.service");
/* =========================
   GET MY PROFILE
   ========================= */
const getProfile = async (req, res) => {
    const requestId = req.requestId;
    console.log("🟢 [UsersController:getProfile] START", { requestId });
    try {
        const me = req.user;
        if (!me) {
            console.log("🔴 [getProfile] Unauthorized", { requestId });
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: me.id },
            select: {
                id: true,
                username: true,
                email: true,
                gender: true,
                age: true,
                location: true,
                latitude: true,
                longitude: true,
                bio: true,
                profilePhoto: true,
                relationshipIntent: true,
                religion: true,
                preferredTribes: true,
                photos: { select: { id: true, url: true } },
                role: true,
                verifiedId: true,
                createdAt: true,
            },
        });
        if (!user) {
            console.log("🔴 [getProfile] Not found", { requestId });
            return res.status(404).json({ message: "User not found" });
        }
        console.log("🟢 [getProfile] SUCCESS", { requestId });
        res.json({ ...user, photoCount: user.photos.length });
    }
    catch (err) {
        console.error("❌ [getProfile] ERROR", { requestId, err });
        res.status(500).json({ message: "Failed to load profile" });
    }
};
exports.getProfile = getProfile;
/* =========================
   UPDATE PROFILE
   ========================= */
const updateProfile = async (req, res) => {
    const requestId = req.requestId;
    console.log("🟢 [UsersController:updateProfile] START", { requestId });
    try {
        const me = req.user;
        if (!me) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const parsed = user_validator_1.UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid profile data",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id: me.id },
            data: parsed.data,
        });
        console.log("🟢 [updateProfile] SUCCESS", { requestId });
        res.json(updated);
    }
    catch (err) {
        console.error("❌ [updateProfile] ERROR", { requestId, err });
        res.status(500).json({ message: "Profile update failed" });
    }
};
exports.updateProfile = updateProfile;
/* =========================
   DISCOVER USERS (INFINITE SCROLL READY)
   ========================= */
const discoverUsers = async (req, res) => {
    const requestId = req.requestId;
    console.log("🟢 [UsersController:discoverUsers] START", { requestId });
    try {
        const tokenUser = req.user;
        const { cursor, limit } = req.query;
        console.log("🔐 [discoverUsers] tokenUser", {
            requestId,
            tokenUser,
        });
        if (!tokenUser) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const me = await prisma_1.prisma.user.findUnique({
            where: { id: tokenUser.id },
            select: {
                id: true,
                gender: true,
                latitude: true,
                longitude: true,
            },
        });
        console.log("👤 [discoverUsers] Me from DB", { requestId, me });
        if (!me) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("➡️ [discoverUsers] Calling DiscoverService", {
            requestId,
            cursor,
            limit,
        });
        const result = await (0, discover_service_1.suggestUsers)({
            me,
            cursor,
            limit: limit ? Number(limit) : undefined,
        });
        console.log("🟢 [discoverUsers] END", {
            requestId,
            returned: result.users.length,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
        });
        res.json(result);
    }
    catch (err) {
        console.error("❌ [discoverUsers] ERROR", { requestId, err });
        res.status(500).json({ message: "Discover failed" });
    }
};
exports.discoverUsers = discoverUsers;
/* =========================
   PUBLIC PROFILE
   ========================= */
const getPublicProfile = async (req, res) => {
    const requestId = req.requestId;
    console.log("🟢 [UsersController:getPublicProfile] START", { requestId });
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                username: true,
                age: true,
                gender: true,
                bio: true,
                profilePhoto: true,
                relationshipIntent: true,
                religion: true,
                preferredTribes: true,
                location: true,
                photos: { select: { id: true, url: true } },
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ ...user, photoCount: user.photos.length });
    }
    catch (err) {
        console.error("❌ [getPublicProfile] ERROR", { requestId, err });
        res.status(500).json({ message: "Failed to load user" });
    }
};
exports.getPublicProfile = getPublicProfile;
