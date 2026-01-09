"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPhoto = void 0;
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
const prisma_1 = require("../lib/prisma");
const uploadPhoto = async (req, res) => {
    try {
        const me = req.user;
        const file = req.file;
        if (!me || !file) {
            return res.status(400).json({ message: "Invalid upload" });
        }
        const count = await prisma_1.prisma.photo.count({
            where: { userId: me.id },
        });
        if (count >= 5) {
            return res.status(400).json({ message: "Maximum 5 photos allowed" });
        }
        const upload = await cloudinary_1.default.uploader.upload(file.path, {
            folder: "myfriend/users",
        });
        const photo = await prisma_1.prisma.photo.create({
            data: {
                url: upload.secure_url,
                userId: me.id,
            },
        });
        // ✅ only auto-set if FIRST photo
        if (count === 0) {
            await prisma_1.prisma.user.update({
                where: { id: me.id },
                data: { profilePhoto: photo.url },
            });
        }
        res.json({
            url: photo.url,
            photoCount: count + 1,
        });
    }
    catch {
        res.status(400).json({ message: "Upload failed" });
    }
};
exports.uploadPhoto = uploadPhoto;
