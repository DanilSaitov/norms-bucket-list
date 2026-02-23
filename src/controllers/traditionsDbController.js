// Traditions DB controller

const prisma = require('../config/database');

async function traditionsSearch(req, res) {
  const {search} = req.query;
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

    if (traditions.length == 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ traditions });

  } catch (error) {
    console.error('Get traditions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
    traditionsSearch,
};
