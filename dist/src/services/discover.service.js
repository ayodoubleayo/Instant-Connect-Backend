"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestUsers = void 0;
const prisma_1 = require("../lib/prisma");
const geo_1 = require("../utils/geo");
const client_1 = require("@prisma/client");
/**
 * Discover Service
 * PURPOSE:
 * - Return ALL opposite-gender users
 * - Exclude self
 * - Provide clear logs for full flow tracing
 */
const suggestUsers = async (params) => {
    const { me, cursor, limit = 20 } = params;
    console.log("🟢 [DiscoverService] START");
    console.log("🧍 [DiscoverService] Me:", me);
    // 🔒 Defensive guard
    if (!me || !me.gender) {
        console.warn("🛑 [DiscoverService] Missing me.gender — EXIT");
        return {
            users: [],
            hasMore: false,
            nextCursor: null,
        };
    }
    // 🔁 Opposite gender rule (CORE BUSINESS RULE)
    const oppositeGender = me.gender === client_1.Gender.MALE ? client_1.Gender.FEMALE : client_1.Gender.MALE;
    console.log("🔁 [DiscoverService] Gender filter:", {
        from: me.gender,
        to: oppositeGender,
    });
    console.log("📡 [DiscoverService] Prisma query START");
    const users = await prisma_1.prisma.user.findMany({
        where: {
            gender: oppositeGender,
            NOT: { id: me.id },
        },
        take: limit + 1,
        ...(cursor && {
            skip: 1,
            cursor: { id: cursor },
        }),
        orderBy: { createdAt: "desc" },
    });
    console.log("📦 [DiscoverService] Prisma returned:", users.length);
    const hasMore = users.length > limit;
    const slicedUsers = hasMore ? users.slice(0, limit) : users;
    const mappedUsers = slicedUsers.map((u) => {
        let distanceKm = null;
        if (me.latitude != null &&
            me.longitude != null &&
            u.latitude != null &&
            u.longitude != null) {
            distanceKm = (0, geo_1.getDistanceKm)(me.latitude, me.longitude, u.latitude, u.longitude);
        }
        return {
            id: u.id,
            username: u.username,
            age: u.age,
            location: u.location,
            distanceKm,
            profilePhoto: u.profilePhoto,
            bio: u.bio,
            religion: u.religion,
            preferredTribes: u.preferredTribes,
        };
    });
    const nextCursor = slicedUsers.length > 0
        ? slicedUsers[slicedUsers.length - 1].id
        : null;
    console.log("🟢 [DiscoverService] END", {
        returned: mappedUsers.length,
        hasMore,
        nextCursor,
    });
    return {
        users: mappedUsers,
        hasMore,
        nextCursor,
    };
};
exports.suggestUsers = suggestUsers;
