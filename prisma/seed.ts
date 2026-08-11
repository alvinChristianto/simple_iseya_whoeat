import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

const employees = ["Budi", "Siti", "Agus", "Dewi", "Rudi", "Maya"];
const breadTypes = [
  "Roti Tawar",
  "Roti Sobek",
  "Roti Coklat",
  "Roti Gandum",
  "Roti Kacang",
];

async function main() {
  for (const name of employees) {
    await prisma.employee.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const name of breadTypes) {
    await prisma.breadType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(
    `Seeded ${employees.length} employees and ${breadTypes.length} bread types.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
