import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: "owner" } });
  if (existing) {
    console.log("Seed already applied, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("changeme123", 12);
  const owner = await prisma.user.create({
    data: {
      username: "owner",
      passwordHash,
      name: "Owner",
      role: Role.OWNER,
      isActive: true,
    },
  });
  console.log(`Created owner user: ${owner.username} (id: ${owner.id})`);
  console.log("IMPORTANT: Change the default password immediately after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
