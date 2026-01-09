import { prisma } from "../lib/prisma";
import { Gender } from "@prisma/client";

interface SearchFilters {
  q?: string;
  religion?: string;
  minAge?: number;
  maxAge?: number;
}

interface SuggestUsersParams {
  me: {
    id: string;
    gender: Gender | null;
    latitude: number | null;
    longitude: number | null;
  };
  search?: SearchFilters;
  cursor?: string;
  limit?: number;
}

export async function suggestUsers({
  me,
  search,
  cursor,
  limit = 20,
}: SuggestUsersParams) {
  console.log("🟢 [DiscoverService] START", {
    me,
    search,
    cursor,
    limit,
  });

  const where: any = {
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
    if (search.minAge) where.age.gte = search.minAge;
    if (search.maxAge) where.age.lte = search.maxAge;
  }

  console.log("📦 [DiscoverService] Prisma WHERE", where);

  const users = await prisma.user.findMany({
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
