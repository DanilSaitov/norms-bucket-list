const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const staffPassword = await bcrypt.hash('staff123', 10);

  await prisma.user.upsert({
    where: { email: 'staff@charlotte.edu' },
    update: {
      username: 'staff',
      first_name: 'Staff',
      last_name: 'Member',
      password: staffPassword,
      role: 'staff',
      graduation_year: 2027,
    },
    create: {
      username: 'staff',
      first_name: 'Staff',
      last_name: 'Member',
      email: 'staff@charlotte.edu',
      password: staffPassword,
      role: 'staff',
      graduation_year: 2027,
    },
  });

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
    {
      title: "Put a penny in Norm's Pan",
      description: 'The bronze statue, “49er Miner,” designed by Lorenzo Ghiglieri, sits in the Cauble Quad. The statue recalls the region’s history as a gold mining center and symbolizes the pioneering spirit and determination that has led to UNC Charlotte’s dramatic growth. Students often refer to the statue as “Norm” and are encouraged to put a penny in his pan for good luck. At UNC Charlotte, the “49er Miner” symbolizes the importance of hard work and perseverance as students complete their educational journeys. The “49er Miner” was installed near the main campus entrance in 1992 and moved to its current location in 2016. ',
      category: 'social',
      image: '/uploads/traditions/1776911698047-normspan.png',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'social', 'oncampus'],
    },
    {
      title: 'Rub the Gold Nugget',
      description: 'This gold ore outside the student entrance of the Barnhardt Student Activity Center (SAC) came from Reed Gold Mine, located not far from the UNC Charlotte campus, the site of the first documented gold find in the United States. In 1799, a 12-year-old boy named Conrad Reed found a 17-pound shiny rock when he went fishing on a farm 26 miles east of Charlotte. This led to the first gold rush in the United States! The Reed Gold Mine still exists to this day and can be visited throughout the year. This large quartz nugget has a gold vein(s) within it. Students are encouraged to rub the gold nugget to give the Charlotte 49ers luck before athletic events! ',
      category: 'social',
      image: '/uploads/traditions/1776911861291-goldnug.jpg',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'social', 'oncampus'],
    },
    {
      title: 'Participate in the Niner ring ceremony',
      description: 'The official UNC Charlotte ring is available to undergraduate students who complete 60 credit hours at UNC Charlotte, graduate students who achieve candidacy and alumni. Students dip their rings into Norm’s miner pan allowing the water to christen their rings, strengthening their bonds to their alma mater, UNC Charlotte. Upon graduation, it is tradition that students turn the ring so that “all-in-C” faces outward, symbolizing their degree completion as they face their futures as UNC Charlotte alumni. Wearing a class ring symbolizes being a proud member of Niner Nation. ',
      category: 'social',
      image: '/uploads/traditions/1776911898311-ringdip.jpg',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'social', 'oncampus'],
    },
    {
      title: 'Wear green Wednesday',
      description: 'Show your Niner Pride every Wednesday by wearing your green UNC Charlotte gear! You never know what luck you might have wearing green on Wednesdays, you might even score more Niner gear! Forget the rest, because Niners are the best!',
      category: 'social',
      image: 'uploads/traditions/1776911937950-wgw.jpg',
      intermittent: false,
      is_active: true,
      tags: ['engagement', 'social', 'oncampus', 'sports'],
    },
    {
      title: 'Experience the Star Quad Echo',
      description: 'The Star Quad, located between the Barnhardt Student Activity Center and Atkins Library, was designed by engineers to produce a natural echo. Stand in the center and whisper a wish you have, and let it echo in the future!',
      category: 'social',
      image: '/uploads/traditions/1776911967191-starquad.jpg',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'social', 'oncampus'],
    },
    {
      title: 'Visit the Botanical Gardens',
      description: 'The UNC Charlotte Botanical Gardens and the McMillan Greenhouse encompass more than 10 acres in the heart of campus. Bonnie Cone and Herbert Hechenbleikner, Ph.D., professor of biological sciences, established the Van Landingham Glen in 1966, which served as the basis for the botanical gardens. The goal was to create a living classroom and resource for the campus and greater Charlotte community. The gardens have one of the greatest variety of plants in Charlotte. Take a stroll through between classes or take a seat on the various benches and gazebos to relax and connect with nature!',
      category: 'social',
      image: '/uploads/traditions/1776911997041-botanical.webp',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'oncampus'],
    },
    {
      title: 'Run through the CHHS rings',
      description: 'Legend has it that these rings are lucky. Run through them downhill at the start of your UNC Charlotte journey and run through them uphill as your time at the University comes to an end!',
      category: 'social',
      image: '/uploads/traditions/1776912063133-rings.webp',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'oncampus', 'social'],
    },
    {
      title: 'Take a selfie with the Self-made Man Statue',
      description: 'Bobbie Carlyle designed this statue with the vision of a man carving himself out of stone, carving his character and carving his future. This statue is one of the most recognizable statues on campus as a reminder to students to never give up on their own personal growth. Students can take a photo with the Self Made Man to honor the work they are each investing into their future.',
      category: 'social',
      image: '/uploads/traditions/1776912098743-selfmade.jpg',
      intermittent: false,
      is_active: true,
      tags: ['landmark', 'oncampus', 'engagement'],
    },
    {
      title: 'Attend family weekend with your loved ones',
      description: 'UNC Charlotte will welcome the families of Niner Nation to campus for  Family Weekend Sept. 12-14. This helpful guide will provide an overview of parking information, things to do on campus and more. For further details, visit the Family Weekend webpage.',
      category: 'social',
      image: '/uploads/traditions/1776912403804-fam2.jpg',
      intermittent: false,
      is_active: true,
      tags: ['social', 'event', 'oncampus', 'datesensitive'],
    },
    {
      title: 'Attend Homecoming',
      description: 'Niner Nation Week: Homecoming 2025 brought spirit, connection and celebration to every corner of campus and the city. Thousands of alumni, students, families and fans came together to show what makes Charlotte bold, proud and unstoppable. Next year’s celebration will once again unite the Niner community — alumni, students, faculty, staff and friends — for a full week of signature events, unforgettable reunions, and Niner pride on full display. Dates will be announced in late summer.',
      category: 'sports',
      image: '/uploads/traditions/1776912597359-homecoming.webp',
      intermittent: false,
      is_active: true,
      tags: ['sports', 'event', 'oncampus', 'social'],
    },
    {
      title: 'Volunteer at Jamil Niner Student Pantry',
      description: 'The Jamil Niner Student Pantry assists UNC Charlotte students and faculty/staff who are having challenges accessing food regularly. Through volunteering, you will be working with the pantry leadership team to provide healthy, culturally appropriate, and emergency foods to students, faculty, and staff on campus. Volunteer activities may include, but are not limited to: checking shoppers in and out, assisting with pantry upkeep, stocking and sorting food, garden work, and other various activities to help run the pantry. Please wear closed-toed shoes and comfortable clothing when volunteering at the food pantry. Enter through the front door and proceed to the conference room for volunteer check-in.',
      category: 'social',
      image: 'uploads/traditions/1776912726395-pantry.jpg',
      intermittent: false,
      is_active: true,
      tags: ['social', 'engagement', 'oncampus'],
    },
    {
      title: 'Participate in a HRL event!',
      description: 'Keep an eye out for fliers, talk to your RA, or check your residence hall’s Niner Engage page to find an upcoming event for your dorm!',
      category: 'social',
      image: '/uploads/traditions/1776912759020-wallis.webp',
      intermittent: false,
      is_active: true,
      tags: ['social', 'event', 'oncampus'],
    },
    {
      title: 'See a movie at the Union Theater',
      description: 'Take a look at upcoming showtimes and go enjoy a new or old release movie at the Student Union Theater!',
      category: 'social',
      image: '/uploads/traditions/1776912810938-theater.jpg',
      intermittent: false,
      is_active: true,
      tags: ['social', 'event', 'oncampus'],
    },
    {
      title: 'Attend the Annual Robot Rumble',
      description: 'Come see combat robot fighting on UNC Charlotte campus! Expect sparks to be flying from 10:00 AM to 6:00 PM. We will have 72 robots battling in a double elimination tournament. The robots fight in a 8 foot cage of bulletproof glass and metal. Robots fight until one robot can not move anymore, or until a fight goes to judges after 2 minutes. See photos of last year\'s fight at our website! Stop by any time during the day to see exciting robot battles for free! The event is also free for non-students, and a great activity for families of all ages.',
      category: 'social',
      image: 'uploads/traditions/1776912847444-battlebots.jpg',
      intermittent: false,
      is_active: true,
      tags: ['club', 'event', 'oncampus'],
    },
    {
      title: 'Take a ride on the light rail',
      description: 'Use your student year-long CATS pass to explore the city of Charlotte via light rail.',
      category: 'social',
      image: 'uploads/traditions/1776912915163-lightrail.jpg',
      intermittent: false,
      is_active: true,
      tags: ['engagement', 'social', 'offcampus'],
    },
    {
      title: 'Apply to graduate!',
      description: 'You’ve worked hard on your academic journey at UNCC, now it’s time to apply to graduate! Make sure to not miss the deadline!',
      category: 'academic',
      image: 'uploads/traditions/1776912984704-grad.jpg',
      intermittent: false,
      is_active: true,
      tags: ['engagement', 'academic', 'misc'],
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
