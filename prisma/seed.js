const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRaw`INSERT INTO traditions 
        ("title", "description", "category", "intermittent", "is_active") VALUES 
        ('Football game', 'ECU vs UNC Charlotte', 'sports', false, true), 
        ('Join a club', 'You should join a club this year!', 'social', false, true) ON CONFLICT DO NOTHING;`;

  console.log("Seeded with raw SQL");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });