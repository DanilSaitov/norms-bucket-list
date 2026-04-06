const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const traditionsToSeed = [
    {
      title: 'Football game',
      description: 'Go to a home UNCC football game and join the Green-Gold game day energy! Wear school colors, learn the fight song, and cheer with other students in the Niners student section.',
      category: 'sports',
      image: '/uploads/traditions/footballLogo.jpg',
      intermittent: false,
      is_active: true,
      tags: ['sports', 'event', 'oncampus'],
    },
    {
      title: 'Join a club',
      description: 'Attend the involvement fair or browse student organizations, then join at least one club that matches your interests. Go to a meeting and introduce yourself to start building your UNCC community early.',
      category: 'social',
      image: '/uploads/traditions/clubFair.jpg',
      intermittent: false,
      is_active: true,
      tags: ['club', 'social', 'engagement'],
    },
  ];

  for (const item of traditionsToSeed) {
    let tradition = await prisma.traditions.findFirst({
      where: { title: item.title },
      select: { tradition_id: true },
    });

    if (!tradition) {
      tradition = await prisma.traditions.create({
        data: {
          title: item.title,
          description: item.description,
          category: item.category,
          image: item.image,
          intermittent: item.intermittent,
          is_active: item.is_active,
        },
        select: { tradition_id: true },
      });
    } else {
      await prisma.traditions.update({
        where: { tradition_id: tradition.tradition_id },
        data: {
          description: item.description,
          category: item.category,
          image: item.image,
          intermittent: item.intermittent,
          is_active: item.is_active,
        },
      });
    }

    if (item.tags.length > 0) {
      await prisma.tag.createMany({
        data: item.tags.map((tag) => ({
          tradition_id: tradition.tradition_id,
          tag,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log('Seeded traditions data');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
