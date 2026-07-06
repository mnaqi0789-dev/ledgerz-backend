import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Maker One",
        email: "maker@ledgerz.com",
        passwordHash,
        role: "maker",
      },
      {
        name: "Manager One",
        email: "manager@ledgerz.com",
        passwordHash,
        role: "manager",
      },
      {
        name: "Admin One",
        email: "admin@ledgerz.com",
        passwordHash,
        role: "admin",
      },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
