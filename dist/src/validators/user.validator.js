"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
console.log("🟣 [Validator] user.validator.ts loaded");
exports.UpdateProfileSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3)
        .max(30)
        .trim()
        .optional(),
    age: zod_1.z
        .number()
        .int()
        .min(18)
        .max(100)
        .optional(),
    location: zod_1.z
        .string()
        .min(2)
        .max(100)
        .trim()
        .optional(),
    latitude: zod_1.z
        .number()
        .min(-90)
        .max(90)
        .optional(),
    longitude: zod_1.z
        .number()
        .min(-180)
        .max(180)
        .optional(),
    bio: zod_1.z
        .string()
        .max(300)
        .trim()
        .optional(),
    profilePhoto: zod_1.z
        .string()
        .url()
        .optional(),
    relationshipIntent: zod_1.z
        .nativeEnum(client_1.RelationshipIntent)
        .optional(),
    religion: zod_1.z
        .nativeEnum(client_1.Religion)
        .optional(),
    preferredTribes: zod_1.z
        .array(zod_1.z.string().min(1).max(30).trim())
        .max(5)
        .optional(),
    phone: zod_1.z
        .string()
        .min(10, "Phone number too short")
        .max(15, "Phone number too long")
        .regex(/^[0-9+]+$/, "Invalid phone number")
        .optional(),
});
console.log("🟢 [Validator] UpdateProfileSchema READY");
