"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestUsers = suggestUsers;
const prisma_1 = require("../lib/prisma");
async function suggestUsers({ me, search, cursor, limit = 20, }) {
    console.log("🟢 [DiscoverService] START", {
        me,
        search,
        cursor,
        limit,
    });
    const where = {
        id: { not: me.id },
    };
    // 🔍 TEXT SEARCH
    if (search?.q) {
        where.OR = [
            { username: { contains: search.q, mode: "insensitive" } },
            { bio: { contains: search.q, mode: "insensitive" } },
        ];
    }
    // 🛐 RELIGION FILTER
    if (search?.religion) {
        where.religion = search.religion;
    }
    // 🎂 AGE FILTER
    if (search?.minAge || search?.maxAge) {
        where.age = {};
        if (search.minAge)
            where.age.gte = search.minAge;
        if (search.maxAge)
            where.age.lte = search.maxAge;
    }
    console.log("📦 [DiscoverService] Prisma WHERE", where);
    const users = await prisma_1.prisma.user.findMany({
        where,
        take: limit,
        ...(cursor && {
            skip: 1,
            cursor: { id: cursor },
        }),
        select: {
            id: true,
            username: true,
            age: true,
            gender: true,
            bio: true,
            profilePhoto: true,
            religion: true,
            photos: { select: { id: true, url: true } },
        },
    });
    console.log("🟢 [DiscoverService] END", {
        returned: users.length,
    });
    return users;
}
