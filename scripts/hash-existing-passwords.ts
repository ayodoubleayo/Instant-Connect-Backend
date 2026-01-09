import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  console.log("🔐 Starting password migration...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      password: true,
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    
    if (user.password.startsWith("$2")) {
      skipped++;
      continue;
    }

    
    const hashed = await bcrypt.hash(user.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    updated++;
  }

  console.log("✅ Migration complete");
  console.log("🔁 Updated:", updated);
  console.log("⏭ Skipped (already hashed):", skipped);
}

hashExistingPasswords()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
