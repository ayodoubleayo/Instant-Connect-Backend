import { PrismaClient, Gender } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding users...");

  const users = [
    {
      email: "jane@gmail.com",
      username: "Jane",
      realName: "Jane Williams",
      gender: Gender.FEMALE,
      age: 26,
      location: "Lagos",
      latitude: 6.5244,
      longitude: 3.3792,
    },
    {
      email: "amy@gmail.com",
      username: "Amy",
      realName: "Amy Johnson",
      gender: Gender.FEMALE,
      age: 29,
      location: "Abuja",
      latitude: 9.0765,
      longitude: 7.3986,
    },
    {
      email: "mark@gmail.com",
      username: "Mark",
      realName: "Mark Adams",
      gender: Gender.MALE,
      age: 32,
      location: "Ibadan",
      latitude: 7.3775,
      longitude: 3.947,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        verifiedId: true, 
      },
      create: {
        ...user,
        password: "hashed-password-placeholder",
        verifiedId: true,
      },
    });
  }

  console.log("✅ Seeding complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
