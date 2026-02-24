// Traditions DB controller

const prisma = require('../config/database');

async function traditionsSearch(req, res) {
  const {search} = req.query;

  if (!search) {
    return res.status(400).json({error: "Query required"});
  }

  try {
      console.log(search);
    const traditions = await prisma.traditions.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
    });

    res.json(traditions);

  } catch (error) {
    console.error('Get traditions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
    traditionsSearch,
};
