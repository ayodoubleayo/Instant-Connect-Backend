import { z } from "zod";
import { RelationshipIntent, Religion } from "@prisma/client";

console.log("🟣 [Validator] user.validator.ts loaded");

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .trim()
    .optional(),

  age: z
    .number()
    .int()
    .min(18)
    .max(100)
    .optional(),

  location: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .optional(),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional(),

  bio: z
    .string()
    .max(300)
    .trim()
    .optional(),

  profilePhoto: z
    .string()
    .url()
    .optional(),

  relationshipIntent: z
    .nativeEnum(RelationshipIntent)
    .optional(),

  religion: z
    .nativeEnum(Religion)
    .optional(),

  preferredTribes: z
    .array(
      z.string().min(1).max(30).trim()
    )
    .max(5)
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number too short")
    .max(15, "Phone number too long")
    .regex(/^[0-9+]+$/, "Invalid phone number")
    .optional(),
});

console.log("🟢 [Validator] UpdateProfileSchema READY");
